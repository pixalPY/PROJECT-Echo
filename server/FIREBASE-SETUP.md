# Firebase Setup Guide for PROJECT:Echo

Complete guide to set up Firebase backend for PROJECT:Echo task management app.

## 🔥 Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `project-echo` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable the following providers:
   - **Email/Password** ✅
   - **Google** ✅ (optional but recommended)
3. Configure authorized domains if needed

### 3. Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** (we'll add security rules later)
3. Select your preferred location
4. Click "Done"

### 4. Set up Security Rules

1. Go to **Firestore Database** → **Rules**
2. Replace the default rules with the content from `firestore.rules`
3. Click "Publish"

### 5. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → **Web** (</>) 
4. Register your app with nickname: "PROJECT:Echo Web"
5. Copy the Firebase configuration object

## 🔧 Environment Configuration

### 1. Create `.env` file

Create a `.env` file in the `server` directory:

```env
# Environment Configuration
NODE_ENV=development
PORT=3001

# Firebase Configuration (from Firebase Console)
FIREBASE_API_KEY=your-api-key-here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456
FIREBASE_MEASUREMENT_ID=G-ABCDEF1234
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com

# CORS Settings
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Service Account (Production)

For production deployment:

1. Go to **Project Settings** → **Service accounts**
2. Click "Generate new private key"
3. Download the JSON file
4. Add to `.env` as one line:

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}
```

## 🚀 Installation & Startup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 3. Verify Setup

Visit these endpoints to verify everything works:

- **Health Check**: http://localhost:3001/health
- **API Documentation**: http://localhost:3001/api
- **Firebase Config**: http://localhost:3001/api/auth/config

## 📱 Frontend Integration

### 1. Install Firebase SDK in Frontend

```bash
npm install firebase
```

### 2. Use the Firebase Integration

Copy `firebase-frontend-integration.js` to your React project and use it:

```javascript
import ProjectEchoFirebaseAPI from './firebase-frontend-integration.js';

const api = new ProjectEchoFirebaseAPI();

// In your React component
useEffect(() => {
  const initializeApp = async () => {
    const user = await api.waitForAuth();
    if (user) {
      const profile = await api.getProfile();
      setUser(profile.user);
      
      // Set up real-time listeners
      const unsubscribeTasks = api.subscribeToTasks(setTasks);
      
      return () => unsubscribeTasks?.();
    }
  };
  
  initializeApp();
}, []);
```

## 🔒 Security Rules Explanation

The Firestore security rules ensure:

- **User Isolation**: Users can only access their own data
- **Authentication Required**: All operations require valid Firebase authentication
- **Data Validation**: Proper data structure validation
- **Admin Protection**: Admin-only collections are protected

```javascript
// Example: Users can only access their own tasks
match /users/{userId}/tasks/{taskId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## 📊 Data Structure

### Firestore Collections

```
/users/{userId}
  ├── email: string
  ├── name: string
  ├── userTheme: string
  ├── userCoins: number
  ├── goals: array
  ├── createdAt: timestamp
  └── updatedAt: timestamp

/users/{userId}/tasks/{taskId}
  ├── text: string
  ├── completed: boolean
  ├── priority: string
  ├── category: string
  ├── dueDate: string
  ├── recurring: string
  ├── isStarterTask: boolean
  ├── createdAt: timestamp
  └── updatedAt: timestamp

/users/{userId}/plants/{plantId}
  ├── name: string
  ├── tasksCompleted: number
  ├── createdAt: timestamp
  └── updatedAt: timestamp

/users/{userId}/inventory/{itemId}
  ├── itemId: string
  ├── itemType: string
  └── acquiredAt: timestamp

/users/{userId}/healthData/{date}
  ├── caloriesConsumed: number
  ├── caloriesGoal: number
  ├── waterGlasses: number
  ├── waterGoal: number
  ├── exerciseMinutes: number
  ├── exerciseGoal: number
  ├── sleepHours: number
  ├── sleepGoal: number
  ├── date: string
  └── updatedAt: timestamp
```

## 🔄 Real-time Features

Firebase provides real-time updates automatically:

- **Tasks**: Live updates when tasks are added/modified/deleted
- **User Data**: Instant theme changes, coin updates
- **Plants**: Real-time plant growth tracking
- **Multi-device Sync**: Changes sync across all user devices

## 🧪 Testing

### Test User Creation

```javascript
// Register a test user
const response = await api.register(
  'test@example.com', 
  'testpassword', 
  'Test User', 
  ['productive', 'organized']
);
```

### API Testing with curl

```bash
# Get Firebase config
curl http://localhost:3001/api/auth/config

# Create task (requires Firebase ID token)
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{"text":"Test task","priority":"high"}'
```

## 🚀 Deployment

### Backend Deployment (Node.js)

1. **Heroku**:
   ```bash
   heroku create project-echo-api
   heroku config:set FIREBASE_API_KEY=your-key
   # ... add all environment variables
   git push heroku main
   ```

2. **Vercel**:
   ```bash
   vercel --prod
   # Add environment variables in Vercel dashboard
   ```

3. **Railway**:
   ```bash
   railway login
   railway init
   railway add
   # Add environment variables in Railway dashboard
   ```

### Frontend Deployment

Deploy your React app to:
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **Firebase Hosting**: `firebase deploy`

## 🎯 Benefits of Firebase

✅ **Real-time Updates**: Instant synchronization across devices  
✅ **Scalable**: Handles millions of users automatically  
✅ **Secure**: Built-in authentication and security rules  
✅ **Offline Support**: Works offline with automatic sync  
✅ **No Server Management**: Fully managed by Google  
✅ **Analytics**: Built-in user analytics and crash reporting  
✅ **Multi-platform**: Works with web, mobile, and desktop apps  

## 🆘 Troubleshooting

### Common Issues

1. **"Firebase not initialized"**
   - Check your `.env` file has all required Firebase config
   - Ensure Firebase project is properly set up

2. **"Permission denied"**
   - Verify Firestore security rules are published
   - Check user is authenticated before making requests

3. **"Token expired"**
   - Tokens auto-refresh, but check network connectivity
   - Ensure proper error handling in frontend

4. **"CORS errors"**
   - Add your domain to Firebase authorized domains
   - Check CORS configuration in server

### Debug Mode

Enable debug logging:

```javascript
// In your frontend
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';

// Connect to emulators for local testing
if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

## 📞 Support

- **Firebase Documentation**: https://firebase.google.com/docs
- **Firebase Console**: https://console.firebase.google.com
- **Stack Overflow**: Tag your questions with `firebase` and `project-echo`

---

🎉 **You're all set!** Your Firebase backend is ready to power PROJECT:Echo with real-time, scalable, and secure data management.
