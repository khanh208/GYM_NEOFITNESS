// src/pages/ServiceListPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ServiceListPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchServices = async () => {
        setError('');
        setLoading(true);
        // const token = localStorage.getItem('accessToken'); // GET might be public
        try {
            // API GET /services already joins with branch name
            const response = await axios.get('http://localhost:3000/api/services');
            setServices(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch services.');
            console.error("Fetch services error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm(`Bạn có chắc muốn xóa dịch vụ ID ${id}?`)) return;

        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            return;
        }
        setError('');
        try {
            await axios.delete(`http://localhost:3000/api/services/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchServices(); // Reload list
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa dịch vụ.');
            console.error("Delete service error:", err.response || err);
        }
    };

    return (
        <div>
            <h2>Quản lý Dịch Vụ</h2>
            <button
                onClick={() => navigate('/admin/services/new')}
                className="add-button"
                style={{ marginBottom: '15px' }}
            >
                Thêm Dịch Vụ Mới
            </button>

            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {!loading && !error && (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên Dịch Vụ</th>
                            <th>Mô Tả</th>
                            <th>Chi Nhánh</th>
                            <th>Trạng Thái</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map(service => (
                            <tr key={service.dich_vu_id}>
                                <td>{service.dich_vu_id}</td>
                                <td>{service.ten}</td>
                                <td>{service.mo_ta}</td>
                                <td>{service.ten_chi_nhanh || '-'}</td>
                                <td>{service.trang_thai}</td>
                                <td>
                                    <button
                                        onClick={() => navigate(`/admin/services/${service.dich_vu_id}/edit`)}
                                        className="edit-button"
                                    >
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(service.dich_vu_id)}
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

export default ServiceListPage;