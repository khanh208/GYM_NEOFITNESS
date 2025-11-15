// src/pages/admin/PricingFormPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function PricingFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = id !== undefined && id !== 'new';

    // --- SỬA STATE: Thêm 'ca_buoi' ---
    const [formData, setFormData] = useState({
        goi_tap_id: '',
        gia: '',
        thoi_han: '',
        ca_buoi: '', // <-- THÊM DÒNG NÀY
        khuyen_mai_id: ''
    });
    // --- KẾT THÚC SỬA ---

    const [packages, setPackages] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setError('');
            const token = localStorage.getItem('accessToken');
            try {
                const [pkgRes, promoRes] = await Promise.all([
                    axios.get('http://localhost:3000/api/packages'),
                    axios.get('http://localhost:3000/api/promotions')
                ]);
                setPackages(pkgRes.data);
                setPromotions(promoRes.data);

                if (isEditing) {
                    console.log(`Fetching data for pricing ID: ${id}`);
                    const priceRes = await axios.get(`http://localhost:3000/api/pricings/${id}`, {
                       // headers: { 'Authorization': `Bearer ${token}` } // Bỏ comment nếu GET /:id cần token
                    });
                    const data = priceRes.data;
                    
                    // --- SỬA STATE: Thêm 'ca_buoi' vào fetch ---
                    setFormData({
                        goi_tap_id: data.goi_tap_id || '',
                        gia: data.gia_goc || '', // Dùng gia_goc (giá gốc) để sửa
                        thoi_han: data.thoi_han || '',
                        ca_buoi: data.ca_buoi || '', // <-- THÊM DÒNG NÀY
                        khuyen_mai_id: data.khuyen_mai_id || ''
                    });
                    // --- KẾT THÚC SỬA ---
                }
            } catch (err) {
                setError('Không thể tải dữ liệu cần thiết (Gói tập/Khuyến mãi/Giá).');
                console.error("Fetch error:", err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [id, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            setLoading(false);
            return;
        }

        const url = isEditing ? `http://localhost:3000/api/pricings/${id}` : 'http://localhost:3000/api/pricings';
        const method = isEditing ? 'put' : 'post';

        // --- SỬA DATA GỬI ĐI: Thêm 'ca_buoi' ---
        const dataToSend = {
            goi_tap_id: formData.goi_tap_id,
            gia: parseFloat(formData.gia),
            thoi_han: formData.thoi_han || null, // Gửi null nếu rỗng
            // Chuyển rỗng thành null, nếu không rỗng thì chuyển thành số
            ca_buoi: formData.ca_buoi === '' ? null : parseInt(formData.ca_buoi, 10), 
            khuyen_mai_id: formData.khuyen_mai_id === '' ? null : formData.khuyen_mai_id
        };
        // --- KẾT THÚC SỬA ---

        try {
            await axios({
                method: method,
                url: url,
                data: dataToSend,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            navigate('/admin/pricings');
        } catch (err) {
             setError(err.response?.data?.message || `Lỗi khi ${isEditing ? 'cập nhật' : 'tạo'} mức giá.`);
             console.error("Submit error:", err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

     if (initialLoading) {
        return <p>Đang tải dữ liệu...</p>;
    }

    return (
        <div>
            <h2>{isEditing ? 'Chỉnh sửa Mức Giá' : 'Tạo Mức Giá mới'}</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                {/* Chọn Gói Tập */}
                <div>
                    <label>Gói Tập: </label>
                    <select name="goi_tap_id" value={formData.goi_tap_id} onChange={handleChange} required>
                        <option value="">-- Chọn Gói Tập --</option>
                        {packages.map(pkg => (
                            <option key={pkg.goi_tap_id} value={pkg.goi_tap_id}>
                                {pkg.ten} (ID: {pkg.goi_tap_id})
                            </option>
                        ))}
                    </select>
                </div>

                {/* --- SỬA JSX: Thêm ô "Số buổi" --- */}
                <div className="form-row" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    {/* Thời hạn */}
                    <div style={{ flex: 1 }}>
                        <label>Thời hạn (Ví dụ: 1 tháng, 30 ngày):</label>
                        <input 
                            type="text" 
                            name="thoi_han" 
                            value={formData.thoi_han || ''} 
                            onChange={handleChange}
                            placeholder="Bỏ trống nếu là gói theo buổi"
                        />
                    </div>
                    {/* Số buổi */}
                    <div style={{ flex: 1 }}>
                        <label>Số buổi (Ví dụ: 12):</label>
                        <input 
                            type="number" 
                            name="ca_buoi" 
                            value={formData.ca_buoi || ''} 
                            onChange={handleChange} 
                            placeholder="Bỏ trống nếu là gói theo thời gian"
                            min="0"
                        />
                    </div>
                </div>
                {/* --- KẾT THÚC SỬA --- */}

                {/* Giá Gốc */}
                <div>
                    <label>Giá Gốc (VND): </label>
                    <input type="number" name="gia" value={formData.gia} onChange={handleChange} required min="0" step="1000" />
                </div>
                 {/* Chọn Khuyến Mãi */}
                <div>
                    <label>Áp dụng Khuyến Mãi (Tùy chọn): </label>
                     <select name="khuyen_mai_id" value={formData.khuyen_mai_id || ''} onChange={handleChange}>
                        <option value="">-- Không áp dụng --</option>
                        {promotions.map(promo => (
                            <option key={promo.khuyen_mai_id} value={promo.khuyen_mai_id}>
                                {promo.ten_khuyen_mai} ({promo.giam_gia_phantram}%)
                            </option>
                        ))}
                    </select>
                </div>

                <button type="submit" className="add-button" disabled={loading || initialLoading}>
                    {loading ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Tạo mới')}
                </button>
                 <button type="button" className="cancel-button" onClick={() => navigate('/admin/pricings')} disabled={loading}>
                    Hủy
                </button>
            </form>
        </div>
    );
}

export default PricingFormPage;