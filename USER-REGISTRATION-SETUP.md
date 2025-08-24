# PROJECT:ECHO User Registration System

This document explains how to set up and use the user registration system that connects signed-up users to your Firebase project.

## 🚀 Quick Start

### 1. Prerequisites

- Node.js installed
- Firebase project: `projectecho-791fb`
- Firebase service account credentials (already configured)

### 2. Start the Server

```bash
cd server
npm install
npm start
```

The server will start on `http://localhost:3001`

### 3. Test the System

```bash
# From the root directory
node test-user-registration.js
```

## 📁 File Structure

```
PROJECT ECHO V2/
├── server/
│   ├── config/
│   │   ├── firebase.js                           # Firebase configuration
│   │   └── firebase-service-account.json         # Service account credentials
│   ├── services/
│   │   └── userService.js                        # User management service
│   ├── routes/
│   │   └── user-registration.js                  # User registration API routes
│   └── firebase-server.js                        # Main server file
├── test-user-registration.js                     # Test suite
├── frontend-user-registration-example.js         # Frontend integration example
└── USER-REGISTRATION-SETUP.md                    # This file
```

## 🔧 Configuration

### Firebase Setup

The system is configured to use your Firebase project:
- **Project ID**: `projectecho-791fb`
- **Collection**: `UserLOGININFORMATION`
- **Document ID**: Each user gets their own document with their UID as the document ID

### Service Account

The Firebase service account credentials are stored in:
```
server/config/firebase-service-account.json
```

This file contains the necessary credentials to authenticate with Firebase Admin SDK.

## 📡 API Endpoints

### User Registration

#### POST `/api/register`
Register a new user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "displayName": "John Doe"
  }
}
```

### User Management

#### GET `/api/users/info/:uid`
Get user information from Firestore

#### PUT `/api/users/info/:uid`
Update user information

#### DELETE `/api/users/:uid`
Delete user account

#### GET `/api/users/verify/:uid`
Verify user exists and get their info

#### GET `/api/users/all`
Get all users in the collection (for admin purposes)

## 🧪 Testing

### Run the Test Suite

```bash
node test-user-registration.js
```

This will test:
- ✅ User registration
- ✅ User information retrieval
- ✅ User information updates
- ✅ User verification
- ✅ Duplicate registration handling
- ✅ Input validation

### Manual Testing with cURL

```bash
# Register a new user
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User",
    "firstName": "Test",
    "lastName": "User"
  }'

# Get user info
curl http://localhost:3001/api/users/info/USER_ID_HERE
```

## 🎨 Frontend Integration

### React Component Example

The `frontend-user-registration-example.js` file contains a complete React component for user registration.

### API Service Functions

```javascript
import { userApiService } from './frontend-user-registration-example.js';

// Register a user
const result = await userApiService.register({
  email: 'user@example.com',
  password: 'password123',
  displayName: 'John Doe'
});

// Get user info
const userInfo = await userApiService.getUserInfo(userId);

// Update user info
await userApiService.updateUserInfo(userId, {
  firstName: 'Updated',
  lastName: 'Name'
});
```

## 🔒 Security Features

### Input Validation
- Email format validation
- Password strength requirements (minimum 6 characters)
- Display name length validation
- Phone number format validation

### Error Handling
- Duplicate email detection
- Invalid input rejection
- Proper HTTP status codes
- Detailed error messages

### Firebase Security
- Service account authentication
- Secure credential storage
- Admin SDK usage for server-side operations

## 📊 Data Storage

### Firebase Authentication
Users are created in Firebase Authentication with:
- Email and password
- Display name
- Email verification status

### Firestore Database
User information is stored in the `UserLOGININFORMATION` collection:

**Document Structure:**
```json
{
  "uid": "firebase-user-id",
  "email": "user@example.com",
  "displayName": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLoginAt": "2024-01-01T00:00:00.000Z",
  "isActive": true,
  "registrationSource": "api"
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Server won't start**
   - Check if port 3001 is available
   - Verify Firebase credentials are correct
   - Check Node.js version compatibility

2. **Firebase connection errors**
   - Verify service account credentials
   - Check Firebase project ID
   - Ensure Firestore is enabled

3. **User registration fails**
   - Check email format
   - Verify password meets requirements
   - Check for duplicate emails

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
DEBUG=firebase:* npm start
```

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Logs
The server logs all operations to the console:
- ✅ Successful operations
- ❌ Error messages
- 🔍 Debug information

## 🔄 Updates and Maintenance

### Adding New Fields
1. Update the validation in `user-registration.js`
2. Modify the user service in `userService.js`
3. Update the frontend form in `frontend-user-registration-example.js`

### Database Migrations
The system uses Firestore's merge functionality, so adding new fields is backward compatible.

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the test suite output
3. Check Firebase console for errors
4. Verify network connectivity

## 🎯 Next Steps

After setting up user registration, consider:
1. Implementing user authentication (login/logout)
2. Adding email verification
3. Setting up password reset functionality
4. Implementing user roles and permissions
5. Adding profile picture upload
6. Setting up user preferences

---

**Project**: PROJECT:ECHO V2  
**Firebase Project**: projectecho-791fb  
**Collection**: UserLOGININFORMATION  
**Document ID**: User UID (unique per user)
