// src/pages/PromotionFormPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function PromotionFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = id !== undefined && id !== 'new';

    const [formData, setFormData] = useState({
        ten_khuyen_mai: '',
        mo_ta: '',
        giam_gia_phantram: 0,
        ngay_bat_dau: '',
        ngay_ket_thuc: ''
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditing);
    const [error, setError] = useState('');

     // Helper to format date for input type="datetime-local"
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
             // Format: YYYY-MM-DDTHH:mm
            return date.toISOString().slice(0, 16);
        } catch (e) {
            return '';
        }
    };

    useEffect(() => {
        if (isEditing) {
            const fetchPromotionData = async () => {
                setError('');
                // const token = localStorage.getItem('accessToken');
                try {
                    const response = await axios.get(`http://localhost:3000/api/promotions/${id}`);
                    const data = response.data;
                    setFormData({
                        ten_khuyen_mai: data.ten_khuyen_mai || '',
                        mo_ta: data.mo_ta || '',
                        giam_gia_phantram: data.giam_gia_phantram || 0,
                        // Format dates for input fields
                        ngay_bat_dau: formatDateForInput(data.ngay_bat_dau),
                        ngay_ket_thuc: formatDateForInput(data.ngay_ket_thuc)
                    });
                } catch (err) {
                    setError('Không thể tải dữ liệu khuyến mãi.');
                } finally {
                    setInitialLoading(false);
                }
            };
            fetchPromotionData();
        } else {
            setInitialLoading(false);
        }
    }, [id, isEditing]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const token = localStorage.getItem('accessToken');
        const url = isEditing ? `http://localhost:3000/api/promotions/${id}` : 'http://localhost:3000/api/promotions';
        const method = isEditing ? 'put' : 'post';

        // Convert date strings back to ISO format or null if empty
        const dataToSend = {
            ...formData,
            ngay_bat_dau: formData.ngay_bat_dau ? new Date(formData.ngay_bat_dau).toISOString() : null,
            ngay_ket_thuc: formData.ngay_ket_thuc ? new Date(formData.ngay_ket_thuc).toISOString() : null,
        };

        try {
            await axios({
                method: method,
                url: url,
                data: dataToSend,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            navigate('/admin/promotions');
        } catch (err) {
             setError(err.response?.data?.message || `Lỗi khi ${isEditing ? 'cập nhật' : 'tạo'} khuyến mãi.`);
        } finally {
            setLoading(false);
        }
    };

     if (initialLoading) {
        return <p>Đang tải dữ liệu...</p>;
    }

    return (
        <div>
            <h2>{isEditing ? 'Chỉnh sửa Khuyến Mãi' : 'Tạo Khuyến Mãi mới'}</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Tên Khuyến Mãi: </label>
                    <input type="text" name="ten_khuyen_mai" value={formData.ten_khuyen_mai} onChange={handleChange} required />
                </div>
                <div>
                    <label>Mô Tả: </label>
                    <textarea name="mo_ta" value={formData.mo_ta || ''} onChange={handleChange} />
                </div>
                <div>
                    <label>Giảm Giá (%): </label>
                    <input type="number" name="giam_gia_phantram" value={formData.giam_gia_phantram} onChange={handleChange} required min="0" max="100" />
                </div>
                 <div>
                    <label>Ngày Bắt Đầu: </label>
                    <input type="datetime-local" name="ngay_bat_dau" value={formData.ngay_bat_dau} onChange={handleChange} />
                </div>
                 <div>
                    <label>Ngày Kết Thúc: </label>
                    <input type="datetime-local" name="ngay_ket_thuc" value={formData.ngay_ket_thuc} onChange={handleChange} />
                </div>
                <button type="submit" className="add-button" disabled={loading || initialLoading}>
                    {loading ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Tạo mới')}
                </button>
                 <button type="button" className="cancel-button" onClick={() => navigate('/admin/promotions')} disabled={loading}>
                    Hủy
                </button>
            </form>
        </div>
    );
}

export default PromotionFormPage;