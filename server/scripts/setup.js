#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up PROJECT:Echo Backend...\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

if (majorVersion < 14) {
  console.error('❌ Node.js version 14 or higher is required');
  console.error(`   Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from env.example');
    console.log('⚠️  Please edit .env file with your configuration');
  } else {
    // Create basic .env file
    const defaultEnv = `NODE_ENV=development
PORT=3001
DB_PATH=./database/project_echo.db
JWT_SECRET=${generateRandomSecret()}
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_SALT_ROUNDS=12
`;
    fs.writeFileSync(envPath, defaultEnv);
    console.log('✅ Created .env file with default configuration');
  }
} else {
  console.log('✅ .env file already exists');
}

// Create database directory
const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('✅ Created database directory');
}

// Install dependencies if node_modules doesn't exist
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    console.error('   Please run "npm install" manually');
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed');
}

// Initialize database
console.log('🗄️  Initializing database...');
try {
  const initDatabase = require('./initDatabase');
  initDatabase().then(() => {
    console.log('✅ Database initialized successfully');
    
    console.log('\n🎉 Setup completed successfully!\n');
    console.log('📋 Next steps:');
    console.log('   1. Review and edit .env file if needed');
    console.log('   2. Run "npm run dev" to start development server');
    console.log('   3. Run "npm start" for production');
    console.log('\n🧪 Test credentials:');
    console.log('   Email: test@test.com');
    console.log('   Password: test');
    console.log('\n📚 API Documentation: http://localhost:3001/api');
    console.log('🏥 Health Check: http://localhost:3001/health');
  }).catch(error => {
    console.error('❌ Failed to initialize database:', error.message);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Failed to initialize database:', error.message);
  process.exit(1);
}

function generateRandomSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
