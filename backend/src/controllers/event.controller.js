const Event = require('../models/Event');
const Tenant = require('../models/Tenant');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc    Crear un nuevo evento
 * @route   POST /api/events
 * @access  Tenant Admin, Operations
 */
exports.createEvent = async (req, res) => {
  try {
    const { tenantId, name, description, date, endDate, venue, capacity, tiers, images, settings, metadata } = req.body;

    // Verificar que el usuario tenga acceso al tenant
    if (req.user.role !== 'platform_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este comercio'
      });
    }

    // Verificar que el tenant existe
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Comercio no encontrado'
      });
    }

    // Verificar límites del plan
    if (!tenant.canCreateMoreEvents()) {
      return res.status(403).json({
        success: false,
        error: `Has alcanzado el límite de ${tenant.subscription.maxEvents} eventos para tu plan ${tenant.subscription.plan}`
      });
    }

    // Asignar IDs únicos a los tiers si no los tienen
    const tiersWithIds = (tiers || []).map(tier => ({
      ...tier,
      id: tier.id || uuidv4(),
      sold: 0 // Inicializar tickets vendidos
    }));

    // Crear evento
    const event = new Event({
      tenantId,
      name,
      description,
      date,
      endDate,
      venue,
      capacity: capacity || 1000,
      tiers: tiersWithIds,
      images,
      settings,
      metadata,
      status: 'draft',
      createdBy: req.user.uid
    });

    await event.save();

    // Actualizar contador de eventos del tenant
    await tenant.updateStats({
      totalEvents: tenant.stats.totalEvents + 1
    });

    logger.info(`Evento creado: ${event.id} por usuario ${req.user.uid} en tenant ${tenantId}`);

    res.status(201).json({
      success: true,
      data: event.toJSON()
    });

  } catch (error) {
    logger.error(`Error en createEvent: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Obtener todos los eventos
 * @route   GET /api/events
 * @access  Según rol y tenant
 */
exports.getEvents = async (req, res) => {
  try {
    const { tenantId, status, category, orderBy, orderDirection, limit, offset } = req.query;

    const filters = {};

    // Si no es platform_admin, solo puede ver eventos de su tenant
    if (req.user.role !== 'platform_admin') {
      filters.tenantId = req.user.tenantId;
    } else if (tenantId) {
      // Platform admin puede filtrar por tenant específico
      filters.tenantId = tenantId;
    }

    if (status) filters.status = status;
    if (category) filters.category = category;
    if (orderBy) filters.orderBy = orderBy;
    if (orderDirection) filters.orderDirection = orderDirection;
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    const events = await Event.list(filters);

    res.json({
      success: true,
      count: events.length,
      data: events.map(e => e.toJSON())
    });

  } catch (error) {
    logger.error(`Error en getEvents: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Obtener un evento por ID
 * @route   GET /api/events/:id
 * @access  Según rol y tenant
 */
exports.getEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.role !== 'platform_admin' && req.user.tenantId !== event.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este evento'
      });
    }

    res.json({
      success: true,
      data: event.toJSON()
    });

  } catch (error) {
    logger.error(`Error en getEvent: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar un evento
 * @route   PATCH /api/events/:id
 * @access  Tenant Admin, Operations
 */
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.role !== 'platform_admin' && req.user.tenantId !== event.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este evento'
      });
    }

    // No permitir cambiar tenantId
    delete updates.tenantId;
    delete updates.createdBy;
    delete updates.createdAt;
    delete updates.stats; // Las stats se actualizan con updateStats

    // Si se actualizan tiers, asignar IDs si no existen
    if (updates.tiers) {
      updates.tiers = updates.tiers.map(tier => ({
        ...tier,
        id: tier.id || uuidv4(),
        sold: tier.sold || 0
      }));
    }

    // Aplicar actualizaciones
    Object.assign(event, updates);
    await event.save();

    logger.info(`Evento actualizado: ${event.id} por usuario ${req.user.uid}`);

    res.json({
      success: true,
      data: event.toJSON()
    });

  } catch (error) {
    logger.error(`Error en updateEvent: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Eliminar un evento (soft delete)
 * @route   DELETE /api/events/:id
 * @access  Tenant Admin
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.role !== 'platform_admin' && req.user.tenantId !== event.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este evento'
      });
    }

    // Solo tenant_admin puede eliminar
    if (req.user.role !== 'platform_admin' && req.user.role !== 'tenant_admin') {
      return res.status(403).json({
        success: false,
        error: 'Solo los administradores pueden eliminar eventos'
      });
    }

    await event.delete();

    logger.info(`Evento eliminado (soft): ${event.id} por usuario ${req.user.uid}`);

    res.json({
      success: true,
      message: 'Evento cancelado exitosamente'
    });

  } catch (error) {
    logger.error(`Error en deleteEvent: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Publicar un evento
 * @route   POST /api/events/:id/publish
 * @access  Tenant Admin
 */
exports.publishEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.role !== 'platform_admin' && req.user.tenantId !== event.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este evento'
      });
    }

    // Verificar que el evento tenga tiers configurados
    if (event.tiers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El evento debe tener al menos un tipo de entrada configurado'
      });
    }

    // Cambiar status a published
    event.status = 'published';
    await event.save();

    logger.info(`Evento publicado: ${event.id} por usuario ${req.user.uid}`);

    res.json({
      success: true,
      message: 'Evento publicado exitosamente',
      data: event.toJSON()
    });

  } catch (error) {
    logger.error(`Error en publishEvent: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Obtener estadísticas de un evento
 * @route   GET /api/events/:id/stats
 * @access  Según rol y tenant
 */
exports.getEventStats = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.role !== 'platform_admin' && req.user.tenantId !== event.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este evento'
      });
    }

    // Calcular disponibilidad por tier
    const tierStats = event.tiers.map(tier => ({
      id: tier.id,
      name: tier.name,
      price: tier.price,
      capacity: tier.capacity,
      sold: tier.sold || 0,
      available: tier.capacity - (tier.sold || 0),
      occupancyRate: ((tier.sold || 0) / tier.capacity * 100).toFixed(2)
    }));

    // Calcular disponibilidad total
    const totalAvailable = event.capacity - event.stats.totalTicketsSold;
    const occupancyRate = (event.stats.totalTicketsSold / event.capacity * 100).toFixed(2);

    res.json({
      success: true,
      data: {
        eventId: event.id,
        eventName: event.name,
        stats: event.stats,
        availability: {
          total: totalAvailable,
          capacity: event.capacity,
          occupancyRate: parseFloat(occupancyRate)
        },
        tiers: tierStats,
        hasAvailability: event.hasAvailability(),
        isActive: event.isActive(),
        isPast: event.isPast()
      }
    });

  } catch (error) {
    logger.error(`Error en getEventStats: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Publicar un evento (cambiar status a published)
 * @route   PATCH /api/events/:id/publish
 * @access  Tenant Admin
 */
exports.publishEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar el evento
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    // Verificar acceso (solo admin del tenant o platform admin)
    if (req.user.role !== 'platform_admin' && 
        (req.user.tenantId !== event.tenantId || req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden publicar eventos'
      });
    }

    // Validar que el evento puede ser publicado
    if (event.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'No se puede publicar un evento cancelado'
      });
    }

    if (event.isPast()) {
      return res.status(400).json({
        success: false,
        error: 'No se puede publicar un evento que ya pasó'
      });
    }

    // Validar que el evento tiene al menos un tier
    if (!event.tiers || event.tiers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El evento debe tener al menos un tipo de entrada para ser publicado'
      });
    }

    // Cambiar status a published
    event.status = 'published';
    await event.save();

    logger.info(`Evento publicado: ${event.id} por usuario ${req.user.uid}`);

    res.json({
      success: true,
      message: 'Evento publicado exitosamente',
      data: event.toJSON()
    });

  } catch (error) {
    logger.error(`Error en publishEvent: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Despublicar un evento (cambiar status a draft)
 * @route   PATCH /api/events/:id/unpublish
 * @access  Tenant Admin
 */
exports.unpublishEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar el evento
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    // Verificar acceso (solo admin del tenant o platform admin)
    if (req.user.role !== 'platform_admin' && 
        (req.user.tenantId !== event.tenantId || req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden despublicar eventos'
      });
    }

    // Validar que el evento puede ser despublicado
    if (event.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'No se puede despublicar un evento cancelado'
      });
    }

    // Advertencia si ya hay tickets vendidos
    if (event.stats.totalTicketsSold > 0) {
      logger.warn(`Despublicando evento ${event.id} con ${event.stats.totalTicketsSold} tickets vendidos`);
    }

    // Cambiar status a draft
    event.status = 'draft';
    await event.save();

    logger.info(`Evento despublicado: ${event.id} por usuario ${req.user.uid}`);

    res.json({
      success: true,
      message: 'Evento despublicado exitosamente',
      data: event.toJSON(),
      warning: event.stats.totalTicketsSold > 0 
        ? `Este evento tiene ${event.stats.totalTicketsSold} tickets vendidos. Los compradores seguirán teniendo acceso.`
        : null
    });

  } catch (error) {
    logger.error(`Error en unpublishEvent: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Cancelar un evento permanentemente
 * @route   PATCH /api/events/:id/cancel
 * @access  Tenant Admin
 */
exports.cancelEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Buscar el evento
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    // Verificar acceso (solo admin del tenant o platform admin)
    if (req.user.role !== 'platform_admin' && 
        (req.user.tenantId !== event.tenantId || req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden cancelar eventos'
      });
    }

    // Validar que el evento no está ya cancelado
    if (event.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'El evento ya está cancelado'
      });
    }

    // Advertencia crítica si hay tickets vendidos
    if (event.stats.totalTicketsSold > 0) {
      logger.error(`Cancelando evento ${event.id} con ${event.stats.totalTicketsSold} tickets vendidos`);
      // TODO: Implementar notificación automática a compradores
      // TODO: Implementar sistema de reembolsos
    }

    // Guardar razón de cancelación en metadata
    event.metadata = {
      ...event.metadata,
      cancellationReason: reason || 'No especificada',
      cancelledAt: new Date().toISOString(),
      cancelledBy: req.user.uid
    };

    // Cambiar status a cancelled
    event.status = 'cancelled';
    await event.save();

    logger.info(`Evento cancelado: ${event.id} por usuario ${req.user.uid}. Razón: ${reason || 'No especificada'}`);

    res.json({
      success: true,
      message: 'Evento cancelado',
      data: event.toJSON(),
      warning: event.stats.totalTicketsSold > 0 
        ? `Este evento tiene ${event.stats.totalTicketsSold} tickets vendidos. Asegúrate de notificar a los compradores y procesar reembolsos.`
        : null
    });

  } catch (error) {
    logger.error(`Error en cancelEvent: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

