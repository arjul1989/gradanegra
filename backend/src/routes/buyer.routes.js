const express = require('express');
const router = express.Router();
const { authenticateBuyer } = require('../middleware/auth');
const {
  registerBuyer,
  googleAuth,
  loginBuyer,
  getMyProfile,
  updateMyProfile,
  getMyTickets,
  getMyTicket,
  resendMyTicketEmail,
  deleteMyAccount
} = require('../controllers/buyer.controller');

/**
 * @route   POST /api/buyers/register
 * @desc    Registrar nuevo comprador con email/password
 * @access  Public
 */
router.post('/register', registerBuyer);

/**
 * @route   POST /api/buyers/login
 * @desc    Login con email/password (enviar idToken de Firebase)
 * @access  Public
 */
router.post('/login', loginBuyer);

/**
 * @route   POST /api/buyers/auth/google
 * @desc    Autenticación con Google OAuth
 * @access  Public
 */
router.post('/auth/google', googleAuth);

/**
 * @route   GET /api/buyers/me
 * @desc    Obtener perfil del comprador autenticado
 * @access  Buyer (authenticated)
 */
router.get('/me', authenticateBuyer, getMyProfile);

/**
 * @route   PATCH /api/buyers/me
 * @desc    Actualizar perfil del comprador
 * @access  Buyer (authenticated)
 */
router.patch('/me', authenticateBuyer, updateMyProfile);

/**
 * @route   DELETE /api/buyers/me
 * @desc    Eliminar cuenta de comprador
 * @access  Buyer (authenticated)
 */
router.delete('/me', authenticateBuyer, deleteMyAccount);

/**
 * @route   GET /api/buyers/me/tickets
 * @desc    Obtener todos los tickets del comprador
 * @access  Buyer (authenticated)
 */
router.get('/me/tickets', authenticateBuyer, getMyTickets);

/**
 * @route   GET /api/buyers/me/tickets/:id
 * @desc    Obtener detalle de un ticket
 * @access  Buyer (authenticated)
 */
router.get('/me/tickets/:id', authenticateBuyer, getMyTicket);

/**
 * @route   POST /api/buyers/me/tickets/:id/resend
 * @desc    Reenviar email de un ticket
 * @access  Buyer (authenticated)
 */
router.post('/me/tickets/:id/resend', authenticateBuyer, resendMyTicketEmail);

module.exports = router;
