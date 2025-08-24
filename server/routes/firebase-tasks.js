const express = require('express');
const { verifyFirebaseToken } = require('../config/firebase');
const firebaseService = require('../services/firebaseService');
const { validateTask } = require('../middleware/validation');

const router = express.Router();

// Get all tasks for user
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const tasks = await firebaseService.getTasks(req.user.uid);
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
});

// Create new task
router.post('/', verifyFirebaseToken, validateTask, async (req, res) => {
  try {
    const { text, priority, category, dueDate, recurring } = req.body;
    
    const taskData = {
      text,
      priority: priority || 'medium',
      category: category || '',
      dueDate: dueDate || '',
      recurring: recurring || 'none'
    };
    
    const newTask = await firebaseService.createTask(req.user.uid, taskData);
    
    res.status(201).json({
      message: 'Task created successfully',
      task: newTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error creating task' });
  }
});

// Update task
router.put('/:id', verifyFirebaseToken, validateTask, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { text, completed, priority, category, dueDate, recurring } = req.body;
    
    const updates = {
      text,
      completed: Boolean(completed),
      priority,
      category,
      dueDate,
      recurring
    };
    
    await firebaseService.updateTask(req.user.uid, taskId, updates);
    
    res.json({
      message: 'Task updated successfully',
      taskId,
      updates
    });
  } catch (error) {
    console.error('Update task error:', error);
    
    if (error.message.includes('not found') || error.message.includes('No document')) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.status(500).json({ error: 'Server error updating task' });
  }
});

// Toggle task completion
router.patch('/:id/toggle', verifyFirebaseToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Get current task to determine new completion state
    const tasks = await firebaseService.getTasks(req.user.uid);
    const currentTask = tasks.find(task => task.id === taskId);
    
    if (!currentTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const newCompletedState = !currentTask.completed;
    
    await firebaseService.updateTask(req.user.uid, taskId, {
      completed: newCompletedState,
      priority: currentTask.priority // Pass priority for coin calculation
    });
    
    res.json({
      message: 'Task toggled successfully',
      taskId,
      completed: newCompletedState
    });
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ error: 'Server error toggling task' });
  }
});

// Delete task
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    await firebaseService.deleteTask(req.user.uid, taskId);
    
    res.json({
      message: 'Task deleted successfully',
      taskId
    });
  } catch (error) {
    console.error('Delete task error:', error);
    
    if (error.message.includes('not found') || error.message.includes('No document')) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.status(500).json({ error: 'Server error deleting task' });
  }
});

// Get task statistics
router.get('/stats', verifyFirebaseToken, async (req, res) => {
  try {
    const stats = await firebaseService.getTaskStats(req.user.uid);
    res.json({ stats });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ error: 'Server error fetching task statistics' });
  }
});

// Bulk operations
router.post('/bulk', verifyFirebaseToken, async (req, res) => {
  try {
    const { operation, taskIds, updates } = req.body;
    
    if (!operation || !taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({ error: 'Invalid bulk operation request' });
    }
    
    const results = [];
    
    switch (operation) {
      case 'complete':
        for (const taskId of taskIds) {
          try {
            await firebaseService.updateTask(req.user.uid, taskId, { completed: true });
            results.push({ taskId, success: true });
          } catch (error) {
            results.push({ taskId, success: false, error: error.message });
          }
        }
        break;
        
      case 'delete':
        for (const taskId of taskIds) {
          try {
            await firebaseService.deleteTask(req.user.uid, taskId);
            results.push({ taskId, success: true });
          } catch (error) {
            results.push({ taskId, success: false, error: error.message });
          }
        }
        break;
        
      case 'update':
        if (!updates) {
          return res.status(400).json({ error: 'Updates object required for bulk update' });
        }
        
        for (const taskId of taskIds) {
          try {
            await firebaseService.updateTask(req.user.uid, taskId, updates);
            results.push({ taskId, success: true });
          } catch (error) {
            results.push({ taskId, success: false, error: error.message });
          }
        }
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid bulk operation' });
    }
    
    res.json({
      message: `Bulk ${operation} operation completed`,
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  } catch (error) {
    console.error('Bulk operation error:', error);
    res.status(500).json({ error: 'Server error during bulk operation' });
  }
});

// Search tasks
router.get('/search', verifyFirebaseToken, async (req, res) => {
  try {
    const { query, category, priority, completed, limit = 50 } = req.query;
    
    const allTasks = await firebaseService.getTasks(req.user.uid);
    
    let filteredTasks = allTasks;
    
    // Apply filters
    if (query) {
      const searchQuery = query.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.text.toLowerCase().includes(searchQuery) ||
        (task.category && task.category.toLowerCase().includes(searchQuery))
      );
    }
    
    if (category) {
      filteredTasks = filteredTasks.filter(task => task.category === category);
    }
    
    if (priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === priority);
    }
    
    if (completed !== undefined) {
      const isCompleted = completed === 'true';
      filteredTasks = filteredTasks.filter(task => task.completed === isCompleted);
    }
    
    // Limit results
    const limitNum = parseInt(limit);
    if (limitNum > 0) {
      filteredTasks = filteredTasks.slice(0, limitNum);
    }
    
    res.json({
      tasks: filteredTasks,
      total: filteredTasks.length,
      query: { query, category, priority, completed, limit }
    });
  } catch (error) {
    console.error('Search tasks error:', error);
    res.status(500).json({ error: 'Server error searching tasks' });
  }
});

module.exports = router;
