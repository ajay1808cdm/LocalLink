# ============================================================
#  LOCAL LINK – Flask Backend  (app.py)
# ============================================================

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config.database import init_db
from config.settings import Config
from routes.auth import auth_bp
from routes.products import products_bp
from routes.orders import orders_bp
from routes.cart import cart_bp
from routes.farmer import farmer_bp
from routes.vendor import vendor_bp
from routes.admin import admin_bp
from routes.notifications import notif_bp
from routes.debug import debug_bp
import os


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ── CORS ──────────────────────────────────────────────────
    allowed_origins = Config.ALLOWED_ORIGINS
    if allowed_origins == "*":
        origins = "*"
    else:
        origins = [o.strip() for o in allowed_origins.split(",") if o.strip()]

    CORS(app, resources={r"/api/*": {"origins": origins}})

    # ── Extensions ────────────────────────────────────────────
    JWTManager(app)
    init_db(app)

    # ── Blueprints ────────────────────────────────────────────
    app.register_blueprint(auth_bp,      url_prefix="/api/auth")
    app.register_blueprint(products_bp,  url_prefix="/api/products")
    app.register_blueprint(orders_bp,    url_prefix="/api/orders")
    app.register_blueprint(cart_bp,      url_prefix="/api/cart")
    app.register_blueprint(farmer_bp,    url_prefix="/api/farmer")
    app.register_blueprint(vendor_bp,    url_prefix="/api/vendor")
    app.register_blueprint(admin_bp,     url_prefix="/api/admin")
    app.register_blueprint(notif_bp,     url_prefix="/api/notifications")
    app.register_blueprint(debug_bp,     url_prefix="/api/debug")

    # ── Health check ──────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "message": "Local Link API running"}), 200

    # ── Database status ───────────────────────────────────────
    @app.route("/api/debug/db")
    def debug_db_root():
        """Top-level DB debug endpoint (mirrors /api/auth/debug/db)."""
        from config.database import get_db
        from flask import g
        try:
            conn = get_db()
            cur  = conn.cursor(dictionary=True)
            cur.execute("SELECT COUNT(*) AS cnt FROM users")
            user_count = cur.fetchone()["cnt"]
            return jsonify({
                "database_connected": True,
                "user_count":         user_count,
                "database_type":      "PostgreSQL",
            }), 200
        except Exception as exc:
            app.logger.exception(f"[debug/db] {exc}")
            return jsonify({"database_connected": False, "error": str(exc)}), 500

    return app


if __name__ == "__main__":
    app  = create_app()
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
