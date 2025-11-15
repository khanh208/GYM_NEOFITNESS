// ...existing code...
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './PackagePage.css'; // Sẽ tạo file CSS riêng

function PackagePage() {
    const [pricings, setPricings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPricings = async () => {
            setLoading(true);
            try {
                // Gọi API public để lấy tất cả các mức giá
                const response = await axios.get('http://localhost:3000/api/pricings');
                
                const sortedData = response.data.sort((a, b) => {
                    return parseFloat(a.gia_cuoi_cung) - parseFloat(b.gia_cuoi_cung);
                });
                // --- KẾT THÚC SẮP XẾP ---
                
                setPricings(sortedData); // Lấy tất cả
            } catch (err) {
                setError('Không thể tải dữ liệu gói tập.');
                console.error("Fetch pricings error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPricings();
    }, []); // Chạy 1 lần

    // Hàm format tiền tệ (có thể đưa ra file utils dùng chung sau)
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return '';
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) return '';
        return new Intl.NumberFormat('vi-VN').format(numericAmount);
    };

    return (
        <div className="package-page-container">
            <h1 className="package-page-title">Gói tập & Giá</h1>
            <p className="package-page-subtitle">Chọn gói tập phù hợp nhất với mục tiêu của bạn.</p>

            <div className="package-list-grid">
                {loading && <p>Đang tải...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
                {!loading && !error && pricings.map(price => (
                    // Tái sử dụng CSS từ HomePage
                    <div className={`pricing-card ${price.khuyen_mai_id ? 'featured' : ''}`} key={price.gia_id}>
                        {price.khuyen_mai_id && (
                            <div className="pricing-badge">Tiết kiệm {price.giam_gia_phantram}%</div>
                        )}
                        <span className="pricing-type">{price.thoi_han}</span>
                        <h3 className="pricing-name">{price.ten_goi_tap}</h3>
                        <p className="pricing-description">
                            {/* TODO: Mô tả chi tiết hơn */}
                            Mô tả ngắn về gói tập này...
                        </p>
                        <div className="pricing-price">
                            {price.gia_khuyen_mai && (
                                <span className="original-price">{formatCurrency(price.gia_goc)}</span>
                            )}
                            {formatCurrency(price.gia_cuoi_cung)}
                            <span className="pricing-unit">/gói</span>
                        </div>
                        <ul className="pricing-features">
                            {/* TODO: Thêm features từ DB */}
                            <li>Combo 12 buổi: ...</li>
                            <li>Giá tính cho 2 người</li>
                        </ul>
                        <Link to={`/goi-tap/${price.gia_id}`} className="pricing-button">
                            {price.khuyen_mai_id ? 'Đăng ký ngay' : 'Liên hệ tư vấn'}
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PackagePage;
// ...existing code...