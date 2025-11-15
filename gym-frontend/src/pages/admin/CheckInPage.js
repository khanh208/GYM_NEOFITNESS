// src/pages/admin/CheckInPage.js
import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';

function CheckInPage() {
    const [loading, setLoading] = useState(false); // Loading chung
    const [error, setError] = useState('');
    const [customerData, setCustomerData] = useState(null); // Lưu thông tin khách
    const [scannedKhachId, setScannedKhachId] = useState(null); // Lưu ID khách vừa quét

    // Khởi tạo máy quét
    useEffect(() => {
        function onScanSuccess(decodedText, decodedResult) {
            if (!loading) { // Chỉ xử lý nếu không đang loading
                console.log("Đã quét:", decodedText);
                setScannedKhachId(null); // Xóa ID cũ
                setCustomerData(null); // Xóa dữ liệu cũ
                setError('');
                
                try {
                    const { khach_id } = JSON.parse(decodedText);
                    if (!khach_id) {
                        throw new Error("Mã QR không hợp lệ (thiếu khach_id).");
                    }
                    // Lưu ID và gọi hàm fetch
                    setScannedKhachId(khach_id); 
                    fetchCheckInData(khach_id); // Gọi hàm fetch mới
                } catch (e) {
                    console.error("Lỗi khi xử lý QR:", e);
                    setError(e.message || "Quét lỗi hoặc mã không hợp lệ.");
                }
            }
        }

        function onScanFailure(error) { /* Bỏ qua */ }

        const html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader-container", 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false 
        );
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);

        // Dọn dẹp
        return () => {
            html5QrcodeScanner.clear().catch(error => {
                console.error("Failed to clear scanner.", error);
            });
        };
    }, [loading]); // Phụ thuộc vào loading

    // --- HÀM MỚI: LẤY DỮ LIỆU CHECK-IN ---
    // Hàm này sẽ được gọi khi quét (handleScan) và sau khi xác nhận (handleConfirm)
    const fetchCheckInData = async (khach_id) => {
        if (!khach_id) return;
        
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(
                `http://localhost:3000/api/check-in/customer/${khach_id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setCustomerData(response.data); // Lưu thông tin khách
        } catch (e) {
            console.error("Lỗi khi fetch dữ liệu check-in:", e);
            setError(e.message || "Lỗi tải dữ liệu khách hàng.");
            setCustomerData(null); // Xóa dữ liệu nếu lỗi
        } finally {
            setLoading(false);
        }
    };

    // --- HÀM XÁC NHẬN CHECK-IN (ĐÃ SỬA) ---
    const handleConfirmCheckIn = async (bookingId) => {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('accessToken');
        
        try {
            await axios.put(
                `http://localhost:3000/api/bookings/${bookingId}`,
                { trang_thai: 'hoan thanh' },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            // --- THAY ĐỔI QUAN TRỌNG ---
            // Thay vì alert và xóa, chúng ta TẢI LẠI dữ liệu
            console.log(`Check-in thành công cho lịch hẹn ID: ${bookingId}! Tải lại dữ liệu...`);
            fetchCheckInData(scannedKhachId); // Tải lại thông tin của khách hàng vừa quét
            // --- KẾT THÚC THAY ĐỔI ---

        } catch (err) {
             setError(err.response?.data?.message || 'Lỗi khi xác nhận check-in.');
             setLoading(false); // Chỉ dừng loading nếu có lỗi
        }
        // setLoading(false) sẽ được gọi bởi fetchCheckInData
    };

    return (
        <div>
            <h2>Quét mã Check-in của Khách hàng</h2>
            
            <div id="qr-reader-container" style={{ width: '400px', maxWidth: '100%', margin: 'auto' }}></div>

            {loading && <p>Đang xử lý...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {/* --- HIỂN THỊ KẾT QUẢ QUÉT (Bảng "thống kê") --- */}
            {customerData && (
                <div className="check-in-result" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f4f4f4', color: '#333', borderRadius: '5px' }}>
                    <h3>Kết quả Quét:</h3>
                    <p><strong>Khách hàng:</strong> {customerData.customerInfo.ho_ten} (ID: {customerData.customerInfo.khach_id})</p>
                    
                    <h4>Gói đang hoạt động:</h4>
                    {customerData.activePackages.length > 0 ? (
                        <ul>
                            {customerData.activePackages.map(pkg => (
                                <li key={pkg.gkh_id}>
                                    {pkg.ten_goi_tap} 
                                    {pkg.tong_so_buoi !== null ? ` (còn ${pkg.tong_so_buoi - pkg.so_buoi_da_tap} buổi)` : ''}
                                    {pkg.ngay_het_han ? ` - Hết hạn: ${new Date(pkg.ngay_het_han).toLocaleDateString('vi-VN')}` : ''}
                                </li>
                            ))}
                        </ul>
                    ) : <p>Không có gói nào đang hoạt động.</p>}

                    <h4>Lịch hẹn hôm nay (Chưa check-in):</h4>
                    {customerData.todayBookings.length > 0 ? (
                        <ul>
                            {customerData.todayBookings.map(booking => (
                                <li key={booking.lich_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span>
                                        <strong>{new Date(booking.thoi_gian).toLocaleTimeString('vi-VN', { timeStyle: 'short' })}:</strong> 
                                        {booking.ten_dich_vu} (với HLV: {booking.ten_hlv || 'N/A'})
                                    </span>
                                    <button 
                                        className="edit-button" 
                                        onClick={() => handleConfirmCheckIn(booking.lich_id)}
                                        disabled={loading}
                                    >
                                        Xác nhận Check-in
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : <p>Không có lịch hẹn nào hôm nay.</p>}
                </div>
            )}
        </div>
    );
}

export default CheckInPage;