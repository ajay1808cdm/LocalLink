# backend/routes/debug.py
import logging
import traceback
import re
from flask import Blueprint, request, jsonify
from config.database import get_db, check_db_health
import mysql.connector

logger = logging.getLogger(__name__)
debug_bp = Blueprint("debug", __name__)

def _valid_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))

@debug_bp.get("/db")
def debug_db_status():
    try:
        health = check_db_health()
        columns = []
        if health["database_connected"]:
            db = get_db()
            cur = db.cursor(dictionary=True)
            # Fetch user table columns
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users'
            """)
            columns = [row["column_name"] for row in cur.fetchall()]
        
        return jsonify({
            **health,
            "users_columns": columns
        }), 200

    except mysql.connector.Error as e:
        logger.error(f"[debug.debug_db_status] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[debug.debug_db_status] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@debug_bp.post("/register-dry-run")
def register_dry_run():
    try:
        data = request.get_json(silent=True) or {}
        
        # 1. Required fields validation
        required = ["email", "password", "full_name", "role", "phone"]
        missing  = [f for f in required if not str(data.get(f, "")).strip()]
        if missing:
            return jsonify({
                "valid": False,
                "step": "required_fields",
                "error": f"Missing required fields: {', '.join(missing)}"
            }), 400

        email     = data["email"].strip().lower()
        password  = data["password"]
        full_name = data["full_name"].strip()
        role      = data["role"].strip().lower()
        phone     = data["phone"].strip()

        # 2. Email format validation
        if not _valid_email(email):
            return jsonify({
                "valid": False,
                "step": "email_format",
                "error": "Invalid email address"
            }), 400

        # 3. Password length validation
        if len(password) < 6:
            return jsonify({
                "valid": False,
                "step": "password_length",
                "error": "Password must be at least 6 characters"
            }), 400

        # 4. Role validation
        if role not in ("farmer", "vendor", "customer"):
            return jsonify({
                "valid": False,
                "step": "role_validation",
                "error": "Role must be farmer, vendor, or customer"
            }), 400

        # 5. Role-specific validation
        if role == "farmer" and not data.get("farm_name", "").strip():
            return jsonify({
                "valid": False,
                "step": "role_specific_farmer",
                "error": "farm_name is required for farmer registration"
            }), 400
        if role == "vendor" and not data.get("shop_name", "").strip():
            return jsonify({
                "valid": False,
                "step": "role_specific_vendor",
                "error": "shop_name is required for vendor registration"
            }), 400

        # 6. Database duplicate email check
        db = get_db()
        cur = db.cursor(dictionary=True)
        cur.execute("SELECT id FROM users WHERE email=%s", (email,))
        if cur.fetchone():
            return jsonify({
                "valid": False,
                "step": "duplicate_check",
                "error": "Email already registered. Please log in."
            }), 409

        return jsonify({
            "valid": True,
            "message": "Validation passed. Dry-run successful."
        }), 200

    except mysql.connector.Error as e:
        logger.error(f"[debug.register_dry_run] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[debug.register_dry_run] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500
