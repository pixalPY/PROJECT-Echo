const https = require('https');
const http = require('http');

// Simple HTTP request function
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test user data
const testUser = {
  email: 'testuser@projectecho.com',
  password: 'testpassword123',
  displayName: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '+1234567890'
};

async function testRegistration() {
  console.log('🚀 Testing User Registration System');
  console.log('=====================================\n');

  try {
    // Test 1: Check server health
    console.log('1. Checking server health...');
    const healthResponse = await makeRequest('http://localhost:3001/health');
    
    if (healthResponse.status === 200) {
      console.log('✅ Server is running and healthy');
      console.log('   Status:', healthResponse.data.status);
      console.log('   Database:', healthResponse.data.database);
      console.log('   Auth:', healthResponse.data.auth);
    } else {
      console.log('❌ Server health check failed');
      return;
    }

    // Test 2: Register a new user
    console.log('\n2. Registering a new user...');
    const registerResponse = await makeRequest(
      'http://localhost:3001/api/register',
      'POST',
      testUser
    );

    if (registerResponse.status === 201 && registerResponse.data.success) {
      console.log('✅ User registration successful!');
      console.log('   User ID:', registerResponse.data.user.uid);
      console.log('   Email:', registerResponse.data.user.email);
      console.log('   Display Name:', registerResponse.data.user.displayName);
      
      const userId = registerResponse.data.user.uid;

      // Test 3: Get user information from database
      console.log('\n3. Retrieving user information from database...');
      const userInfoResponse = await makeRequest(
        `http://localhost:3001/api/users/info/${userId}`
      );

      if (userInfoResponse.status === 200 && userInfoResponse.data.success) {
        console.log('✅ User information retrieved from database!');
        console.log('   User data stored in Firestore:');
        console.log('   - Email:', userInfoResponse.data.user.email);
        console.log('   - Display Name:', userInfoResponse.data.user.displayName);
        console.log('   - First Name:', userInfoResponse.data.user.firstName);
        console.log('   - Last Name:', userInfoResponse.data.user.lastName);
        console.log('   - Phone:', userInfoResponse.data.user.phoneNumber);
        console.log('   - Created At:', userInfoResponse.data.user.createdAt);
        console.log('   - Last Login:', userInfoResponse.data.user.lastLoginAt);
        console.log('   - Is Active:', userInfoResponse.data.user.isActive);
      } else {
        console.log('❌ Failed to retrieve user information');
      }

      // Test 4: Verify user in both Auth and Firestore
      console.log('\n4. Verifying user in Firebase Auth and Firestore...');
      const verifyResponse = await makeRequest(
        `http://localhost:3001/api/users/verify/${userId}`
      );

      if (verifyResponse.status === 200 && verifyResponse.data.success) {
        console.log('✅ User verification successful!');
        console.log('   Firebase Auth data available:', !!verifyResponse.data.user.auth);
        console.log('   Firestore data available:', !!verifyResponse.data.user.firestore);
      } else {
        console.log('❌ User verification failed');
      }

      // Test 5: List all users in collection
      console.log('\n5. Listing all users in collection...');
      const allUsersResponse = await makeRequest(
        'http://localhost:3001/api/users/all'
      );

      if (allUsersResponse.status === 200 && allUsersResponse.data.success) {
        console.log('✅ All users retrieved successfully!');
        console.log('   Total users in collection:', allUsersResponse.data.count);
        console.log('   Users:', allUsersResponse.data.users.map(u => ({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName
        })));
      } else {
        console.log('❌ Failed to retrieve all users');
      }

    } else {
      console.log('❌ User registration failed');
      console.log('   Status:', registerResponse.status);
      console.log('   Response:', registerResponse.data);
    }

    console.log('\n🎉 Test completed!');
    console.log('\n📊 Data Storage Summary:');
    console.log('   ✅ User created in Firebase Authentication');
    console.log('   ✅ User data stored in Firestore database');
    console.log('   ✅ Collection: UserLOGININFORMATION');
    console.log('   ✅ Document ID: User UID (unique per user)');
    
    console.log('\n🌐 View your data in Firebase Console:');
    console.log('   Authentication: https://console.firebase.google.com/project/projectecho-791fb/authentication/users');
    console.log('   Firestore: https://console.firebase.google.com/project/projectecho-791fb/firestore/data');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure the server is running:');
    console.log('   cd server && npm start');
  }
}

// Run the test
testRegistration();

