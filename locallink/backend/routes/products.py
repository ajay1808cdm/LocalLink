# backend/routes/products.py
import logging
import traceback
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.database import get_db
import os, uuid
from werkzeug.utils import secure_filename
from config.settings import Config
import mysql.connector

logger = logging.getLogger(__name__)
products_bp = Blueprint("products", __name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

# ── LIST PRODUCTS ────────────────────────────────────────────
@products_bp.get("/")
def list_products():
    try:
        db = get_db(); cur = db.cursor(dictionary=True)
        q = request.args
        page     = max(1, int(q.get("page", 1)))
        per_page = min(50, int(q.get("per_page", 12)))
        offset   = (page - 1) * per_page

        sql = """
            SELECT p.*, c.name AS category_name, c.icon AS category_icon,
                   f.farm_name, u.full_name AS farmer_name,
                   f.village, f.district, f.state
            FROM products p
            JOIN categories c ON c.id = p.category_id
            JOIN farmers f ON f.id = p.farmer_id
            JOIN users u ON u.id = f.user_id
            WHERE p.is_available = TRUE
        """
        params = []

        if q.get("category"):
            sql += " AND c.slug = %s"; params.append(q["category"])
        if q.get("search"):
            sql += " AND (p.name ILIKE %s OR p.description ILIKE %s)"
            params += [f"%{q['search']}%", f"%{q['search']}%"]
        if q.get("district"):
            sql += " AND f.district = %s"; params.append(q["district"])
        if q.get("organic") == "1":
            sql += " AND p.is_organic = TRUE"

        count_sql = "SELECT COUNT(*) AS cnt FROM (" + sql + ") t"
        cur.execute(count_sql, params)
        total = cur.fetchone()["cnt"]

        sql += " ORDER BY p.is_featured DESC, p.created_at DESC LIMIT %s OFFSET %s"
        params += [per_page, offset]
        cur.execute(sql, params)
        products = cur.fetchall()

        return jsonify({"products": products, "total": total, "page": page, "per_page": per_page}), 200

    except mysql.connector.Error as e:
        logger.error(f"[products.list_products] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[products.list_products] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

# ── CATEGORIES (Moved BEFORE single product route to avoid 404 integer coercion bug) ──
@products_bp.get("/categories/all")
def get_categories():
    try:
        db = get_db(); cur = db.cursor(dictionary=True)
        cur.execute("SELECT * FROM categories WHERE is_active=TRUE ORDER BY sort_order")
        return jsonify(cur.fetchall()), 200

    except mysql.connector.Error as e:
        logger.error(f"[products.get_categories] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[products.get_categories] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

# ── SINGLE PRODUCT ───────────────────────────────────────────
@products_bp.get("/<int:pid>")
def get_product(pid):
    try:
        db = get_db(); cur = db.cursor(dictionary=True)
        cur.execute("""
            SELECT p.*, c.name AS category_name, c.icon AS category_icon,
                   f.farm_name, f.village, f.district, f.state, f.rating AS farmer_rating,
                   u.full_name AS farmer_name, u.phone AS farmer_phone
            FROM products p
            JOIN categories c ON c.id = p.category_id
            JOIN farmers f ON f.id = p.farmer_id
            JOIN users u ON u.id = f.user_id
            WHERE p.id = %s
        """, (pid,))
        product = cur.fetchone()
        if not product: return jsonify({"error": "Product not found"}), 404

        cur.execute("""
            SELECT r.*, u.full_name AS reviewer_name, u.avatar_url
            FROM reviews r
            JOIN vendors v ON v.id = r.vendor_id
            JOIN users u ON u.id = v.user_id
            WHERE r.product_id = %s ORDER BY r.created_at DESC LIMIT 10
        """, (pid,))
        product["reviews"] = cur.fetchall()
        return jsonify(product), 200

    except mysql.connector.Error as e:
        logger.error(f"[products.get_product] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[products.get_product] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

# ── ADD PRODUCT (Farmer) ─────────────────────────────────────
@products_bp.post("/")
@jwt_required()
def add_product():
    conn = get_db()
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        cur = conn.cursor(dictionary=True)

        cur.execute("SELECT id FROM farmers WHERE user_id=%s", (uid,))
        farmer = cur.fetchone()
        if not farmer: return jsonify({"error": "Only farmers can add products"}), 403

        data = request.get_json() or {}
        
        # Map compatible fields
        category_id = data.get("category_id") or data.get("category")
        qty = data.get("quantity") if data.get("quantity") is not None else data.get("available_qty")
        is_avail = data.get("is_available") if data.get("is_available") is not None else data.get("availability")
        if is_avail is None:
            is_avail = True
        is_available_int = 1 if is_avail in [True, 1, "1", "true", "True"] else 0

        required = {
            "name": data.get("name"),
            "price": data.get("price"),
            "category": category_id,
            "quantity": qty,
            "unit": data.get("unit")
        }

        missing = [k for k, v in required.items() if v is None or str(v).strip() == ""]
        if missing:
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        cur.execute("""
            INSERT INTO products (farmer_id, category_id, name, description, price, unit,
                available_qty, min_order_qty, is_organic, delivery_option, harvest_date, is_available, location)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (farmer["id"], category_id, data["name"], data.get("description", ""),
              data["price"], data["unit"], qty,
              data.get("min_order_qty", 1), data.get("is_organic", False),
              data.get("delivery_option", "both"), data.get("harvest_date") or None, is_available_int, data.get("location", "")))
        new_id = cur.fetchone()["id"]
        conn.commit()
        return jsonify({"message": "Product added", "id": new_id}), 201

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[products.add_product] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[products.add_product] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

# ── UPDATE PRODUCT ───────────────────────────────────────────
@products_bp.put("/<int:pid>")
@jwt_required()
def update_product(pid):
    conn = get_db()
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id FROM farmers WHERE user_id=%s", (uid,))
        farmer = cur.fetchone()
        if not farmer: return jsonify({"error": "Unauthorized"}), 403

        data   = request.get_json()
        fields = ["name","description","price","unit","available_qty","is_organic","is_available","delivery_option","min_order_qty", "location"]
        updates = {k: data[k] for k in fields if k in data}
        if not updates: return jsonify({"error": "Nothing to update"}), 400

        set_clause = ", ".join(f"{k}=%s" for k in updates)
        values     = list(updates.values()) + [pid, farmer["id"]]
        cur.execute(f"UPDATE products SET {set_clause} WHERE id=%s AND farmer_id=%s", values)
        conn.commit()
        return jsonify({"message": "Updated"}), 200

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[products.update_product] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[products.update_product] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

# ── DELETE PRODUCT ───────────────────────────────────────────
@products_bp.delete("/<int:pid>")
@jwt_required()
def delete_product(pid):
    conn = get_db()
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id FROM farmers WHERE user_id=%s", (uid,))
        farmer = cur.fetchone()
        if not farmer: return jsonify({"error": "Unauthorized"}), 403
        cur.execute("DELETE FROM products WHERE id=%s AND farmer_id=%s", (pid, farmer["id"]))
        conn.commit()
        return jsonify({"message": "Deleted"}), 200

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[products.delete_product] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[products.delete_product] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

# ── UPLOAD IMAGE ─────────────────────────────────────────────
@products_bp.post("/<int:pid>/upload-image")
@jwt_required()
def upload_image(pid):
    conn = get_db()
    try:
        if "image" not in request.files: return jsonify({"error": "No file"}), 400
        file = request.files["image"]
        if not allowed_file(file.filename): return jsonify({"error": "Invalid file type"}), 400

        ext      = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        path     = Config.UPLOAD_FOLDER
        os.makedirs(path, exist_ok=True)
        file.save(os.path.join(path, filename))
        url = f"/static/uploads/{filename}"

        cur = conn.cursor()
        cur.execute("UPDATE products SET image_url=%s WHERE id=%s", (url, pid))
        conn.commit()
        return jsonify({"image_url": url}), 200

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[products.upload_image] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[products.upload_image] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500
