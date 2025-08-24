const { getAdminFirestore, getAdminAuth } = require('../config/firebase');

class UserService {
  constructor() {
    this.db = getAdminFirestore();
    this.auth = getAdminAuth();
  }

  /**
   * Create a new user in Firebase Auth and store additional info in Firestore
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User's email
   * @param {string} userData.password - User's password
   * @param {string} userData.displayName - User's display name
   * @param {Object} additionalData - Additional user data to store in Firestore
   */
  async createUser(userData, additionalData = {}) {
    try {
      // Create user in Firebase Auth
      const userRecord = await this.auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        emailVerified: false
      });

      // Prepare user data for Firestore
      const userInfo = {
        uid: userRecord.uid,
        email: userData.email,
        displayName: userData.displayName,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true,
        ...additionalData
      };

      // Store user information in UserLOGININFORMATION collection
      // Using the user's UID as the document ID for unique storage
      await this.db.collection('UserLOGININFORMATION')
        .doc(userRecord.uid)
        .set(userInfo, { merge: true });

      console.log(`✅ User created successfully: ${userRecord.uid}`);
      
      return {
        success: true,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName
        },
        message: 'User created successfully'
      };

    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user information from Firestore
   * @param {string} uid - User ID
   */
  async getUserInfo(uid) {
    try {
      const userDoc = await this.db.collection('UserLOGININFORMATION')
        .doc(uid)
        .get();

      if (!userDoc.exists) {
        return null;
      }

      return userDoc.data();
    } catch (error) {
      console.error('❌ Error getting user info:', error);
      throw error;
    }
  }

  /**
   * Update user information in Firestore
   * @param {string} uid - User ID
   * @param {Object} updateData - Data to update
   */
  async updateUserInfo(uid, updateData) {
    try {
      await this.db.collection('UserLOGININFORMATION')
        .doc(uid)
        .update({
          ...updateData,
          updatedAt: new Date()
        });

      console.log(`✅ User info updated successfully: ${uid}`);
      return { success: true, message: 'User info updated successfully' };
    } catch (error) {
      console.error('❌ Error updating user info:', error);
      throw error;
    }
  }

  /**
   * Update user's last login time
   * @param {string} uid - User ID
   */
  async updateLastLogin(uid) {
    try {
      await this.db.collection('UserLOGININFORMATION')
        .doc(uid)
        .update({
          lastLoginAt: new Date()
        });

      console.log(`✅ Last login updated for user: ${uid}`);
    } catch (error) {
      console.error('❌ Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Delete user from both Auth and Firestore
   * @param {string} uid - User ID
   */
  async deleteUser(uid) {
    try {
      // Delete from Firebase Auth
      await this.auth.deleteUser(uid);

      // Delete from Firestore
      await this.db.collection('UserLOGININFORMATION')
        .doc(uid)
        .delete();

      console.log(`✅ User deleted successfully: ${uid}`);
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }

  /**
   * List all users (for admin purposes)
   */
  async listUsers() {
    try {
      const listUsersResult = await this.auth.listUsers();
      return listUsersResult.users;
    } catch (error) {
      console.error('❌ Error listing users:', error);
      throw error;
    }
  }

  /**
   * List all users in Firestore collection
   */
  async listAllUsersInCollection() {
    try {
      const usersSnapshot = await this.db.collection('UserLOGININFORMATION').get();
      const users = [];
      
      usersSnapshot.forEach(doc => {
        users.push({
          uid: doc.id,
          ...doc.data()
        });
      });
      
      return users;
    } catch (error) {
      console.error('❌ Error listing users in collection:', error);
      throw error;
    }
  }

  /**
   * Verify user exists and get their info
   * @param {string} uid - User ID
   */
  async verifyUser(uid) {
    try {
      const userRecord = await this.auth.getUser(uid);
      const userInfo = await this.getUserInfo(uid);
      
      return {
        auth: userRecord,
        firestore: userInfo
      };
    } catch (error) {
      console.error('❌ Error verifying user:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
