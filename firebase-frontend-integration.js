// PROJECT:Echo Firebase Frontend Integration
// Complete Firebase integration for your React frontend

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where 
} from 'firebase/firestore';

class ProjectEchoFirebaseAPI {
  constructor() {
    this.firebaseConfig = null;
    this.app = null;
    this.auth = null;
    this.db = null;
    this.user = null;
    this.idToken = null;
    this.API_BASE_URL = 'http://localhost:3001/api';
    
    this.initializeFirebase();
  }

  async initializeFirebase() {
    try {
      // Get Firebase config from backend
      const response = await fetch(`${this.API_BASE_URL}/auth/config`);
      const { firebaseConfig } = await response.json();
      
      this.firebaseConfig = firebaseConfig;
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      
      // Set up auth state listener
      onAuthStateChanged(this.auth, async (user) => {
        this.user = user;
        if (user) {
          this.idToken = await user.getIdToken();
        } else {
          this.idToken = null;
        }
      });
      
      console.log('✅ Firebase initialized successfully');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw error;
    }
  }

  // Helper method to make authenticated API requests
  async request(endpoint, options = {}) {
    const url = `${this.API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.idToken && { Authorization: `Bearer ${this.idToken}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401 && this.user) {
          this.idToken = await this.user.getIdToken(true); // Force refresh
          // Retry with new token
          config.headers.Authorization = `Bearer ${this.idToken}`;
          const retryResponse = await fetch(url, config);
          const retryData = await retryResponse.json();
          
          if (!retryResponse.ok) {
            throw new Error(retryData.error || 'API request failed');
          }
          
          return retryData;
        }
        
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication Methods
  async register(email, password, name, goals = []) {
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Get ID token
      this.idToken = await user.getIdToken();
      
      // Create user profile via API
      const response = await this.request('/auth/create-profile', {
        method: 'POST',
        body: { name, goals }
      });
      
      return {
        user: response.user,
        firebaseUser: user
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      this.idToken = await user.getIdToken();
      
      // Get user profile from API
      const response = await this.request('/auth/profile');
      
      return {
        user: response.user,
        firebaseUser: user
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(this.auth, provider);
      const user = userCredential.user;
      
      this.idToken = await user.getIdToken();
      
      try {
        // Try to get existing profile
        const response = await this.request('/auth/profile');
        return {
          user: response.user,
          firebaseUser: user
        };
      } catch (error) {
        // If profile doesn't exist, create it
        if (error.message.includes('not found')) {
          const createResponse = await this.request('/auth/create-profile', {
            method: 'POST',
            body: { 
              name: user.displayName || user.email?.split('@')[0],
              goals: []
            }
          });
          
          return {
            user: createResponse.user,
            firebaseUser: user
          };
        }
        throw error;
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
      this.user = null;
      this.idToken = null;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Real-time listeners using Firestore
  subscribeToTasks(callback) {
    if (!this.user) return null;
    
    const tasksRef = collection(this.db, 'users', this.user.uid, 'tasks');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const tasks = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString()
        });
      });
      callback(tasks);
    });
  }

  subscribeToUserData(callback) {
    if (!this.user) return null;
    
    const userRef = doc(this.db, 'users', this.user.uid);
    
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback({
          uid: this.user.uid,
          email: this.user.email,
          ...data
        });
      }
    });
  }

  subscribeToPlants(callback) {
    if (!this.user) return null;
    
    const plantsRef = collection(this.db, 'users', this.user.uid, 'plants');
    const q = query(plantsRef, orderBy('createdAt', 'asc'));
    
    return onSnapshot(q, (snapshot) => {
      const plants = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        plants.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString()
        });
      });
      callback(plants);
    });
  }

  // API Methods (same as before but with Firebase auth)
  async getTasks() {
    return this.request('/tasks');
  }

  async createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: taskData,
    });
  }

  async updateTask(taskId, taskData) {
    return this.request(`/tasks/${taskId}`, {
      method: 'PUT',
      body: taskData,
    });
  }

  async toggleTask(taskId) {
    return this.request(`/tasks/${taskId}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteTask(taskId) {
    return this.request(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  async getTaskStats() {
    return this.request('/tasks/stats');
  }

  async updateTheme(theme) {
    return this.request('/users/theme', {
      method: 'PATCH',
      body: { theme },
    });
  }

  async getInventory() {
    return this.request('/users/inventory');
  }

  async purchaseItem(itemData) {
    return this.request('/users/inventory/purchase', {
      method: 'POST',
      body: itemData,
    });
  }

  async getPlants() {
    return this.request('/users/plants');
  }

  async addPlant(plantData) {
    return this.request('/users/plants', {
      method: 'POST',
      body: plantData,
    });
  }

  async getHealthData(date) {
    return this.request(`/users/health/${date}`);
  }

  async updateHealthData(date, healthData) {
    return this.request(`/users/health/${date}`, {
      method: 'PUT',
      body: healthData,
    });
  }

  async updateCoins(amount, operation = 'add') {
    return this.request('/users/coins', {
      method: 'PATCH',
      body: { amount, operation },
    });
  }

  async getUserStats() {
    return this.request('/users/stats');
  }

  async exportUserData() {
    return this.request('/users/export');
  }

  // Utility methods
  getCurrentUser() {
    return this.user;
  }

  isAuthenticated() {
    return !!this.user;
  }

  async waitForAuth() {
    return new Promise((resolve) => {
      if (this.user !== null) {
        resolve(this.user);
      } else {
        const unsubscribe = onAuthStateChanged(this.auth, (user) => {
          unsubscribe();
          resolve(user);
        });
      }
    });
  }
}

// Usage example in React:
/*
import React, { useState, useEffect } from 'react';

const api = new ProjectEchoFirebaseAPI();

function ProjectEcho() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for Firebase auth to initialize
    const initializeApp = async () => {
      const firebaseUser = await api.waitForAuth();
      
      if (firebaseUser) {
        try {
          const profileResponse = await api.getProfile();
          setUser(profileResponse.user);
          
          // Set up real-time listeners
          const unsubscribeTasks = api.subscribeToTasks(setTasks);
          const unsubscribeUser = api.subscribeToUserData(setUser);
          
          // Cleanup listeners on unmount
          return () => {
            unsubscribeTasks?.();
            unsubscribeUser?.();
          };
        } catch (error) {
          console.error('Failed to load user data:', error);
        }
      }
      
      setLoading(false);
    };

    initializeApp();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const response = await api.login(email, password);
      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await api.loginWithGoogle();
      setUser(response.user);
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await api.createTask(taskData);
      // Tasks will update automatically via real-time listener
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  };

  // ... rest of your component logic
}
*/

export default ProjectEchoFirebaseAPI;

// For non-ES6 environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProjectEchoFirebaseAPI;
} else if (typeof window !== 'undefined') {
  window.ProjectEchoFirebaseAPI = ProjectEchoFirebaseAPI;
}
