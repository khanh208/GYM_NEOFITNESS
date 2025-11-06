// src/pages/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h1>404 - Không tìm thấy trang</h1>
            <p>Rất tiếc, trang bạn đang tìm kiếm không tồn tại.</p>
            <Link to="/login">Quay lại Đăng nhập</Link>
        </div>
    );
}
export default NotFound;