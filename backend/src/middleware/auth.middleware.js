const { admin } = require('../config/firebase');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('🔐 Auth middleware - Headers:', req.headers);
    console.log('🔐 Authorization header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided or invalid format');
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('🔐 Token extracted:', token ? 'Token present' : 'No token');

    try {
      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log('✅ Token verified for user:', decodedToken.uid);
      
      // Add user info to request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        name: decodedToken.name,
      };

      next();
    } catch (error) {
      console.error('❌ Error verifying token:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en autenticación'
    });
  }
};

module.exports = authMiddleware;
