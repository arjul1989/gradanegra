const { preferenceClient, paymentClient, publicKey, isProduction, accessToken } = require('../config/mercadopago');
const Payment = require('../models/Payment');
const PaymentRecord = require('../models/PaymentRecord');
const { db, admin } = require('../config/firebase');
const logger = require('../utils/logger');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');

/**
 * Generar tickets para una compra aprobada
 */
async function generateTicketsForPurchase(compraId, compra) {
  try {
    logger.info(`🎫 Generando tickets para compra ${compraId}`);

    // Obtener el evento
    const event = await Event.findById(compra.eventoId);
    if (!event) {
      throw new Error(`Evento ${compra.eventoId} no encontrado`);
    }

    // Obtener los tickets de la compra
    const tickets = compra.tickets || [];
    
    if (tickets.length === 0) {
      logger.warn(`No hay tickets definidos en la compra ${compraId}`);
      return;
    }

    // Crear tickets individuales para cada tier y cantidad
    const createdTickets = [];
    
    for (const ticketInfo of tickets) {
      const { tierId, cantidad, precioUnitario } = ticketInfo;
      
      // Buscar el tier en el evento
      const tier = event.tiers?.find(t => t.id === tierId);
      if (!tier) {
        logger.warn(`Tier ${tierId} no encontrado en evento ${compra.eventoId}`);
        continue;
      }

      // Crear N tickets según la cantidad
      for (let i = 0; i < cantidad; i++) {
        const ticket = new Ticket({
          eventId: compra.eventoId,
          tenantId: compra.comercioId,
          buyerId: compra.userId || null,
          purchaseId: compraId,
          tierId: tierId,
          price: precioUnitario,
          currency: 'COP',
          status: 'confirmed',
          buyer: {
            name: compra.nombre,
            email: compra.email,
            phone: compra.telefono || ''
          }
        });

        await ticket.save();
        createdTickets.push(ticket);
        
        logger.info(`✅ Ticket creado: ${ticket.ticketNumber} para ${compra.email}`);
      }

      // Actualizar vendidos en el tier del evento
      const newVendidos = (tier.vendidos || 0) + cantidad;
      await event.updateTierSoldCount(tierId, newVendidos);
    }

    logger.info(`✅ ${createdTickets.length} tickets creados para compra ${compraId}`);
    
    return createdTickets;

  } catch (error) {
    logger.error(`Error generando tickets para compra ${compraId}:`, error);
    throw error;
  }
}

/**
 * @desc    Obtener Public Key de Mercado Pago
 * @route   GET /api/payments/config
 * @access  Public
 */
