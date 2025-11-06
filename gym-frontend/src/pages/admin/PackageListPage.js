// src/pages/PackageListPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function PackageListPage() {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchPackages = async () => {
        setError('');
        setLoading(true);
        //const token = localStorage.getItem('accessToken'); // May not be needed if public
        try {
            const response = await axios.get('http://localhost:3000/api/packages', {
                // headers: { 'Authorization': `Bearer ${token}` }
            });
            setPackages(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch packages.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm(`Bạn có chắc muốn xóa gói tập ID ${id}?`)) return;

        const token = localStorage.getItem('accessToken');
        setError('');
        try {
            await axios.delete(`http://localhost:3000/api/packages/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchPackages();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa gói tập.');
        }
    };

    return (
        <div>
            <h2>Quản lý Gói Tập</h2>
            <button
                onClick={() => navigate('/admin/packages/new')}
                className="add-button"
                style={{ marginBottom: '15px' }}
            >
                Thêm Gói Tập Mới
            </button>

            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {!loading && !error && (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên Gói Tập</th>
                            <th>Mô Tả</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {packages.map(pkg => (
                            <tr key={pkg.goi_tap_id}>
                                <td>{pkg.goi_tap_id}</td>
                                <td>{pkg.ten}</td>
                                <td>{pkg.mo_ta}</td>
                                <td>
                                    <button
                                        onClick={() => navigate(`/admin/packages/${pkg.goi_tap_id}/edit`)}
                                        className="edit-button"
                                    >
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(pkg.goi_tap_id)}
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

export default PackageListPage;