// controllers/bookingController.js
const db = require('../config/db');

// --- LẤY TẤT CẢ LỊCH HẸN (Cho Admin) ---
const getAllBookings = async (req, res) => {
    try {
        const query = `
            SELECT 
                dl.*,
                kh.ho_ten AS ten_khach_hang,
                hlv.ho_ten AS ten_hlv,
                dv.ten AS ten_dich_vu,
                cn.ten_chi_nhanh
            FROM dat_lich dl
            LEFT JOIN khach_hang kh ON dl.khach_id = kh.khach_id
            LEFT JOIN huan_luyen_vien hlv ON dl.hlv_id = hlv.hlv_id
            LEFT JOIN dich_vu dv ON dl.dich_vu_id = dv.dich_vu_id
            LEFT JOIN chi_nhanh cn ON dl.chi_nhanh_id = cn.chi_nhanh_id
            ORDER BY dl.thoi_gian DESC
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy tất cả lịch hẹn:", error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// --- LẤY LỊCH HẸN CỦA MỘT KHÁCH HÀNG (Cho Customer) ---
const getBookingsByCustomer = async (req, res) => {
    // (Lưu ý: Route này trong app.js nên được bảo vệ)
    const { customerId } = req.params; // Lấy từ URL
    
    // (Nên nâng cấp: Lấy khach_id từ token thay vì customerId để bảo mật)
    // const tai_khoan_id = req.user.user_id; 
    // const customerProfile = await db.query('SELECT khach_id FROM khach_hang WHERE tai_khoan_id = $1', [tai_khoan_id]);
    // const khach_id = customerProfile.rows[0].khach_id;
    
    try {
        const { rows } = await db.query(
            'SELECT * FROM dat_lich WHERE khach_id = $1 ORDER BY thoi_gian DESC',
            [customerId] // Tạm thời dùng customerId từ URL
        );
        res.status(200).json(rows);
    } catch (error) {
         console.error("Lỗi khi lấy lịch hẹn của khách hàng:", error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// --- TẠO MỘT LỊCH HẸN MỚI (Cho Customer) ---
const createBooking = async (req, res) => {
    const { gkh_id, dich_vu_id, chi_nhanh_id, hlv_id, thoi_gian } = req.body;
    const tai_khoan_id = req.user.user_id;

    // Giả định mọi buổi tập kéo dài 60 phút
    const DURATION_MINUTES = 60; 
    
    if (!gkh_id || !dich_vu_id || !chi_nhanh_id || !thoi_gian) {
        return res.status(400).json({ message: 'Vui lòng chọn Gói tập, Dịch vụ, Chi nhánh và Thời gian.' });
    }

    const bookingStartTime = new Date(thoi_gian);
    const bookingEndTime = new Date(bookingStartTime.getTime() + DURATION_MINUTES * 60000); 

    try {
        // 1. Lấy khach_id (Giữ nguyên)
        const customerProfile = await db.query('SELECT khach_id FROM khach_hang WHERE tai_khoan_id = $1', [tai_khoan_id]);
        if (customerProfile.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy hồ sơ khách hàng.' });
        }
        const khach_id = customerProfile.rows[0].khach_id;

        // 2. Lấy và Kiểm tra gói tập (gkh_id) (Giữ nguyên)
        const pkgResult = await db.query(
            'SELECT * FROM goi_khach_hang WHERE gkh_id = $1 AND khach_id = $2',
            [gkh_id, khach_id]
        );
        if (pkgResult.rows.length === 0) {
            return res.status(403).json({ message: 'Gói tập này không hợp lệ hoặc không phải của bạn.' });
        }
        const activePackage = pkgResult.rows[0];

        // 3. Kiểm tra Gói tập (Trạng thái, Ngày hết hạn, Số buổi) (Giữ nguyên)
        if (activePackage.trang_thai !== 'active') {
             return res.status(400).json({ message: `Đặt lịch thất bại. Gói tập này đã ${activePackage.trang_thai}.` });
        }
        if (activePackage.ngay_het_han && bookingTime > new Date(activePackage.ngay_het_han)) {
            return res.status(400).json({ message: `Đặt lịch thất bại. Gói tập của bạn đã hết hạn.` });
        }
        if (activePackage.tong_so_buoi !== null && activePackage.so_buoi_da_tap >= activePackage.tong_so_buoi) {
            return res.status(400).json({ message: `Đặt lịch thất bại. Bạn đã sử dụng hết ${activePackage.tong_so_buoi} buổi.` });
        }
        
        // --- LOGIC MỚI: KIỂM TRA HLV TRÙNG LỊCH ---
        if (hlv_id) { // Chỉ kiểm tra nếu khách có chọn HLV
            const conflictCheck = await db.query(
                `SELECT 1 FROM dat_lich
                 WHERE hlv_id = $1
                   AND trang_thai NOT IN ('da huy', 'hoan thanh') -- Không tính lịch đã hủy/hoàn thành
                   AND (thoi_gian, thoi_gian_ket_thuc) OVERLAPS ($2, $3)`, // Toán tử OVERLAPS
                [hlv_id, bookingStartTime, bookingEndTime]
            );
            if (conflictCheck.rows.length > 0) {
                return res.status(409).json({ message: 'Đặt lịch thất bại. Huấn luyện viên đã có lịch vào thời gian này.' });
            }
        }
        // --- KẾT THÚC LOGIC MỚI ---

        // 4. Tạo lịch hẹn (thêm thoi_gian_ket_thuc)
        const query = `
            INSERT INTO dat_lich (khach_id, hlv_id, chi_nhanh_id, dich_vu_id, thoi_gian, thoi_gian_ket_thuc, trang_thai, gkh_id)
            VALUES ($1, $2, $3, $4, $5, $6, 'cho xac nhan', $7) RETURNING *;
        `;
        const { rows } = await db.query(query, [khach_id, hlv_id || null, chi_nhanh_id, dich_vu_id, thoi_gian, bookingEndTime, gkh_id]);
        
        res.status(201).json({ message: 'Đặt lịch thành công! Vui lòng chờ xác nhận.', data: rows[0] });

    } catch (error) {
        console.error("Lỗi khi tạo lịch hẹn:", error);
        if (error.code === '23503') {
            return res.status(404).json({ message: 'Thông tin HLV, Chi nhánh hoặc Dịch vụ không hợp lệ.' });
        }
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// --- CẬP NHẬT TRẠNG THÁI LỊCH HẸN (Admin/Trainer) ---
// (Bao gồm logic TRỪ BUỔI TẬP)
const updateBookingStatus = async (req, res) => {
    const { id: lichIdToUpdate } = req.params;
    const { trang_thai } = req.body;
    const loggedInUser = req.user;
    
    // Các trạng thái được phép cập nhật
    const allowedStatus = ['da xac nhan', 'da huy', 'hoan thanh'];
    if (!trang_thai || !allowedStatus.includes(trang_thai)) {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ. Chỉ chấp nhận: da xac nhan, da huy, hoan thanh.' });
    }
    
    // Bắt đầu Transaction
    const transaction = await db.query('BEGIN'); 
    
    try {
        // 1. Lấy thông tin lịch hẹn (bao gồm gkh_id)
        const bookingResult = await db.query('SELECT * FROM dat_lich WHERE lich_id = $1', [lichIdToUpdate]);
        const booking = bookingResult.rows[0];

        if (!booking) {
            await transaction.query('ROLLBACK');
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn.' });
        }

        // 2. Logic phân quyền (Admin hoặc HLV chính chủ)
        if (loggedInUser.role === 'trainer') {
            const trainerProfile = await db.query('SELECT hlv_id FROM huan_luyen_vien WHERE tai_khoan_id = $1', [loggedInUser.user_id]);
            if (trainerProfile.rows.length === 0) {
                await transaction.query('ROLLBACK');
                return res.status(404).json({ message: 'Không tìm thấy hồ sơ HLV cho tài khoản này.' });
            }
            const hlv_id_cua_trainer = trainerProfile.rows[0].hlv_id;
            if (booking.hlv_id != hlv_id_cua_trainer) {
                await transaction.query('ROLLBACK');
                return res.status(403).json({ message: 'Cấm! Bạn không có quyền cập nhật lịch hẹn của HLV khác.' });
            }
        }
        // (Nếu là Admin thì bỏ qua, Admin có toàn quyền)

        // 3. --- LOGIC TRỪ BUỔI TẬP ---
        // Nếu chuyển sang "hoan thanh" VÀ trạng thái trước đó CHƯA phải là "hoan thanh"
        if (trang_thai === 'hoan thanh' && booking.trang_thai !== 'hoan thanh') {
            if (booking.gkh_id) { // Kiểm tra xem lịch này có liên kết với gói nào không
                // Lấy thông tin gói của khách
                const pkgResult = await db.query('SELECT * FROM goi_khach_hang WHERE gkh_id = $1 FOR UPDATE', [booking.gkh_id]); // 'FOR UPDATE' để khóa dòng này
                const activePackage = pkgResult.rows[0];

                // Chỉ trừ nếu gói là gói theo buổi
                if (activePackage && activePackage.tong_so_buoi !== null) { 
                    const newSessionCount = activePackage.so_buoi_da_tap + 1;
                    let newPkgStatus = activePackage.trang_thai;
                    
                    // Nếu đã tập hết, đổi trạng thái gói
                    if (newSessionCount >= activePackage.tong_so_buoi) {
                        newPkgStatus = 'used'; // 'đã dùng hết'
                    }
                    
                    await db.query(
                        'UPDATE goi_khach_hang SET so_buoi_da_tap = $1, trang_thai = $2 WHERE gkh_id = $3',
                        [newSessionCount, newPkgStatus, booking.gkh_id]
                    );
                    console.log(`[Booking Update] Đã trừ 1 buổi tập vào gói gkh_id: ${booking.gkh_id}.`);
                }
            }
        }
        // --- KẾT THÚC LOGIC TRỪ BUỔI ---
        
        // 4. Cập nhật trạng thái lịch hẹn
        const { rows } = await db.query(
            'UPDATE dat_lich SET trang_thai = $1 WHERE lich_id = $2 RETURNING *;',
            [trang_thai, lichIdToUpdate]
        );
        
        await db.query('COMMIT'); // Hoàn tất transaction
        res.status(200).json({ message: `Cập nhật trạng thái lịch hẹn thành ${trang_thai} thành công!`, data: rows[0] });

    } catch (error) {
        await db.query('ROLLBACK'); // Hoàn tác nếu có lỗi
        console.error("Lỗi khi cập nhật trạng thái lịch hẹn:", error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// --- LẤY LỊCH HẸN CỦA TÔI (Cho Trainer) ---
const getMyBookings = async (req, res) => {
    const loggedInUserId = req.user.user_id; // Lấy từ middleware 'protect'

    try {
        // 1. Tìm hlv_id
        const trainerProfile = await db.query('SELECT hlv_id FROM huan_luyen_vien WHERE tai_khoan_id = $1', [loggedInUserId]);
        if (trainerProfile.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy hồ sơ HLV liên kết với tài khoản này.' });
        }
        const hlv_id = trainerProfile.rows[0].hlv_id;

        // 2. Lấy các lịch hẹn được gán (JOIN)
        const query = `
            SELECT
                dl.*,
                kh.ho_ten AS ten_khach_hang,
                dv.ten AS ten_dich_vu,
                cn.ten_chi_nhanh
            FROM dat_lich dl
            LEFT JOIN khach_hang kh ON dl.khach_id = kh.khach_id
            LEFT JOIN dich_vu dv ON dl.dich_vu_id = dv.dich_vu_id
            LEFT JOIN chi_nhanh cn ON dl.chi_nhanh_id = cn.chi_nhanh_id
            WHERE dl.hlv_id = $1
            ORDER BY dl.thoi_gian DESC
        `;
        const { rows } = await db.query(query, [hlv_id]);
        res.status(200).json(rows);

    } catch (error) {
        console.error("Lỗi khi lấy lịch hẹn của HLV:", error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// --- EXPORT ---
module.exports = {
    getAllBookings,
    getBookingsByCustomer,
    createBooking,
    updateBookingStatus,
    getMyBookings 
};