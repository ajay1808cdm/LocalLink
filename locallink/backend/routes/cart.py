# backend/routes/cart.py
import logging
import traceback
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.database import get_db
import mysql.connector

logger = logging.getLogger(__name__)
cart_bp = Blueprint("cart", __name__)

@cart_bp.get("/")
@jwt_required()
def get_cart():
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        db = get_db(); cur = db.cursor(dictionary=True)
        cur.execute("SELECT id FROM vendors WHERE user_id=%s", (uid,))
        v = cur.fetchone()
        if not v: return jsonify({"error":"Unauthorized"}), 403
        cur.execute("""
            SELECT c.*, p.name,p.price,p.unit,p.image_url,p.available_qty,
                   f.farm_name, u.full_name AS farmer_name
            FROM cart c
            JOIN products p ON p.id=c.product_id
            JOIN farmers f ON f.id=p.farmer_id
            JOIN users u ON u.id=f.user_id
            WHERE c.vendor_id=%s
        """, (v["id"],))
        items = cur.fetchall()
        total = sum(float(i["price"])*float(i["quantity"]) for i in items)
        return jsonify({"items":items,"total":round(total,2)}), 200

    except mysql.connector.Error as e:
        logger.error(f"[cart.get_cart] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[cart.get_cart] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@cart_bp.post("/add")
@jwt_required()
def add_to_cart():
    conn = get_db()
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id FROM vendors WHERE user_id=%s", (uid,))
        v = cur.fetchone()
        if not v: return jsonify({"error":"Unauthorized"}), 403
        data = request.get_json()
        
        # Database-agnostic ON DUPLICATE KEY UPDATE fallback
        cur.execute("SELECT id, quantity FROM cart WHERE vendor_id=%s AND product_id=%s", (v["id"], data["product_id"]))
        existing = cur.fetchone()
        if existing:
            new_qty = float(existing["quantity"]) + float(data.get("quantity", 1))
            cur.execute("UPDATE cart SET quantity=%s WHERE id=%s", (new_qty, existing["id"]))
        else:
            cur.execute("INSERT INTO cart (vendor_id,product_id,quantity) VALUES(%s,%s,%s)",
                        (v["id"], data["product_id"], data.get("quantity", 1)))
        conn.commit()
        return jsonify({"message":"Added to cart"}), 200

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[cart.add_to_cart] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[cart.add_to_cart] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@cart_bp.put("/<int:pid>")
@jwt_required()
def update_cart(pid):
    conn = get_db()
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id FROM vendors WHERE user_id=%s", (uid,))
        v = cur.fetchone()
        if not v: return jsonify({"error":"Unauthorized"}), 403
        
        data = request.get_json()
        cur.execute("UPDATE cart SET quantity=%s WHERE vendor_id=%s AND product_id=%s", (data["quantity"], v["id"], pid))
        conn.commit()
        return jsonify({"message":"Updated"}), 200

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[cart.update_cart] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[cart.update_cart] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@cart_bp.delete("/<int:pid>")
@jwt_required()
def remove_from_cart(pid):
    conn = get_db()
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id FROM vendors WHERE user_id=%s", (uid,))
        v = cur.fetchone()
        if not v: return jsonify({"error":"Unauthorized"}), 403
        
        cur.execute("DELETE FROM cart WHERE vendor_id=%s AND product_id=%s", (v["id"], pid))
        conn.commit()
        return jsonify({"message":"Removed"}), 200

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[cart.remove_from_cart] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[cart.remove_from_cart] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@cart_bp.delete("/clear")
@jwt_required()
def clear_cart():
    conn = get_db()
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id FROM vendors WHERE user_id=%s", (uid,))
        v = cur.fetchone()
        if not v: return jsonify({"error":"Unauthorized"}), 403
        
        cur.execute("DELETE FROM cart WHERE vendor_id=%s", (v["id"],))
        conn.commit()
        return jsonify({"message":"Cart cleared"}), 200

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[cart.clear_cart] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[cart.clear_cart] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500
