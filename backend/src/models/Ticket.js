const { db } = require('../config/firebase');
const { generateHash } = require('../utils/crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Ticket Model
 * Representa un ticket individual generado para un evento
 */
class Ticket {
  constructor(data) {
    this.id = data.id || null;
    this.ticketNumber = data.ticketNumber || this.generateTicketNumber();
    this.eventId = data.eventId;
    this.tenantId = data.tenantId;
    this.tierId = data.tierId; // ID del tier seleccionado
    this.purchaseId = data.purchaseId || null; // ID de la compra/orden
    this.buyerId = data.buyerId || null; // ID del comprador registrado (si aplica)
    
    // Información del comprador
    this.buyer = data.buyer || {
      name: '',
      email: '',
      phone: '',
      documentId: '' // DNI, RFC, etc.
    };
    
    // Hash de seguridad (anti-falsificación)
    this.securityHash = data.securityHash || null;
    
    // QR code data URL
    this.qrCodeDataUrl = data.qrCodeDataUrl || null;
    
    // PDF URL en Cloud Storage
    this.pdfUrl = data.pdfUrl || null;
    
    // Información de precio
    this.price = data.price || 0;
    this.currency = data.currency || 'MXN';
    this.fees = data.fees || 0; // Comisiones
    this.taxes = data.taxes || 0; // Impuestos
    this.total = data.total || 0;
    
    // Status del ticket
    this.status = data.status || 'pending'; // pending, confirmed, cancelled, used
    
    // Validación
    this.isValidated = data.isValidated || false;
    this.validatedAt = data.validatedAt || null;
    this.validatedBy = data.validatedBy || null; // User ID que validó
    
    // Transferencia
    this.isTransferable = data.isTransferable || false;
    this.transferredTo = data.transferredTo || null;
    this.transferredAt = data.transferredAt || null;
    
    // Metadata
    this.metadata = data.metadata || {
      seat: null, // Asiento asignado si aplica
      zone: null, // Zona si aplica
      notes: ''
    };
    
    // Timestamps
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.expiresAt = data.expiresAt || null; // Para tickets temporales
  }

  /**
   * Genera un número de ticket único
   */
  generateTicketNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TKT-${timestamp}-${random}`;
  }

  /**
   * Genera el hash de seguridad del ticket
   */
  async generateSecurityHash() {
    const data = {
      ticketNumber: this.ticketNumber,
      eventId: this.eventId,
      tierId: this.tierId,
      buyerEmail: this.buyer.email,
      createdAt: this.createdAt
    };
    
    this.securityHash = generateHash(JSON.stringify(data));
    return this.securityHash;
  }

  /**
   * Valida los datos del ticket
   */
  validate() {
    const errors = [];

    if (!this.eventId) {
      errors.push('El ID del evento es requerido');
    }

    if (!this.tenantId) {
      errors.push('El ID del tenant es requerido');
    }

    if (!this.tierId) {
      errors.push('El ID del tier es requerido');
    }

    if (!this.buyer.email) {
      errors.push('El email del comprador es requerido');
    }

    if (!this.buyer.name) {
      errors.push('El nombre del comprador es requerido');
    }

    if (this.price < 0) {
      errors.push('El precio no puede ser negativo');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Guarda el ticket en Firestore
   */
  async save() {
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
    }

    // Generar hash si no existe
    if (!this.securityHash) {
      await this.generateSecurityHash();
    }

    this.updatedAt = new Date().toISOString();

    try {
      const ticketData = {
        ticketNumber: this.ticketNumber,
        eventId: this.eventId,
        tenantId: this.tenantId,
        tierId: this.tierId,
        purchaseId: this.purchaseId,
        buyerId: this.buyerId,
        buyer: this.buyer,
        securityHash: this.securityHash,
        qrCodeDataUrl: this.qrCodeDataUrl,
        pdfUrl: this.pdfUrl,
        price: this.price,
        currency: this.currency,
        fees: this.fees,
        taxes: this.taxes,
        total: this.total,
        status: this.status,
        isValidated: this.isValidated,
        validatedAt: this.validatedAt,
        validatedBy: this.validatedBy,
        isTransferable: this.isTransferable,
        transferredTo: this.transferredTo,
        transferredAt: this.transferredAt,
        metadata: this.metadata,
        updatedAt: this.updatedAt
      };

      if (this.id) {
        // Actualizar ticket existente
        await db.collection('tickets').doc(this.id).update(ticketData);
      } else {
        // Crear nuevo ticket
        ticketData.createdAt = this.createdAt;
        ticketData.expiresAt = this.expiresAt;

        const docRef = await db.collection('tickets').add(ticketData);
        this.id = docRef.id;
      }

      return this;
    } catch (error) {
      throw new Error(`Error al guardar ticket: ${error.message}`);
    }
  }

  /**
   * Busca un ticket por ID
   */
  static async findById(ticketId) {
    try {
      const doc = await db.collection('tickets').doc(ticketId).get();
      
      if (!doc.exists) {
        return null;
      }

      return new Ticket({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error al buscar ticket: ${error.message}`);
    }
  }

  /**
   * Busca un ticket por número
   */
  static async findByTicketNumber(ticketNumber) {
    try {
      const snapshot = await db.collection('tickets')
        .where('ticketNumber', '==', ticketNumber)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return new Ticket({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error al buscar ticket por número: ${error.message}`);
    }
  }

  /**
   * Busca tickets por evento
   */
  static async findByEvent(eventId, filters = {}) {
    try {
      let query = db.collection('tickets').where('eventId', '==', eventId);

      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      if (filters.tierId) {
        query = query.where('tierId', '==', filters.tierId);
      }

      if (filters.isValidated !== undefined) {
        query = query.where('isValidated', '==', filters.isValidated);
      }

      const limit = filters.limit || 100;
      query = query.limit(limit);

      const snapshot = await query.get();
      return snapshot.docs.map(doc => new Ticket({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error al buscar tickets por evento: ${error.message}`);
    }
  }

  /**
   * Busca tickets por comprador
   */
  static async findByBuyerEmail(email) {
    try {
      // NOTA: Removemos orderBy para evitar requerir índice compuesto
      // El ordenamiento se hace en memoria en el controlador
      const snapshot = await db.collection('tickets')
        .where('buyer.email', '==', email)
        .get();

      let tickets = snapshot.docs.map(doc => new Ticket({ id: doc.id, ...doc.data() }));
      
      // Ordenar en memoria
      tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return tickets;
    } catch (error) {
      throw new Error(`Error al buscar tickets por email: ${error.message}`);
    }
  }

  /**
   * Lista tickets con filtros
   */
  static async list(filters = {}) {
    try {
      let query = db.collection('tickets');

      // Filtrar por buyerId
      if (filters.buyerId) {
        query = query.where('buyerId', '==', filters.buyerId);
      }

      // Filtrar por eventId
      if (filters.eventId) {
        query = query.where('eventId', '==', filters.eventId);
      }

      // Filtrar por tenantId
      if (filters.tenantId) {
        query = query.where('tenantId', '==', filters.tenantId);
      }

      // Filtrar por status
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      // NOTA: Si hay un filtro buyerId, no ordenamos en la query para evitar error de índice
      // El ordenamiento se hace en memoria en el controlador
      const needsIndexedSort = filters.buyerId || filters.eventId || filters.tenantId || filters.status;
      
      if (!needsIndexedSort) {
        // Solo ordenar en la query si NO hay filtros (para evitar requerir índice compuesto)
        const orderBy = filters.orderBy || 'createdAt';
        const orderDirection = filters.orderDirection || 'desc';
        query = query.orderBy(orderBy, orderDirection);
      }

      // Límite y offset
      const limit = filters.limit || 100;
      if (filters.offset) {
        query = query.offset(filters.offset);
      }
      query = query.limit(limit);

      const snapshot = await query.get();

      let tickets = snapshot.docs.map(doc => new Ticket({ id: doc.id, ...doc.data() }));

      // Si había filtros, ordenamos en memoria
      if (needsIndexedSort) {
        const orderBy = filters.orderBy || 'createdAt';
        const orderDirection = filters.orderDirection || 'desc';
        tickets.sort((a, b) => {
          const aVal = a[orderBy];
          const bVal = b[orderBy];
          if (orderDirection === 'desc') {
            return bVal > aVal ? 1 : -1;
          } else {
            return aVal > bVal ? 1 : -1;
          }
        });
      }

      return tickets;
    } catch (error) {
      throw new Error(`Error al listar tickets: ${error.message}`);
    }
  }

  /**
   * Valida el ticket (check-in)
   */
  async validate(validatorUserId) {
    if (this.isValidated) {
      throw new Error('Este ticket ya ha sido validado');
    }

    if (this.status === 'cancelled') {
      throw new Error('Este ticket ha sido cancelado');
    }

    if (this.status !== 'confirmed') {
      throw new Error('Este ticket no está confirmado');
    }

    this.isValidated = true;
    this.validatedAt = new Date().toISOString();
    this.validatedBy = validatorUserId;
    this.status = 'used';

    await this.save();
    return this;
  }

  /**
   * Cancela el ticket
   */
  async cancel() {
    if (this.isValidated) {
      throw new Error('No se puede cancelar un ticket ya validado');
    }

    this.status = 'cancelled';
    this.updatedAt = new Date().toISOString();

    await db.collection('tickets').doc(this.id).update({
      status: this.status,
      updatedAt: this.updatedAt
    });

    return this;
  }

  /**
   * Verifica si el hash es válido
   */
  async verifyHash() {
    const data = {
      ticketNumber: this.ticketNumber,
      eventId: this.eventId,
      tierId: this.tierId,
      buyerEmail: this.buyer.email,
      createdAt: this.createdAt
    };
    
    const computedHash = generateHash(JSON.stringify(data));
    return computedHash === this.securityHash;
  }

  /**
   * Convierte el ticket a JSON
   */
  toJSON() {
    return {
      id: this.id,
      ticketNumber: this.ticketNumber,
      eventId: this.eventId,
      tenantId: this.tenantId,
      tierId: this.tierId,
      purchaseId: this.purchaseId,
      buyer: this.buyer,
      securityHash: this.securityHash,
      qrCodeDataUrl: this.qrCodeDataUrl,
      pdfUrl: this.pdfUrl,
      price: this.price,
      currency: this.currency,
      fees: this.fees,
      taxes: this.taxes,
      total: this.total,
      status: this.status,
      isValidated: this.isValidated,
      validatedAt: this.validatedAt,
      isTransferable: this.isTransferable,
      transferredTo: this.transferredTo,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      expiresAt: this.expiresAt
    };
  }

  /**
   * Convierte el ticket a JSON público (sin datos sensibles)
   */
  toPublicJSON() {
    return {
      ticketNumber: this.ticketNumber,
      eventId: this.eventId,
      tierId: this.tierId,
      buyer: {
        name: this.buyer.name,
        email: this.buyer.email
      },
      price: this.price,
      currency: this.currency,
      total: this.total,
      status: this.status,
      isValidated: this.isValidated,
      metadata: this.metadata,
      createdAt: this.createdAt
    };
  }
}

module.exports = Ticket;
