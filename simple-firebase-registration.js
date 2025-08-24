const admin = require('firebase-admin');

// Initialize Firebase Admin SDK directly
const serviceAccount = require('./server/config/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'projectecho-791fb',
  databaseURL: 'https://projectecho-791fb-default-rtdb.firebaseio.com'
});

const db = admin.firestore();
const auth = admin.auth();

// Test user data
const testUsers = [
  {
    email: 'testuser1@projectecho.com',
    password: 'testpassword123',
    displayName: 'Test User 1',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '+1234567890'
  },
  {
    email: 'testuser2@projectecho.com',
    password: 'testpassword123',
    displayName: 'Test User 2',
    firstName: 'Jane',
    lastName: 'Doe',
    phoneNumber: '+1987654321'
  }
];

async function registerUser(userData) {
  try {
    console.log(`\n🔐 Creating user: ${userData.email}`);
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      emailVerified: false
    });

    console.log(`✅ User created in Auth: ${userRecord.uid}`);

    // Prepare user data for Firestore
    const userInfo = {
      uid: userRecord.uid,
      email: userData.email,
      displayName: userData.displayName,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      phoneNumber: userData.phoneNumber || '',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      isActive: true,
      registrationSource: 'direct-script'
    };

    // Store in Firestore with UID as document ID
    await db.collection('UserLOGININFORMATION')
      .doc(userRecord.uid)
      .set(userInfo);

    console.log(`✅ User data stored in Firestore: ${userRecord.uid}`);
    
    return {
      success: true,
      uid: userRecord.uid,
      email: userRecord.email
    };

  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function listAllUsers() {
  try {
    console.log('\n📋 Listing all users in collection...');
    
    const usersSnapshot = await db.collection('UserLOGININFORMATION').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Found ${users.length} users in collection:`);
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.displayName}) - UID: ${user.uid}`);
    });
    
    return users;
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 Simple Firebase User Registration');
  console.log('=====================================\n');

  // Register test users
  for (const userData of testUsers) {
    const result = await registerUser(userData);
    if (result.success) {
      console.log(`🎉 Successfully registered: ${result.email}`);
    } else {
      console.log(`❌ Failed to register: ${userData.email}`);
    }
  }

  // List all users
  await listAllUsers();

  console.log('\n🌐 View your data in Firebase Console:');
  console.log('   Authentication: https://console.firebase.google.com/project/projectecho-791fb/authentication/users');
  console.log('   Firestore: https://console.firebase.google.com/project/projectecho-791fb/firestore/data');
  console.log('\n✅ Registration complete!');
}

// Run the script
main().catch(console.error);
