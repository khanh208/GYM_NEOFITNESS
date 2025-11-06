// src/pages/BookingListPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Using useNavigate for potential future actions

function BookingListPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // const navigate = useNavigate(); // Keep navigate if you plan actions like "View Details"

    // Fetch all bookings
    const fetchBookings = async () => {
        setError('');
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            setLoading(false);
            return;
        }
        try {
            const response = await axios.get('http://localhost:3000/api/bookings', {
                headers: { 'Authorization': `Bearer ${token}` } // Admin only API
            });
            setBookings(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch bookings.');
            console.error("Fetch bookings error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // Function to handle updating booking status
    const handleUpdateStatus = async (id, newStatus) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            return;
        }
        setError(''); // Clear previous errors specifically for this action if needed

        // Find the specific booking to potentially update UI optimistically or revert
        const originalBookings = [...bookings];
        // Optimistic UI update (optional)
        // setBookings(bookings.map(b => b.lich_id === id ? { ...b, trang_thai: newStatus } : b));

        try {
            await axios.put(`http://localhost:3000/api/bookings/${id}`,
                { trang_thai: newStatus }, // Send the new status in the body
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            // Refetch the entire list to ensure consistency
            fetchBookings();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái.');
            console.error("Update status error:", err.response || err);
            // Revert optimistic update if failed (optional)
            // setBookings(originalBookings);
        }
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
            <h2>Quản lý Lịch Hẹn</h2>
            {/* No "Add New" button here, customers create bookings */}

            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {!loading && !error && (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Khách Hàng</th>
                            <th>HLV</th>
                            <th>Dịch Vụ</th>
                            <th>Chi Nhánh</th>
                            <th>Thời Gian</th>
                            <th>Trạng Thái</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map(booking => (
                            <tr key={booking.lich_id}>
                                <td>{booking.lich_id}</td>
                                <td>{booking.ten_khach_hang || `(ID: ${booking.khach_id})`}</td>
                                <td>{booking.ten_hlv || '-'}</td>
                                <td>{booking.ten_dich_vu || `(ID: ${booking.dich_vu_id})`}</td>
                                <td>{booking.ten_chi_nhanh || `(ID: ${booking.chi_nhanh_id})`}</td>
                                <td>{formatDateTime(booking.thoi_gian)}</td>
                                <td>{booking.trang_thai}</td>
                                <td>
                                    {/* Buttons to update status */}
                                    {booking.trang_thai === 'cho xac nhan' && (
                                        <button
                                            onClick={() => handleUpdateStatus(booking.lich_id, 'da xac nhan')}
                                            style={{backgroundColor: 'green', color: 'white', marginRight: '5px'}}
                                        >
                                            Xác nhận
                                        </button>
                                    )}
                                    {booking.trang_thai !== 'da huy' && (
                                         <button
                                            onClick={() => handleUpdateStatus(booking.lich_id, 'da huy')}
                                            className="delete-button" // Use delete style for cancel
                                        >
                                            Hủy
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default BookingListPage;