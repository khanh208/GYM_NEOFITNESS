// src/pages/public/PTPackagePage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './PackagePage.css'; // Tái sử dụng CSS của trang Gói tập

function PTPackagePage() {
    const [ptPackages, setPtPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPricings = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/pricings');
                
                // --- LỌC DỮ LIỆU: Chỉ lấy các gói có chữ "PT" trong tên ---
                const filtered = response.data.filter(pkg => 
                    pkg.ten_goi_tap.toLowerCase().includes('pt') || 
                    pkg.ten_goi_tap.toLowerCase().includes('huấn luyện viên')
                );
                
                setPtPackages(filtered);
            } catch (err) {
                console.error("Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPricings();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(Number(amount));
    };

    return (
        <div className="package-page-container">
            <h1 className="package-page-title">Huấn Luyện Viên Cá Nhân (PT)</h1>
            <p className="package-page-subtitle">
                Lộ trình tập luyện chuyên biệt 1:1 giúp bạn đạt mục tiêu nhanh nhất.
            </p>

            <div className="package-list-grid">
                {loading && <p>Đang tải...</p>}
                
                {!loading && ptPackages.length === 0 && (
                    <p style={{textAlign: 'center', width: '100%'}}>Hiện chưa có gói PT nào.</p>
                )}

                {!loading && ptPackages.map(price => (
                    // Tái sử dụng card từ trang Gói tập
                    <div className={`pricing-card ${price.khuyen_mai_id ? 'featured' : ''}`} key={price.gia_id}>
                        {price.khuyen_mai_id && (
                            <div className="pricing-badge">Tiết kiệm {price.giam_gia_phantram}%</div>
                        )}
                        <span className="pricing-type">1 Kèm 1</span> {/* Hardcode text cho trang PT */}
                        <h3 className="pricing-name">{price.ten_goi_tap}</h3>
                        <p className="pricing-description">
                            {price.mo_ta_goi_tap || "Tập luyện cùng chuyên gia hàng đầu."}
                        </p>
                        <div className="pricing-price">
                            {price.gia_khuyen_mai && (
                                <span className="original-price">{formatCurrency(price.gia_goc)}</span>
                            )}
                            {formatCurrency(price.gia_cuoi_cung)}
                            <span className="pricing-unit">/gói</span>
                        </div>
                        <ul className="pricing-features">
                            <li>Cam kết hiệu quả</li>
                            <li>Lịch tập linh hoạt</li>
                            {price.ca_buoi > 0 && <li>Tổng {price.ca_buoi} buổi tập</li>}
                        </ul>
                        <button 
                            className="pricing-button"
                            onClick={() => navigate(`/goi-tap/${price.gia_id}`)}
                        >
                            Đăng ký ngay
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PTPackagePage;