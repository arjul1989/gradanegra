const QRCode = require('qrcode');

/**
 * Generate QR code as data URL
 * @param {string} ticketId - Ticket ID
 * @param {string} hash - Ticket hash
 * @returns {Promise<string>} Data URL of QR code
 */
async function generateQRCode(ticketId, hash) {
  const data = JSON.stringify({
    ticketId,
    hash,
    timestamp: Date.now()
  });
  
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300
    });
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

/**
 * Parse QR code data
 * @param {string} qrData - QR code data string
 * @returns {Object} Parsed data
 */
function parseQRCode(qrData) {
  try {
    return JSON.parse(qrData);
  } catch (error) {
    throw new Error('Invalid QR code data');
  }
}

module.exports = {
  generateQRCode,
  parseQRCode
};
