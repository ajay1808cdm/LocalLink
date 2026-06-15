-- ============================================================
--  LOCAL LINK – Marketplace Database Schema
--  MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS locallink_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE locallink_db;

-- ─── USERS (base auth table) ─────────────────────────────────
CREATE TABLE users (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(191) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('farmer','vendor','customer','admin') NOT NULL DEFAULT 'vendor',
    full_name   VARCHAR(120) NOT NULL,
    phone       VARCHAR(20),
    avatar_url  VARCHAR(500),
    is_active   TINYINT(1) NOT NULL DEFAULT 1,
    is_verified TINYINT(1) NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_email (email)
);

-- ─── FARMERS ─────────────────────────────────────────────────
CREATE TABLE farmers (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL UNIQUE,
    farm_name     VARCHAR(150) NOT NULL,
    description   TEXT,
    location      VARCHAR(255) NOT NULL,
    village       VARCHAR(100),
    district      VARCHAR(100),
    state         VARCHAR(100),
    pincode       VARCHAR(10),
    latitude      DECIMAL(10,8),
    longitude     DECIMAL(11,8),
    land_area     DECIMAL(8,2) COMMENT 'in acres',
    rating        DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT UNSIGNED DEFAULT 0,
    is_featured   TINYINT(1) DEFAULT 0,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_pincode (pincode),
    INDEX idx_district (district)
);

-- ─── VENDORS ─────────────────────────────────────────────────
CREATE TABLE vendors (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id      INT UNSIGNED NOT NULL UNIQUE,
    shop_name    VARCHAR(150) NOT NULL,
    description  TEXT,
    location     VARCHAR(255) NOT NULL,
    village      VARCHAR(100),
    district     VARCHAR(100),
    state        VARCHAR(100),
    pincode      VARCHAR(10),
    latitude     DECIMAL(10,8),
    longitude    DECIMAL(11,8),
    business_type VARCHAR(100),
    rating       DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT UNSIGNED DEFAULT 0,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── CATEGORIES ──────────────────────────────────────────────
CREATE TABLE categories (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(80) NOT NULL UNIQUE,
    slug        VARCHAR(80) NOT NULL UNIQUE,
    icon        VARCHAR(100),
    color       VARCHAR(20),
    description TEXT,
    is_active   TINYINT(1) DEFAULT 1,
    sort_order  INT DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── PRODUCTS ────────────────────────────────────────────────
CREATE TABLE products (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmer_id       INT UNSIGNED NOT NULL,
    category_id     INT UNSIGNED NOT NULL,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2) NOT NULL,
    unit            VARCHAR(30) NOT NULL DEFAULT 'kg' COMMENT 'kg, litre, dozen, piece, etc.',
    min_order_qty   DECIMAL(8,2) DEFAULT 1,
    available_qty   DECIMAL(10,2) NOT NULL DEFAULT 0,
    image_url       VARCHAR(500),
    images          JSON COMMENT 'array of image URLs',
    is_organic      TINYINT(1) DEFAULT 0,
    is_available    TINYINT(1) DEFAULT 1,
    is_featured     TINYINT(1) DEFAULT 0,
    harvest_date    DATE,
    expiry_date     DATE,
    rating          DECIMAL(3,2) DEFAULT 0.00,
    total_reviews   INT UNSIGNED DEFAULT 0,
    total_sold      INT UNSIGNED DEFAULT 0,
    delivery_option ENUM('pickup','delivery','both') DEFAULT 'both',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FULLTEXT INDEX ft_product_search (name, description),
    INDEX idx_category (category_id),
    INDEX idx_farmer (farmer_id),
    INDEX idx_available (is_available)
);

-- ─── ORDERS ──────────────────────────────────────────────────
CREATE TABLE orders (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vendor_id        INT UNSIGNED NOT NULL,
    order_number     VARCHAR(20) NOT NULL UNIQUE,
    total_amount     DECIMAL(10,2) NOT NULL,
    delivery_address TEXT,
    delivery_type    ENUM('pickup','delivery') DEFAULT 'pickup',
    status           ENUM('pending','confirmed','processing','ready','out_for_delivery','delivered','cancelled') DEFAULT 'pending',
    payment_method   ENUM('cod','upi','bank') DEFAULT 'cod',
    payment_status   ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
    notes            TEXT,
    confirmed_at     DATETIME,
    delivered_at     DATETIME,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    INDEX idx_vendor (vendor_id),
    INDEX idx_status (status)
);

-- ─── ORDER ITEMS ─────────────────────────────────────────────
CREATE TABLE order_items (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id   INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    farmer_id  INT UNSIGNED NOT NULL,
    quantity   DECIMAL(8,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal   DECIMAL(10,2) NOT NULL,
    status     ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (farmer_id) REFERENCES farmers(id)
);

-- ─── CART ────────────────────────────────────────────────────
CREATE TABLE cart (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vendor_id  INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    quantity   DECIMAL(8,2) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cart (vendor_id, product_id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ─── WISHLIST ────────────────────────────────────────────────
CREATE TABLE wishlist (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vendor_id  INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_wishlist (vendor_id, product_id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ─── REVIEWS ─────────────────────────────────────────────────
CREATE TABLE reviews (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id  INT UNSIGNED NOT NULL,
    vendor_id   INT UNSIGNED NOT NULL,
    order_id    INT UNSIGNED,
    rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_review (product_id, vendor_id, order_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE notifications (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    type       ENUM('order_placed','order_confirmed','order_delivered','new_product','price_drop','low_stock','review','system') NOT NULL,
    title      VARCHAR(200) NOT NULL,
    message    TEXT NOT NULL,
    data       JSON COMMENT 'extra metadata like order_id, product_id',
    is_read    TINYINT(1) DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_unread (user_id, is_read)
);

-- ─── ORDER STATUS HISTORY ────────────────────────────────────
CREATE TABLE order_status_history (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id   INT UNSIGNED NOT NULL,
    status     VARCHAR(50) NOT NULL,
    note       TEXT,
    changed_by INT UNSIGNED,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- ─── SEED DATA ───────────────────────────────────────────────
INSERT INTO categories (name, slug, icon, color, sort_order) VALUES
  ('Vegetables',  'vegetables',  '🥦', '#22c55e', 1),
  ('Fruits',      'fruits',      '🍎', '#f97316', 2),
  ('Grains',      'grains',      '🌾', '#eab308', 3),
  ('Dairy',       'dairy',       '🥛', '#3b82f6', 4),
  ('Spices',      'spices',      '🌶️', '#ef4444', 5),
  ('Pulses',      'pulses',      '🫘', '#a855f7', 6),
  ('Herbs',       'herbs',       '🌿', '#10b981', 7),
  ('Dry Fruits',  'dry-fruits',  '🥜', '#d97706', 8);

-- Admin user (password: Admin@123)
INSERT INTO users (email, password, role, full_name, phone, is_active, is_verified) VALUES
  ('admin@locallink.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMUBQ9q5UxB5yV8y.xNL7xN.5i', 'admin', 'Admin User', '9999999999', 1, 1);
