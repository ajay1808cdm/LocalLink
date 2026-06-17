// routes/farmer.js - Farmer-specific routes
const express = require('express');
const pool = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// Dashboard statistics for the logged-in farmer
router.get('/dashboard', verifyToken, async (req, res, next) => {
  try {
    const farmerId = req.user.uid; // assuming uid matches farmers.user_id or id
    const stats = await pool.query(
      `SELECT 
        COUNT(p.id) AS products, 
        SUM(p.total_sold) AS total_sales, 
        SUM(p.price * p.total_sold) AS revenue 
       FROM products p 
       WHERE p.farmer_id = $1`,
      [farmerId]
    );
    res.json({ stats: stats.rows[0] || { products: 0, total_sales: 0, revenue: 0 } });
  } catch (err) {
    console.error('Farmer dashboard stats error:', err.message);
    // Return empty stats on DB error so frontend doesn't crash
    res.json({ stats: { products: 0, total_sales: 0, revenue: 0 } });
  }
});

// List all products belonging to the logged-in farmer
router.get('/products', verifyToken, async (req, res, next) => {
  try {
    const farmerId = req.user.uid;
    const result = await pool.query('SELECT * FROM products WHERE farmer_id = $1', [farmerId]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Public farmer profile (by farmer id)
router.get('/profile/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmer = await pool.query(
      `SELECT f.*, u.full_name, u.email, u.avatar_url FROM farmers f 
       JOIN users u ON f.user_id = u.id 
       WHERE f.id = $1`,
      [id]
    );
    if (farmer.rowCount === 0) {
      return res.status(404).json({ error: 'Farmer not found' });
    }
    res.json(farmer.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
