// src/pages/FaqFormPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function FaqFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = id !== undefined && id !== 'new';

    const [formData, setFormData] = useState({ cau_hoi: '', cau_tra_loi: '' });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditing);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditing) {
            const fetchFaqData = async () => {
                setError('');
                // const token = localStorage.getItem('accessToken'); // If GET /:id needs token
                try {
                    const response = await axios.get(`http://localhost:3000/api/faqs/${id}`); // TODO: Add GET /:id API for FAQs
                    const data = response.data;
                    setFormData({
                        cau_hoi: data.cau_hoi || '',
                        cau_tra_loi: data.cau_tra_loi || ''
                    });
                } catch (err) {
                    setError('Không thể tải dữ liệu câu hỏi.');
                    console.error("Fetch FAQ error:", err);
                } finally {
                    setInitialLoading(false);
                }
            };
            fetchFaqData();
        } else {
            setInitialLoading(false);
        }
    }, [id, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            setLoading(false);
            return;
        }

        const url = isEditing ? `http://localhost:3000/api/faqs/${id}` : 'http://localhost:3000/api/faqs';
        const method = isEditing ? 'put' : 'post';

        try {
            await axios({
                method: method,
                url: url,
                data: formData,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            navigate('/admin/faqs');
        } catch (err) {
             setError(err.response?.data?.message || `Lỗi khi ${isEditing ? 'cập nhật' : 'tạo'} câu hỏi.`);
             console.error("Submit error:", err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

     if (initialLoading) {
        return <p>Đang tải dữ liệu...</p>;
    }

    return (
        <div>
            <h2>{isEditing ? 'Chỉnh sửa Câu Hỏi' : 'Tạo Câu Hỏi Mới'}</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Câu Hỏi: </label>
                    <textarea name="cau_hoi" value={formData.cau_hoi} onChange={handleChange} required rows="3"/>
                </div>
                 <div>
                    <label>Câu Trả Lời: </label>
                    <textarea name="cau_tra_loi" value={formData.cau_tra_loi} onChange={handleChange} required rows="5"/>
                </div>
                <button type="submit" className="add-button" disabled={loading || initialLoading}>
                    {loading ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Tạo mới')}
                </button>
                 <button type="button" className="cancel-button" onClick={() => navigate('/admin/faqs')} disabled={loading}>
                    Hủy
                </button>
            </form>
        </div>
    );
}

export default FaqFormPage;