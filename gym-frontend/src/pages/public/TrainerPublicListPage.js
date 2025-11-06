// src/pages/public/TrainerPublicListPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Dùng Link nếu bạn muốn làm trang chi tiết HLV
import './TrainerPublicListPage.css'; // Sẽ tạo file CSS riêng

function TrainerPublicListPage() {
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTrainers = async () => {
            setLoading(true);
            try {
                // Gọi API public để lấy tất cả HLV
                const response = await axios.get('http://localhost:3000/api/trainers');
                setTrainers(response.data); // Lấy tất cả HLV
            } catch (err) {
                setError('Không thể tải dữ liệu Huấn luyện viên.');
                console.error("Fetch trainers error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTrainers();
    }, []); // Chạy 1 lần

    return (
        <div className="trainer-page-container">
            <h1 className="trainer-page-title">Đội ngũ Huấn luyện viên</h1>
            <p className="trainer-page-subtitle">Những chuyên gia hàng đầu luôn sẵn sàng đồng hành cùng bạn.</p>

            <div className="trainer-list-grid">
                {loading && <p>Đang tải...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
                {!loading && !error && trainers.map(trainer => (
                    // Tái sử dụng CSS .trainer-card từ HomePage
                    // Bạn có thể tạo file CSS riêng nếu muốn
                    <div className="trainer-card" key={trainer.hlv_id}>
                        <div 
                            className="trainer-card-image" 
                            style={{ backgroundImage: `url(${trainer.hinh_anh.startsWith('/') ? `http://localhost:3000${trainer.hinh_anh}` : trainer.hinh_anh})` }}
                        >
                            {/* Ảnh HLV làm nền */}
                        </div>
                        <div className="trainer-card-content">
                            <span className="trainer-specialty">{trainer.chung_chi || 'Chuyên môn'}</span>
                            <h3 className="trainer-name">{trainer.ho_ten}</h3>
                            <p className="trainer-description">
                                {trainer.mo_ta || `Kinh nghiệm ${trainer.kinh_nghiem || 0} năm.`}
                            </p>
                            {/* Thêm nút xem chi tiết nếu muốn */}
                            {/* <Link to={`/hlv-ca-nhan/${trainer.hlv_id}`} className="trainer-detail-button">Xem chi tiết</Link> */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TrainerPublicListPage;