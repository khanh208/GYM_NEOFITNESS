import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function TrainerProfilePage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        ho_ten: '',
        mo_ta: '',
        chung_chi: '',
        kinh_nghiem: 0,
        hinh_anh: ''
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const [trainerProfileId, setTrainerProfileId] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    // State lưu URL xem trước tạm thời (blob:...)
    const [previewImage, setPreviewImage] = useState(null);

    // --- 1. FETCH DỮ LIỆU BAN ĐẦU ---
    useEffect(() => {
        const fetchProfileData = async () => {
            setError('');
            const token = localStorage.getItem('accessToken');
            const userId = localStorage.getItem('userId');

            if (!token || !userId) {
                 setError('Vui lòng đăng nhập lại.');
                 setInitialLoading(false);
                 navigate('/login');
                 return;
            }

            try {
                // Tạm thời fetch tất cả để tìm profile của user hiện tại
                const allTrainersRes = await axios.get('http://localhost:3000/api/trainers');
                const myProfile = allTrainersRes.data.find(t => t.tai_khoan_id == userId);

                if (!myProfile) {
                    setError('Không tìm thấy hồ sơ huấn luyện viên liên kết.');
                    setInitialLoading(false);
                    return;
                }
                setTrainerProfileId(myProfile.hlv_id);

                // Lấy chi tiết hồ sơ
                const profileRes = await axios.get(`http://localhost:3000/api/trainers/${myProfile.hlv_id}`);
                const data = profileRes.data;
                setFormData({
                    ho_ten: data.ho_ten || '',
                    mo_ta: data.mo_ta || '',
                    chung_chi: data.chung_chi || '',
                    kinh_nghiem: data.kinh_nghiem || 0,
                    hinh_anh: data.hinh_anh || ''
                });

            } catch (err) {
                setError('Không thể tải dữ liệu hồ sơ.');
                console.error("Fetch profile error:", err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchProfileData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]); 

    // --- 2. CLEANUP URL XEM TRƯỚC (Tránh rò rỉ bộ nhớ) ---
    useEffect(() => {
        return () => {
            if (previewImage) {
                URL.revokeObjectURL(previewImage);
            }
        };
    }, [previewImage]);

    // --- 3. XỬ LÝ THAY ĐỔI INPUT TEXT ---
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value
        }));
    };

    // --- 4. XỬ LÝ CHỌN FILE ẢNH ---
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // A. Tạo xem trước ngay lập tức
        if (previewImage) URL.revokeObjectURL(previewImage);
        setPreviewImage(URL.createObjectURL(file));

        // B. Tự động upload lên server
        const formDataFile = new FormData();
        formDataFile.append('image', file);
        setUploading(true);
        setError('');
        const token = localStorage.getItem('accessToken');

        try {
            const { data } = await axios.post('http://localhost:3000/api/upload', formDataFile, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            // Upload xong, lưu đường dẫn server trả về vào formData
            setFormData(prevData => ({ ...prevData, hinh_anh: data.imagePath }));
        } catch (err) {
            console.error("Upload error:", err);
            setError('Lỗi khi tải ảnh lên.');
            // Nếu lỗi, bỏ xem trước
            setPreviewImage(null);
        } finally {
            setUploading(false);
        }
    };

    // --- 5. XỬ LÝ SUBMIT FORM ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!trainerProfileId) return;
        
        setLoading(true);
        setError('');
        const token = localStorage.getItem('accessToken');

        try {
            await axios.put(`http://localhost:3000/api/trainers/${trainerProfileId}`, formData, {
                 headers: { 'Authorization': `Bearer ${token}` } 
            });
            alert('Cập nhật hồ sơ thành công!');
            // Xóa ảnh xem trước tạm thời vì giờ nó đã là ảnh chính thức
            setPreviewImage(null);
        } catch (err) {
             setError(err.response?.data?.message || 'Lỗi khi cập nhật hồ sơ.');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <p>Đang tải hồ sơ...</p>;

    // --- LOGIC QUYẾT ĐỊNH ẢNH HIỂN THỊ ---
    let imageSource = null;
    if (previewImage) {
        // Ưu tiên 1: Ảnh vừa chọn từ máy (đang xem trước)
        imageSource = previewImage;
    } else if (formData.hinh_anh) {
        // Ưu tiên 2: Ảnh đang lưu trên server
        // Nếu đường dẫn bắt đầu bằng '/', thêm domain server vào để hiển thị đúng
        imageSource = formData.hinh_anh.startsWith('/') 
            ? `http://localhost:3000${formData.hinh_anh}` 
            : formData.hinh_anh;
    }

    return (
        <div>
            <h2>Hồ Sơ Cá Nhân</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Họ Tên: </label>
                    <input type="text" name="ho_ten" value={formData.ho_ten} onChange={handleChange} required />
                </div>
                <div>
                    <label>Mô Tả: </label>
                    <textarea name="mo_ta" value={formData.mo_ta || ''} onChange={handleChange} rows="4"/>
                </div>
                 <div>
                    <label>Chứng Chỉ: </label>
                    <input type="text" name="chung_chi" value={formData.chung_chi || ''} onChange={handleChange} />
                </div>
                 <div>
                    <label>Kinh Nghiệm (năm): </label>
                    <input type="number" name="kinh_nghiem" value={formData.kinh_nghiem} onChange={handleChange} min="0" />
                </div>
                
                {/* Khu vực chọn ảnh và xem trước */}
                 <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
                    <label style={{ fontWeight: 'bold' }}>Ảnh đại diện:</label>
                    
                    {/* Hiển thị ảnh nếu có */}
                    {imageSource && (
                        <div style={{ margin: '15px 0' }}>
                            <img 
                                src={imageSource} 
                                alt="Avatar Preview" 
                                style={{ 
                                    width: '150px', 
                                    height: '150px', 
                                    objectFit: 'cover', 
                                    borderRadius: '50%', // Làm tròn ảnh
                                    border: '2px solid #ddd' 
                                }} 
                            />
                        </div>
                    )}

                    {/* Nút chọn file */}
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    {uploading && <p style={{ color: 'blue' }}>Đang tải ảnh lên server...</p>}
                </div>

                <div style={{ marginTop: '20px' }}>
                    <button type="submit" className="add-button" disabled={loading || uploading}>
                        {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </button>
                    <button type="button" className="cancel-button" onClick={() => navigate('/trainer/schedule')} disabled={loading || uploading}>
                        Quay lại
                    </button>
                </div>
            </form>
        </div>
    );
}

export default TrainerProfilePage;