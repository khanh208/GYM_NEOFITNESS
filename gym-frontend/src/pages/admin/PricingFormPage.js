// src/pages/PricingFormPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function PricingFormPage() {
    // Lấy ID từ URL (sẽ là undefined nếu route là /new)
    const { id } = useParams();
    const navigate = useNavigate();
    // Xác định xem đang sửa hay tạo mới
    const isEditing = id !== undefined && id !== 'new';

    // State cho dữ liệu form
    const [formData, setFormData] = useState({
        goi_tap_id: '',
        gia: '',
        thoi_han: '',
        khuyen_mai_id: '' // Giá trị rỗng '' sẽ được chuyển thành null khi gửi
    });
    // State cho danh sách dropdown
    const [packages, setPackages] = useState([]);
    const [promotions, setPromotions] = useState([]);
    // State cho loading khi submit
    const [loading, setLoading] = useState(false);
    // State cho loading ban đầu (fetch dropdowns và data edit)
    const [initialLoading, setInitialLoading] = useState(true);
    // State cho lỗi
    const [error, setError] = useState('');

    // Fetch data cho dropdowns và data hiện tại (nếu sửa)
    useEffect(() => {
        const fetchData = async () => {
            setError('');
            const token = localStorage.getItem('accessToken'); // Lấy token
            try {
                // Sử dụng Promise.all để fetch song song
                const [pkgRes, promoRes] = await Promise.all([
                    axios.get('http://localhost:3000/api/packages'), // Lấy gói tập
                    axios.get('http://localhost:3000/api/promotions') // Lấy khuyến mãi
                ]);
                setPackages(pkgRes.data);
                setPromotions(promoRes.data);

                // Nếu đang sửa, fetch dữ liệu giá hiện tại
                if (isEditing) {
                    console.log(`Fetching data for pricing ID: ${id}`); // Debug log
                    const priceRes = await axios.get(`http://localhost:3000/api/pricings/${id}`, {
                         // headers: { 'Authorization': `Bearer ${token}` } // Bỏ comment nếu GET /:id cần token
                    });
                    const data = priceRes.data;
                    // Cập nhật state formData
                    setFormData({
                        goi_tap_id: data.goi_tap_id || '',
                        gia: data.gia || '',
                        thoi_han: data.thoi_han || '',
                        khuyen_mai_id: data.khuyen_mai_id || '' // Dùng '' cho select, sẽ thành null khi gửi
                    });
                }
            } catch (err) {
                setError('Không thể tải dữ liệu cần thiết (Gói tập/Khuyến mãi/Giá).');
                console.error("Fetch error:", err);
            } finally {
                setInitialLoading(false); // Kết thúc loading ban đầu
            }
        };
        fetchData();
    }, [id, isEditing]); // Dependencies

    // Xử lý thay đổi input
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            // Đảm bảo giá trị là rỗng '' nếu người dùng chọn "Không có"
            [name]: value
        }));
    };

    // Xử lý submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Bắt đầu loading submit
        setError('');
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            setLoading(false);
            return;
        }

        const url = isEditing ? `http://localhost:3000/api/pricings/${id}` : 'http://localhost:3000/api/pricings';
        const method = isEditing ? 'put' : 'post';

        // Chuẩn bị dữ liệu gửi đi
        const dataToSend = {
            ...formData,
            gia: parseFloat(formData.gia), // Đảm bảo giá là số
            // Chuyển khuyen_mai_id rỗng thành null
            khuyen_mai_id: formData.khuyen_mai_id === '' ? null : formData.khuyen_mai_id
        };

        try {
            await axios({
                method: method,
                url: url,
                data: dataToSend,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            navigate('/admin/pricings'); // Quay về trang danh sách
        } catch (err) {
             setError(err.response?.data?.message || `Lỗi khi ${isEditing ? 'cập nhật' : 'tạo'} mức giá.`);
             console.error("Submit error:", err.response?.data || err.message); // Log lỗi chi tiết hơn
        } finally {
            setLoading(false); // Kết thúc loading submit
        }
    };

    // Hiển thị loading khi fetch data ban đầu
     if (initialLoading) {
        return <p>Đang tải dữ liệu...</p>;
    }

    // Giao diện form
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
                {/* Thời hạn */}
                <div>
                    <label>Thời hạn (Ví dụ: 1 tháng, 12 buổi): </label>
                    <input type="text" name="thoi_han" value={formData.thoi_han || ''} onChange={handleChange} />
                </div>
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