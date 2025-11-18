// src/pages/public/ServicePublicPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ServicePublicPage.css';

function ServicePublicPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                // Gọi API lấy danh sách dịch vụ
                const response = await axios.get('http://localhost:3000/api/services');
                setServices(response.data);
            } catch (err) {
                console.error("Error fetching services:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    return (
        <div className="service-page-container">
            <div className="service-header">
                <h1>Dịch vụ & Bộ môn</h1>
                <p>Đa dạng các bộ môn tập luyện đẳng cấp quốc tế tại NeoFitness</p>
            </div>

            {loading ? (
                <p style={{color: 'white', textAlign: 'center'}}>Đang tải...</p>
            ) : (
                <div className="service-grid">
                    {services.map(service => (
                        <div className="service-card" key={service.dich_vu_id}>
                            <div className="service-icon">🏋️</div> {/* Bạn có thể thay bằng ảnh nếu DB có cột ảnh */}
                            <h3>{service.ten}</h3>
                            <p>{service.mo_ta}</p>
                            {/* Hiển thị chi nhánh nếu có */}
                            <span className="service-branch">
                                📍 {service.ten_chi_nhanh || 'Tất cả chi nhánh'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ServicePublicPage;