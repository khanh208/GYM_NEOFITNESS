// src/pages/PackageFormPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function PackageFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    // Xác định chính xác hơn: id phải tồn tại và không phải là 'new'
    const isEditing = id !== undefined && id !== 'new';

    const [formData, setFormData] = useState({ ten: '', mo_ta: '' });
    const [loading, setLoading] = useState(false); // Loading khi submit
    const [initialLoading, setInitialLoading] = useState(isEditing); // Loading khi fetch data ban đầu
    const [error, setError] = useState('');

    useEffect(() => {
        // --- FIX: Chỉ fetch dữ liệu nếu đang sửa ---
        if (isEditing) {
            const fetchPackageData = async () => {
                setError('');
                // const token = localStorage.getItem('accessToken'); // Có thể không cần nếu API GET public
                try {
                    console.log(`Fetching data for package ID: ${id}`); // Debug log
                    const response = await axios.get(`http://localhost:3000/api/packages/${id}`);
                    setFormData({ ten: response.data.ten || '', mo_ta: response.data.mo_ta || '' });
                } catch (err) {
                    setError('Không thể tải dữ liệu gói tập.');
                    console.error("Fetch error:", err);
                } finally {
                    setInitialLoading(false); // Kết thúc loading ban đầu
                }
            };
            fetchPackageData();
        } else {
            // Nếu là tạo mới, kết thúc loading ban đầu ngay lập tức
            setInitialLoading(false);
        }
        // --- END FIX ---
    }, [id, isEditing]); // Dependencies

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const token = localStorage.getItem('accessToken');
        const url = isEditing ? `http://localhost:3000/api/packages/${id}` : 'http://localhost:3000/api/packages';
        const method = isEditing ? 'put' : 'post';

        try {
            await axios({
                method: method,
                url: url,
                data: formData,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            navigate('/admin/packages');
        } catch (err) {
             setError(err.response?.data?.message || `Lỗi khi ${isEditing ? 'cập nhật' : 'tạo'} gói tập.`);
             console.error("Submit error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Hiển thị loading nếu đang fetch data ban đầu
    if (initialLoading) {
        return <p>Đang tải dữ liệu...</p>;
    }

    return (
        <div>
            <h2>{isEditing ? 'Chỉnh sửa Gói Tập' : 'Tạo Gói Tập mới'}</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Tên Gói Tập: </label>
                    <input type="text" name="ten" value={formData.ten} onChange={handleChange} required />
                </div>
                 <div>
                    <label>Mô Tả: </label>
                    <textarea name="mo_ta" value={formData.mo_ta || ''} onChange={handleChange} />
                </div>
                <button type="submit" className="add-button" disabled={loading || initialLoading}>
                    {loading ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Tạo mới')}
                </button>
                 <button type="button" className="cancel-button" onClick={() => navigate('/admin/packages')} disabled={loading}>
                    Hủy
                </button>
            </form>
        </div>
    );
}

export default PackageFormPage;