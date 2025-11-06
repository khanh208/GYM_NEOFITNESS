// src/pages/auth/LoginPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"; // <-- 1. Import thư viện
import './LoginPage.css';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:3000/api/auth/login', {
                email: email,
                password: password
            });

            console.log('Login successful:', response.data);

            // --- LƯU THÔNG TIN CƠ BẢN ---
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('userRole', response.data.role);

            // --- LƯU userId (DÙNG CÁCH 2: GIẢI MÃ TOKEN) ---
            try {
                const decodedToken = jwtDecode(response.data.accessToken);
                if (decodedToken && decodedToken.user_id) {
                    localStorage.setItem('userId', decodedToken.user_id);
                    console.log('Stored userId from token:', decodedToken.user_id);
                } else {
                     console.error("Không tìm thấy 'user_id' trong token payload.");
                     setError('Lỗi: Token không chứa User ID.');
                     localStorage.clear(); // Xóa hết nếu token lỗi
                     setIsLoading(false);
                     return; // Dừng lại
                }
            } catch (decodeError) {
                 console.error("Error decoding token:", decodeError);
                 setError('Lỗi giải mã token.');
                 localStorage.clear(); // Xóa hết nếu token lỗi
                 setIsLoading(false);
                 return; // Dừng lại
            }
            // --- KẾT THÚC LƯU userId ---


            // --- ĐIỀU HƯỚNG DỰA TRÊN VAI TRÒ (ĐÃ SỬA LỖI LOGIC) ---
            if (response.data.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (response.data.role === 'trainer') {
                console.log("Navigating to /trainer/schedule...");
                navigate('/trainer/schedule');
            } else if (response.data.role === 'customer') {
                console.log("Navigating to Homepage (/) ...");
                navigate('/'); // Customer quay về trang chủ
            } else {
                 // Các vai trò không xác định
                 setError('Vai trò không xác định.');
                 localStorage.clear(); // Xóa hết thông tin
            }
            // --- KẾT THÚC SỬA LỖI ---

        } catch (err) {
            console.error('Login failed:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h2>Đăng Nhập</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Tài khoản (Email):</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Nhập email của bạn"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Nhập mật khẩu"
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <div className="form-links">
                        <Link to="/register">Đăng ký tài khoản</Link>
                        <Link to="/forgot-password">Quên mật khẩu?</Link>
                    </div>
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Đang xử lý...' : 'Đăng Nhập'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;