# DATABASE TESTING GUIDE - PROJECT ECHO V2
## Firebase Project: projectecho-791fb

## 🎯 Quick Database Test Methods

### Method 1: Direct Firestore Console (Easiest)
1. **Open Firestore Console**:
   - Go to: https://console.firebase.google.com/project/projectecho-791fb/firestore
   - Login with your Google account

2. **Check Collections**:
   - Look for `UserLOGININFORMATION` collection
   - Look for `users` collection
   - Check if data exists from your test signup

3. **Manual Test Data Entry**:
   - Click "Start collection" if no collections exist
   - Create `UserLOGININFORMATION` collection
   - Add a document with fields:
     - `Email`: "test@example.com"
     - `Password`: "TestPass123!"
     - `createdAt`: (timestamp)

### Method 2: Server API Testing (Recommended)
1. **First, set up server configuration**:
   ```bash
   # Copy environment template
   copy server\env.example server\.env
   
   # Edit server\.env with your real Firebase config values
   ```

2. **Get Firebase Config**:
   - Go to: https://console.firebase.google.com/project/projectecho-791fb/settings/general
   - Scroll to "Your apps" section
   - Click on web app (or create one)
   - Copy the config values

3. **Start the server**:
   ```bash
   cd server
   npm install
   npm start
   ```

4. **Test registration endpoint**:
   ```bash
   curl -X POST http://localhost:3001/api/auth/register ^
     -H "Content-Type: application/json" ^
     -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"name\":\"Test User\"}"
   ```

5. **Test login endpoint**:
   ```bash
   curl -X POST http://localhost:3001/api/auth/custom-login ^
     -H "Content-Type: application/json" ^
     -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}"
   ```

### Method 3: Use Test Scripts
1. **Simple test (no dependencies)**:
   ```bash
   node simple-auth-test.js
   ```

2. **Advanced test (requires axios)**:
   ```bash
   npm install axios
   node test-auth-system.js
   ```

## 🔧 Troubleshooting Steps

### If signup didn't save to UserLOGININFORMATION:

1. **Check server logs**:
   - Look for error messages when starting server
   - Check for Firebase connection errors

2. **Verify Firebase config**:
   - Ensure server/.env has real values (not placeholders)
   - Check FIREBASE_PROJECT_ID = "projectecho-791fb"

3. **Check Firestore rules**:
   - Go to: https://console.firebase.google.com/project/projectecho-791fb/firestore/rules
   - Ensure rules allow writes to UserLOGININFORMATION

4. **Test Firebase connection**:
   ```javascript
   // Test script to check Firebase connection
   const { getAdminFirestore } = require('./server/config/firebase');
   const db = getAdminFirestore();
   
   // Try to read from Firestore
   db.collection('UserLOGININFORMATION').limit(1).get()
     .then(() => console.log('✅ Firebase connected'))
     .catch(err => console.log('❌ Firebase error:', err.message));
   ```

## 📊 Expected Database Structure

After successful signup, you should see:

### UserLOGININFORMATION Collection:
```
UserLOGININFORMATION/
├── {auto-generated-id}/
│   ├── Email: "test@example.com"
│   ├── Password: "Test123!"
│   ├── createdAt: 2024-01-15T10:30:00Z
│   └── lastLogin: null
```

### users Collection:
```
users/
├── {firebase-user-id}/
│   ├── email: "test@example.com"
│   ├── name: "Test User"
│   ├── userTheme: "default"
│   ├── userCoins: 10
│   ├── goals: []
│   ├── createdAt: 2024-01-15T10:30:00Z
│   └── updatedAt: 2024-01-15T10:30:00Z
```

### users/{userId}/plants Collection:
```
users/{userId}/plants/
├── {plant-id}/
│   ├── name: "My First Plant"
│   ├── tasksCompleted: 0
│   ├── createdAt: 2024-01-15T10:30:00Z
│   └── updatedAt: 2024-01-15T10:30:00Z
```

## 🚨 Common Issues & Solutions

### Issue: "Cannot connect to server"
**Solution**: 
- Make sure server is running: `cd server && npm start`
- Check port 3001 is not blocked
- Verify server/.env file exists and is configured

### Issue: "Firebase not initialized"
**Solution**:
- Check server/.env has real Firebase config values
- Verify FIREBASE_PROJECT_ID = "projectecho-791fb"
- Ensure Firebase project exists and is accessible

### Issue: "Permission denied"
**Solution**:
- Check Firestore security rules
- Ensure rules allow read/write to UserLOGININFORMATION
- Verify Firebase Authentication is enabled

### Issue: "User created but not in UserLOGININFORMATION"
**Solution**:
- Check server logs for errors in saveLoginInformation()
- Verify firebaseService.js is properly calling saveLoginInformation()
- Check if there are any async/await issues

## 🎯 Quick Test Commands

```bash
# 1. Check if server is configured
node check-config.js

# 2. Start server (in server directory)
cd server && npm start

# 3. Test registration (in new terminal)
curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"name\":\"Test User\"}"

# 4. Check Firestore console
# Go to: https://console.firebase.google.com/project/projectecho-791fb/firestore

# 5. Test login
curl -X POST http://localhost:3001/api/auth/custom-login -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}"
```

## 📱 Manual Testing in Browser

If you have a frontend, you can also test by:
1. Opening the signup form
2. Creating a test account
3. Checking Firestore console immediately after
4. Trying to login with the same credentials

---

**Next Step**: Choose one of the testing methods above and let me know what results you get!
