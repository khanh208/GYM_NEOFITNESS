// src/pages/public/PackageDetailPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './PackageDetailPage.css';

function PackageDetailPage() {
    const { id } = useParams(); // gia_id
    const navigate = useNavigate();

    const [pricePackage, setPricePackage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State cho form đăng ký (cho cả 2 loại)
    const [formData, setFormData] = useState({ ho_ten: '', so_dien_thoai: '', email: '' });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    // State cho luồng Mua Ngay
    const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);
    const [buyNowLoading, setBuyNowLoading] = useState(false);

    // Biến cờ để xác định đây có phải gói thử miễn phí không
    const [isFreePackage, setIsFreePackage] = useState(false);

    useEffect(() => {
        // Kiểm tra đăng nhập
        const token = localStorage.getItem('accessToken');
        const role = localStorage.getItem('userRole');
        if (token && role === 'customer') {
            setIsCustomerLoggedIn(true);
        }

        const fetchPackageDetail = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:3000/api/pricings/${id}`);
                setPricePackage(response.data);
                
                // --- KIỂM TRA GÓI MIỄN PHÍ ---
                // Nếu giá cuối cùng là 0, đây là gói thử
                if (parseFloat(response.data.gia_cuoi_cung) === 0) {
                    setIsFreePackage(true);
                }
                // --- KẾT THÚC KIỂM TRA ---

            } catch (err) {
                setError('Không thể tải chi tiết gói tập.');
                console.error("Fetch package detail error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPackageDetail();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- HÀM SUBMIT CHUNG (CHO CẢ TƯ VẤN VÀ GÓI THỬ) ---
    // Sẽ gửi thông tin qua API /api/contacts
    const handleSubmitContactForm = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');
        setFormSuccess('');

        let noiDungDangKy = '';
        if (isFreePackage) {
            // Nội dung cho gói thử
            noiDungDangKy = `
                KHÁCH HÀNG ĐĂNG KÝ GÓI THỬ MIỄN PHÍ:
                - Gói: ${pricePackage.ten_goi_tap} (ID: ${pricePackage.gia_id})
                - Thời hạn: ${pricePackage.thoi_han}
            `;
        } else {
            // Nội dung cho gói tư vấn (gói có phí)
            noiDungDangKy = `
                KHÁCH HÀNG ĐĂNG KÝ TƯ VẤN GÓI TẬP:
                - Gói: ${pricePackage.ten_goi_tap} (ID: ${pricePackage.gia_id})
                - Giá: ${formatCurrency(pricePackage.gia_cuoi_cung)} VND
            `;
        }

        const contactData = {
            ho_ten: formData.ho_ten,
            so_dien_thoai: formData.so_dien_thoai,
            email: formData.email,
            noi_dung: noiDungDangKy
        };

        try {
            await axios.post('http://localhost:3000/api/contacts', contactData);
            setFormSuccess(isFreePackage ? 'Đăng ký tập thử thành công! Chúng tôi sẽ liên hệ để xếp lịch cho bạn.' : 'Đăng ký tư vấn thành công! Chúng tôi sẽ liên hệ với bạn ngay.');
            setFormData({ ho_ten: '', so_dien_thoai: '', email: '' }); // Reset form
        } catch (err) {
            setFormError(err.response?.data?.message || 'Gửi đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setFormLoading(false);
        }
    };
    
    // --- HÀM MUA NGAY (Chỉ cho gói có phí) ---
    const handleBuyNow = async () => {
        // ... (Logic hàm này giữ nguyên)
        if (!isCustomerLoggedIn) {
            alert("Vui lòng đăng nhập để thực hiện thanh toán.");
            navigate('/login', { state: { from: `/goi-tap/${id}` } }); 
            return;
        }
        setBuyNowLoading(true);
        setFormError('');
        setFormSuccess('');
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.post(
                'http://localhost:3000/api/payments',
                { gia_id: id },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.data.payUrl) {
                window.location.href = response.data.payUrl;
            }
        } catch (err) {
            setFormError(err.response?.data?.message || 'Không thể tạo thanh toán. Vui lòng thử lại.');
        } finally {
            setBuyNowLoading(false);
        }
    };
    
    // Hàm format tiền tệ
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return '';
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) return '';
        return new Intl.NumberFormat('vi-VN').format(numericAmount);
    };

    if (loading) return <div className="page-container" style={{ color: 'white', textAlign: 'center', paddingTop: '50px' }}><p>Đang tải...</p></div>;
    if (error) return <div className="page-container" style={{ color: 'red', textAlign: 'center', paddingTop: '50px' }}><p>{error}</p></div>;
    if (!pricePackage) return <div className="page-container" style={{ color: 'white', textAlign: 'center', paddingTop: '50px' }}><p>Không tìm thấy gói tập.</p></div>;

    return (
        <div className="package-detail-container">
            <div className="package-detail-grid">
                
                {/* --- CỘT THÔNG TIN GÓI TẬP --- */}
                <div className="package-info">
                    {/* ... (Tất cả JSX của cột thông tin gói tập giữ nguyên) ... */}
                    <span className="package-info-type">{pricePackage.thoi_han}</span>
                    <h1 className="package-info-title">{pricePackage.ten_goi_tap}</h1>
                    {/* ... (v.v...) */}
                    <div className="package-info-price">
                        <span className="final-price">{isFreePackage ? "Miễn Phí" : `${formatCurrency(pricePackage.gia_cuoi_cung)} VND`}</span>
                        {pricePackage.gia_khuyen_mai && !isFreePackage && (
                            <span className="original-price">{formatCurrency(pricePackage.gia_goc)}</span>
                        )}
                    </div>
                    {/* ... (features) ... */}
                </div>

                {/* --- CỘT FORM ĐĂNG KÝ (ĐÃ CẬP NHẬT LOGIC) --- */}
                <div className="package-register-form">
                    
                    {/* --- HIỂN THỊ TÙY THEO GÓI MIỄN PHÍ HAY CÓ PHÍ --- */}
                    
                    {isFreePackage ? (
                        
                        // --- LUỒNG 1: GÓI MIỄN PHÍ (TẬP THỬ) ---
                        <>
                            <h3>Đăng ký tập thử (Miễn phí)</h3>
                            <p>Để lại thông tin, chúng tôi sẽ liên hệ bạn để sắp xếp lịch tập thử.</p>
                            <form onSubmit={handleSubmitContactForm}>
                                <div className="form-group-contact">
                                    <label htmlFor="ho_ten">Họ & tên *</label>
                                    <input type="text" id="ho_ten" name="ho_ten" value={formData.ho_ten} onChange={handleChange} required />
                                </div>
                                <div className="form-group-contact">
                                    <label htmlFor="so_dien_thoai">Số điện thoại *</label>
                                    <input type="tel" id="so_dien_thoai" name="so_dien_thoai" value={formData.so_dien_thoai} onChange={handleChange} required />
                                </div>
                                <div className="form-group-contact">
                                    <label htmlFor="email">Email</label>
                                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
                                </div>
                                
                                {formSuccess && <p className="contact-success-message">{formSuccess}</p>}
                                {formError && <p className="contact-error-message">{formError}</p>}

                                <button type="submit" className="hero-button" disabled={formLoading}>
                                    {formLoading ? 'Đang gửi...' : 'Đăng ký thử miễn phí'}
                                </button>
                            </form>
                        </>

                    ) : (

                        // --- LUỒNG 2: GÓI CÓ PHÍ (TƯ VẤN / MUA NGAY) ---
                        <>
                            <h3>Thanh toán trực tiếp</h3>
                            <p>Dành cho khách hàng đã có tài khoản. Thanh toán qua Momo và kích hoạt gói ngay.</p>
                            <button 
                                className="hero-button" 
                                onClick={handleBuyNow} 
                                disabled={buyNowLoading}
                                style={{ backgroundColor: '#4CAF50', width: '100%', marginBottom: '10px' }}
                            >
                                {buyNowLoading ? 'Đang tạo...' : (isCustomerLoggedIn ? 'Mua ngay qua Momo' : 'Đăng nhập để Mua ngay')}
                            </button>
                            
                            <div className="form-divider">
                                <span>HOẶC</span>
                            </div>

                            <h3>Đăng ký tư vấn (Miễn phí)</h3>
                            <p>Để lại thông tin, chúng tôi sẽ gọi lại cho bạn.</p>
                            <form onSubmit={handleSubmitContactForm}>
                                <div className="form-group-contact">
                                    <label htmlFor="ho_ten">Họ & tên *</label>
                                    <input type="text" id="ho_ten" name="ho_ten" value={formData.ho_ten} onChange={handleChange} required />
                                </div>
                                <div className="form-group-contact">
                                    <label htmlFor="so_dien_thoai">Số điện thoại *</label>
                                    <input type="tel" id="so_dien_thoai" name="so_dien_thoai" value={formData.so_dien_thoai} onChange={handleChange} required />
                                </div>
                                
                                {formSuccess && <p className="contact-success-message">{formSuccess}</p>}
                                {formError && <p className="contact-error-message">{formError}</p>}

                                <button type="submit" className="hero-button" disabled={formLoading}>
                                    {formLoading ? 'Đang gửi...' : 'Gửi đăng ký tư vấn'}
                                </button>
                            </form>
                        </>
                    )}
                    
                </div>
            </div>
        </div>
    );
}

export default PackageDetailPage;