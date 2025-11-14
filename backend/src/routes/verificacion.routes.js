const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * @route   POST /api/verificacion/scan
 * @desc    Verificar un boleto por QR code o número
 * @access  Private (verificadores del comercio)
 */
router.post('/scan', async (req, res) => {
  try {
    const { qrCode, numeroBoleto, comercioId } = req.body;

    if (!qrCode && !numeroBoleto) {
      return res.status(400).json({ error: 'Debes proporcionar un código QR o número de boleto' });
    }

    // Buscar boleto
    let boletoQuery = db.collection('boletos');
    
    if (qrCode) {
      boletoQuery = boletoQuery.where('qrCode', '==', qrCode);
    } else if (numeroBoleto) {
      boletoQuery = boletoQuery.where('numeroBoleto', '==', numeroBoleto);
    }

    const boletoSnapshot = await boletoQuery.limit(1).get();

    if (boletoSnapshot.empty) {
      return res.status(404).json({ 
        valid: false,
        error: 'Boleto no encontrado',
        message: 'El código no corresponde a ningún boleto en el sistema'
      });
    }

    const boletoDoc = boletoSnapshot.docs[0];
    const boleto = { id: boletoDoc.id, ...boletoDoc.data() };

    // Obtener info del tier
    const tierDoc = await db.collection('tiers').doc(boleto.tierId).get();
    if (!tierDoc.exists) {
      return res.status(404).json({ 
        valid: false,
        error: 'Tier no encontrado' 
      });
    }
    const tier = { id: tierDoc.id, ...tierDoc.data() };

    // Obtener info de la fecha del evento
    const fechaDoc = await db.collection('fechasEvento').doc(tier.fechaEventoId).get();
    if (!fechaDoc.exists) {
      return res.status(404).json({ 
        valid: false,
        error: 'Fecha de evento no encontrada' 
      });
    }
    const fecha = { id: fechaDoc.id, ...fechaDoc.data() };

    // Obtener info del evento
    const eventoDoc = await db.collection('eventos').doc(fecha.eventoId).get();
    if (!eventoDoc.exists) {
      return res.status(404).json({ 
        valid: false,
        error: 'Evento no encontrado' 
      });
    }
    const evento = { id: eventoDoc.id, ...eventoDoc.data() };

    // Verificar que el boleto pertenece al comercio (si se proporciona)
    if (comercioId && evento.comercioId !== comercioId) {
      return res.status(403).json({ 
        valid: false,
        error: 'Este boleto no pertenece a tu comercio' 
      });
    }

    // Validaciones del boleto
    const validations = {
      valid: true,
      status: boleto.status,
      warnings: [],
      errors: []
    };

    // 1. Verificar status del boleto
    if (boleto.status === 'usado') {
      validations.valid = false;
      validations.errors.push('Este boleto ya fue usado anteriormente');
      
      // Si tiene registros de uso, mostrar cuándo
      if (boleto.fechaUso) {
        const fechaUso = boleto.fechaUso.toDate ? boleto.fechaUso.toDate() : new Date(boleto.fechaUso);
        validations.errors.push(`Usado el ${fechaUso.toLocaleString('es-CO')}`);
      }
    } else if (boleto.status === 'cancelado') {
      validations.valid = false;
      validations.errors.push('Este boleto fue cancelado');
    } else if (boleto.status === 'disponible') {
      validations.valid = false;
      validations.errors.push('Este boleto no ha sido vendido');
    } else if (boleto.status === 'reservado') {
      validations.warnings.push('Este boleto está reservado pero no completado');
    }

    // 2. Verificar fecha del evento
    const fechaEvento = new Date(fecha.fecha + 'T' + fecha.horaInicio);
    const hoy = new Date();
    const unDiaAntes = new Date(fechaEvento);
    unDiaAntes.setDate(unDiaAntes.getDate() - 1);

    if (hoy < unDiaAntes) {
      validations.warnings.push('El evento aún no ha comenzado');
    } else if (hoy > fechaEvento) {
      const diasPasados = Math.floor((hoy - fechaEvento) / (1000 * 60 * 60 * 24));
      if (diasPasados > 1) {
        validations.warnings.push(`El evento fue hace ${diasPasados} días`);
      }
    }

    // 3. Verificar status del evento
    if (evento.status === 'cancelado') {
      validations.valid = false;
      validations.errors.push('El evento fue cancelado');
    } else if (evento.status === 'pausado') {
      validations.warnings.push('El evento está pausado');
    }

    // 4. Verificar status de la fecha
    if (fecha.status === 'cancelada') {
      validations.valid = false;
      validations.errors.push('Esta fecha del evento fue cancelada');
    }

    // Obtener info del comprador si está disponible
    let compradorInfo = null;
    if (boleto.compraId) {
      const compraDoc = await db.collection('compras').doc(boleto.compraId).get();
      if (compraDoc.exists) {
        const compra = compraDoc.data();
        compradorInfo = {
          nombre: compra.nombre || 'N/A',
          email: compra.email || 'N/A',
          telefono: compra.telefono || 'N/A'
        };
      }
    }

    res.json({
      ...validations,
      boleto: {
        id: boleto.id,
        numeroBoleto: boleto.numeroBoleto,
        precio: boleto.precio,
        status: boleto.status,
        fechaUso: boleto.fechaUso
      },
      tier: {
        nombre: tier.nombre,
        descripcion: tier.descripcion
      },
      evento: {
        nombre: evento.nombre,
        imagen: evento.imagen,
        ubicacion: evento.ubicacion
      },
      fecha: {
        fecha: fecha.fecha,
        horaInicio: fecha.horaInicio,
        horaFin: fecha.horaFin
      },
      comprador: compradorInfo
    });

  } catch (error) {
    console.error('Error en verificación:', error);
    res.status(500).json({ 
      valid: false,
      error: 'Error al verificar el boleto' 
    });
  }
});

