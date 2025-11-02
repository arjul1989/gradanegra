const logger = require('./logger');

// Lazy-load Resend to avoid startup errors when API key is missing
let Resend = null;
let resend = null;

function getResendClient() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      logger.warn('RESEND_API_KEY not configured - email functionality will be disabled');
      return null;
    }
    
    // Only require Resend when we actually need it and have an API key
    if (!Resend) {
      try {
        Resend = require('resend').Resend;
      } catch (error) {
        logger.error('Failed to load Resend module:', error);
        return null;
      }
    }
    
    resend = new Resend(apiKey);
  }
  return resend;
}

/**
 * Envía un email usando Resend
 * @param {Object} options - Opciones del email
 * @param {string} options.to - Email del destinatario
 * @param {string} options.subject - Asunto del email
 * @param {string} options.html - Contenido HTML del email
 * @param {Array} options.attachments - Array de attachments (opcional)
 * @param {string} options.from - Email del remitente (opcional)
 * @returns {Promise<Object>} Resultado del envío
 */
async function sendEmail({ to, subject, html, attachments = [], from = null }) {
  try {
    const resendClient = getResendClient();
    if (!resendClient) {
      logger.warn(`Email sending disabled - RESEND_API_KEY not configured. Would send to: ${to}, subject: ${subject}`);
      return {
        success: false,
        message: 'Email service not configured',
        to,
        subject
      };
    }

    // Usar email por defecto si no se especifica
    const fromEmail = from || 'Grada Negra <tickets@gradanegra.com>';

    const emailData = {
      from: fromEmail,
      to,
      subject,
      html,
    };

    // Agregar attachments si existen
    if (attachments && attachments.length > 0) {
      emailData.attachments = attachments;
    }

    logger.info(`Enviando email a ${to}`, {
      subject,
      hasAttachments: attachments.length > 0
    });

    const result = await resendClient.emails.send(emailData);

    logger.info(`Email enviado exitosamente a ${to}`, {
      emailId: result.id
    });

    return {
      success: true,
      emailId: result.id,
      to,
      subject
    };
  } catch (error) {
    logger.error(`Error al enviar email a ${to}:`, error);
    throw new Error(`Error al enviar email: ${error.message}`);
  }
}

/**
 * Envía un email de ticket de evento
 * @param {Object} options - Opciones del email
 * @param {string} options.to - Email del comprador
 * @param {string} options.buyerName - Nombre del comprador
 * @param {Object} options.event - Información del evento
 * @param {Object} options.ticket - Información del ticket
 * @param {string} options.tenantName - Nombre del comercio/tenant
 * @param {Buffer} options.pdfBuffer - Buffer del PDF del ticket
 * @param {Buffer} options.pkpassBuffer - Buffer del .pkpass (opcional)
 * @returns {Promise<Object>} Resultado del envío
 */
