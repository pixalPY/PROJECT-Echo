const express = require('express');
const Database = require('../config/database');
const { auth } = require('../middleware/auth');
const { validateTask } = require('../middleware/validation');

const router = express.Router();

// Get all tasks for user
router.get('/', auth, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    
    const tasks = await db.all(`
      SELECT id, text, completed, priority, category, due_date, recurring, is_starter_task, 
             created_at, updated_at
      FROM tasks 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [req.user.id]);

    await db.close();

    // Transform database format to frontend format
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      text: task.text,
      completed: Boolean(task.completed),
      priority: task.priority,
      category: task.category,
      dueDate: task.due_date,
      recurring: task.recurring,
      isStarterTask: Boolean(task.is_starter_task),
      createdAt: task.created_at,
      userId: req.user.id
    }));

    res.json({ tasks: formattedTasks });

  } catch (error) {
    await db.close();
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
});

// Create new task
router.post('/', auth, validateTask, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    
    const { text, priority = 'medium', category, dueDate, recurring = 'none' } = req.body;

    const result = await db.run(`
      INSERT INTO tasks (user_id, text, priority, category, due_date, recurring)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [req.user.id, text, priority, category, dueDate, recurring]);

    const newTask = await db.get(`
      SELECT id, text, completed, priority, category, due_date, recurring, is_starter_task, 
             created_at, updated_at
      FROM tasks 
      WHERE id = ?
    `, [result.id]);

    await db.close();

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: newTask.id,
        text: newTask.text,
        completed: Boolean(newTask.completed),
        priority: newTask.priority,
        category: newTask.category,
        dueDate: newTask.due_date,
        recurring: newTask.recurring,
        isStarterTask: Boolean(newTask.is_starter_task),
        createdAt: newTask.created_at,
        userId: req.user.id
      }
    });

  } catch (error) {
    await db.close();
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error creating task' });
  }
});

// Update task
router.put('/:id', auth, validateTask, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    
    const taskId = req.params.id;
    const { text, completed, priority, category, dueDate, recurring } = req.body;

    // Check if task belongs to user
    const existingTask = await db.get(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.user.id]
    );

    if (!existingTask) {
      await db.close();
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update task
    await db.run(`
      UPDATE tasks 
      SET text = ?, completed = ?, priority = ?, category = ?, due_date = ?, 
          recurring = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `, [text, completed ? 1 : 0, priority, category, dueDate, recurring, taskId, req.user.id]);

    // If task was completed, award coins and update plant progress
    if (completed) {
      const coinReward = priority === 'high' ? 10 : priority === 'medium' ? 5 : 2;
      
      await db.run(`
        UPDATE users 
        SET user_coins = user_coins + ? 
        WHERE id = ?
      `, [coinReward, req.user.id]);

      // Update plant progress
      await db.run(`
        UPDATE plants 
        SET tasks_completed = tasks_completed + 1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? 
        ORDER BY created_at ASC 
        LIMIT 1
      `, [req.user.id]);
    }

    const updatedTask = await db.get(`
      SELECT id, text, completed, priority, category, due_date, recurring, is_starter_task, 
             created_at, updated_at
      FROM tasks 
      WHERE id = ?
    `, [taskId]);

    await db.close();

    res.json({
      message: 'Task updated successfully',
      task: {
        id: updatedTask.id,
        text: updatedTask.text,
        completed: Boolean(updatedTask.completed),
        priority: updatedTask.priority,
        category: updatedTask.category,
        dueDate: updatedTask.due_date,
        recurring: updatedTask.recurring,
        isStarterTask: Boolean(updatedTask.is_starter_task),
        createdAt: updatedTask.created_at,
        userId: req.user.id
      }
    });

  } catch (error) {
    await db.close();
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error updating task' });
  }
});

// Toggle task completion
router.patch('/:id/toggle', auth, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    
    const taskId = req.params.id;

    // Get current task state
    const task = await db.get(
      'SELECT id, completed, priority FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.user.id]
    );

    if (!task) {
      await db.close();
      return res.status(404).json({ error: 'Task not found' });
    }

    const newCompletedState = !task.completed;

    // Update task
    await db.run(`
      UPDATE tasks 
      SET completed = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `, [newCompletedState ? 1 : 0, taskId, req.user.id]);

    // If task was completed, award coins and update plant progress
    if (newCompletedState) {
      const coinReward = task.priority === 'high' ? 10 : task.priority === 'medium' ? 5 : 2;
      
      await db.run(`
        UPDATE users 
        SET user_coins = user_coins + ? 
        WHERE id = ?
      `, [coinReward, req.user.id]);

      // Update plant progress
      await db.run(`
        UPDATE plants 
        SET tasks_completed = tasks_completed + 1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? 
        ORDER BY created_at ASC 
        LIMIT 1
      `, [req.user.id]);
    }

    await db.close();

    res.json({
      message: 'Task toggled successfully',
      completed: newCompletedState
    });

  } catch (error) {
    await db.close();
    console.error('Toggle task error:', error);
    res.status(500).json({ error: 'Server error toggling task' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    
    const taskId = req.params.id;

    // Check if task belongs to user
    const existingTask = await db.get(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.user.id]
    );

    if (!existingTask) {
      await db.close();
      return res.status(404).json({ error: 'Task not found' });
    }

    await db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.user.id]);

    await db.close();

    res.json({ message: 'Task deleted successfully' });

  } catch (error) {
    await db.close();
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error deleting task' });
  }
});

// Get task statistics
router.get('/stats', auth, async (req, res) => {
  const db = new Database();
  
  try {
    await db.connect();
    
    const today = new Date().toISOString().split('T')[0];

    const stats = await db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN due_date < ? AND completed = 0 THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN due_date = ? THEN 1 ELSE 0 END) as today
      FROM tasks 
      WHERE user_id = ?
    `, [today, today, req.user.id]);

    await db.close();

    res.json({
      stats: {
        total: stats.total || 0,
        completed: stats.completed || 0,
        overdue: stats.overdue || 0,
        today: stats.today || 0
      }
    });

  } catch (error) {
    await db.close();
    console.error('Get task stats error:', error);
    res.status(500).json({ error: 'Server error fetching task statistics' });
  }
});

module.exports = router;
