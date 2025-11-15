// controllers/paymentController.js
const db = require('../config/db');
const axios = require('axios');
const crypto = require('crypto');

/**
 * Tạo thanh toán MoMo
 * Body: { gia_id } (API sẽ tự lấy khach_id từ token)
 */
const createPayment = async (req, res) => {
    const { gia_id } = req.body; 
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
        const khach_id = customerProfile.rows[0].khach_id;

        // --- SỬA LỖI: LẤY GIÁ VÀ TÍNH TOÁN KHUYẾN MÃI ---
        // 1) Lấy giá VÀ KHUYẾN MÃI từ DB
        const priceQuery = `
            SELECT
                ggt.gia,
                km.giam_gia_phantram,
                km.ngay_bat_dau,
                km.ngay_ket_thuc
            FROM gia_goi_tap ggt
            LEFT JOIN khuyen_mai km ON ggt.khuyen_mai_id = km.khuyen_mai_id
            WHERE ggt.gia_id = $1
        `;
        const priceResult = await db.query(priceQuery, [gia_id]);

        if (priceResult.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy mức giá này.' });
        }

        // 2) TÍNH TOÁN LẠI GIÁ CUỐI CÙNG (logic từ pricingController)
        const priceData = priceResult.rows[0];
        const now = new Date();
        const giaGoc = parseFloat(priceData.gia);
        let finalPrice = giaGoc;

        const discount = priceData.giam_gia_phantram;
        const startDate = priceData.ngay_bat_dau;
        const endDate = priceData.ngay_ket_thuc;

        const isDiscountActive = discount > 0 &&
                                 (!startDate || now >= new Date(startDate)) &&
                                 (!endDate || now <= new Date(endDate));

        if (isDiscountActive) {
            finalPrice = giaGoc * (1 - discount / 100);
        }

        // 3) Sử dụng giá cuối cùng làm số tiền thanh toán
        const amount = Math.round(finalPrice);
        // --- KẾT THÚC SỬA LỖI ---


        // 4) Chuẩn bị thông tin Momo
        const partnerCode = process.env.MOMO_PARTNER_CODE;
        const accessKey   = process.env.MOMO_ACCESS_KEY;
        const secretKey   = process.env.MOMO_SECRET_KEY;
        const requestId   = `${partnerCode}${Date.now()}`;
        const orderId     = requestId;
        const orderInfo   = `Thanh toan goi tap ${gia_id} cho khach ${khach_id}`;
        const redirectUrl = 'http://localhost:3001/payment-success';
        const ipnUrl      = `${process.env.PUBLIC_URL}/api/payments/momo-ipn`;
        const requestType = 'captureWallet';
        const extraData   = Buffer.from(JSON.stringify({ khach_id, gia_id }), 'utf8').toString('base64');
        const lang        = 'vi';

        // 5) rawSignature
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

        // 6) Body gọi MoMo
        const requestBody = {
            partnerCode, partnerName: 'Test Partner', storeId: 'NeoFitness',
            requestId, amount: String(amount), orderId, orderInfo,
            redirectUrl, ipnUrl, lang, extraData, requestType, signature,
            autoCapture: true,
        };
        
        // 7) Gọi API MoMo
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

// --- HÀM XỬ LÝ IPN (ĐÃ NÂNG CẤP LOGIC XẾP HÀNG) ---
const handleMomoIPN = async (req, res) => {
    const body = req.body || {};
    console.log('[MOMO IPN] body:', body);
    const { amount, orderId, message, resultCode, extraData } = body;
    
    let khach_id, gia_id;
    try {
        const decoded = JSON.parse(Buffer.from(extraData, 'base64').toString('utf8') || '{}');
        khach_id = decoded.khach_id;
        gia_id = decoded.gia_id;
        if (!khach_id || !gia_id) throw new Error('Missing khach_id or gia_id in extraData');
    } catch (e) {
        console.error('[MOMO IPN] Lỗi giải mã extraData:', e.message, extraData);
        return res.status(400).send('Invalid extraData');
    }

    // (TODO: Xác thực chữ ký Momo ở đây)

    if (Number(resultCode) === 0) { // Thanh toán thành công
        const transaction = await db.query('BEGIN');
        try {
            // 1. Lấy thông tin gói giá
            const packageInfoResult = await db.query(
                `SELECT goi_tap_id, thoi_han, ca_buoi FROM gia_goi_tap WHERE gia_id = $1`,
                [gia_id]
            );
            if (packageInfoResult.rows.length === 0) {
                throw new Error(`Không tìm thấy thông tin gói tập với gia_id: ${gia_id}`);
            }
            const { goi_tap_id, thoi_han, ca_buoi } = packageInfoResult.rows[0];

            // 2. INSERT vào bảng thanh_toan
            const insertPaymentResult = await db.query(
                `INSERT INTO thanh_toan (goi_tap_id, khach_id, so_tien, phuong_thuc, trang_thai, ngay_tt)
                 VALUES ($1, $2, $3, 'Momo', 'da thanh toan', NOW()) RETURNING tt_id`,
                [goi_tap_id, khach_id, Number(amount)]
            );
            const tt_id = insertPaymentResult.rows[0].tt_id;

            // --- LOGIC XẾP HÀNG GÓI TẬP ---
            let newPackageStatus = 'active';
            let activationDate = new Date(); // Kích hoạt ngay

            // 3. Kiểm tra xem khách có gói nào khác đang 'active' không
            const activeCheck = await db.query(
                `SELECT ngay_het_han FROM goi_khach_hang 
                 WHERE khach_id = $1 AND trang_thai = 'active' AND ngay_het_han IS NOT NULL
                 ORDER BY ngay_het_han DESC LIMIT 1`,
                [khach_id]
            );

            if (activeCheck.rows.length > 0) {
                // Đã có gói active!
                const lastExpiryDate = new Date(activeCheck.rows[0].ngay_het_han);
                activationDate = new Date(lastExpiryDate.setDate(lastExpiryDate.getDate() + 1)); // Kích hoạt vào ngày sau khi gói cũ hết hạn
                newPackageStatus = 'pending'; // Trạng thái: Chờ kích hoạt
                console.log(`[MoMo IPN] Gói ${tt_id} sẽ ở trạng thái 'pending', kích hoạt vào ${activationDate}`);
            }
            // --- KẾT THÚC LOGIC XẾP HÀNG ---

            // 4. Tính toán ngày hết hạn (dựa trên ngày kích hoạt MỚI)
            let ngay_het_han = null;
            let tong_so_buoi = ca_buoi;
            
            if (thoi_han) {
                const parts = thoi_han.toLowerCase().split(' ');
                const value = parseInt(parts[0]);
                const unit = parts[1];
                if (!isNaN(value)) {
                    ngay_het_han = new Date(activationDate);
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
            
            // 5. INSERT vào bảng goi_khach_hang
            await db.query(
                `INSERT INTO goi_khach_hang (
                    khach_id, gia_id, thanh_toan_id,
                    tong_so_buoi, so_buoi_da_tap,
                    ngay_kich_hoat, ngay_het_han, trang_thai
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [khach_id, gia_id, tt_id, tong_so_buoi, 0, activationDate, ngay_het_han, newPackageStatus]
            );

            await db.query('COMMIT');
            console.log(`[MoMo IPN] Thanh toán thành công, đã lưu vào thanh_toan và goi_khach_hang. OrderID: ${orderId}`);
            return res.status(204).send();

        } catch (error) {
            await db.query('ROLLBACK');
            console.error('[MoMo IPN] Lỗi xử lý IPN (Database):', error);
            return res.status(500).send('Error processing IPN');
        }
    } else {
        console.warn(`[MoMo IPN] Thanh toán thất bại. OrderID: ${orderId}, ResultCode: ${resultCode}, Message: ${message}`);
        return res.status(204).send();
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
    const tai_khoan_id = req.user.user_id; 
    try {
        const customerProfile = await db.query(
            'SELECT khach_id FROM khach_hang WHERE tai_khoan_id = $1',
            [tai_khoan_id]
        );
        if (customerProfile.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy hồ sơ khách hàng.' });
        }
        const khach_id = customerProfile.rows[0].khach_id;

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