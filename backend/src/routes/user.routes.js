const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { validate, createUserSchema, updateUserSchema } = require('../middleware/validation');
const {
  getTenantUsers,
  createTenantUser,
  getUser,
  updateUser,
  deactivateUser,
  activateUser
} = require('../controllers/user.controller');

/**
 * @route   GET /api/tenants/:tenantId/users
 * @desc    Get all users for a tenant
 * @access  Tenant Admin, Platform Admin
 */
router.get(
  '/tenants/:tenantId/users',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin']),
  getTenantUsers
);

/**
 * @route   POST /api/tenants/:tenantId/users
 * @desc    Create/invite a user to a tenant
 * @access  Tenant Admin, Platform Admin
 */
router.post(
  '/tenants/:tenantId/users',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin']),
  validate(createUserSchema),
  createTenantUser
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Same tenant or Platform Admin
 */
router.get(
  '/:id',
  authenticate,
  getUser
);

/**
 * @route   PATCH /api/users/:id
 * @desc    Update user
 * @access  Tenant Admin, Platform Admin
 */
router.patch(
  '/:id',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin']),
  validate(updateUserSchema),
  updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate user
 * @access  Tenant Admin, Platform Admin
 */
router.delete(
  '/:id',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin']),
  deactivateUser
);

/**
 * @route   POST /api/users/:id/activate
 * @desc    Reactivate user
 * @access  Tenant Admin, Platform Admin
 */
router.post(
  '/:id/activate',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin']),
  activateUser
);

module.exports = router;
