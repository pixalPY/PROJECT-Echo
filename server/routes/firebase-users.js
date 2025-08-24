const express = require('express');
const { verifyFirebaseToken } = require('../config/firebase');
const firebaseService = require('../services/firebaseService');
const { validateTheme, validateHealthData } = require('../middleware/validation');

const router = express.Router();

// Update user theme
router.patch('/theme', verifyFirebaseToken, validateTheme, async (req, res) => {
  try {
    const { theme } = req.body;
    
    await firebaseService.updateUserData(req.user.uid, { userTheme: theme });
    
    res.json({
      message: 'Theme updated successfully',
      theme
    });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Server error updating theme' });
  }
});

// Activate theme (with persistence)
router.post('/theme/activate', verifyFirebaseToken, async (req, res) => {
  try {
    const { themeId } = req.body;
    
    if (!themeId) {
      return res.status(400).json({ error: 'Theme ID is required' });
    }
    
    const result = await firebaseService.activateTheme(req.user.uid, themeId);
    
    res.json({
      message: 'Theme activated and saved successfully',
      activeTheme: result.activeTheme,
      persistent: true
    });
  } catch (error) {
    console.error('Activate theme error:', error);
    
    if (error.message === 'Theme not owned') {
      return res.status(403).json({ error: 'Theme not owned. Purchase it first.' });
    }
    
    res.status(500).json({ error: 'Server error activating theme' });
  }
});

// Get user inventory
router.get('/inventory', verifyFirebaseToken, async (req, res) => {
  try {
    const inventory = await firebaseService.getInventory(req.user.uid);
    res.json({ inventory });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Server error fetching inventory' });
  }
});

// Purchase item
router.post('/inventory/purchase', verifyFirebaseToken, async (req, res) => {
  try {
    const { itemId, itemType, price } = req.body;
    
    if (!itemId || !itemType || typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Invalid purchase data' });
    }
    
    const result = await firebaseService.purchaseItem(req.user.uid, {
      itemId,
      itemType,
      price
    });
    
    res.json({
      message: 'Item purchased successfully',
      itemId: result.itemId,
      remainingCoins: result.remainingCoins
    });
  } catch (error) {
    console.error('Purchase item error:', error);
    
    if (error.message === 'Insufficient coins') {
      return res.status(400).json({ error: 'Insufficient coins' });
    }
    
    if (error.message === 'Item already owned') {
      return res.status(400).json({ error: 'Item already owned' });
    }
    
    res.status(500).json({ error: 'Server error purchasing item' });
  }
});

// Get user plants
router.get('/plants', verifyFirebaseToken, async (req, res) => {
  try {
    const plants = await firebaseService.getPlants(req.user.uid);
    res.json({ plants });
  } catch (error) {
    console.error('Get plants error:', error);
    res.status(500).json({ error: 'Server error fetching plants' });
  }
});

// Add new plant
router.post('/plants', verifyFirebaseToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Plant name is required' });
    }
    
    if (name.trim().length > 50) {
      return res.status(400).json({ error: 'Plant name must be less than 50 characters' });
    }
    
    const newPlant = await firebaseService.createPlant(req.user.uid, {
      name: name.trim()
    });
    
    res.status(201).json({
      message: 'Plant added successfully',
      plant: newPlant
    });
  } catch (error) {
    console.error('Add plant error:', error);
    res.status(500).json({ error: 'Server error adding plant' });
  }
});

// Update health data
router.put('/health/:date', verifyFirebaseToken, validateHealthData, async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const healthData = {
      caloriesConsumed: req.body.caloriesConsumed || 0,
      caloriesGoal: req.body.caloriesGoal || 2000,
      waterGlasses: req.body.waterGlasses || 0,
      waterGoal: req.body.waterGoal || 8,
      exerciseMinutes: req.body.exerciseMinutes || 0,
      exerciseGoal: req.body.exerciseGoal || 30,
      sleepHours: req.body.sleepHours || 0,
      sleepGoal: req.body.sleepGoal || 8
    };
    
    await firebaseService.updateHealthData(req.user.uid, date, healthData);
    
    res.json({ 
      message: 'Health data updated successfully',
      date,
      healthData
    });
  } catch (error) {
    console.error('Update health data error:', error);
    res.status(500).json({ error: 'Server error updating health data' });
  }
});

// Get health data for a specific date
router.get('/health/:date', verifyFirebaseToken, async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const healthData = await firebaseService.getHealthData(req.user.uid, date);
    
    res.json({ healthData });
  } catch (error) {
    console.error('Get health data error:', error);
    res.status(500).json({ error: 'Server error fetching health data' });
  }
});

