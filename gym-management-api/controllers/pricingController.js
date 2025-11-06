// controllers/pricingController.js
const db = require('../config/db');

// --- HÀM TÍNH GIÁ CUỐI CÙNG (Đã có) ---
const calculateFinalPrice = (priceData) => {
    // ... (Giữ nguyên code tính giá cuối) ...
    const now = new Date();
    let finalPrice = parseFloat(priceData.gia);
    const discount = priceData.giam_gia_phantram;
    const startDate = priceData.ngay_bat_dau; // Tên cột từ JOIN
    const endDate = priceData.ngay_ket_thuc;   // Tên cột từ JOIN

    const isDiscountActive = discount > 0 &&
                             (!startDate || now >= new Date(startDate)) &&
                             (!endDate || now <= new Date(endDate));

    if (isDiscountActive) {
        finalPrice = finalPrice * (1 - discount / 100);
    }
    return { ...priceData, gia_cuoi_cung: finalPrice };
};

// --- LẤY TẤT CẢ GIÁ (Đã có) ---
const getAllPricings = async (req, res) => {
    try {
        const query = `
            SELECT
                ggt.*,
                gt.ten AS ten_goi_tap,  -- Lấy tên gói tập
                km.ten_khuyen_mai,
                km.giam_gia_phantram,
                km.ngay_bat_dau,
                km.ngay_ket_thuc
            FROM gia_goi_tap ggt
            LEFT JOIN goi_tap gt ON ggt.goi_tap_id = gt.goi_tap_id -- JOIN với goi_tap
            LEFT JOIN khuyen_mai km ON ggt.khuyen_mai_id = km.khuyen_mai_id
            ORDER BY ggt.gia_id ASC;
        `;
        const { rows } = await db.query(query);
        const resultsWithFinalPrice = rows.map(calculateFinalPrice); // Tính giá cuối
        res.status(200).json(resultsWithFinalPrice);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// --- LẤY MỘT MỨC GIÁ THEO ID (Cần cho form Edit) ---
const getPricingById = async (req, res) => {
    const { id } = req.params;
    try {
        // --- SỬA CÂU QUERY: JOIN với goi_tap để lấy mo_ta ---
        const query = `
            SELECT 
                gtp.*, 
                g.ten AS ten_goi_tap_full, -- Lấy tên đầy đủ
                g.mo_ta AS mo_ta_chi_tiet -- Lấy mô tả
            FROM gia_goi_tap gtp
            JOIN goi_tap g ON gtp.goi_tap_id = g.goi_tap_id
            WHERE gtp.gia_id = $1
        `;
        // --- KẾT THÚC SỬA QUERY ---
        
        const { rows } = await db.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy mức giá.' });
        }
        
        // (Tính toán lại giá cuối cùng cho 1 gói)
        const priceData = rows[0];
        const finalPriceData = await calculateFinalPrice(priceData); // Tái sử dụng hàm tính giá
        
        res.status(200).json(finalPriceData); // Trả về dữ liệu đã tính
    } catch (error) {
        console.error(`Lỗi khi lấy giá ID ${id}:`, error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};


// --- TẠO MỨC GIÁ MỚI (Đã có) ---
const createPricing = async (req, res) => {
    const { goi_tap_id, gia, thoi_han, khuyen_mai_id } = req.body;
    if (!goi_tap_id || gia === undefined || gia === null) { // Kiểm tra giá
        return res.status(400).json({ message: 'ID gói tập và giá là bắt buộc.' });
    }
    try {
        const query = `
            INSERT INTO gia_goi_tap (goi_tap_id, gia, thoi_han, khuyen_mai_id)
            VALUES ($1, $2, $3, $4) RETURNING *;
        `;
        const params = [goi_tap_id, parseFloat(gia), thoi_han, khuyen_mai_id || null]; // Đảm bảo giá là số, KM ID là null nếu rỗng
        const { rows } = await db.query(query, params);
        res.status(201).json({ message: 'Tạo mức giá thành công!', data: rows[0] });
    } catch (error) {
         if (error.code === '23503') { // Lỗi khóa ngoại
            return res.status(404).json({ message: 'Gói tập hoặc Khuyến mãi không tồn tại.' });
        }
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// --- CẬP NHẬT MỨC GIÁ ---
const updatePricing = async (req, res) => {
    const { id } = req.params;
    const { goi_tap_id, gia, thoi_han, khuyen_mai_id } = req.body;
     if (!goi_tap_id || gia === undefined || gia === null) {
        return res.status(400).json({ message: 'ID gói tập và giá là bắt buộc.' });
    }
    try {
        const query = `
            UPDATE gia_goi_tap
            SET goi_tap_id = $1, gia = $2, thoi_han = $3, khuyen_mai_id = $4
            WHERE gia_id = $5 RETURNING *;
        `;
         const params = [goi_tap_id, parseFloat(gia), thoi_han, khuyen_mai_id || null, id];
        const { rows } = await db.query(query, params);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy mức giá để cập nhật.' });
        }
        res.status(200).json({ message: 'Cập nhật mức giá thành công!', data: rows[0] });
    } catch (error) {
         if (error.code === '23503') { // Lỗi khóa ngoại
            return res.status(404).json({ message: 'Gói tập hoặc Khuyến mãi không tồn tại.' });
        }
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};


// --- XÓA MỨC GIÁ (Đã có) ---
const deletePricing = async (req, res) => {
    const { id } = req.params;
    try {
        const { rowCount } = await db.query('DELETE FROM gia_goi_tap WHERE gia_id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy mức giá để xóa.' });
        }
        res.status(200).json({ message: 'Xóa mức giá thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Export tất cả các hàm
module.exports = {
    getAllPricings,
    getPricingById, // <-- Export hàm mới
    createPricing,
    updatePricing, // <-- Export hàm mới
    deletePricing
};