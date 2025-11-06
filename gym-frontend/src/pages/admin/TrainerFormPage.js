// src/pages/TrainerFormPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function TrainerFormPage() {
    // Lấy ID từ URL
    const { id } = useParams();
    const navigate = useNavigate();
    // Xác định đang sửa hay tạo mới
    const isEditing = id !== undefined && id !== 'new';

    // State cho dữ liệu form
    const [formData, setFormData] = useState({
        chi_nhanh_id: '',
        ho_ten: '',
        mo_ta: '',
        chung_chi: '',
        kinh_nghiem: 0,
        hinh_anh: '',
        trang_thai: 'dang hoat dong'
    });
    // State cho danh sách chi nhánh (dropdown)
    const [branches, setBranches] = useState([]);
    // State loading khi submit
    const [loading, setLoading] = useState(false);
    // State loading ban đầu (fetch data)
    const [initialLoading, setInitialLoading] = useState(true);
    // State cho thông báo lỗi
    const [error, setError] = useState('');

    // Fetch dữ liệu cần thiết (chi nhánh và dữ liệu HLV nếu sửa)
    useEffect(() => {
        const fetchData = async () => {
            setError('');
            const token = localStorage.getItem('accessToken'); // Lấy token
            try {
                // Lấy danh sách chi nhánh cho dropdown
                const branchRes = await axios.get('http://localhost:3000/api/branches');
                setBranches(branchRes.data);

                // Nếu đang sửa, fetch dữ liệu HLV hiện tại
                if (isEditing) {
                    console.log(`Fetching data for trainer ID: ${id}`);
                    const trainerRes = await axios.get(`http://localhost:3000/api/trainers/${id}`, {
                       // headers: { 'Authorization': `Bearer ${token}` } // Thêm nếu API GET/:id yêu cầu token
                    });
                    const data = trainerRes.data;
                    // Cập nhật state formData với dữ liệu HLV lấy về
                    setFormData({
                        chi_nhanh_id: data.chi_nhanh_id || '', // Dùng '' nếu null để select hoạt động
                        ho_ten: data.ho_ten || '',
                        mo_ta: data.mo_ta || '',
                        chung_chi: data.chung_chi || '',
                        kinh_nghiem: data.kinh_nghiem || 0,
                        hinh_anh: data.hinh_anh || '',
                        trang_thai: data.trang_thai || 'dang hoat dong'
                    });
                }
            } catch (err) {
                setError('Không thể tải dữ liệu cần thiết (Chi nhánh/HLV).');
                console.error("Fetch error:", err);
            } finally {
                setInitialLoading(false); // Kết thúc loading ban đầu
            }
        };
        fetchData();
    }, [id, isEditing]); // Dependencies

    // Xử lý thay đổi input
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prevData => ({
            ...prevData,
            // Chuyển giá trị số về kiểu number nếu là input number
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value
        }));
    };

    // Xử lý submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Bắt đầu loading submit
        setError('');
        const token = localStorage.getItem('accessToken');
        // Kiểm tra token trước khi gửi
        if (!token) {
            setError('Vui lòng đăng nhập lại.');
            setLoading(false);
            return;
        }

        // Xác định URL và method
        const url = isEditing ? `http://localhost:3000/api/trainers/${id}` : 'http://localhost:3000/api/trainers';
        const method = isEditing ? 'put' : 'post';

        // Chuẩn bị dữ liệu gửi đi, chuyển chi_nhanh_id rỗng thành null
        const dataToSend = {
            ...formData,
            chi_nhanh_id: formData.chi_nhanh_id === '' ? null : formData.chi_nhanh_id
        };

        try {
            // Gửi request lên backend
            await axios({
                method: method,
                url: url,
                data: dataToSend,
                headers: { 'Authorization': `Bearer ${token}` } // Gửi kèm token
            });
            navigate('/admin/trainers'); // Quay về trang danh sách nếu thành công
        } catch (err) {
             setError(err.response?.data?.message || `Lỗi khi ${isEditing ? 'cập nhật' : 'tạo'} HLV.`);
             console.error("Submit error:", err.response?.data || err.message); // Log lỗi chi tiết
        } finally {
            setLoading(false); // Kết thúc loading submit
        }
    };

    // Hiển thị loading khi đang fetch dữ liệu ban đầu
     if (initialLoading) {
        return <p>Đang tải dữ liệu...</p>;
    }

    // Giao diện form
    return (
        <div>
            <h2>{isEditing ? 'Chỉnh sửa Huấn Luyện Viên' : 'Tạo Huấn Luyện Viên Mới'}</h2>
            {/* Hiển thị lỗi nếu có */}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={handleSubmit}>
                {/* Trường Họ Tên */}
                <div>
                    <label>Họ Tên: </label>
                    <input type="text" name="ho_ten" value={formData.ho_ten} onChange={handleChange} required />
                </div>
                 {/* Chọn Chi Nhánh */}
                <div>
                    <label>Chi Nhánh (Tùy chọn): </label>
                     <select name="chi_nhanh_id" value={formData.chi_nhanh_id || ''} onChange={handleChange}>
                        <option value="">-- Không thuộc chi nhánh --</option>
                        {/* Render danh sách chi nhánh */}
                        {branches.map(branch => (
                            <option key={branch.chi_nhanh_id} value={branch.chi_nhanh_id}>
                                {branch.ten_chi_nhanh}
                            </option>
                        ))}
                    </select>
                </div>
                {/* Trường Mô Tả */}
                <div>
                    <label>Mô Tả: </label>
                    <textarea name="mo_ta" value={formData.mo_ta || ''} onChange={handleChange} />
                </div>
                 {/* Trường Chứng Chỉ */}
                 <div>
                    <label>Chứng Chỉ: </label>
                    <input type="text" name="chung_chi" value={formData.chung_chi || ''} onChange={handleChange} />
                </div>
                 {/* Trường Kinh Nghiệm */}
                 <div>
                    <label>Kinh Nghiệm (năm): </label>
                    <input type="number" name="kinh_nghiem" value={formData.kinh_nghiem} onChange={handleChange} min="0" />
                </div>
                {/* Trường Hình Ảnh */}
                <div>
                    <label>Link Hình Ảnh: </label>
                    <input type="text" name="hinh_anh" value={formData.hinh_anh || ''} onChange={handleChange} placeholder="https://..." />
                </div>
                {/* Trường Trạng Thái (chỉ hiển thị khi sửa và cho Admin) */}
                {isEditing && (
                    <div>
                        <label>Trạng Thái: </label>
                        <select name="trang_thai" value={formData.trang_thai} onChange={handleChange}>
                            <option value="dang hoat dong">Đang hoạt động</option>
                            <option value="tam nghi">Tạm nghỉ</option>
                            {/* Thêm trạng thái khác nếu cần */}
                        </select>
                    </div>
                )}

                {/* Nút Submit */}
                <button type="submit" className="add-button" disabled={loading || initialLoading}>
                    {loading ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Tạo mới')}
                </button>
                 {/* Nút Hủy */}
                 <button type="button" className="cancel-button" onClick={() => navigate('/admin/trainers')} disabled={loading}>
                    Hủy
                </button>
            </form>
        </div>
    );
}

export default TrainerFormPage;