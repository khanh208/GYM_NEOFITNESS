// src/pages/CustomerFormPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function CustomerFormPage() {
    const { id } = useParams(); // Only used for editing
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        ho_ten: '',
        email: '',
        so_dien_thoai: ''
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch customer data for editing
    useEffect(() => {
        const fetchCustomerData = async () => {
            setError('');
            const token = localStorage.getItem('accessToken');
            if (!token) {
                 setError('Vui lòng đăng nhập lại.');
                 setInitialLoading(false);
                 return;
            }
            try {
                console.log(`Fetching data for customer ID: ${id}`);
                // Admin or Customer can view, needs token
                const response = await axios.get(`http://localhost:3000/api/customers/${id}`, {
                   headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = response.data;
                setFormData({
                    ho_ten: data.ho_ten || '',
                    email: data.email || '',
                    so_dien_thoai: data.so_dien_thoai || ''
                });
            } catch (err) {
                setError('Không thể tải dữ liệu khách hàng.');
                console.error("Fetch error:", err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchCustomerData();
    }, [id]); // Dependency on ID

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    // Handle form submission (Update only)
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

        const url = `http://localhost:3000/api/customers/${id}`;
        const method = 'put'; // Always PUT for this form

        try {
            await axios({
                method: method,
                url: url,
                data: formData,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            navigate('/admin/customers'); // Go back to list
        } catch (err) {
             setError(err.response?.data?.message || 'Lỗi khi cập nhật khách hàng.');
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
            <h2>Chỉnh sửa Khách Hàng (ID: {id})</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Họ Tên: </label>
                    <input type="text" name="ho_ten" value={formData.ho_ten} onChange={handleChange} required />
                </div>
                <div>
                    <label>Email: </label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleChange} />
                </div>
                <div>
                    <label>Số Điện Thoại: </label>
                    <input type="text" name="so_dien_thoai" value={formData.so_dien_thoai || ''} onChange={handleChange} />
                </div>

                <button type="submit" className="add-button" disabled={loading || initialLoading}>
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                 <button type="button" className="cancel-button" onClick={() => navigate('/admin/customers')} disabled={loading}>
                    Hủy
                </button>
            </form>
        </div>
    );
}

export default CustomerFormPage;