// middleware/authMiddleware.js
// JWT authentication middleware for Express routes
const jwt = require('jsonwebtoken');

// Verify JWT and attach user payload to request
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'locallink_secret');
    req.user = decoded; // Attach user info (uid, email, role)
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = verifyToken;
