const { Pass } = require('@walletpass/pass-js');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Genera un archivo .pkpass de Apple Wallet
 * @param {Object} options - Opciones para generar el pase
 * @param {Object} options.ticket - Datos del ticket
 * @param {Object} options.event - Datos del evento
 * @param {Object} options.tenant - Datos del tenant/comercio
 * @param {string} options.tierName - Nombre del tier/tipo de entrada
 * @param {string} options.logoPath - Ruta al logo (opcional)
 * @param {string} options.backgroundColor - Color de fondo en formato RGB (opcional)
 * @returns {Promise<Buffer>} Buffer del archivo .pkpass
 */
async function generateAppleWalletPass({ ticket, event, tenant, tierName, logoPath, backgroundColor }) {
  try {
    // Verificar que existen los certificados necesarios
    const certPath = process.env.APPLE_SIGNER_CERT_PATH || './certificates/signerCert.pem';
    const keyPath = process.env.APPLE_SIGNER_KEY_PATH || './certificates/signerKey.pem';
    const wwdrPath = process.env.APPLE_WWDR_CERT_PATH || './certificates/wwdr.pem';

    // Verificar si los archivos existen
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath) || !fs.existsSync(wwdrPath)) {
      throw new Error(
        'Certificados de Apple Wallet no encontrados. ' +
        'Por favor consulta backend/certificates/README.md para configurarlos.'
      );
    }

    // Leer certificados
    const signerCert = fs.readFileSync(certPath);
    const signerKey = fs.readFileSync(keyPath);
    const wwdrCert = fs.readFileSync(wwdrPath);

    // Configuración del pase
    const passTypeId = process.env.APPLE_PASS_TYPE_ID || 'pass.com.gradanegra.eventticket';
    const teamId = process.env.APPLE_TEAM_ID || 'TEAM_ID';

    // Crear instancia del pase
    const pass = new Pass({
      passTypeIdentifier: passTypeId,
      teamIdentifier: teamId,
      organizationName: tenant.name || 'Grada Negra',
      description: `Ticket para ${event.name}`,
      serialNumber: ticket.ticketNumber,
      
      // Color de fondo (RGB)
      backgroundColor: backgroundColor || 'rgb(0, 0, 0)',
      foregroundColor: 'rgb(255, 255, 255)',
      labelColor: 'rgb(200, 200, 200)',
      
      // QR Code con datos del ticket
      barcodes: [
        {
          message: JSON.stringify({
            ticketNumber: ticket.ticketNumber,
            eventId: ticket.eventId,
            hash: ticket.securityHash
          }),
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1'
        }
      ],
      
      // Información relevante
      relevantDate: event.startDate,
      
      // Ubicaciones (si está disponible)
      ...(event.location && {
        locations: [
          {
            latitude: event.location.lat || 0,
            longitude: event.location.lng || 0,
            relevantText: `Llegaste a ${event.venue || 'el evento'}`
          }
        ]
      })
    });

    // Formatear fecha
    const eventDate = new Date(event.startDate);
    const dateFormatter = new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeFormatter = new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const formattedDate = dateFormatter.format(eventDate);
    const formattedTime = timeFormatter.format(eventDate);

    // Configurar estructura del pase (Event Ticket)
    pass.eventTicket({
      // Header: Nombre del comercio/organizador
      headerFields: [
        {
          key: 'organizer',
          label: 'ORGANIZADO POR',
          value: tenant.name || 'Grada Negra'
        }
      ],
      
      // Primary: Nombre del evento (destacado)
      primaryFields: [
        {
          key: 'event',
          label: 'EVENTO',
          value: event.name
        }
      ],
      
      // Secondary: Fecha y ubicación
      secondaryFields: [
        {
          key: 'date',
          label: 'FECHA',
          value: formattedDate
        },
        {
          key: 'time',
          label: 'HORA',
          value: formattedTime
        }
      ],
      
      // Auxiliary: Tipo de entrada y número de ticket
      auxiliaryFields: [
        {
          key: 'tier',
          label: 'TIPO DE ENTRADA',
          value: tierName || 'General'
        },
        {
          key: 'ticket',
          label: 'TICKET',
          value: `#${ticket.ticketNumber}`
        }
      ],
      
      // Back: Información adicional
      backFields: [
        {
          key: 'venue',
          label: 'Ubicación',
          value: event.venue || 'Por confirmar'
        },
        {
          key: 'buyer',
          label: 'Comprador',
          value: ticket.buyer.name
        },
        {
          key: 'email',
          label: 'Email',
          value: ticket.buyer.email
        },
        {
          key: 'purchaseDate',
          label: 'Fecha de compra',
          value: new Date(ticket.createdAt).toLocaleDateString('es-MX')
        },
        {
          key: 'terms',
          label: 'Términos y Condiciones',
          value: 'Presenta este pase en la entrada del evento. ' +
                 'El código QR será escaneado para validar tu entrada. ' +
                 'No compartas tu ticket para evitar uso no autorizado.'
        }
      ]
    });

    // Agregar logo si está disponible
    if (logoPath && fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      pass.images.logo = logoBuffer;
      pass.images.logo2x = logoBuffer; // Retina
    } else {
      // Usar logo por defecto (puedes crear uno simple)
      logger.warn('Logo no encontrado, usando configuración sin logo');
    }

    // Agregar icono si está disponible
    if (logoPath && fs.existsSync(logoPath)) {
      const iconBuffer = fs.readFileSync(logoPath);
      pass.images.icon = iconBuffer;
      pass.images.icon2x = iconBuffer; // Retina
    }

    // Firmar el pase
    pass.certificates.wwdr = wwdrCert;
    pass.certificates.signerCert = signerCert;
    pass.certificates.signerKey = signerKey;

    // Generar el archivo .pkpass
    const pkpassBuffer = await pass.asBuffer();

    logger.info(`Apple Wallet pass generado para ticket ${ticket.ticketNumber}`, {
      ticketId: ticket.id,
      serialNumber: ticket.ticketNumber
    });

    return pkpassBuffer;
  } catch (error) {
    logger.error('Error al generar Apple Wallet pass:', error);
    throw new Error(`Error generando .pkpass: ${error.message}`);
  }
}

