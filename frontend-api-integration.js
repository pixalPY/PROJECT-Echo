// PROJECT:Echo Frontend API Integration Example
// Replace the local state management in your React app with these API calls

const API_BASE_URL = 'http://localhost:3001/api';

class ProjectEchoAPI {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Helper method to make authenticated requests
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
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
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication Methods
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
    
    if (response.token) {
      this.token = response.token;
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    
    if (response.token) {
      this.token = response.token;
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.token = null;
      localStorage.removeItem('authToken');
    }
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Task Methods
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

  // User Methods
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
}

// Usage example in React component:
/*
import React, { useState, useEffect } from 'react';

const api = new ProjectEchoAPI();

function ProjectEcho() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      if (api.token) {
        const [profileRes, tasksRes] = await Promise.all([
          api.getProfile(),
          api.getTasks()
        ]);
        
        setUser(profileRes.user);
        setTasks(tasksRes.tasks);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Handle authentication errors
      if (error.message.includes('token') || error.message.includes('auth')) {
        api.logout();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials) => {
    try {
      const response = await api.login(credentials);
      setUser(response.user);
      await loadUserData();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await api.createTask(taskData);
      setTasks(prev => [response.task, ...prev]);
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      await api.toggleTask(taskId);
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed }
          : task
      ));
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleThemeChange = async (theme) => {
    try {
      await api.updateTheme(theme);
      setUser(prev => ({ ...prev, userTheme: theme }));
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  // ... rest of your component logic
}
*/

// Export for use in your React app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProjectEchoAPI;
} else if (typeof window !== 'undefined') {
  window.ProjectEchoAPI = ProjectEchoAPI;
}
