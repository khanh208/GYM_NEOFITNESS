// src/pages/PromotionListPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function PromotionListPage() {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchPromotions = async () => {
        setError('');
        setLoading(true);
        // const token = localStorage.getItem('accessToken'); // May not be needed if public GET
        try {
            const response = await axios.get('http://localhost:3000/api/promotions');
            setPromotions(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch promotions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions();
    }, []);

   const handleDelete = async (id) => {
    if (!window.confirm(`Bạn có chắc muốn xóa khuyến mãi ID ${id}?`)) return;

    const token = localStorage.getItem('accessToken'); // Lấy token
    // --- KIỂM TRA TOKEN ---
    if (!token) {
        setError('Vui lòng đăng nhập lại để thực hiện thao tác này.');
        return;
    }
    // --- HẾT KIỂM TRA ---
    setError('');
    try {
        await axios.delete(`http://localhost:3000/api/promotions/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` } // <-- Gửi token
        });
        fetchPromotions(); // Tải lại
    } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi xóa khuyến mãi.');
        console.error("Delete promotion error:", err.response || err); // Log chi tiết lỗi
    }
};

    // Helper function to format dates nicely (optional)
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('vi-VN');
        } catch (e) {
            return dateString; // Fallback if date is invalid
        }
    };

    return (
        <div>
            <h2>Quản lý Khuyến Mãi</h2>
            <button onClick={() => navigate('/admin/promotions/new')} className="add-button" style={{ marginBottom: '15px' }}>
                Thêm Khuyến Mãi Mới
            </button>

            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {!loading && !error && (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên Khuyến Mãi</th>
                            <th>Mô Tả</th>
                            <th>Giảm (%)</th>
                            <th>Bắt đầu</th>
                            <th>Kết thúc</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {promotions.map(promo => (
                            <tr key={promo.khuyen_mai_id}>
                                <td>{promo.khuyen_mai_id}</td>
                                <td>{promo.ten_khuyen_mai}</td>
                                <td>{promo.mo_ta}</td>
                                <td>{promo.giam_gia_phantram}%</td>
                                <td>{formatDate(promo.ngay_bat_dau)}</td>
                                <td>{formatDate(promo.ngay_ket_thuc)}</td>
                                <td>
                                    <button onClick={() => navigate(`/admin/promotions/${promo.khuyen_mai_id}/edit`)} className="edit-button">
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(promo.khuyen_mai_id)}
                                        className="delete-button"
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default PromotionListPage;