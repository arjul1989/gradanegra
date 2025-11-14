const Buyer = require('../models/Buyer');
const Ticket = require('../models/Ticket');
const { admin } = require('../config/firebase');
const logger = require('../utils/logger');

/**
 * @desc    Registrar un nuevo comprador con email/password
 * @route   POST /api/buyers/register
 * @access  Public
 */
exports.registerBuyer = async (req, res) => {
  try {
    const { email, password, displayName, phoneNumber } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y password son requeridos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'El password debe tener al menos 6 caracteres'
      });
    }

    // Crear usuario en Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email.toLowerCase(),
      password,
      displayName: displayName || email.split('@')[0],
      phoneNumber: phoneNumber || null,
      emailVerified: false
    });

    // Crear perfil de comprador en Firestore
    const buyer = new Buyer({
      id: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      phoneNumber: userRecord.phoneNumber,
      authProvider: 'password',
      emailVerified: false,
      profile: {
        firstName: '',
        lastName: '',
        preferences: {
          language: 'es',
          currency: 'COP',
          notifications: {
            email: true,
            sms: false,
            push: false
          }
        }
      }
    });

    await buyer.save();

    // Generar custom token para login automático
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    logger.info(`Comprador registrado: ${buyer.email} (${buyer.id})`);

    res.status(201).json({
      success: true,
      message: 'Comprador registrado exitosamente. Por favor verifica tu email.',
      data: {
        buyer: buyer.toJSON(),
        customToken // El frontend lo usa para login inmediato
      }
    });

  } catch (error) {
    logger.error(`Error en registerBuyer: ${error.message}`);
    
    // Manejar errores específicos de Firebase
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        success: false,
        error: 'Este email ya está registrado'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Login con Google OAuth (crear o actualizar comprador)
 * @route   POST /api/buyers/auth/google
 * @access  Public
 */
exports.googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'Token de Google es requerido'
      });
    }

    // Verificar el token de Google con Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture, phone_number, email_verified, firebase } = decodedToken;

    // Verificar que el proveedor es Google
    const signInProvider = firebase.sign_in_provider;
    if (signInProvider !== 'google.com') {
      return res.status(400).json({
        success: false,
        error: 'Este endpoint es solo para autenticación con Google'
      });
    }

    // Buscar o crear comprador
    let buyer = await Buyer.findById(uid);

    if (!buyer) {
      // Crear nuevo comprador desde cuenta de Google
      buyer = new Buyer({
        id: uid,
        email: email.toLowerCase(),
        displayName: name || email.split('@')[0],
        photoURL: picture || null,
        phoneNumber: phone_number || null,
        authProvider: 'google.com',
        emailVerified: email_verified || true, // Google verifica emails
        profile: {
          firstName: name ? name.split(' ')[0] : '',
          lastName: name ? name.split(' ').slice(1).join(' ') : '',
          preferences: {
            language: 'es',
            currency: 'COP',
            notifications: {
              email: true,
              sms: false,
              push: false
            }
          }
        }
      });

      await buyer.save();
      logger.info(`Nuevo comprador creado vía Google: ${buyer.email} (${buyer.id})`);
    } else {
      // Actualizar último login
      await buyer.updateLastLogin();
      logger.info(`Comprador login vía Google: ${buyer.email} (${buyer.id})`);
    }

    res.json({
      success: true,
      message: 'Autenticación exitosa con Google',
      data: {
        buyer: buyer.toJSON()
      }
    });

  } catch (error) {
    logger.error(`Error en googleAuth: ${error.message}`);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token de Google expirado'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Login con email/password
 * @route   POST /api/buyers/login
 * @access  Public
 * @note    El cliente debe hacer el login con Firebase SDK y enviar el idToken
 */
exports.loginBuyer = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'Token de autenticación es requerido'
      });
    }

    // Verificar el token con Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid } = decodedToken;

    // Buscar comprador
    let buyer = await Buyer.findById(uid);

    if (!buyer) {
      // Si no existe el perfil, crearlo desde Firebase Auth
      const userRecord = await admin.auth().getUser(uid);
      
      buyer = new Buyer({
        id: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || userRecord.email.split('@')[0],
        phoneNumber: userRecord.phoneNumber,
        authProvider: userRecord.providerData[0]?.providerId || 'password',
        emailVerified: userRecord.emailVerified
      });

      await buyer.save();
      logger.info(`Perfil de comprador creado en primer login: ${buyer.email}`);
    }

    // Verificar que está activo
    if (!buyer.isActive()) {
      return res.status(403).json({
        success: false,
        error: 'Esta cuenta ha sido desactivada'
      });
    }

    // Actualizar último login
    await buyer.updateLastLogin();

    logger.info(`Comprador login: ${buyer.email} (${buyer.id})`);

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        buyer: buyer.toJSON()
      }
    });

  } catch (error) {
    logger.error(`Error en loginBuyer: ${error.message}`);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado, por favor inicia sesión nuevamente'
      });
    }

    if (error.code === 'auth/argument-error') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Obtener perfil del comprador autenticado
 * @route   GET /api/buyers/me
 * @access  Buyer (authenticated)
 */
