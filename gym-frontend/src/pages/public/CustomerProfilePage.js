// src/pages/public/CustomerProfilePage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './CustomerProfilePage.css'; // Sẽ tạo CSS sau

function CustomerProfilePage() {
    const [myPackages, setMyPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Hàm format tiền tệ
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return '';
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) return '';
        return new Intl.NumberFormat('vi-VN').format(numericAmount);
    };

    useEffect(() => {
        const fetchMyPackages = async () => {
            const token = localStorage.getItem('accessToken');
            const role = localStorage.getItem('userRole');

            if (!token || role !== 'customer') {
                alert('Bạn cần đăng nhập với vai trò khách hàng để xem trang này.');
                navigate('/login', { state: { from: '/ho-so-cua-toi' } });
                return;
            }

            setLoading(true);
            try {
                const response = await axios.get('http://localhost:3000/api/customer/my-packages', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setMyPackages(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Không thể tải gói tập của bạn.');
                console.error("Fetch my packages error:", err);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    navigate('/login', { state: { from: '/ho-so-cua-toi' } });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMyPackages();
    }, [navigate]);

    if (loading) return <div className="page-container" style={{ color: 'white', textAlign: 'center', paddingTop: '50px' }}><p>Đang tải gói tập của bạn...</p></div>;
    if (error) return <div className="page-container" style={{ color: 'red', textAlign: 'center', paddingTop: '50px' }}><p>{error}</p></div>;

    return (
        <div className="customer-profile-container">
            <h1 className="profile-title">Hồ sơ của tôi</h1>
            <p className="profile-subtitle">Tổng quan các gói tập bạn đã mua tại NeoFitness.</p>

            {myPackages.length === 0 ? (
                <div className="no-packages">
                    <p>Bạn chưa có gói tập nào. Hãy khám phá các gói của chúng tôi!</p>
                    <Link to="/goi-tap" className="hero-button">Xem gói tập</Link>
                </div>
            ) : (
                <div className="my-packages-grid">
                    {myPackages.map(pkg => (
                        <div className={`package-card ${pkg.trang_thai}`} key={pkg.gkh_id}>
                            <div className="package-header">
                                <h3 className="package-name">{pkg.ten_goi_tap}</h3>
                                <span className={`package-status ${pkg.trang_thai}`}>
                                    {pkg.trang_thai === 'active' ? 'Đang hoạt động' : 
                                     pkg.trang_thai === 'expired' ? 'Đã hết hạn' : 
                                     pkg.trang_thai === 'used' ? 'Đã dùng hết' : pkg.trang_thai}
                                </span>
                            </div>
                            <div className="package-details">
                                <p><strong>Thời hạn:</strong> {pkg.thoi_han}</p>
                                <p><strong>Giá mua:</strong> {formatCurrency(pkg.so_tien_thanh_toan)} VND</p>
                                <p><strong>Kích hoạt:</strong> {new Date(pkg.ngay_kich_hoat).toLocaleDateString()}</p>
                                {pkg.ngay_het_han && (
                                    <p><strong>Hết hạn:</strong> {new Date(pkg.ngay_het_han).toLocaleDateString()}</p>
                                )}
                                {pkg.tong_so_buoi !== null && (
                                    <p>
                                        <strong>Buổi tập:</strong> {pkg.so_buoi_da_tap} / {pkg.tong_so_buoi} buổi
                                    </p>
                                )}
                            </div>
                            {/* Bạn có thể thêm nút "Đặt lịch" hoặc "Gia hạn" tại đây */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CustomerProfilePage;