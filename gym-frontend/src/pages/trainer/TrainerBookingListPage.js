// src/pages/TrainerBookingListPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function TrainerBookingListPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // No need to store trainerProfileId state if only used locally in fetchData
    const navigate = useNavigate();

    // Fetch trainer profile ID and their bookings
    const fetchData = async () => {
        setError('');
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId'); // Get stored userId

        // Check for token and userId first
        if (!token || !userId) {
            setError('Thông tin đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
            setLoading(false);
            // Optional: Redirect immediately
            // navigate('/login');
            return;
        }

        try {
            console.log("Fetching trainer's own bookings...");
            const response = await axios.get('http://localhost:3000/api/trainers/my/bookings', {
                headers: { 'Authorization': `Bearer ${token}` } // API needs protect() and authorize('trainer')
            });
            console.log("Fetched bookings count:", response.data.length);
            setBookings(response.data);

        } catch (err) {
            setError('Không thể tải dữ liệu lịch hẹn.');
            console.error("Fetch bookings/trainer error:", err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Run fetchData on component mount
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Removed navigate dependency, fetch only once

    // Handle updating status
    const handleUpdateStatus = async (id, newStatus) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            return;
        }
        setError('');
        console.log(`Updating booking ${id} to status ${newStatus}`);

        // Store original bookings for potential revert on error
        const originalBookings = [...bookings];
        // Optimistic UI update (optional but provides better UX)
        setBookings(prevBookings => prevBookings.map(b =>
            b.lich_id === id ? { ...b, trang_thai: newStatus } : b
        ));


        try {
            await axios.put(`http://localhost:3000/api/bookings/${id}`,
                { trang_thai: newStatus },
                { headers: { 'Authorization': `Bearer ${token}` } } // Backend checks trainer ownership
            );
             console.log(`Successfully updated booking ${id}`);
            // No need to refetch if optimistic update worked,
            // but refetching ensures data consistency if backend logic is complex
            // fetchData(); // Uncomment if you prefer refetching
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái.');
            console.error("Update status error:", err.response || err);
            // Revert optimistic update on error
             setBookings(originalBookings);
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
            <h2>Lịch Hẹn Của Bạn</h2>

            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {!loading && !error && (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Khách Hàng</th>
                            <th>Dịch Vụ</th>
                            <th>Chi Nhánh</th>
                            <th>Thời Gian</th>
                            <th>Trạng Thái</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.length > 0 ? bookings.map(booking => (
                            <tr key={booking.lich_id}>
                                <td>{booking.lich_id}</td>
                                <td>{booking.ten_khach_hang || `(ID: ${booking.khach_id})`}</td>
                                <td>{booking.ten_dich_vu || `(ID: ${booking.dich_vu_id})`}</td>
                                <td>{booking.ten_chi_nhanh || `(ID: ${booking.chi_nhanh_id})`}</td>
                                <td>{formatDateTime(booking.thoi_gian)}</td>
                                <td>{booking.trang_thai}</td>
                                <td>
                                    {booking.trang_thai === 'cho xac nhan' && (
                                        <button
                                            onClick={() => handleUpdateStatus(booking.lich_id, 'da xac nhan')}
                                            className="edit-button"
                                            style={{ marginRight: '5px'}}
                                        >
                                            Xác nhận
                                        </button>
                                    )}
                                    {booking.trang_thai !== 'da huy' && (
                                         <button
                                            onClick={() => handleUpdateStatus(booking.lich_id, 'da huy')}
                                            className="delete-button"
                                        >
                                            Hủy
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )) : (
                             <tr><td colSpan="7" style={{textAlign: 'center'}}>Không có lịch hẹn nào được gán cho bạn.</td></tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default TrainerBookingListPage;