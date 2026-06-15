-- ============================================================
--  LocalLink – PostgreSQL Database Schema
--  Run this once on a fresh database to create all tables.
--  File: database/schema.sql
-- ============================================================

-- Enable UUID extension (optional, not used by default)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(191) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(50)  NOT NULL DEFAULT 'vendor'
                CHECK (role IN ('admin','farmer','vendor','customer')),
    full_name   VARCHAR(120) NOT NULL,
    phone       VARCHAR(20),
    avatar_url  VARCHAR(500),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Farmers ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS farmers (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    farm_name     VARCHAR(150) NOT NULL,
    description   TEXT,
    location      VARCHAR(255) NOT NULL DEFAULT '',
    village       VARCHAR(100),
    district      VARCHAR(100),
    state         VARCHAR(100),
    pincode       VARCHAR(10),
    latitude      NUMERIC(10,8),
    longitude     NUMERIC(11,8),
    land_area     NUMERIC(8,2),
    rating        NUMERIC(3,2) DEFAULT 0.00,
    total_reviews INTEGER      DEFAULT 0,
    is_featured   BOOLEAN      DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Vendors ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    shop_name     VARCHAR(150) NOT NULL,
    description   TEXT,
    location      VARCHAR(255) NOT NULL DEFAULT '',
    village       VARCHAR(100),
    district      VARCHAR(100),
    state         VARCHAR(100),
    pincode       VARCHAR(10),
    latitude      NUMERIC(10,8),
    longitude     NUMERIC(11,8),
    business_type VARCHAR(100),
    rating        NUMERIC(3,2) DEFAULT 0.00,
    total_reviews INTEGER      DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Categories ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(80) NOT NULL UNIQUE,
    slug        VARCHAR(80) NOT NULL UNIQUE,
    icon        VARCHAR(100),
    color       VARCHAR(20),
    description TEXT,
    is_active   BOOLEAN     DEFAULT TRUE,
    sort_order  INTEGER     DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Products ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id              SERIAL PRIMARY KEY,
    farmer_id       INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    category_id     INTEGER NOT NULL REFERENCES categories(id),
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2) NOT NULL,
    unit            VARCHAR(30)   NOT NULL DEFAULT 'kg',
    min_order_qty   NUMERIC(8,2)  DEFAULT 1,
    available_qty   NUMERIC(10,2) NOT NULL DEFAULT 0,
    image_url       VARCHAR(500),
    images          JSONB,
    is_organic      BOOLEAN       DEFAULT FALSE,
    is_available    BOOLEAN       DEFAULT TRUE,
    is_featured     BOOLEAN       DEFAULT FALSE,
    harvest_date    DATE,
    expiry_date     DATE,
    rating          NUMERIC(3,2)  DEFAULT 0.00,
    total_reviews   INTEGER       DEFAULT 0,
    total_sold      INTEGER       DEFAULT 0,
    delivery_option VARCHAR(20)   DEFAULT 'both',
    location        VARCHAR(255),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Orders ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id               SERIAL PRIMARY KEY,
    vendor_id        INTEGER NOT NULL REFERENCES vendors(id),
    order_number     VARCHAR(20) NOT NULL UNIQUE,
    total_amount     NUMERIC(10,2) NOT NULL,
    delivery_address TEXT,
    delivery_type    VARCHAR(20)   DEFAULT 'pickup',
    status           VARCHAR(50)   DEFAULT 'pending',
    payment_method   VARCHAR(20)   DEFAULT 'cod',
    payment_status   VARCHAR(20)   DEFAULT 'pending',
    notes            TEXT,
    confirmed_at     TIMESTAMPTZ,
    delivered_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Order Items ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id         SERIAL PRIMARY KEY,
    order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    farmer_id  INTEGER NOT NULL REFERENCES farmers(id),
    quantity   NUMERIC(8,2)  NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    subtotal   NUMERIC(10,2) NOT NULL,
    status     VARCHAR(50)   DEFAULT 'pending',
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Cart ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart (
    id         SERIAL PRIMARY KEY,
    vendor_id  INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity   NUMERIC(8,2) NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cart UNIQUE (vendor_id, product_id)
);

-- ── Wishlist ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist (
    id         SERIAL PRIMARY KEY,
    vendor_id  INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_wishlist UNIQUE (vendor_id, product_id)
);

-- ── Reviews ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id         SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    vendor_id  INTEGER NOT NULL REFERENCES vendors(id),
    order_id   INTEGER REFERENCES orders(id),
    rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_review UNIQUE (product_id, vendor_id, order_id)
);

-- ── Notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(50)  NOT NULL,
    title      VARCHAR(200) NOT NULL,
    message    TEXT         NOT NULL,
    data       JSONB,
    is_read    BOOLEAN      DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Order Status History ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_status_history (
    id         SERIAL PRIMARY KEY,
    order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status     VARCHAR(50) NOT NULL,
    note       TEXT,
    changed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_farmer    ON products(farmer_id);
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor      ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order  ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_vendor        ON cart(vendor_id);
