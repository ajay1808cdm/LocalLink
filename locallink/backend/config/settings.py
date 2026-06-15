# backend/config/settings.py
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY      = os.getenv("SECRET_KEY",     "locallink-secret-2024")
    JWT_SECRET_KEY  = os.getenv("JWT_SECRET_KEY", "jwt-locallink-2024")
    JWT_ACCESS_TOKEN_EXPIRES  = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # ── PostgreSQL ────────────────────────────────────────────────
    # Accepts either a full DATABASE_URL (e.g. on Antigravity/Render)
    # or individual PG_* variables for local development.
    _db_url = os.getenv("DATABASE_URL")
    if not _db_url:
        _pg_user = os.getenv("PG_USER",     os.getenv("PGUSER",     "postgres"))
        _pg_pass = os.getenv("PG_PASSWORD", os.getenv("PGPASSWORD", "postgres"))
        _pg_host = os.getenv("PG_HOST",     os.getenv("PGHOST",     "localhost"))
        _pg_port = os.getenv("PG_PORT",     os.getenv("PGPORT",     "5432"))
        _pg_db   = os.getenv("PG_DB",       os.getenv("PGDATABASE", "locallink_db"))
        _db_url  = f"postgresql://{_pg_user}:{_pg_pass}@{_pg_host}:{_pg_port}/{_pg_db}"

    SQLALCHEMY_DATABASE_URI    = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── CORS ──────────────────────────────────────────────────────
    # Comma-separated list of allowed origins; defaults to * for dev
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")

    # ── File uploads ──────────────────────────────────────────────
    UPLOAD_FOLDER      = os.path.join(os.path.dirname(__file__), "..", "static", "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024   # 16 MB
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
