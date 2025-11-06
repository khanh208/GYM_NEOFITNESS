// src/pages/GalleryListPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function GalleryListPage() {
    const [galleryItems, setGalleryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchGalleryItems = async () => {
        setError('');
        setLoading(true);
        // GET /gallery is public
        try {
            const response = await axios.get('http://localhost:3000/api/gallery');
            setGalleryItems(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch gallery items.');
            console.error("Fetch gallery error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGalleryItems();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm(`Bạn có chắc muốn xóa mục ảnh ID ${id}?`)) return;

        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            return;
        }
        setError('');
        try {
            await axios.delete(`http://localhost:3000/api/gallery/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` } // Needs Admin token
            });
            fetchGalleryItems(); // Reload list
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa mục ảnh.');
            console.error("Delete gallery item error:", err.response || err);
        }
    };

    return (
        <div>
            <h2>Quản lý Thư viện Ảnh / Banner</h2>
            <button
                onClick={() => navigate('/admin/gallery/new')}
                className="add-button"
                style={{ marginBottom: '15px' }}
            >
                Thêm Mục Ảnh Mới
            </button>

            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {!loading && !error && (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tiêu Đề</th>
                            <th>Hình Ảnh (URL)</th>
                            <th>Mô Tả</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {galleryItems.map(item => (
                            <tr key={item.the_id}>
                                <td>{item.the_id}</td>
                                <td>{item.ten_de}</td>
                                <td>
                                    {/* Hiển thị ảnh nhỏ xem trước */}
                                    <img src={item.hinh_anh} alt={item.ten_de} style={{ width: '100px', height: 'auto', marginRight: '10px' }} />
                                    {item.hinh_anh}
                                </td>
                                <td>{item.mo_ta}</td>
                                <td>
                                    <button
                                        onClick={() => navigate(`/admin/gallery/${item.the_id}/edit`)}
                                        className="edit-button"
                                    >
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.the_id)}
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

export default GalleryListPage;