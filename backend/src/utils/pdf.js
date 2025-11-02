const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const logger = require('./logger');

/**
 * Genera un PDF del ticket
 * @param {Object} options - Opciones para generar el PDF
 * @param {Object} options.ticket - Datos del ticket
 * @param {Object} options.event - Datos del evento
 * @param {Object} options.tenant - Datos del tenant/comercio
 * @param {string} options.tierName - Nombre del tier/tipo de entrada
 * @returns {Promise<Buffer>} Buffer del PDF generado
 */
async function generateTicketPDF({ ticket, event, tenant, tierName }) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      const buffers = [];
      
      // Capturar el PDF en buffers
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Generar QR code como buffer
      const qrBuffer = await QRCode.toBuffer(
        JSON.stringify({
          ticketNumber: ticket.ticketNumber,
          eventId: ticket.eventId,
          hash: ticket.securityHash
        }),
        {
          errorCorrectionLevel: 'H',
          type: 'png',
          width: 200,
          margin: 1
        }
      );

      // Header - Nombre del tenant/comercio
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(tenant.name || 'Grada Negra', 50, 50, { align: 'center' });

      // Línea decorativa
      doc
        .moveTo(50, 90)
        .lineTo(562, 90)
        .stroke();

      // Título del ticket
      doc
        .fontSize(16)
        .font('Helvetica')
        .fillColor('#666')
        .text('TICKET DE ENTRADA', 50, 110, { align: 'center' });

      // Número de ticket destacado
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#000')
        .text(`#${ticket.ticketNumber}`, 50, 135, { align: 'center' });

      // Espacio
      doc.moveDown(2);

      // Información del evento
      const eventY = 180;
      
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#000')
        .text(event.name, 50, eventY, { 
          align: 'left',
          width: 500
        });

      // Fecha del evento
      const eventDate = new Date(event.startDate);
      const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      };
      const timeOptions = {
        hour: '2-digit',
        minute: '2-digit'
      };
      const formattedDate = eventDate.toLocaleDateString('es-MX', dateOptions);
      const formattedTime = eventDate.toLocaleTimeString('es-MX', timeOptions);

      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#666')
        .text('📅 FECHA', 50, eventY + 50);
      
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#000')
        .text(formattedDate, 50, eventY + 68);

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#000')
        .text(`🕐 ${formattedTime} hrs`, 50, eventY + 85);

      // Ubicación
      if (event.venue) {
        doc
          .fontSize(12)
          .font('Helvetica')
          .fillColor('#666')
          .text('📍 UBICACIÓN', 50, eventY + 115);
        
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#000')
          .text(event.venue, 50, eventY + 133, {
            width: 250
          });
      }

      // Tipo de entrada
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#666')
        .text('🎟️ TIPO DE ENTRADA', 50, eventY + 175);
      
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#000')
        .text(tierName || 'General', 50, eventY + 193);

      // Comprador
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#666')
        .text('👤 COMPRADOR', 50, eventY + 223);
      
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#000')
        .text(ticket.buyer.name, 50, eventY + 241);

      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#666')
        .text(ticket.buyer.email, 50, eventY + 258);

      // QR Code
      const qrX = 370;
      const qrY = eventY + 30;
      
      doc.image(qrBuffer, qrX, qrY, {
        width: 180,
        height: 180
      });

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666')
        .text('Escanea para validar', qrX, qrY + 190, {
          width: 180,
          align: 'center'
        });

      // Caja de instrucciones
      const instructionsY = 520;
      
      doc
        .rect(50, instructionsY, 512, 120)
        .fillAndStroke('#FFF3CD', '#FFC107');

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#000')
        .text('⚠️ INSTRUCCIONES IMPORTANTES', 60, instructionsY + 15, {
          width: 492
        });

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#000')
        .text('• Presenta este ticket en la entrada del evento (digital o impreso)', 60, instructionsY + 38, {
          width: 492
        });

      doc
        .text('• El código QR será escaneado para validar tu entrada', 60, instructionsY + 55, {
          width: 492
        });

      doc
        .text('• Llega con tiempo de anticipación para evitar filas', 60, instructionsY + 72, {
          width: 492
        });

      doc
        .text('• No compartas tu ticket para evitar uso no autorizado', 60, instructionsY + 89, {
          width: 492
        });

      // Footer
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#999')
        .text(
          `Ticket emitido el ${new Date(ticket.createdAt).toLocaleDateString('es-MX')} | Hash: ${ticket.securityHash.substring(0, 16)}...`,
          50,
          700,
          { align: 'center', width: 512 }
        );

      doc
        .fontSize(8)
        .text('Powered by Grada Negra', 50, 715, {
          align: 'center',
          width: 512
        });

      // Finalizar el documento
      doc.end();

      logger.info(`PDF generado para ticket ${ticket.ticketNumber}`);
    } catch (error) {
      logger.error('Error al generar PDF:', error);
      reject(error);
    }
  });
}

/**
 * Genera múltiples PDFs de tickets
 * @param {Array} tickets - Array de tickets con su información
 * @returns {Promise<Array>} Array de buffers de PDFs
 */
async function generateMultipleTicketPDFs(tickets) {
  try {
    const pdfPromises = tickets.map(ticketData => 
      generateTicketPDF(ticketData)
    );
    
    const pdfs = await Promise.all(pdfPromises);
    logger.info(`${pdfs.length} PDFs generados exitosamente`);
    
    return pdfs;
  } catch (error) {
    logger.error('Error al generar múltiples PDFs:', error);
    throw error;
  }
}

module.exports = {
  generateTicketPDF,
  generateMultipleTicketPDFs
};
