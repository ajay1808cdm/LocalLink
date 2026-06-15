# backend/routes/notifications.py
import logging
import traceback
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.database import get_db
import mysql.connector

logger = logging.getLogger(__name__)
notif_bp = Blueprint("notifications", __name__)

@notif_bp.get("/")
@jwt_required()
def get_notifications():
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        db = get_db(); cur = db.cursor(dictionary=True)
        cur.execute("SELECT * FROM notifications WHERE user_id=%s ORDER BY created_at DESC LIMIT 30", (uid,))
        notifs = cur.fetchall()
        cur.execute("SELECT COUNT(*) AS cnt FROM notifications WHERE user_id=%s AND is_read=0", (uid,))
        unread = cur.fetchone()["cnt"]
        return jsonify({"notifications": notifs, "unread_count": unread}), 200

    except mysql.connector.Error as e:
        logger.error(f"[notifications.get_notifications] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        logger.error(f"[notifications.get_notifications] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@notif_bp.put("/<int:nid>/read")
@jwt_required()
def mark_read(nid):
    conn = get_db()
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        cur = conn.cursor()
        cur.execute("UPDATE notifications SET is_read=1 WHERE id=%s AND user_id=%s", (nid, uid))
        conn.commit()
        return jsonify({"message":"Marked as read"}), 200

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[notifications.mark_read] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[notifications.mark_read] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500

@notif_bp.put("/read-all")
@jwt_required()
def mark_all_read():
    conn = get_db()
    try:
        uid = get_jwt_identity()
        try:
            uid = int(uid)
        except (ValueError, TypeError):
            pass

        cur = conn.cursor()
        cur.execute("UPDATE notifications SET is_read=1 WHERE user_id=%s", (uid,))
        conn.commit()
        return jsonify({"message":"All marked as read"}), 200

    except mysql.connector.Error as e:
        conn.rollback()
        logger.error(f"[notifications.mark_all_read] DB error: {e.msg}")
        return jsonify({
            "error": "Database error",
            "detail": e.msg,
            "errno": e.errno
        }), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"[notifications.mark_all_read] Unexpected error:\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error",
            "detail": str(e)
        }), 500
