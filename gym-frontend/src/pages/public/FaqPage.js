// src/pages/public/FaqPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FaqPage.css'; // Sẽ tạo file CSS sau

// Component con FaqItem (giống như ở HomePage)
const FaqItem = ({ faq }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="faq-item-page">
            <button className="faq-question-page" onClick={() => setIsOpen(!isOpen)}>
                <span>{faq.cau_hoi}</span>
                <span>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
                <div className="faq-answer-page">
                    <p>{faq.cau_tra_loi}</p>
                </div>
            )}
        </div>
    );
};

function FaqPage() {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFaqs = async () => {
            setLoading(true);
            try {
                const response = await axios.get('http://localhost:3000/api/faqs');
                setFaqs(response.data);
            } catch (err) {
                setError('Không thể tải dữ liệu câu hỏi.');
                console.error("Fetch FAQs error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFaqs();
    }, []); // Chạy 1 lần

    return (
        <div className="faq-page-container">
            <h1 className="faq-page-title">Câu hỏi thường gặp</h1>
            <div className="faq-list-page">
                {loading && <p>Đang tải...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && faqs.map(faq => (
                    <FaqItem key={faq.cau_hoi_id} faq={faq} />
                ))}
            </div>
        </div>
    );
}

export default FaqPage;