exports.getMyProfile = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.uid);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        error: 'Perfil no encontrado'
      });
    }

    res.json({
      success: true,
      data: buyer.toPrivateJSON()
    });

  } catch (error) {
    logger.error(`Error en getMyProfile: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar perfil del comprador
 * @route   PATCH /api/buyers/me
 * @access  Buyer (authenticated)
 */
exports.updateMyProfile = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.uid);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        error: 'Perfil no encontrado'
      });
    }

    const {
      displayName,
      phoneNumber,
      profile
    } = req.body;

    // Actualizar campos básicos
    if (displayName !== undefined) buyer.displayName = displayName;
    if (phoneNumber !== undefined) buyer.phoneNumber = phoneNumber;

    // Actualizar perfil
    if (profile) {
      await buyer.updateProfile(profile);
    }

    // Guardar cambios
    await buyer.save();

    logger.info(`Perfil actualizado: ${buyer.email} (${buyer.id})`);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: buyer.toPrivateJSON()
    });

  } catch (error) {
    logger.error(`Error en updateMyProfile: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Obtener tickets del comprador
 * @route   GET /api/buyers/me/tickets
 * @access  Buyer (authenticated)
 */
exports.getMyTickets = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.uid);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        error: 'Perfil no encontrado'
      });
    }

    // Buscar tickets por buyerId o por email
    const ticketsByUserId = await Ticket.list({
      buyerId: buyer.id,
      limit: 1000
    });

    const ticketsByEmail = await Ticket.findByBuyerEmail(buyer.email);

    // Combinar y deduplicar tickets
    const allTickets = [...ticketsByUserId];
    ticketsByEmail.forEach(ticket => {
      if (!allTickets.find(t => t.id === ticket.id)) {
        allTickets.push(ticket);
      }
    });

    // Ordenar por fecha de creación (más recientes primero)
    allTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Cargar información de los eventos
    const Event = require('../models/Event');
    const ticketsWithEvents = await Promise.all(
      allTickets.map(async (ticket) => {
        const ticketData = ticket.toPublicJSON();
        if (ticket.eventId) {
          const event = await Event.findById(ticket.eventId);
          if (event) {
            ticketData.event = event.toJSON();
          }
        }
        return ticketData;
      })
    );

    res.json({
      success: true,
      count: ticketsWithEvents.length,
      data: ticketsWithEvents
    });

  } catch (error) {
    logger.error(`Error en getMyTickets: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Obtener detalle de un ticket del comprador
 * @route   GET /api/buyers/me/tickets/:id
 * @access  Buyer (authenticated)
 */
exports.getMyTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const buyer = await Buyer.findById(req.user.uid);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        error: 'Perfil no encontrado'
      });
    }

    // Buscar ticket por ticketNumber o por ID de documento
    let ticket = await Ticket.findByTicketNumber(id);
    if (!ticket) {
      ticket = await Ticket.findById(id);
    }

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket no encontrado'
      });
    }

    // Verificar que el ticket pertenece al comprador
    const isOwner = ticket.buyerId === buyer.id || 
                    ticket.buyer.email.toLowerCase() === buyer.email.toLowerCase();

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este ticket'
      });
    }

    // Cargar información del evento
    const Event = require('../models/Event');
    const ticketData = ticket.toPublicJSON();
    if (ticket.eventId) {
      const event = await Event.findById(ticket.eventId);
      if (event) {
        ticketData.event = event.toJSON();
      }
    }

    res.json({
      success: true,
      data: ticketData
    });

  } catch (error) {
    logger.error(`Error en getMyTicket: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Reenviar email de un ticket
 * @route   POST /api/buyers/me/tickets/:id/resend
 * @access  Buyer (authenticated)
 */
exports.resendMyTicketEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const buyer = await Buyer.findById(req.user.uid);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        error: 'Perfil no encontrado'
      });
    }

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket no encontrado'
      });
    }

    // Verificar ownership
    const isOwner = ticket.buyerId === buyer.id || 
                    ticket.buyer.email.toLowerCase() === buyer.email.toLowerCase();

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este ticket'
      });
    }

    // Reenviar email (reutilizar lógica del ticket controller)
    const Event = require('../models/Event');
    const Tenant = require('../models/Tenant');
    const { generateTicketPDF } = require('../utils/pdf');
    const { sendTicketEmail } = require('../utils/email');
    const { generateAppleWalletPass, isAppleWalletConfigured } = require('../utils/wallet');

    const event = await Event.findById(ticket.eventId);
    const tenant = await Tenant.findById(ticket.tenantId);

    if (!event || !tenant) {
      return res.status(404).json({
        success: false,
        error: 'Evento o comercio no encontrado'
      });
    }

    // Obtener tier name
    const tier = event.tiers.find(t => t.id === ticket.tierId);
    const tierName = tier ? tier.name : 'General';

    // Generar PDF
    const pdfBuffer = await generateTicketPDF({
      ticket,
      event,
      tenant,
      tierName
    });

    // Generar Apple Wallet si está configurado
    let pkpassBuffer = null;
    if (isAppleWalletConfigured()) {
      try {
        pkpassBuffer = await generateAppleWalletPass({
          ticket,
          event,
          tenant,
          tierName
        });
      } catch (walletError) {
        logger.warn(`No se pudo generar Apple Wallet pass: ${walletError.message}`);
      }
    }

    // Enviar email
    await sendTicketEmail({
      to: ticket.buyer.email,
      buyerName: ticket.buyer.name,
      event,
      ticket: {
        ...ticket.toJSON(),
        tierName
      },
      tenantName: tenant.name,
      pdfBuffer,
      pkpassBuffer
    });

    logger.info(`Email reenviado para ticket ${ticket.ticketNumber} por comprador ${buyer.id}`);

    res.json({
      success: true,
      message: 'Email enviado exitosamente'
    });

  } catch (error) {
    logger.error(`Error en resendMyTicketEmail: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Eliminar cuenta de comprador
 * @route   DELETE /api/buyers/me
 * @access  Buyer (authenticated)
 */
exports.deleteMyAccount = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.uid);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        error: 'Perfil no encontrado'
      });
    }

    // Soft delete en Firestore
    await buyer.deactivate();

    // Deshabilitar en Firebase Auth
    await admin.auth().updateUser(req.user.uid, {
      disabled: true
    });

    logger.info(`Cuenta de comprador eliminada: ${buyer.email} (${buyer.id})`);

    res.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    });

  } catch (error) {
    logger.error(`Error en deleteMyAccount: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
