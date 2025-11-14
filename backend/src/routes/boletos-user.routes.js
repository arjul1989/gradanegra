const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

/**
 * @route   GET /api/boletos/user/:uid
 * @desc    Obtener todos los boletos de un usuario
 * @access  Private (el mismo usuario)
 */
router.get('/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { status, ciudad, search, orderBy = 'fechaEvento' } = req.query;

    // Obtener todas las compras del usuario
    let comprasQuery = db.collection('compras')
      .where('userId', '==', uid);

    if (req.query.statusCompra) {
      comprasQuery = comprasQuery.where('status', '==', req.query.statusCompra);
    } else {
      comprasQuery = comprasQuery.where('status', '==', 'completada');
    }

    const comprasSnapshot = await comprasQuery.get();

    if (comprasSnapshot.empty) {
      return res.json([]);
    }

    const comprasIds = comprasSnapshot.docs.map(doc => doc.id);

    // Obtener boletos de esas compras (chunked)
    const boletos = [];
    const chunkSize = 10;

    for (let i = 0; i < comprasIds.length; i += chunkSize) {
      const chunk = comprasIds.slice(i, i + chunkSize);
      
      const boletosSnapshot = await db.collection('boletos')
        .where('compraId', 'in', chunk)
        .get();

      boletosSnapshot.docs.forEach(doc => {
        boletos.push({ id: doc.id, ...doc.data() });
      });
    }

    // Aplicar filtros
    let filteredBoletos = boletos;

    // Filtrar por status
    if (status) {
      if (status === 'proximos') {
        const now = new Date();
        filteredBoletos = filteredBoletos.filter(b => {
          const fechaEvento = new Date(b.fechaEvento);
          return fechaEvento > now && b.status === 'vendido';
        });
      } else if (status === 'pasados') {
        const now = new Date();
        filteredBoletos = filteredBoletos.filter(b => {
          const fechaEvento = new Date(b.fechaEvento);
          return fechaEvento < now;
        });
      } else {
        filteredBoletos = filteredBoletos.filter(b => b.status === status);
      }
    }

    // Filtrar por ciudad
    if (ciudad && ciudad !== 'todas') {
      filteredBoletos = filteredBoletos.filter(b => 
        b.eventoCiudad && b.eventoCiudad.toLowerCase() === ciudad.toLowerCase()
      );
    }

    // Buscar por nombre
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBoletos = filteredBoletos.filter(b =>
        b.eventoNombre && b.eventoNombre.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar
    if (orderBy === 'fechaEvento') {
      filteredBoletos.sort((a, b) => {
        const dateA = new Date(a.fechaEvento);
        const dateB = new Date(b.fechaEvento);
        return dateA - dateB;
      });
    } else if (orderBy === 'fechaCompra') {
      filteredBoletos.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });
    }

    res.json(filteredBoletos);

  } catch (error) {
    console.error('Error al obtener boletos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/boletos/:id
 * @desc    Obtener detalle de un boleto específico
 * @access  Private (verificar que sea del usuario)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const boletoDoc = await db.collection('boletos').doc(id).get();

    if (!boletoDoc.exists) {
      return res.status(404).json({ error: 'Boleto no encontrado' });
    }

    const boleto = { id: boletoDoc.id, ...boletoDoc.data() };

    // Obtener info de la compra
    if (boleto.compraId) {
      const compraDoc = await db.collection('compras').doc(boleto.compraId).get();
      if (compraDoc.exists) {
        boleto.compra = compraDoc.data();
      }
    }

    res.json(boleto);

  } catch (error) {
    console.error('Error al obtener boleto:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/boletos/:id/generar-qr
 * @desc    Generar QR code para un boleto
 * @access  Private
 */
router.post('/:id/generar-qr', async (req, res) => {
  try {
    const { id } = req.params;

    const boletoDoc = await db.collection('boletos').doc(id).get();

    if (!boletoDoc.exists) {
      return res.status(404).json({ error: 'Boleto no encontrado' });
    }

    const boleto = boletoDoc.data();

    // Verificar si ya tiene QR
    if (boleto.qrCode) {
      return res.json({ qrCode: boleto.qrCode });
    }

    // Generar QR code (Data URL)
    const qrData = {
      boletoId: id,
      numeroBoleto: boleto.numeroBoleto,
      eventoNombre: boleto.eventoNombre,
      fechaEvento: boleto.fechaEvento,
      tierNombre: boleto.tierNombre
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });

    // Guardar en el boleto
    await boletoDoc.ref.update({
      qrCode: qrCodeDataURL,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ qrCode: qrCodeDataURL });

  } catch (error) {
    console.error('Error al generar QR:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/boletos/:id/reenviar
 * @desc    Reenviar boleto por email
 * @access  Private
 */
router.post('/:id/reenviar', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    const boletoDoc = await db.collection('boletos').doc(id).get();

    if (!boletoDoc.exists) {
      return res.status(404).json({ error: 'Boleto no encontrado' });
    }

    const boleto = boletoDoc.data();

    // Aquí integrarías con un servicio de email (SendGrid, Mailgun, etc.)
    // Por ahora solo registramos el reenvío
    await db.collection('email_logs').add({
      tipo: 'reenvio_boleto',
      boletoId: id,
      destinatario: email,
      numeroBoleto: boleto.numeroBoleto,
      status: 'pendiente',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: `Boleto reenviado a ${email}`
    });

  } catch (error) {
    console.error('Error al reenviar boleto:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/boletos/user/:uid/ciudades
 * @desc    Obtener lista de ciudades con eventos del usuario
 * @access  Private
 */
router.get('/user/:uid/ciudades', async (req, res) => {
  try {
    const { uid } = req.params;

    // Obtener compras del usuario
    const comprasSnapshot = await db.collection('compras')
      .where('userId', '==', uid)
      .where('status', '==', 'completada')
      .get();

    if (comprasSnapshot.empty) {
      return res.json([]);
    }

    const comprasIds = comprasSnapshot.docs.map(doc => doc.id);

    // Obtener boletos
    const boletos = [];
    const chunkSize = 10;

    for (let i = 0; i < comprasIds.length; i += chunkSize) {
      const chunk = comprasIds.slice(i, i + chunkSize);
      
      const boletosSnapshot = await db.collection('boletos')
        .where('compraId', 'in', chunk)
        .get();

      boletosSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.eventoCiudad) {
          boletos.push(data.eventoCiudad);
        }
      });
    }

    // Obtener ciudades únicas
    const ciudades = [...new Set(boletos)].sort();

    res.json(ciudades);

  } catch (error) {
    console.error('Error al obtener ciudades:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
