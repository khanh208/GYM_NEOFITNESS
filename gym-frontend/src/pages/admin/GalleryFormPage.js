// src/pages/GalleryFormPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function GalleryFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = id !== undefined && id !== 'new';

    const [formData, setFormData] = useState({ ten_de: '', hinh_anh: '', mo_ta: '' });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditing);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditing) {
            const fetchGalleryData = async () => {
                setError('');
                // const token = localStorage.getItem('accessToken'); // If needed
                try {
                    const response = await axios.get(`http://localhost:3000/api/gallery/${id}`); // TODO: Add GET /:id API for Gallery
                    const data = response.data;
                    setFormData({
                        ten_de: data.ten_de || '',
                        hinh_anh: data.hinh_anh || '',
                        mo_ta: data.mo_ta || ''
                    });
                } catch (err) {
                    setError('Không thể tải dữ liệu mục ảnh.');
                    console.error("Fetch Gallery error:", err);
                } finally {
                    setInitialLoading(false);
                }
            };
            fetchGalleryData();
        } else {
            setInitialLoading(false);
        }
    }, [id, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
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

        const url = isEditing ? `http://localhost:3000/api/gallery/${id}` : 'http://localhost:3000/api/gallery';
        const method = isEditing ? 'put' : 'post';

        try {
            await axios({
                method: method,
                url: url,
                data: formData,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            navigate('/admin/gallery');
        } catch (err) {
             setError(err.response?.data?.message || `Lỗi khi ${isEditing ? 'cập nhật' : 'tạo'} mục ảnh.`);
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
            <h2>{isEditing ? 'Chỉnh sửa Mục Ảnh' : 'Tạo Mục Ảnh Mới'}</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Tiêu Đề: </label>
                    <input type="text" name="ten_de" value={formData.ten_de} onChange={handleChange} required />
                </div>
                 <div>
                    <label>URL Hình Ảnh: </label>
                    <input type="text" name="hinh_anh" value={formData.hinh_anh} onChange={handleChange} required placeholder="https://..." />
                </div>
                 <div>
                    <label>Mô Tả: </label>
                    <textarea name="mo_ta" value={formData.mo_ta || ''} onChange={handleChange} />
                </div>
                {/* Hiển thị ảnh xem trước nếu có URL */}
                {formData.hinh_anh && (
                     <div style={{ marginTop: '10px' }}>
                        <label>Xem trước:</label><br />
                        <img src={formData.hinh_anh} alt="Preview" style={{ maxWidth: '200px', maxHeight: '150px', border: '1px solid #ccc' }} />
                    </div>
                 )}

                <button type="submit" className="add-button" disabled={loading || initialLoading}>
                    {loading ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Tạo mới')}
                </button>
                 <button type="button" className="cancel-button" onClick={() => navigate('/admin/gallery')} disabled={loading}>
                    Hủy
                </button>
            </form>
        </div>
    );
}

export default GalleryFormPage;