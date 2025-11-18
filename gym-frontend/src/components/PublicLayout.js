// src/components/PublicLayout.js
import React, { useState, useEffect } from 'react';
// --- SỬA LỖI Ở ĐÂY: Gộp tất cả import từ react-router-dom vào một dòng ---
import { Outlet, Link, useNavigate } from 'react-router-dom';
import './PublicLayout.css';
import LogoImage from '../assets/Logo_NEOFITNESS.png';
// --- Dòng import trùng lặp đã bị xóa ---

function PublicLayout() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Kiểm tra trạng thái đăng nhập khi layout tải
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const role = localStorage.getItem('userRole');
        if (token && role) {
            setIsLoggedIn(true);
            setUserRole(role);
        }
    }, []); // Chỉ chạy 1 lần

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        setIsLoggedIn(false);
        setUserRole(null);
        navigate('/'); // Quay về trang chủ sau khi đăng xuất
    };
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Hàm đóng menu khi click vào link (để chuyển trang)
    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="public-layout">
            {/* --- Navbar (Thanh điều hướng) --- */}
            <header className="public-header">
                <div className="navbar-container">
                    <Link to="/" className="navbar-logo">
                        <img src={LogoImage} alt="NeoFitness Logo" className="logo-image" />
                    </Link>
                    <div className="mobile-menu-icon" onClick={toggleMobileMenu}>
                        {isMobileMenuOpen ? '✕' : '☰'}
                    </div>
                    <div className={`navbar-content ${isMobileMenuOpen ? 'active' : ''}`}>
                        <nav className="navbar-menu">
                            <Link to="/hlv-ca-nhan" onClick={closeMobileMenu}>HLV cá nhân</Link>
                            <Link to="/goi-tap" onClick={closeMobileMenu}>Gói tập</Link>
                            <Link to="/hoi-dap" onClick={closeMobileMenu}>Hỏi đáp</Link>
                            <Link to="/lien-he" onClick={closeMobileMenu}>Liên hệ</Link>
                        </nav>

                        <div className="navbar-actions">
                            <Link to="/dat-lich" className="btn-book-now" onClick={closeMobileMenu}>Đặt lịch ngay</Link>
                            {isLoggedIn ? (
                                <>
                                    {userRole === 'admin' && (
                                        <Link to="/admin/dashboard" className="btn-login" onClick={closeMobileMenu}>Admin</Link>
                                    )}
                                    {userRole === 'trainer' && (
                                        <Link to="/trainer/schedule" className="btn-login" onClick={closeMobileMenu}>Trainer</Link>
                                    )}
                                    {userRole === 'customer' && (
                                        <Link to="/ho-so-cua-toi" className="btn-login" onClick={closeMobileMenu}>Hồ sơ</Link>
                                    )}
                                    <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="btn-logout">Đăng xuất</button>
                                </>
                            ) : (
                                <Link to="/login" className="btn-login" onClick={closeMobileMenu}>Đăng nhập</Link>
                            )}
                        </div>
                    </div>
            </div>
            </header>

            {/* --- Nội dung trang --- */}
            <main className="public-content">
                <Outlet /> {/* Đây là nơi các trang con (Homepage, etc.) sẽ hiển thị */}
            </main>

            {/* --- Footer (Chân trang) --- */}
            <footer className="public-footer">
                <p>© 2025 NeoFitness. All rights reserved.</p>
                <nav>
                    <Link to="/dich-vu">Dịch vụ</Link>
                    <Link to="/goi-pt">Gói PT</Link>
                    <Link to="/hoi-dap">Hỏi đáp</Link>
                    <Link to="/lien-he">Liên hệ</Link>
                </nav>
            </footer>
        </div>
    );
}

export default PublicLayout;