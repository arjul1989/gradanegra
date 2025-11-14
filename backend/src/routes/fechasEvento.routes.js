const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * POST /api/fechasEvento
 * Crear una nueva fecha para un evento
 */
router.post('/', async (req, res) => {
  try {
    const {
      eventoId,
      fecha,
      horaInicio,
      horaFin,
      aforoTotal,
      aforoDisponible,
      status = 'activa'
    } = req.body;

    // Validaciones
    if (!eventoId || !fecha || !horaInicio || !aforoTotal) {
      return res.status(400).json({ 
        error: 'Campos requeridos: eventoId, fecha, horaInicio, aforoTotal' 
      });
    }

    // Verificar que el evento existe
    const eventoDoc = await db.collection('eventos').doc(eventoId).get();
    if (!eventoDoc.exists) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Validar que aforoTotal sea un número positivo
    if (aforoTotal <= 0) {
      return res.status(400).json({ error: 'El aforo debe ser mayor a 0' });
    }

    // Crear la fecha del evento
    const nuevaFecha = {
      eventoId,
      fecha, // YYYY-MM-DD
      horaInicio, // HH:MM
      horaFin: horaFin || null,
      aforoTotal: parseInt(aforoTotal),
      aforoDisponible: parseInt(aforoDisponible || aforoTotal),
      status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const fechaRef = await db.collection('fechasEvento').add(nuevaFecha);

    res.status(201).json({
      id: fechaRef.id,
      ...nuevaFecha,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al crear fecha evento:', error);
    res.status(500).json({ error: 'Error al crear fecha del evento' });
  }
});

/**
 * GET /api/fechasEvento/:id
 * Obtener una fecha específica con sus tiers
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const fechaDoc = await db.collection('fechasEvento').doc(id).get();
    
    if (!fechaDoc.exists) {
      return res.status(404).json({ error: 'Fecha no encontrada' });
    }

    const fecha = { id: fechaDoc.id, ...fechaDoc.data() };

    // Obtener tiers de esta fecha
    const tiersSnapshot = await db.collection('tiers')
      .where('fechaEventoId', '==', id)
      .where('status', '!=', 'inactivo')
      .orderBy('status')
      .orderBy('orden', 'asc')
      .get();

    fecha.tiers = tiersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(fecha);
  } catch (error) {
    console.error('Error al obtener fecha:', error);
    res.status(500).json({ error: 'Error al obtener fecha' });
  }
});

/**
 * PUT /api/fechasEvento/:id
 * Actualizar una fecha del evento
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fecha,
      horaInicio,
      horaFin,
      aforoTotal,
      aforoDisponible,
      status
    } = req.body;

    const fechaDoc = await db.collection('fechasEvento').doc(id).get();
    if (!fechaDoc.exists) {
      return res.status(404).json({ error: 'Fecha no encontrada' });
    }

    const actualizacion = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (fecha !== undefined) actualizacion.fecha = fecha;
    if (horaInicio !== undefined) actualizacion.horaInicio = horaInicio;
    if (horaFin !== undefined) actualizacion.horaFin = horaFin;
    if (aforoTotal !== undefined) actualizacion.aforoTotal = parseInt(aforoTotal);
    if (aforoDisponible !== undefined) actualizacion.aforoDisponible = parseInt(aforoDisponible);
    if (status !== undefined) actualizacion.status = status;

    await db.collection('fechasEvento').doc(id).update(actualizacion);

    const fechaActualizada = await db.collection('fechasEvento').doc(id).get();

    res.json({
      id: fechaActualizada.id,
      ...fechaActualizada.data()
    });

  } catch (error) {
    console.error('Error al actualizar fecha:', error);
    res.status(500).json({ error: 'Error al actualizar fecha' });
  }
});

/**
 * DELETE /api/fechasEvento/:id
 * Cancelar una fecha del evento (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const fechaDoc = await db.collection('fechasEvento').doc(id).get();
    if (!fechaDoc.exists) {
      return res.status(404).json({ error: 'Fecha no encontrada' });
    }

    // Verificar que no tenga ventas
    const tiersSnapshot = await db.collection('tiers')
      .where('fechaEventoId', '==', id)
      .get();

    for (const tierDoc of tiersSnapshot.docs) {
      const boletosSnapshot = await db.collection('boletos')
        .where('tierId', '==', tierDoc.id)
        .where('status', 'in', ['vendido', 'usado'])
        .limit(1)
        .get();

      if (!boletosSnapshot.empty) {
        return res.status(400).json({ 
          error: 'No se puede eliminar una fecha con boletos vendidos' 
        });
      }
    }

    // Cancelar la fecha
    await db.collection('fechasEvento').doc(id).update({
      status: 'cancelada',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Cancelar todos los tiers
    const batch = db.batch();
    tiersSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'inactivo',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();

    res.json({ message: 'Fecha cancelada exitosamente' });

  } catch (error) {
    console.error('Error al eliminar fecha:', error);
    res.status(500).json({ error: 'Error al eliminar fecha' });
  }
});

module.exports = router;
