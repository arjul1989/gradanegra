const express = require('express');
const router = express.Router();
const {
  getCategorias,
  getCategoriaBySlug
} = require('../controllers/categoria.controller');

/**
 * @route   GET /api/categorias
 * @desc    Obtener todas las categorías activas
 * @access  Public
 */
router.get('/', getCategorias);

/**
 * @route   GET /api/categorias/:slug
 * @desc    Obtener categoría por slug
 * @access  Public
 */
router.get('/:slug', getCategoriaBySlug);

module.exports = router;
