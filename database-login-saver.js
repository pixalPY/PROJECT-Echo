/**
 * DATABASE LOGIN SAVER FOR PROJECTECHO-791FB
 * ==========================================
 * 
 * This utility helps save and manage database login credentials 
 * for the Project Echo V2 Firebase project: projectecho-791fb
 */

const fs = require('fs');
const path = require('path');

class DatabaseLoginSaver {
    constructor() {
        this.projectId = 'projectecho-791fb';
        this.configFile = path.join(__dirname, 'server', '.env');
        this.backupFile = path.join(__dirname, 'database-credentials-backup.json');
    }

    /**
     * Save Firebase credentials to environment file
     */
    saveFirebaseCredentials(credentials) {
        const {
            apiKey,
            authDomain = `${this.projectId}.firebaseapp.com`,
            projectId = this.projectId,
            storageBucket = `${this.projectId}.appspot.com`,
            messagingSenderId,
            appId,
            measurementId,
            databaseURL = `https://${this.projectId}-default-rtdb.firebaseio.com`
        } = credentials;

        const envContent = `# Environment Configuration
NODE_ENV=development
PORT=3001

# Firebase Configuration for ${this.projectId}
FIREBASE_API_KEY=${apiKey}
FIREBASE_AUTH_DOMAIN=${authDomain}
FIREBASE_PROJECT_ID=${projectId}
FIREBASE_STORAGE_BUCKET=${storageBucket}
FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
FIREBASE_APP_ID=${appId}
FIREBASE_MEASUREMENT_ID=${measurementId}
FIREBASE_DATABASE_URL=${databaseURL}

# CORS Settings
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Created: ${new Date().toISOString()}
# Project: ${this.projectId}
`;

        try {
            fs.writeFileSync(this.configFile, envContent);
            console.log('✅ Firebase credentials saved to .env file');
            
            // Create backup
            this.createBackup(credentials);
            
            return true;
        } catch (error) {
            console.error('❌ Error saving credentials:', error);
            return false;
        }
    }

    /**
     * Create backup of credentials
     */
    createBackup(credentials) {
        const backup = {
            projectId: this.projectId,
            timestamp: new Date().toISOString(),
            credentials: credentials,
            firebaseConsoleUrl: `https://console.firebase.google.com/project/${this.projectId}`,
            firestoreUrl: `https://console.firebase.google.com/project/${this.projectId}/firestore`,
            authUrl: `https://console.firebase.google.com/project/${this.projectId}/authentication`
        };

        try {
            fs.writeFileSync(this.backupFile, JSON.stringify(backup, null, 2));
            console.log('✅ Backup created at:', this.backupFile);
        } catch (error) {
            console.error('❌ Error creating backup:', error);
        }
    }

    /**
     * Load saved credentials
     */
    loadCredentials() {
        try {
            if (fs.existsSync(this.backupFile)) {
                const backup = JSON.parse(fs.readFileSync(this.backupFile, 'utf8'));
                return backup.credentials;
            }
        } catch (error) {
            console.error('❌ Error loading credentials:', error);
        }
        return null;
    }

    /**
     * Get Firebase Console URLs for projectecho-791fb
     */
    getFirebaseUrls() {
        return {
            console: `https://console.firebase.google.com/project/${this.projectId}`,
            firestore: `https://console.firebase.google.com/project/${this.projectId}/firestore`,
            authentication: `https://console.firebase.google.com/project/${this.projectId}/authentication`,
            settings: `https://console.firebase.google.com/project/${this.projectId}/settings/general`,
            hosting: `https://console.firebase.google.com/project/${this.projectId}/hosting`,
            functions: `https://console.firebase.google.com/project/${this.projectId}/functions`,
            storage: `https://console.firebase.google.com/project/${this.projectId}/storage`
        };
    }

    /**
     * Display helpful information
     */
    displayInfo() {
        console.log('\n🔥 PROJECT ECHO V2 - FIREBASE DATABASE INFO');
        console.log('===========================================');
        console.log(`Project ID: ${this.projectId}`);
        console.log('\n📱 Firebase Console URLs:');
        
        const urls = this.getFirebaseUrls();
        Object.entries(urls).forEach(([key, url]) => {
            console.log(`  ${key.padEnd(14)}: ${url}`);
        });

        console.log('\n🔧 Setup Steps:');
        console.log('1. Go to Firebase Console (console link above)');
        console.log('2. Find your project: projectecho-791fb');
        console.log('3. Go to Project Settings > General > Your apps');
        console.log('4. Copy the Firebase config object');
        console.log('5. Use saveFirebaseCredentials() method to save it');

        console.log('\n📊 Database Collections Expected:');
        console.log('  - users/{userId}');
        console.log('  - users/{userId}/tasks/{taskId}');
        console.log('  - users/{userId}/plants/{plantId}');
        console.log('  - users/{userId}/inventory/{itemId}');
        console.log('  - users/{userId}/healthData/{date}');
    }

    /**
     * Test database connection
     */
    async testConnection() {
        try {
            // Import Firebase config
            const firebaseConfig = require('./server/config/firebase.js');
            
            console.log('\n🧪 Testing Firebase Connection...');
            console.log(`Project ID: ${this.projectId}`);
            
            // Initialize Firebase
            const admin = firebaseConfig.getFirebaseAdmin();
            const db = firebaseConfig.getAdminFirestore();
            
            // Test basic read operation
            const testDoc = await db.collection('test').doc('connection').get();
            console.log('✅ Firebase connection successful!');
            
            return true;
        } catch (error) {
            console.error('❌ Firebase connection failed:', error.message);
            return false;
        }
    }
}

// Usage examples
if (require.main === module) {
    const saver = new DatabaseLoginSaver();
    
    // Display project information
    saver.displayInfo();
    
    // Example of how to save credentials (uncomment and fill with actual values)
    /*
    const credentials = {
        apiKey: "your-api-key-here",
        authDomain: "projectecho-791fb.firebaseapp.com",
        projectId: "projectecho-791fb",
        storageBucket: "projectecho-791fb.appspot.com",
        messagingSenderId: "your-sender-id",
        appId: "your-app-id",
        measurementId: "G-your-measurement-id"
    };
    
    saver.saveFirebaseCredentials(credentials);
    */
}

module.exports = DatabaseLoginSaver;
