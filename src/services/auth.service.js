const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Format user model to a safe JSON representation (excluding passwordHash)
 */
const formatSafeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    departmentId: user.departmentId || null,
    ward: user.ward || null,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * Register a new citizen account
 */
const registerCitizen = async ({ name, email, password, phone, ward }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Application-level check for duplicate email
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  // Hash password using bcryptjs
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user enforcing CITIZEN role and null department
  const newUser = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    phone: phone ? phone.trim() : null,
    ward: ward ? ward.trim() : null,
    role: 'CITIZEN',
    departmentId: null,
    isActive: true
  });

  return formatSafeUser(newUser);
};

/**
 * Authenticate user login credentials & generate JWT
 */
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Find user by email
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Verify account is active
  if (!user.isActive) {
    const error = new Error('Your account is inactive');
    error.statusCode = 403;
    throw error;
  }

  // Compare password against stored hash
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT signed token with minimal payload
  const payload = {
    userId: user._id,
    role: user.role
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      ward: user.ward || null,
      departmentId: user.departmentId || null
    }
  };
};

/**
 * Get current authenticated user profile
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return formatSafeUser(user);
};

/**
 * Update authenticated user profile fields
 */
const updateUserProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Allow updating only safe attributes
  if (updateData.name !== undefined) user.name = updateData.name.trim();
  if (updateData.phone !== undefined) user.phone = updateData.phone ? updateData.phone.trim() : null;
  if (updateData.ward !== undefined) user.ward = updateData.ward ? updateData.ward.trim() : null;

  await user.save();
  return formatSafeUser(user);
};

/**
 * Change authenticated user password
 */
const changeUserPassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 400;
    throw error;
  }

  // Hash and update to new password
  const saltRounds = 10;
  user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
  await user.save();

  return { message: 'Password changed successfully' };
};

module.exports = {
  registerCitizen,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changeUserPassword
};
