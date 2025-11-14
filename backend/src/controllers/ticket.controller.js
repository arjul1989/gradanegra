const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const Tenant = require('../models/Tenant');
const QRCode = require('qrcode');
const logger = require('../utils/logger');
const { generateTicketPDF } = require('../utils/pdf');
const { sendTicketEmail } = require('../utils/email');
const { generateAppleWalletPass, isAppleWalletConfigured } = require('../utils/wallet');

/**
 * Genera un QR code como data URL
 */
async function generateQRCode(data) {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });
    return qrDataUrl;
  } catch (error) {
    throw new Error(`Error generando QR code: ${error.message}`);
  }
}

/**
 * Crea un nuevo ticket o múltiples tickets
 * POST /api/tickets
 */
exports.createTickets = async (req, res) => {
  try {
    const {
      eventId,
      tierId,
      quantity = 1,
      buyer,
      purchaseId,
      sendEmail = true // Por defecto envía email automáticamente
    } = req.body;

    // Verificar que el evento existe
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    // Verificar que el tenant del evento coincide con el tenant del usuario
    if (event.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para crear tickets en este evento'
      });
    }

    // Verificar que el evento está activo
    if (event.status !== 'published' && event.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'El evento no está disponible para venta de tickets'
      });
    }

    // Verificar que el tier existe
    const tier = event.tiers.find(t => t.id === tierId);
    if (!tier) {
      return res.status(404).json({
        success: false,
        error: 'Tier no encontrado en este evento'
      });
    }

    // Verificar disponibilidad
    const tierAvailability = event.getTierAvailability(tierId);
    if (tierAvailability.available < quantity) {
      return res.status(400).json({
        success: false,
        error: `Solo hay ${tierAvailability.available} tickets disponibles para este tier`
      });
    }

    // Obtener tenant para el email
    const tenant = await Tenant.findById(event.tenantId);
    
    // Crear los tickets
    const tickets = [];
    const errors = [];
    const emailResults = [];

    for (let i = 0; i < quantity; i++) {
      try {
        const ticketData = {
          eventId,
          tenantId: event.tenantId,
          tierId,
          purchaseId,
          buyerId: req.user?.uid || null, // Vincular con comprador autenticado si existe
          buyer,
          price: tier.price,
          currency: 'COP',
          fees: 0, // Calcular según configuración del tenant
          taxes: 0, // Calcular según configuración del tenant
          total: tier.price,
          status: 'confirmed', // O 'pending' si requiere pago
          isTransferable: tier.isTransferable || false
        };

        const ticket = new Ticket(ticketData);
        
        // Generar hash de seguridad
        await ticket.generateSecurityHash();
        
        // Generar QR code
        const qrData = JSON.stringify({
          ticketNumber: ticket.ticketNumber,
          eventId: ticket.eventId,
          hash: ticket.securityHash
        });
        ticket.qrCodeDataUrl = await generateQRCode(qrData);
        
        // Guardar el ticket
        await ticket.save();
        tickets.push(ticket);

        logger.info(`Ticket creado: ${ticket.ticketNumber}`, {
          ticketId: ticket.id,
          eventId,
          tenantId: event.tenantId
        });

        // Enviar email automáticamente si está habilitado
        if (sendEmail && tenant) {
          try {
            // Generar PDF
            const pdfBuffer = await generateTicketPDF({
              ticket,
              event,
              tenant,
              tierName: tier.name
            });

            // Generar Apple Wallet pass si está configurado
            let pkpassBuffer = null;
            if (isAppleWalletConfigured()) {
              try {
                pkpassBuffer = await generateAppleWalletPass({
                  ticket,
                  event,
                  tenant,
                  tierName: tier.name
                });
                logger.info(`Apple Wallet pass generado para ticket ${ticket.ticketNumber}`);
              } catch (walletError) {
                logger.warn(`No se pudo generar Apple Wallet pass para ticket ${ticket.ticketNumber}:`, walletError);
                // Continuar sin .pkpass - no es crítico
              }
            }

            // Enviar email con PDF y opcionalmente .pkpass
            const emailResult = await sendTicketEmail({
              to: ticket.buyer.email,
              buyerName: ticket.buyer.name,
              event,
              ticket: {
                ...ticket.toJSON(),
                tierName: tier.name
              },
              tenantName: tenant.name,
              pdfBuffer,
              pkpassBuffer
            });

            emailResults.push({
              ticketId: ticket.id,
              ticketNumber: ticket.ticketNumber,
              emailId: emailResult.emailId,
              sentTo: ticket.buyer.email
            });

            logger.info(`Email enviado para ticket ${ticket.ticketNumber}`, {
              emailId: emailResult.emailId
            });
          } catch (emailError) {
            logger.error(`Error enviando email para ticket ${ticket.ticketNumber}:`, emailError);
            // No fallar la creación del ticket si falla el email
            errors.push({
              index: i,
              ticketId: ticket.id,
              type: 'email',
              error: emailError.message
            });
          }
        }
      } catch (error) {
        errors.push({
          index: i,
          type: 'ticket',
          error: error.message
        });
      }
    }

    // Actualizar estadísticas del evento
    if (tickets.length > 0) {
      await event.updateStats({
        ticketsSold: tickets.length,
        tierId: tierId
      });
    }

    // Respuesta
    if (errors.filter(e => e.type === 'ticket').length > 0 && tickets.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'No se pudo crear ningún ticket',
        details: errors
      });
    }

    res.status(201).json({
      success: true,
      data: {
        tickets: tickets.map(t => t.toJSON()),
        created: tickets.length,
        emailsSent: emailResults.length,
        emailResults: emailResults.length > 0 ? emailResults : undefined,
        errors: errors.length > 0 ? errors : undefined
      },
      message: sendEmail && emailResults.length > 0 
        ? `${tickets.length} ticket(s) creado(s) y ${emailResults.length} email(s) enviado(s)`
        : `${tickets.length} ticket(s) creado(s)`
    });
  } catch (error) {
    logger.error('Error en createTickets:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear tickets',
      details: error.message
    });
  }
};

