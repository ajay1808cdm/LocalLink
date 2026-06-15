-- ============================================================
--  LOCAL LINK – Marketplace Database Schema (PostgreSQL)
-- ============================================================

-- Drop tables if they exist
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(191) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(50) NOT NULL CHECK (role IN ('farmer','vendor','customer','admin')),
    full_name   VARCHAR(120) NOT NULL,
    phone       VARCHAR(20),
    avatar_url  VARCHAR(500),
    is_active   SMALLINT NOT NULL DEFAULT 1,
    is_verified SMALLINT NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ─── FARMERS ─────────────────────────────────────────────────
CREATE TABLE farmers (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    farm_name     VARCHAR(150) NOT NULL,
    description   TEXT,
    location      VARCHAR(255) NOT NULL,
    village       VARCHAR(100),
    district      VARCHAR(100),
    state         VARCHAR(100),
    pincode       VARCHAR(10),
    latitude      NUMERIC(10,8),
    longitude     NUMERIC(11,8),
    land_area     NUMERIC(8,2),
    rating        NUMERIC(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    is_featured   SMALLINT DEFAULT 0,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_farmers_pincode ON farmers(pincode);
CREATE INDEX idx_farmers_district ON farmers(district);

-- ─── VENDORS ─────────────────────────────────────────────────
CREATE TABLE vendors (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    shop_name     VARCHAR(150) NOT NULL,
    description   TEXT,
    location      VARCHAR(255) NOT NULL,
    village       VARCHAR(100),
    district      VARCHAR(100),
    state         VARCHAR(100),
    pincode       VARCHAR(10),
    latitude      NUMERIC(10,8),
    longitude     NUMERIC(11,8),
    business_type VARCHAR(100),
    rating        NUMERIC(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── CATEGORIES ──────────────────────────────────────────────
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(80) NOT NULL UNIQUE,
    slug        VARCHAR(80) NOT NULL UNIQUE,
    icon        VARCHAR(100),
    color       VARCHAR(20),
    description TEXT,
    is_active   SMALLINT DEFAULT 1,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── PRODUCTS ────────────────────────────────────────────────
CREATE TABLE products (
    id              SERIAL PRIMARY KEY,
    farmer_id       INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    category_id     INTEGER NOT NULL REFERENCES categories(id),
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2) NOT NULL,
    unit            VARCHAR(30) NOT NULL DEFAULT 'kg',
    min_order_qty   NUMERIC(8,2) DEFAULT 1,
    available_qty   NUMERIC(10,2) NOT NULL DEFAULT 0,
    image_url       VARCHAR(500),
    images          JSON,
    is_organic      SMALLINT DEFAULT 0,
    is_available    SMALLINT DEFAULT 1,
    is_featured     SMALLINT DEFAULT 0,
    harvest_date    DATE,
    expiry_date     DATE,
    rating          NUMERIC(3,2) DEFAULT 0.00,
    total_reviews   INTEGER DEFAULT 0,
    total_sold      INTEGER DEFAULT 0,
    delivery_option VARCHAR(20) DEFAULT 'both',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_farmer ON products(farmer_id);
CREATE INDEX idx_products_available ON products(is_available);

-- ─── ORDERS ──────────────────────────────────────────────────
CREATE TABLE orders (
    id               SERIAL PRIMARY KEY,
    vendor_id        INTEGER NOT NULL REFERENCES vendors(id),
    order_number     VARCHAR(20) NOT NULL UNIQUE,
    total_amount     NUMERIC(10,2) NOT NULL,
    delivery_address TEXT,
    delivery_type    VARCHAR(20) DEFAULT 'pickup',
    status           VARCHAR(50) DEFAULT 'pending',
    payment_method   VARCHAR(20) DEFAULT 'cod',
    payment_status   VARCHAR(20) DEFAULT 'pending',
    notes            TEXT,
    confirmed_at     TIMESTAMP,
    delivered_at     TIMESTAMP,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ─── ORDER ITEMS ─────────────────────────────────────────────
CREATE TABLE order_items (
    id         SERIAL PRIMARY KEY,
    order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    farmer_id  INTEGER NOT NULL REFERENCES farmers(id),
    quantity   NUMERIC(8,2) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    subtotal   NUMERIC(10,2) NOT NULL,
    status     VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── CART ────────────────────────────────────────────────────
CREATE TABLE cart (
    id         SERIAL PRIMARY KEY,
    vendor_id  INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity   NUMERIC(8,2) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cart UNIQUE (vendor_id, product_id)
);

-- ─── WISHLIST ────────────────────────────────────────────────
CREATE TABLE wishlist (
    id         SERIAL PRIMARY KEY,
    vendor_id  INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_wishlist UNIQUE (vendor_id, product_id)
);

-- ─── REVIEWS ─────────────────────────────────────────────────
CREATE TABLE reviews (
    id          SERIAL PRIMARY KEY,
    product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    vendor_id   INTEGER NOT NULL REFERENCES vendors(id),
    order_id    INTEGER REFERENCES orders(id),
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_review UNIQUE (product_id, vendor_id, order_id)
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(50) NOT NULL,
    title      VARCHAR(200) NOT NULL,
    message    TEXT NOT NULL,
    data       JSON,
    is_read    SMALLINT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_user_read ON notifications(user_id, is_read);

-- ─── ORDER STATUS HISTORY ────────────────────────────────────
CREATE TABLE order_status_history (
    id         SERIAL PRIMARY KEY,
    order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status     VARCHAR(50) NOT NULL,
    note       TEXT,
    changed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── SEED CATEGORIES ─────────────────────────────────────────
INSERT INTO categories (name, slug, icon, color, sort_order) VALUES
  ('Vegetables',  'vegetables',  '🥦', '#22c55e', 1),
  ('Fruits',      'fruits',      '🍎', '#f97316', 2),
  ('Grains',      'grains',      '🌾', '#eab308', 3),
  ('Dairy',       'dairy',       '🥛', '#3b82f6', 4),
  ('Spices',      'spices',      '🌶️', '#ef4444', 5),
  ('Pulses',      'pulses',      '🫘', '#a855f7', 6),
  ('Herbs',       'herbs',       '🌿', '#10b981', 7),
  ('Dry Fruits',  'dry-fruits',  '🥜', '#d97706', 8);

-- ─── SEED USER ACCOUNTS (Passwords hashed using bcrypt) ───────
-- Admin: admin@locallink.com / Admin@123
INSERT INTO users (email, password, role, full_name, phone, is_active, is_verified) VALUES
  ('admin@locallink.com', '$2b$12$WXZ049CAX7rKXvgPGtkwVuQ1W1LwXobCirGhnaMiSzakqux./c7U.', 'admin', 'LocalLink Admin', '9999999999', 1, 1);

-- Customer: customer@locallink.com / Customer@123
INSERT INTO users (email, password, role, full_name, phone, is_active, is_verified) VALUES
  ('customer@locallink.com', '$2b$12$YycE929IlD15L8dnaKqJeOyMYBah333xkOECaB0ddWMxXwNupahJK', 'customer', 'LocalLink Customer', '9999999993', 1, 1);
INSERT INTO vendors (user_id, shop_name, location, village, district, state, pincode) VALUES
  ((SELECT id FROM users WHERE email='customer@locallink.com'), 'LocalLink Customer Shop', 'Coimbatore', 'Coimbatore Village', 'Coimbatore', 'Tamil Nadu', '641001');

-- Vendor: vendor@locallink.com / Vendor@123
INSERT INTO users (email, password, role, full_name, phone, is_active, is_verified) VALUES
  ('vendor@locallink.com', '$2b$12$zf.YPx70KOciXsiesm3VCunIgAGeSL2DWbvvmWWBD7WCeOymGbTGe', 'vendor', 'LocalLink Vendor', '9999999992', 1, 1);
INSERT INTO vendors (user_id, shop_name, location, village, district, state, pincode) VALUES
  ((SELECT id FROM users WHERE email='vendor@locallink.com'), 'LocalLink Vendor Shop', '456 Market Road', 'Market Town', 'Coimbatore', 'Tamil Nadu', '641002');

-- Farmer: farmer@locallink.com / Farmer@123
INSERT INTO users (email, password, role, full_name, phone, is_active, is_verified) VALUES
  ('farmer@locallink.com', '$2b$12$/dSs6k.d4sb.L8uHi3NchOZonezvsLere5qWW4WJufjuSBp.obTA.', 'farmer', 'LocalLink Farmer', '9999999991', 1, 1);
INSERT INTO farmers (user_id, farm_name, location, village, district, state, pincode, rating, total_reviews, is_featured) VALUES
  ((SELECT id FROM users WHERE email='farmer@locallink.com'), 'LocalLink Farmer Farm', '123 Agri Lane, Green Valley', 'Green Village', 'Coimbatore', 'Tamil Nadu', '641001', 4.8, 12, 1);

-- ─── SEED DUMMY PRODUCTS FOR FARMER ──────────────────────────
INSERT INTO products (farmer_id, category_id, name, description, price, unit, available_qty, is_organic, is_featured, is_available) VALUES
  ((SELECT id FROM farmers WHERE farm_name='LocalLink Farmer Farm'), (SELECT id FROM categories WHERE slug='vegetables'), 'Organic Red Tomatoes', 'Freshly harvested vine-ripened organic red tomatoes.', 30.00, 'kg', 150.00, 1, 1, 1),
  ((SELECT id FROM farmers WHERE farm_name='LocalLink Farmer Farm'), (SELECT id FROM categories WHERE slug='fruits'), 'Fresh Apples', 'Sweet and crispy organic red apples from Kashmir.', 120.00, 'kg', 80.00, 1, 0, 1),
  ((SELECT id FROM farmers WHERE farm_name='LocalLink Farmer Farm'), (SELECT id FROM categories WHERE slug='grains'), 'Premium Basmati Rice', 'Aromatic long grain basmati rice, aged for 1 year.', 90.00, 'kg', 500.00, 1, 1, 1),
  ((SELECT id FROM farmers WHERE farm_name='LocalLink Farmer Farm'), (SELECT id FROM categories WHERE slug='dairy'), 'Fresh Farm Milk', 'Pure, unadulterated milk directly from our dairy cows.', 60.00, 'litre', 100.00, 1, 1, 1),
  ((SELECT id FROM farmers WHERE farm_name='LocalLink Farmer Farm'), (SELECT id FROM categories WHERE slug='spices'), 'Organic Turmeric Powder', 'Pure organic turmeric ground from whole roots.', 150.00, 'kg', 50.00, 1, 0, 1);
