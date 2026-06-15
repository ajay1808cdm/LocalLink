# backend/routes/farmer.py
import logging
import traceback
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.database import get_db
import mysql.connector

logger = logging.getLogger(__name__)
farmer_bp = Blueprint("farmer", __name__)

@farmer_bp.get("/dashboard")
@jwt_required()
def dashboard():
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass
            
        logger.info(f"Dashboard endpoint called with uid: {uid}")
        
        db = get_db()
        cur = db.cursor(dictionary=True)
        
        cur.execute("SELECT * FROM farmers WHERE user_id=%s", (uid,))
        farmer = cur.fetchone()
        
        if not farmer:
            logger.warning(f"Farmer profile not found for user_id: {uid}")
            return jsonify({
                "error": "Not a farmer",
                "detail": "No farmer profile associated with this user ID.",
                "hint": "Ensure the user is registered as a farmer. You can check the farmers table."
            }), 403
            
        logger.info(f"Farmer profile found: {farmer}")
        fid = farmer["id"]
        
        # 1. Total products count
        cur.execute("SELECT COUNT(*) AS total FROM products WHERE farmer_id=%s", (fid,))
        products_count_row = cur.fetchone()
        products_count = products_count_row["total"] if products_count_row else 0
        
        # 2. Active products count
        cur.execute("SELECT COUNT(*) AS total FROM products WHERE farmer_id=%s AND is_available=1", (fid,))
        active_products_row = cur.fetchone()
        active_products = active_products_row["total"] if active_products_row else 0
        
        # 3. Safe orders stats query (returns 0-revenue safely when 0 orders exist)
        cur.execute("""
            SELECT
                COUNT(DISTINCT o.id) AS total,
                COALESCE(SUM(oi.subtotal), 0) AS revenue
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id AND oi.farmer_id = %s
            WHERE o.id IN (
                SELECT DISTINCT order_id FROM order_items WHERE farmer_id = %s
            ) AND o.status NOT IN ('cancelled')
        """, (fid, fid))
        stats = cur.fetchone()
        
        total_revenue = float(stats["revenue"] or 0) if stats else 0.0
        total_orders = int(stats["total"] or 0) if stats else 0
        
        # 4. Recent orders (fix GROUP BY clause)
        cur.execute("""
            SELECT o.id, o.order_number, o.status, o.created_at, u.full_name AS vendor_name,
                   SUM(oi.subtotal) AS amount
            FROM orders o
            JOIN order_items oi ON oi.order_id=o.id
            JOIN vendors v ON v.id=o.vendor_id
            JOIN users u ON u.id=v.user_id
            WHERE oi.farmer_id=%s
            GROUP BY o.id, o.order_number, o.status, o.created_at, u.full_name
            ORDER BY o.created_at DESC LIMIT 5
        """, (fid,))
        recent_orders = cur.fetchall()
        
        # 5. My products preview
        cur.execute("""
            SELECT p.id, p.name, p.available_qty, p.unit, p.price, p.is_available
            FROM products p WHERE p.farmer_id=%s ORDER BY p.created_at DESC LIMIT 6
        """, (fid,))
        my_products = cur.fetchall()
        
        logger.info(f"Final stats for fid {fid}: total_orders={total_orders}, total_revenue={total_revenue}, products={products_count}, active_products={active_products}")
        
        return jsonify({
            "farmer": farmer,
            "stats": {
                "products": products_count,
                "active_products": active_products,
                "total_orders": total_orders,
                "total_revenue": total_revenue
            },
            "recent_orders": recent_orders,
            "my_products": my_products
        }), 200
        
    except mysql.connector.Error as e:
        logger.error(f"[farmer.dashboard] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[farmer.dashboard] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@farmer_bp.get("/products")
@jwt_required()
def my_products():
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass
            
        logger.info(f"my_products called for uid: {uid}")
        db = get_db()
        cur = db.cursor(dictionary=True)
        cur.execute("SELECT id FROM farmers WHERE user_id=%s", (uid,))
        farmer = cur.fetchone()
        if not farmer:
            logger.warning(f"Farmer profile not found for user_id: {uid}")
            return jsonify({
                "error": "Unauthorized",
                "detail": "No farmer profile associated with this user ID.",
                "hint": "Ensure the user is registered as a farmer."
            }), 403
        cur.execute("""
            SELECT p.*, c.name AS category_name
            FROM products p JOIN categories c ON c.id=p.category_id
            WHERE p.farmer_id=%s ORDER BY p.created_at DESC
        """, (farmer["id"],))
        products = cur.fetchall()
        logger.info(f"Retrieved {len(products)} products for farmer {farmer['id']}")
        return jsonify(products), 200
    except mysql.connector.Error as e:
        logger.error(f"[farmer.my_products] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[farmer.my_products] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@farmer_bp.get("/profile/<int:farmer_id>")
def public_profile(farmer_id):
    try:
        logger.info(f"public_profile called for farmer_id: {farmer_id}")
        db = get_db()
        cur = db.cursor(dictionary=True)
        cur.execute("""
            SELECT f.*, u.full_name, u.avatar_url, u.created_at AS member_since
            FROM farmers f JOIN users u ON u.id=f.user_id WHERE f.id=%s
        """, (farmer_id,))
        farmer = cur.fetchone()
        if not farmer:
            logger.warning(f"Farmer profile not found for farmer_id: {farmer_id}")
            return jsonify({
                "error": "Not found",
                "detail": f"No farmer found with ID {farmer_id}.",
                "hint": "Check if the farmer ID is correct."
            }), 404
        cur.execute("""
            SELECT p.*, c.name AS category_name FROM products p
            JOIN categories c ON c.id=p.category_id
            WHERE p.farmer_id=%s AND p.is_available=1
        """, (farmer_id,))
        farmer["products"] = cur.fetchall()
        logger.info(f"Retrieved public profile for farmer_id: {farmer_id} with {len(farmer['products'])} products")
        return jsonify(farmer), 200
    except mysql.connector.Error as e:
        logger.error(f"[farmer.public_profile] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[farmer.public_profile] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500
