# backend/routes/orders.py
import logging
import traceback
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.database import get_db
import random, string, datetime
import mysql.connector

logger = logging.getLogger(__name__)
orders_bp = Blueprint("orders", __name__)

def gen_order_num():
    return "LL" + datetime.datetime.now().strftime("%Y%m%d") + ''.join(random.choices(string.digits, k=4))

# ── PLACE ORDER ──────────────────────────────────────────────
@orders_bp.post("/place")
@jwt_required()
def place_order():
    conn = get_db()
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        cur = conn.cursor(dictionary=True)

        cur.execute("SELECT id FROM vendors WHERE user_id=%s", (uid,))
        vendor = cur.fetchone()
        if not vendor: return jsonify({"error":"Only vendors can place orders"}), 403

        data = request.get_json()
        # items: [{product_id, quantity}]
        items = data.get("items", [])
        if not items: return jsonify({"error":"Cart is empty"}), 400

        total = 0
        order_items = []
        for item in items:
            cur.execute("SELECT p.*, f.id AS farmer_id FROM products p JOIN farmers f ON f.id=p.farmer_id WHERE p.id=%s AND p.is_available=1", (item["product_id"],))
            product = cur.fetchone()
            if not product: return jsonify({"error":f"Product {item['product_id']} not available"}), 400
            if product["available_qty"] < item["quantity"]:
                return jsonify({"error":f"Insufficient stock for {product['name']}"}), 400
            subtotal = float(product["price"]) * float(item["quantity"])
            total += subtotal
            order_items.append({**item, "product": product, "subtotal": subtotal})

        order_num = gen_order_num()
        cur.execute("""
            INSERT INTO orders (vendor_id,order_number,total_amount,delivery_address,delivery_type,payment_method,notes)
            VALUES(%s,%s,%s,%s,%s,%s,%s)
        """, (vendor["id"], order_num, total, data.get("delivery_address",""),
              data.get("delivery_type","pickup"), data.get("payment_method","cod"), data.get("notes","")))
        order_id = cur.lastrowid

        for item in order_items:
            cur.execute("""
                INSERT INTO order_items (order_id,product_id,farmer_id,quantity,unit_price,subtotal)
                VALUES(%s,%s,%s,%s,%s,%s)
            """, (order_id, item["product_id"], item["product"]["farmer_id"], item["quantity"], item["product"]["price"], item["subtotal"]))
            # Reduce stock
            cur.execute("UPDATE products SET available_qty = available_qty - %s WHERE id=%s", (item["quantity"], item["product_id"]))

        # Clear cart
        cur.execute("DELETE FROM cart WHERE vendor_id=%s", (vendor["id"],))

        # Notify farmer(s)
        notified = set()
        for item in order_items:
            fid = item["product"]["farmer_id"]
            if fid not in notified:
                cur.execute("SELECT user_id FROM farmers WHERE id=%s", (fid,))
                row = cur.fetchone()
                if row:
                    cur.execute("""
                        INSERT INTO notifications (user_id,type,title,message,data)
                        VALUES(%s,'order_placed',%s,%s,%s)
                    """, (row["user_id"], "New Order Received!", f"Order #{order_num} placed.", f'{{"order_id":{order_id}}}'))
                notified.add(fid)

        cur.execute("INSERT INTO order_status_history (order_id,status,note) VALUES(%s,'pending','Order placed')", (order_id,))
        conn.commit()

        return jsonify({"message":"Order placed successfully","order_id":order_id,"order_number":order_num,"total":total}), 201

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[orders.place_order] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[orders.place_order] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

