// routes/auth.js - Authentication routes using Firebase
const express = require('express');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch'); // npm install node-fetch@2
const admin = require('../config/firebaseAdmin'); // initialized firebase-admin

const router = express.Router();

// Helper to generate our own JWT (compatible with existing frontend)
function generateToken(user) {
  const payload = { uid: user.uid, email: user.email, role: user.role || 'customer' };
  const secret = process.env.JWT_SECRET || 'locallink_secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

// Register endpoint (Email/Password)
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, phone, address } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password and role are required' });
    }
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
    // Store additional profile data in Firestore
    const userDoc = {
      uid: userRecord.uid,
      full_name: name,
      email,
      phone: phone || '',
      role,
      address: address || '',
      approved: role === 'admin', // auto‑approve admin demo account
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await admin.firestore().collection('users').doc(userRecord.uid).set(userDoc);
    const token = generateToken(userDoc);
    res.status(201).json({ token, user: userDoc });
  } catch (err) {
    console.error('Auth register error:', err);
    // Translate Firebase errors to HTTP codes
    if (err.code && err.code.startsWith('auth/')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// Login endpoint using Firebase Auth REST API
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Firebase API key not configured' });
    }
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const data = await response.json();
    if (data.error) {
      return res.status(401).json({ error: data.error.message });
    }
    // Retrieve user profile from Firestore
    const userSnap = await admin.firestore().collection('users').doc(data.localId).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    const userProfile = userSnap.data();
    const token = generateToken(userProfile);
    res.json({ token, user: userProfile });
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
    const userSnap = await admin.firestore().collection('users').doc(decoded.uid).get();
    if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });
    res.json({ user: userSnap.data() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
