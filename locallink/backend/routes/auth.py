# backend/routes/auth.py
# ============================================================
#  LocalLink – Authentication Routes
#  Uses PostgreSQL directly via get_db() + bcrypt + JWT.
#  NO Supabase dependency.
# ============================================================

import logging
import traceback
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from config.database import get_db
import bcrypt
import re
import mysql.connector

logger = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__)

# ── Helpers ───────────────────────────────────────────────────

def _hash_pw(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def _check_pw(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def _valid_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))


def _row_to_dict(row) -> dict:
    """Convert a psycopg2 RealDictRow (or regular tuple) to a plain dict."""
    if row is None:
        return {}
    if hasattr(row, "keys"):
        return dict(row)
    return row


# ── REGISTER ─────────────────────────────────────────────────

@auth_bp.post("/register")
def register():
    conn = get_db()
    try:
        data = request.get_json(silent=True) or {}
        logger.info(f"[register] Starting registration attempt for email={data.get('email')} role={data.get('role')}")

        # ── Validation ────────────────────────────────────────────
        required = ["email", "password", "full_name", "role", "phone"]
        missing  = [f for f in required if not str(data.get(f, "")).strip()]
        if missing:
            logger.warning(f"[register] Missing fields: {missing}")
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        email     = data["email"].strip().lower()
        password  = data["password"]
        full_name = data["full_name"].strip()
        role      = data["role"].strip().lower()
        phone     = data["phone"].strip()

        logger.info(f"[register] Email formatting and field check passed for {email}")

        if not _valid_email(email):
            logger.warning(f"[register] Invalid email address: {email}")
            return jsonify({"error": "Invalid email address"}), 400
        if len(password) < 6:
            logger.warning(f"[register] Password too short for {email}")
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        if role not in ("farmer", "vendor", "customer"):
            logger.warning(f"[register] Invalid role: {role}")
            return jsonify({"error": "Role must be farmer, vendor, or customer"}), 400

        # ── Role-specific required fields ─────────────────────────
        if role == "farmer" and not data.get("farm_name", "").strip():
            logger.warning(f"[register] Missing farm_name for farmer {email}")
            return jsonify({"error": "farm_name is required for farmer registration"}), 400
        if role == "vendor" and not data.get("shop_name", "").strip():
            logger.warning(f"[register] Missing shop_name for vendor {email}")
            return jsonify({"error": "shop_name is required for vendor registration"}), 400

        logger.info(f"[register] Role specific validations passed for {email}")

        cur = conn.cursor(dictionary=True)

        # ── Duplicate check ───────────────────────────────────
        cur.execute("SELECT id FROM users WHERE email=%s", (email,))
        if cur.fetchone():
            logger.warning(f"[register] Email already registered: {email}")
            return jsonify({"error": "Email already registered. Please log in."}), 409

        logger.info(f"[register] Duplicate check passed. Registering user...")

        # ── Insert user ───────────────────────────────────────
        hashed_pw = _hash_pw(password)
        cur.execute(
            """
            INSERT INTO users (email, password, role, full_name, phone, is_active, is_verified)
            VALUES (%s, %s, %s, %s, %s, 1, 1)
            RETURNING id
            """,
            (email, hashed_pw, role, full_name, phone),
        )
        user_id = cur.fetchone()["id"]
        logger.info(f"[register] User record inserted with id={user_id}")

        # ── Insert role-specific profile ──────────────────────
        village  = data.get("village",  "").strip()
        district = data.get("district", "").strip()
        state    = data.get("state",    "").strip()
        pincode  = data.get("pincode",  "").strip()
        location = f"{village}, {district}" if village else district

        if role == "farmer":
            farm_name = data["farm_name"].strip()
            cur.execute(
                """
                INSERT INTO farmers (user_id, farm_name, location, village, district, state, pincode)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (user_id, farm_name, location, village, district, state, pincode),
            )
            profile_id = cur.fetchone()["id"]
            logger.info(f"[register] Farmer profile created with id={profile_id}")

        elif role == "vendor":
            shop_name = data["shop_name"].strip()
            cur.execute(
                """
                INSERT INTO vendors (user_id, shop_name, location, village, district, state, pincode)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (user_id, shop_name, location, village, district, state, pincode),
            )
            profile_id = cur.fetchone()["id"]
            logger.info(f"[register] Vendor profile created with id={profile_id}")

        else:  # customer – store in vendors table (matches existing schema)
            shop_name = data.get("shop_name", full_name).strip() or full_name
            cur.execute(
                """
                INSERT INTO vendors (user_id, shop_name, location, village, district, state, pincode)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (user_id, shop_name, location, village, district, state, pincode),
            )
            profile_id = cur.fetchone()["id"]
            logger.info(f"[register] Customer profile created with id={profile_id}")

        conn.commit()
        logger.info(f"[register] Transaction committed successfully for user_id={user_id}")

        # ── Issue tokens ──────────────────────────────────────
        access_token  = create_access_token(
            identity=str(user_id),
            additional_claims={"role": role},
        )
        refresh_token = create_refresh_token(identity=str(user_id))

        logger.info(f"[register] Registration successful. Issuing tokens for user_id={user_id}")

        return jsonify({
            "message":       "Registration successful",
            "access_token":  access_token,
            "refresh_token": refresh_token,
            "role":          role,
            "user": {
                "id":         user_id,
                "email":      email,
                "full_name":  full_name,
                "role":       role,
                "profile_id": profile_id,
            },
        }), 201

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[register] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[register] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Registration failed",
            "detail": str(e)
        }), 500


# ── LOGIN ─────────────────────────────────────────────────────

@auth_bp.post("/login")
def login():
    try:
        data = request.get_json(silent=True) or {}
        email    = str(data.get("email",    "")).strip().lower()
        password = str(data.get("password", "")).strip()

        logger.info(f"[login] attempt email={email}")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        conn = get_db()
        cur = conn.cursor(dictionary=True)

        # ── Fetch user ────────────────────────────────────────
        cur.execute(
            "SELECT id, email, password, role, full_name, phone, is_active FROM users WHERE email=%s",
            (email,),
        )
        user = cur.fetchone()

        if not user:
            logger.warning(f"[login] user not found: {email}")
            return jsonify({"error": "User not found. Please register first."}), 404

        if not user["is_active"]:
            logger.warning(f"[login] account inactive: {email}")
            return jsonify({"error": "Account is inactive. Contact support."}), 403

        # ── Verify password ───────────────────────────────────
        if not _check_pw(password, user["password"]):
            logger.warning(f"[login] invalid password for: {email}")
            return jsonify({"error": "Invalid password"}), 401

        user_id = user["id"]
        role    = user["role"]
        logger.info(f"[login] success user_id={user_id} role={role}")

        # ── Fetch role-specific profile ───────────────────────
        profile_id = None
        village = district = state = pincode = ""

        try:
            if role == "farmer":
                cur.execute(
                    "SELECT id, village, district, state, pincode FROM farmers WHERE user_id=%s",
                    (user_id,),
                )
            else:  # vendor or customer – both stored in vendors
                cur.execute(
                    "SELECT id, village, district, state, pincode FROM vendors WHERE user_id=%s",
                    (user_id,),
                )
            p = cur.fetchone()
            if p:
                profile_id = p["id"]
                village    = p["village"]  or ""
                district   = p["district"] or ""
                state      = p["state"]    or ""
                pincode    = p["pincode"]  or ""
        except Exception as exc:
            logger.warning(f"[login] could not fetch profile: {exc}")

        # ── Issue tokens ──────────────────────────────────────
        access_token  = create_access_token(
            identity=str(user_id),
            additional_claims={"role": role},
        )
        refresh_token = create_refresh_token(identity=str(user_id))

        return jsonify({
            "access_token":  access_token,
            "refresh_token": refresh_token,
            "user": {
                "id":         user_id,
                "email":      email,
                "full_name":  user["full_name"],
                "role":       role,
                "profile_id": profile_id,
                "village":    village,
                "district":   district,
                "state":      state,
                "pincode":    pincode,
            },
        }), 200

    except mysql.connector.Error as e:
        logger.error(f"[login] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[login] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500


# ── REFRESH TOKEN ─────────────────────────────────────────────

@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass
        return jsonify({"access_token": create_access_token(identity=str(uid))}), 200
    except mysql.connector.Error as e:
        logger.error(f"[refresh] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[refresh] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500


# ── CURRENT USER /me ──────────────────────────────────────────

@auth_bp.get("/me")
@jwt_required()
def me():
    try:
        uid  = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT id, email, full_name, role, phone, avatar_url, is_active FROM users WHERE id=%s",
            (uid,),
        )
        user = cur.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404

        role       = user["role"]
        profile_id = None
        village = district = state = pincode = ""

        try:
            if role == "farmer":
                cur.execute(
                    "SELECT id, village, district, state, pincode FROM farmers WHERE user_id=%s",
                    (uid,),
                )
            else:
                cur.execute(
                    "SELECT id, village, district, state, pincode FROM vendors WHERE user_id=%s",
                    (uid,),
                )
            p = cur.fetchone()
            if p:
                profile_id = p["id"]
                village    = p["village"]  or ""
                district   = p["district"] or ""
                state      = p["state"]    or ""
                pincode    = p["pincode"]  or ""
        except Exception as exc:
            logger.warning(f"[me] could not fetch profile: {exc}")

        return jsonify({
            "id":         user["id"],
            "email":      user["email"],
            "full_name":  user["full_name"],
            "role":       role,
            "phone":      user.get("phone"),
            "avatar_url": user.get("avatar_url"),
            "profile_id": profile_id,
            "village":    village,
            "district":   district,
            "state":      state,
            "pincode":    pincode,
        }), 200

    except mysql.connector.Error as e:
        logger.error(f"[me] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[me] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500


# ── CHANGE PASSWORD ───────────────────────────────────────────

@auth_bp.post("/change-password")
@jwt_required()
def change_password():
    conn = get_db()
    try:
        uid  = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        data = request.get_json(silent=True) or {}
        old_pw = data.get("old_password", "")
        new_pw = data.get("new_password", "")

        if not old_pw or not new_pw:
            return jsonify({"error": "old_password and new_password are required"}), 400
        if len(new_pw) < 6:
            return jsonify({"error": "New password must be at least 6 characters"}), 400

        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT password FROM users WHERE id=%s", (uid,))
        user = cur.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404
        if not _check_pw(old_pw, user["password"]):
            return jsonify({"error": "Current password is incorrect"}), 401
        cur.execute(
            "UPDATE users SET password=%s WHERE id=%s",
            (_hash_pw(new_pw), uid),
        )
        conn.commit()
        return jsonify({"message": "Password changed successfully"}), 200

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[change-password] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[change-password] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500


# ── DEBUG /debug/db ───────────────────────────────────────────

@auth_bp.get("/debug/db")
def debug_db():
    try:
        conn = get_db()
        cur  = conn.cursor(dictionary=True)
        cur.execute("SELECT COUNT(*) AS cnt FROM users")
        user_count = cur.fetchone()["cnt"]
        cur.execute("SELECT COUNT(*) AS cnt FROM farmers")
        farmer_count = cur.fetchone()["cnt"]
        cur.execute("SELECT COUNT(*) AS cnt FROM vendors")
        vendor_count = cur.fetchone()["cnt"]
        return jsonify({
            "database_connected":  True,
            "users_table_exists":  True,
            "user_count":          user_count,
            "farmer_count":        farmer_count,
            "vendor_count":        vendor_count,
            "database_type":       "PostgreSQL",
        }), 200

    except mysql.connector.Error as e:
        logger.error(f"[debug_db] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[debug_db] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500
