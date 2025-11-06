from flask import Blueprint, request, jsonify
from sqlalchemy import select, and_
from sqlalchemy.exc import IntegrityError
from email_validator import validate_email, EmailNotValidError
import os
from app.services.emailer import send_otp_email
from app.core.config import SessionLocal, engine
from app.models.user import TaiKhoan, MaXacThuc
from app.models.base import Base
from app.services.security import (
    hash_password, verify_password, create_access_token,
    gen_otp, hash_otp, otp_expiry, now_utc
)

OTP_TTL_MINUTES = int(os.getenv("OTP_TTL_MINUTES", "10"))

with engine.begin() as conn:
    Base.metadata.create_all(bind=conn)

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

# app/routes/auth.py (đoạn /auth/register)
@auth_bp.post("/register")
def register():
    data = request.get_json(force=True)
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not username or not email or not password:
        return jsonify({"error": "username, email, password la bat buoc"}), 400

    try:
        validate_email(email)
    except EmailNotValidError as e:
        return jsonify({"error": f"Email khong hop le: {str(e)}"}), 400

    db = SessionLocal()
    try:
        # Mở transaction: chỉ commit khi mọi thứ OK
        with db.begin():
            tk = TaiKhoan(
                ten_dang_nhap=username,
                email=email,
                mat_khau_hash=hash_password(password),
                mat_khau_algo="argon2id",
            )
            db.add(tk)
            db.flush()  # có user_id

            otp_plain = gen_otp()
            db.add(MaXacThuc(
                user_id=tk.user_id,
                loai="verify_email",
                ma_hash=hash_otp(otp_plain),
                het_han_luc=otp_expiry(OTP_TTL_MINUTES)
            ))

            # gửi mail: nếu lỗi -> raise để rollback toàn bộ
            from app.services.emailer import send_otp_email
            send_otp_email(email, otp_plain, "verify_email")

        # tới đây transaction đã commit
        return jsonify({
            "message": "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP xác thực."
        }), 201

    except IntegrityError:
        db.rollback()
        return jsonify({"error": "Ten dang nhap hoac email da ton tai"}), 409
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Khong gui duoc email OTP: {e}"}), 500
    finally:
        db.close()

@auth_bp.post("/login")
def login():
    data = request.get_json(force=True)
    identity = (data.get("identity") or "").strip()
    password = data.get("password") or ""
    if not identity or not password:
        return jsonify({"error": "identity va password la bat buoc"}), 400

    db = SessionLocal()
    try:
        stmt = select(TaiKhoan).where(
            (TaiKhoan.ten_dang_nhap == identity) | (TaiKhoan.email == identity.lower())
        )
        tk = db.execute(stmt).scalars().first()
        if not tk:
            return jsonify({"error": "Tai khoan khong ton tai"}), 404
        if tk.trang_thai == "blocked":
            return jsonify({"error": "Tai khoan da bi khoa"}), 403
        if not verify_password(tk.mat_khau_hash, password):
            return jsonify({"error": "Sai mat khau"}), 401
        if tk.email_xac_thuc_at is None:
            return jsonify({"error":"Email chua duoc xac thuc"}), 406

        token = create_access_token({"sub": str(tk.user_id), "u": tk.ten_dang_nhap})
        return jsonify({"access_token": token, "token_type": "Bearer"}), 200
    finally:
        db.close()

@auth_bp.post("/forgot")
def forgot():
    data = request.get_json(force=True)
    identity = (data.get("identity") or "").strip()
    if not identity:
        return jsonify({"error": "identity la bat buoc"}), 400

    db = SessionLocal()
    try:
        stmt = select(TaiKhoan).where(
            (TaiKhoan.ten_dang_nhap == identity) | (TaiKhoan.email == identity.lower())
        )
        tk = db.execute(stmt).scalars().first()
        if not tk:
            # Có thể trả 200 để tránh lộ user tồn tại hay không
            return jsonify({"message": "Nếu tài khoản tồn tại, OTP đã được gửi về email."}), 200

        otp_plain = gen_otp()
        db.add(MaXacThuc(
            user_id=tk.user_id,
            loai="reset_password",
            ma_hash=hash_otp(otp_plain),
            het_han_luc=otp_expiry(OTP_TTL_MINUTES)
        ))
        db.commit()

        # GỬI MAIL OTP
        try:
            send_otp_email(tk.email, otp_plain, "reset_password")
        except Exception as e:
            return jsonify({"error": f"Khong gui duoc email OTP: {e}"}), 500

        return jsonify({"message": "Đã gửi OTP đặt lại mật khẩu về email (nếu tài khoản tồn tại)."}), 200
    finally:
        db.close()

