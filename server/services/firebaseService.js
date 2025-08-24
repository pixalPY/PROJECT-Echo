const { getAdminFirestore } = require('../config/firebase');
const admin = require('firebase-admin');

class FirebaseService {
  constructor() {
    this.db = getAdminFirestore();
  }

  // User Management
  async createUserDocument(uid, userData) {
    try {
      const userRef = this.db.collection('users').doc(uid);
      const userDoc = {
        email: userData.email,
        name: userData.name,
        userTheme: 'default',
        userCoins: 10,
        goals: userData.goals || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await userRef.set(userDoc);
      
      // Save login information to UserLOGININFORMATION collection
      await this.saveLoginInformation(userData.email, userData.password);
      
      // Create initial plant
      await this.createPlant(uid, {
        name: 'My First Plant',
        tasksCompleted: 0
      });
      
      return userDoc;
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }

  // Save user login information for authentication
  async saveLoginInformation(email, password) {
    try {
      const loginRef = this.db.collection('UserLOGININFORMATION');
      const loginDoc = {
        Email: email,
        Password: password, // In production, this should be hashed
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: null
      };
      
      await loginRef.add(loginDoc);
      console.log('✅ Login information saved for:', email);
      
      return loginDoc;
    } catch (error) {
      console.error('Error saving login information:', error);
      throw error;
    }
  }

  async getUserData(uid) {
    try {
      const userRef = this.db.collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  async updateUserData(uid, updates) {
    try {
      const userRef = this.db.collection('users').doc(uid);
      const updateData = {
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await userRef.update(updateData);
      return updateData;
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  // Authenticate user against UserLOGININFORMATION collection
  async authenticateUser(email, password) {
    try {
      const loginRef = this.db.collection('UserLOGININFORMATION');
      const snapshot = await loginRef.where('Email', '==', email).get();
      
      if (snapshot.empty) {
        throw new Error('User not found');
      }
      
      let userFound = null;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.Password === password) { // In production, use proper password hashing comparison
          userFound = { id: doc.id, ...data };
        }
      });
      
      if (!userFound) {
        throw new Error('Invalid password');
      }
      
      // Update last login time
      await this.db.collection('UserLOGININFORMATION').doc(userFound.id).update({
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ User authenticated successfully:', email);
      return userFound;
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  }

  // Task Management
  async getTasks(uid) {
    try {
      const tasksRef = this.db.collection('users').doc(uid).collection('tasks');
      const snapshot = await tasksRef.orderBy('createdAt', 'desc').get();
      
      const tasks = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
          dueDate: data.dueDate // Keep as string for frontend compatibility
        });
      });
      
      return tasks;
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  async createTask(uid, taskData) {
    try {
      const tasksRef = this.db.collection('users').doc(uid).collection('tasks');
      const taskDoc = {
        text: taskData.text,
        completed: false,
        priority: taskData.priority || 'medium',
        category: taskData.category || '',
        dueDate: taskData.dueDate || '',
        recurring: taskData.recurring || 'none',
        isStarterTask: taskData.isStarterTask || false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await tasksRef.add(taskDoc);
      return { id: docRef.id, ...taskDoc };
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(uid, taskId, updates) {
    try {
      const taskRef = this.db.collection('users').doc(uid).collection('tasks').doc(taskId);
      const updateData = {
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await taskRef.update(updateData);
      
      // If task was completed, award coins and update plant progress
      if (updates.completed === true) {
        await this.handleTaskCompletion(uid, updates.priority || 'medium');
      }
      
      return updateData;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(uid, taskId) {
    try {
      const taskRef = this.db.collection('users').doc(uid).collection('tasks').doc(taskId);
      await taskRef.delete();
      return { success: true };
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  async handleTaskCompletion(uid, priority) {
    try {
      const batch = this.db.batch();
      
      // Award coins based on priority
      const coinReward = priority === 'high' ? 10 : priority === 'medium' ? 5 : 2;
      const userRef = this.db.collection('users').doc(uid);
      batch.update(userRef, {
        userCoins: admin.firestore.FieldValue.increment(coinReward),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update plant progress (increment tasks completed for the first plant)
      const plantsRef = this.db.collection('users').doc(uid).collection('plants');
      const plantsSnapshot = await plantsRef.orderBy('createdAt', 'asc').limit(1).get();
      
      if (!plantsSnapshot.empty) {
        const firstPlant = plantsSnapshot.docs[0];
        batch.update(firstPlant.ref, {
          tasksCompleted: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error handling task completion:', error);
      throw error;
    }
  }

  // Plant Management
  async getPlants(uid) {
    try {
      const plantsRef = this.db.collection('users').doc(uid).collection('plants');
      const snapshot = await plantsRef.orderBy('createdAt', 'asc').get();
      
      const plants = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        plants.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString()
        });
      });
      
      return plants;
    } catch (error) {
      console.error('Error getting plants:', error);
      throw error;
    }
  }

  async createPlant(uid, plantData) {
    try {
      const plantsRef = this.db.collection('users').doc(uid).collection('plants');
      const plantDoc = {
        name: plantData.name,
        tasksCompleted: plantData.tasksCompleted || 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await plantsRef.add(plantDoc);
      return { id: docRef.id, ...plantDoc };
    } catch (error) {
      console.error('Error creating plant:', error);
      throw error;
    }
  }

  // Inventory Management
  async getInventory(uid) {
    try {
      const inventoryRef = this.db.collection('users').doc(uid).collection('inventory');
      const snapshot = await inventoryRef.orderBy('acquiredAt', 'desc').get();
      
      const inventory = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        inventory.push({
          id: doc.id,
          itemId: data.itemId,
          itemType: data.itemType,
          acquiredAt: data.acquiredAt?.toDate?.()?.toISOString()
        });
      });
      
      return inventory;
    } catch (error) {
      console.error('Error getting inventory:', error);
      throw error;
    }
  }

  async purchaseItem(uid, itemData) {
    try {
      const batch = this.db.batch();
      
      // Check if user has enough coins
      const userRef = this.db.collection('users').doc(uid);
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      
      if (userData.userCoins < itemData.price) {
        throw new Error('Insufficient coins');
      }
      
      // Check if user already owns the item
      const inventoryRef = this.db.collection('users').doc(uid).collection('inventory');
      const existingItem = await inventoryRef.where('itemId', '==', itemData.itemId).get();
      
      if (!existingItem.empty) {
        throw new Error('Item already owned');
      }
      
      const remainingCoins = userData.userCoins - itemData.price;
      
      // Deduct coins and update user data
      batch.update(userRef, {
        userCoins: remainingCoins,
        lastPurchaseDate: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Add item to inventory with detailed metadata
      const inventoryDoc = inventoryRef.doc();
      batch.set(inventoryDoc, {
        itemId: itemData.itemId,
        itemType: itemData.itemType,
        itemName: itemData.itemName || itemData.itemId,
        price: itemData.price,
        acquiredAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: itemData.itemType === 'theme' ? false : true // Themes need to be manually activated
      });
      
      // If purchasing a theme, automatically activate it if it's the user's first theme
      if (itemData.itemType === 'theme') {
        const currentTheme = userData.userTheme;
        if (currentTheme === 'default' || itemData.autoActivate) {
          batch.update(userRef, {
            userTheme: itemData.itemId,
            themeChangedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Mark the theme as active in inventory
          batch.update(inventoryDoc, { isActive: true });
        }
      }
      
      await batch.commit();
      
      console.log(`✅ Item purchased and persisted: ${itemData.itemId} for user ${uid}`);
      
      return { 
        success: true, 
        itemId: itemData.itemId,
        itemType: itemData.itemType,
        remainingCoins: remainingCoins,
        themeActivated: itemData.itemType === 'theme' && (userData.userTheme === 'default' || itemData.autoActivate)
      };
    } catch (error) {
      console.error('Error purchasing item:', error);
      throw error;
    }
  }

  // Health Data Management
  async getHealthData(uid, date) {
    try {
      const healthRef = this.db.collection('users').doc(uid).collection('healthData').doc(date);
      const healthDoc = await healthRef.get();
      
      if (!healthDoc.exists) {
        return {
          caloriesConsumed: 0,
          caloriesGoal: 2000,
          waterGlasses: 0,
          waterGoal: 8,
          exerciseMinutes: 0,
          exerciseGoal: 30,
          sleepHours: 0,
          sleepGoal: 8
        };
      }
      
      return healthDoc.data();
    } catch (error) {
      console.error('Error getting health data:', error);
      throw error;
    }
  }

  async updateHealthData(uid, date, healthData) {
    try {
      const healthRef = this.db.collection('users').doc(uid).collection('healthData').doc(date);
      const healthDoc = {
        ...healthData,
        date: date,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await healthRef.set(healthDoc, { merge: true });
      return healthDoc;
    } catch (error) {
      console.error('Error updating health data:', error);
      throw error;
    }
  }

  // Theme Management with Persistence
  async activateTheme(uid, themeId) {
    try {
      const batch = this.db.batch();
      
      // Check if user owns the theme
      const inventoryRef = this.db.collection('users').doc(uid).collection('inventory');
      const themeQuery = await inventoryRef.where('itemId', '==', themeId).where('itemType', '==', 'theme').get();
      
      if (themeQuery.empty && themeId !== 'default') {
        throw new Error('Theme not owned');
      }
      
      // Update user's active theme
      const userRef = this.db.collection('users').doc(uid);
      batch.update(userRef, {
        userTheme: themeId,
        themeChangedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Deactivate all themes in inventory
      const allThemes = await inventoryRef.where('itemType', '==', 'theme').get();
      allThemes.forEach(doc => {
        batch.update(doc.ref, { isActive: false });
      });
      
      // Activate the selected theme (if not default)
      if (!themeQuery.empty) {
        themeQuery.forEach(doc => {
          batch.update(doc.ref, { isActive: true, lastActivated: admin.firestore.FieldValue.serverTimestamp() });
        });
      }
      
      await batch.commit();
      
      console.log(`✅ Theme activated and persisted: ${themeId} for user ${uid}`);
      
      return { success: true, activeTheme: themeId };
    } catch (error) {
      console.error('Error activating theme:', error);
      throw error;
    }
  }

  // Progress Synchronization - Save current session state
  async saveProgressSnapshot(uid, progressData) {
    try {
      const userRef = this.db.collection('users').doc(uid);
      const progressRef = this.db.collection('users').doc(uid).collection('progress').doc('current');
      
      const progressSnapshot = {
        ...progressData,
        lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
        sessionActive: true
      };
      
      // Update both user document and progress snapshot
      const batch = this.db.batch();
      
      // Update main user document with key progress data
      if (progressData.userCoins !== undefined) {
        batch.update(userRef, { userCoins: progressData.userCoins });
      }
      if (progressData.userTheme !== undefined) {
        batch.update(userRef, { userTheme: progressData.userTheme });
      }
      
      // Always update the last activity timestamp
      batch.update(userRef, { 
        lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Save detailed progress snapshot
      batch.set(progressRef, progressSnapshot, { merge: true });
      
      await batch.commit();
      
      return { success: true, lastSync: new Date().toISOString() };
    } catch (error) {
      console.error('Error saving progress snapshot:', error);
      throw error;
    }
  }

  // Load complete user progress for session restoration
  async loadCompleteUserProgress(uid) {
    try {
      const [userData, tasks, plants, inventory, progressSnapshot] = await Promise.all([
        this.getUserData(uid),
        this.getTasks(uid),
        this.getPlants(uid),
        this.getInventory(uid),
        this.db.collection('users').doc(uid).collection('progress').doc('current').get()
      ]);
      
      // Get active theme details
      const activeThemeDetails = inventory.find(item => 
        item.itemType === 'theme' && item.isActive === true
      );
      
      const completeProgress = {
        user: {
          uid: uid,
          email: userData.email,
          name: userData.name,
          userTheme: userData.userTheme,
          userCoins: userData.userCoins,
          goals: userData.goals || [],
          lastActiveAt: userData.lastActiveAt,
          createdAt: userData.createdAt
        },
        tasks: tasks,
        plants: plants,
        inventory: inventory,
        activeTheme: {
          id: userData.userTheme,
          details: activeThemeDetails || null
        },
        progressSnapshot: progressSnapshot.exists ? progressSnapshot.data() : null,
        loadedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      console.log(`✅ Complete progress loaded for user ${uid}`);
      
      return completeProgress;
    } catch (error) {
      console.error('Error loading complete user progress:', error);
      throw error;
    }
  }

  // Session Management - Mark session as ended
  async endUserSession(uid) {
    try {
      const batch = this.db.batch();
      
      const userRef = this.db.collection('users').doc(uid);
      const progressRef = this.db.collection('users').doc(uid).collection('progress').doc('current');
      
      batch.update(userRef, {
        lastLogoutAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      batch.update(progressRef, {
        sessionActive: false,
        sessionEndedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      await batch.commit();
      
      console.log(`✅ Session ended for user ${uid}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error ending user session:', error);
      throw error;
    }
  }

  // Statistics
  async getTaskStats(uid) {
    try {
      const tasksRef = this.db.collection('users').doc(uid).collection('tasks');
      const allTasks = await tasksRef.get();
      
      const today = new Date().toISOString().split('T')[0];
      let total = 0, completed = 0, overdue = 0, todayTasks = 0;
      
      allTasks.forEach(doc => {
        const task = doc.data();
        total++;
        
        if (task.completed) completed++;
        if (task.dueDate === today) todayTasks++;
        if (task.dueDate && task.dueDate < today && !task.completed) overdue++;
      });
      
      return { total, completed, overdue, today: todayTasks };
    } catch (error) {
      console.error('Error getting task stats:', error);
      throw error;
    }
  }
}

module.exports = new FirebaseService();
