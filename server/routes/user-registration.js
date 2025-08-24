const express = require('express');
const { body, validationResult } = require('express-validator');
const userService = require('../services/userService');

const router = express.Router();

// Validation middleware
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('displayName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
];

/**
 * @route POST /api/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, displayName, firstName, lastName, phoneNumber, ...otherData } = req.body;

    // Prepare additional data for Firestore
    const additionalData = {
      firstName: firstName || '',
      lastName: lastName || '',
      phoneNumber: phoneNumber || '',
      registrationSource: 'api',
      ...otherData
    };

    // Create user using the service
    const result = await userService.createUser(
      { email, password, displayName },
      additionalData
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: result.user
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    if (error.code === 'auth/weak-password') {
      return res.status(400).json({
        success: false,
        message: 'Password is too weak'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

/**
 * @route GET /api/users/info/:uid
 * @desc Get user information
 * @access Private
 */
router.get('/users/info/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const userInfo = await userService.getUserInfo(uid);

    if (!userInfo) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: userInfo
    });

  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route PUT /api/users/info/:uid
 * @desc Update user information
 * @access Private
 */
router.put('/users/info/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.uid;
    delete updateData.email;
    delete updateData.createdAt;

    const result = await userService.updateUserInfo(uid, updateData);

    res.json({
      success: true,
      message: 'User information updated successfully'
    });

  } catch (error) {
    console.error('Update user info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route DELETE /api/users/:uid
 * @desc Delete user account
 * @access Private
 */
router.delete('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const result = await userService.deleteUser(uid);

    res.json({
      success: true,
      message: 'User account deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/users/verify/:uid
 * @desc Verify user exists and get their info
 * @access Private
 */
router.get('/users/verify/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const userData = await userService.verifyUser(uid);

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Verify user error:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/users/all
 * @desc Get all users in the collection (for admin purposes)
 * @access Private
 */
router.get('/users/all', async (req, res) => {
  try {
    const users = await userService.listAllUsersInCollection();

    res.json({
      success: true,
      count: users.length,
      users: users
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
