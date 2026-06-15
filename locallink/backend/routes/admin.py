# backend/routes/admin.py
import logging
import traceback
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.database import get_db
import mysql.connector

logger = logging.getLogger(__name__)
admin_bp = Blueprint("admin", __name__)

def require_admin(uid):
    db = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute("SELECT role FROM users WHERE id=%s", (uid,))
        u = cur.fetchone()
        return u and u["role"] == "admin"
    finally:
        cur.close()

@admin_bp.get("/dashboard")
@jwt_required()
def dashboard():
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        if not require_admin(uid): return jsonify({"error": "Forbidden"}), 403

        db = get_db(); cur = db.cursor(dictionary=True)
        cur.execute("SELECT COUNT(*) AS c FROM users WHERE role='farmer'")
        farmers = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) AS c FROM users WHERE role='vendor'")
        vendors = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) AS c FROM products WHERE is_available=TRUE")
        products = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) AS c FROM orders")
        orders = cur.fetchone()["c"]
        cur.execute("SELECT SUM(total_amount) AS rev FROM orders WHERE status='delivered'")
        revenue = cur.fetchone()["rev"] or 0
        cur.execute("SELECT COUNT(*) AS c FROM orders WHERE status='pending'")
        pending = cur.fetchone()["c"]

        # Monthly orders chart – PostgreSQL uses TO_CHAR instead of DATE_FORMAT
        cur.execute("""
            SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*) AS count,
                   SUM(total_amount) AS revenue
            FROM orders GROUP BY TO_CHAR(created_at, 'YYYY-MM') ORDER BY month DESC LIMIT 6
        """)
        monthly = cur.fetchall()

        # Category distribution
        cur.execute("""
            SELECT c.name, COUNT(p.id) AS count
            FROM categories c LEFT JOIN products p ON p.category_id=c.id
            GROUP BY c.id, c.name ORDER BY count DESC
        """)
        categories = cur.fetchall()

        # Recent users
        cur.execute("SELECT id,full_name,email,role,created_at,is_active FROM users ORDER BY created_at DESC LIMIT 5")
        recent_users = cur.fetchall()

        return jsonify({
            "stats": {
                "farmers":       farmers,
                "vendors":       vendors,
                "products":      products,
                "orders":        orders,
                "revenue":       float(revenue),
                "pending_orders": pending,
            },
            "monthly_data":   monthly,
            "category_data":  categories,
            "recent_users":   recent_users,
        }), 200

    except mysql.connector.Error as e:
        logger.error(f"[admin.dashboard] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[admin.dashboard] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@admin_bp.get("/users")
@jwt_required()
def list_users():
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        if not require_admin(uid): return jsonify({"error": "Forbidden"}), 403

        db = get_db(); cur = db.cursor(dictionary=True)
        role = request.args.get("role", "")
        sql  = "SELECT id,full_name,email,role,phone,is_active,is_verified,created_at FROM users"
        params = []
        if role:
            sql += " WHERE role=%s"; params.append(role)
        sql += " ORDER BY created_at DESC"
        cur.execute(sql, params)
        return jsonify(cur.fetchall()), 200

    except mysql.connector.Error as e:
        logger.error(f"[admin.list_users] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[admin.list_users] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@admin_bp.put("/users/<int:user_id>/toggle")
@jwt_required()
def toggle_user(user_id):
    conn = get_db()
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        if not require_admin(uid): return jsonify({"error": "Forbidden"}), 403

        cur = conn.cursor(dictionary=True)
        # PostgreSQL: NOT is_active works correctly for boolean columns
        cur.execute("UPDATE users SET is_active = NOT is_active WHERE id=%s", (user_id,))
        conn.commit()
        return jsonify({"message": "User status toggled"}), 200

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[admin.toggle_user] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[admin.toggle_user] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@admin_bp.get("/products")
@jwt_required()
def list_products():
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        if not require_admin(uid): return jsonify({"error": "Forbidden"}), 403

        db = get_db(); cur = db.cursor(dictionary=True)
        cur.execute("""
            SELECT p.*, c.name AS category_name, u.full_name AS farmer_name, f.farm_name
            FROM products p
            JOIN categories c ON c.id=p.category_id
            JOIN farmers f ON f.id=p.farmer_id
            JOIN users u ON u.id=f.user_id
            ORDER BY p.created_at DESC
        """)
        return jsonify(cur.fetchall()), 200

    except mysql.connector.Error as e:
        logger.error(f"[admin.list_products] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[admin.list_products] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@admin_bp.delete("/products/<int:pid>")
@jwt_required()
def delete_product(pid):
    conn = get_db()
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        if not require_admin(uid): return jsonify({"error": "Forbidden"}), 403

        cur = conn.cursor(dictionary=True)
        cur.execute("DELETE FROM products WHERE id=%s", (pid,))
        conn.commit()
        return jsonify({"message": "Product deleted"}), 200

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[admin.delete_product] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[admin.delete_product] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@admin_bp.get("/orders")
@jwt_required()
def list_orders():
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        if not require_admin(uid): return jsonify({"error": "Forbidden"}), 403

        db = get_db(); cur = db.cursor(dictionary=True)
        status = request.args.get("status", "")
        sql    = """
            SELECT o.*, u.full_name AS vendor_name
            FROM orders o JOIN vendors v ON v.id=o.vendor_id JOIN users u ON u.id=v.user_id
        """
        params = []
        if status:
            sql += " WHERE o.status=%s"; params.append(status)
        sql += " ORDER BY o.created_at DESC LIMIT 100"
        cur.execute(sql, params)
        return jsonify(cur.fetchall()), 200

    except mysql.connector.Error as e:
        logger.error(f"[admin.list_orders] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[admin.list_orders] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@admin_bp.put("/products/<int:pid>/feature")
@jwt_required()
def toggle_feature(pid):
    conn = get_db()
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        if not require_admin(uid): return jsonify({"error": "Forbidden"}), 403

        cur = conn.cursor(dictionary=True)
        cur.execute("UPDATE products SET is_featured = NOT is_featured WHERE id=%s", (pid,))
        conn.commit()
        return jsonify({"message": "Updated"}), 200

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[admin.toggle_feature] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[admin.toggle_feature] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500
