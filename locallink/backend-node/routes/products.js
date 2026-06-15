// routes/products.js - Product routes for LocalLink
const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const pool = require('../config/db');

const router = express.Router();

// GET all products
router.get('/', async (req, res, next) => {
  try {
    // Fetch products with their category names for UI consumption
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.id DESC`
    );
    const rows = result.rows;
    // Return empty array if no products
    res.json(rows.length ? rows : []);
  } catch (err) {
    // Log full error for debugging
    console.error('GET /api/products error:', err);
    // If the products table does not exist, create it lazily (optional) or return empty array
    if (err.code === '42P01') {
      // relation "products" does not exist
      console.warn('Products table missing; returning empty list');
      return res.json([]);
    }
    // For any other error, send user-friendly message
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST a new product (basic fields: name, description, price)
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const {
      name,
      category,
      price,
      unit,
      quantity,
      description,
      image,
      availability,
      location,
    } = req.body;
    // Validate required fields
    if (!name || !category || price == null || !unit || quantity == null) {
      return res.status(400).json({ error: 'Missing required fields: name, category, price, unit, quantity' });
    }
    // Resolve category to ID (accept ID, name or slug)
    let categoryId;
    if (/^\d+$/.test(String(category))) {
      // numeric ID
      categoryId = parseInt(category);
    } else {
      // lookup by name or slug
      const catResult = await pool.query(
        `SELECT id FROM categories WHERE name = $1 OR slug = $1 LIMIT 1`,
        [category]
      );
      if (catResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid category' });
      }
      categoryId = catResult.rows[0].id;
    }
    // farmer_id from JWT payload
    const farmer_id = req.user.uid;
    const result = await pool.query(
      `INSERT INTO products 
        (name, category_id, price, unit, quantity, description, is_available, location, farmer_id, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
      [
        name,
        categoryId,
        parseFloat(price),
        unit,
        parseFloat(quantity),
        description || '',
        availability ? 1 : 0,
        location || '',
        farmer_id,
        image || ''
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Product creation error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

module.exports = router;
