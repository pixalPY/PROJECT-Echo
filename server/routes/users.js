const express = require('express');
const Database = require('../config/database');
const { auth } = require('../middleware/auth');
const { validateTheme, validateHealthData } = require('../middleware/validation');

const router = express.Router();

// Update user theme
router.patch('/theme', auth, validateTheme, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    
    const { theme } = req.body;

    await db.run(`
      UPDATE users 
      SET user_theme = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [theme, req.user.id]);

    await db.close();

    res.json({
      message: 'Theme updated successfully',
      theme
    });

  } catch (error) {
    await db.close();
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Server error updating theme' });
  }
});

// Get user inventory
router.get('/inventory', auth, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    
    const inventory = await db.all(`
      SELECT item_id, item_type, acquired_at
      FROM user_inventory 
      WHERE user_id = ?
      ORDER BY acquired_at DESC
    `, [req.user.id]);

    await db.close();

    const formattedInventory = inventory.map(item => ({
      itemId: item.item_id,
      itemType: item.item_type,
      acquiredAt: item.acquired_at
    }));

    res.json({ inventory: formattedInventory });

  } catch (error) {
    await db.close();
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Server error fetching inventory' });
  }
});

// Purchase item
router.post('/inventory/purchase', auth, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    
    const { itemId, itemType, price } = req.body;

    // Check if user has enough coins
    const user = await db.get('SELECT user_coins FROM users WHERE id = ?', [req.user.id]);
    
    if (user.user_coins < price) {
      await db.close();
      return res.status(400).json({ error: 'Insufficient coins' });
    }

    // Check if user already owns the item
    const existingItem = await db.get(
      'SELECT id FROM user_inventory WHERE user_id = ? AND item_id = ?',
      [req.user.id, itemId]
    );

    if (existingItem) {
      await db.close();
      return res.status(400).json({ error: 'Item already owned' });
    }

    // Deduct coins and add item
    await db.run('BEGIN TRANSACTION');

    await db.run(`
      UPDATE users 
      SET user_coins = user_coins - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [price, req.user.id]);

    await db.run(`
      INSERT INTO user_inventory (user_id, item_id, item_type)
      VALUES (?, ?, ?)
    `, [req.user.id, itemId, itemType]);

    await db.run('COMMIT');

    const updatedUser = await db.get('SELECT user_coins FROM users WHERE id = ?', [req.user.id]);

    await db.close();

    res.json({
      message: 'Item purchased successfully',
      itemId,
      remainingCoins: updatedUser.user_coins
    });

  } catch (error) {
    await db.run('ROLLBACK');
    await db.close();
    console.error('Purchase item error:', error);
    res.status(500).json({ error: 'Server error purchasing item' });
  }
});

// Get user plants
router.get('/plants', auth, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    
    const plants = await db.all(`
      SELECT id, name, tasks_completed, created_at, updated_at
      FROM plants 
      WHERE user_id = ?
      ORDER BY created_at ASC
    `, [req.user.id]);

    await db.close();

    const formattedPlants = plants.map(plant => ({
      id: plant.id,
      name: plant.name,
      tasksCompleted: plant.tasks_completed,
      createdAt: plant.created_at
    }));

    res.json({ plants: formattedPlants });

  } catch (error) {
    await db.close();
    console.error('Get plants error:', error);
    res.status(500).json({ error: 'Server error fetching plants' });
  }
});

// Add new plant
router.post('/plants', auth, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      await db.close();
      return res.status(400).json({ error: 'Plant name is required' });
    }

    const result = await db.run(`
      INSERT INTO plants (user_id, name, tasks_completed)
      VALUES (?, ?, ?)
    `, [req.user.id, name.trim(), 0]);

    const newPlant = await db.get(`
      SELECT id, name, tasks_completed, created_at
      FROM plants 
      WHERE id = ?
    `, [result.id]);

    await db.close();

    res.status(201).json({
      message: 'Plant added successfully',
      plant: {
        id: newPlant.id,
        name: newPlant.name,
        tasksCompleted: newPlant.tasks_completed,
        createdAt: newPlant.created_at
      }
    });

  } catch (error) {
    await db.close();
    console.error('Add plant error:', error);
    res.status(500).json({ error: 'Server error adding plant' });
  }
});

// Update health data
router.put('/health/:date', auth, validateHealthData, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    
    const { date } = req.params;
    const {
      caloriesConsumed,
      caloriesGoal,
      waterGlasses,
      waterGoal,
      exerciseMinutes,
      exerciseGoal,
      sleepHours,
      sleepGoal
    } = req.body;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      await db.close();
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    await db.run(`
      INSERT OR REPLACE INTO health_data 
      (user_id, date, calories_consumed, calories_goal, water_glasses, water_goal, 
       exercise_minutes, exercise_goal, sleep_hours, sleep_goal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id, date, caloriesConsumed, caloriesGoal, waterGlasses, waterGoal,
      exerciseMinutes, exerciseGoal, sleepHours, sleepGoal
    ]);

    await db.close();

    res.json({ message: 'Health data updated successfully' });

  } catch (error) {
    await db.close();
    console.error('Update health data error:', error);
    res.status(500).json({ error: 'Server error updating health data' });
  }
});

// Get health data for a specific date
router.get('/health/:date', auth, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      await db.close();
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const healthData = await db.get(`
      SELECT calories_consumed, calories_goal, water_glasses, water_goal,
             exercise_minutes, exercise_goal, sleep_hours, sleep_goal
      FROM health_data 
      WHERE user_id = ? AND date = ?
    `, [req.user.id, date]);

    await db.close();

    if (!healthData) {
      return res.json({
        healthData: {
          caloriesConsumed: 0,
          caloriesGoal: 2000,
          waterGlasses: 0,
          waterGoal: 8,
          exerciseMinutes: 0,
          exerciseGoal: 30,
          sleepHours: 0,
          sleepGoal: 8
        }
      });
    }

    res.json({
      healthData: {
        caloriesConsumed: healthData.calories_consumed,
        caloriesGoal: healthData.calories_goal,
        waterGlasses: healthData.water_glasses,
        waterGoal: healthData.water_goal,
        exerciseMinutes: healthData.exercise_minutes,
        exerciseGoal: healthData.exercise_goal,
        sleepHours: healthData.sleep_hours,
        sleepGoal: healthData.sleep_goal
      }
    });

  } catch (error) {
    await db.close();
    console.error('Get health data error:', error);
    res.status(500).json({ error: 'Server error fetching health data' });
  }
});

// Update user coins (for admin or special rewards)
router.patch('/coins', auth, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    
    const { amount, operation = 'add' } = req.body;

    if (!amount || typeof amount !== 'number') {
      await db.close();
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const query = operation === 'set' 
      ? 'UPDATE users SET user_coins = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      : 'UPDATE users SET user_coins = user_coins + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

    await db.run(query, [amount, req.user.id]);

    const updatedUser = await db.get('SELECT user_coins FROM users WHERE id = ?', [req.user.id]);

    await db.close();

    res.json({
      message: 'Coins updated successfully',
      coins: updatedUser.user_coins
    });

  } catch (error) {
    await db.close();
    console.error('Update coins error:', error);
    res.status(500).json({ error: 'Server error updating coins' });
  }
});

module.exports = router;
