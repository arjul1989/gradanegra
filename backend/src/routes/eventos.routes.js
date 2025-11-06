const express = require('express');
const router = express.Router();
const {
  getEventosDestacados,
  getEventos,
  getEventoById,
  getDisponibilidad,
  getEventosByCategoria
} = require('../controllers/eventos.controller');

/**
 * @route   GET /api/eventos/destacados
 * @desc    Obtener eventos destacados para el carrusel
 * @access  Public
 */
router.get('/destacados', getEventosDestacados);

/**
 * @route   GET /api/eventos/categoria/:slug
 * @desc    Obtener eventos por categoría
 * @access  Public
 */
router.get('/categoria/:slug', getEventosByCategoria);

/**
 * @route   GET /api/eventos/:id/disponibilidad
 * @desc    Obtener disponibilidad de un evento
 * @access  Public
 */
router.get('/:id/disponibilidad', getDisponibilidad);

/**
 * @route   GET /api/eventos/:id
 * @desc    Obtener detalle de un evento
 * @access  Public
 */
router.get('/:id', getEventoById);

/**
 * @route   GET /api/eventos
 * @desc    Buscar eventos con filtros (ciudad, categoria)
 * @access  Public
 */
router.get('/', getEventos);

module.exports = router;