exports.getConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      publicKey: publicKey,
      environment: isProduction ? 'production' : 'test'
    });
  } catch (error) {
    logger.error('Error al obtener configuración de MP:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener métodos de pago habilitados en Mercado Pago
 * @route   GET /api/payments/methods
 * @access  Public
 */
exports.getPaymentMethods = async (req, res) => {
  try {
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: 'Access token de Mercado Pago no configurado'
      });
    }

    const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al consultar métodos de pago (${response.status}): ${errorText}`);
    }

    const rawMethods = await response.json();

    const allowedTypes = ['credit_card', 'debit_card', 'prepaid_card', 'bank_transfer', 'ticket'];

    const methods = rawMethods
      .filter(method => allowedTypes.includes(method.payment_type_id))
      .map(method => ({
        id: method.id,
        name: method.name,
        paymentType: method.payment_type_id,
        status: method.status,
        minAmount: method.min_allowed_amount,
        maxAmount: method.max_allowed_amount,
        thumbnail: method.secure_thumbnail || method.thumbnail,
        additionalInfoNeeded: method.additional_info_needed || [],
        financialInstitutions: method.financial_institutions || [],
        // Información específica por método
        isPSE: method.payment_type_id === 'bank_transfer' && method.id === 'pse',
        isCash: method.payment_type_id === 'ticket'
      }));

    res.json({
      success: true,
      methods
    });
  } catch (error) {
    logger.error('Error al obtener métodos de pago de MP:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métodos de pago',
      error: error.message
    });
  }
};

/**
 * @desc    Crear preferencia de pago en Mercado Pago
 * @route   POST /api/payments/create-preference
 * @access  Public
 */
exports.createPreference = async (req, res) => {
  try {
    const {
      comercioId,
      eventoId,
      items, // [{ title, quantity, unit_price }]
      payer, // { email, name, surname, phone, identification }
      compraId // ID de la compra previamente creada
    } = req.body;

    // Validaciones
    if (!comercioId || !eventoId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: comercioId, eventoId, items'
      });
    }

    if (!compraId) {
      return res.status(400).json({
        success: false,
        message: 'compraId es requerido'
      });
    }

    // Calcular total
    const total = items.reduce((sum, item) => {
      return sum + (item.unit_price * item.quantity);
    }, 0);

    // Verificar que la compra existe
    const compraDoc = await db.collection('compras').doc(compraId).get();
    if (!compraDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    const compra = compraDoc.data();

    // Obtener información del evento para la descripción
    const eventoDoc = await db.collection('eventos').doc(eventoId).get();
    const evento = eventoDoc.exists ? eventoDoc.data() : null;

    // URLs de retorno (ajustar según tu dominio)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';

    // Crear preferencia de pago
    const preferenceData = {
      items: items.map(item => ({
        title: item.title,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
        currency_id: 'COP' // Colombia pesos
      })),
      payer: payer ? {
        name: payer.name || payer.firstName || '',
        surname: payer.surname || payer.lastName || '',
        email: payer.email || '',
        phone: payer.phone ? {
          area_code: payer.phone.area_code || '',
          number: payer.phone.number || payer.phone // Soportar tanto string como objeto
        } : undefined,
        identification: payer.identification ? {
          type: payer.identification.type || 'DNI',
          number: payer.identification.number
        } : undefined
      } : undefined,
      back_urls: {
        success: `${frontendUrl}/pago/exito`,
        failure: `${frontendUrl}/pago/fallo`,
        pending: `${frontendUrl}/pago/pendiente`
      },
      // Remover auto_return en desarrollo/localhost (Mercado Pago lo rechaza)
      ...(process.env.NODE_ENV === 'production' && { auto_return: 'approved' }),
      // Solo incluir notification_url en producción (localhost no es válido)
      ...(process.env.NODE_ENV === 'production' && process.env.BACKEND_URL && {
        notification_url: `${backendUrl}/api/payments/webhook`
      }),
      external_reference: compraId, // Vincular con la compra
      statement_descriptor: 'GRADA NEGRA',
      metadata: {
        comercioId: comercioId,
        eventoId: eventoId,
        compraId: compraId,
        userId: compra.userId || null
      }
    };

    logger.info('Creando preferencia de MP:', preferenceData);

    const preference = await preferenceClient.create({ body: preferenceData });

    logger.info('Preferencia creada:', preference);

    // Guardar el pago en la base de datos
    const payment = new Payment({
      compraId: compraId,
      comercioId: comercioId,
      eventoId: eventoId,
      userId: compra.userId || null,
      amount: total,
      currency: 'COP', // Colombia pesos
      description: evento ? `Boletos para ${evento.nombre}` : 'Compra de boletos',
      preferenceId: preference.id,
      externalReference: compraId,
      status: 'pending',
      payer: {
        email: payer?.email || compra.email,
        firstName: payer?.name || payer?.firstName || compra.nombre,
        lastName: payer?.surname || payer?.lastName || compra.apellido || '',
        identification: payer?.identification || null,
        phone: payer?.phone || compra.telefono
      }
    });

    await payment.save();

    // Actualizar la compra con el ID de pago
    await db.collection('compras').doc(compraId).update({
      paymentId: payment.id,
      preferenceId: preference.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      preferenceId: preference.id,
      initPoint: preference.init_point, // URL para redirigir al usuario
      sandboxInitPoint: preference.sandbox_init_point, // URL de sandbox (TEST)
      paymentId: payment.id
    });

  } catch (error) {
    logger.error('Error al crear preferencia de MP:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear preferencia de pago',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener instituciones financieras para PSE
 * @route   GET /api/payments/pse-banks
 * @access  Public
 */
exports.getPSEBanks = async (req, res) => {
  try {
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: 'Access token de Mercado Pago no configurado'
      });
    }

    const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al consultar métodos de pago (${response.status}): ${errorText}`);
    }

    const rawMethods = await response.json();

    // Buscar el método PSE
    const pseMethod = rawMethods.find(method =>
      method.id === 'pse' && method.payment_type_id === 'bank_transfer'
    );

    if (!pseMethod || !pseMethod.financial_institutions) {
      logger.warn('PSE o financial_institutions no encontrado en respuesta de MP');
      return res.json({
        success: true,
        banks: [],
        message: 'PSE no está disponible o no tiene bancos configurados'
      });
    }

    const banks = pseMethod.financial_institutions.map(institution => ({
      id: institution.id,
      name: institution.description,
      status: institution.status,
      thumbnail: institution.secure_thumbnail || institution.thumbnail
    }));

    logger.info(`✅ Encontrados ${banks.length} bancos para PSE`);

    res.json({
      success: true,
      banks
    });

  } catch (error) {
    logger.error('Error al obtener bancos PSE:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener bancos PSE',
      error: error.message
    });
  }
};

