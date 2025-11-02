const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { validate, createTenantSchema, updateTenantSchema, createTenantAdminSchema } = require('../middleware/validation');
const {
  createTenant,
  getTenants,
  getTenant,
  updateTenant,
  deleteTenant,
  createTenantAdmin,
  getTenantStats,
  getTenantDashboard,
  getTenantEvents
} = require('../controllers/tenant.controller');

/**
 * @route   POST /api/tenants
 * @desc    Create a new tenant
 * @access  Platform Admin
 */
router.post(
  '/',
  authenticate,
  requireRole(['platform_admin']),
  validate(createTenantSchema),
  createTenant
);

/**
 * @route   GET /api/tenants
 * @desc    Get all tenants
 * @access  Platform Admin
 */
router.get(
  '/',
  authenticate,
  requireRole(['platform_admin']),
  getTenants
);

/**
 * @route   GET /api/tenants/:id
 * @desc    Get tenant by ID
 * @access  Platform Admin, Tenant Admin (own tenant only)
 */
router.get(
  '/:id',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin']),
  getTenant
);

/**
 * @route   PATCH /api/tenants/:id
 * @desc    Update tenant
 * @access  Platform Admin, Tenant Admin (own tenant only, limited fields)
 */
router.patch(
  '/:id',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin']),
  validate(updateTenantSchema),
  updateTenant
);

/**
 * @route   DELETE /api/tenants/:id
 * @desc    Delete tenant (soft delete)
 * @access  Platform Admin
 */
router.delete(
  '/:id',
  authenticate,
  requireRole(['platform_admin']),
  deleteTenant
);

/**
 * @route   POST /api/tenants/:id/admins
 * @desc    Create admin for tenant
 * @access  Platform Admin
 */
router.post(
  '/:id/admins',
  authenticate,
  requireRole(['platform_admin']),
  validate(createTenantAdminSchema),
  createTenantAdmin
);

/**
 * @route   GET /api/tenants/:id/stats
 * @desc    Get tenant statistics
 * @access  Platform Admin, Tenant Admin (own tenant only)
 */
router.get(
  '/:id/stats',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin']),
  getTenantStats
);

/**
 * @route   GET /api/tenants/:id/dashboard
 * @desc    Get tenant dashboard with overview and metrics
 * @access  Platform Admin, Tenant Admin (own tenant only)
 */
router.get(
  '/:id/dashboard',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin', 'finance']),
  getTenantDashboard
);

/**
 * @route   GET /api/tenants/:id/events
 * @desc    Get all events for a tenant
 * @access  Platform Admin, Tenant Admin (own tenant only)
 */
router.get(
  '/:id/events',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin', 'finance', 'operations']),
  getTenantEvents
);

module.exports = router;
