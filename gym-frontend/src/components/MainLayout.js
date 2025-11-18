// src/components/MainLayout.js
import React, { useState } from 'react';
import { Outlet, useNavigate, Link, NavLink } from 'react-router-dom';
import './MainLayout.css';

function MainLayout() {
    const navigate = useNavigate();
    // State để quản lý sidebar trên mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        navigate('/login');
    };

    const userRole = localStorage.getItem('userRole') || 'User';

    // Hàm toggle sidebar
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Đóng sidebar khi click vào link (trên mobile)
    const closeSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
        }
    };

    // Đường dẫn cơ sở
    const basePath = userRole === 'admin' ? '/admin' : '/trainer';

    return (
        <div className="main-layout">
            {/* --- Overlay (Lớp mờ) khi mở sidebar trên mobile --- */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

            {/* --- Sidebar --- */}
            <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h3>NeoFitness {userRole === 'admin' ? 'Admin' : 'Trainer'}</h3>
                    {/* Nút đóng sidebar trên mobile */}
                    <button className="close-sidebar-btn" onClick={toggleSidebar}>×</button>
                </div>
                
                <ul className="sidebar-menu">
                    {/* Admin Links */}
                    {userRole === 'admin' && (
                        <>
                            <li><NavLink to={`${basePath}/dashboard`} onClick={closeSidebar}>Dashboard</NavLink></li>
                            <li><NavLink to={`${basePath}/branches`} onClick={closeSidebar}>Quản lý Chi nhánh</NavLink></li>
                            <li><NavLink to={`${basePath}/packages`} onClick={closeSidebar}>Quản lý Gói Tập</NavLink></li>
                            <li><NavLink to={`${basePath}/promotions`} onClick={closeSidebar}>Quản lý Khuyến mãi</NavLink></li>
                            <li><NavLink to={`${basePath}/pricings`} onClick={closeSidebar}>Quản lý Giá</NavLink></li>
                            <li><NavLink to={`${basePath}/trainers`} onClick={closeSidebar}>Quản lý HLV</NavLink></li>
                            <li><NavLink to={`${basePath}/services`} onClick={closeSidebar}>Quản lý Dịch vụ</NavLink></li>
                            <li><NavLink to={`${basePath}/customers`} onClick={closeSidebar}>Quản lý Khách hàng</NavLink></li>
                            <li><NavLink to={`${basePath}/customer-packages`} onClick={closeSidebar}>Quản lý Gói Đã Bán</NavLink></li>
                            <li><NavLink to={`${basePath}/bookings`} onClick={closeSidebar}>Quản lý Lịch hẹn</NavLink></li>
                            <li><NavLink to={`${basePath}/payments`} onClick={closeSidebar}>Quản lý Thanh toán</NavLink></li>
                            <li><NavLink to={`${basePath}/check-in`} onClick={closeSidebar}>Quét Check-in</NavLink></li>
                            <li><NavLink to={`${basePath}/faqs`} onClick={closeSidebar}>Quản lý FAQs</NavLink></li>
                            <li><NavLink to={`${basePath}/contacts`} onClick={closeSidebar}>Quản lý Liên hệ</NavLink></li>
                            <li><NavLink to={`${basePath}/gallery`} onClick={closeSidebar}>Quản lý Gallery</NavLink></li>
                        </>
                    )}
                    {/* Trainer Links */}
                    {userRole === 'trainer' && (
                        <>
                            <li><NavLink to={`${basePath}/schedule`} onClick={closeSidebar}>Lịch làm việc</NavLink></li>
                            <li><NavLink to={`${basePath}/profile`} onClick={closeSidebar}>Hồ sơ cá nhân</NavLink></li>
                            <li><NavLink to={`${basePath}/check-in`} onClick={closeSidebar}>Quét Check-in</NavLink></li>
                        </>
                    )}
                </ul>
                <button onClick={handleLogout} className="logout-button">Đăng xuất</button>
            </nav>

            {/* --- Main Content Area --- */}
            <div className="content-area">
                <header className="header">
                    <div className="header-left">
                        {/* Nút Hamburger Menu */}
                        <button className="menu-toggle-btn" onClick={toggleSidebar}>
                            ☰
                        </button>
                    </div>
                    <div className="header-right">
                        Welcome, <strong>{userRole}</strong>!
                    </div>
                </header>
                
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default MainLayout;