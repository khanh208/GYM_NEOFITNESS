# app/core/config.py
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Luôn tìm .env ở gốc dự án (…\neofitness-api\.env)
ROOT_DIR = Path(__file__).resolve().parents[2]  # app/core -> app -> goc
ENV_PATH = ROOT_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)  # nạp .env theo path tuyệt đối

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # In ra thông tin giúp debug nếu vẫn None
    raise RuntimeError(f"DATABASE_URL not set. Expected in {ENV_PATH}")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt")
