const { getAuth } = require('../config/firebase');
const User = require('../models/User');
const Buyer = require('../models/Buyer');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate requests using Firebase Auth tokens
 */
async function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify Firebase token
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get user from database
    const user = await User.findByFirebaseUid(decodedToken.uid);
    
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found in database'
      });
    }

    if (!user.active) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'User account is deactivated'
      });
    }

    // Attach user to request
    req.user = user;
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired'
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
}

/**
 * Middleware to check if user has required role
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has specific permission
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
}

/**
 * Middleware to check if user belongs to specific tenant
 */
function requireTenant(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  // Platform admin can access all tenants
  if (req.user.role === 'platform_admin') {
    return next();
  }

  const tenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;
  
  if (!tenantId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Tenant ID is required'
    });
  }

  if (req.user.tenantId !== tenantId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have access to this tenant'
    });
  }

  next();
}

/**
 * Middleware to authenticate buyers (compradores/clientes)
 * Similar to authenticate but for buyer accounts
 */
async function authenticateBuyer(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify Firebase token
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get buyer from database
    let buyer = await Buyer.findById(decodedToken.uid);
    
    // Si no existe, crear perfil automáticamente en primer acceso
    if (!buyer) {
      const { admin } = require('../config/firebase');
      const userRecord = await admin.auth().getUser(decodedToken.uid);
      
      buyer = new Buyer({
        id: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || userRecord.email.split('@')[0],
        phoneNumber: userRecord.phoneNumber,
        photoURL: userRecord.photoURL,
        authProvider: userRecord.providerData[0]?.providerId || 'password',
        emailVerified: userRecord.emailVerified
      });

      await buyer.save();
      logger.info(`Perfil de comprador auto-creado: ${buyer.email} (${buyer.id})`);
    }

    if (!buyer.isActive()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Buyer account is deactivated'
      });
    }

    // Attach buyer to request with user object for compatibility
    req.user = {
      uid: buyer.id,
      email: buyer.email,
      displayName: buyer.displayName,
      role: 'buyer', // Identificar como buyer
      ...buyer.toJSON()
    };
    req.buyer = buyer;
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    logger.error('Buyer authentication error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired'
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
}

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, solo lo adjunta si existe
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No hay token, continuar sin autenticación
      return next();
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    
    try {
      const decodedToken = await auth.verifyIdToken(token);
      
      // Intentar cargar buyer
      const buyer = await Buyer.findById(decodedToken.uid);
      
      if (buyer && buyer.isActive()) {
        req.user = {
          uid: buyer.id,
          email: buyer.email,
          displayName: buyer.displayName,
          role: 'buyer'
        };
        req.buyer = buyer;
      }
    } catch (tokenError) {
      // Token inválido o expirado, continuar sin autenticación
      logger.warn('Token inválido en optionalAuth:', tokenError.message);
    }
    
    next();
  } catch (error) {
    // Error en el proceso, continuar sin autenticación
    logger.error('Error en optionalAuth:', error);
    next();
  }
}

module.exports = {
  authenticate,
  authenticateBuyer,
  optionalAuth,
  requireRole,
  requirePermission,
  requireTenant
};
