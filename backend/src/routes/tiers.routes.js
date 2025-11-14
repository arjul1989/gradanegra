const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * POST /api/tiers
 * Crear un nuevo tier para una fecha
 */
router.post('/', async (req, res) => {
  try {
    const {
      fechaEventoId,
      nombre,
      descripcion,
      precio,
      cantidad,
      disponibles,
      orden = 1,
      status = 'activo'
    } = req.body;

    // Validaciones
    if (!fechaEventoId || !nombre || !precio || !cantidad) {
      return res.status(400).json({ 
        error: 'Campos requeridos: fechaEventoId, nombre, precio, cantidad' 
      });
    }

    // Verificar que la fecha existe
    const fechaDoc = await db.collection('fechasEvento').doc(fechaEventoId).get();
    if (!fechaDoc.exists) {
      return res.status(404).json({ error: 'Fecha del evento no encontrada' });
    }

    // Validar valores
    if (precio <= 0) {
      return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
    }

    if (cantidad <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    // Crear el tier
    const nuevoTier = {
      fechaEventoId,
      nombre,
      descripcion: descripcion || '',
      precio: parseInt(precio),
      cantidad: parseInt(cantidad),
      disponibles: parseInt(disponibles || cantidad),
      orden: parseInt(orden),
      status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const tierRef = await db.collection('tiers').add(nuevoTier);

    res.status(201).json({
      id: tierRef.id,
      ...nuevoTier,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al crear tier:', error);
    res.status(500).json({ error: 'Error al crear tier' });
  }
});

/**
 * GET /api/tiers/:id
 * Obtener un tier específico
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tierDoc = await db.collection('tiers').doc(id).get();
    
    if (!tierDoc.exists) {
      return res.status(404).json({ error: 'Tier no encontrado' });
    }

    res.json({ id: tierDoc.id, ...tierDoc.data() });
  } catch (error) {
    console.error('Error al obtener tier:', error);
    res.status(500).json({ error: 'Error al obtener tier' });
  }
});

/**
 * PUT /api/tiers/:id
 * Actualizar un tier
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      precio,
      cantidad,
      disponibles,
      orden,
      status
    } = req.body;

    const tierDoc = await db.collection('tiers').doc(id).get();
    if (!tierDoc.exists) {
      return res.status(404).json({ error: 'Tier no encontrado' });
    }

    const actualizacion = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (nombre !== undefined) actualizacion.nombre = nombre;
    if (descripcion !== undefined) actualizacion.descripcion = descripcion;
    if (precio !== undefined) actualizacion.precio = parseInt(precio);
    if (cantidad !== undefined) actualizacion.cantidad = parseInt(cantidad);
    if (disponibles !== undefined) actualizacion.disponibles = parseInt(disponibles);
    if (orden !== undefined) actualizacion.orden = parseInt(orden);
    if (status !== undefined) actualizacion.status = status;

    await db.collection('tiers').doc(id).update(actualizacion);

    const tierActualizado = await db.collection('tiers').doc(id).get();

    res.json({
      id: tierActualizado.id,
      ...tierActualizado.data()
    });

  } catch (error) {
    console.error('Error al actualizar tier:', error);
    res.status(500).json({ error: 'Error al actualizar tier' });
  }
});

/**
 * DELETE /api/tiers/:id
 * Eliminar un tier (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tierDoc = await db.collection('tiers').doc(id).get();
    if (!tierDoc.exists) {
      return res.status(404).json({ error: 'Tier no encontrado' });
    }

    // Verificar que no tenga boletos vendidos
    const boletosSnapshot = await db.collection('boletos')
      .where('tierId', '==', id)
      .where('status', 'in', ['vendido', 'usado'])
      .limit(1)
      .get();

    if (!boletosSnapshot.empty) {
      return res.status(400).json({ 
        error: 'No se puede eliminar un tier con boletos vendidos' 
      });
    }

    // Marcar como inactivo
    await db.collection('tiers').doc(id).update({
      status: 'inactivo',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Tier eliminado exitosamente' });

  } catch (error) {
    console.error('Error al eliminar tier:', error);
    res.status(500).json({ error: 'Error al eliminar tier' });
  }
});

/**
 * POST /api/tiers/:id/generar-boletos
 * Generar boletos individuales para un tier
 */
router.post('/:id/generar-boletos', async (req, res) => {
  try {
    const { id } = req.params;

    const tierDoc = await db.collection('tiers').doc(id).get();
    if (!tierDoc.exists) {
      return res.status(404).json({ error: 'Tier no encontrado' });
    }

    const tier = tierDoc.data();

    // Verificar si ya tiene boletos generados
    const boletosExistentes = await db.collection('boletos')
      .where('tierId', '==', id)
      .limit(1)
      .get();

    if (!boletosExistentes.empty) {
      return res.status(400).json({ 
        error: 'Este tier ya tiene boletos generados' 
      });
    }

    // Generar boletos
    const batch = db.batch();
    const boletos = [];

    for (let i = 1; i <= tier.cantidad; i++) {
      const numeroBoleto = `GN-${Date.now()}-${String(i).padStart(4, '0')}`;
      const boletoRef = db.collection('boletos').doc();
      
      const boleto = {
        tierId: id,
        numeroBoleto,
        precio: tier.precio,
        compraId: null,
        status: 'disponible',
        qrCode: null, // Se genera cuando se vende
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      batch.set(boletoRef, boleto);
      boletos.push({ id: boletoRef.id, ...boleto });
    }

    await batch.commit();

    res.status(201).json({
      message: `${tier.cantidad} boletos generados exitosamente`,
      cantidadGenerada: tier.cantidad,
      boletos: boletos.slice(0, 10) // Devolver solo los primeros 10 como ejemplo
    });

  } catch (error) {
    console.error('Error al generar boletos:', error);
    res.status(500).json({ error: 'Error al generar boletos' });
  }
});

module.exports = router;
