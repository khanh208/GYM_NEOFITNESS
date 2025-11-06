// src/pages/BranchFormPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function BranchFormPage() {
    // Lấy ID từ URL (sẽ là undefined nếu route là /new)
    const { id } = useParams(); 
    const navigate = useNavigate();
    // Xác định xem đang sửa hay tạo mới
    const isEditing = id !== undefined && id !== 'new'; 

    // State cho dữ liệu form
    const [formData, setFormData] = useState({
        ten_chi_nhanh: '',
        dia_chi: '',
        so_dien_thoai: '',
        gio_mo_cua: '',
        trang_thai: 'dang hoat dong' // Trạng thái mặc định
    });
    // State cho trạng thái loading khi submit
    const [loading, setLoading] = useState(false);
    // State cho trạng thái loading ban đầu (khi fetch dữ liệu để sửa)
    const [initialLoading, setInitialLoading] = useState(isEditing); 
    // State cho thông báo lỗi
    const [error, setError] = useState('');

    // Hook để fetch dữ liệu chi nhánh khi ở chế độ sửa
    useEffect(() => {
        // Chỉ fetch dữ liệu nếu đang ở chế độ sửa (isEditing là true)
        if (isEditing) { 
            const fetchBranchData = async () => {
                setError(''); // Xóa lỗi cũ
                const token = localStorage.getItem('accessToken');
                try {
                    console.log(`Fetching data for branch ID: ${id}`); // Log để debug
                    const response = await axios.get(`http://localhost:3000/api/branches/${id}`, {
                        // headers: { 'Authorization': `Bearer ${token}` } // Bỏ comment nếu API GET/:id yêu cầu token
                    });
                    const fetchedData = response.data;
                    // Cập nhật state formData với dữ liệu lấy về
                    setFormData({
                        ten_chi_nhanh: fetchedData.ten_chi_nhanh || '',
                        dia_chi: fetchedData.dia_chi || '',
                        so_dien_thoai: fetchedData.so_dien_thoai || '',
                        gio_mo_cua: fetchedData.gio_mo_cua || '',
                        trang_thai: fetchedData.trang_thai || 'dang hoat dong'
                    });
                } catch (err) {
                    setError('Không thể tải dữ liệu chi nhánh.');
                    console.error("Fetch error:", err);
                } finally {
                    setInitialLoading(false); // Kết thúc loading ban đầu
                }
            };
            fetchBranchData();
        } else {
             // Nếu là tạo mới, không cần fetch, kết thúc loading ban đầu
             setInitialLoading(false); 
        }
    }, [id, isEditing]); // Dependencies: Chạy lại khi id hoặc isEditing thay đổi

    // Xử lý khi input thay đổi
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ 
            ...prevData, 
            [name]: value 
        }));
    };

    // Xử lý khi submit form
    const handleSubmit = async (e) => {
        e.preventDefault(); // Ngăn reload trang
        setLoading(true); // Bắt đầu loading submit
        setError(''); // Xóa lỗi cũ
        const token = localStorage.getItem('accessToken');
        // Xác định URL và method dựa trên việc đang sửa hay tạo mới
        const url = isEditing ? `http://localhost:3000/api/branches/${id}` : 'http://localhost:3000/api/branches';
        const method = isEditing ? 'put' : 'post';

        try {
            // Gửi request lên backend
            await axios({
                method: method,
                url: url,
                data: formData,
                headers: { 'Authorization': `Bearer ${token}` } // Gửi kèm token
            });
            // Nếu thành công, quay về trang danh sách
            navigate('/admin/branches'); 
        } catch (err) {
             // Nếu có lỗi, hiển thị thông báo
             setError(err.response?.data?.message || `Lỗi khi ${isEditing ? 'cập nhật' : 'tạo'} chi nhánh.`);
             console.error("Submit error:", err);
        } finally {
            setLoading(false); // Kết thúc loading submit
        }
    };

    // Hiển thị loading nếu đang fetch dữ liệu ban đầu (chế độ sửa)
    if (initialLoading) {
        return <p>Đang tải dữ liệu...</p>; 
    }

    // Giao diện form
    return (
        <div>
            <h2>{isEditing ? 'Chỉnh sửa Chi nhánh' : 'Tạo Chi nhánh mới'}</h2>
            {/* Hiển thị lỗi nếu có */}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <form onSubmit={handleSubmit}>
                {/* Trường Tên Chi Nhánh */}
                <div>
                    <label>Tên Chi Nhánh: </label>
                    <input type="text" name="ten_chi_nhanh" value={formData.ten_chi_nhanh} onChange={handleChange} required />
                </div>
                {/* Trường Địa Chỉ */}
                 <div>
                    <label>Địa Chỉ: </label>
                    <textarea name="dia_chi" value={formData.dia_chi} onChange={handleChange} required />
                </div>
                {/* Trường Số Điện Thoại */}
                 <div>
                    <label>Số Điện Thoại: </label>
                    <input type="text" name="so_dien_thoai" value={formData.so_dien_thoai || ''} onChange={handleChange} />
                </div>
                {/* Trường Giờ Mở Cửa */}
                 <div>
                    <label>Giờ Mở Cửa: </label>
                    <input type="text" name="gio_mo_cua" value={formData.gio_mo_cua || ''} onChange={handleChange} />
                </div>
                {/* Trường Trạng Thái */}
                 <div>
                    <label>Trạng Thái: </label>
                     <select name="trang_thai" value={formData.trang_thai} onChange={handleChange}>
                        <option value="dang hoat dong">Đang hoạt động</option>
                        <option value="tam ngung">Tạm ngưng</option>
                        {/* Thêm các trạng thái khác nếu cần */}
                    </select>
                </div>
                {/* Nút Submit */}
                <button type="submit" className="add-button" disabled={loading || initialLoading}>
                    {loading ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Tạo mới')}
                </button>
                {/* Nút Hủy */}
                 <button type="button" className="cancel-button" onClick={() => navigate('/admin/branches')} disabled={loading}>
                    Hủy
                </button>
            </form>
        </div>
    );
}

export default BranchFormPage;