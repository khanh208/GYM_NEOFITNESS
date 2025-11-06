import os, secrets, hashlib, jwt
from datetime import datetime, timedelta, timezone
from argon2 import PasswordHasher

ph = PasswordHasher()
JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt")

def hash_password(plain: str) -> str:
    return ph.hash(plain)

def verify_password(hashed: str, plain: str) -> bool:
    try:
        return ph.verify(hashed, plain)
    except Exception:
        return False

def create_access_token(payload: dict, exp_minutes: int = 60) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + timedelta(minutes=exp_minutes)
    return jwt.encode(data, JWT_SECRET, algorithm="HS256")

def gen_otp() -> str:
    return f"{secrets.randbelow(10**6):06d}"

def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode("utf-8")).hexdigest()

def now_utc():
    return datetime.now(timezone.utc)

def otp_expiry(minutes: int):
    return now_utc() + timedelta(minutes=minutes)
