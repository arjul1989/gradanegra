const express = require('express');
const router = express.Router();
const {
  getEventosDestacados,
  getEventos,
  getEventoById,
  getDisponibilidad,
  getEventosByCategoria
} = require('../controllers/eventos.controller');
const { db } = require('../config/firebase');
const admin = require('firebase-admin');

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

// ========== ADMIN ROUTES (Panel de Comercios) ==========

/**
 * @route   POST /api/eventos
 * @desc    Crear un nuevo evento (Panel Comercio)
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const {
      comercioId,
      nombre,
      descripcion,
      imagen,
      ciudad,
      ubicacion,
      destacado = false,
      categoria,
      status = 'activo'
    } = req.body;

    // Validaciones
    if (!comercioId || !nombre || !ciudad || !ubicacion) {
      return res.status(400).json({ 
        error: 'Campos requeridos: comercioId, nombre, ciudad, ubicacion' 
      });
    }

    // Verificar que el comercio existe
    const comercioDoc = await db.collection('comercios').doc(comercioId).get();
    if (!comercioDoc.exists) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    const comercio = comercioDoc.data();

    // Verificar límite de eventos según el plan (usar custom si existe)
    const eventosSnapshot = await db.collection('eventos')
      .where('comercioId', '==', comercioId)
      .where('status', 'in', ['activo', 'pausado'])
      .get();

    const eventosActivos = eventosSnapshot.size;

    // Usar límite custom si está definido, sino usar límite del plan
    const limiteEventosEfectivo = comercio.limiteEventosCustom !== undefined 
      ? comercio.limiteEventosCustom 
      : comercio.limiteEventos;

    // -1 significa ilimitado (enterprise o custom)
    if (limiteEventosEfectivo !== -1 && eventosActivos >= limiteEventosEfectivo) {
      return res.status(403).json({ 
        error: `Has alcanzado el límite de ${limiteEventosEfectivo} eventos${comercio.limiteEventosCustom !== undefined ? ' (configuración personalizada)' : ' para tu plan ' + comercio.tipoPlan.toUpperCase()}. Elimina un evento existente o contacta con soporte.` 
      });
    }

    // Verificar límite de eventos destacados si aplica
    if (destacado) {
      // Límites estándar por plan
      const limiteDestacadosBase = {
        free: 0,
        basic: 0,
        pro: 2,
        enterprise: 5
      }[comercio.tipoPlan] || 0;

      // Usar límite custom si existe
      const limiteDestacadosEfectivo = comercio.limiteDestacadosCustom !== undefined 
        ? comercio.limiteDestacadosCustom 
        : limiteDestacadosBase;

      const destacadosSnapshot = await db.collection('eventos')
        .where('comercioId', '==', comercioId)
        .where('destacado', '==', true)
        .where('status', 'in', ['activo', 'pausado'])
        .get();

      if (limiteDestacadosEfectivo !== -1 && destacadosSnapshot.size >= limiteDestacadosEfectivo) {
        return res.status(403).json({ 
          error: `Has alcanzado el límite de ${limiteDestacadosEfectivo} eventos destacados${comercio.limiteDestacadosCustom !== undefined ? ' (configuración personalizada)' : ' para tu plan ' + comercio.tipoPlan.toUpperCase()}.` 
        });
      }
    }

    // Crear el evento
    const nuevoEvento = {
      comercioId,
      nombre,
      descripcion: descripcion || '',
      imagen: imagen || '',
      ciudad,
      ubicacion,
      destacado,
      categoria: categoria || '',
      status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const eventoRef = await db.collection('eventos').add(nuevoEvento);

    res.status(201).json({
      id: eventoRef.id,
      ...nuevoEvento,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({ error: 'Error al crear evento' });
  }
});

/**
 * @route   PUT /api/eventos/:id
 * @desc    Actualizar un evento existente (Panel Comercio)
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      imagen,
      ciudad,
      ubicacion,
      destacado,
      categoria,
      status
    } = req.body;

    // Verificar que el evento existe
    const eventoDoc = await db.collection('eventos').doc(id).get();
    if (!eventoDoc.exists) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const eventoActual = eventoDoc.data();

    // Si se quiere destacar, verificar límite
    if (destacado && !eventoActual.destacado) {
      const comercioDoc = await db.collection('comercios').doc(eventoActual.comercioId).get();
      const comercio = comercioDoc.data();

      const limiteDestacados = {
        free: 0,
        basic: 0,
        pro: 2,
        enterprise: 5
      }[comercio.tipoPlan] || 0;

      const destacadosSnapshot = await db.collection('eventos')
        .where('comercioId', '==', eventoActual.comercioId)
        .where('destacado', '==', true)
        .where('status', 'in', ['activo', 'pausado'])
        .get();

      if (destacadosSnapshot.size >= limiteDestacados) {
        return res.status(403).json({ 
          error: `Tu plan permite hasta ${limiteDestacados} eventos destacados.` 
        });
      }
    }

    // Actualizar solo los campos proporcionados
    const actualizacion = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (nombre !== undefined) actualizacion.nombre = nombre;
    if (descripcion !== undefined) actualizacion.descripcion = descripcion;
    if (imagen !== undefined) actualizacion.imagen = imagen;
    if (ciudad !== undefined) actualizacion.ciudad = ciudad;
    if (ubicacion !== undefined) actualizacion.ubicacion = ubicacion;
    if (destacado !== undefined) actualizacion.destacado = destacado;
    if (categoria !== undefined) actualizacion.categoria = categoria;
    if (status !== undefined) actualizacion.status = status;

    await db.collection('eventos').doc(id).update(actualizacion);

    const eventoActualizado = await db.collection('eventos').doc(id).get();

    res.json({
      id: eventoActualizado.id,
      ...eventoActualizado.data()
    });

  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
});

/**
 * @route   DELETE /api/eventos/:id
 * @desc    Eliminar (soft delete) un evento (Panel Comercio)
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el evento exists
    const eventoDoc = await db.collection('eventos').doc(id).get();
    if (!eventoDoc.exists) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Verificar que no tenga ventas
    const comprasSnapshot = await db.collection('compras')
      .where('eventoId', '==', id)
      .where('status', '==', 'completada')
      .limit(1)
      .get();

    if (!comprasSnapshot.empty) {
      return res.status(400).json({ 
        error: 'No se puede eliminar un evento con ventas. Puedes cancelarlo o pausarlo.' 
      });
    }

    // Soft delete: cambiar status a cancelado
    await db.collection('eventos').doc(id).update({
      status: 'cancelado',
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Cancelar todas las fechas del evento
    const fechasSnapshot = await db.collection('fechasEvento')
      .where('eventoId', '==', id)
      .get();

    const batch = db.batch();
    fechasSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'cancelado',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();

    res.json({ message: 'Evento eliminado exitosamente' });

  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
});

/**
 * @route   GET /api/eventos/:id/fechas
 * @desc    Obtener todas las fechas de un evento con sus tiers (Panel Comercio)
 * @access  Private
 */
