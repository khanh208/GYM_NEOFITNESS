// src/pages/public/BookingPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './BookingPage.css';

function BookingPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        gkh_id: '',
        dich_vu_id: '',
        chi_nhanh_id: '',
        hlv_id: '',
        thoi_gian: ''
    });
    
    // State cho dropdowns
    const [myPackages, setMyPackages] = useState([]);
    const [services, setServices] = useState([]);
    const [branches, setBranches] = useState([]);
    const [trainers, setTrainers] = useState([]);
    
    const [loading, setLoading] = useState(true); // Chỉ loading chung ban đầu
    const [error, setError] = useState(''); // Lỗi chung
    const [success, setSuccess] = useState('');

    // Fetch dữ liệu cho các dropdowns
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token || localStorage.getItem('userRole') !== 'customer') {
            alert("Vui lòng đăng nhập với tài khoản khách hàng để đặt lịch.");
            navigate('/login', { state: { from: '/dat-lich' } });
            return;
        }

        const fetchDropdownData = async () => {
            setLoading(true);
            setError(''); // Xóa lỗi cũ
            let fetchError = false; // Cờ báo lỗi

            // --- SỬA LẠI LOGIC FETCH ---
            // 1. Fetch các gói của tôi (Bắt buộc)
            try {
                const myPkgRes = await axios.get('http://localhost:3000/api/customer/my-packages', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const activePackages = myPkgRes.data.filter(pkg => pkg.trang_thai === 'active');
                setMyPackages(activePackages);
                if (activePackages.length === 0) {
                     setError("Bạn không có gói tập nào đang hoạt động để đặt lịch.");
                     fetchError = true; // Đặt cờ lỗi nếu không có gói
                }
            } catch (err) {
                console.error("Failed to fetch My Packages:", err);
                setError("Không thể tải các gói tập của bạn.");
                fetchError = true;
            }

            // 2. Fetch dữ liệu public (Services, Branches, Trainers)
            // Chúng ta vẫn chạy các hàm này kể cả khi fetch gói bị lỗi
            try {
                 const [svcRes, branchRes, trainerRes] = await Promise.all([
                    axios.get('http://localhost:3000/api/services'),
                    axios.get('http://localhost:3000/api/branches'),
                    axios.get('http://localhost:3000/api/trainers')
                ]);
                setServices(svcRes.data);
                setBranches(branchRes.data);
                setTrainers(trainerRes.data);
            } catch (err) {
                console.error("Failed to fetch public data:", err);
                setError(prevError => prevError + " | Lỗi tải dữ liệu Dịch vụ/Chi nhánh/HLV.");
                fetchError = true;
            }
            // --- KẾT THÚC SỬA ---

            setLoading(false);
        };
        fetchDropdownData();
    }, [navigate]); // Chỉ chạy 1 lần

    // ... (Hàm handleChange và handleSubmit giữ nguyên) ...
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Bạn cần đăng nhập để đặt lịch.');
            setLoading(false);
            navigate('/login');
            return;
        }

        try {
            await axios.post(
                'http://localhost:3000/api/bookings', 
                formData, // Gửi formData đã bao gồm gkh_id
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setSuccess('Đặt lịch thành công! Lịch của bạn đang chờ xác nhận.');
            setFormData({ gkh_id: '', dich_vu_id: '', chi_nhanh_id: '', hlv_id: '', thoi_gian: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Đặt lịch thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };


    if (loading) { // Chỉ hiển thị loading chung
        return <div className="page-container" style={{ color: 'white', textAlign: 'center', paddingTop: '50px' }}><p>Đang tải dữ liệu...</p></div>;
    }

    return (
        <div className="booking-page-container">
            <h1 className="booking-page-title">Đặt lịch hẹn</h1>
            <p className="booking-page-subtitle">Chọn dịch vụ, HLV và thời gian phù hợp với bạn.</p>
            
            <div className="booking-form-wrapper">
                {/* Hiển thị lỗi tổng */}
                {error && <p className="contact-error-message">{error}</p>}
                {success && <p className="contact-success-message">{success}</p>}
                
                <form onSubmit={handleSubmit}>
                    {/* Chọn Gói tập (Đã hoạt động) */}
                    <div className="form-group-contact">
                        <label htmlFor="gkh_id">Sử dụng Gói tập *</label>
                        <select name="gkh_id" value={formData.gkh_id} onChange={handleChange} required>
                            <option value="">-- Chọn gói bạn muốn dùng --</option>
                            {myPackages.map(pkg => (
                                <option key={pkg.gkh_id} value={pkg.gkh_id}>
                                    {pkg.ten_goi_tap} 
                                    {pkg.tong_so_buoi ? ` (còn ${pkg.tong_so_buoi - pkg.so_buoi_da_tap} buổi)` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Chọn Dịch vụ */}
                    <div className="form-group-contact">
                        <label htmlFor="dich_vu_id">Chọn Dịch vụ *</label>
                        <select name="dich_vu_id" value={formData.dich_vu_id} onChange={handleChange} required>
                            <option value="">-- Chọn một dịch vụ --</option>
                            {services.map(s => (
                                <option key={s.dich_vu_id} value={s.dich_vu_id}>{s.ten}</option>
                            ))}
                        </select>
                    </div>

                    {/* Chọn Chi nhánh */}
                    <div className="form-group-contact">
                        <label htmlFor="chi_nhanh_id">Chọn Cơ sở *</label>
                        <select name="chi_nhanh_id" value={formData.chi_nhanh_id} onChange={handleChange} required>
                            <option value="">-- Chọn cơ sở bạn muốn tập --</option>
                            {branches.map(b => (
                                <option key={b.chi_nhanh_id} value={b.chi_nhanh_id}>{b.ten_chi_nhanh}</option>
                            ))}
                        </select>
                    </div>

                    {/* Chọn HLV (Tùy chọn) */}
                    <div className="form-group-contact">
                        <label htmlFor="hlv_id">Chọn HLV (Tùy chọn)</label>
                        <select name="hlv_id" value={formData.hlv_id} onChange={handleChange}>
                            <option value="">-- Để hệ thống tự sắp xếp --</option>
                            {trainers.map(t => (
                                <option key={t.hlv_id} value={t.hlv_id}>{t.ho_ten}</option>
                            ))}
                        </select>
                    </div>

                    {/* Chọn Thời gian */}
                    <div className="form-group-contact">
                        <label htmlFor="thoi_gian">Chọn thời gian *</label>
                        <input 
                            type="datetime-local" 
                            id="thoi_gian" 
                            name="thoi_gian" 
                            value={formData.thoi_gian} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <button type="submit" className="hero-button" disabled={loading}>
                        {loading ? 'Đang gửi...' : 'Xác nhận Đặt lịch'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default BookingPage;