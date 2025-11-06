// src/pages/CustomerListPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CustomerListPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Fetch customer list
    const fetchCustomers = async () => {
        setError('');
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            setLoading(false);
            return;
        }
        try {
            const response = await axios.get('http://localhost:3000/api/customers', {
                headers: { 'Authorization': `Bearer ${token}` } // Admin only API
            });
            setCustomers(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch customers.');
            console.error("Fetch customers error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    // Handle delete
    const handleDelete = async (id) => {
        if (!window.confirm(`Bạn có chắc muốn xóa khách hàng ID ${id}? (Lưu ý: Có thể không xóa được nếu có dữ liệu liên quan)`)) return;

        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            return;
        }
        setError('');
        try {
            await axios.delete(`http://localhost:3000/api/customers/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCustomers(); // Reload list
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa khách hàng.');
            console.error("Delete customer error:", err.response || err);
        }
    };

    // Helper to format date (optional)
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('vi-VN');
        } catch (e) { return dateString; }
    };

    return (
        <div>
            <h2>Quản lý Khách Hàng</h2>
            {/* No "Add New" button */}

            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {!loading && !error && (
                <table>
                    <thead>
                        <tr>
                            <th>ID Khách Hàng</th>
                            <th>Họ Tên</th>
                            <th>Email</th>
                            <th>SĐT</th>
                            <th>Ngày Tạo</th>
                            <th>ID Tài Khoản</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map(customer => (
                            <tr key={customer.khach_id}>
                                <td>{customer.khach_id}</td>
                                <td>{customer.ho_ten}</td>
                                <td>{customer.email || '-'}</td>
                                <td>{customer.so_dien_thoai || '-'}</td>
                                <td>{formatDate(customer.ngay_tao)}</td>
                                <td>{customer.tai_khoan_id || '-'}</td>
                                <td>
                                    <button
                                        onClick={() => navigate(`/admin/customers/${customer.khach_id}/edit`)}
                                        className="edit-button"
                                    >
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(customer.khach_id)}
                                        className="delete-button"
                                    >
                                        Xóa
                                    </button>
                                    {/* Optional: Buttons to view history */}
                                    {/* <button onClick={() => navigate(`/admin/customers/${customer.khach_id}/bookings`)}>Xem Lịch hẹn</button> */}
                                    {/* <button onClick={() => navigate(`/admin/customers/${customer.khach_id}/payments`)}>Xem Thanh toán</button> */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default CustomerListPage;