// src/pages/public/CustomerProfilePage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react'; // Import QR Code
import './CustomerProfilePage.css';
// Bạn cần đảm bảo đã copy CSS cho popup vào file CustomerProfilePage.css
// Ví dụ: .popup-overlay, .popup-modal, .popup-close-btn

function CustomerProfilePage() {
    const [myPackages, setMyPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // State cho Popup Hủy
    const [cancelReason, setCancelReason] = useState('');
    const [showCancelPopup, setShowCancelPopup] = useState(null); // Lưu gkh_id
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    // --- KHAI BÁO STATE CÒN THIẾU ---
    const [formLoading, setFormLoading] = useState(false);
    // --- KẾT THÚC SỬA ---
    
    // State để lưu khach_id cho QR Code
    const [khachId, setKhachId] = useState(null);

    // Hàm format tiền tệ
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return '';
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) return '';
        return new Intl.NumberFormat('vi-VN').format(numericAmount);
    };
    
    // Hàm fetch gói tập
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

            // Lấy khach_id từ gói đầu tiên để tạo mã QR
            if (response.data.length > 0) {
                setKhachId(response.data[0].khach_id);
            }

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

    // Chạy fetch khi component mount
    useEffect(() => {
        fetchMyPackages();
    }, [navigate]); // Thêm navigate vào dependency array

    // Hàm xử lý gửi yêu cầu hủy
    const handleRequestCancellation = async (e) => {
        e.preventDefault();
        if (!cancelReason) {
            setFormError('Vui lòng cho biết lý do hủy.');
            return;
        }
        
        const token = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');
        const pkgToCancel = myPackages.find(p => p.gkh_id === showCancelPopup);
        
        setFormLoading(true); // Sử dụng state đã khai báo
        setFormError('');
        setFormSuccess('');

        const contactData = {
            ho_ten: `Khách hàng (ID: ${pkgToCancel.khach_id})`,
            email: `user_id_${userId}@system.com`, // (Nên lấy email thật từ profile)
            noi_dung: `
                YÊU CẦU HỦY GÓI TẬP:
                - Gói KH ID (gkh_id): ${pkgToCancel.gkh_id}
                - Tên Gói: ${pkgToCancel.ten_goi_tap}
                - Ngày kích hoạt: ${new Date(pkgToCancel.ngay_kich_hoat).toLocaleDateString('vi-VN')}
                - Lý do: ${cancelReason}
            `
        };

        try {
            // API contacts cũng cần token nếu route được bảo vệ
            await axios.post('http://localhost:3000/api/contacts', contactData, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            setFormSuccess('Gửi yêu cầu hủy thành công! Admin sẽ liên hệ với bạn để xử lý.');
            setShowCancelPopup(null); // Đóng popup
            setCancelReason('');
        } catch (err) {
            setFormError('Gửi yêu cầu thất bại. Vui lòng thử lại.');
        } finally {
            setFormLoading(false); // Sử dụng state đã khai báo
        }
    };

    if (loading) return <div className="page-container" style={{ color: 'white', textAlign: 'center', paddingTop: '50px' }}><p>Đang tải gói tập của bạn...</p></div>;
    if (error) return <div className="page-container" style={{ color: 'red', textAlign: 'center', paddingTop: '50px' }}><p>{error}</p></div>;

    return (
        <div className="customer-profile-container">
            <h1 className="profile-title">Hồ sơ của tôi</h1>

            {/* --- MÃ QR --- */}
            <div className="qr-code-container" style={{ textAlign: 'center', backgroundColor: 'white', padding: '20px', borderRadius: '10px', width: 'fit-content', margin: '20px auto', border: '5px solid #d32f2f' }}>
                <p style={{ color: 'black', margin: 0, fontWeight: 'bold' }}>Đưa mã này cho lễ tân để Check-in</p>
                {khachId ? (
                     <QRCodeSVG value={JSON.stringify({ khach_id: khachId })} size={200} />
                ) : (
                    <p style={{ color: 'red' }}>{loading ? 'Đang tải mã QR...' : 'Không tìm thấy ID Khách hàng.'}</p>
                )}
            </div>
            {/* --- KẾT THÚC MÃ QR --- */}

            <p className="profile-subtitle">Tổng quan các gói tập bạn đã mua tại NeoFitness.</p>

            {/* POPUP HỦY GÓI */}
            {showCancelPopup && (
                <div className="popup-overlay" onClick={() => setShowCancelPopup(null)}>
                    <div className="popup-modal" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#1e1e1e', color: 'white', maxWidth: '500px' }}>
                        <button className="popup-close-btn" onClick={() => setShowCancelPopup(null)}>&times;</button>
                        <h3>Yêu cầu Hủy Gói</h3>
                        <p>Vui lòng cho biết lý do bạn muốn hủy gói. Admin sẽ xem xét và liên hệ lại với bạn.</p>
                        <form onSubmit={handleRequestCancellation}>
                            <div className="form-group-contact"> 
                                <label htmlFor="cancelReason">Lý do hủy (*):</label>
                                <textarea 
                                    id="cancelReason" 
                                    value={cancelReason} 
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    rows="4"
                                    required
                                    style={{ backgroundColor: '#2c2c2c', color: 'white', width: '100%', boxSizing: 'border-box', padding: '10px' }}
                                />
                            </div>
                            {formSuccess && <p className="contact-success-message">{formSuccess}</p>}
                            {formError && <p className="contact-error-message">{formError}</p>}
                            <button type="submit" className="hero-button delete-button" disabled={formLoading}>
                                {formLoading ? 'Đang gửi...' : 'Xác nhận gửi yêu cầu'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* KẾT THÚC POPUP */}

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
                                     pkg.trang_thai === 'used' ? 'Đã dùng hết' : 
                                     pkg.trang_thai === 'pending' ? 'Chờ kích hoạt' : 
                                     pkg.trang_thai === 'cancelled' ? 'Đã hủy' : 
                                     pkg.trang_thai}
                                </span>
                            </div>
                            <div className="package-details">
                                <p><strong>Thời hạn:</strong> {pkg.thoi_han || 'Không giới hạn'}</p>
                                <p><strong>Giá mua:</strong> {formatCurrency(pkg.so_tien_thanh_toan)} VND</p>
                                <p><strong>Kích hoạt:</strong> {new Date(pkg.ngay_kich_hoat).toLocaleDateString('vi-VN')}</p>
                                {pkg.ngay_het_han && (
                                    <p><strong>Hết hạn:</strong> {new Date(pkg.ngay_het_han).toLocaleDateString('vi-VN')}</p>
                                )}
                                {pkg.tong_so_buoi !== null && (
                                    <p>
                                        <strong>Buổi tập:</strong> {pkg.so_buoi_da_tap} / {pkg.tong_so_buoi} buổi
                                    </p>
                                )}
                            </div>
                            
                            {/* Nút hủy chỉ hiển thị khi gói đang active hoặc pending */}
                            {(pkg.trang_thai === 'active' || pkg.trang_thai === 'pending') && (
                                 <button 
                                    className="cancel-package-button"
                                    onClick={() => {
                                        setShowCancelPopup(pkg.gkh_id); // Mở popup với ID gói này
                                        setFormError(''); 
                                        setFormSuccess('');
                                    }}
                                >
                                    Yêu cầu Hủy gói
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CustomerProfilePage;