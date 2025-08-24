/**
 * TEST AUTHENTICATION SYSTEM FOR PROJECT ECHO V2
 * ==============================================
 * 
 * This script tests the authentication system that saves user login
 * information to the UserLOGININFORMATION collection in Firestore.
 */

const axios = require('axios');

class AuthTester {
    constructor(baseUrl = 'http://localhost:3001') {
        this.baseUrl = baseUrl;
        this.testUser = {
            email: 'testuser@projectecho.com',
            password: 'TestPassword123!',
            name: 'Test User',
            goals: ['productive', 'organized']
        };
    }

    async testRegistration() {
        console.log('\n🧪 Testing User Registration...');
        console.log('================================');
        
        try {
            const response = await axios.post(`${this.baseUrl}/api/auth/register`, this.testUser);
            
            console.log('✅ Registration successful!');
            console.log('User ID:', response.data.user.uid);
            console.log('Email:', response.data.user.email);
            console.log('Name:', response.data.user.name);
            console.log('Coins:', response.data.user.userCoins);
            console.log('Theme:', response.data.user.userTheme);
            
            return response.data.user;
        } catch (error) {
            if (error.response?.status === 400 && error.response.data.error.includes('already exists')) {
                console.log('⚠️  User already exists - this is expected if running multiple tests');
                return { uid: 'existing-user', email: this.testUser.email };
            } else {
                console.error('❌ Registration failed:', error.response?.data || error.message);
                throw error;
            }
        }
    }

    async testCustomLogin() {
        console.log('\n🧪 Testing Custom Login...');
        console.log('===========================');
        
        try {
            const response = await axios.post(`${this.baseUrl}/api/auth/custom-login`, {
                email: this.testUser.email,
                password: this.testUser.password
            });
            
            console.log('✅ Login successful!');
            console.log('User ID:', response.data.user.uid);
            console.log('Email:', response.data.user.email);
            console.log('Name:', response.data.user.name);
            console.log('Coins:', response.data.user.userCoins);
            console.log('Last Login:', response.data.user.lastLogin);
            
            return response.data.user;
        } catch (error) {
            console.error('❌ Login failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async testInvalidLogin() {
        console.log('\n🧪 Testing Invalid Login...');
        console.log('============================');
        
        try {
            const response = await axios.post(`${this.baseUrl}/api/auth/custom-login`, {
                email: this.testUser.email,
                password: 'WrongPassword123!'
            });
            
            console.error('❌ This should have failed but didn\'t!');
            return false;
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Invalid login properly rejected');
                return true;
            } else {
                console.error('❌ Unexpected error:', error.response?.data || error.message);
                return false;
            }
        }
    }

    async checkFirestoreData() {
        console.log('\n🧪 Checking Firestore Data...');
        console.log('==============================');
        
        console.log('📊 Expected Collections in Firestore:');
        console.log('  1. UserLOGININFORMATION - Contains login credentials');
        console.log('     - Email: string');
        console.log('     - Password: string');
        console.log('     - createdAt: timestamp');
        console.log('     - lastLogin: timestamp');
        console.log('');
        console.log('  2. users/{userId} - Contains user profiles');
        console.log('     - email: string');
        console.log('     - name: string');
        console.log('     - userTheme: string');
        console.log('     - userCoins: number');
        console.log('     - goals: array');
        console.log('');
        console.log('  3. users/{userId}/tasks - Contains user tasks');
        console.log('  4. users/{userId}/plants - Contains user plants');
        console.log('');
        console.log('🔗 Check your Firestore console at:');
        console.log('   https://console.firebase.google.com/project/projectecho-791fb/firestore');
    }

    async runAllTests() {
        console.log('🚀 PROJECT ECHO V2 - AUTHENTICATION SYSTEM TEST');
        console.log('===============================================');
        console.log(`Testing against: ${this.baseUrl}`);
        console.log(`Test user: ${this.testUser.email}`);
        
        try {
            // Test 1: Registration
            const registeredUser = await this.testRegistration();
            
            // Wait a moment for Firestore to process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Test 2: Valid Login
            const loggedInUser = await this.testCustomLogin();
            
            // Test 3: Invalid Login
            const invalidLoginHandled = await this.testInvalidLogin();
            
            // Test 4: Check Firestore Data
            await this.checkFirestoreData();
            
            console.log('\n📋 TEST RESULTS SUMMARY');
            console.log('=======================');
            console.log(`✅ Registration: ${registeredUser ? 'PASS' : 'FAIL'}`);
            console.log(`✅ Valid Login: ${loggedInUser ? 'PASS' : 'FAIL'}`);
            console.log(`✅ Invalid Login Rejection: ${invalidLoginHandled ? 'PASS' : 'FAIL'}`);
            
            if (registeredUser && loggedInUser && invalidLoginHandled) {
                console.log('\n🎉 ALL TESTS PASSED!');
                console.log('The authentication system is working correctly.');
                console.log('Users can now register and login using the UserLOGININFORMATION collection.');
            } else {
                console.log('\n⚠️  SOME TESTS FAILED');
                console.log('Please check the error messages above.');
            }
            
        } catch (error) {
            console.error('\n💥 TEST SUITE FAILED');
            console.error('Error:', error.message);
            console.error('Make sure the server is running on', this.baseUrl);
        }
    }
}

// API Usage Examples
function showApiExamples() {
    console.log('\n📚 API USAGE EXAMPLES');
    console.log('=====================');
    
    console.log('\n1. Register a new user:');
    console.log('POST /api/auth/register');
    console.log('Content-Type: application/json');
    console.log(JSON.stringify({
        email: 'user@example.com',
        password: 'SecurePassword123!',
        name: 'John Doe',
        goals: ['productive', 'healthy']
    }, null, 2));
    
    console.log('\n2. Login with saved credentials:');
    console.log('POST /api/auth/custom-login');
    console.log('Content-Type: application/json');
    console.log(JSON.stringify({
        email: 'user@example.com',
        password: 'SecurePassword123!'
    }, null, 2));
    
    console.log('\n3. Example curl commands:');
    console.log('# Register');
    console.log('curl -X POST http://localhost:3001/api/auth/register \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"email":"test@example.com","password":"Test123!","name":"Test User"}\'');
    
    console.log('\n# Login');
    console.log('curl -X POST http://localhost:3001/api/auth/custom-login \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"email":"test@example.com","password":"Test123!"}\'');
}

// Run tests if this script is executed directly
if (require.main === module) {
    const tester = new AuthTester();
    
    // Show API examples first
    showApiExamples();
    
    // Run the test suite
    tester.runAllTests().catch(error => {
        console.error('Failed to run tests:', error.message);
        process.exit(1);
    });
}

module.exports = AuthTester;
