// src/pages/FaqListPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function FaqListPage() {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchFaqs = async () => {
        setError('');
        setLoading(true);
        // GET /faqs is public
        try {
            const response = await axios.get('http://localhost:3000/api/faqs');
            setFaqs(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch FAQs.');
            console.error("Fetch FAQs error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaqs();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm(`Bạn có chắc muốn xóa câu hỏi ID ${id}?`)) return;

        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            return;
        }
        setError('');
        try {
            await axios.delete(`http://localhost:3000/api/faqs/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` } // Needs Admin token
            });
            fetchFaqs(); // Reload list
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa câu hỏi.');
            console.error("Delete FAQ error:", err.response || err);
        }
    };

    return (
        <div>
            <h2>Quản lý Câu hỏi thường gặp (FAQs)</h2>
            <button
                onClick={() => navigate('/admin/faqs/new')}
                className="add-button"
                style={{ marginBottom: '15px' }}
            >
                Thêm Câu hỏi mới
            </button>

            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {!loading && !error && (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Câu Hỏi</th>
                            <th>Câu Trả Lời</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {faqs.map(faq => (
                            <tr key={faq.cau_hoi_id}>
                                <td>{faq.cau_hoi_id}</td>
                                <td>{faq.cau_hoi}</td>
                                <td>{faq.cau_tra_loi}</td>
                                <td>
                                    <button
                                        onClick={() => navigate(`/admin/faqs/${faq.cau_hoi_id}/edit`)}
                                        className="edit-button"
                                    >
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(faq.cau_hoi_id)}
                                        className="delete-button"
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default FaqListPage;