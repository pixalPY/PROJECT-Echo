/**
 * IMMEDIATE DATABASE TEST
 * ======================
 * Tests your database connection and setup
 */

const fs = require('fs');
const path = require('path');

console.log('🔥 PROJECT ECHO V2 - DATABASE TEST');
console.log('==================================');

// Step 1: Check basic setup
console.log('\n📋 Step 1: Configuration Check');
const envPath = path.join(__dirname, 'server', '.env');
const hasEnv = fs.existsSync(envPath);

console.log(`✅ Server directory exists: ${fs.existsSync('server')}`);
console.log(`${hasEnv ? '✅' : '❌'} .env file exists: ${hasEnv}`);

if (!hasEnv) {
    console.log('\n🚨 SETUP REQUIRED:');
    console.log('1. Copy server\\env.example to server\\.env');
    console.log('2. Get Firebase config from: https://console.firebase.google.com/project/projectecho-791fb/settings/general');
    console.log('3. Replace placeholder values in server\\.env');
    console.log('\nAfter setup, run this test again.');
    process.exit(1);
}

// Step 2: Check if server dependencies are installed
console.log('\n📦 Step 2: Dependencies Check');
const nodeModulesPath = path.join(__dirname, 'server', 'node_modules');
const hasNodeModules = fs.existsSync(nodeModulesPath);
console.log(`${hasNodeModules ? '✅' : '❌'} Server dependencies installed: ${hasNodeModules}`);

if (!hasNodeModules) {
    console.log('\n🔧 RUN THIS COMMAND:');
    console.log('cd server && npm install');
    console.log('\nThen run this test again.');
    process.exit(1);
}

// Step 3: Test Firebase connection
console.log('\n🔥 Step 3: Firebase Connection Test');
try {
    // Load environment variables
    require('dotenv').config({ path: envPath });
    
    const projectId = process.env.FIREBASE_PROJECT_ID;
    console.log(`Project ID: ${projectId}`);
    
    if (projectId === 'projectecho-791fb') {
        console.log('✅ Correct project ID configured');
    } else if (projectId && !projectId.includes('your-')) {
        console.log(`⚠️  Project ID is: ${projectId} (expected: projectecho-791fb)`);
    } else {
        console.log('❌ Project ID not configured properly');
        throw new Error('Firebase not configured');
    }
    
    // Try to initialize Firebase
    const { getAdminFirestore } = require('./server/config/firebase');
    const db = getAdminFirestore();
    console.log('✅ Firebase Admin SDK initialized');
    
    // Test UserLOGININFORMATION collection access
    console.log('\n📊 Step 4: UserLOGININFORMATION Collection Test');
    
    db.collection('UserLOGININFORMATION').limit(1).get()
        .then(snapshot => {
            console.log(`✅ UserLOGININFORMATION collection accessible`);
            console.log(`📄 Documents found: ${snapshot.size}`);
            
            if (snapshot.size > 0) {
                console.log('\n🎉 SUCCESS: Database is working!');
                console.log('Your UserLOGININFORMATION collection has data.');
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    console.log(`   User: ${data.Email || 'No email'}`);
                    console.log(`   Created: ${data.createdAt ? data.createdAt.toDate() : 'No date'}`);
                });
            } else {
                console.log('\n📝 Collection is empty (this is normal for new projects)');
                console.log('Ready to test user registration!');
            }
            
            console.log('\n🧪 NEXT STEPS:');
            console.log('1. Start server: cd server && npm start');
            console.log('2. Test registration with curl or Postman');
            console.log('3. Check Firestore console: https://console.firebase.google.com/project/projectecho-791fb/firestore');
            
        })
        .catch(error => {
            console.log('❌ UserLOGININFORMATION collection access failed');
            console.log('Error:', error.message);
            
            if (error.message.includes('permission-denied')) {
                console.log('\n🔒 FIRESTORE RULES ISSUE:');
                console.log('1. Go to: https://console.firebase.google.com/project/projectecho-791fb/firestore/rules');
                console.log('2. Make sure rules allow read/write access');
                console.log('3. For testing, you can use:');
                console.log('   rules_version = "2";');
                console.log('   service cloud.firestore {');
                console.log('     match /databases/{database}/documents {');
                console.log('       match /{document=**} {');
                console.log('         allow read, write: if true;');
                console.log('       }');
                console.log('     }');
                console.log('   }');
            }
        });
        
} catch (error) {
    console.log('❌ Firebase initialization failed');
    console.log('Error:', error.message);
    
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Check server/.env has real Firebase values');
    console.log('2. Verify Firebase project exists: https://console.firebase.google.com/project/projectecho-791fb');
    console.log('3. Make sure Firestore is enabled in your project');
}

console.log('\n🔗 HELPFUL LINKS:');
console.log('Firebase Console: https://console.firebase.google.com/project/projectecho-791fb');
console.log('Firestore Database: https://console.firebase.google.com/project/projectecho-791fb/firestore');
console.log('Project Settings: https://console.firebase.google.com/project/projectecho-791fb/settings/general');
