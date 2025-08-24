const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('goals')
    .optional()
    .isArray()
    .withMessage('Goals must be an array'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateTask = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Task text must be between 1 and 500 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('recurring')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly'])
    .withMessage('Recurring must be none, daily, weekly, or monthly'),
  handleValidationErrors
];

const validateTheme = [
  body('theme')
    .isIn(['default', 'theme_dark', 'theme_forest', 'theme_ocean', 'theme_sunset', 'theme_space'])
    .withMessage('Invalid theme selection'),
  handleValidationErrors
];

const validateHealthData = [
  body('caloriesConsumed')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Calories consumed must be between 0 and 10000'),
  body('caloriesGoal')
    .optional()
    .isInt({ min: 500, max: 5000 })
    .withMessage('Calories goal must be between 500 and 5000'),
  body('waterGlasses')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Water glasses must be between 0 and 50'),
  body('waterGoal')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Water goal must be between 1 and 20'),
  body('exerciseMinutes')
    .optional()
    .isInt({ min: 0, max: 600 })
    .withMessage('Exercise minutes must be between 0 and 600'),
  body('exerciseGoal')
    .optional()
    .isInt({ min: 1, max: 300 })
    .withMessage('Exercise goal must be between 1 and 300'),
  body('sleepHours')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('Sleep hours must be between 0 and 24'),
  body('sleepGoal')
    .optional()
    .isFloat({ min: 1, max: 12 })
    .withMessage('Sleep goal must be between 1 and 12'),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateTask,
  validateTheme,
  validateHealthData,
  handleValidationErrors
};