/**
 * Genera un link de Google Wallet (JWT-based)
 * @param {Object} options - Opciones para generar el pase
 * @param {Object} options.ticket - Datos del ticket
 * @param {Object} options.event - Datos del evento
 * @param {Object} options.tenant - Datos del tenant/comercio
 * @param {string} options.tierName - Nombre del tier
 * @returns {Promise<string>} URL para agregar a Google Wallet
 */
async function generateGoogleWalletLink({ ticket, event, tenant, tierName }) {
  try {
    // NOTA: Google Wallet requiere configuración de API y service account
    // Esta es una implementación simplificada que genera el URL
    // Para producción, necesitarás el Google Wallet API habilitado
    
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    
    if (!issuerId) {
      logger.warn('Google Wallet no configurado (falta GOOGLE_WALLET_ISSUER_ID)');
      return null;
    }

    // Crear objeto del pase (Google Wallet usa formato diferente)
    const eventDate = new Date(event.startDate);
    
    const eventTicketObject = {
      id: `${issuerId}.${ticket.ticketNumber}`,
      classId: `${issuerId}.event_ticket_class`,
      state: 'ACTIVE',
      
      // Información del ticket
      ticketHolderName: ticket.buyer.name,
      ticketNumber: ticket.ticketNumber,
      
      // QR Code
      barcode: {
        type: 'QR_CODE',
        value: JSON.stringify({
          ticketNumber: ticket.ticketNumber,
          eventId: ticket.eventId,
          hash: ticket.securityHash
        })
      },
      
      // Información del evento
      eventName: {
        defaultValue: {
          language: 'es',
          value: event.name
        }
      },
      
      // Fecha del evento
      eventDateTime: {
        start: eventDate.toISOString()
      },
      
      // Ubicación
      venue: {
        name: {
          defaultValue: {
            language: 'es',
            value: event.venue || 'Por confirmar'
          }
        }
      },
      
      // Tipo de entrada
      ticketType: {
        defaultValue: {
          language: 'es',
          value: tierName || 'General'
        }
      }
    };

    // Por ahora, retornamos null hasta que se configure completamente
    // En producción, aquí se firmaría el JWT y se generaría el URL
    logger.info(`Google Wallet link preparado para ticket ${ticket.ticketNumber} (requiere configuración completa)`);
    
    // URL de ejemplo (no funcional sin configuración completa)
    // const walletUrl = `https://pay.google.com/gp/v/save/${signedJwt}`;
    
    return null; // Retornar null hasta tener configuración completa
  } catch (error) {
    logger.error('Error al generar Google Wallet link:', error);
    return null;
  }
}

/**
 * Verifica si Apple Wallet está configurado
 * @returns {boolean} True si los certificados existen
 */
function isAppleWalletConfigured() {
  const certPath = process.env.APPLE_SIGNER_CERT_PATH || './certificates/signerCert.pem';
  const keyPath = process.env.APPLE_SIGNER_KEY_PATH || './certificates/signerKey.pem';
  const wwdrPath = process.env.APPLE_WWDR_CERT_PATH || './certificates/wwdr.pem';
  
  return fs.existsSync(certPath) && fs.existsSync(keyPath) && fs.existsSync(wwdrPath);
}

/**
 * Verifica si Google Wallet está configurado
 * @returns {boolean} True si está configurado
 */
function isGoogleWalletConfigured() {
  return !!process.env.GOOGLE_WALLET_ISSUER_ID;
}

module.exports = {
  generateAppleWalletPass,
  generateGoogleWalletLink,
  isAppleWalletConfigured,
  isGoogleWalletConfigured
};
