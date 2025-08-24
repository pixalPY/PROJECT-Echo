# PROJECT:Echo Backend API

A robust Node.js/Express backend for the PROJECT:Echo task management application with SQLite database, JWT authentication, and comprehensive API endpoints.

## 🚀 Features

- **User Authentication**: JWT-based auth with secure password hashing
- **Task Management**: Full CRUD operations for tasks with filtering and statistics
- **Theme System**: Persistent user theme preferences
- **Plant Garden**: Virtual plant growth based on task completion
- **Health Tracking**: Daily health metrics and goal tracking
- **Inventory System**: User coins, purchases, and item management
- **Security**: Rate limiting, CORS, helmet, input validation
- **Database**: SQLite with proper schema and relationships

## 📦 Installation

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file with your configuration.

4. **Initialize database:**
   ```bash
   npm run init-db
   ```

5. **Start the server:**
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Environment Variables

Create a `.env` file in the server directory:

```env
NODE_ENV=development
PORT=3001
DB_PATH=./database/project_echo.db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_SALT_ROUNDS=12
```

## 📚 API Documentation

### Authentication Endpoints

#### `POST /api/auth/register`
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "goals": ["productive", "healthier"]
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "userTheme": "default",
    "userCoins": 10,
    "goals": ["productive", "healthier"]
  }
}
```

#### `POST /api/auth/login`
Login with existing credentials.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### `POST /api/auth/logout`
Logout and invalidate session (requires auth token).

#### `GET /api/auth/profile`
Get current user profile (requires auth token).

### Task Endpoints

#### `GET /api/tasks`
Get all tasks for authenticated user.

**Response:**
```json
{
  "tasks": [
    {
      "id": 1,
      "text": "Complete project documentation",
      "completed": false,
      "priority": "high",
      "category": "Work",
      "dueDate": "2024-01-15",
      "recurring": "none",
      "isStarterTask": false,
      "createdAt": "2024-01-10T10:00:00Z",
      "userId": 1
    }
  ]
}
```

#### `POST /api/tasks`
Create a new task.

**Request:**
```json
{
  "text": "Buy groceries",
  "priority": "medium",
  "category": "Personal",
  "dueDate": "2024-01-12",
  "recurring": "weekly"
}
```

#### `PUT /api/tasks/:id`
Update an existing task.

#### `PATCH /api/tasks/:id/toggle`
Toggle task completion status.

#### `DELETE /api/tasks/:id`
Delete a task.

#### `GET /api/tasks/stats`
Get task statistics for the user.

### User Endpoints

#### `PATCH /api/users/theme`
Update user's theme preference.

**Request:**
```json
{
  "theme": "theme_dark"
}
```

#### `GET /api/users/inventory`
Get user's inventory items.

#### `POST /api/users/inventory/purchase`
Purchase an item with coins.

**Request:**
```json
{
  "itemId": "theme_dark",
  "itemType": "theme",
  "price": 20
}
```

#### `GET /api/users/plants`
Get user's plants.

#### `POST /api/users/plants`
Add a new plant.

#### `GET /api/users/health/:date`
Get health data for a specific date (YYYY-MM-DD format).

#### `PUT /api/users/health/:date`
Update health data for a specific date.

**Request:**
```json
{
  "caloriesConsumed": 1800,
  "caloriesGoal": 2000,
  "waterGlasses": 6,
  "waterGoal": 8,
  "exerciseMinutes": 30,
  "exerciseGoal": 30,
  "sleepHours": 7.5,
  "sleepGoal": 8
}
```

## 🗄️ Database Schema

### Tables

- **users**: User accounts with authentication and preferences
- **tasks**: Task management with categories, priorities, and due dates
- **plants**: Virtual plants that grow with task completion
- **user_inventory**: Items owned by users (themes, decorations, etc.)
- **health_data**: Daily health metrics and goals
- **user_sessions**: JWT session management

### Relationships

- Users have many tasks, plants, inventory items, and health records
- All user data is properly linked with foreign keys
- Cascade deletion ensures data consistency

## 🔒 Security Features

- **Password Hashing**: bcrypt with configurable salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable cross-origin policies
- **Helmet**: Security headers and protections
- **SQL Injection Prevention**: Parameterized queries

## 🧪 Testing

Test the API with the included test user:
- **Email**: `test@test.com`
- **Password**: `test`
- **Features**: Pre-loaded with coins, items, and plants

## 📊 Monitoring

- Health check endpoint: `GET /health`
- API documentation: `GET /api`
- Request logging in development mode
- Error tracking and reporting

## 🚀 Deployment

1. Set `NODE_ENV=production`
2. Update JWT secret and other sensitive config
3. Configure proper CORS origins
4. Set up process manager (PM2, systemd, etc.)
5. Configure reverse proxy (nginx, Apache)
6. Set up SSL/TLS certificates

## 📝 Development

```bash
# Install dependencies
npm install

# Install dev dependencies
npm install --only=dev

# Run in development mode
npm run dev

# Initialize/reset database
npm run init-db
```

## 🤝 Contributing

1. Follow existing code style and patterns
2. Add proper error handling and validation
3. Include appropriate logging
4. Test endpoints thoroughly
5. Update documentation for any API changes

## 📄 License

MIT License - see LICENSE file for details.
