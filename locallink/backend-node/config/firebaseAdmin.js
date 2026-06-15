// config/firebaseAdmin.js – Single initialiser for Firebase Admin SDK
'use strict';
require('dotenv').config();
const admin = require('firebase-admin');
const path  = require('path');

if (!admin.apps.length) {
  const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));
  admin.initializeApp({
    credential:    admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const db     = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { admin, db, bucket };
