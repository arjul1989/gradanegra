const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { sendEventReminders, sendSingleEventReminder } = require('../jobs/event-reminders');
const logger = require('../utils/logger');

/**
 * @route   POST /api/jobs/reminders
 * @desc    Trigger event reminders job manually
 * @access  Platform Admin only
 */
router.post(
  '/reminders',
  authenticate,
  requireRole(['platform_admin']),
  async (req, res) => {
    try {
      logger.info(`Job de recordatorios iniciado manualmente por usuario ${req.user.uid}`);
      
      // Ejecutar el job de manera asíncrona
      sendEventReminders()
        .then(result => {
          logger.info('Job de recordatorios completado:', result);
        })
        .catch(error => {
          logger.error('Error en job de recordatorios:', error);
        });

      res.json({
        success: true,
        message: 'Job de recordatorios iniciado en background'
      });

    } catch (error) {
      logger.error(`Error triggering reminders job: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/jobs/reminders/:eventId
 * @desc    Send reminder for a specific event manually
 * @access  Platform Admin, Tenant Admin
 */
router.post(
  '/reminders/:eventId',
  authenticate,
  requireRole(['platform_admin', 'tenant_admin']),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      
      logger.info(`Recordatorio manual para evento ${eventId} por usuario ${req.user.uid}`);
      
      const result = await sendSingleEventReminder(eventId);

      res.json({
        success: true,
        message: 'Recordatorios enviados',
        data: result
      });

    } catch (error) {
      logger.error(`Error sending event reminder: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/jobs/webhook/reminders
 * @desc    Webhook endpoint for Cloud Scheduler (no auth required, use secret)
 * @access  Public with secret validation
 */
router.post(
  '/webhook/reminders',
  async (req, res) => {
    try {
      // Validar secret de Cloud Scheduler
      const schedulerSecret = req.headers['x-scheduler-secret'];
      if (schedulerSecret !== process.env.SCHEDULER_SECRET) {
        logger.warn('Intento de acceso no autorizado al webhook de recordatorios');
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      logger.info('Job de recordatorios iniciado por Cloud Scheduler');
      
      // Ejecutar el job
      const result = await sendEventReminders();

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error(`Error in reminders webhook: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

module.exports = router;
