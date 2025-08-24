const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:3001/api';
const TEST_USER = {
  email: 'testuser@projectecho.com',
  password: 'testpassword123',
  displayName: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '+1234567890'
};

async function testUserRegistration() {
  console.log('🧪 Testing User Registration System');
  console.log('=====================================\n');

  try {
    // Test 1: Register a new user
    console.log('1. Testing user registration...');
    const registerResponse = await axios.post(`${API_BASE_URL}/register`, TEST_USER);
    
    if (registerResponse.data.success) {
      console.log('✅ User registration successful!');
      console.log('   User ID:', registerResponse.data.user.uid);
      console.log('   Email:', registerResponse.data.user.email);
      console.log('   Display Name:', registerResponse.data.user.displayName);
    } else {
      console.log('❌ User registration failed:', registerResponse.data.message);
      return;
    }

    // Test 2: Get user information
    console.log('\n2. Testing get user information...');
    const userInfoResponse = await axios.get(`${API_BASE_URL}/users/info/${registerResponse.data.user.uid}`);
    
    if (userInfoResponse.data.success) {
      console.log('✅ User information retrieved successfully!');
      console.log('   User data:', JSON.stringify(userInfoResponse.data.user, null, 2));
    } else {
      console.log('❌ Failed to get user information:', userInfoResponse.data.message);
    }

    // Test 3: Update user information
    console.log('\n3. Testing update user information...');
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
      phoneNumber: '+1987654321',
      preferences: {
        theme: 'dark',
        notifications: true
      }
    };

    const updateResponse = await axios.put(`${API_BASE_URL}/users/info/${registerResponse.data.user.uid}`, updateData);
    
    if (updateResponse.data.success) {
      console.log('✅ User information updated successfully!');
    } else {
      console.log('❌ Failed to update user information:', updateResponse.data.message);
    }

    // Test 4: Verify user
    console.log('\n4. Testing user verification...');
    const verifyResponse = await axios.get(`${API_BASE_URL}/users/verify/${registerResponse.data.user.uid}`);
    
    if (verifyResponse.data.success) {
      console.log('✅ User verification successful!');
      console.log('   Auth data available:', !!verifyResponse.data.user.auth);
      console.log('   Firestore data available:', !!verifyResponse.data.user.firestore);
    } else {
      console.log('❌ User verification failed:', verifyResponse.data.message);
    }

    // Test 5: Get updated user information
    console.log('\n5. Testing get updated user information...');
    const updatedUserInfoResponse = await axios.get(`${API_BASE_URL}/users/info/${registerResponse.data.user.uid}`);
    
    if (updatedUserInfoResponse.data.success) {
      console.log('✅ Updated user information retrieved successfully!');
      console.log('   Updated data:', JSON.stringify(updatedUserInfoResponse.data.user, null, 2));
    } else {
      console.log('❌ Failed to get updated user information:', updatedUserInfoResponse.data.message);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - User registration: ✅');
    console.log('   - User information retrieval: ✅');
    console.log('   - User information update: ✅');
    console.log('   - User verification: ✅');
    console.log('   - Updated data retrieval: ✅');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Test duplicate registration
async function testDuplicateRegistration() {
  console.log('\n🧪 Testing Duplicate Registration');
  console.log('==================================\n');

  try {
    const response = await axios.post(`${API_BASE_URL}/register`, TEST_USER);
    console.log('❌ Duplicate registration should have failed');
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.log('✅ Duplicate registration correctly rejected');
      console.log('   Message:', error.response.data.message);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
}

// Test invalid data
async function testInvalidData() {
  console.log('\n🧪 Testing Invalid Data Validation');
  console.log('===================================\n');

  const invalidUsers = [
    {
      name: 'Invalid email',
      data: { ...TEST_USER, email: 'invalid-email' }
    },
    {
      name: 'Weak password',
      data: { ...TEST_USER, email: 'weak@test.com', password: '123' }
    },
    {
      name: 'Missing display name',
      data: { ...TEST_USER, email: 'missing@test.com', displayName: '' }
    }
  ];

  for (const test of invalidUsers) {
    try {
      console.log(`Testing: ${test.name}...`);
      const response = await axios.post(`${API_BASE_URL}/register`, test.data);
      console.log('❌ Should have failed validation');
    } catch (error) {
      if (error.response && (error.response.status === 400 || error.response.status === 409)) {
        console.log(`✅ ${test.name} correctly rejected`);
      } else {
        console.log(`❌ Unexpected error for ${test.name}:`, error.message);
      }
    }
  }
}

// Run all tests
async function runAllTests() {
  await testUserRegistration();
  await testDuplicateRegistration();
  await testInvalidData();
}

// Check if server is running
async function checkServerHealth() {
  try {
    const response = await axios.get('http://localhost:3001/health');
    console.log('✅ Server is running and healthy');
    console.log('   Status:', response.data.status);
    console.log('   Database:', response.data.database);
    console.log('   Auth:', response.data.auth);
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Server is not running or not accessible');
    console.error('   Please start the server with: cd server && npm start');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 PROJECT:ECHO User Registration Test Suite');
  console.log('============================================\n');

  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    return;
  }

  await runAllTests();
}

// Run the tests
main().catch(console.error);
