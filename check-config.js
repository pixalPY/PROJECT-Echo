/**
 * SIMPLE FIREBASE CONFIG CHECK
 * ============================
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 FIREBASE CONFIGURATION CHECK');
console.log('===============================');

const envPath = path.join(__dirname, 'server', '.env');

if (!fs.existsSync(envPath)) {
    console.log('\n❌ PROBLEM FOUND: server/.env file is missing!');
    console.log('\n🔧 SOLUTION:');
    console.log('1. Copy the example file:');
    console.log('   copy server\\env.example server\\.env');
    console.log('\n2. Get your Firebase config from:');
    console.log('   https://console.firebase.google.com/project/projectecho-791fb/settings/general');
    console.log('\n3. Replace the placeholder values in server/.env with your real Firebase config');
    console.log('\n4. Look for "Your apps" section and click on your web app');
    console.log('   Copy the config values to server/.env');
    
} else {
    console.log('✅ server/.env file exists');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasPlaceholders = envContent.includes('your-firebase-api-key') || 
                           envContent.includes('your-sender-id') ||
                           envContent.includes('your-app-id');
    
    if (hasPlaceholders) {
        console.log('⚠️  .env file contains placeholder values');
        console.log('Please replace with your actual Firebase configuration');
    } else {
        console.log('✅ .env file appears to be configured');
    }
}

console.log('\n📋 Next Steps:');
console.log('1. Configure server/.env with real Firebase values');
console.log('2. Start server: cd server && npm start');
console.log('3. Test signup: node simple-auth-test.js');
