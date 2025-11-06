// controllers/paymentController.js
const db = require('../config/db');
const axios = require('axios');
const crypto = require('crypto');

/**
 * Tạo thanh toán MoMo
 * Body: { gia_id } (API sẽ tự lấy khach_id từ token)
 */
const createPayment = async (req, res) => {
    // Chỉ lấy gia_id từ body.
    const { gia_id } = req.body; 
    // Lấy user_id của khách hàng đang đăng nhập từ token
    const tai_khoan_id = req.user.user_id; 

    if (!gia_id) {
        return res.status(400).json({ message: 'Vui lòng cung cấp gia_id.' });
    }

    try {
        // --- TÌM khach_id TỪ tai_khoan_id ---
        const customerProfile = await db.query(
            'SELECT khach_id FROM khach_hang WHERE tai_khoan_id = $1',
            [tai_khoan_id]
        );
        if (customerProfile.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy hồ sơ khách hàng cho tài khoản này.' });
        }
        const khach_id = customerProfile.rows[0].khach_id; // Đây là khach_id thật

        // 1) Lấy giá từ DB
        const priceResult = await db.query('SELECT gia FROM gia_goi_tap WHERE gia_id = $1', [gia_id]);
        if (priceResult.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy mức giá này.' });
        }
        const amount = Math.round(Number(priceResult.rows[0].gia));

        // 2) Chuẩn bị thông tin Momo
        const partnerCode = process.env.MOMO_PARTNER_CODE;
        const accessKey   = process.env.MOMO_ACCESS_KEY;
        const secretKey   = process.env.MOMO_SECRET_KEY;
        const requestId   = `${partnerCode}${Date.now()}`;
        const orderId     = requestId;
        const orderInfo   = `Thanh toan goi tap ${gia_id} cho khach ${khach_id}`;
        const redirectUrl = 'http://localhost:3001/payment-success'; // Trỏ về Frontend
        const ipnUrl      = `${process.env.PUBLIC_URL}/api/payments/momo-ipn`;
        const requestType = 'captureWallet';
        // Gửi cả khach_id và gia_id qua extraData
        const extraData   = Buffer.from(JSON.stringify({ khach_id, gia_id }), 'utf8').toString('base64');
        const lang        = 'vi';

        // 3) rawSignature (Thứ tự rất quan trọng)
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

        // 4) Body gọi MoMo
        const requestBody = {
            partnerCode, partnerName: 'Test Partner', storeId: 'NeoFitness',
            requestId, amount: String(amount), orderId, orderInfo,
            redirectUrl, ipnUrl, lang, extraData, requestType, signature,
            autoCapture: true,
        };
        
        // 5) Gọi API MoMo
        const momoRes = await axios.post(
            'https://test-payment.momo.vn/v2/gateway/api/create',
            requestBody,
            { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );

        const data = momoRes?.data || {};
        console.log('[MoMo CREATE] status:', momoRes.status, 'body:', data);

        if (data.payUrl) {
            return res.status(200).json({ payUrl: data.payUrl, orderId, message: 'Tạo link thanh toán thành công' });
        }
        return res.status(502).json({ message: 'Không thể tạo link thanh toán MoMo', details: data });

    } catch (error) {
        const errPayload = error?.response?.data || error.message;
        console.error('[MoMo CREATE] ERROR:', errPayload);
        return res.status(500).json({ message: 'Lỗi server', error: errPayload });
    }
};

/**
 * IPN từ MoMo gọi về (POST)
 */
const handleMomoIPN = async (req, res) => {
    try {
        const body = req.body || {};
        console.log('[MOMO IPN] body:', body);

        const {
            amount, orderId, message, resultCode, extraData,
        } = body;
        
        // --- FIX LỖI 1: GIẢI MÃ extraData NGAY ĐẦU ---
        // Chúng ta cần khach_id và gia_id từ đây
        let khach_id, gia_id;
        try {
            const decoded = JSON.parse(Buffer.from(extraData, 'base64').toString('utf8') || '{}');
            khach_id = decoded.khach_id;
            gia_id = decoded.gia_id;
            if (!khach_id || !gia_id) {
                throw new Error('Missing khach_id or gia_id in extraData');
            }
        } catch (e) {
            console.error('[MOMO IPN] Lỗi giải mã extraData:', e.message, extraData);
            return res.status(400).send('Invalid extraData'); // Báo lỗi
        }
        // --- KẾT THÚC FIX 1 ---

        // (Khuyến nghị: Xác thực chữ ký ở đây)

        if (Number(resultCode) === 0) { // Thanh toán thành công
            const transaction = await db.query('BEGIN'); // Bắt đầu transaction

            try {
                // --- FIX LỖI 2: SỬA LẠI LOGIC INSERT ---
                
                // 1. Lấy goi_tap_id và thông tin gói giá
                const packageInfoResult = await db.query(
                    `SELECT goi_tap_id, thoi_han, ca_buoi FROM gia_goi_tap WHERE gia_id = $1`,
                    [gia_id]
                );
                if (packageInfoResult.rows.length === 0) {
                    throw new Error(`Không tìm thấy thông tin gói tập với gia_id: ${gia_id}`);
                }
                const { goi_tap_id, thoi_han, ca_buoi } = packageInfoResult.rows[0];

                // 2. INSERT vào bảng thanh_toan (Dựa theo ERD)
                // (ERD có: tt_id, goi_tap_id, khach_id, so_tien, phuong_thuc, trang_thai, ngay_tt)
                const insertPaymentResult = await db.query(
                    `INSERT INTO thanh_toan (goi_tap_id, khach_id, so_tien, phuong_thuc, trang_thai, ngay_tt)
                     VALUES ($1, $2, $3, 'Momo', 'da thanh toan', NOW()) RETURNING tt_id`,
                    [goi_tap_id, khach_id, Number(amount)]
                );
                const tt_id = insertPaymentResult.rows[0].tt_id; // Lấy tt_id vừa tạo

                // 3. Tính toán ngày hết hạn
                let tong_so_buoi = ca_buoi; // Nếu có ca_buoi, dùng nó
                let ngay_het_han = null;
                if (thoi_han) {
                    const parts = thoi_han.toLowerCase().split(' ');
                    const value = parseInt(parts[0]);
                    const unit = parts[1];
                    if (!isNaN(value)) {
                        ngay_het_han = new Date();
                        if (unit.includes('thang') || unit.includes('tháng')) {
                            ngay_het_han.setMonth(ngay_het_han.getMonth() + value);
                        } else if (unit.includes('nam') || unit.includes('năm')) {
                            ngay_het_han.setFullYear(ngay_het_han.getFullYear() + value);
                        } else if (unit.includes('ngay') || unit.includes('ngày')) {
                            ngay_het_han.setDate(ngay_het_han.getDate() + value);
                        } else {
                            ngay_het_han = null;
                        }
                    }
                }
                
                // 4. INSERT vào bảng goi_khach_hang
                await db.query(
                    `INSERT INTO goi_khach_hang (
                        khach_id, gia_id, thanh_toan_id,
                        tong_so_buoi, so_buoi_da_tap,
                        ngay_kich_hoat, ngay_het_han, trang_thai
                     ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, 'active')`,
                    [khach_id, gia_id, tt_id, tong_so_buoi, 0, ngay_het_han]
                );
                // --- KẾT THÚC FIX 2 ---

                await db.query('COMMIT'); // Hoàn tất transaction
                console.log(`[MoMo IPN] Thanh toán thành công, đã lưu vào thanh_toan và goi_khach_hang. OrderID: ${orderId}`);
                // Phải trả về 204 cho Momo v2
                return res.status(204).send(); 

            } catch (error) {
                await db.query('ROLLBACK'); // Hoàn tác nếu có lỗi
                console.error('[MoMo IPN] Lỗi xử lý IPN (Database):', error);
                return res.status(500).send('Error processing IPN');
            }
        } else {
            console.warn(`[MoMo IPN] Thanh toán thất bại. OrderID: ${orderId}, ResultCode: ${resultCode}, Message: ${message}`);
            return res.status(204).send(); // Vẫn trả về 204
        }
    } catch (e) {
        console.error('[MOMO IPN] Lỗi nghiêm trọng:', e.message);
        return res.status(500).send('Error');
    }
};

// --- LẤY TẤT CẢ THANH TOÁN (Cho Admin) ---
const getAllPayments = async (req, res) => {
    try {
        const query = `
            SELECT 
                tt.*, 
                kh.ho_ten AS ten_khach_hang, 
                gt.ten AS ten_goi_tap
            FROM thanh_toan tt
            JOIN khach_hang kh ON tt.khach_id = kh.khach_id
            JOIN goi_tap gt ON tt.goi_tap_id = gt.goi_tap_id
            ORDER BY tt.ngay_tt DESC
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy tất cả thanh toán:", error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// --- LẤY THANH TOÁN CỦA KHÁCH HÀNG (Cho Customer) ---
const getPaymentsByCustomer = async (req, res) => {
    // Sửa lại để lấy khach_id từ token, bảo mật hơn
    const tai_khoan_id = req.user.user_id; 
    
    try {
        // 1. Tìm khach_id
         const customerProfile = await db.query(
            'SELECT khach_id FROM khach_hang WHERE tai_khoan_id = $1',
            [tai_khoan_id]
        );
        if (customerProfile.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy hồ sơ khách hàng.' });
        }
        const khach_id = customerProfile.rows[0].khach_id;

        // 2. Lấy thanh toán
        const { rows } = await db.query(
            'SELECT * FROM thanh_toan WHERE khach_id = $1 ORDER BY ngay_tt DESC',
            [khach_id]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy thanh toán của khách hàng:", error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// --- EXPORT ---
module.exports = {
    createPayment,
    handleMomoIPN,
    getAllPayments,
    getPaymentsByCustomer,
};