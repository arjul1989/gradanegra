const { MercadoPagoConfig, Preference, Payment: MPPayment } = require('mercadopago');
const logger = require('../utils/logger');

/**
 * Configuración de Mercado Pago
 * Usa credenciales TEST por defecto, PROD si NODE_ENV=production
 */
const isProduction = process.env.NODE_ENV === 'production';

// Seleccionar credenciales según ambiente
const accessToken = isProduction
  ? (process.env.MP_ACCESS_TOKEN_PROD || '').trim()
  : (process.env.MP_ACCESS_TOKEN_TEST || '').trim();

const publicKey = isProduction
  ? (process.env.MP_PUBLIC_KEY_PROD || '').trim()
  : (process.env.MP_PUBLIC_KEY_TEST || '').trim();

if (!accessToken) {
  logger.error('❌ Mercado Pago Access Token no configurado');
  throw new Error('MP_ACCESS_TOKEN no está configurado en variables de entorno');
}

// Inicializar cliente de Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: accessToken,
  options: {
    timeout: 5000,
    idempotencyKey: 'gradanegra-' + Date.now()
  }
});

logger.info(`✅ Mercado Pago configurado - Modo: ${isProduction ? 'PRODUCCIÓN' : 'TEST'}`);

// Exportar instancias
const preferenceClient = new Preference(client);
const paymentClient = new MPPayment(client);

module.exports = {
  client,
  preferenceClient,
  paymentClient,
  publicKey,
  accessToken,
  isProduction
};

