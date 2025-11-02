const express = require('express');
const router = express.Router();
const { authenticate, requireRole, requirePermission } = require('../middleware/auth');
const { validate, createEventSchema, updateEventSchema } = require('../middleware/validation');
const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,
  cancelEvent,
  getEventStats
} = require('../controllers/event.controller');
const { getEventTickets } = require('../controllers/ticket.controller');

/**
 * @route   POST /api/events
 * @desc    Create a new event
 * @access  Tenant Admin, Operations (with manage_events permission)
 */
router.post(
  '/',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin', 'operations']),
  requirePermission('manage_events'),
  validate(createEventSchema),
  createEvent
);

/**
 * @route   GET /api/events
 * @desc    Get all events (filtered by tenant for non-platform admins)
 * @access  All authenticated users
 */
router.get(
  '/',
  authenticate,
  getEvents
);

/**
 * @route   GET /api/events/:id
 * @desc    Get event by ID
 * @access  All authenticated users (with tenant access)
 */
router.get(
  '/:id',
  authenticate,
  getEvent
);

/**
 * @route   PATCH /api/events/:id
 * @desc    Update event
 * @access  Tenant Admin, Operations (with manage_events permission)
 */
router.patch(
  '/:id',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin', 'operations']),
  requirePermission('manage_events'),
  validate(updateEventSchema),
  updateEvent
);

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete event (soft delete - cancel)
 * @access  Tenant Admin only
 */
router.delete(
  '/:id',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin']),
  deleteEvent
);

/**
 * @route   POST /api/events/:id/publish
 * @desc    Publish event (make it available for ticket sales)
 * @access  Tenant Admin only
 */
router.post(
  '/:id/publish',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin']),
  publishEvent
);

/**
 * @route   PATCH /api/events/:id/unpublish
 * @desc    Unpublish event (change status back to draft)
 * @access  Tenant Admin only
 */
router.patch(
  '/:id/unpublish',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin']),
  unpublishEvent
);

/**
 * @route   PATCH /api/events/:id/cancel
 * @desc    Cancel event permanently (with reason)
 * @access  Tenant Admin only
 */
router.patch(
  '/:id/cancel',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin']),
  cancelEvent
);

/**
 * @route   GET /api/events/:id/stats
 * @desc    Get event statistics and availability
 * @access  All authenticated users (with tenant access)
 */
router.get(
  '/:id/stats',
  authenticate,
  getEventStats
);

/**
 * @route   GET /api/events/:eventId/tickets
 * @desc    Get all tickets for an event
 * @access  Tenant Admin, Operations, Finance (with manage_tickets permission)
 */
router.get(
  '/:eventId/tickets',
  authenticate,
  requirePermission('manage_tickets'),
  getEventTickets
);

module.exports = router;
