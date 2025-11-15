// src/pages/admin/CustomerPackageListPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CustomerPackageListPage() {
    const [customerPackages, setCustomerPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Hàm fetch danh sách
    const fetchCustomerPackages = async () => {
        setError('');
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            setLoading(false);
            return;
        }
        try {
            const response = await axios.get('http://localhost:3000/api/customer-packages', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCustomerPackages(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch customer packages.');
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomerPackages();
    }, []);

    // Hàm xử lý cập nhật trạng thái (Hủy hoặc Kích hoạt)
    const handleUpdateStatus = async (id, newStatus) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            return;
        }
        
        const confirmMsg = newStatus === 'cancelled' 
            ? `Bạn có chắc muốn HỦY gói ID ${id}? (Hành động này không thể hoàn tác và chỉ nên thực hiện sau khi đã xử lý hoàn tiền)`
            : `Bạn có chắc muốn KÍCH HOẠT gói ID ${id}?`;

        if (!window.confirm(confirmMsg)) return;

        setError('');
        try {
            await axios.put(`http://localhost:3000/api/customer-packages/${id}/status`,
                { trang_thai: newStatus },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            fetchCustomerPackages(); // Tải lại danh sách
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái.');
            console.error("Update status error:", err.response || err);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <div>
            <h2>Quản lý Gói của Khách hàng</h2>
            <p>Nơi theo dõi và quản lý các gói tập đã bán.</p>

            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {!loading && !error && (
                <table>
                    <thead>
                        <tr>
                            <th>ID Gói (gkh_id)</th>
                            <th>Khách Hàng</th>
                            <th>Tên Gói Tập</th>
                            <th>Trạng Thái</th>
                            <th>Số buổi (Đã tập / Tổng)</th>
                            <th>Kích hoạt</th>
                            <th>Hết hạn</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customerPackages.map(pkg => (
                            <tr key={pkg.gkh_id}>
                                <td>{pkg.gkh_id}</td>
                                <td>{pkg.ten_khach_hang}</td>
                                <td>{pkg.ten_goi_tap}</td>
                                <td>
                                    <span className={`package-status ${pkg.trang_thai}`}>
                                        {pkg.trang_thai}
                                    </span>
                                </td>
                                <td>
                                    {pkg.tong_so_buoi !== null 
                                        ? `${pkg.so_buoi_da_tap} / ${pkg.tong_so_buoi}` 
                                        : 'Theo thời gian'}
                                </td>
                                <td>{formatDate(pkg.ngay_kich_hoat)}</td>
                                <td>{formatDate(pkg.ngay_het_han)}</td>
                                <td>
                                    {/* Nút Kích hoạt (nếu đang chờ) */}
                                    {pkg.trang_thai === 'pending' && (
                                        <button
                                            onClick={() => handleUpdateStatus(pkg.gkh_id, 'active')}
                                            className="edit-button" // Nút màu xanh
                                        >
                                            Kích hoạt
                                        </button>
                                    )}
                                    {/* Nút Hủy (nếu đang active hoặc chờ) */}
                                    {(pkg.trang_thai === 'active' || pkg.trang_thai === 'pending') && (
                                        <button
                                            onClick={() => handleUpdateStatus(pkg.gkh_id, 'cancelled')}
                                            className="delete-button" // Nút màu đỏ
                                        >
                                            Hủy gói
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

export default CustomerPackageListPage;