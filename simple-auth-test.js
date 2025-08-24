/**
 * SIMPLE AUTHENTICATION TEST - NO EXTERNAL DEPENDENCIES
 * ====================================================
 * 
 * This script tests the authentication system without requiring axios.
 * Uses Node.js built-in http module.
 */

const http = require('http');
const https = require('https');

class SimpleAuthTester {
    constructor(baseUrl = 'http://localhost:3001') {
        this.baseUrl = baseUrl;
        this.testUser = {
            email: 'testuser@projectecho.com',
            password: 'TestPassword123!',
            name: 'Test User',
            goals: ['productive', 'organized']
        };
    }

    makeRequest(path, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.baseUrl + path);
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (data) {
                const postData = JSON.stringify(data);
                options.headers['Content-Length'] = Buffer.byteLength(postData);
            }

            const protocol = url.protocol === 'https:' ? https : http;
            const req = protocol.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    try {
                        const jsonBody = body ? JSON.parse(body) : {};
                        resolve({
                            statusCode: res.statusCode,
                            data: jsonBody
                        });
                    } catch (e) {
                        resolve({
                            statusCode: res.statusCode,
                            data: { error: body }
                        });
                    }
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    async testServerConnection() {
        console.log('\n🧪 Testing Server Connection...');
        console.log('================================');
        
        try {
            const response = await this.makeRequest('/api/auth/config');
            
            if (response.statusCode === 200) {
                console.log('✅ Server is running and accessible');
                console.log('Firebase Project ID:', response.data.firebaseConfig?.projectId || 'Not configured');
                return true;
            } else {
                console.log('⚠️  Server responded with status:', response.statusCode);
                return false;
            }
        } catch (error) {
            console.error('❌ Cannot connect to server:', error.message);
            console.log('💡 Make sure the server is running with: npm start');
            console.log('💡 Expected server URL:', this.baseUrl);
            return false;
        }
    }

    async testRegistration() {
        console.log('\n🧪 Testing User Registration...');
        console.log('================================');
        
        try {
            const response = await this.makeRequest('/api/auth/register', 'POST', this.testUser);
            
            if (response.statusCode === 201) {
                console.log('✅ Registration successful!');
                console.log('User ID:', response.data.user?.uid);
                console.log('Email:', response.data.user?.email);
                console.log('Name:', response.data.user?.name);
                return response.data.user;
            } else if (response.statusCode === 400 && response.data.error?.includes('already exists')) {
                console.log('⚠️  User already exists - this is expected if running multiple tests');
                return { uid: 'existing-user', email: this.testUser.email };
            } else {
                console.error('❌ Registration failed:', response.data);
                return null;
            }
        } catch (error) {
            console.error('❌ Registration error:', error.message);
            return null;
        }
    }

    async testCustomLogin() {
        console.log('\n🧪 Testing Custom Login...');
        console.log('===========================');
        
        try {
            const loginData = {
                email: this.testUser.email,
                password: this.testUser.password
            };
            
            const response = await this.makeRequest('/api/auth/custom-login', 'POST', loginData);
            
            if (response.statusCode === 200) {
                console.log('✅ Login successful!');
                console.log('User ID:', response.data.user?.uid);
                console.log('Email:', response.data.user?.email);
                console.log('Name:', response.data.user?.name);
                return response.data.user;
            } else {
                console.error('❌ Login failed:', response.data);
                return null;
            }
        } catch (error) {
            console.error('❌ Login error:', error.message);
            return null;
        }
    }

    async showInstructions() {
        console.log('\n📚 AUTHENTICATION SYSTEM SETUP');
        console.log('===============================');
        
        console.log('\n1. Make sure your Firebase server is running:');
        console.log('   cd server');
        console.log('   npm install');
        console.log('   npm start');
        
        console.log('\n2. Your Firebase project configuration:');
        console.log('   Project ID: projectecho-791fb');
        console.log('   Console: https://console.firebase.google.com/project/projectecho-791fb');
        console.log('   Firestore: https://console.firebase.google.com/project/projectecho-791fb/firestore');
        
        console.log('\n3. Expected Firestore collections:');
        console.log('   - UserLOGININFORMATION (login credentials)');
        console.log('   - users/{userId} (user profiles)');
        console.log('   - users/{userId}/tasks (user tasks)');
        console.log('   - users/{userId}/plants (user plants)');
        
        console.log('\n4. API endpoints available:');
        console.log('   POST /api/auth/register - Create new account');
        console.log('   POST /api/auth/custom-login - Login with saved credentials');
        console.log('   GET /api/auth/config - Get Firebase configuration');
        
        console.log('\n5. Test the system manually:');
        console.log('   # Register a new user');
        console.log('   curl -X POST http://localhost:3001/api/auth/register \\');
        console.log('     -H "Content-Type: application/json" \\');
        console.log('     -d \'{"email":"test@example.com","password":"Test123!","name":"Test User"}\'');
        
        console.log('\n   # Login with the user');
        console.log('   curl -X POST http://localhost:3001/api/auth/custom-login \\');
        console.log('     -H "Content-Type: application/json" \\');
        console.log('     -d \'{"email":"test@example.com","password":"Test123!"}\'');
    }

    async runTests() {
        console.log('🚀 PROJECT ECHO V2 - SIMPLE AUTHENTICATION TEST');
        console.log('================================================');
        console.log(`Testing against: ${this.baseUrl}`);
        console.log(`Test user: ${this.testUser.email}`);
        
        // Test 1: Server Connection
        const serverRunning = await this.testServerConnection();
        
        if (!serverRunning) {
            await this.showInstructions();
            return;
        }
        
        // Test 2: Registration
        const registeredUser = await this.testRegistration();
        
        // Wait a moment for Firestore to process
        if (registeredUser) {
            console.log('\n⏳ Waiting for Firestore to process...');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Test 3: Login
        const loggedInUser = await this.testCustomLogin();
        
        // Summary
        console.log('\n📋 TEST RESULTS SUMMARY');
        console.log('=======================');
        console.log(`✅ Server Connection: ${serverRunning ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Registration: ${registeredUser ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Login: ${loggedInUser ? 'PASS' : 'FAIL'}`);
        
        if (serverRunning && registeredUser && loggedInUser) {
            console.log('\n🎉 ALL TESTS PASSED!');
            console.log('✨ Your authentication system is working correctly!');
            console.log('🔥 Users can now register and login using UserLOGININFORMATION collection');
            
            console.log('\n🔍 Check your Firestore database:');
            console.log('   https://console.firebase.google.com/project/projectecho-791fb/firestore');
            console.log('   Look for the UserLOGININFORMATION collection with your test user');
        } else {
            console.log('\n⚠️  SOME TESTS FAILED');
            await this.showInstructions();
        }
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const tester = new SimpleAuthTester();
    tester.runTests().catch(error => {
        console.error('\n💥 TEST FAILED:', error.message);
        process.exit(1);
    });
}

module.exports = SimpleAuthTester;
