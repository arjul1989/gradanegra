const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { authenticate, requireRole, requirePermission, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// Validación para crear tickets
const createTicketsSchema = Joi.object({
  eventId: Joi.string().required(),
  tierId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).max(50).default(1),
  purchaseId: Joi.string(),
  sendEmail: Joi.boolean().default(true), // Por defecto envía email
  buyer: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string(),
    documentId: Joi.string()
  }).required()
});

// Crear tickets
// Public con autenticación opcional - permite compras anónimas y autenticadas
router.post(
  '/',
  optionalAuth, // Autenticación opcional - vincula con buyer si está logueado
  validate(createTicketsSchema),
  ticketController.createTickets
);

// Obtener ticket por ID
router.get(
  '/:id',
  authenticate,
  requirePermission('manage_tickets'),
  ticketController.getTicket
);

// Obtener ticket por número
router.get(
  '/number/:ticketNumber',
  authenticate,
  ticketController.getTicketByNumber
);

// Validar ticket por ID
router.post(
  '/:id/validate',
  authenticate,
  requirePermission('validate_tickets'),
  ticketController.validateTicket
);

// Validar ticket por número
router.post(
  '/validate/:ticketNumber',
  authenticate,
  requirePermission('validate_tickets'),
  ticketController.validateTicketByNumber
);

// Cancelar ticket
router.delete(
  '/:id',
  authenticate,
  requirePermission('manage_tickets'),
  ticketController.cancelTicket
);

// Regenerar QR code
router.post(
  '/:id/regenerate-qr',
  authenticate,
  requirePermission('manage_tickets'),
  ticketController.regenerateQR
);

// Enviar ticket por email
router.post(
  '/:id/send-email',
  authenticate,
  requirePermission('manage_tickets'),
  ticketController.sendTicketByEmail
);

// Generar y descargar Apple Wallet pass
router.get(
  '/:id/apple-wallet',
  authenticate,
  ticketController.generateAppleWallet
);

// Obtener tickets de un comprador
router.get(
  '/buyer/:email',
  authenticate,
  ticketController.getBuyerTickets
);

module.exports = router;
