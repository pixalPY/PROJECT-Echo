const express = require('express');
const { getAdminAuth } = require('../config/firebase');
const { verifyFirebaseToken } = require('../config/firebase');
const firebaseService = require('../services/firebaseService');
const { validateRegistration } = require('../middleware/validation');

const router = express.Router();

// Register new user (creates Firebase auth user and saves login info)
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { email, password, name, goals = [] } = req.body;
    
    // Create Firebase Authentication user
    const adminAuth = getAdminAuth();
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: false
    });
    
    // Create user document in Firestore with login information
    const userData = await firebaseService.createUserDocument(userRecord.uid, {
      email: email,
      name: name,
      goals: goals,
      password: password // This will be saved to UserLOGININFORMATION collection
    });
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email: email,
        name: userData.name,
        userTheme: userData.userTheme,
        userCoins: userData.userCoins,
        goals: userData.goals
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ error: 'Password is too weak' });
    }
    
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Create user profile after Firebase Authentication
router.post('/create-profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { name, goals = [], password } = req.body;
    
    // Create user document in Firestore
    const userData = await firebaseService.createUserDocument(req.user.uid, {
      email: req.user.email,
      name: name || req.user.name,
      goals,
      password: password // Pass password to save in UserLOGININFORMATION
    });

    res.status(201).json({
      message: 'User profile created successfully',
      user: {
        uid: req.user.uid,
        email: req.user.email,
        name: userData.name,
        userTheme: userData.userTheme,
        userCoins: userData.userCoins,
        goals: userData.goals
      }
    });

  } catch (error) {
    console.error('Create profile error:', error);
    
    if (error.message === 'User document already exists') {
      return res.status(400).json({ error: 'User profile already exists' });
    }
    
    res.status(500).json({ error: 'Server error creating profile' });
  }
});

// Get current user profile
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const userData = await firebaseService.getUserData(req.user.uid);
    
    res.json({
      user: {
        uid: req.user.uid,
        email: req.user.email,
        name: userData.name,
        userTheme: userData.userTheme,
        userCoins: userData.userCoins,
        goals: userData.goals || []
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User profile not found. Please create a profile first.' });
    }
    
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// Update user profile
router.patch('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { name, goals } = req.body;
    const updates = {};
    
    if (name !== undefined) updates.name = name;
    if (goals !== undefined) updates.goals = goals;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }
    
    await firebaseService.updateUserData(req.user.uid, updates);
    
    res.json({
      message: 'Profile updated successfully',
      updates
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// Delete user account (optional - requires careful implementation)
router.delete('/account', verifyFirebaseToken, async (req, res) => {
  try {
    const adminAuth = getAdminAuth();
    
    // Delete user from Firebase Auth
    await adminAuth.deleteUser(req.user.uid);
    
    // Note: Firestore data will be automatically cleaned up by security rules
    // or you can implement a cloud function to handle cleanup
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error deleting account' });
  }
});

// Verify token endpoint (useful for frontend token validation)
router.get('/verify', verifyFirebaseToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name
    }
  });
});

// Custom login using UserLOGININFORMATION collection with progress restoration
router.post('/custom-login', async (req, res) => {
  try {
    const { email, password, loadProgress = true } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Authenticate user against UserLOGININFORMATION collection
    const loginInfo = await firebaseService.authenticateUser(email, password);
    
    if (!loginInfo) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Find the user in the users collection by email
    const { getAdminFirestore } = require('../config/firebase');
    const db = getAdminFirestore();
    const usersSnapshot = await db.collection('users').where('email', '==', email).get();
    
    if (usersSnapshot.empty) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    let userData = null;
    let userId = null;
    usersSnapshot.forEach(doc => {
      userData = doc.data();
      userId = doc.id;
    });
    
    // Load complete progress if requested
    let completeProgress = null;
    if (loadProgress) {
      try {
        completeProgress = await firebaseService.loadCompleteUserProgress(userId);
      } catch (progressError) {
        console.warn('Could not load complete progress:', progressError.message);
      }
    }
    
    const response = {
      message: 'Login successful - progress restored',
      user: {
        uid: userId,
        email: userData.email,
        name: userData.name,
        userTheme: userData.userTheme,
        userCoins: userData.userCoins,
        goals: userData.goals || [],
        lastLogin: loginInfo.lastLogin,
        lastActiveAt: userData.lastActiveAt,
        progressRestored: !!completeProgress
      }
    };
    
    // Include complete progress if loaded
    if (completeProgress) {
      response.progress = completeProgress;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Custom login error:', error);
    
    if (error.message === 'User not found' || error.message === 'Invalid password') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get Firebase config for frontend (public endpoint)
router.get('/config', (req, res) => {
  const { firebaseConfig } = require('../config/firebase');
  
  // Only send public configuration (never include private keys)
  const publicConfig = {
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
    measurementId: firebaseConfig.measurementId
  };
  
  res.json({ firebaseConfig: publicConfig });
});

// Admin endpoints (for testing/development)
if (process.env.NODE_ENV === 'development') {
  // List all users (dev only)
  router.get('/admin/users', async (req, res) => {
    try {
      const adminAuth = getAdminAuth();
      const listUsers = await adminAuth.listUsers(10); // Limit to 10 users
      
      const users = listUsers.users.map(user => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
      }));
      
      res.json({ users });
    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({ error: 'Server error listing users' });
    }
  });

  // Create custom token (dev only)
  router.post('/admin/custom-token', async (req, res) => {
    try {
      const { uid } = req.body;
      
      if (!uid) {
        return res.status(400).json({ error: 'UID is required' });
      }
      
      const adminAuth = getAdminAuth();
      const customToken = await adminAuth.createCustomToken(uid);
      
      res.json({ customToken });
    } catch (error) {
      console.error('Create custom token error:', error);
      res.status(500).json({ error: 'Server error creating custom token' });
    }
  });
}

module.exports = router;
