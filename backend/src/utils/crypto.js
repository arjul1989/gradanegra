const crypto = require('crypto');

/**
 * Generate secure hash for ticket anti-forgery
 * @param {Object} ticket - Ticket data
 * @returns {string} SHA-256 hash
 */
function generateTicketHash(ticket) {
  const data = [
    ticket.id || ticket.ticketId,
    ticket.eventId,
    ticket.tenantId,
    ticket.buyerEmail,
    ticket.price.toString(),
    new Date(ticket.purchaseDate).toISOString(),
    process.env.SECRET_SALT
  ].join('|');
  
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Validate ticket hash
 * @param {Object} ticket - Ticket with hash
 * @returns {boolean} True if hash is valid
 */
function validateTicketHash(ticket) {
  const expectedHash = generateTicketHash(ticket);
  return ticket.hash === expectedHash;
}

/**
 * Generate random alphanumeric ID
 * @param {number} length - Length of ID
 * @returns {string} Random ID
 */
function generateId(length = 16) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
    .toUpperCase();
}

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if match
 */
async function comparePassword(password, hash) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hash);
}

module.exports = {
  generateTicketHash,
  validateTicketHash,
  generateId,
  hashPassword,
  comparePassword
};
