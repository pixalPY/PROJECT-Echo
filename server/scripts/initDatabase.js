require('dotenv').config();
const Database = require('../config/database');

async function initializeDatabase() {
  const db = new Database();
  
  try {
    await db.connect();
    console.log('Initializing database schema...');

    // Users table
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        user_theme TEXT DEFAULT 'default',
        user_coins INTEGER DEFAULT 10,
        goals TEXT, -- JSON array of user goals
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tasks table
    await db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0,
        priority TEXT DEFAULT 'medium',
        category TEXT,
        due_date DATE,
        recurring TEXT DEFAULT 'none',
        is_starter_task BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Plants table
    await db.run(`
      CREATE TABLE IF NOT EXISTS plants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        tasks_completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // User inventory table
    await db.run(`
      CREATE TABLE IF NOT EXISTS user_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_id TEXT NOT NULL,
        item_type TEXT NOT NULL, -- 'theme', 'plant', 'decoration'
        acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, item_id)
      )
    `);

    // Health data table
    await db.run(`
      CREATE TABLE IF NOT EXISTS health_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        calories_consumed INTEGER DEFAULT 0,
        calories_goal INTEGER DEFAULT 2000,
        water_glasses INTEGER DEFAULT 0,
        water_goal INTEGER DEFAULT 8,
        exercise_minutes INTEGER DEFAULT 0,
        exercise_goal INTEGER DEFAULT 30,
        sleep_hours REAL DEFAULT 0,
        sleep_goal REAL DEFAULT 8,
        date DATE NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, date)
      )
    `);

    // Sessions table for JWT token management
    await db.run(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await db.run('CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON user_inventory(user_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_health_user_date ON health_data(user_id, date)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at)');

    console.log('Database schema initialized successfully!');
    
    // Insert test user (same as frontend)
    const testUser = await db.get('SELECT id FROM users WHERE email = ?', ['test@test.com']);
    if (!testUser) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('test', 12);
      
      const result = await db.run(`
        INSERT INTO users (email, password, name, user_theme, user_coins, goals)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'test@test.com',
        hashedPassword,
        'Test User',
        'default',
        999999,
        JSON.stringify(['productive', 'healthier', 'organized'])
      ]);

      console.log('Test user created with ID:', result.id);

      // Add some owned items for test user
      const ownedItems = [
        'cactus', 'rose', 'sunflower', 'fountain-1', 'fountain-2', 
        'lantern-1', 'lantern-2', 'lantern-3', 'theme_dark', 'theme_forest'
      ];

      for (const itemId of ownedItems) {
        const itemType = itemId.startsWith('theme_') ? 'theme' : 
                        itemId.includes('fountain') || itemId.includes('lantern') ? 'decoration' : 'plant';
        
        await db.run(`
          INSERT OR IGNORE INTO user_inventory (user_id, item_id, item_type)
          VALUES (?, ?, ?)
        `, [result.id, itemId, itemType]);
      }

      // Add a test plant
      await db.run(`
        INSERT INTO plants (user_id, name, tasks_completed)
        VALUES (?, ?, ?)
      `, [result.id, 'Test Garden Rose', 25]);

      console.log('Test user data populated successfully!');
    }

  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await db.close();
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
