const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Event = require('../models/Event');
const logger = require('../utils/logger');
const { admin } = require('../config/firebase');

/**
 * @desc    Crear un nuevo tenant (comercio)
 * @route   POST /api/tenants
 * @access  Platform Admin
 */
exports.createTenant = async (req, res) => {
  try {
    const { name, email, logoUrl, settings, contactInfo, adminUser } = req.body;

    // Verificar si el email del tenant ya existe
    const existingTenant = await Tenant.findByEmail(email);
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un comercio con ese email'
      });
    }

    // Generar slug único
    let slug = Tenant.generateSlug(name);
    let existingSlug = await Tenant.findBySlug(slug);
    let counter = 1;
    
    // Si el slug existe, agregar sufijo numérico
    while (existingSlug) {
      slug = `${Tenant.generateSlug(name)}-${counter}`;
      existingSlug = await Tenant.findBySlug(slug);
      counter++;
    }

    // Crear tenant
    const tenant = new Tenant({
      name,
      slug,
      email,
      logoUrl,
      settings,
      contactInfo,
      createdBy: req.user.uid
    });

    await tenant.save();

    logger.info(`Tenant creado: ${tenant.id} por usuario ${req.user.uid}`);

    // Si se proporciona adminUser, crear el usuario administrador del tenant
    let tenantAdmin = null;
    if (adminUser && adminUser.email && adminUser.password) {
      try {
        // Crear usuario en Firebase Auth
        const firebaseUser = await admin.auth().createUser({
          email: adminUser.email,
          password: adminUser.password,
          displayName: adminUser.displayName || name
        });

        // Crear usuario en Firestore
        tenantAdmin = new User({
          firebaseUid: firebaseUser.uid,
          email: adminUser.email,
          displayName: adminUser.displayName || name,
          role: 'tenant_admin',
          tenantId: tenant.id,
          permissions: ['manage_events', 'manage_tickets', 'view_reports'],
          isActive: true
        });

        await tenantAdmin.save();

        logger.info(`Admin de tenant creado: ${tenantAdmin.id} para tenant ${tenant.id}`);
      } catch (error) {
        logger.error(`Error al crear admin de tenant: ${error.message}`);
        // No fallar la creación del tenant si falla la creación del admin
        // El admin se puede crear después
      }
    }

    res.status(201).json({
      success: true,
      data: {
        tenant: tenant.toJSON(),
        admin: tenantAdmin ? tenantAdmin.toJSON() : null
      }
    });

  } catch (error) {
    logger.error(`Error en createTenant: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Obtener todos los tenants
 * @route   GET /api/tenants
 * @access  Platform Admin
 */
exports.getTenants = async (req, res) => {
  try {
    const { status, plan, limit } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (plan) filters.plan = plan;
    if (limit) filters.limit = parseInt(limit);

    const tenants = await Tenant.list(filters);

    res.json({
      success: true,
      count: tenants.length,
      data: tenants.map(t => t.toJSON())
    });

  } catch (error) {
    logger.error(`Error en getTenants: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Obtener un tenant por ID
 * @route   GET /api/tenants/:id
 * @access  Platform Admin, Tenant Admin (solo su tenant)
 */
exports.getTenant = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Comercio no encontrado'
      });
    }

    // Si es tenant_admin, verificar que sea su tenant
    if (req.user.role === 'tenant_admin' && req.user.tenantId !== tenant.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este comercio'
      });
    }

    res.json({
      success: true,
      data: tenant.toJSON()
    });

  } catch (error) {
    logger.error(`Error en getTenant: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar un tenant
 * @route   PATCH /api/tenants/:id
 * @access  Platform Admin, Tenant Admin (solo su tenant, campos limitados)
 */
exports.updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Comercio no encontrado'
      });
    }

    // Si es tenant_admin, verificar que sea su tenant
    if (req.user.role === 'tenant_admin' && req.user.tenantId !== tenant.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este comercio'
      });
    }

    // Campos que pueden actualizar los tenant_admin
    const tenantAdminAllowedFields = ['name', 'logoUrl', 'settings', 'contactInfo'];
    
    // Si es tenant_admin, filtrar campos permitidos
    if (req.user.role === 'tenant_admin') {
      Object.keys(updates).forEach(key => {
        if (!tenantAdminAllowedFields.includes(key)) {
          delete updates[key];
        }
      });
    }

    // Verificar slug único si se actualiza
    if (updates.slug && updates.slug !== tenant.slug) {
      const existingSlug = await Tenant.findBySlug(updates.slug);
      if (existingSlug) {
        return res.status(400).json({
          success: false,
          error: 'El slug ya está en uso'
        });
      }
    }

    // Verificar email único si se actualiza
    if (updates.email && updates.email !== tenant.email) {
      const existingEmail = await Tenant.findByEmail(updates.email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          error: 'El email ya está en uso'
        });
      }
    }

    // Aplicar actualizaciones
    Object.assign(tenant, updates);
    await tenant.save();

    logger.info(`Tenant actualizado: ${tenant.id} por usuario ${req.user.uid}`);

    res.json({
      success: true,
      data: tenant.toJSON()
    });

  } catch (error) {
    logger.error(`Error en updateTenant: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Eliminar un tenant (soft delete)
 * @route   DELETE /api/tenants/:id
 * @access  Platform Admin
 */
exports.deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Comercio no encontrado'
      });
    }

    await tenant.delete();

    logger.info(`Tenant eliminado (soft): ${tenant.id} por usuario ${req.user.uid}`);

    res.json({
      success: true,
      message: 'Comercio desactivado exitosamente'
    });

  } catch (error) {
    logger.error(`Error en deleteTenant: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Crear un admin para un tenant existente
 * @route   POST /api/tenants/:id/admins
 * @access  Platform Admin
 */
exports.createTenantAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, displayName, permissions } = req.body;

    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Comercio no encontrado'
      });
    }

    // Verificar si el email ya existe en Firebase
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(email);
      return res.status(400).json({
        success: false,
        error: 'Ya existe un usuario con ese email'
      });
    } catch (error) {
      // Email no existe, continuar
    }

    // Crear usuario en Firebase Auth
    firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || tenant.name
    });

    // Crear usuario en Firestore
    const tenantAdmin = new User({
      firebaseUid: firebaseUser.uid,
      email,
      displayName: displayName || tenant.name,
      role: 'tenant_admin',
      tenantId: tenant.id,
      permissions: permissions || ['manage_events', 'manage_tickets', 'view_reports'],
      isActive: true
    });

    await tenantAdmin.save();

    logger.info(`Admin de tenant creado: ${tenantAdmin.id} para tenant ${tenant.id}`);

    res.status(201).json({
      success: true,
      data: tenantAdmin.toJSON()
    });

  } catch (error) {
    logger.error(`Error en createTenantAdmin: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Obtener estadísticas de un tenant
 * @route   GET /api/tenants/:id/stats
 * @access  Platform Admin, Tenant Admin (solo su tenant)
 */
exports.getTenantStats = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Comercio no encontrado'
      });
    }

    // Si es tenant_admin, verificar que sea su tenant
    if (req.user.role === 'tenant_admin' && req.user.tenantId !== tenant.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este comercio'
      });
    }

    res.json({
      success: true,
      data: {
        stats: tenant.stats,
        subscription: tenant.subscription,
        canCreateMoreEvents: tenant.canCreateMoreEvents()
      }
    });

  } catch (error) {
    logger.error(`Error en getTenantStats: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Obtener dashboard completo del tenant
 * @route   GET /api/tenants/:id/dashboard
 * @access  Platform Admin, Tenant Admin (solo su tenant)
 */
exports.getTenantDashboard = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Comercio no encontrado'
      });
    }

    // Si es tenant_admin, verificar que sea su tenant
    if (req.user.role === 'tenant_admin' && req.user.tenantId !== tenant.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este comercio'
      });
    }

    // Obtener eventos reales
    const events = await Event.list({
      tenantId: id,
      limit: 100
    });

    // Separar eventos por status
    const now = new Date();
    const upcomingEvents = events.filter(e => {
      const eventDate = new Date(e.date);
      return (e.status === 'published' || e.status === 'active') && eventDate >= now;
    });

    const pastEvents = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate < now;
    });

    // Calcular métricas
    const totalRevenue = tenant.stats.totalRevenue || 0;
    const totalTicketsSold = tenant.stats.totalTicketsSold || 0;
    const totalEvents = tenant.stats.totalEvents || 0;
    
    // Calcular promedios
    const avgRevenuePerEvent = totalEvents > 0 ? totalRevenue / totalEvents : 0;
    const avgTicketsPerEvent = totalEvents > 0 ? totalTicketsSold / totalEvents : 0;

    // Calcular tasa de ocupación promedio
    let totalOccupancy = 0;
    let eventsWithSales = 0;
    
    events.forEach(event => {
      if (event.capacity > 0 && event.stats.totalTicketsSold > 0) {
        totalOccupancy += (event.stats.totalTicketsSold / event.capacity);
        eventsWithSales++;
      }
    });
    
    const occupancyRate = eventsWithSales > 0 
      ? (totalOccupancy / eventsWithSales * 100) 
      : 0;

    res.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logoUrl: tenant.logoUrl,
          status: tenant.status
        },
        overview: {
          totalEvents,
          totalTicketsSold,
          totalRevenue,
          activeEvents: upcomingEvents.length,
          pastEvents: pastEvents.length
        },
        metrics: {
          avgRevenuePerEvent: Math.round(avgRevenuePerEvent * 100) / 100,
          avgTicketsPerEvent: Math.round(avgTicketsPerEvent * 100) / 100,
          occupancyRate: Math.round(occupancyRate * 100) / 100
        },
        subscription: {
          plan: tenant.subscription.plan,
          maxEvents: tenant.subscription.maxEvents,
          eventsUsed: totalEvents,
          eventsRemaining: tenant.subscription.maxEvents - totalEvents,
          canCreateMore: tenant.canCreateMoreEvents()
        },
        recentEvents: events.slice(0, 5).map(e => e.toJSON()) // Últimos 5 eventos
      }
    });

  } catch (error) {
    logger.error(`Error en getTenantDashboard: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Obtener eventos de un tenant
 * @route   GET /api/tenants/:id/events
 * @access  Platform Admin, Tenant Admin (solo su tenant)
 */
exports.getTenantEvents = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Comercio no encontrado'
      });
    }

    // Si es tenant_admin, verificar que sea su tenant
    if (req.user.role === 'tenant_admin' && req.user.tenantId !== tenant.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este comercio'
      });
    }

    // Obtener eventos reales
    const events = await Event.list({
      tenantId: id,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        events: events.map(e => e.toJSON()),
        pagination: {
          total: events.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: events.length === parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error(`Error en getTenantEvents: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
