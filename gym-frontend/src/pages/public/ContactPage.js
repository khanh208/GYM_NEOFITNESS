// src/pages/public/ContactPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ContactPage.css'; // Sẽ tạo file CSS sau

function ContactPage() {
    // State cho dữ liệu form
    const [formData, setFormData] = useState({
        ho_ten: '',
        so_dien_thoai: '',
        email: '',
        co_so_id: '', // Sẽ là chi_nhanh_id
        dich_vu_id: '',
        noi_dung: ''
    });
    
    // State cho dropdowns
    const [branches, setBranches] = useState([]);
    const [services, setServices] = useState([]);
    
    // State cho trạng thái gửi
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch dữ liệu cho dropdowns khi component tải
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const [branchRes, serviceRes] = await Promise.all([
                    axios.get('http://localhost:3000/api/branches'),
                    axios.get('http://localhost:3000/api/services')
                ]);
                setBranches(branchRes.data);
                setServices(serviceRes.data);
            } catch (err) {
                console.error("Failed to fetch dropdown data:", err);
                setError("Không thể tải danh sách cơ sở/dịch vụ.");
            }
        };
        fetchDropdownData();
    }, []); // Chạy 1 lần

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Lấy dữ liệu cần thiết cho API /api/contacts
        const contactData = {
            ho_ten: formData.ho_ten,
            so_dien_thoai: formData.so_dien_thoai,
            email: formData.email,
            // Thêm thông tin cơ sở và dịch vụ vào nội dung
            noi_dung: `
                Cơ sở quan tâm: ${formData.co_so_id || 'Chưa chọn'}
                Dịch vụ quan tâm: ${formData.dich_vu_id || 'Chưa chọn'}
                ---
                Nội dung: ${formData.noi_dung}
            `
        };

        try {
            await axios.post('http://localhost:3000/api/contacts', contactData);
            setSuccess('Gửi yêu cầu thành công! Chúng tôi sẽ liên hệ với bạn sớm.');
            // Xóa form
            setFormData({
                ho_ten: '', so_dien_thoai: '', email: '',
                co_so_id: '', dich_vu_id: '', noi_dung: ''
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-page-container">
            <div className="contact-grid">
                
                {/* --- CỘT FORM GỬI YÊU CẦU --- */}
                <div className="contact-form-section">
                    <h2 className="contact-title">Gửi yêu cầu tư vấn</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group-contact">
                                <label htmlFor="ho_ten">Họ & tên</label>
                                <input type="text" id="ho_ten" name="ho_ten" value={formData.ho_ten} onChange={handleChange} required />
                            </div>
                            <div className="form-group-contact">
                                <label htmlFor="so_dien_thoai">Số điện thoại</label>
                                <input type="tel" id="so_dien_thoai" name="so_dien_thoai" value={formData.so_dien_thoai} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-group-contact">
                            <label htmlFor="email">Email (Tùy chọn)</label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="form-row">
                            <div className="form-group-contact">
                                <label htmlFor="co_so_id">Cơ sở</label>
                                <select name="co_so_id" value={formData.co_so_id} onChange={handleChange}>
                                    <option value="">-- Chọn cơ sở --</option>
                                    {branches.map(b => (
                                        <option key={b.chi_nhanh_id} value={b.ten_chi_nhanh}>{b.ten_chi_nhanh}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group-contact">
                                <label htmlFor="dich_vu_id">Dịch vụ quan tâm</label>
                                <select name="dich_vu_id" value={formData.dich_vu_id} onChange={handleChange}>
                                    <option value="">-- Chọn dịch vụ --</option>
                                    {services.map(s => (
                                        <option key={s.dich_vu_id} value={s.ten}>{s.ten}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-group-contact">
                            <label htmlFor="noi_dung">Mục tiêu của bạn</label>
                            <textarea id="noi_dung" name="noi_dung" value={formData.noi_dung} onChange={handleChange} rows="4" placeholder="Ví dụ: giảm 5kg trong 2 tháng, cải thiện đau lưng..."></textarea>
                        </div>
                        
                        {/* Thông báo thành công hoặc lỗi */}
                        {success && <p className="contact-success-message">{success}</p>}
                        {error && <p className="contact-error-message">{error}</p>}

                        <button type="submit" className="hero-button contact-submit-btn" disabled={loading}>
                            {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                        </button>
                    </form>
                </div>

                {/* --- CỘT THÔNG TIN LIÊN HỆ --- */}
                <div className="contact-info-section">
                    <h2 className="contact-title">Hỗ trợ khách hàng</h2>
                    <ul>
                        <li><strong>Hotline:</strong> 1900 636 888 (7:00-22:00)</li>
                        <li><strong>Email:</strong> support@neofitness.vn</li>
                        <li><strong>Thời gian phản hồi:</strong> 15-30 phút</li>
                    </ul>

                    <h2 className="contact-title" style={{ marginTop: '30px' }}>Địa chỉ các cơ sở</h2>
                    <ul>
                        {/* Tải động danh sách cơ sở */}
                        {branches.map(b => (
                             <li key={b.chi_nhanh_id}>
                                <strong>{b.ten_chi_nhanh}:</strong> {b.dia_chi} (Mở cửa: {b.gio_mo_cua || 'N/A'})
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </div>
    );
}

export default ContactPage;