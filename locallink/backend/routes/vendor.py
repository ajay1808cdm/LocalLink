# backend/routes/vendor.py
import logging
import traceback
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.database import get_db
import mysql.connector

logger = logging.getLogger(__name__)
vendor_bp = Blueprint("vendor", __name__)

@vendor_bp.get("/dashboard")
@jwt_required()
def dashboard():
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        db = get_db(); cur = db.cursor(dictionary=True)
        cur.execute("SELECT * FROM vendors WHERE user_id=%s", (uid,))
        vendor = cur.fetchone()
        if not vendor: return jsonify({"error":"Not a vendor"}), 403

        vid = vendor["id"]
        cur.execute("SELECT COUNT(*) AS total, SUM(total_amount) AS spent FROM orders WHERE vendor_id=%s AND status NOT IN('cancelled')", (vid,))
        stats = cur.fetchone()

        cur.execute("SELECT COUNT(*) AS total FROM orders WHERE vendor_id=%s AND status='pending'", (vid,))
        pending = cur.fetchone()["total"]

        cur.execute("""
            SELECT o.order_number, o.status, o.total_amount, o.created_at
            FROM orders o WHERE o.vendor_id=%s ORDER BY o.created_at DESC LIMIT 5
        """, (vid,))
        recent_orders = cur.fetchall()

        cur.execute("SELECT COUNT(*) AS total FROM wishlist WHERE vendor_id=%s", (vid,))
        wishlist_count = cur.fetchone()["total"]

        return jsonify({
            "vendor": vendor,
            "stats": {
                "total_orders": stats["total"] or 0,
                "total_spent": float(stats["spent"] or 0),
                "pending_orders": pending,
                "wishlist_count": wishlist_count
            },
            "recent_orders": recent_orders
        }), 200

    except mysql.connector.Error as e:
        logger.error(f"[vendor.dashboard] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[vendor.dashboard] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@vendor_bp.get("/nearby-farmers")
def nearby_farmers():
    try:
        db = get_db(); cur = db.cursor(dictionary=True)
        district = request.args.get("district","")
        sql = """
            SELECT f.id, f.farm_name, f.village, f.district, f.state, f.rating,
                   f.total_reviews, u.full_name, u.avatar_url,
                   COUNT(p.id) AS product_count
            FROM farmers f
            JOIN users u ON u.id=f.user_id
            LEFT JOIN products p ON p.farmer_id=f.id AND p.is_available=1
            WHERE u.is_active=1
        """
        params = []
        if district:
            sql += " AND f.district=%s"; params.append(district)
        sql += " GROUP BY f.id, f.farm_name, f.village, f.district, f.state, f.rating, f.total_reviews, u.full_name, u.avatar_url ORDER BY f.is_featured DESC, f.rating DESC LIMIT 20"
        cur.execute(sql, params)
        return jsonify(cur.fetchall()), 200

    except mysql.connector.Error as e:
        logger.error(f"[vendor.nearby_farmers] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[vendor.nearby_farmers] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@vendor_bp.get("/wishlist")
@jwt_required()
def get_wishlist():
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
            SELECT w.*, p.name, p.price, p.unit, p.image_url, p.is_available,
                   f.farm_name, u.full_name AS farmer_name
            FROM wishlist w
            JOIN products p ON p.id=w.product_id
            JOIN farmers f ON f.id=p.farmer_id
            JOIN users u ON u.id=f.user_id
            WHERE w.vendor_id=%s
        """, (v["id"],))
        return jsonify(cur.fetchall()), 200

    except mysql.connector.Error as e:
        logger.error(f"[vendor.get_wishlist] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[vendor.get_wishlist] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@vendor_bp.post("/wishlist/<int:pid>")
@jwt_required()
def toggle_wishlist(pid):
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
        cur.execute("SELECT id FROM wishlist WHERE vendor_id=%s AND product_id=%s", (v["id"], pid))
        existing = cur.fetchone()
        if existing:
            cur.execute("DELETE FROM wishlist WHERE vendor_id=%s AND product_id=%s", (v["id"], pid))
            db.commit()
            return jsonify({"message":"Removed from wishlist", "wishlisted": False}), 200
        else:
            cur.execute("INSERT INTO wishlist (vendor_id, product_id) VALUES(%s,%s)", (v["id"], pid))
            db.commit()
            return jsonify({"message":"Added to wishlist", "wishlisted": True}), 200

    except mysql.connector.Error as e:
        logger.error(f"[vendor.toggle_wishlist] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[vendor.toggle_wishlist] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@vendor_bp.post("/review/<int:pid>")
@jwt_required()
def add_review(pid):
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

        data = request.get_json()
        rating = data.get("rating")
        try:
            rating_int = int(rating)
            if not (1 <= rating_int <= 5):
                return jsonify({"error":"Rating must be between 1 and 5"}), 400
        except (ValueError, TypeError):
            return jsonify({"error":"Rating must be a numeric value"}), 400

        # Duplicate review check — insert or update on duplicate (database agnostic)
        cur.execute("SELECT id FROM reviews WHERE product_id=%s AND vendor_id=%s", (pid, v["id"]))
        existing_review = cur.fetchone()
        if existing_review:
            cur.execute("""
                UPDATE reviews 
                SET rating=%s, comment=%s, order_id=%s, created_at=CURRENT_TIMESTAMP
                WHERE id=%s
            """, (rating_int, data.get("comment", ""), data.get("order_id"), existing_review["id"]))
        else:
            cur.execute("""
                INSERT INTO reviews (product_id, vendor_id, order_id, rating, comment)
                VALUES (%s, %s, %s, %s, %s)
            """, (pid, v["id"], data.get("order_id"), rating_int, data.get("comment", "")))

        # Recalculate avg rating
        cur.execute("SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM reviews WHERE product_id=%s", (pid,))
        r = cur.fetchone()
        avg_rating = round(r["avg"], 2) if r["avg"] is not None else 0.0
        cur.execute("UPDATE products SET rating=%s, total_reviews=%s WHERE id=%s", (avg_rating, r["cnt"], pid))
        db.commit()
        return jsonify({"message":"Review submitted"}), 201

    except mysql.connector.Error as e:
        logger.error(f"[vendor.add_review] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[vendor.add_review] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500
