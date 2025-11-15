// src/pages/PricingListPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function PricingListPage() {
    const [pricings, setPricings] = useState([]);
    const [packages, setPackages] = useState([]); // State để lưu danh sách gói tập
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // --- HÀM TÌM TÊN GÓI TẬP ---
    // Hàm này cần được định nghĩa trong component để có thể truy cập state 'packages'
    const getPackageName = (packageId) => {
        const pkg = packages.find(p => p.goi_tap_id === packageId);
        return pkg ? pkg.ten : `(ID: ${packageId})`; // Trả về tên hoặc ID nếu không tìm thấy
    };
    // --- KẾT THÚC HÀM ---

    // --- HÀM FETCH DỮ LIỆU ---
    // Chỉ cần MỘT hàm fetch để lấy cả giá và gói tập
    const fetchData = async () => {
        setError('');
        setLoading(true);
        // const token = localStorage.getItem('accessToken'); // Lấy token nếu cần cho API GET
        try {
            // Sử dụng Promise.all để fetch song song
            const [pricingRes, packageRes] = await Promise.all([
                axios.get('http://localhost:3000/api/pricings'), // Lấy danh sách giá (đã JOIN)
                axios.get('http://localhost:3000/api/packages')  // Lấy danh sách gói tập
            ]);
            setPricings(pricingRes.data);
            setPackages(packageRes.data); // Lưu danh sách gói tập vào state
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch data.');
            console.error("Fetch pricing/package data error:", err);
        } finally {
            setLoading(false);
        }
    };

    // --- useEffect ĐỂ GỌI fetchData KHI COMPONENT MOUNT ---
    useEffect(() => {
        fetchData(); // Chỉ gọi hàm fetchData mới
    }, []); // Mảng dependency rỗng để chạy 1 lần

    // --- HÀM XỬ LÝ XÓA ---
    const handleDelete = async (id) => {
         if (!window.confirm(`Bạn có chắc muốn xóa mức giá ID ${id}?`)) return;

         const token = localStorage.getItem('accessToken');
         if (!token) {
             setError('Vui lòng đăng nhập lại.');
             return;
         }
         setError('');
         try {
             await axios.delete(`http://localhost:3000/api/pricings/${id}`, {
                 headers: { 'Authorization': `Bearer ${token}` }
             });
             fetchData(); // Gọi lại fetchData để cập nhật cả giá và gói tập nếu cần
         } catch (err) {
             setError(err.response?.data?.message || 'Lỗi khi xóa mức giá.');
             console.error("Delete pricing error:", err.response || err);
         }
    };

    // --- HÀM FORMAT TIỀN TỆ ---
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return '-';
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) return '-'; // Xử lý nếu giá trị không phải số
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numericAmount);
    };

    // Hàm formatDateTime không được sử dụng nên đã xóa

    // --- GIAO DIỆN ---
    return (
        <div>
            <h2>Quản lý Mức Giá</h2>
            <button onClick={() => navigate('/admin/pricings/new')} className="add-button" style={{ marginBottom: '15px' }}>
                Thêm Mức Giá Mới
            </button>

            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {!loading && !error && (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Gói Tập</th>
                            <th>Thời hạn</th>
                            <th>Số buổi</th>
                            <th>Giá Gốc</th>
                            <th>Khuyến Mãi</th>
                            <th>Giá Cuối Cùng</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pricings.map(price => (
                            <tr key={price.gia_id}>
                                <td>{price.gia_id}</td>
                                {/* Gọi hàm getPackageName */}
                                <td>{getPackageName(price.goi_tap_id)}</td>
                                <td>{price.thoi_han || '-'}</td>
                                <td>{price.ca_buoi || '-'}</td>
                                <td>{formatCurrency(price.gia)}</td> {/* price.gia đã có sẵn từ API pricings */}
                                <td>{price.ten_khuyen_mai || '-'} ({price.giam_gia_phantram || 0}%)</td>
                                <td>{formatCurrency(price.gia_cuoi_cung)}</td>
                                <td>
                                    <button onClick={() => navigate(`/admin/pricings/${price.gia_id}/edit`)} className="edit-button">
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(price.gia_id)}
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

export default PricingListPage;