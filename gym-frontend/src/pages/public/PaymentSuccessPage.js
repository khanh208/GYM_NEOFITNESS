// src/pages/public/PaymentSuccessPage.js
import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './PaymentSuccessPage.css'; // Sẽ tạo file CSS sau

function PaymentSuccessPage() {
    // Dùng useSearchParams để đọc query string từ URL
    const [searchParams] = useSearchParams();

    // Lấy các tham số Momo trả về
    const resultCode = searchParams.get('resultCode');
    const message = searchParams.get('message');
    const orderId = searchParams.get('orderId');

    const isSuccess = resultCode === '0'; // resultCode = 0 là thành công

    useEffect(() => {
        // Bạn có thể log lại để kiểm tra
        console.log("Momo Redirect Params:", { resultCode, message, orderId });
        
        if (isSuccess) {
            // (Nâng cao) Bạn có thể gọi 1 API của mình để xác nhận
            // lại trạng thái đơn hàng, nhưng IPN đã làm việc đó rồi.
        }
    }, [resultCode, message, orderId, isSuccess]);

    return (
        <div className="payment-status-container">
            {isSuccess ? (
                // --- THANH TOÁN THÀNH CÔNG ---
                <div className="payment-status-card success">
                    <div className="status-icon">✓</div>
                    <h2>Thanh toán thành công!</h2>
                    <p>Cảm ơn bạn đã mua gói tập tại NeoFitness. Gói tập của bạn đã được kích hoạt.</p>
                    <p><strong>Mã đơn hàng:</strong> {orderId}</p>
                    <Link to="/" className="hero-button">Về Trang chủ</Link>
                </div>
            ) : (
                // --- THANH TOÁN THẤT BẠI ---
                <div className="payment-status-card error">
                    <div className="status-icon">×</div>
                    <h2>Thanh toán thất bại</h2>
                    <p>Đã có lỗi xảy ra: {message || 'Không rõ lỗi'}</p>
                    <p>Đơn hàng của bạn chưa được xử lý. Vui lòng thử lại.</p>
                    <Link to="/goi-tap" className="hero-button cancel-button">Thử lại</Link>
                </div>
            )}
        </div>
    );
}

export default PaymentSuccessPage;