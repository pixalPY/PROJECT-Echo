const jwt = require('jsonwebtoken');
const Database = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = new Database();
    await db.connect();

    // Check if session exists and is not expired
    const session = await db.get(
      'SELECT * FROM user_sessions WHERE user_id = ? AND expires_at > DATETIME("now")',
      [decoded.userId]
    );

    if (!session) {
      await db.close();
      return res.status(401).json({ error: 'Token expired or invalid.' });
    }

    // Get user data
    const user = await db.get(
      'SELECT id, email, name, user_theme, user_coins, goals FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      await db.close();
      return res.status(401).json({ error: 'User not found.' });
    }

    await db.close();
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = new Database();
    await db.connect();

    const user = await db.get(
      'SELECT id, email, name, user_theme, user_coins, goals FROM users WHERE id = ?',
      [decoded.userId]
    );

    await db.close();
    
    req.user = user || null;
    req.token = token;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = { auth, optionalAuth };
