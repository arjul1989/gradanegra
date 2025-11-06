const { db } = require('../config/firebase');

/**
 * Controlador de Categorías
 */

/**
 * @route GET /api/categorias
 * @desc Obtener todas las categorías activas
 */
const getCategorias = async (req, res) => {
  try {
    const categoriasSnapshot = await db.collection('categorias')
      .where('status', '==', 'activa')
      .get();

    if (categoriasSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron categorías'
      });
    }

    const categorias = categoriasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({
      success: true,
      count: categorias.length,
      data: categorias
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error.message
    });
  }
};

/**
 * @route GET /api/categorias/:slug
 * @desc Obtener categoría por slug
 */
const getCategoriaBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const categoriaSnapshot = await db.collection('categorias')
      .where('slug', '==', slug)
      .where('status', '==', 'activa')
      .limit(1)
      .get();

    if (categoriaSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const categoria = {
      id: categoriaSnapshot.docs[0].id,
      ...categoriaSnapshot.docs[0].data()
    };

    res.status(200).json({
      success: true,
      data: categoria
    });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría',
      error: error.message
    });
  }
};

module.exports = {
  getCategorias,
  getCategoriaBySlug
};