router.get('/:id/fechas', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el evento existe
    const eventoDoc = await db.collection('eventos').doc(id).get();
    if (!eventoDoc.exists) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Obtener fechas del evento
    const fechasSnapshot = await db.collection('fechasEvento')
      .where('eventoId', '==', id)
      .orderBy('fecha', 'asc')
      .orderBy('horaInicio', 'asc')
      .get();

    const fechas = [];

    for (const fechaDoc of fechasSnapshot.docs) {
      const fechaData = {
        id: fechaDoc.id,
        ...fechaDoc.data()
      };

      // Obtener tiers de esta fecha
      const tiersSnapshot = await db.collection('tiers')
        .where('fechaEventoId', '==', fechaDoc.id)
        .where('status', '!=', 'inactivo')
        .orderBy('status')
        .orderBy('orden', 'asc')
        .get();

      fechaData.tiers = tiersSnapshot.docs.map(tierDoc => ({
        id: tierDoc.id,
        ...tierDoc.data()
      }));

      fechas.push(fechaData);
    }

    res.json(fechas);

  } catch (error) {
    console.error('Error al obtener fechas:', error);
    res.status(500).json({ error: 'Error al obtener fechas del evento' });
  }
});

/**
 * @route   GET /api/eventos/:id/boletos-vendidos
 * @desc    Obtener todos los boletos vendidos de un evento (Panel Comercio)
 * @access  Private
 */
router.get('/:id/boletos-vendidos', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el evento existe
    const eventoDoc = await db.collection('eventos').doc(id).get();
    if (!eventoDoc.exists) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Obtener todas las fechas del evento
    const fechasSnapshot = await db.collection('fechasEvento')
      .where('eventoId', '==', id)
      .get();

    const fechaIds = fechasSnapshot.docs.map(doc => doc.id);

    if (fechaIds.length === 0) {
      return res.json([]);
    }

    // Obtener todos los tiers de esas fechas
    const tiersSnapshot = await db.collection('tiers')
      .where('fechaEventoId', 'in', fechaIds)
      .get();

    const tierIds = tiersSnapshot.docs.map(doc => doc.id);
    
    // Crear un mapa de tier info para enriquecer los boletos
    const tierMap = {};
    tiersSnapshot.docs.forEach(doc => {
      tierMap[doc.id] = doc.data();
    });

    if (tierIds.length === 0) {
      return res.json([]);
    }

    // Obtener boletos vendidos (máximo 10 tierIds a la vez por límite de Firestore)
    const boletos = [];
    const chunkSize = 10;
    
    for (let i = 0; i < tierIds.length; i += chunkSize) {
      const chunk = tierIds.slice(i, i + chunkSize);
      
      const boletosSnapshot = await db.collection('boletos')
        .where('tierId', 'in', chunk)
        .where('status', 'in', ['vendido', 'usado'])
        .orderBy('createdAt', 'desc')
        .get();

      boletosSnapshot.docs.forEach(doc => {
        const boletoData = doc.data();
        const tier = tierMap[boletoData.tierId];
        
        boletos.push({
          id: doc.id,
          ...boletoData,
          tierNombre: tier ? tier.nombre : null,
          // Información adicional si existe
          fechaCompra: boletoData.createdAt ? 
            new Date(boletoData.createdAt._seconds * 1000).toLocaleDateString('es-CO') : null
        });
      });
    }

    // Ordenar por fecha de compra más reciente
    boletos.sort((a, b) => {
      const dateA = a.createdAt?._seconds || 0;
      const dateB = b.createdAt?._seconds || 0;
      return dateB - dateA;
    });

    res.json(boletos);

  } catch (error) {
    console.error('Error al obtener boletos vendidos:', error);
    res.status(500).json({ error: 'Error al obtener boletos vendidos' });
  }
});

module.exports = router;
