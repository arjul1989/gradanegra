const express = require('express');
const router = express.Router();
const PaymentRecord = require('../models/PaymentRecord');
const { admin } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

/**
 * @route   GET /api/payments-admin/summary/:comercioId
 * @desc    Obtener resumen de pagos para un comercio
 * @access  Private (super admin)
 */
router.get('/summary/:comercioId', async (req, res) => {
  try {
    const { comercioId } = req.params;
    const { timeRange = '30d' } = req.query;

    const stats = await PaymentRecord.getPaymentStatsByComercio(comercioId, timeRange);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error obteniendo resumen de pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de pagos',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payments-admin/pending/:comercioId
 * @desc    Obtener pagos pendientes para un comercio
 * @access  Private (super admin)
 */
router.get('/pending/:comercioId', async (req, res) => {
  try {
    const { comercioId } = req.params;
    const { limit = 50 } = req.query;

    const payments = await PaymentRecord.getPaymentsByStatus('pending', comercioId, parseInt(limit));

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });

  } catch (error) {
    console.error('Error obteniendo pagos pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos pendientes',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payments-admin/rejected/:comercioId
 * @desc    Obtener pagos rechazados para un comercio
 * @access  Private (super admin)
 */
router.get('/rejected/:comercioId', async (req, res) => {
  try {
    const { comercioId } = req.params;
    const { limit = 50 } = req.query;

    const payments = await PaymentRecord.getPaymentsByStatus('rejected', comercioId, parseInt(limit));

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });

  } catch (error) {
    console.error('Error obteniendo pagos rechazados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos rechazados',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payments-admin/approved/:comercioId
 * @desc    Obtener pagos aprobados para un comercio
 * @access  Private (super admin)
 */
router.get('/approved/:comercioId', async (req, res) => {
  try {
    const { comercioId } = req.params;
    const { limit = 50 } = req.query;

    const payments = await PaymentRecord.getPaymentsByStatus('approved', comercioId, parseInt(limit));

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });

  } catch (error) {
    console.error('Error obteniendo pagos aprobados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos aprobados',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payments-admin/all/:comercioId
 * @desc    Obtener todos los pagos para un comercio
 * @access  Private (super admin)
 */
router.get('/all/:comercioId', async (req, res) => {
  try {
    const { comercioId } = req.params;
    const { 
      status = 'all',
      limit = 100,
      offset = 0,
      startDate,
      endDate 
    } = req.query;

    let query = admin.firestore()
      .collection('payment_records')
      .where('comercioId', '==', comercioId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Filtro por status
    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    // Filtro por fechas
    if (startDate) {
      const startTimestamp = admin.firestore.Timestamp.fromDate(new Date(startDate));
      query = query.where('createdAt', '>=', startTimestamp);
    }

    if (endDate) {
      const endTimestamp = admin.firestore.Timestamp.fromDate(new Date(endDate));
      query = query.where('createdAt', '<=', endTimestamp);
    }

    const snapshot = await query.get();

    const payments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt,
        processedAt: data.processedAt?.toDate?.()?.toISOString?.() || data.processedAt,
        approvedAt: data.approvedAt?.toDate?.()?.toISOString?.() || data.approvedAt,
        rejectedAt: data.rejectedAt?.toDate?.()?.toISOString?.() || data.rejectedAt
      };
    });

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });

  } catch (error) {
    console.error('Error obteniendo todos los pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payments-admin/methods/:comercioId
 * @desc    Obtener estadísticas de métodos de pago para un comercio
 * @access  Private (super admin)
 */
router.get('/methods/:comercioId', async (req, res) => {
  try {
    const { comercioId } = req.params;
    const { timeRange = '30d' } = req.query;

    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const snapshot = await admin.firestore()
      .collection('payment_records')
      .where('comercioId', '==', comercioId)
      .where('createdAt', '>=', startDate)
      .get();

    const methodStats = {};
    const statusByMethod = {};

    snapshot.forEach(doc => {
      const payment = doc.data();
      const method = payment.paymentMethod || 'unknown';
      
      // Contar por método
      methodStats[method] = (methodStats[method] || 0) + 1;
      
      // Contar por método y status
      if (!statusByMethod[method]) {
        statusByMethod[method] = {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          amount: 0
        };
      }
      
      statusByMethod[method].total++;
      statusByMethod[method][payment.status] = (statusByMethod[method][payment.status] || 0) + 1;
      statusByMethod[method].amount += payment.amount || 0;
    });

    res.json({
      success: true,
      data: {
        methodStats,
        statusByMethod,
        timeRange
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de métodos de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de métodos de pago',
      error: error.message
    });
  }
});

module.exports = router;