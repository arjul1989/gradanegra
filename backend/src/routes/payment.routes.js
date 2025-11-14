const express = require('express');
const router = express.Router();
const {
  getConfig,
  getPaymentMethods,
  getPSEBanks,
  createPreference,
  processDirectPayment,
  webhook,
  ipn,
  getPayment,
  getPaymentsByComercio,
  simulateWebhook
} = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route   GET /api/payments/config
 * @desc    Obtener Public Key de Mercado Pago
 * @access  Public
 */
router.get('/config', getConfig);

/**
 * @route   GET /api/payments/methods
 * @desc    Obtener métodos de pago disponibles
 * @access  Public
 */
router.get('/methods', getPaymentMethods);

/**
 * @route   GET /api/payments/pse-banks
 * @desc    Obtener bancos disponibles para PSE
 * @access  Public
 */
router.get('/pse-banks', getPSEBanks);

/**
 * @route   POST /api/payments/create-preference
 * @desc    Crear preferencia de pago en Mercado Pago
 * @access  Public
 */
router.post('/create-preference', createPreference);

/**
 * @route   POST /api/payments/process
 * @desc    Procesar pago directamente con API de Mercado Pago
 * @access  Public
 */
router.post('/process', processDirectPayment);

/**
 * @route   POST /api/payments/webhook
 * @desc    Webhook de Mercado Pago (notificaciones de pago)
 * @access  Public (validado por MP)
 */
router.post('/webhook', webhook);

/**
 * @route   POST /api/payments/ipn
 * @desc    IPN de Mercado Pago (Instant Payment Notification)
 * @access  Public (validado por MP)
 */
router.post('/ipn', ipn);

/**
 * @route   GET /api/payments/:id
 * @desc    Obtener estado de un pago
 * @access  Private
 */
router.get('/:id', authMiddleware, getPayment);

/**
 * @route   GET /api/payments/comercio/:comercioId
 * @desc    Obtener pagos de un comercio
 * @access  Private
 */
router.get('/comercio/:comercioId', authMiddleware, getPaymentsByComercio);

/**
 * @route   POST /api/payments/simulate-webhook
 * @desc    Simular webhook de Mercado Pago (solo para testing local)
 * @access  Public (solo en desarrollo)
 */
router.post('/simulate-webhook', simulateWebhook);

module.exports = router;

