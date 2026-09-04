const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation
} = require('../validators/auth.validator');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new citizen account
 * @access  Public
 */
router.post('/register', validate(registerValidation), authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user login & receive JWT token
 * @access  Public
 */
router.post('/login', validate(loginValidation), authController.login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get profile details of authenticated user
 * @access  Private (Authenticated)
 */
router.get('/me', authenticateToken, authController.getMe);

/**
 * @route   PATCH /api/v1/auth/me
 * @desc    Update profile attributes (name, phone, ward) of authenticated user
 * @access  Private (Authenticated)
 */
router.patch('/me', authenticateToken, validate(updateProfileValidation), authController.updateMe);

/**
 * @route   PATCH /api/v1/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private (Authenticated)
 */
router.patch('/change-password', authenticateToken, validate(changePasswordValidation), authController.changePassword);

module.exports = router;
