const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');

// Firebase Admin SDK configuration (for server-side operations)
let adminApp;

const initializeFirebaseAdmin = () => {
  if (adminApp) return adminApp;

  try {
    // Initialize with service account file
    const serviceAccount = require('./firebase-service-account.json');
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'projectecho-791fb',
      databaseURL: `https://projectecho-791fb-default-rtdb.firebaseio.com`
    });

    console.log('✅ Firebase Admin initialized successfully with service account');
    return adminApp;
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    throw error;
  }
};

// Firebase Client SDK configuration (for frontend)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase client app
let clientApp;
const initializeFirebaseClient = () => {
  if (clientApp) return clientApp;
  
  try {
    clientApp = initializeApp(firebaseConfig);
    console.log('✅ Firebase Client initialized successfully');
    return clientApp;
  } catch (error) {
    console.error('❌ Firebase Client initialization failed:', error);
    throw error;
  }
};

// Get Firebase services
const getFirebaseAuth = () => {
  const app = initializeFirebaseClient();
  return getAuth(app);
};

const getFirebaseFirestore = () => {
  const app = initializeFirebaseClient();
  return getFirestore(app);
};

const getFirebaseAdmin = () => {
  return initializeFirebaseAdmin();
};

const getAdminFirestore = () => {
  const app = initializeFirebaseAdmin();
  return admin.firestore(app);
};

const getAdminAuth = () => {
  const app = initializeFirebaseAdmin();
  return admin.auth(app);
};

// Verify Firebase ID token middleware
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email?.split('@')[0]
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = {
  initializeFirebaseAdmin,
  initializeFirebaseClient,
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseAdmin,
  getAdminFirestore,
  getAdminAuth,
  verifyFirebaseToken,
  firebaseConfig
};
