const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

/**
 * @route   POST /api/compras
 * @desc    Crear una nueva compra (pre-compra, antes del pago)
 * @access  Public (se pueden crear compras sin autenticación para checkout)
 */
router.post('/', async (req, res) => {
  try {
    const {
      eventoId,
      cantidad,
      nombre,
      email,
      telefono,
      userId = null,
      tickets = []
    } = req.body;

    // Validar campos requeridos
    if (!eventoId || !cantidad || !nombre || !email) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: eventoId, cantidad, nombre, email'
      });
    }

    // Verificar que el evento existe
    const eventoDoc = await db.collection('eventos').doc(eventoId).get();
    
    if (!eventoDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    const eventoData = eventoDoc.data();

    // Calcular el total basado en los tickets seleccionados
    let total = 0;
    const ticketsDetalle = [];

    if (tickets && tickets.length > 0) {
      // Calcular total desde los tickets enviados
      tickets.forEach(ticket => {
        total += ticket.subtotal;
        ticketsDetalle.push({
          tierId: ticket.tierId,
          nombre: ticket.nombre,
          cantidad: ticket.cantidad,
          precioUnitario: ticket.precioUnitario,
          subtotal: ticket.subtotal
        });
      });
    } else {
      // Fallback: usar precio base del evento
      total = (eventoData.precio || eventoData.precioBase || 0) * cantidad;
      ticketsDetalle.push({
        tierId: 'general',
        nombre: 'General',
        cantidad: cantidad,
        precioUnitario: eventoData.precio || eventoData.precioBase || 0,
        subtotal: total
      });
    }

    // Crear ID único para la compra
    const compraId = uuidv4();

    // Crear documento de compra
    const nuevaCompra = {
      id: compraId,
      eventoId: eventoId,
      eventoNombre: eventoData.nombre,
      eventoImagen: eventoData.imagen || eventoData.imagenUrl,
      comercioId: eventoData.comercioId,
      userId: userId,
      nombre: nombre,
      email: email,
      telefono: telefono || '',
      cantidad: cantidad,
      tickets: ticketsDetalle,
      subtotal: total,
      descuento: 0,
      total: total,
      status: 'pendiente', // pendiente -> completada / cancelada / fallida
      metodoPago: 'mercadopago',
      pagoId: null, // Se actualiza cuando se procesa el pago
      fechaCompra: admin.firestore.FieldValue.serverTimestamp(),
      fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Guardar en Firestore
    await db.collection('compras').doc(compraId).set(nuevaCompra);

    console.log('✅ Compra creada:', compraId);

    res.status(201).json({
      success: true,
      message: 'Compra creada exitosamente',
      data: {
        id: compraId,
        ...nuevaCompra
      }
    });

  } catch (error) {
    console.error('❌ Error al crear compra:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear la compra'
    });
  }
});

/**
 * @route   GET /api/compras/user/:uid
 * @desc    Obtener historial de compras de un usuario
 * @access  Private (el mismo usuario)
 */