// Update user coins (for rewards, purchases, etc.)
router.patch('/coins', verifyFirebaseToken, async (req, res) => {
  try {
    const { amount, operation = 'add', reason } = req.body;
    
    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    
    if (operation === 'subtract' || operation === 'deduct') {
      amount = -Math.abs(amount); // Ensure negative for subtraction
    } else if (operation === 'set') {
      await firebaseService.updateUserData(req.user.uid, { userCoins: amount });
      return res.json({
        message: 'Coins updated successfully',
        coins: amount,
        operation: 'set'
      });
    }
    
    // For add/subtract operations, we need to get current coins first
    const userData = await firebaseService.getUserData(req.user.uid);
    const newCoins = Math.max(0, userData.userCoins + amount); // Prevent negative coins
    
    await firebaseService.updateUserData(req.user.uid, { userCoins: newCoins });
    
    res.json({
      message: 'Coins updated successfully',
      coins: newCoins,
      operation,
      amount,
      reason
    });
  } catch (error) {
    console.error('Update coins error:', error);
    res.status(500).json({ error: 'Server error updating coins' });
  }
});

// Get user statistics
router.get('/stats', verifyFirebaseToken, async (req, res) => {
  try {
    const [taskStats, plants, inventory, userData] = await Promise.all([
      firebaseService.getTaskStats(req.user.uid),
      firebaseService.getPlants(req.user.uid),
      firebaseService.getInventory(req.user.uid),
      firebaseService.getUserData(req.user.uid)
    ]);
    
    const stats = {
      tasks: taskStats,
      plants: {
        total: plants.length,
        totalTasksCompleted: plants.reduce((sum, plant) => sum + plant.tasksCompleted, 0)
      },
      inventory: {
        totalItems: inventory.length,
        themes: inventory.filter(item => item.itemType === 'theme').length,
        decorations: inventory.filter(item => item.itemType === 'decoration').length,
        plants: inventory.filter(item => item.itemType === 'plant').length
      },
      user: {
        coins: userData.userCoins,
        theme: userData.userTheme,
        goalsCount: userData.goals ? userData.goals.length : 0
      }
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Server error fetching user statistics' });
  }
});

// Save progress snapshot (for persistence)
router.post('/progress/save', verifyFirebaseToken, async (req, res) => {
  try {
    const progressData = req.body;
    
    const result = await firebaseService.saveProgressSnapshot(req.user.uid, progressData);
    
    res.json({
      message: 'Progress saved successfully',
      lastSync: result.lastSync,
      persistent: true
    });
  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({ error: 'Server error saving progress' });
  }
});

// Load complete user progress (for session restoration)
router.get('/progress/load', verifyFirebaseToken, async (req, res) => {
  try {
    const completeProgress = await firebaseService.loadCompleteUserProgress(req.user.uid);
    
    res.json({
      message: 'Progress loaded successfully',
      progress: completeProgress,
      restored: true
    });
  } catch (error) {
    console.error('Load progress error:', error);
    res.status(500).json({ error: 'Server error loading progress' });
  }
});

// End user session (logout with persistence)
router.post('/session/end', verifyFirebaseToken, async (req, res) => {
  try {
    await firebaseService.endUserSession(req.user.uid);
    
    res.json({
      message: 'Session ended and progress saved',
      loggedOut: true
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: 'Server error ending session' });
  }
});

// Export user data (GDPR compliance)
router.get('/export', verifyFirebaseToken, async (req, res) => {
  try {
    const [userData, tasks, plants, inventory] = await Promise.all([
      firebaseService.getUserData(req.user.uid),
      firebaseService.getTasks(req.user.uid),
      firebaseService.getPlants(req.user.uid),
      firebaseService.getInventory(req.user.uid)
    ]);
    
    // Get health data for the last 30 days
    const healthData = {};
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      try {
        healthData[dateString] = await firebaseService.getHealthData(req.user.uid, dateString);
      } catch (error) {
        // Skip if no data for this date
      }
    }
    
    const exportData = {
      user: {
        uid: req.user.uid,
        email: req.user.email,
        name: userData.name,
        userTheme: userData.userTheme,
        userCoins: userData.userCoins,
        goals: userData.goals,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      },
      tasks,
      plants,
      inventory,
      healthData,
      exportDate: new Date().toISOString(),
      exportVersion: '1.0'
    };
    
    res.json({
      message: 'User data exported successfully',
      data: exportData
    });
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({ error: 'Server error exporting user data' });
  }
});

module.exports = router;
