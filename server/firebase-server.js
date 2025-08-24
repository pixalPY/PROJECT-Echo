require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import Firebase configuration
const { initializeFirebaseAdmin } = require('./config/firebase');

// Import routes
const firebaseAuthRoutes = require('./routes/firebase-auth');
const firebaseTaskRoutes = require('./routes/firebase-tasks');
const firebaseUserRoutes = require('./routes/firebase-users');
const userRegistrationRoutes = require('./routes/user-registration');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.tailwindcss.com", "https://js.stripe.com", "https://www.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://identitytoolkit.googleapis.com", "https://firestore.googleapis.com", "https://securetoken.googleapis.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["https://js.stripe.com", "https://*.firebaseapp.com"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (serve frontend if needed)
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'Firebase Firestore',
    auth: 'Firebase Authentication'
  });
});

// API routes
app.use('/api/auth', firebaseAuthRoutes);
app.use('/api/tasks', firebaseTaskRoutes);
app.use('/api/users', firebaseUserRoutes);
app.use('/api', userRegistrationRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'PROJECT:Echo Firebase API',
    version: '1.0.0',
    description: 'Firebase-powered backend API for PROJECT:Echo task management app',
    database: 'Cloud Firestore',
    authentication: 'Firebase Authentication',
    endpoints: {
      auth: {
        'GET /api/auth/config': 'Get Firebase configuration for frontend',
        'POST /api/auth/create-profile': 'Create user profile after Firebase auth',
        'GET /api/auth/profile': 'Get user profile',
        'PATCH /api/auth/profile': 'Update user profile',
        'GET /api/auth/verify': 'Verify Firebase ID token',
        'DELETE /api/auth/account': 'Delete user account'
      },
      tasks: {
        'GET /api/tasks': 'Get all user tasks',
        'POST /api/tasks': 'Create new task',
        'PUT /api/tasks/:id': 'Update task',
        'PATCH /api/tasks/:id/toggle': 'Toggle task completion',
        'DELETE /api/tasks/:id': 'Delete task',
        'GET /api/tasks/stats': 'Get task statistics',
        'GET /api/tasks/search': 'Search tasks',
        'POST /api/tasks/bulk': 'Bulk operations on tasks'
      },
      users: {
        'PATCH /api/users/theme': 'Update user theme',
        'GET /api/users/inventory': 'Get user inventory',
        'POST /api/users/inventory/purchase': 'Purchase item',
        'GET /api/users/plants': 'Get user plants',
        'POST /api/users/plants': 'Add new plant',
        'GET /api/users/health/:date': 'Get health data for date',
        'PUT /api/users/health/:date': 'Update health data for date',
        'PATCH /api/users/coins': 'Update user coins',
        'GET /api/users/stats': 'Get comprehensive user statistics',
        'GET /api/users/export': 'Export all user data (GDPR)'
      }
    },
    setup: {
      frontend: 'Use Firebase SDK for authentication, then call API endpoints with Firebase ID token',
      authentication: 'Include Firebase ID token in Authorization header: Bearer <token>',
      realtime: 'Use Firestore real-time listeners for live updates'
    }
  });
});

// Serve frontend for any non-API routes (SPA support)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  
  if (error.code === 'auth/id-token-expired') {
    return res.status(401).json({ error: 'Token expired. Please sign in again.' });
  }
  
  if (error.code === 'auth/invalid-id-token') {
    return res.status(401).json({ error: 'Invalid token. Please sign in again.' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Initialize Firebase and start server
async function startServer() {
  try {
    console.log('🔥 Initializing Firebase...');
    await initializeFirebaseAdmin();
    
    app.listen(PORT, () => {
      console.log(`🚀 PROJECT:Echo Firebase Backend Server running on port ${PORT}`);
      console.log(`📱 API Documentation: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔥 Database: Firebase Firestore`);
      console.log(`🔐 Authentication: Firebase Authentication`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('');
        console.log('📋 Quick Start:');
        console.log('  1. Set up Firebase project at https://console.firebase.google.com');
        console.log('  2. Enable Authentication and Firestore');
        console.log('  3. Add your Firebase config to .env file');
        console.log('  4. Use Firebase SDK in frontend for authentication');
        console.log('  5. Call API endpoints with Firebase ID token');
        console.log('');
        console.log('🔧 Firebase Config: GET /api/auth/config');
        console.log('');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

startServer();
