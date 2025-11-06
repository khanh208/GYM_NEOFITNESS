// src/pages/ContactListPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import { useNavigate } from 'react-router-dom'; // Keep for potential detail view

function ContactListPage() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // const navigate = useNavigate();

    // Fetch contact requests
    const fetchContacts = async () => {
        setError('');
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            setLoading(false);
            return;
        }
        try {
            const response = await axios.get('http://localhost:3000/api/contacts', {
                headers: { 'Authorization': `Bearer ${token}` } // Admin only API
            });
            setContacts(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch contact requests.');
            console.error("Fetch contacts error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    // Handle updating status
    const handleUpdateStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'moi' ? 'da xu ly' : 'moi'; // Toggle status
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            return;
        }
        setError('');
        try {
            await axios.put(`http://localhost:3000/api/contacts/${id}`,
                { trang_thai: newStatus },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            fetchContacts(); // Reload list
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái.');
            console.error("Update contact status error:", err.response || err);
        }
    };


    // Handle deleting request
    const handleDelete = async (id) => {
        if (!window.confirm(`Bạn có chắc muốn xóa yêu cầu liên hệ ID ${id}?`)) return;

        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            return;
        }
        setError('');
        try {
            await axios.delete(`http://localhost:3000/api/contacts/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchContacts(); // Reload list
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa yêu cầu.');
            console.error("Delete contact error:", err.response || err);
        }
    };

     // Helper to format date/time
     const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '-';
        try {
            return new Date(dateTimeString).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) { return dateTimeString; }
    };

    return (
        <div>
            <h2>Quản lý Yêu cầu Liên hệ</h2>
            {/* No "Add New" button here */}

            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {!loading && !error && (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Họ Tên</th>
                            <th>Email</th>
                            <th>SĐT</th>
                            <th>Nội Dung</th>
                            <th>Ngày Gửi</th>
                            <th>Trạng Thái</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map(contact => (
                            <tr key={contact.yc_id}>
                                <td>{contact.yc_id}</td>
                                <td>{contact.ho_ten}</td>
                                <td>{contact.email}</td>
                                <td>{contact.so_dien_thoai || '-'}</td>
                                <td style={{ maxWidth: '300px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{contact.noi_dung}</td>
                                <td>{formatDateTime(contact.tao_luc)}</td>
                                <td>{contact.trang_thai}</td>
                                <td>
                                    <button
                                        onClick={() => handleUpdateStatus(contact.yc_id, contact.trang_thai)}
                                        className={contact.trang_thai === 'moi' ? 'edit-button' : 'cancel-button'}
                                        style={{marginRight: '5px'}}
                                    >
                                        {contact.trang_thai === 'moi' ? 'Đánh dấu Đã xử lý' : 'Đánh dấu Mới'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(contact.yc_id)}
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

export default ContactListPage;