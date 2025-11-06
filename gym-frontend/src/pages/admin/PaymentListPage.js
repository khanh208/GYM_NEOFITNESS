// src/pages/PaymentListPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import { useNavigate } from 'react-router-dom'; // Keep if you plan details/actions

function PaymentListPage() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // const navigate = useNavigate();

    // Fetch all payment records
    const fetchPayments = async () => {
        setError('');
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            setLoading(false);
            return;
        }
        try {
            // API GET /payments includes customer and package names
            const response = await axios.get('http://localhost:3000/api/payments', {
                headers: { 'Authorization': `Bearer ${token}` } // Admin only API
            });
            setPayments(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch payment history.');
            console.error("Fetch payments error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    // Helper to format currency (optional)
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return '-';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

     // Helper to format date/time
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '-';
        try {
            return new Date(dateTimeString).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) { return dateTimeString; }
    };


    return (
        <div>
            <h2>Quản lý Thanh Toán</h2>
            {/* No "Add New" button here, payments are created via Momo IPN */}

            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {!loading && !error && (
                <table>
                    <thead>
                        <tr>
                            <th>ID Thanh Toán</th>
                            <th>Khách Hàng</th>
                            <th>Gói Tập</th>
                            <th>Số Tiền</th>
                            <th>Phương Thức</th>
                            <th>Ngày Thanh Toán</th>
                            <th>Trạng Thái</th>
                            {/* <th>Hành Động</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map(payment => (
                            <tr key={payment.tt_id}>
                                <td>{payment.tt_id}</td>
                                <td>{payment.ten_khach_hang || `(ID: ${payment.khach_id})`}</td>
                                <td>{payment.ten_goi_tap || `(ID: ${payment.goi_tap_id})`}</td>
                                <td>{formatCurrency(payment.so_tien)}</td>
                                <td>{payment.phuong_thuc}</td>
                                <td>{formatDateTime(payment.ngay_tt)}</td>
                                <td>{payment.trang_thai}</td>
                                {/* Add actions like view details if needed later */}
                                {/* <td><button>Chi tiết</button></td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default PaymentListPage;