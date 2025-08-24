const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Database = require('../config/database');
const { auth } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');

const router = express.Router();

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    const { email, password, name, goals = [] } = req.body;

    // Check if user already exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      await db.close();
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await db.run(`
      INSERT INTO users (email, password, name, goals, user_coins)
      VALUES (?, ?, ?, ?, ?)
    `, [email, hashedPassword, name, JSON.stringify(goals), 10]);

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.id, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Store session
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.run(`
      INSERT INTO user_sessions (user_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `, [result.id, tokenHash, expiresAt.toISOString()]);

    // Create initial plant
    await db.run(`
      INSERT INTO plants (user_id, name, tasks_completed)
      VALUES (?, ?, ?)
    `, [result.id, 'My First Plant', 0]);

    await db.close();

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: result.id,
        email,
        name,
        userTheme: 'default',
        userCoins: 10,
        goals
      }
    });

  } catch (error) {
    await db.close();
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    const { email, password } = req.body;

    // Find user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      await db.close();
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await db.close();
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Store session
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.run(`
      INSERT INTO user_sessions (user_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `, [user.id, tokenHash, expiresAt.toISOString()]);

    await db.close();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userTheme: user.user_theme,
        userCoins: user.user_coins,
        goals: user.goals ? JSON.parse(user.goals) : []
      }
    });

  } catch (error) {
    await db.close();
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Logout user
router.post('/logout', auth, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    
    // Remove session
    const tokenHash = crypto.createHash('sha256').update(req.token).digest('hex');
    await db.run('DELETE FROM user_sessions WHERE token_hash = ?', [tokenHash]);

    await db.close();

    res.json({ message: 'Logout successful' });

  } catch (error) {
    await db.close();
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error during logout' });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        userTheme: req.user.user_theme,
        userCoins: req.user.user_coins,
        goals: req.user.goals ? JSON.parse(req.user.goals) : []
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// Clean up expired sessions (utility endpoint)
router.post('/cleanup-sessions', async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    
    const result = await db.run('DELETE FROM user_sessions WHERE expires_at < DATETIME("now")');
    
    await db.close();

    res.json({ 
      message: 'Session cleanup completed',
      deletedSessions: result.changes
    });

  } catch (error) {
    await db.close();
    console.error('Session cleanup error:', error);
    res.status(500).json({ error: 'Server error during cleanup' });
  }
});

module.exports = router;