async function sendTicketEmail({ to, buyerName, event, ticket, tenantName, pdfBuffer, pkpassBuffer }) {
  try {
    const subject = `🎫 Tu ticket para ${event.name}`;

    // Formatear fecha del evento
    const eventDate = new Date(event.startDate);
    const dateOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    const formattedDate = eventDate.toLocaleDateString('es-MX', dateOptions);

    // Crear HTML del email
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tu Ticket - ${event.name}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #000;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #000;
          }
          .event-info {
            margin: 20px 0;
          }
          .event-info h2 {
            color: #000;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .info-row {
            margin: 15px 0;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 4px;
          }
          .info-label {
            font-weight: bold;
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-value {
            color: #000;
            font-size: 16px;
            margin-top: 5px;
          }
          .ticket-number {
            background-color: #000;
            color: #fff;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 2px;
          }
          .important {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 14px;
          }
          .cta-button {
            display: inline-block;
            background-color: #000;
            color: #fff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 ${tenantName}</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Tu ticket está listo</p>
          </div>

          <p>Hola <strong>${buyerName}</strong>,</p>
          <p>¡Gracias por tu compra! Tu ticket para el evento ha sido confirmado.</p>

          <div class="event-info">
            <h2>${event.name}</h2>
            
            <div class="info-row">
              <div class="info-label">📅 Fecha y Hora</div>
              <div class="info-value">${formattedDate}</div>
            </div>

            <div class="info-row">
              <div class="info-label">📍 Ubicación</div>
              <div class="info-value">${event.venue || 'Por confirmar'}</div>
            </div>

            <div class="info-row">
              <div class="info-label">🎟️ Tipo de Entrada</div>
              <div class="info-value">${ticket.tierName || 'General'}</div>
            </div>
          </div>

          <div class="ticket-number">
            Ticket #${ticket.ticketNumber}
          </div>

          <div class="important">
            <strong>⚠️ Importante:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Presenta este ticket (PDF adjunto) en la entrada del evento</li>
              <li>El código QR será escaneado para validar tu entrada</li>
              <li>Guarda este email o descarga el PDF adjunto</li>
              <li>No compartas tu ticket con nadie para evitar uso no autorizado</li>
            </ul>
          </div>

          <p style="text-align: center;">
            <strong>Tu ticket PDF está adjunto a este email</strong><br>
            <small style="color: #666;">Descárgalo y preséntalo en tu dispositivo móvil o impreso</small>
          </p>

          <div class="footer">
            <p>Este ticket fue emitido por <strong>${tenantName}</strong></p>
            <p style="font-size: 12px; color: #999;">
              Si tienes alguna pregunta, contacta directamente con el organizador del evento.
            </p>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
              Powered by Grada Negra
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Preparar attachments: PDF y opcionalmente .pkpass
    const attachments = [];
    
    if (pdfBuffer) {
      attachments.push({
        filename: `ticket-${ticket.ticketNumber}.pdf`,
        content: pdfBuffer,
      });
    }

    if (pkpassBuffer) {
      attachments.push({
        filename: `ticket-${ticket.ticketNumber}.pkpass`,
        content: pkpassBuffer,
      });
    }

    return await sendEmail({
      to,
      subject,
      html,
      attachments
    });
  } catch (error) {
    logger.error('Error al enviar email de ticket:', error);
    throw error;
  }
}

/**
 * Envía un email de recordatorio de evento
 * @param {Object} options - Opciones del email
 * @param {string} options.to - Email del comprador
 * @param {string} options.buyerName - Nombre del comprador
 * @param {Object} options.event - Información del evento
 * @param {string} options.ticketNumber - Número del ticket
 * @returns {Promise<Object>} Resultado del envío
 */
async function sendEventReminderEmail({ to, buyerName, event, ticketNumber }) {
  try {
    const subject = `📅 Recordatorio: ${event.name} es mañana`;

    const eventDate = new Date(event.startDate);
    const dateOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    const formattedDate = eventDate.toLocaleDateString('es-MX', dateOptions);

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recordatorio - ${event.name}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #000; text-align: center;">📅 ¡No lo olvides!</h1>
          
          <p>Hola <strong>${buyerName}</strong>,</p>
          
          <p>Este es un recordatorio de que tu evento es <strong>mañana</strong>:</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">${event.name}</h2>
            <p><strong>📅 Fecha:</strong> ${formattedDate}</p>
            <p><strong>📍 Lugar:</strong> ${event.venue || 'Por confirmar'}</p>
            <p><strong>🎟️ Tu ticket:</strong> #${ticketNumber}</p>
          </div>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ Recuerda:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Llega con tiempo de anticipación</li>
              <li>Trae tu ticket (digital o impreso)</li>
              <li>El código QR debe estar visible para escanearlo</li>
            </ul>
          </div>
          
          <p style="text-align: center;">¡Nos vemos en el evento! 🎉</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
            <p style="font-size: 12px;">Powered by Grada Negra</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmail({
      to,
      subject,
      html
    });
  } catch (error) {
    logger.error('Error al enviar email de recordatorio:', error);
    throw error;
  }
}

module.exports = {
  sendEmail,
  sendTicketEmail,
  sendEventReminderEmail
};