/**
 * Obtiene un ticket por ID
 * GET /api/tickets/:id
 */
exports.getTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket no encontrado'
      });
    }

    // Verificar permisos: el ticket debe ser del tenant del usuario
    if (ticket.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para ver este ticket'
      });
    }

    res.json({
      success: true,
      data: ticket.toJSON()
    });
  } catch (error) {
    logger.error('Error en getTicket:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener ticket',
      details: error.message
    });
  }
};

/**
 * Obtiene un ticket por número de ticket
 * GET /api/tickets/number/:ticketNumber
 */
exports.getTicketByNumber = async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const ticket = await Ticket.findByTicketNumber(ticketNumber);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket no encontrado'
      });
    }

    // Verificar permisos
    if (ticket.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para ver este ticket'
      });
    }

    res.json({
      success: true,
      data: ticket.toJSON()
    });
  } catch (error) {
    logger.error('Error en getTicketByNumber:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener ticket',
      details: error.message
    });
  }
};

/**
 * Lista tickets de un evento
 * GET /api/events/:eventId/tickets
 */
exports.getEventTickets = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, tierId, isValidated, limit } = req.query;

    // Verificar que el evento existe y pertenece al tenant
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    if (event.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para ver tickets de este evento'
      });
    }

    // Construir filtros
    const filters = { limit: parseInt(limit) || 100 };
    if (status) filters.status = status;
    if (tierId) filters.tierId = tierId;
    if (isValidated !== undefined) filters.isValidated = isValidated === 'true';

    const tickets = await Ticket.findByEvent(eventId, filters);

    res.json({
      success: true,
      data: {
        tickets: tickets.map(t => t.toJSON()),
        count: tickets.length
      }
    });
  } catch (error) {
    logger.error('Error en getEventTickets:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener tickets',
      details: error.message
    });
  }
};

