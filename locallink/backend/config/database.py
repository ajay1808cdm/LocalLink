# backend/config/database.py
# ============================================================
#  PostgreSQL connection layer using psycopg2 + SQLAlchemy
#  get_db() returns a per-request connection wrapper that
#  behaves similarly to mysql-connector-python for easy porting.
# ============================================================

import os
import bcrypt
from flask import g, current_app
from flask_sqlalchemy import SQLAlchemy
import psycopg2
import psycopg2.extras
import sys
import logging
from types import ModuleType

logger = logging.getLogger(__name__)

# Mock mysql.connector.Error to catch psycopg2.Error in routes
class MysqlConnectorErrorMock(Exception):
    def __init__(self, psycopg_err):
        self.msg = getattr(psycopg_err, "pgerror", str(psycopg_err)) or str(psycopg_err)
        self.errno = getattr(psycopg_err, "pgcode", None)
        super().__init__(self.msg)

# Register mysql.connector mock dynamically
mysql_mod = ModuleType("mysql")
mysql_mod.__path__ = []
connector_mod = ModuleType("mysql.connector")
connector_mod.Error = MysqlConnectorErrorMock
mysql_mod.connector = connector_mod
sys.modules["mysql"] = mysql_mod
sys.modules["mysql.connector"] = connector_mod


# ── SQLAlchemy instance (used only for table creation) ───────
db = SQLAlchemy()


# ── Cursor / Connection wrappers ─────────────────────────────
# These wrappers give us a dict-cursor interface similar to
# mysql-connector-python so route code stays portable.

class PostgresCursorWrapper:
    def __init__(self, cursor):
        self.cursor = cursor
        self._lastrowid = None

    def execute(self, query, params=None):
        try:
            query_strip = query.strip()
            is_insert   = query_strip.upper().startswith("INSERT")
            has_return  = "RETURNING" in query_strip.upper()

            if is_insert and not has_return:
                # Auto-append RETURNING id to capture lastrowid
                if query_strip.endswith(";"):
                    query_strip = query_strip[:-1]
                query = query_strip + " RETURNING id"
                self.cursor.execute(query, params)
                try:
                    row = self.cursor.fetchone()
                    if row:
                        if isinstance(row, dict):
                            self._lastrowid = row.get("id")
                        elif hasattr(row, "keys"):        # RealDictRow
                            self._lastrowid = row["id"]
                        elif isinstance(row, (list, tuple)):
                            self._lastrowid = row[0]
                except Exception:
                    pass
            else:
                self.cursor.execute(query, params)
            return self
        except psycopg2.Error as e:
            raise MysqlConnectorErrorMock(e) from e

    @property
    def lastrowid(self):
        return self._lastrowid

    def fetchone(self):
        try:
            return self.cursor.fetchone()
        except psycopg2.Error as e:
            raise MysqlConnectorErrorMock(e) from e

    def fetchall(self):
        try:
            return self.cursor.fetchall()
        except psycopg2.Error as e:
            raise MysqlConnectorErrorMock(e) from e

    def executemany(self, query, params_seq):
        try:
            self.cursor.executemany(query, params_seq)
            return self
        except psycopg2.Error as e:
            raise MysqlConnectorErrorMock(e) from e

    def close(self):
        self.cursor.close()

    def __iter__(self):
        return iter(self.cursor)

    def __next__(self):
        return next(self.cursor)

    def __getattr__(self, name):
        return getattr(self.cursor, name)


class PostgresConnectionWrapper:
    def __init__(self, conn):
        self.conn = conn

    def cursor(self, dictionary=False):
        if dictionary:
            cur = self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        else:
            cur = self.conn.cursor()
        return PostgresCursorWrapper(cur)

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def close(self):
        self.conn.close()

    def is_connected(self):
        return not self.conn.closed


# ── Public API ────────────────────────────────────────────────