/**
 * @route   POST /api/verificacion/marcar-usado
 * @desc    Marcar un boleto como usado
 * @access  Private (verificadores del comercio)
 */
router.post('/marcar-usado', async (req, res) => {
  try {
    const { boletoId, verificadorId, ubicacion } = req.body;

    if (!boletoId) {
      return res.status(400).json({ error: 'ID del boleto requerido' });
    }

    // Obtener boleto
    const boletoDoc = await db.collection('boletos').doc(boletoId).get();
    
    if (!boletoDoc.exists) {
      return res.status(404).json({ error: 'Boleto no encontrado' });
    }

    const boleto = boletoDoc.data();

    // Verificar que esté vendido
    if (boleto.status !== 'vendido') {
      return res.status(400).json({ 
        error: `No se puede marcar como usado. Status actual: ${boleto.status}` 
      });
    }

    // Marcar como usado
    await boletoDoc.ref.update({
      status: 'usado',
      fechaUso: admin.firestore.FieldValue.serverTimestamp(),
      verificadorId: verificadorId || null,
      ubicacionUso: ubicacion || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Registrar en historial de verificaciones
    await db.collection('verificaciones').add({
      boletoId,
      numeroBoleto: boleto.numeroBoleto,
      tierId: boleto.tierId,
      accion: 'marcado_usado',
      verificadorId: verificadorId || 'sistema',
      ubicacion: ubicacion || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Boleto marcado como usado exitosamente',
      boleto: {
        id: boletoId,
        numeroBoleto: boleto.numeroBoleto,
        status: 'usado'
      }
    });

  } catch (error) {
    console.error('Error al marcar como usado:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/verificacion/historial/:eventoId
 * @desc    Obtener historial de verificaciones de un evento
 * @access  Private (comercio)
 */
router.get('/historial/:eventoId', async (req, res) => {
  try {
    const { eventoId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Obtener todas las fechas del evento
    const fechasSnapshot = await db.collection('fechasEvento')
      .where('eventoId', '==', eventoId)
      .get();

    if (fechasSnapshot.empty) {
      return res.json([]);
    }

    const fechasIds = fechasSnapshot.docs.map(doc => doc.id);

    // Obtener tiers de esas fechas
    const allTiers = [];
    for (const fechaId of fechasIds) {
      const tiersSnapshot = await db.collection('tiers')
        .where('fechaEventoId', '==', fechaId)
        .get();
      
      tiersSnapshot.docs.forEach(doc => {
        allTiers.push(doc.id);
      });
    }

    if (allTiers.length === 0) {
      return res.json([]);
    }

    // Obtener verificaciones de esos tiers (chunked)
    const verificaciones = [];
    const chunkSize = 10;
    
    for (let i = 0; i < allTiers.length; i += chunkSize) {
      const chunk = allTiers.slice(i, i + chunkSize);
      
      const verificacionesSnapshot = await db.collection('verificaciones')
        .where('tierId', 'in', chunk)
        .orderBy('timestamp', 'desc')
        .limit(parseInt(limit))
        .get();

      verificacionesSnapshot.docs.forEach(doc => {
        verificaciones.push({
          id: doc.id,
          ...doc.data()
        });
      });
    }

    // Ordenar por timestamp
    verificaciones.sort((a, b) => {
      const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(0);
      const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(0);
      return bTime - aTime;
    });

    res.json(verificaciones.slice(0, parseInt(limit)));

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/verificacion/estadisticas/:eventoId
 * @desc    Obtener estadísticas de verificación de un evento
 * @access  Private (comercio)
 */
router.get('/estadisticas/:eventoId', async (req, res) => {
  try {
    const { eventoId } = req.params;

    // Obtener todas las fechas del evento
    const fechasSnapshot = await db.collection('fechasEvento')
      .where('eventoId', '==', eventoId)
      .get();

    if (fechasSnapshot.empty) {
      return res.json({
        totalBoletos: 0,
        boletosVendidos: 0,
        boletosUsados: 0,
        tasaAsistencia: 0
      });
    }

    const fechasIds = fechasSnapshot.docs.map(doc => doc.id);

    // Obtener todos los tiers
    const allTiers = [];
    for (const fechaId of fechasIds) {
      const tiersSnapshot = await db.collection('tiers')
        .where('fechaEventoId', '==', fechaId)
        .get();
      
      tiersSnapshot.docs.forEach(doc => {
        allTiers.push({ id: doc.id, ...doc.data() });
      });
    }

    const tiersIds = allTiers.map(t => t.id);
    
    if (tiersIds.length === 0) {
      return res.json({
        totalBoletos: 0,
        boletosVendidos: 0,
        boletosUsados: 0,
        tasaAsistencia: 0
      });
    }

    // Contar boletos por status (chunked)
    let totalBoletos = 0;
    let boletosVendidos = 0;
    let boletosUsados = 0;
    const chunkSize = 10;

    for (let i = 0; i < tiersIds.length; i += chunkSize) {
      const chunk = tiersIds.slice(i, i + chunkSize);
      
      // Total
      const totalSnapshot = await db.collection('boletos')
        .where('tierId', 'in', chunk)
        .get();
      totalBoletos += totalSnapshot.size;

      // Vendidos
      const vendidosSnapshot = await db.collection('boletos')
        .where('tierId', 'in', chunk)
        .where('status', 'in', ['vendido', 'usado'])
        .get();
      boletosVendidos += vendidosSnapshot.size;

      // Usados
      const usadosSnapshot = await db.collection('boletos')
        .where('tierId', 'in', chunk)
        .where('status', '==', 'usado')
        .get();
      boletosUsados += usadosSnapshot.size;
    }

    const tasaAsistencia = boletosVendidos > 0 
      ? (boletosUsados / boletosVendidos) * 100 
      : 0;

    res.json({
      totalBoletos,
      boletosVendidos,
      boletosUsados,
      tasaAsistencia: Math.round(tasaAsistencia * 10) / 10 // 1 decimal
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
