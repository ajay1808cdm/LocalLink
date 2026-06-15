#!/usr/bin/env python3
"""
seed_demo_users.py
==================
Seeds demo accounts directly into PostgreSQL (no Supabase).

Usage:
    cd locallink/backend
    python seed_demo_users.py

Environment variables required (or set in .env):
    DATABASE_URL  –or–  PG_USER / PG_PASSWORD / PG_HOST / PG_PORT / PG_DB
"""

import os
import sys
import logging
import bcrypt
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# ── Logging ───────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger(__name__)

# ── Load .env ─────────────────────────────────────────────────
load_dotenv()

# ── Build DB connection string ────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    user   = os.getenv("PG_USER",     os.getenv("PGUSER",     "postgres"))
    pw     = os.getenv("PG_PASSWORD", os.getenv("PGPASSWORD", "postgres"))
    host   = os.getenv("PG_HOST",     os.getenv("PGHOST",     "localhost"))
    port   = os.getenv("PG_PORT",     os.getenv("PGPORT",     "5432"))
    dbname = os.getenv("PG_DB",       os.getenv("PGDATABASE", "locallink_db"))
    DATABASE_URL = f"postgresql://{user}:{pw}@{host}:{port}/{dbname}"

# ── Demo accounts ─────────────────────────────────────────────
DEMO_USERS = [
    {
        "email":     "customer@locallink.com",
        "password":  "Customer@123",
        "role":      "customer",
        "full_name": "LocalLink Customer",
        "phone":     "9999999993",
        "shop_name": "Customer Shop",
        "village":   "Coimbatore Village",
        "district":  "Coimbatore",
        "state":     "Tamil Nadu",
        "pincode":   "641001",
    },
    {
        "email":     "vendor@locallink.com",
        "password":  "Vendor@123",
        "role":      "vendor",
        "full_name": "LocalLink Vendor",
        "phone":     "9999999992",
        "shop_name": "LocalLink Vendor Shop",
        "village":   "Market Town",
        "district":  "Coimbatore",
        "state":     "Tamil Nadu",
        "pincode":   "641002",
    },
    {
        "email":     "farmer@locallink.com",
        "password":  "Farmer@123",
        "role":      "farmer",
        "full_name": "LocalLink Farmer",
        "phone":     "9999999991",
        "farm_name": "LocalLink Farm",
        "village":   "Green Village",
        "district":  "Coimbatore",
        "state":     "Tamil Nadu",
        "pincode":   "641001",
    },
    {
        "email":     "admin@locallink.com",
        "password":  "Admin@123",
        "role":      "admin",
        "full_name": "LocalLink Admin",
        "phone":     "9999999999",
    },
]


def hash_pw(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def seed_user(cur, u: dict) -> int | None:
    """Insert user if not present; return user_id."""
    cur.execute("SELECT id FROM users WHERE email=%s", (u["email"],))
    row = cur.fetchone()
    if row:
        log.info(f"  ✓ already exists: {u['email']}")
        return row["id"]

    hashed = hash_pw(u["password"])
    cur.execute(
        "INSERT INTO users (email, password, role, full_name, phone, is_active, is_verified)"
        " VALUES (%s,%s,%s,%s,%s,TRUE,TRUE) RETURNING id",
        (u["email"], hashed, u["role"], u["full_name"], u.get("phone", "")),
    )
    user_id = cur.fetchone()["id"]
    log.info(f"  + created: {u['email']}  (id={user_id})")
    return user_id


def seed_farmer_profile(cur, user_id: int, u: dict):
    cur.execute("SELECT id FROM farmers WHERE user_id=%s", (user_id,))
    if cur.fetchone():
        return
    village  = u.get("village", "")
    district = u.get("district", "")
    cur.execute(
        "INSERT INTO farmers (user_id, farm_name, location, village, district, state, pincode)"
        " VALUES (%s,%s,%s,%s,%s,%s,%s)",
        (user_id, u.get("farm_name", "Demo Farm"),
         f"{village}, {district}", village, district,
         u.get("state", ""), u.get("pincode", "")),
    )
    log.info(f"  + farmer profile created for user_id={user_id}")


def seed_vendor_profile(cur, user_id: int, u: dict):
    cur.execute("SELECT id FROM vendors WHERE user_id=%s", (user_id,))
    if cur.fetchone():
        return
    village  = u.get("village", "")
    district = u.get("district", "")
    cur.execute(
        "INSERT INTO vendors (user_id, shop_name, location, village, district, state, pincode)"
        " VALUES (%s,%s,%s,%s,%s,%s,%s)",
        (user_id, u.get("shop_name", "Demo Shop"),
         f"{village}, {district}", village, district,
         u.get("state", ""), u.get("pincode", "")),
    )
    log.info(f"  + vendor profile created for user_id={user_id}")


def main():
    log.info(f"Connecting to: {DATABASE_URL.split('@')[-1]}")  # hide credentials in log
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    except Exception as exc:
        log.error(f"❌ Could not connect to database: {exc}")
        sys.exit(1)

    try:
        for u in DEMO_USERS:
            log.info(f"\nSeeding [{u['role']}] {u['email']} ...")
            user_id = seed_user(cur, u)
            if user_id is None:
                continue
            if u["role"] == "farmer":
                seed_farmer_profile(cur, user_id, u)
            elif u["role"] in ("vendor", "customer"):
                seed_vendor_profile(cur, user_id, u)
            # admin – users table only

        conn.commit()
        log.info("\n✅ All demo users seeded successfully.\n")
        log.info("Demo Accounts:")
        log.info("  customer@locallink.com / Customer@123")
        log.info("  vendor@locallink.com   / Vendor@123")
        log.info("  farmer@locallink.com   / Farmer@123")
        log.info("  admin@locallink.com    / Admin@123")

    except Exception as exc:
        conn.rollback()
        log.error(f"❌ Seeding failed: {exc}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
