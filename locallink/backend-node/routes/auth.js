// routes/auth.js - Local Mock Authentication Routes
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Hardcoded Mock Users matching requested credentials
const MOCK_USERS = [
  {
    uid: 'demo_customer_001',
    full_name: 'Test Customer',
    email: 'testcustomer@locallink.com',
    password: 'Customer@123',
    phone: '555-0101',
    role: 'customer',
    address: '123 Customer Lane',
    approved: true
  },
  {
    uid: 'demo_vendor_002',
    full_name: 'Test Vendor',
    email: 'vendor@locallink.com',
    password: 'Vendor@123',
    phone: '555-0202',
    role: 'vendor',
    address: '456 Vendor Market',
    approved: true
  },
  {
    uid: 'demo_farmer_003',
    full_name: 'Test Farmer',
    email: 'farmer@locallink.com',
    password: 'Farmer@123',
    phone: '555-0303',
    role: 'farmer',
    address: '789 Farmer Field',
    approved: true
  }
];

// Helper to generate our own JWT
function generateToken(user) {
  const payload = { uid: user.uid, email: user.email, role: user.role };
  const secret = process.env.JWT_SECRET || 'locallink_secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

// Register endpoint (Mocked)
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, phone, address } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password and role are required' });
    }
    
    // Check if user already exists in mock array
    const existing = MOCK_USERS.find(u => u.email === email);
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Create a new mock user object
    const newUser = {
      uid: 'new_user_' + Date.now(),
      full_name: name,
      email,
      password, // In a real app this would be hashed
      phone: phone || '',
      role,
      address: address || '',
      approved: role === 'admin' || role === 'customer'
    };

    // Push to mock array so login works during the same session
    MOCK_USERS.push(newUser);

    const token = generateToken(newUser);
    const { password: _, ...userWithoutPass } = newUser; // strip password
    
    res.status(201).json({ access_token: token, user: userWithoutPass });
  } catch (err) {
    console.error('Auth register error:', err);
    next(err);
  }
});

// Login endpoint (Mocked)
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = generateToken(user);
    const { password: _, ...userWithoutPass } = user; // strip password

    res.json({ access_token: token, user: userWithoutPass });
  } catch (err) {
    console.error('Auth login error:', err);
    next(err);
  }
});

// Protected route to fetch current user based on our JWT
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'locallink_secret');
    
    const user = MOCK_USERS.find(u => u.uid === decoded.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const { password: _, ...userWithoutPass } = user;
    res.json({ user: userWithoutPass });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
