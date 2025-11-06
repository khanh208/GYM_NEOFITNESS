// src/pages/TrainerListPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function TrainerListPage() {
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Hàm fetch danh sách HLV
    const fetchTrainers = async () => {
        setError('');
        setLoading(true);
        // const token = localStorage.getItem('accessToken'); // API GET trainers có thể public
        try {
            // API trả về đã JOIN với tên chi nhánh
            const response = await axios.get('http://localhost:3000/api/trainers');
            setTrainers(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch trainers.');
            console.error("Fetch trainers error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Gọi fetchTrainers khi component được mount
    useEffect(() => {
        fetchTrainers();
    }, []);

    // Hàm xử lý xóa HLV
    const handleDelete = async (id) => {
        // --- THÊM CONSOLE LOG NGAY ĐẦU ---
        console.log(`Attempting to delete trainer with ID: ${id}`); 
        // --- KẾT THÚC THÊM ---

        if (!window.confirm(`Bạn có chắc muốn xóa HLV ID ${id}?`)) {
             console.log("Deletion cancelled by user."); // Log nếu hủy
             return; // Dừng lại nếu người dùng không xác nhận
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.error("No token found!"); // Log nếu thiếu token
            setError('Vui lòng đăng nhập lại.');
            return;
        }
        
        setError(''); // Xóa lỗi cũ
        console.log(`Sending DELETE request for ID: ${id} with token...`); // Log trước khi gọi API
        try {
            await axios.delete(`http://localhost:3000/api/trainers/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`Successfully deleted trainer ID: ${id}`); // Log khi thành công
            fetchTrainers(); // Tải lại danh sách
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa HLV.');
            console.error("Delete trainer error:", err.response || err); // Log lỗi chi tiết
        }
    };

    return (
        <div>
            <h2>Quản lý Huấn Luyện Viên</h2>
            <button
                onClick={() => navigate('/admin/trainers/new')}
                className="add-button"
                style={{ marginBottom: '15px' }}
            >
                Thêm Huấn Luyện Viên Mới
            </button>

            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {!loading && !error && (
                <table>
        <thead>
            {/* ... table headers ... */}
        </thead>
        {/* --- CHECK CAREFULLY HERE --- */}
        <tbody>
            {/* Remove any spaces or newlines directly here */}
            {trainers.map(trainer => (
                // Ensure the <tr key={...}> is returned directly
                <tr key={trainer.hlv_id}>
                    <td>{trainer.hlv_id}</td>
                    <td>{trainer.ho_ten}</td>
                    <td>{trainer.ten_chi_nhanh || '-'}</td>
                    <td>{trainer.kinh_nghiem} năm</td>
                    <td>{trainer.trang_thai}</td>
                    <td>
                        <button
                            onClick={() => navigate(`/admin/trainers/${trainer.hlv_id}/edit`)}
                            className="edit-button"
                        >
                            Sửa
                        </button>
                        <button
                                onClick={() => navigate(`/admin/trainers/${trainer.hlv_id}/manage-services`)}
                                // You might want a different style, e.g., info/secondary button
                                style={{ marginLeft: '5px', backgroundColor: '#17a2b8', color: 'white' }}
                                title="Quản lý dịch vụ HLV này có thể dạy"
                            >
                                Dịch vụ
                            </button>
                        <button onClick={() => handleDelete(trainer.hlv_id)} // Đảm bảo gọi hàm đúng
                            className="delete-button"> Xóa</button>
                    </td>
                </tr>
                // Remove any spaces or newlines directly here
            ))}
            {/* Remove any spaces or newlines directly here */}
        </tbody>
        {/* --- END CHECK --- */}
    </table>
            )}
        </div>
    );
}

export default TrainerListPage;