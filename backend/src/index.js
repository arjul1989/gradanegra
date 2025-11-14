const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { initializeFirebase } = require('./config/firebase');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Firebase
initializeFirebase();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Development-only auth header logger for troubleshooting missing tokens
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/admin', (req, res, next) => {
    try {
      const authHeader = req.get('authorization') || req.get('Authorization');
      const devHeader = req.get('X-Dev-Admin') || req.get('x-dev-admin');
      // Only log presence and a short preview to avoid leaking full tokens
      logger.info('DEV_AUTH_CHECK', {
        path: req.path,
        method: req.method,
        authPresent: !!authHeader,
        authPreview: authHeader ? `${authHeader.slice(0, 16)}...` : null,
        xDevAdminPresent: !!devHeader
      });
    } catch (e) {
      // don't break request flow if logging fails
      logger.warn('DEV_AUTH_CHECK_FAILED', { error: e && e.message });
    }
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/tenants', require('./routes/tenant.routes'));
// app.use('/api/users', require('./routes/user.routes')); // OLD - usando users.routes en línea 67
app.use('/api/events', require('./routes/event.routes'));
app.use('/api/tickets', require('./routes/ticket.routes'));
app.use('/api/validate', require('./routes/validation.routes'));
app.use('/api/comercios', require('./routes/comercio.routes'));
app.use('/api/public', require('./routes/public.routes'));
app.use('/api/jobs', require('./routes/job.routes'));
app.use('/api/buyers', require('./routes/buyer.routes'));

// New API Routes for Firestore Data Model
app.use('/api/categorias', require('./routes/categoria.routes'));
app.use('/api/eventos', require('./routes/eventos.routes'));
app.use('/api/fechasEvento', require('./routes/fechasEvento.routes'));
app.use('/api/tiers', require('./routes/tiers.routes'));
app.use('/api/usuarios-comercios', require('./routes/usuarios-comercios.routes'));
app.use('/api/verificacion', require('./routes/verificacion.routes'));
app.use('/api/cupones', require('./routes/cupones.routes'));

// Panel de Usuario - User Routes
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/boletos', require('./routes/boletos-user.routes'));
app.use('/api/compras', require('./routes/compras-user.routes'));

// Pagos - Payment Routes
app.use('/api/payments', require('./routes/payment.routes'));

// Panel de Administrador - Admin Routes
app.use('/api/admin/dashboard', require('./routes/admin/dashboard.routes'));
app.use('/api/admin/comercios', require('./routes/admin/comercios.routes'));
app.use('/api/admin/reportes', require('./routes/admin/reportes.routes'));

// Panel de Administrador - Payments Admin Routes
app.use('/api/payments-admin', require('./routes/payments-admin.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Grada Negra API running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;
