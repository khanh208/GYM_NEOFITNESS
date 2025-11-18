// src/pages/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css'; // Sẽ tạo CSS sau

function AdminDashboard() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalCustomers: 0,
        activePackages: 0,
        todayBookings: 0,
        recentPayments: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem('accessToken');
            try {
                const response = await axios.get('http://localhost:3000/api/dashboard/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    if (loading) return <p>Đang tải thống kê...</p>;

    return (
        <div className="dashboard-container">
            <h2>Tổng Quan Hệ Thống</h2>
            
            <div className="stats-grid">
                <div className="stat-card revenue">
                    <h3>Doanh Thu</h3>
                    <p className="stat-number">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="stat-card customers">
                    <h3>Khách Hàng</h3>
                    <p className="stat-number">{stats.totalCustomers}</p>
                </div>
                <div className="stat-card packages">
                    <h3>Gói Đang Active</h3>
                    <p className="stat-number">{stats.activePackages}</p>
                </div>
                <div className="stat-card bookings">
                    <h3>Lịch Hẹn Hôm Nay</h3>
                    <p className="stat-number">{stats.todayBookings}</p>
                </div>
            </div>

            <div className="recent-activity">
                <h3>Giao dịch gần đây</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Khách hàng</th>
                            <th>Số tiền</th>
                            <th>Thời gian</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.recentPayments.map(payment => (
                            <tr key={payment.tt_id}>
                                <td>{payment.ho_ten}</td>
                                <td>{formatCurrency(payment.so_tien)}</td>
                                <td>{new Date(payment.ngay_tt).toLocaleString('vi-VN')}</td>
                                <td>{payment.trang_thai}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminDashboard;