const { admin } = require('../config/firebase');

/**
 * Middleware para verificar que el usuario es administrador
 * Verifica el custom claim 'admin' en Firebase Auth
 */
const verifyAdmin = async (req, res, next) => {
  try {
    // Development bypass: allow X-Dev-Admin: yes to act as an admin when not in production
    if (process.env.NODE_ENV !== 'production') {
      const devHeader = req.get('X-Dev-Admin') || req.get('x-dev-admin');
      if (devHeader && devHeader.toLowerCase() === 'yes') {
        req.admin = {
          uid: 'dev-admin',
          email: 'dev@local',
          role: 'super_admin'
        };
        return next();
      }
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Verificar claim de admin
    if (!decodedToken.admin) {
      return res.status(403).json({ 
        error: 'Acceso denegado. Se requieren permisos de administrador.' 
      });
    }
    
    // Agregar info del admin al request
    req.admin = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.adminRole || 'super_admin'
    };
    
    next();
  } catch (error) {
    console.error('Error verificando admin:', error);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

/**
 * Middleware para verificar roles específicos
 * @param {Array<string>} allowedRoles - Roles permitidos para acceder
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(403).json({ error: 'Usuario no autenticado como admin' });
    }
    
    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ 
        error: `Acceso denegado. Rol requerido: ${allowedRoles.join(' o ')}` 
      });
    }
    
    next();
  };
};

module.exports = { verifyAdmin, requireRole };
