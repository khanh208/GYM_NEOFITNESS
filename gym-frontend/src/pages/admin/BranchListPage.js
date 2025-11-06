// src/pages/BranchListPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function BranchListPage() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchBranches = async () => {
        setError('');
        setLoading(true);
        const token = localStorage.getItem('accessToken');

        // Note: GET branches might be public, adjust headers if needed
        try {
            const response = await axios.get('http://localhost:3000/api/branches', {
                // headers: { 'Authorization': `Bearer ${token}` } // Uncomment if GET is protected
            });
            setBranches(response.data);
        } catch (err) {
            console.error('Error fetching branches:', err);
            setError(err.response?.data?.message || 'Failed to fetch branches.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm(`Bạn có chắc muốn xóa chi nhánh ID ${id}?`)) return;

        const token = localStorage.getItem('accessToken');
        setError('');
        try {
            await axios.delete(`http://localhost:3000/api/branches/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchBranches();
        } catch (err) {
            console.error('Error deleting branch:', err);
             setError(err.response?.data?.message || 'Lỗi khi xóa chi nhánh.');
        }
    };

    return (
        <div>
            <h2>Quản lý Chi nhánh</h2>
            <button
                onClick={() => navigate('/admin/branches/new')}
                className="add-button" // Use general add button style
                style={{ marginBottom: '15px' }}
            >
                Thêm Chi Nhánh Mới
            </button>

            {loading && <p>Đang tải dữ liệu...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {!loading && !error && (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên Chi Nhánh</th>
                            <th>Địa Chỉ</th>
                            <th>Số Điện Thoại</th>
                            <th>Trạng Thái</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {branches.map(branch => (
                            <tr key={branch.chi_nhanh_id}>
                                <td>{branch.chi_nhanh_id}</td>
                                <td>{branch.ten_chi_nhanh}</td>
                                <td>{branch.dia_chi}</td>
                                <td>{branch.so_dien_thoai}</td>
                                <td>{branch.trang_thai}</td>
                                <td>
                                    <button
                                        onClick={() => navigate(`/admin/branches/${branch.chi_nhanh_id}/edit`)}
                                        className="edit-button"
                                    >
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(branch.chi_nhanh_id)}
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

export default BranchListPage;