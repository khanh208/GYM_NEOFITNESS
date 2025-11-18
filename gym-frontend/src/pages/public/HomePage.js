// src/pages/public/HomePage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import './HomePage.css';
import heroImage from '../../assets/Gym_layout.jpg'; // Đảm bảo đường dẫn này đúng

// --- Component FAQ Item (Cho Accordion) ---
const FaqItem = ({ faq }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="faq-item">
            <button className="faq-question" onClick={() => setIsOpen(!isOpen)}>
                <span>{faq.cau_hoi}</span>
                <span>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
                <div className="faq-answer">
                    <p>{faq.cau_tra_loi}</p>
                </div>
            )}
        </div>
    );
};
// --- Kết thúc Component FAQ Item ---


function HomePage() {
    // States để lưu dữ liệu từ API
    const [trainers, setTrainers] = useState([]); // State này sẽ lưu TẤT CẢ HLV
    const [pricings, setPricings] = useState([]); // State này sẽ lưu TẤT CẢ gói giá
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State cho Modal quảng cáo
    const [isModalOpen, setIsModalOpen] = useState(true); // Mặc định mở
    
    // State cho nút xem thêm gói giá
    const [showAllPricings, setShowAllPricings] = useState(false);
    
    // Khởi tạo useNavigate để điều hướng
    const navigate = useNavigate();

    // Fetch tất cả dữ liệu cần thiết cho trang chủ
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch song song 3 API: HLV, Giá, và FAQs
                const [trainerRes, pricingRes, faqRes] = await Promise.all([
                    axios.get('http://localhost:3000/api/trainers'),
                    axios.get('http://localhost:3000/api/pricings'),
                    axios.get('http://localhost:3000/api/faqs')
                ]);
                
                // --- SỬA LỖI LOGIC TẠI ĐÂY ---
                // 1. Kiểm tra data có tồn tại không
                // 2. Chỉ gọi setTrainers và setPricings MỘT LẦN
                
                if (trainerRes.data) {
                    setTrainers(trainerRes.data); // Lưu TẤT CẢ HLV
                } else {
                    setTrainers([]); // Đặt là mảng rỗng nếu không có data
                }
                
                if (pricingRes.data) {
                    // Sắp xếp giá từ thấp đến cao (để gói miễn phí lên đầu)
                    const sortedPricings = pricingRes.data.sort((a, b) => {
                        return parseFloat(a.gia_cuoi_cung) - parseFloat(b.gia_cuoi_cung);
                    });
                    setPricings(sortedPricings); // Lưu TẤT CẢ gói giá đã sắp xếp
                } else {
                    setPricings([]); // Đặt là mảng rỗng
                }
                
                if (faqRes.data) {
                    setFaqs(faqRes.data);
                } else {
                    setFaqs([]);
                }
                // --- KẾT THÚC SỬA ---
                
            } catch (err) {
                setError('Không thể tải dữ liệu trang chủ.');
                console.error("Fetch homepage data error:", err);
                // Đặt là mảng rỗng nếu lỗi để .slice() không bị crash
                setTrainers([]); 
                setPricings([]);
                setFaqs([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        
    }, []); // Mảng dependency rỗng, chỉ chạy 1 lần

    // Hàm format tiền tệ
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return '';
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) return '';
        return new Intl.NumberFormat('vi-VN').format(numericAmount);
    };

    // Hàm đóng modal
    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Quyết định hiển thị bao nhiêu HLV (ví dụ: 3)
    const displayedTrainers = trainers.slice(0, 3);
    // Quyết định hiển thị bao nhiêu gói giá
    const displayedPricings = showAllPricings ? pricings : pricings.slice(0, 3);


    return (
        <div className="homepage">
            
            {/* --- MODAL QUẢNG CÁO (POPUP) --- */}
            {isModalOpen && (
                <div className="popup-overlay" onClick={closeModal}> {/* Lớp mờ che phủ */}
                    <div className="popup-modal" onClick={(e) => e.stopPropagation()}> {/* Ngăn click xuyên thấu */}
                        
                        <button className="popup-close-btn" onClick={closeModal}>
                            &times; {/* Ký tự 'X' */}
                        </button>
                        
                        <div className="popup-content">
                            <h2 className="section-title">Ưu Đãi Đặc Biệt!</h2>
                            <p className="popup-title">Nhận 1 buổi PT thử + đánh giá InBody miễn phí</p>
                            <p className="popup-description">
                                Áp dụng trong tháng này cho khách hàng mới. Đừng bỏ lỡ!
                            </p>
                            {/* Sửa lại ID gói tập thử cho đúng (ví dụ: 11) */}
                            <Link 
                                to="/goi-tap/17" 
                                className="hero-button" 
                                onClick={closeModal}
                            >
                                Đăng ký ngay
                            </Link>
                        </div>
                    </div>
                </div>
            )}
            {/* --- KẾT THÚC MODAL --- */}

            {/* --- Hero Section --- */}
            <section className="hero-section">
                <div className="hero-image-container">
                    <img src={heroImage} alt="Gym Layout" className="hero-image" />
                    <div className="hero-overlay"></div>
                </div>
                <div className="hero-content">
                    <h1>Sẵn sàng nâng tầm cuộc sống của bạn?</h1>
                    <p>Hãy cùng NeoFitness kiến tạo một phiên bản bạn mạnh mẽ, khỏe khoắn và tự tin hơn!</p>
                    <Link to="/lien-he" className="hero-button">Tìm hiểu ngay</Link>
                </div>
            </section>

            {/* --- Section Đội ngũ HLV --- */}
            <section className="trainers-section">
                <div className="section-container">
                    <h2 className="section-title">Đội ngũ HLV</h2>
                    <p className="section-subtitle">HLV đạt chuẩn & chuyên môn đa lĩnh vực</p>
                    
                    <div className="trainer-list">
                        {loading && <p>Đang tải HLV...</p>}
                        {error && !loading && <p style={{ color: 'red' }}>{error}</p>}
                        
                        {!loading && !error && displayedTrainers.map(trainer => (
                            <div className="trainer-card" key={trainer.hlv_id}>
                                <div className="trainer-card-image" style={{ backgroundImage: `url(${trainer.hinh_anh && trainer.hinh_anh.startsWith('/') ? `http://localhost:3000${trainer.hinh_anh}` : trainer.hinh_anh || 'default-image-path.jpg'})` }}>
                                    {/* Ảnh HLV làm nền */}
                                </div>
                                <div className="trainer-card-content">
                                    <span className="trainer-specialty">{trainer.chung_chi || 'Chuyên môn'}</span>
                                    <h3 className="trainer-name">{trainer.ho_ten}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Section Giá Gói Tập --- */}
            <section className="pricing-section">
                <div className="section-container">
                    <h2 className="section-title">Gói linh hoạt</h2>
                    <p className="section-subtitle">Chọn cách đồng hành phù hợp</p>
                    
                    <div className="pricing-list">
                        {loading && <p>Đang tải gói tập...</p>}
                        {error && !loading && <p style={{ color: 'red' }}>{error}</p>}
                        
                        {!loading && !error && displayedPricings.map(price => (
                            <div className={`pricing-card ${price.khuyen_mai_id ? 'featured' : ''}`} key={price.gia_id}>
                                {price.khuyen_mai_id && (
                                    <div className="pricing-badge">Tiết kiệm {price.giam_gia_phantram}%</div>
                                )}
                                <span className="pricing-type">{price.thoi_han}</span>
                                <h3 className="pricing-name">{price.ten_goi_tap}</h3>
                                
                                {/* --- SỬA Ở ĐÂY: Lấy mô tả động --- */}
                                <p className="pricing-description">
                                    {price.mo_ta_goi_tap || 'Mô tả chi tiết cho gói tập này.'}
                                </p>
                                {/* --- KẾT THÚC SỬA --- */}

                                <div className="pricing-price">
                                    {price.gia_khuyen_mai !== null && (
                                        <span className="original-price">{formatCurrency(price.gia_goc)}</span>
                                    )}
                                    {formatCurrency(price.gia_cuoi_cung)}
                                    <span className="pricing-unit">/gói</span>
                                </div>
                                
                                {/* --- SỬA Ở ĐÂY: Lấy số buổi động --- */}
                                <ul className="pricing-features">
                                    {/* Chỉ hiển thị dòng này nếu 'ca_buoi' có giá trị (lớn hơn 0) */}
                                    {price.ca_buoi > 0 && (
                                        <li>Combo {price.ca_buoi} buổi</li>
                                    )}
                                    
                                    {/* (Bạn có thể thêm các feature tĩnh khác nếu muốn) */}
                                    <li>Giá tính cho 1 người</li>
                                </ul>
                                {/* --- KẾT THÚC SỬA --- */}

                                <button 
                                    className="pricing-button"
                                    onClick={() => navigate(`/goi-tap/${price.gia_id}`)}
                                >
                                    {price.khuyen_mai_id ? 'Bắt đầu ngay' : 'Xem chi tiết'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Nút Xem thêm/Thu gọn */}
                    {pricings.length > 3 && (
                        <div className="show-all-container">
                            <button className="show-all-button" onClick={() => setShowAllPricings(!showAllPricings)}>
                                {showAllPricings ? 'Thu gọn' : 'Xem tất cả các gói'}
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* --- Section "4 Bước" --- */}
            <section className="steps-section">
                <div className="section-container">
                    <h2 className="section-title">Quy trình</h2>
                    <p className="section-subtitle">4 bước để bạn tiến bộ an toàn</p>
                    <div className="steps-grid">
                        <div className="step-card">
                            <span className="step-number">1</span>
                            <h3 className="step-title">Đánh giá ban đầu</h3>
                            <p className="step-description">
                                InBody, test động tác, lịch sử tập luyện & mục tiêu.
                            </p>
                        </div>
                        <div className="step-card">
                            <span className="step-number">2</span>
                            <h3 className="step-title">Lập kế hoạch</h3>
                            <p className="step-description">
                                Chia giai đoạn – tải/volume phù hợp lịch rảnh của bạn.
                            </p>
                        </div>
                        <div className="step-card">
                            <span className="step-number">3</span>
                            <h3 className="step-title">Kèm cặp kỹ thuật</h3>
                            <p className="step-description">
                                Cueing – kiểm soát form & nhịp thở, tăng dần mức khó.
                            </p>
                        </div>
                        <div className="step-card">
                            <span className="step-number">4</span>
                            <h3 className="step-title">Đo & tối ưu</h3>
                            <p className="step-description">
                                Báo cáo tiến độ mỗi tuần, điều chỉnh để không chững.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Section "FAQs" --- */}
            <section className="faq-section">
                <div className="section-container">
                    <h2 className="section-title">Giải đáp nhanh</h2>
                    <p className="section-subtitle">Câu hỏi thường gặp</p>

                    <div className="faq-list">
                        {loading && <p>Đang tải FAQs...</p>}
                        {error && !loading && <p style={{ color: 'red' }}>{error}</p>}
                        
                        {!loading && !error && faqs.map(faq => (
                            <FaqItem key={faq.cau_hoi_id} faq={faq} />
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Section "Call to Action (CTA)" --- */}
            <section className="cta-section">
                <div className="section-container cta-container">
                    <div className="cta-content">
                        <h2 className="section-title">Ưu đãi mở thẻ</h2>
                        <p className="cta-title">Nhận 1 buổi PT thử + đánh giá InBody miễn phí</p>
                        <p className="cta-description">
                            Áp dụng trong tháng này cho khách hàng mới tại tất cả cơ sở NeoFitness.
                        </p>
                    </div>
                    <div className="cta-action">
                         {/* Sửa lại ID gói tập thử cho đúng (ví dụ: 11) */}
                        <Link 
                            to="/goi-tap/17" 
                            className="hero-button" 
                            onClick={closeModal}
                        >
                            Đăng ký ngay
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default HomePage;