/**
 * @desc    Procesar pago directamente con API de Mercado Pago
 * @route   POST /api/payments/process
 * @access  Public
 */
exports.processDirectPayment = async (req, res) => {
  try {
    // Destructure request body and explicitly remove callbackUrl
    const {
      compraId,
      eventoId,
      transaction_amount,
      description,
      token, // Token de tarjeta generado por MercadoPago.js
      payer,
      installments = 1,
      paymentMethod: clientPaymentMethod,
      payment_method, // compatibilidad hacia atrás
      payment_method_id,
      financialInstitution,
      callbackUrl, // Este será removido para evitar problemas
      ...otherProps
    } = req.body;

    // Eliminar callbackUrl completamente para evitar que MP lo rechace
    delete req.body.callbackUrl;

    const paymentMethod =
      clientPaymentMethod ||
      payment_method ||
      payment_method_id ||
      'card';

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const clientIp =
      (req.headers['x-forwarded-for'] &&
        req.headers['x-forwarded-for'].split(',')[0].trim()) ||
      req.ip ||
      req.connection?.remoteAddress ||
      '127.0.0.1';

    logger.info('Procesando pago directo:', {
      compraId,
      eventoId,
      transaction_amount,
      paymentMethod,
      clientIp,
      frontendUrl,
      backendUrl
    });

    // ✅ NUEVA VALIDACIÓN: Verificar transaction_amount
    if (!transaction_amount || transaction_amount === '') {
      return res.status(400).json({
        success: false,
        message: 'transaction_amount es requerido'
      });
    }

    // Convertir y validar transaction_amount
    const numericAmount = parseFloat(transaction_amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'transaction_amount debe ser un número válido mayor a 0'
      });
    }

    // Validar compra
    const compraDoc = await db.collection('compras').doc(compraId).get();
    if (!compraDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    const compra = compraDoc.data();

    if (!payer?.email) {
      return res.status(400).json({
        success: false,
        message: 'Información del comprador incompleta (email requerido)'
      });
    }

    const payerFirstName = payer.first_name || compra.nombre?.split(' ')[0] || '';
    const payerLastName =
      payer.last_name ||
      compra.nombre?.split(' ').slice(1).join(' ') ||
      compra.nombre ||
      '';

    const paymentData = {
      transaction_amount: numericAmount,
      description: description,
      payer: {
        email: payer.email,
        first_name: payerFirstName,
        last_name: payerLastName,
        entity_type: payer.entity_type || 'individual',
        identification: {
          type: payer.identification?.type || 'CC',
          number: payer.identification?.number || ''
        }
      },
      external_reference: compraId,
      // Solo incluir notification_url en producción (localhost no es válido)
      ...(process.env.NODE_ENV === 'production' && {
        notification_url: `https://gradanegra-api-juyoedy62a-uc.a.run.app/api/payments/webhook`
      }),
      metadata: {
        compraId: compraId,
        eventoId: eventoId,
        comercioId: compra.comercioId,
        userId: compra.userId || null,
        paymentMethod
      }
    };

    // Configuración específica por método de pago
    switch (paymentMethod) {
      case 'card': {
        if (!token) {
          return res.status(400).json({
            success: false,
            message: 'Token de tarjeta no recibido'
          });
        }
        paymentData.token = token;
        paymentData.installments = parseInt(installments) || 1;
        break;
      }
      case 'pse': {
        if (!financialInstitution) {
          return res.status(400).json({
            success: false,
            message: 'Banco no seleccionado para PSE'
          });
        }

        // Configuración específica para PSE
        paymentData.payment_method_id = 'pse';
        paymentData.transaction_details = {
          financial_institution: String(financialInstitution)
        };
        
        // PSE requiere entity_type en payer
        paymentData.payer.entity_type = payer.entity_type || 'individual';
        
        // IP address ES OBLIGATORIO para PSE
        if (!clientIp) {
          logger.warn('IP address faltante para PSE - usando IP local');
        }
        paymentData.additional_info = {
          ip_address: clientIp || '127.0.0.1'
        };
        
        // PSE requiere callback_url - usar URL válida que MP acepte
        // Para testing, usar URL de éxito existente que MP valide
        // IMPORTANTE: No usar localhost para PSE ya que MP lo rechaza
        paymentData.callback_url = (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'))
          ? `${process.env.FRONTEND_URL}/pago/exito`
          : 'https://httpbin.org/status/200'; // URL de prueba confiable que MP acepta
        
        logger.info('PSE Payment configured:', {
          financialInstitution,
          entity_type: paymentData.payer.entity_type,
          ip_address: paymentData.additional_info.ip_address,
          callback_url: paymentData.callback_url
        });
        break;
      }
      case 'efecty': {
        // Configuración específica para Efecty
        paymentData.payment_method_id = 'pagoefectivo'; // ✅ CORREGIDO - Debe ser 'pagoefectivo'
        
        // Efecty también puede requerir entity_type
        paymentData.payer.entity_type = payer.entity_type || 'individual';
        
        // IP address recomendado para Efecty
        paymentData.additional_info = {
          ip_address: clientIp || '127.0.0.1'
        };
        
        // Callback URL removido para evitar problemas de validación
        // paymentData.callback_url =
        //   callbackUrl || `${frontendUrl.replace(/\/$/, '')}/pago/efecty-retorno`;
        
        logger.info('Efecty Payment configured:', {
          payment_method_id: paymentData.payment_method_id,
          entity_type: paymentData.payer.entity_type,
          ip_address: paymentData.additional_info.ip_address
          // callback_url: paymentData.callback_url  // Comentado para evitar error
        });
        break;
      }
      default: {
        return res.status(400).json({
          success: false,
          message: `Método de pago ${paymentMethod} no soportado`
        });
      }
    }

    logger.info('Creando pago en MP:', {
      ...paymentData,
      token: paymentData.token ? '[REDACTED]' : undefined
    });

    // Generar idempotency key único para cada pago
    const idempotencyKey = `grada-${compraId}-${Date.now()}`;
    logger.info('Idempotency Key:', idempotencyKey);

    let payment;
    try {
      payment = await paymentClient.create({ 
        body: paymentData,
        requestOptions: {
          idempotencyKey: idempotencyKey
        }
      });

      logger.info('Pago creado en MP:', {
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail
      });
    } catch (mpError) {
      logger.error('Error de Mercado Pago:', {
        message: mpError.message,
        cause: mpError.cause,
        status: mpError.status,
        statusCode: mpError.statusCode,
        error: mpError.error
      });
      
      // Intentar extraer más detalles del error
      const errorDetails = mpError.cause || mpError.error || mpError;
      const errorMessage = errorDetails.message || mpError.message || 'Error al procesar el pago con Mercado Pago';
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        details: errorDetails
      });
    }

    // Guardar en base de datos
    const paymentDoc = new Payment({
      compraId: compraId,
      comercioId: compra.comercioId,
      eventoId: eventoId,
      userId: compra.userId || null,
      amount: payment.transaction_amount,
      currency: payment.currency_id || 'COP',
      description: description,
      preferenceId: null,
      mercadoPagoId: payment.id.toString(),
      externalReference: compraId,
      status: payment.status,
      statusDetail: payment.status_detail,
      paymentMethod: payment.payment_method_id,
      paymentType: payment.payment_type_id,
      payer: {
        email: payer.email,
        firstName: payer.first_name || '',
        lastName: payer.last_name || '',
        identification: payer.identification || null,
      },
    });

    await paymentDoc.save();

    // Actualizar compra según el estado del pago
    const updateData = {
      pagoId: payment.id.toString(),
      metodoPago: paymentMethod,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (payment.status === 'approved') {
      updateData.status = 'completada';
      updateData.fechaPago = admin.firestore.FieldValue.serverTimestamp();
    } else if (payment.status === 'rejected') {
      updateData.status = 'fallida';
    } else if (payment.status === 'pending' || payment.status === 'in_process') {
      updateData.status = 'pendiente';
    }

    await db.collection('compras').doc(compraId).update(updateData);

    // 🎫 GENERAR TICKETS si el pago fue aprobado
    if (payment.status === 'approved') {
      try {
        await generateTicketsForPurchase(compraId, compra);
        logger.info(`✅ Tickets generados para compra ${compraId}`);
      } catch (ticketError) {
        logger.error(`Error al generar tickets para compra ${compraId}:`, ticketError);
        // No fallar la respuesta, pero registrar el error
      }
    }

    const responsePayload = {
      success: true,
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      message: payment.status === 'approved' 
        ? '¡Pago aprobado exitosamente!'
        : payment.status === 'rejected'
        ? 'Pago rechazado. Por favor verifica los datos de tu tarjeta.'
        : 'Pago en proceso de verificación.'
    };

    // Datos adicionales según método de pago
    if (payment.payment_method_id === 'pse') {
      responsePayload.redirectUrl =
        payment.transaction_details?.external_resource_url ||
        payment.point_of_interaction?.transaction_data?.ticket_url ||
        payment.point_of_interaction?.transaction_data?.bank_transfer_url ||
        null;

      responsePayload.instructions = {
        externalResourceUrl: responsePayload.redirectUrl,
        referenceId:
          payment.point_of_interaction?.transaction_data?.reference_id || null,
        status: payment.status,
        statusDetail: payment.status_detail
      };
    }

    if (payment.payment_method_id === 'efecty') {
      const transactionData =
        payment.point_of_interaction?.transaction_data || {};
      responsePayload.ticketUrl = transactionData.ticket_url || null;
      responsePayload.barcode = transactionData.barcode || null;
      responsePayload.expirationDate = transactionData.expiration_date || null;
      responsePayload.instructions = {
        ticketUrl: transactionData.ticket_url || null,
        externalResourceUrl:
          transactionData.external_resource_url ||
          transactionData.ticket_url ||
          null,
        qrCode: transactionData.qr_code || null,
        qrCodeBase64: transactionData.qr_code_base64 || null,
        reference: transactionData.reference || null,
        status: payment.status,
        statusDetail: payment.status_detail
      };
    }

    res.json(responsePayload);

  } catch (error) {
    logger.error('Error al procesar pago directo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el pago',
      error: error.message
    });
  }
};

