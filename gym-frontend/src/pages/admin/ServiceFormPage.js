// src/pages/ServiceFormPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function ServiceFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = id !== undefined && id !== 'new';

    const [formData, setFormData] = useState({
        chi_nhanh_id: '',
        ten: '',
        mo_ta: '',
        trang_thai: 'binh thuong'
    });
    const [branches, setBranches] = useState([]); // State for branches dropdown
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setError('');
            const token = localStorage.getItem('accessToken');
            try {
                // Fetch branches for dropdown
                const branchRes = await axios.get('http://localhost:3000/api/branches');
                setBranches(branchRes.data);

                // If editing, fetch current service data
                if (isEditing) {
                    console.log(`Fetching data for service ID: ${id}`);
                    const serviceRes = await axios.get(`http://localhost:3000/api/services/${id}`, {
                       // headers: { 'Authorization': `Bearer ${token}` } // If needed
                    });
                    const data = serviceRes.data;
                    setFormData({
                        chi_nhanh_id: data.chi_nhanh_id || '',
                        ten: data.ten || '',
                        mo_ta: data.mo_ta || '',
                        trang_thai: data.trang_thai || 'binh thuong'
                    });
                }
            } catch (err) {
                setError('Không thể tải dữ liệu cần thiết (Chi nhánh/Dịch vụ).');
                console.error("Fetch error:", err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [id, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: name === 'chi_nhanh_id' && value === '' ? null : value
        }));
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

        const url = isEditing ? `http://localhost:3000/api/services/${id}` : 'http://localhost:3000/api/services';
        const method = isEditing ? 'put' : 'post';

        const dataToSend = {
             ...formData,
             chi_nhanh_id: formData.chi_nhanh_id === '' ? null : formData.chi_nhanh_id
         };

        try {
            await axios({
                method: method,
                url: url,
                data: dataToSend,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            navigate('/admin/services');
        } catch (err) {
             setError(err.response?.data?.message || `Lỗi khi ${isEditing ? 'cập nhật' : 'tạo'} dịch vụ.`);
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
            <h2>{isEditing ? 'Chỉnh sửa Dịch Vụ' : 'Tạo Dịch Vụ Mới'}</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Tên Dịch Vụ: </label>
                    <input type="text" name="ten" value={formData.ten} onChange={handleChange} required />
                </div>
                {/* Select Branch */}
                <div>
                    <label>Chi Nhánh (Tùy chọn): </label>
                     <select name="chi_nhanh_id" value={formData.chi_nhanh_id || ''} onChange={handleChange}>
                        <option value="">-- Dịch vụ chung --</option>
                        {branches.map(branch => (
                            <option key={branch.chi_nhanh_id} value={branch.chi_nhanh_id}>
                                {branch.ten_chi_nhanh}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Mô Tả: </label>
                    <textarea name="mo_ta" value={formData.mo_ta || ''} onChange={handleChange} />
                </div>
                 {/* Status (only shown when editing for simplicity) */}
                {isEditing && (
                    <div>
                        <label>Trạng Thái: </label>
                        <select name="trang_thai" value={formData.trang_thai} onChange={handleChange}>
                            <option value="binh thuong">Bình thường</option>
                            <option value="tam ngung">Tạm ngưng</option>
                            {/* Add other statuses if needed */}
                        </select>
                    </div>
                )}

                <button type="submit" className="add-button" disabled={loading || initialLoading}>
                    {loading ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Tạo mới')}
                </button>
                 <button type="button" className="cancel-button" onClick={() => navigate('/admin/services')} disabled={loading}>
                    Hủy
                </button>
            </form>
        </div>
    );
}

export default ServiceFormPage;