# ── VENDOR – MY ORDERS ───────────────────────────────────────
@orders_bp.get("/my")
@jwt_required()
def my_orders():
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        db = get_db(); cur = db.cursor(dictionary=True)

        cur.execute("SELECT id FROM vendors WHERE user_id=%s", (uid,))
        vendor = cur.fetchone()
        if not vendor: return jsonify({"error":"Unauthorized"}), 403

        cur.execute("""
            SELECT o.*, COUNT(oi.id) AS item_count
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            WHERE o.vendor_id=%s GROUP BY o.id ORDER BY o.created_at DESC
        """, (vendor["id"],))
        orders = cur.fetchall()
        return jsonify(orders), 200

    except mysql.connector.Error as e:
        logger.error(f"[orders.my_orders] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[orders.my_orders] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

# ── FARMER – INCOMING ORDERS (Moved BEFORE single order detail to avoid 404 int coercion bug) ──
@orders_bp.get("/farmer/incoming")
@jwt_required()
def farmer_orders():
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        db = get_db(); cur = db.cursor(dictionary=True)
        cur.execute("SELECT id FROM farmers WHERE user_id=%s", (uid,))
        farmer = cur.fetchone()
        if not farmer: return jsonify({"error":"Unauthorized"}), 403

        cur.execute("""
            SELECT DISTINCT o.*, u.full_name AS vendor_name
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            JOIN vendors v ON v.id = o.vendor_id
            JOIN users u ON u.id = v.user_id
            WHERE oi.farmer_id = %s
            ORDER BY o.created_at DESC
        """, (farmer["id"],))
        return jsonify(cur.fetchall()), 200

    except mysql.connector.Error as e:
        logger.error(f"[orders.farmer_orders] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[orders.farmer_orders] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

# ── ORDER DETAIL ─────────────────────────────────────────────
@orders_bp.get("/<int:oid>")
@jwt_required()
def order_detail(oid):
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        db = get_db(); cur = db.cursor(dictionary=True)

        cur.execute("SELECT * FROM orders WHERE id=%s", (oid,))
        order = cur.fetchone()
        if not order: return jsonify({"error":"Not found"}), 404

        cur.execute("""
            SELECT oi.*, p.name AS product_name, p.image_url, p.unit,
                   u.full_name AS farmer_name, f.farm_name
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            JOIN farmers f ON f.id = oi.farmer_id
            JOIN users u ON u.id = f.user_id
            WHERE oi.order_id = %s
        """, (oid,))
        order["items"] = cur.fetchall()

        cur.execute("SELECT * FROM order_status_history WHERE order_id=%s ORDER BY created_at", (oid,))
        order["history"] = cur.fetchall()
        return jsonify(order), 200

    except mysql.connector.Error as e:
        logger.error(f"[orders.order_detail] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[orders.order_detail] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

# ── FARMER – UPDATE STATUS ───────────────────────────────────
@orders_bp.put("/<int:oid>/status")
@jwt_required()
def update_status(oid):
    conn = get_db()
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        data = request.get_json()
        new_status = data.get("status")
        valid = ['pending','confirmed','processing','ready','out_for_delivery','delivered','cancelled']
        if new_status not in valid: return jsonify({"error":"Invalid status"}), 400

        cur = conn.cursor(dictionary=True)

        # Authorization check: verify user is farmer or admin before status update
        cur.execute("SELECT role FROM users WHERE id=%s", (uid,))
        user_row = cur.fetchone()
        is_admin = user_row and user_row["role"] == "admin"

        is_farmer = False
        cur.execute("SELECT id FROM farmers WHERE user_id=%s", (uid,))
        farmer_row = cur.fetchone()
        if farmer_row:
            cur.execute("SELECT COUNT(*) AS cnt FROM order_items WHERE order_id=%s AND farmer_id=%s", (oid, farmer_row["id"]))
            if cur.fetchone()["cnt"] > 0:
                is_farmer = True

        if not (is_admin or is_farmer):
            logger.warning(f"Unauthorized update status attempt for order_id={oid} by user_id={uid}")
            return jsonify({"error": "Unauthorized to update this order's status"}), 403

        cur.execute("UPDATE orders SET status=%s WHERE id=%s", (new_status, oid))
        cur.execute("INSERT INTO order_status_history (order_id,status,note,changed_by) VALUES(%s,%s,%s,%s)",
                    (oid, new_status, data.get("note",""), uid))

        # Notify vendor
        cur.execute("SELECT vendor_id FROM orders WHERE id=%s", (oid,))
        o = cur.fetchone()
        if o:
            cur.execute("SELECT user_id FROM vendors WHERE id=%s", (o["vendor_id"],))
            v = cur.fetchone()
            if v:
                cur.execute("""
                    INSERT INTO notifications (user_id,type,title,message,data)
                    VALUES(%s,'order_confirmed',%s,%s,%s)
                """, (v["user_id"], f"Order Status Updated", f"Your order is now {new_status}.", f'{{"order_id":{oid}}}'))
        conn.commit()
        return jsonify({"message":"Status updated"}), 200

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[orders.update_status] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[orders.update_status] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500