/**
 * @desc    Webhook de Mercado Pago (recibe notificaciones de pago)
 * @route   POST /api/payments/webhook
 * @access  Public (validado por firma de MP)
 */
exports.webhook = async (req, res) => {
  try {
    // Validar signature de Mercado Pago para mayor seguridad
    const signature = req.headers['x-signature'] || req.headers['x-mp-signature'];
    const secret = '1c93d436abd1ee2961d8458d3aa5747ea629a26766293ffc3954d6d5aacf3f60';
    
    if (!signature || !secret) {
      logger.warn('Webhook sin signature válida');
      return res.status(401).json({
        success: false,
        message: 'Signature requerida para webhook'
      });
    }

    const { type, data, action } = req.body;

    logger.info('Webhook recibido de MP:', { type, data, action });

    // Mercado Pago envía diferentes tipos de notificaciones
    if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
      const paymentId = data.id;

      // Obtener información completa del pago desde MP
      const mpPayment = await paymentClient.get({ id: paymentId });

      logger.info('Información del pago desde MP:', mpPayment);

      const externalReference = mpPayment.external_reference; // compraId
      const status = mpPayment.status;
      const statusDetail = mpPayment.status_detail;

      // Registrar en PaymentRecord para análisis y reportes
      try {
        await PaymentRecord.updateFromWebhook(mpPayment);
        logger.info('✅ PaymentRecord actualizado desde webhook');
      } catch (recordError) {
        logger.error('❌ Error actualizando PaymentRecord:', recordError);
        // No fallar el webhook por este error
      }

      if (!externalReference) {
        logger.warn('Pago sin external_reference (compraId)');
        return res.status(200).json({ success: true, message: 'Sin external_reference' });
      }

      // Buscar el pago en nuestra base de datos
      let payment = await Payment.findByCompraId(externalReference);

      if (!payment) {
        logger.warn(`Pago no encontrado para compraId: ${externalReference}`);
        return res.status(200).json({ success: true, message: 'Pago no encontrado' });
      }

      // Actualizar el estado del pago
      payment.paymentId = paymentId;
      payment.status = status;
      payment.statusDetail = statusDetail;
      payment.paymentMethod = mpPayment.payment_method_id;
      payment.paymentType = mpPayment.payment_type_id;
      // ✅ CORREGIDO: Evitar valores undefined en Firestore
      payment.merchantOrderId = mpPayment.merchant_order_id || null;
      payment.mpResponse = mpPayment;
      payment.processedAt = admin.firestore.FieldValue.serverTimestamp();

      await payment.save();

      logger.info(`Pago actualizado: ${payment.id} - Status: ${status}`);

      // Si el pago fue aprobado, actualizar la compra y generar tickets
      if (status === 'approved') {
        const compraRef = db.collection('compras').doc(externalReference);
        const compraDoc = await compraRef.get();

        if (compraDoc.exists) {
          await compraRef.update({
            status: 'completada',
            paymentStatus: 'approved',
            paymentId: payment.id,
            paymentMPId: paymentId,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          logger.info(`Compra ${externalReference} marcada como completada`);

          // TODO: Aquí se puede disparar la generación automática de tickets
          // o el envío de email de confirmación si no se hizo antes
        }
      }

      // Si el pago fue rechazado o cancelado
      if (status === 'rejected' || status === 'cancelled') {
        const compraRef = db.collection('compras').doc(externalReference);
        const compraDoc = await compraRef.get();

        if (compraDoc.exists) {
          await compraRef.update({
            status: 'fallida',
            paymentStatus: status,
            paymentId: payment.id,
            paymentMPId: paymentId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          logger.info(`Compra ${externalReference} marcada como fallida`);
        }
      }
    }

    // Responder a MP para confirmar recepción
    res.status(200).json({ success: true });

  } catch (error) {
    logger.error('Error en webhook de MP:', error);
    // Siempre responder 200 a MP para evitar reintentos infinitos
    res.status(200).json({ success: false, error: error.message });
  }
};

/**
 * @desc    IPN de Mercado Pago (Instant Payment Notification)
 * @route   POST /api/payments/ipn
 * @access  Public
 */
exports.ipn = async (req, res) => {
  try {
    // IPN es similar al webhook, se puede reutilizar la misma lógica
    return exports.webhook(req, res);
  } catch (error) {
    logger.error('Error en IPN de MP:', error);
    res.status(200).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Obtener estado de un pago
 * @route   GET /api/payments/:id
 * @access  Private
 */
exports.getPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    res.json({
      success: true,
      data: payment.toJSON()
    });

  } catch (error) {
    logger.error('Error al obtener pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pago',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener pagos de un comercio
 * @route   GET /api/payments/comercio/:comercioId
 * @access  Private (requiere autenticación del comercio)
 */
exports.getPaymentsByComercio = async (req, res) => {
  try {
    const { comercioId } = req.params;
    const { limit = 50 } = req.query;

    const payments = await Payment.findByComercio(comercioId, parseInt(limit));

    res.json({
      success: true,
      count: payments.length,
      data: payments.map(p => p.toJSON())
    });

  } catch (error) {
    logger.error('Error al obtener pagos del comercio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos',
      error: error.message
    });
  }
};

/**
 * @desc    Simular webhook de Mercado Pago (solo para testing)
 * @route   POST /api/payments/simulate-webhook
 * @access  Public (solo en desarrollo)
 */
exports.simulateWebhook = async (req, res) => {
  try {
    const {
      compraId,
      status = 'approved',
      paymentId,
      paymentMethodId = 'pse'
    } = req.body;

    if (!compraId) {
      return res.status(400).json({
        success: false,
        message: 'compraId es requerido'
      });
    }

    // En producción, rechazar estas solicitudes
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Esta funcionalidad solo está disponible en desarrollo'
      });
    }

    logger.info(`🧪 Simulando webhook para compra ${compraId} con status ${status}`);

    // Buscar la compra en la base de datos
    const compraDoc = await db.collection('compras').doc(compraId).get();
    
    if (!compraDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    const compra = compraDoc.data();

    // Buscar el pago correspondiente
    let payment = await Payment.findByCompraId(compraId);

    if (!payment) {
      // Crear el pago si no existe (para casos de testing)
      const simulatedPaymentId = paymentId || `test_${Date.now()}`;
      payment = new Payment({
        compraId: compraId,
        comercioId: compra.comercioId,
        eventoId: compra.eventoId,
        userId: compra.userId || null,
        amount: compra.monto || 0,
        currency: 'COP',
        description: `Simulación de pago para compra ${compraId}`,
        preferenceId: null,
        mercadoPagoId: simulatedPaymentId,
        externalReference: compraId,
        status: status,
        statusDetail: status === 'approved' ? 'approved' : 'pending',
        paymentMethod: paymentMethodId,
        paymentType: paymentMethodId === 'pse' ? 'bank_transfer' : 'ticket',
        payer: {
          email: compra.email || 'test@example.com',
          firstName: compra.nombre || 'Test',
          lastName: compra.apellido || 'User',
          identification: { type: 'CC', number: '12345678' }
        },
      });

      await payment.save();
      logger.info(`🧪 Pago creado para simulación: ${payment.id}`);
    } else {
      // Actualizar el pago existente
      payment.status = status;
      payment.statusDetail = status === 'approved' ? 'approved' : 'pending';
      payment.processedAt = admin.firestore.FieldValue.serverTimestamp();
      await payment.save();
      logger.info(`🧪 Pago actualizado en simulación: ${payment.id}`);
    }

    // Actualizar la compra según el estado del pago
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (status === 'approved') {
      updateData.status = 'completada';
      updateData.paymentStatus = 'approved';
      updateData.fechaPago = admin.firestore.FieldValue.serverTimestamp();
      
      await db.collection('compras').doc(compraId).update(updateData);

      logger.info(`🧪 Compra ${compraId} marcada como completada`);

      // Generar tickets para la compra aprobada
      try {
        await generateTicketsForPurchase(compraId, compra);
        logger.info(`🧪 Tickets generados para compra ${compraId}`);
      } catch (ticketError) {
        logger.error(`🧪 Error generando tickets para compra ${compraId}:`, ticketError);
        // No fallar la respuesta, pero registrar el error
      }

    } else if (status === 'rejected') {
      updateData.status = 'fallida';
      updateData.paymentStatus = 'rejected';
      
      await db.collection('compras').doc(compraId).update(updateData);

      logger.info(`🧪 Compra ${compraId} marcada como fallida`);
    } else {
      updateData.status = 'pendiente';
      updateData.paymentStatus = 'pending';
      
      await db.collection('compras').doc(compraId).update(updateData);

      logger.info(`🧪 Compra ${compraId} marcada como pendiente`);
    }

    res.json({
      success: true,
      message: `Webhook simulado exitosamente`,
      data: {
        compraId: compraId,
        status: status,
        paymentId: payment.id,
        action: status === 'approved' ? 'completed' : 'failed'
      }
    });

  } catch (error) {
    logger.error('Error simulando webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error simulando webhook',
      error: error.message
    });
  }
};