/**
 * Lista tickets de un comprador
 * GET /api/tickets/buyer/:email
 */
exports.getBuyerTickets = async (req, res) => {
  try {
    const { email } = req.params;

    // Verificar que el usuario puede acceder a estos tickets
    // (puede ser su propio email o tener permisos de admin)
    if (req.user.email !== email && !req.user.permissions?.includes('manage_tickets')) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para ver estos tickets'
      });
    }

    const tickets = await Ticket.findByBuyerEmail(email);

    // Filtrar solo tickets del tenant del usuario (si aplica)
    const filteredTickets = req.user.permissions?.includes('manage_tickets')
      ? tickets.filter(t => t.tenantId === req.user.tenantId)
      : tickets;

    res.json({
      success: true,
      data: {
        tickets: filteredTickets.map(t => t.toPublicJSON()),
        count: filteredTickets.length
      }
    });
  } catch (error) {
    logger.error('Error en getBuyerTickets:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener tickets',
      details: error.message
    });
  }
};

/**
 * Valida un ticket (check-in)
 * POST /api/tickets/:id/validate
 */
exports.validateTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket no encontrado'
      });
    }

    // Verificar permisos
    if (ticket.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para validar este ticket'
      });
    }

    // Verificar hash
    const isHashValid = await ticket.verifyHash();
    if (!isHashValid) {
      return res.status(400).json({
        success: false,
        error: 'El hash de seguridad del ticket no es válido'
      });
    }

    // Validar el ticket (check-in)
    await ticket.checkIn(req.user.uid);

    logger.info(`Ticket validado: ${ticket.ticketNumber}`, {
      ticketId: ticket.id,
      validatedBy: req.user.uid,
      tenantId: ticket.tenantId
    });

    res.json({
      success: true,
      data: ticket.toJSON(),
      message: 'Ticket validado exitosamente'
    });
  } catch (error) {
    logger.error('Error en validateTicket:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Valida un ticket por número de ticket
 * POST /api/tickets/validate/:ticketNumber
 */
exports.validateTicketByNumber = async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const ticket = await Ticket.findByTicketNumber(ticketNumber);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket no encontrado'
      });
    }

    // Verificar permisos
    if (ticket.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para validar este ticket'
      });
    }

    // Verificar hash
    const isHashValid = await ticket.verifyHash();
    if (!isHashValid) {
      return res.status(400).json({
        success: false,
        error: 'El hash de seguridad del ticket no es válido'
      });
    }

    // Validar el ticket (check-in)
    await ticket.checkIn(req.user.uid);

    logger.info(`Ticket validado: ${ticket.ticketNumber}`, {
      ticketId: ticket.id,
      validatedBy: req.user.uid,
      tenantId: ticket.tenantId
    });

    res.json({
      success: true,
      data: ticket.toJSON(),
      message: 'Ticket validado exitosamente'
    });
  } catch (error) {
    logger.error('Error en validateTicketByNumber:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Cancela un ticket
 * DELETE /api/tickets/:id
 */
exports.cancelTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket no encontrado'
      });
    }

    // Verificar permisos
    if (ticket.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para cancelar este ticket'
      });
    }

    await ticket.cancel();

    // Actualizar estadísticas del evento
    const event = await Event.findById(ticket.eventId);
    if (event) {
      await event.updateStats({
        ticketsCancelled: 1,
        tierId: ticket.tierId
      });
    }

    logger.info(`Ticket cancelado: ${ticket.ticketNumber}`, {
      ticketId: ticket.id,
      tenantId: ticket.tenantId
    });

    res.json({
      success: true,
      message: 'Ticket cancelado exitosamente'
    });
  } catch (error) {
    logger.error('Error en cancelTicket:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Regenera el QR code de un ticket
 * POST /api/tickets/:id/regenerate-qr
 */
exports.regenerateQR = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket no encontrado'
      });
    }

    // Verificar permisos
    if (ticket.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para regenerar el QR de este ticket'
      });
    }

    // Regenerar QR code
    const qrData = JSON.stringify({
      ticketNumber: ticket.ticketNumber,
      eventId: ticket.eventId,
      hash: ticket.securityHash
    });
    ticket.qrCodeDataUrl = await generateQRCode(qrData);
    
    await ticket.save();

    res.json({
      success: true,
      data: {
        qrCodeDataUrl: ticket.qrCodeDataUrl
      },
      message: 'QR code regenerado exitosamente'
    });
  } catch (error) {
    logger.error('Error en regenerateQR:', error);
    res.status(500).json({
      success: false,
      error: 'Error al regenerar QR code',
      details: error.message
    });
  }
};

