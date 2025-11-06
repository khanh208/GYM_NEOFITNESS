from datetime import datetime, timezone
from sqlalchemy import BigInteger, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base

class TaiKhoan(Base):
    __tablename__ = "tai_khoan"
    user_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    ten_dang_nhap: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    mat_khau_hash: Mapped[str] = mapped_column(Text, nullable=False)
    mat_khau_algo: Mapped[str] = mapped_column(String(16), nullable=False, default="argon2id")
    email_xac_thuc_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    trang_thai: Mapped[str] = mapped_column(String(16), nullable=False, default="active")
    tao_luc: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    cap_nhat_luc: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))

class MaXacThuc(Base):
    __tablename__ = "ma_xac_thuc"
    otp_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("tai_khoan.user_id", ondelete="CASCADE"), nullable=False)
    loai: Mapped[str] = mapped_column(String(20), nullable=False)  # verify_email | reset_password | login_otp
    ma_hash: Mapped[str] = mapped_column(Text, nullable=False)
    het_han_luc: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    da_dung_luc: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    tao_luc: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
