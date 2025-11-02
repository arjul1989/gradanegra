const { getAuth } = require('../config/firebase');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Register a new user
 * Creates both Firebase Auth user and database record
 */
async function register(req, res) {
  try {
    const { email, password, name, role, tenantId } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email, password, name, and role are required'
      });
    }

    // Validate role
    const validRoles = ['platform_admin', 'tenant_admin', 'finance', 'operations'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid role'
      });
    }

    // Tenant users must have tenantId
    if (role !== 'platform_admin' && !tenantId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Tenant ID is required for tenant users'
      });
    }

    // Check if user already exists in database
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists'
      });
    }

    // Create Firebase Auth user
    const auth = getAuth();
    const firebaseUser = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false
    });

    // Create user in database
    const user = new User({
      email,
      name,
      role,
      tenantId: role === 'platform_admin' ? null : tenantId,
      firebaseUid: firebaseUser.uid,
      active: true
    });

    await user.save();

    logger.info(`User registered: ${email} (${role})`);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON()
    });
  } catch (error) {
    logger.error('Registration error:', error);

    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already in use'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register user'
    });
  }
}

/**
 * Login user
 * Note: Actual authentication happens on client side with Firebase
 * This endpoint is for getting user data after Firebase login
 */
async function login(req, res) {
  try {
    const { firebaseUid } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Firebase UID is required'
      });
    }

    // Get user from database
    const user = await User.findByFirebaseUid(firebaseUid);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    if (!user.active) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Account is deactivated'
      });
    }

    logger.info(`User logged in: ${user.email}`);

    res.json({
      message: 'Login successful',
      user: user.toJSON()
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to login'
    });
  }
}

/**
 * Get current user info
 */
async function getMe(req, res) {
  try {
    // User is already attached by authenticate middleware
    res.json({
      user: req.user.toJSON()
    });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user info'
    });
  }
}

/**
 * Refresh token
 * Note: Token refresh is handled by Firebase SDK on client side
 * This is a placeholder for future custom token logic
 */
async function refreshToken(req, res) {
  res.status(501).json({
    message: 'Token refresh is handled by Firebase SDK on client side'
  });
}

/**
 * Update user profile
 */
async function updateProfile(req, res) {
  try {
    const { name } = req.body;
    const user = req.user;

    if (name) {
      await user.update({ name });
      
      // Also update Firebase Auth
      const auth = getAuth();
      await auth.updateUser(user.firebaseUid, { displayName: name });
    }

    logger.info(`User profile updated: ${user.email}`);

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile'
    });
  }
}

/**
 * Change password
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Current and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password must be at least 6 characters'
      });
    }

    // Update password in Firebase Auth
    const auth = getAuth();
    await auth.updateUser(req.user.firebaseUid, {
      password: newPassword
    });

    logger.info(`Password changed for user: ${req.user.email}`);

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to change password'
    });
  }
}

module.exports = {
  register,
  login,
  getMe,
  refreshToken,
  updateProfile,
  changePassword
};
