// src/pages/auth/RegisterPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css'; // Tái sử dụng CSS của trang Login

function RegisterPage() {
    const [step, setStep] = useState(1); // 1: Form đăng ký, 2: Form OTP
    const [formData, setFormData] = useState({
        ho_ten: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [otp, setOtp] = useState('');
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Bước 1: Xử lý Đăng ký ---
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        
        // Kiểm tra mật khẩu
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu nhập lại không khớp.');
            return;
        }
        if (formData.password.length < 6) { // Thêm kiểm tra độ dài
             setError('Mật khẩu phải có ít nhất 6 ký tự.');
             return;
        }
        
        setLoading(true);

        try {
            // Gọi API Đăng ký (backend sẽ tự gửi OTP)
            await axios.post('http://localhost:3000/api/auth/register', {
                ho_ten: formData.ho_ten,
                email: formData.email,
                password: formData.password
            });
            
            // Nếu thành công, chuyển sang Bước 2 (Nhập OTP)
            setSuccess(`Đăng ký thành công! Mã OTP đã được gửi đến ${formData.email}. Vui lòng nhập mã để kích hoạt.`);
            setLoading(false);
            setStep(2); // Chuyển sang form OTP
            
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng ký thất bại. Email có thể đã tồn tại.');
            setLoading(false);
        }
    };

    // --- Bước 2: Xử lý Xác thực OTP ---
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Gọi API Xác thực OTP
            await axios.post('http://localhost:3000/api/auth/verify-otp', {
                email: formData.email, // Dùng email đã đăng ký
                otp: otp
            });
            
            setLoading(false);
            alert('Xác thực tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.');
            navigate('/login'); // Chuyển về trang đăng nhập
            
        } catch (err) {
            setError(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
            setLoading(false);
        }
    };

    return (
        <div className="login-page"> {/* Tái sử dụng nền đen */}
            <div className="login-container"> {/* Tái sử dụng form đỏ */}
                
                {/* --- Form Đăng ký (Bước 1) --- */}
                {step === 1 && (
                    <>
                        <h2>Đăng Ký</h2>
                        <form onSubmit={handleRegister}>
                            <div className="form-group">
                                {/* Sửa lại label cho khớp thiết kế "Tên tài khoản" */}
                                <label htmlFor="ho_ten">Tên của bạn (Họ & Tên):</label>
                                <input type="text" name="ho_ten" id="ho_ten" value={formData.ho_ten} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email:</label>
                                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Mật khẩu:</label>
                                <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Nhập lại mật khẩu:</label>
                                <input type="password" name="confirmPassword" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                            </div>
                            
                            {error && <p className="error-message">{error}</p>}
                            
                            <button type="submit" disabled={loading}>
                                {loading ? 'Đang xử lý...' : 'Đăng Ký'}
                            </button>
                            <div className="form-links" style={{ justifyContent: 'center', marginTop: '15px' }}>
                                <Link to="/login">Đã có tài khoản? Đăng nhập</Link>
                            </div>
                        </form>
                    </>
                )}

                {/* --- Form OTP (Bước 2) --- */}
                {step === 2 && (
                    <>
                        <h2>Xác thực tài khoản</h2>
                        {/* Hiển thị thông báo thành công */}
                        {success && <p className="contact-success-message" style={{textAlign: 'center'}}>{success}</p>}
                        
                        <form onSubmit={handleVerifyOtp}>
                            <div className="form-group">
                                <label htmlFor="otp">Mã OTP (Kiểm tra email):</label>
                                <input 
                                    type="text" 
                                    id="otp" 
                                    value={otp} 
                                    onChange={(e) => setOtp(e.target.value)} 
                                    required 
                                    placeholder="Nhập mã OTP 5 số"
                                />
                            </div>
                            
                            {error && <p className="error-message">{error}</p>}
                            
                            <button type="submit" disabled={loading}>
                                {loading ? 'Đang xác thực...' : 'Xác thực'}
                            </button>
                            {/* (Tùy chọn) Thêm nút gửi lại OTP sau */}
                        </form>
                    </>
                )}

            </div>
        </div>
    );
}

export default RegisterPage;