def check_db_health() -> dict:
    health = {
        "database_connected": False,
        "users_table_exists": False,
        "farmers_table_exists": False,
        "vendors_table_exists": False,
        "products_table_exists": False,
        "orders_table_exists": False,
        "error": None
    }
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        health["database_connected"] = True
        
        tables = ["users", "farmers", "vendors", "products", "orders"]
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN (%s, %s, %s, %s, %s)
        """, tuple(tables))
        rows = cur.fetchall()
        existing_tables = {row["table_name"] for row in rows}
        
        health["users_table_exists"] = "users" in existing_tables
        health["farmers_table_exists"] = "farmers" in existing_tables
        health["vendors_table_exists"] = "vendors" in existing_tables
        health["products_table_exists"] = "products" in existing_tables
        health["orders_table_exists"] = "orders" in existing_tables
        
    except Exception as exc:
        health["error"] = str(exc)
        logger.error(f"check_db_health error: {exc}")
    return health

def get_db() -> PostgresConnectionWrapper:
    """Return the per-request PostgreSQL connection (lazy-created)."""
    if "db_conn" not in g:
        try:
            logger.info("Establishing connection to database...")
            raw = db.engine.raw_connection()
            raw.autocommit = False
            g.db_conn = PostgresConnectionWrapper(raw)
            logger.info("Database connection established successfully.")
        except Exception as exc:
            logger.error(f"Failed to connect to database: {exc}")
            raise exc
    return g.db_conn


# ── Seeding ───────────────────────────────────────────────────

def _seed_categories(cur):
    cur.execute("SELECT COUNT(*) AS cnt FROM categories")
    if cur.fetchone()["cnt"] > 0:
        return
    categories = [
        ("Vegetables", "vegetables", "🥦", "#22c55e", 1),
        ("Fruits",     "fruits",     "🍎", "#f97316", 2),
        ("Grains",     "grains",     "🌾", "#eab308", 3),
        ("Dairy",      "dairy",      "🥛", "#3b82f6", 4),
        ("Spices",     "spices",     "🌶️", "#ef4444", 5),
        ("Pulses",     "pulses",     "🫘", "#a855f7", 6),
        ("Herbs",      "herbs",      "🌿", "#10b981", 7),
        ("Dry Fruits", "dry-fruits", "🥜", "#d97706", 8),
    ]
    for name, slug, icon, color, sort_order in categories:
        cur.execute(
            "INSERT INTO categories (name, slug, icon, color, sort_order) VALUES (%s,%s,%s,%s,%s)",
            (name, slug, icon, color, sort_order),
        )


def _seed_user(cur, email, password_plain, role, full_name, phone):
    cur.execute("SELECT id FROM users WHERE email=%s", (email,))
    row = cur.fetchone()
    if row:
        return row["id"]
    hashed = bcrypt.hashpw(password_plain.encode(), bcrypt.gensalt()).decode()
    cur.execute(
        "INSERT INTO users (email, password, role, full_name, phone, is_active, is_verified)"
        " VALUES (%s,%s,%s,%s,%s,TRUE,TRUE) RETURNING id",
        (email, hashed, role, full_name, phone),
    )
    return cur.fetchone()["id"]


def seed_default_accounts():
    conn = db.engine.raw_connection()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        # ── Categories ──────────────────────────────────────────
        cur.execute("SELECT COUNT(*) AS cnt FROM categories")
        if cur.fetchone()["cnt"] == 0:
            for name, slug, icon, color, sort_order in [
                ("Vegetables", "vegetables", "🥦", "#22c55e", 1),
                ("Fruits",     "fruits",     "🍎", "#f97316", 2),
                ("Grains",     "grains",     "🌾", "#eab308", 3),
                ("Dairy",      "dairy",      "🥛", "#3b82f6", 4),
                ("Spices",     "spices",     "🌶️", "#ef4444", 5),
                ("Pulses",     "pulses",     "🫘", "#a855f7", 6),
                ("Herbs",      "herbs",      "🌿", "#10b981", 7),
                ("Dry Fruits", "dry-fruits", "🥜", "#d97706", 8),
            ]:
                cur.execute(
                    "INSERT INTO categories (name, slug, icon, color, sort_order) VALUES (%s,%s,%s,%s,%s)",
                    (name, slug, icon, color, sort_order),
                )

        def upsert_user(email, pw, role, name, phone):
            cur.execute("SELECT id FROM users WHERE email=%s", (email,))
            row = cur.fetchone()
            if row:
                return row["id"]
            hashed = bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
            cur.execute(
                "INSERT INTO users (email, password, role, full_name, phone, is_active, is_verified)"
                " VALUES (%s,%s,%s,%s,%s,1,1) RETURNING id",
                (email, hashed, role, name, phone),
            )
            return cur.fetchone()["id"]

        # ── Admin ────────────────────────────────────────────────
        upsert_user("admin@locallink.com", "Admin@123", "admin", "LocalLink Admin", "9999999999")

        # ── Customer ─────────────────────────────────────────────
        cust_id = upsert_user("customer@locallink.com", "Customer@123", "customer", "LocalLink Customer", "9999999993")
        cur.execute("SELECT id FROM vendors WHERE user_id=%s", (cust_id,))
        if not cur.fetchone():
            cur.execute(
                "INSERT INTO vendors (user_id, shop_name, location, village, district, state, pincode)"
                " VALUES (%s,'Customer Shop','Coimbatore','Coimbatore Village','Coimbatore','Tamil Nadu','641001')",
                (cust_id,),
            )

        # ── Vendor ───────────────────────────────────────────────
        vend_id = upsert_user("vendor@locallink.com", "Vendor@123", "vendor", "LocalLink Vendor", "9999999992")
        cur.execute("SELECT id FROM vendors WHERE user_id=%s", (vend_id,))
        if not cur.fetchone():
            cur.execute(
                "INSERT INTO vendors (user_id, shop_name, location, village, district, state, pincode)"
                " VALUES (%s,'LocalLink Vendor Shop','456 Market Road','Market Town','Coimbatore','Tamil Nadu','641002')",
                (vend_id,),
            )

        # ── Farmer ───────────────────────────────────────────────
        farm_uid = upsert_user("farmer@locallink.com", "Farmer@123", "farmer", "LocalLink Farmer", "9999999991")
        cur.execute("SELECT id FROM farmers WHERE user_id=%s", (farm_uid,))
        farm_row = cur.fetchone()
        if not farm_row:
            cur.execute(
                "INSERT INTO farmers (user_id, farm_name, location, village, district, state, pincode,"
                " rating, total_reviews, is_featured)"
                " VALUES (%s,'LocalLink Farm','123 Agri Lane','Green Village','Coimbatore','Tamil Nadu','641001',4.8,12,1)"
                " RETURNING id",
                (farm_uid,),
            )
            farmer_id = cur.fetchone()["id"]

            # Demo products for the seeded farmer
            demo_products = [
                ("Organic Red Tomatoes",    "Freshly harvested vine-ripened organic red tomatoes.", 30.00,  "kg",    150, 1, 1),
                ("Fresh Apples",            "Sweet and crispy organic red apples from Kashmir.",    120.00, "kg",     80, 2, 0),
                ("Premium Basmati Rice",    "Aromatic long-grain basmati rice, aged 1 year.",        90.00, "kg",    500, 3, 1),
                ("Fresh Farm Milk",         "Pure milk directly from our dairy cows.",               60.00, "litre", 100, 4, 1),
                ("Organic Turmeric Powder", "Pure organic turmeric ground from whole roots.",       150.00, "kg",     50, 5, 0),
            ]
            for name, desc, price, unit, qty, cat_idx, is_feat in demo_products:
                cur.execute("SELECT id FROM categories ORDER BY sort_order LIMIT 1 OFFSET %s", (cat_idx - 1,))
                cat_row = cur.fetchone()
                cat_id  = cat_row["id"] if cat_row else 1
                cur.execute(
                    "INSERT INTO products (farmer_id,category_id,name,description,price,unit,"
                    " available_qty,is_organic,is_featured,is_available)"
                    " VALUES (%s,%s,%s,%s,%s,%s,%s,1,%s,1)",
                    (farmer_id, cat_id, name, desc, price, unit, qty, is_feat),
                )

        conn.commit()
        current_app.logger.info("✅ Database seeded successfully.")
    except Exception as exc:
        conn.rollback()
        current_app.logger.error(f"❌ Seeding failed: {exc}")
    finally:
        cur.close()
        conn.close()


# ── init_db ───────────────────────────────────────────────────

def init_db(app):
    db.init_app(app)

    # Import models so SQLAlchemy registers them before create_all()
    import config.models  # noqa: F401

    with app.app_context():
        db_uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
        # Auto-create the target database if it doesn't exist yet
        if db_uri and db_uri.startswith("postgresql"):
            from urllib.parse import urlparse
            try:
                parsed  = urlparse(db_uri)
                db_name = parsed.path.lstrip("/") or "locallink_db"
                tmp = psycopg2.connect(
                    host=parsed.hostname or "localhost",
                    port=parsed.port or 5432,
                    user=parsed.username or "postgres",
                    password=parsed.password or "postgres",
                    database="postgres",
                )
                tmp.autocommit = True
                tc = tmp.cursor()
                tc.execute("SELECT 1 FROM pg_database WHERE datname=%s", (db_name,))
                if not tc.fetchone():
                    tc.execute(f'CREATE DATABASE "{db_name}"')
                    app.logger.info(f"✅ Database '{db_name}' created.")
                tc.close()
                tmp.close()
            except Exception as exc:
                app.logger.warning(f"Could not auto-create database: {exc}")

        try:
            db.create_all()
            # Auto-migrate products to add location column if not exists
            conn_mig = db.engine.raw_connection()
            cur_mig = conn_mig.cursor()
            cur_mig.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS location VARCHAR(255)")
            conn_mig.commit()
            cur_mig.close()
            conn_mig.close()
            
            seed_default_accounts()
        except Exception as exc:
            app.logger.error(f"❌ Table creation / seeding failed: {exc}")

    # Tear down the per-request connection
    @app.teardown_appcontext
    def close_db(error):
        conn = g.pop("db_conn", None)
        if conn:
            try:
                if error:
                    logger.warning(f"Error detected in request teardown: {error}. Rolling back database transaction.")
                    try:
                        conn.rollback()
                    except Exception as rb_err:
                        logger.error(f"Rollback failed: {rb_err}")
                if not conn.conn.closed:
                    conn.close()
            except Exception:
                pass
