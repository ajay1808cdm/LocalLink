// server.js - Entry point for LocalLink Node.js backend

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
// Future route imports can be added here, e.g., const productRoutes = require('./routes/products');
const farmerRoutes = require('./routes/farmer');
const app = express();

// Middleware
app.use(helmet()); // security headers
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json()); // parse JSON bodies
app.use(morgan('dev'));

// Mount API routes under /api
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/products', require('./routes/products')); // Product routes
// TODO: mount other route groups when implemented
app.use('/api/farmer', farmerRoutes);

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