/**
 * Envía el ticket por email con PDF adjunto
 * POST /api/tickets/:id/send-email
 */
exports.sendTicketByEmail = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket no encontrado'
      });
    }

    // Verificar permisos
    if (ticket.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para enviar este ticket'
      });
    }

    // Obtener información del evento y tenant
    const event = await Event.findById(ticket.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    const tenant = await Tenant.findById(ticket.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant no encontrado'
      });
    }

    // Obtener nombre del tier
    const tier = event.tiers.find(t => t.id === ticket.tierId);
    const tierName = tier ? tier.name : 'General';

    // Generar PDF
    const pdfBuffer = await generateTicketPDF({
      ticket,
      event,
      tenant,
      tierName
    });

    // Enviar email con PDF adjunto
    const emailResult = await sendTicketEmail({
      to: ticket.buyer.email,
      buyerName: ticket.buyer.name,
      event,
      ticket: {
        ...ticket.toJSON(),
        tierName
      },
      tenantName: tenant.name,
      pdfBuffer
    });

    logger.info(`Email de ticket enviado: ${ticket.ticketNumber}`, {
      ticketId: ticket.id,
      email: ticket.buyer.email,
      emailId: emailResult.emailId
    });

    res.json({
      success: true,
      message: 'Ticket enviado por email exitosamente',
      data: {
        emailId: emailResult.emailId,
        sentTo: ticket.buyer.email
      }
    });
  } catch (error) {
    logger.error('Error en sendTicketByEmail:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar ticket por email',
      details: error.message
    });
  }
};

/**
 * Genera y descarga el archivo .pkpass de Apple Wallet
 * GET /api/tickets/:id/apple-wallet
 */
exports.generateAppleWallet = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si Apple Wallet está configurado
    if (!isAppleWalletConfigured()) {
      return res.status(501).json({
        success: false,
        error: 'Apple Wallet no está configurado',
        message: 'Por favor consulta backend/certificates/README.md para configurar los certificados necesarios'
      });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket no encontrado'
      });
    }

    // Verificar permisos
    if (ticket.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para generar el wallet pass de este ticket'
      });
    }

    // Obtener información del evento y tenant
    const event = await Event.findById(ticket.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    const tenant = await Tenant.findById(ticket.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant no encontrado'
      });
    }

    // Obtener nombre del tier
    const tier = event.tiers.find(t => t.id === ticket.tierId);
    const tierName = tier ? tier.name : 'General';

    // Generar .pkpass
    const pkpassBuffer = await generateAppleWalletPass({
      ticket,
      event,
      tenant,
      tierName,
      backgroundColor: tenant.branding?.primaryColor || 'rgb(0, 0, 0)'
    });

    // Establecer headers para descarga
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="${ticket.ticketNumber}.pkpass"`);
    res.setHeader('Content-Length', pkpassBuffer.length);

    logger.info(`Apple Wallet pass generado para ticket ${ticket.ticketNumber}`, {
      ticketId: ticket.id,
      tenantId: ticket.tenantId
    });

    res.send(pkpassBuffer);
  } catch (error) {
    logger.error('Error en generateAppleWallet:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar Apple Wallet pass',
      details: error.message
    });
  }
};

module.exports = exports;