router.get('/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = db.collection('compras')
      .where('userId', '==', uid);

    if (status && status !== 'todas') {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('fechaCompra', 'desc');

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.json([]);
    }

    const compras = [];

    for (const doc of snapshot.docs) {
      const compra = { id: doc.id, ...doc.data() };

      // Contar boletos de esta compra
      const boletosSnapshot = await db.collection('boletos')
        .where('compraId', '==', doc.id)
        .get();

      compra.cantidadBoletos = boletosSnapshot.size;

      // Obtener info del evento (si existe)
      if (compra.eventoId) {
        const eventoDoc = await db.collection('eventos').doc(compra.eventoId).get();
        if (eventoDoc.exists) {
          const evento = eventoDoc.data();
          compra.eventoNombre = evento.nombre;
          compra.eventoImagen = evento.imagen;
        }
      }

      compras.push(compra);
    }

    res.json(compras);

  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/compras/:id
 * @desc    Obtener detalle de una compra específica
 * @access  Public (para comprobantes de pago)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const compraDoc = await db.collection('compras').doc(id).get();

    if (!compraDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    const compra = { id: compraDoc.id, ...compraDoc.data() };

    // Obtener boletos de esta compra
    const boletosSnapshot = await db.collection('boletos')
      .where('compraId', '==', id)
      .get();

    compra.boletos = boletosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Obtener info del evento
    if (compra.eventoId) {
      const eventoDoc = await db.collection('eventos').doc(compra.eventoId).get();
      if (eventoDoc.exists) {
        compra.evento = eventoDoc.data();
      }
    }

    // Obtener info del cupón si se usó
    if (compra.cuponId) {
      const cuponDoc = await db.collection('cupones').doc(compra.cuponId).get();
      if (cuponDoc.exists) {
        compra.cupon = cuponDoc.data();
      }
    }

    // Agregar campo monto para compatibilidad con frontend
    compra.monto = compra.total;

    res.json({
      success: true,
      data: compra
    });

  } catch (error) {
    console.error('Error al obtener compra:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/compras/user/:uid/resumen
 * @desc    Obtener resumen de compras del usuario
 * @access  Private
 */
router.get('/user/:uid/resumen', async (req, res) => {
  try {
    const { uid } = req.params;
    const { periodo = 'all' } = req.query; // all, year, month

    let query = db.collection('compras')
      .where('userId', '==', uid)
      .where('status', '==', 'completada');

    // Filtrar por período
    if (periodo === 'year') {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      query = query.where('fechaCompra', '>=', startOfYear);
    } else if (periodo === 'month') {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      query = query.where('fechaCompra', '>=', startOfMonth);
    }

    const snapshot = await query.get();

    let totalCompras = 0;
    let totalGastado = 0;
    let totalDescuentos = 0;
    let metodoPagoStats = {};

    snapshot.forEach(doc => {
      const compra = doc.data();
      totalCompras++;
      totalGastado += compra.total || 0;
      totalDescuentos += compra.descuento || 0;

      // Contar métodos de pago
      const metodo = compra.metodoPago || 'otro';
      metodoPagoStats[metodo] = (metodoPagoStats[metodo] || 0) + 1;
    });

    res.json({
      totalCompras,
      totalGastado,
      totalDescuentos,
      promedioCompra: totalCompras > 0 ? Math.round(totalGastado / totalCompras) : 0,
      metodoPagoStats
    });

  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/compras/:id/cancelar
 * @desc    Solicitar cancelación de una compra
 * @access  Private (el mismo usuario)
 */
router.post('/:id/cancelar', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const compraDoc = await db.collection('compras').doc(id).get();

    if (!compraDoc.exists) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    const compra = compraDoc.data();

    // Verificar que esté en status completada
    if (compra.status !== 'completada') {
      return res.status(400).json({ 
        error: 'Solo se pueden cancelar compras completadas' 
      });
    }

    // Verificar tiempo límite (ej: 24 horas antes del evento)
    const boletosSnapshot = await db.collection('boletos')
      .where('compraId', '==', id)
      .limit(1)
      .get();

    if (!boletosSnapshot.empty) {
      const boleto = boletosSnapshot.docs[0].data();
      const fechaEvento = new Date(boleto.fechaEvento);
      const now = new Date();
      const horasHastaEvento = (fechaEvento - now) / (1000 * 60 * 60);

      if (horasHastaEvento < 24) {
        return res.status(400).json({ 
          error: 'No se puede cancelar con menos de 24 horas de anticipación' 
        });
      }
    }

    // Actualizar status
    await compraDoc.ref.update({
      status: 'cancelada',
      motivoCancelacion: motivo || '',
      fechaCancelacion: admin.firestore.FieldValue.serverTimestamp()
    });

    // Cancelar boletos asociados
    const boletosSnapshot2 = await db.collection('boletos')
      .where('compraId', '==', id)
      .get();

    const batch = db.batch();
    boletosSnapshot2.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'cancelado' });
    });
    await batch.commit();

    res.json({
      success: true,
      message: 'Solicitud de cancelación enviada'
    });

  } catch (error) {
    console.error('Error al cancelar compra:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
