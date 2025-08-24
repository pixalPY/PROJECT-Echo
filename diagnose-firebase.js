/**
 * FIREBASE CONFIGURATION DIAGNOSTICS
 * ==================================
 * 
 * This script helps diagnose Firebase configuration issues
 */

console.log('🔍 FIREBASE CONFIGURATION DIAGNOSTICS');
console.log('=====================================');

// Check if .env file exists
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'server', '.env');
const envExamplePath = path.join(__dirname, 'server', 'env.example');

console.log('\n📁 Environment File Check:');
console.log(`  .env file exists: ${fs.existsSync(envPath) ? '✅ YES' : '❌ NO'}`);
console.log(`  env.example exists: ${fs.existsSync(envExamplePath) ? '✅ YES' : '❌ NO'}`);

if (!fs.existsSync(envPath)) {
    console.log('\n🚨 PROBLEM FOUND: Missing .env file!');
    console.log('The server cannot connect to Firebase without proper configuration.');
    
    console.log('\n🔧 SOLUTION STEPS:');
    console.log('1. Go to Firebase Console:');
    console.log('   https://console.firebase.google.com/project/projectecho-791fb');
    
    console.log('\n2. Get your Firebase configuration:');
    console.log('   - Click the gear icon (Project Settings)');
    console.log('   - Scroll down to "Your apps"');
    console.log('   - Click on your web app or create one');
    console.log('   - Copy the Firebase config object');
    
    console.log('\n3. Create server/.env file with this template:');
    console.log('   Copy server/env.example to server/.env');
    console.log('   Replace the placeholder values with your actual Firebase config');
    
    console.log('\n4. Required Firebase config values:');
    console.log('   - FIREBASE_API_KEY');
    console.log('   - FIREBASE_AUTH_DOMAIN');
    console.log('   - FIREBASE_PROJECT_ID (should be: projectecho-791fb)');
    console.log('   - FIREBASE_STORAGE_BUCKET');
    console.log('   - FIREBASE_MESSAGING_SENDER_ID');
    console.log('   - FIREBASE_APP_ID');
    console.log('   - FIREBASE_MEASUREMENT_ID');
    
    console.log('\n📋 Quick Fix Command:');
    console.log('   Copy the example file: copy server\\env.example server\\.env');
    console.log('   Then edit server\\.env with your real Firebase values');
    
} else {
    console.log('\n✅ .env file exists, checking configuration...');
    
    // Load environment variables
    require('dotenv').config({ path: envPath });
    
    const requiredVars = [
        'FIREBASE_API_KEY',
        'FIREBASE_AUTH_DOMAIN', 
        'FIREBASE_PROJECT_ID',
        'FIREBASE_STORAGE_BUCKET',
        'FIREBASE_MESSAGING_SENDER_ID',
        'FIREBASE_APP_ID'
    ];
    
    console.log('\n🔑 Environment Variables Check:');
    let allConfigured = true;
    
    requiredVars.forEach(varName => {
        const value = process.env[varName];
        const isConfigured = value && !value.includes('your-') && !value.includes('...');
        console.log(`  ${varName}: ${isConfigured ? '✅ Configured' : '❌ Missing/Placeholder'}`);
        if (!isConfigured) allConfigured = false;
    });
    
    if (allConfigured) {
        console.log('\n✅ All Firebase configuration looks good!');
        console.log(`   Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
        
        // Test Firebase connection
        console.log('\n🧪 Testing Firebase Connection...');
        try {
            const { getAdminFirestore } = require('./server/config/firebase');
            const db = getAdminFirestore();
            console.log('✅ Firebase Admin SDK initialized successfully');
            
            // Test write to UserLOGININFORMATION collection
            console.log('\n🔥 Testing UserLOGININFORMATION collection access...');
            db.collection('UserLOGININFORMATION').limit(1).get()
                .then(() => {
                    console.log('✅ UserLOGININFORMATION collection accessible');
                })
                .catch(error => {
                    console.log('❌ UserLOGININFORMATION collection access failed:', error.message);
                });
                
        } catch (error) {
            console.log('❌ Firebase connection failed:', error.message);
        }
        
    } else {
        console.log('\n🚨 PROBLEM: Firebase configuration incomplete');
        console.log('Please update server/.env with your actual Firebase values');
    }
}

console.log('\n🔗 Helpful Links:');
console.log('  Firebase Console: https://console.firebase.google.com/project/projectecho-791fb');
console.log('  Firestore Database: https://console.firebase.google.com/project/projectecho-791fb/firestore');
console.log('  Project Settings: https://console.firebase.google.com/project/projectecho-791fb/settings/general');

console.log('\n💡 After fixing configuration, test with:');
console.log('  cd server && npm start');
console.log('  Then: node simple-auth-test.js');
