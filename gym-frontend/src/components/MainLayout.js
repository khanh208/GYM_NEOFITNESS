// src/components/MainLayout.js
import React from 'react';
import { Outlet, useNavigate, Link, NavLink, useLocation } from 'react-router-dom';
import './MainLayout.css';

function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const userRole = localStorage.getItem('userRole') || 'User';

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
        // Also remove userId if you stored it
        localStorage.removeItem('userId'); 
        navigate('/login');
    };

    // --- MOVE basePath DEFINITION HERE ---
    // Determine base path for links based on role
    const basePath = userRole === 'admin' ? '/admin' : '/trainer';
    // --- END MOVE ---

    return (
        <div className="main-layout">
            <nav className="sidebar">
                <div className="sidebar-header">
                    <h3>NeoFitness {userRole === 'admin' ? 'Admin' : 'Trainer'}</h3>
                </div>
                <ul className="sidebar-menu">
                    {/* Admin Links */}
                    {userRole === 'admin' && (
                        <>
                            {/* Use basePath correctly here */}
                            <li><NavLink to={`${basePath}/dashboard`}>Dashboard</NavLink></li>
                            <li><NavLink to={`${basePath}/branches`}>Quản lý Chi nhánh</NavLink></li>
                            <li><NavLink to={`${basePath}/packages`}>Quản lý Gói Tập</NavLink></li>
                            <li><NavLink to={`${basePath}/promotions`}>Quản lý Khuyến mãi</NavLink></li>
                            <li><NavLink to={`${basePath}/pricings`}>Quản lý Giá</NavLink></li>
                            <li><NavLink to={`${basePath}/trainers`}>Quản lý HLV</NavLink></li>
                            <li><NavLink to={`${basePath}/services`}>Quản lý Dịch vụ</NavLink></li>
                            <li><NavLink to={`${basePath}/customers`}>Quản lý Khách hàng</NavLink></li>
                            <li><NavLink to={`${basePath}/bookings`}>Quản lý Lịch hẹn</NavLink></li>
                            <li><NavLink to={`${basePath}/payments`}>Quản lý Thanh toán</NavLink></li>
                            <li><NavLink to={`${basePath}/faqs`}>Quản lý FAQs</NavLink></li>
                            <li><NavLink to={`${basePath}/contacts`}>Quản lý Liên hệ</NavLink></li>
                            <li><NavLink to={`${basePath}/gallery`}>Quản lý Gallery</NavLink></li>
                            <li><NavLink to="/admin/customer-packages">Quản lý Gói Đã Bán</NavLink></li>
                        </>
                    )}
                    {/* Trainer Links */}
                    {userRole === 'trainer' && (
                        <>
                            {/* Use basePath correctly here */}
                            <li><NavLink to={`${basePath}/schedule`}>Lịch làm việc</NavLink></li>
                            <li><NavLink to={`${basePath}/profile`}>Hồ sơ cá nhân</NavLink></li>
                        </>
                    )}
                </ul>
                <button onClick={handleLogout} className="logout-button">Đăng xuất</button>
            </nav>
            <main className="content-area">
                <header className="header">
                    <div>Welcome, {userRole}!</div>
                </header>
                <main className="main-content">
                    <Outlet />
                </main>
            </main>
        </div>
    );
}

export default MainLayout;