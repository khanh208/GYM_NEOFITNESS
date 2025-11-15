// src/pages/auth/ForgotPasswordPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css'; // Tái sử dụng CSS của trang Login

function ForgotPasswordPage() {
    const [step, setStep] = useState(1); // 1: Gửi Email, 2: Đặt lại Mật khẩu
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // --- Bước 1: Yêu cầu gửi OTP ---
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await axios.post('http://localhost:3000/api/auth/forgot-password', { email });
            setSuccess(`Đã gửi mã OTP đến ${email}. Vui lòng kiểm tra email của bạn.`);
            setLoading(false);
            setStep(2); // Chuyển sang bước 2
        } catch (err) {
            setError(err.response?.data?.message || 'Email không tồn tại hoặc có lỗi xảy ra.');
            setLoading(false);
        }
    };

    // --- Bước 2: Đặt lại mật khẩu bằng OTP ---
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await axios.post('http://localhost:3000/api/auth/reset-password', {
                email: email,
                otp: otp,
                newPassword: newPassword
            });
            
            setLoading(false);
            alert('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
            navigate('/login'); // Chuyển về trang đăng nhập
            
        } catch (err) {
            setError(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                
                {/* --- Form Yêu cầu OTP (Bước 1) --- */}
                {step === 1 && (
                    <>
                        <h2>Lấy lại mật khẩu</h2>
                        <p style={{ textAlign: 'center', color: '#eee', marginTop: '-15px', marginBottom: '15px' }}>
                            Nhập email của bạn để nhận mã OTP.
                        </p>
                        <form onSubmit={handleRequestOtp}>
                            <div className="form-group">
                                <label htmlFor="email">Email đã đăng ký:</label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                />
                            </div>
                            
                            {error && <p className="error-message">{error}</p>}
                            
                            <button type="submit" disabled={loading}>
                                {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                            </button>
                            <div className="form-links" style={{ justifyContent: 'center', marginTop: '15px' }}>
                                <Link to="/login">Quay lại Đăng nhập</Link>
                            </div>
                        </form>
                    </>
                )}

                {/* --- Form Đặt lại Mật khẩu (Bước 2) --- */}
                {step === 2 && (
                    <>
                        <h2>Nhập thông tin mới</h2>
                        {success && <p className="contact-success-message" style={{textAlign: 'center'}}>{success}</p>}
                        
                        <form onSubmit={handleResetPassword}>
                            <div className="form-group">
                                <label htmlFor="otp">Mã OTP:</label>
                                <input 
                                    type="text" 
                                    id="otp" 
                                    value={otp} 
                                    onChange={(e) => setOtp(e.target.value)} 
                                    required 
                                    placeholder="Kiểm tra email của bạn"
                                />
                            </div>
                             <div className="form-group">
                                <label htmlFor="newPassword">Mật khẩu mới:</label>
                                <input 
                                    type="password" 
                                    id="newPassword" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    required 
                                    placeholder="Nhập mật khẩu mới"
                                />
                            </div>
                            
                            {error && <p className="error-message">{error}</p>}
                            
                            <button type="submit" disabled={loading}>
                                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                            </button>
                        </form>
                    </>
                )}

            </div>
        </div>
    );
}

export default ForgotPasswordPage;