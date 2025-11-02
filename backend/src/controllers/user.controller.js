const User = require('../models/User');
const Tenant = require('../models/Tenant');
const logger = require('../utils/logger');
const { admin } = require('../config/firebase');

/**
 * @desc    Obtener todos los usuarios de un tenant
 * @route   GET /api/tenants/:tenantId/users
 * @access  Tenant Admin, Platform Admin
 */
exports.getTenantUsers = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { role, isActive } = req.query;

    // Verificar acceso al tenant
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

    // Construir query
    const { db } = require('../config/firebase');
    let query = db.collection('users').where('tenantId', '==', tenantId);

    if (role) {
      query = query.where('role', '==', role);
    }

    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
    }

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => {
      const user = new User({ id: doc.id, ...doc.data() });
      return user.toJSON();
    });

    res.json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    logger.error(`Error en getTenantUsers: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Crear/invitar un usuario a un tenant
 * @route   POST /api/tenants/:tenantId/users
 * @access  Tenant Admin, Platform Admin
 */
exports.createTenantUser = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { email, password, displayName, role, permissions } = req.body;

    // Verificar acceso al tenant
    if (req.user.role !== 'platform_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este comercio'
      });
    }

    // Solo tenant_admin y platform_admin pueden crear usuarios
    if (req.user.role !== 'platform_admin' && req.user.role !== 'tenant_admin') {
      return res.status(403).json({
        success: false,
        error: 'Solo los administradores pueden crear usuarios'
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

    // Validar rol (no puede crear platform_admin)
    const allowedRoles = ['tenant_admin', 'finance', 'operations'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rol inválido. Roles permitidos: tenant_admin, finance, operations'
      });
    }

    // Contar usuarios existentes del tenant por rol
    const { db } = require('../config/firebase');
    const usersSnapshot = await db.collection('users')
      .where('tenantId', '==', tenantId)
      .where('isActive', '==', true)
      .get();

    const roleCount = {};
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      roleCount[userData.role] = (roleCount[userData.role] || 0) + 1;
    });

    // Verificar límite de 3 usuarios por rol (límite del plan free)
    if (roleCount[role] >= 3) {
      return res.status(403).json({
        success: false,
        error: `Has alcanzado el límite de 3 usuarios con rol ${role} para tu plan`
      });
    }

    // Verificar si el email ya existe
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(email);
      
      // Si existe, verificar que no esté ya en este tenant
      const existingUser = await User.findByFirebaseUid(firebaseUser.uid);
      if (existingUser && existingUser.tenantId === tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Este usuario ya pertenece a este comercio'
        });
      }
      
      // Si existe pero en otro tenant, no permitir (1 usuario = 1 tenant)
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Este email ya está registrado en otro comercio'
        });
      }

    } catch (error) {
      // Email no existe, crear nuevo usuario en Firebase
      firebaseUser = await admin.auth().createUser({
        email,
        password,
        displayName: displayName || email.split('@')[0]
      });
    }

    // Definir permisos por defecto según rol
    let defaultPermissions = [];
    if (role === 'tenant_admin') {
      defaultPermissions = ['manage_events', 'manage_tickets', 'view_reports', 'manage_users'];
    } else if (role === 'finance') {
      defaultPermissions = ['view_reports', 'manage_tickets'];
    } else if (role === 'operations') {
      defaultPermissions = ['manage_events', 'validate_tickets'];
    }

    // Crear usuario en Firestore
    const user = new User({
      firebaseUid: firebaseUser.uid,
      email,
      displayName: displayName || email.split('@')[0],
      role,
      tenantId,
      permissions: permissions || defaultPermissions,
      isActive: true
    });

    await user.save();

    logger.info(`Usuario creado: ${user.id} (${role}) en tenant ${tenantId} por ${req.user.uid}`);

    res.status(201).json({
      success: true,
      data: user.toJSON()
    });

  } catch (error) {
    logger.error(`Error en createTenantUser: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Obtener un usuario específico
 * @route   GET /api/users/:id
 * @access  Mismo tenant o Platform Admin
 */
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.role !== 'platform_admin' && req.user.tenantId !== user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este usuario'
      });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });

  } catch (error) {
    logger.error(`Error en getUser: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar un usuario
 * @route   PATCH /api/users/:id
 * @access  Tenant Admin, Platform Admin
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.role !== 'platform_admin' && req.user.tenantId !== user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este usuario'
      });
    }

    // Solo tenant_admin puede actualizar usuarios
    if (req.user.role !== 'platform_admin' && req.user.role !== 'tenant_admin') {
      return res.status(403).json({
        success: false,
        error: 'Solo los administradores pueden actualizar usuarios'
      });
    }

    // No permitir cambiar ciertos campos
    delete updates.firebaseUid;
    delete updates.email;
    delete updates.tenantId;
    delete updates.createdAt;

    // Validar rol si se está cambiando
    if (updates.role) {
      const allowedRoles = ['tenant_admin', 'finance', 'operations'];
      if (!allowedRoles.includes(updates.role)) {
        return res.status(400).json({
          success: false,
          error: 'Rol inválido'
        });
      }
    }

    // Aplicar actualizaciones
    Object.assign(user, updates);
    await user.save();

    logger.info(`Usuario actualizado: ${user.id} por ${req.user.uid}`);

    res.json({
      success: true,
      data: user.toJSON()
    });

  } catch (error) {
    logger.error(`Error en updateUser: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Desactivar un usuario
 * @route   DELETE /api/users/:id
 * @access  Tenant Admin, Platform Admin
 */
exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.role !== 'platform_admin' && req.user.tenantId !== user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este usuario'
      });
    }

    // Solo tenant_admin puede desactivar usuarios
    if (req.user.role !== 'platform_admin' && req.user.role !== 'tenant_admin') {
      return res.status(403).json({
        success: false,
        error: 'Solo los administradores pueden desactivar usuarios'
      });
    }

    // No puede desactivarse a sí mismo
    if (user.firebaseUid === req.user.uid) {
      return res.status(400).json({
        success: false,
        error: 'No puedes desactivarte a ti mismo'
      });
    }

    // Desactivar
    user.isActive = false;
    await user.save();

    // También desactivar en Firebase Auth
    await admin.auth().updateUser(user.firebaseUid, {
      disabled: true
    });

    logger.info(`Usuario desactivado: ${user.id} por ${req.user.uid}`);

    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente'
    });

  } catch (error) {
    logger.error(`Error en deactivateUser: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Reactivar un usuario
 * @route   POST /api/users/:id/activate
 * @access  Tenant Admin, Platform Admin
 */
exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.role !== 'platform_admin' && req.user.tenantId !== user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este usuario'
      });
    }

    // Solo tenant_admin puede reactivar usuarios
    if (req.user.role !== 'platform_admin' && req.user.role !== 'tenant_admin') {
      return res.status(403).json({
        success: false,
        error: 'Solo los administradores pueden reactivar usuarios'
      });
    }

    // Reactivar
    user.isActive = true;
    await user.save();

    // También reactivar en Firebase Auth
    await admin.auth().updateUser(user.firebaseUid, {
      disabled: false
    });

    logger.info(`Usuario reactivado: ${user.id} por ${req.user.uid}`);

    res.json({
      success: true,
      message: 'Usuario reactivado exitosamente',
      data: user.toJSON()
    });

  } catch (error) {
    logger.error(`Error en activateUser: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