@auth_bp.post("/reset")
def reset_password():
    data = request.get_json(force=True)
    identity = (data.get("identity") or "").strip()
    otp = (data.get("otp") or "").strip()
    new_password = data.get("new_password") or ""
    if not identity or not otp or not new_password:
        return jsonify({"error": "identity, otp, new_password la bat buoc"}), 400

    db = SessionLocal()
    try:
        stmt = select(TaiKhoan).where(
            (TaiKhoan.ten_dang_nhap == identity) | (TaiKhoan.email == identity.lower())
        )
        tk = db.execute(stmt).scalars().first()
        if not tk:
            return jsonify({"error": "Khong tim thay tai khoan"}), 404

        stmt_otp = (
            select(MaXacThuc)
            .where(
                (MaXacThuc.user_id == tk.user_id) &
                (MaXacThuc.loai == "reset_password") &
                (MaXacThuc.da_dung_luc.is_(None)) &
                (MaXacThuc.het_han_luc > now_utc())
            )
            .order_by(MaXacThuc.tao_luc.desc())
        )
        row = db.execute(stmt_otp).scalars().first()
        if not row:
            return jsonify({"error": "OTP khong hop le hoac het han"}), 400
        if row.ma_hash != hash_otp(otp):
            return jsonify({"error": "OTP sai"}), 400

        tk.mat_khau_hash = hash_password(new_password)
        tk.cap_nhat_luc = now_utc()
        row.da_dung_luc = now_utc()

        db.commit()
        return jsonify({"message": "Doi mat khau thanh cong"}), 200
    finally:
        db.close()

# Xác thực email bằng OTP
@auth_bp.post("/verify-email")
def verify_email():
    data = request.get_json(force=True)
    identity = (data.get("identity") or "").strip()
    otp = (data.get("otp") or "").strip()
    if not identity or not otp:
        return jsonify({"error":"identity va otp la bat buoc"}), 400

    db = SessionLocal()
    try:
        stmt = select(TaiKhoan).where(
            (TaiKhoan.ten_dang_nhap == identity) | (TaiKhoan.email == identity.lower())
        )
        tk = db.execute(stmt).scalars().first()
        if not tk: return jsonify({"error":"Khong tim thay tai khoan"}), 404

        stmt_otp = (select(MaXacThuc)
            .where(
                (MaXacThuc.user_id==tk.user_id) &
                (MaXacThuc.loai=="verify_email") &
                (MaXacThuc.da_dung_luc.is_(None)) &
                (MaXacThuc.het_han_luc > now_utc())
            ).order_by(MaXacThuc.tao_luc.desc())
        )
        row = db.execute(stmt_otp).scalars().first()
        if not row or row.ma_hash != hash_otp(otp):
            return jsonify({"error":"OTP khong hop le hoac het han"}), 400

        row.da_dung_luc = now_utc()
        tk.email_xac_thuc_at = now_utc()
        db.commit()
        return jsonify({"message":"Xac thuc email thanh cong"}), 200
    finally:
        db.close()

# Gửi lại OTP xác thực email
@auth_bp.post("/resend-verify-otp")
def resend_verify_otp():
    data = request.get_json(force=True)
    identity = (data.get("identity") or "").strip()
    if not identity:
        return jsonify({"error":"identity la bat buoc"}), 400

    db = SessionLocal()
    try:
        tk = db.execute(select(TaiKhoan).where(
            (TaiKhoan.ten_dang_nhap == identity) | (TaiKhoan.email == identity.lower())
        )).scalars().first()
        if not tk:  # ẩn sự tồn tại user
            return jsonify({"message":"Neu tai khoan ton tai, OTP da duoc gui"}), 200

        otp_plain = gen_otp()
        with db.begin():
            db.add(MaXacThuc(
                user_id=tk.user_id, loai="verify_email",
                ma_hash=hash_otp(otp_plain),
                het_han_luc=otp_expiry(OTP_TTL_MINUTES)
            ))
            from app.services.emailer import send_otp_email
            send_otp_email(tk.email, otp_plain, "verify_email")

        return jsonify({"message":"Da gui lai OTP xac thuc email"}), 200
    finally:
        db.close()
