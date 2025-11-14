const { db, admin } = require('../config/firebase');

/**
 * Modelo de Pago (Payment)
 * Representa una transacción de pago con Mercado Pago
 */
class Payment {
  constructor(data) {
    this.id = data.id || null;
    this.compraId = data.compraId; // ID de la compra asociada
    this.comercioId = data.comercioId;
    this.eventoId = data.eventoId;
    this.userId = data.userId || null; // Usuario que realizó el pago (opcional)
    
    // Información del pago
    this.paymentMethod = data.paymentMethod || null; // credit_card, debit_card, etc.
    this.paymentType = data.paymentType || null; // credit_card, ticket, etc.
    this.amount = data.amount; // Monto total
    this.currency = data.currency || 'COP';
    this.description = data.description || '';
    
    // IDs de Mercado Pago
    this.preferenceId = data.preferenceId || null; // ID de la preferencia creada
    this.paymentId = data.paymentId || null; // ID del pago en MP
    this.merchantOrderId = data.merchantOrderId || null;
    this.externalReference = data.externalReference || null; // Referencia única (compraId)
    
    // Estado del pago
    this.status = data.status || 'pending'; // pending, approved, rejected, cancelled, refunded
    this.statusDetail = data.statusDetail || null; // Detalle del estado
    
    // Información del pagador
    this.payer = {
      email: data.payer?.email || null,
      firstName: data.payer?.firstName || null,
      lastName: data.payer?.lastName || null,
      identification: data.payer?.identification || null,
      phone: data.payer?.phone || null
    };
    
    // Respuesta completa de Mercado Pago (para debug)
    this.mpResponse = data.mpResponse || null;
    
    // Metadata
    this.createdAt = data.createdAt || admin.firestore.FieldValue.serverTimestamp();
    this.updatedAt = data.updatedAt || admin.firestore.FieldValue.serverTimestamp();
    this.processedAt = data.processedAt || null; // Cuando se procesó el webhook
  }

  /**
   * Valida los datos del pago
   */
  validate() {
    const errors = [];

    if (!this.compraId) errors.push('compraId es requerido');
    if (!this.comercioId) errors.push('comercioId es requerido');
    if (!this.eventoId) errors.push('eventoId es requerido');
    if (!this.amount || this.amount <= 0) errors.push('amount debe ser mayor a 0');
    if (!this.currency) errors.push('currency es requerido');

    if (errors.length > 0) {
      throw new Error(`Validación fallida: ${errors.join(', ')}`);
    }

    return true;
  }

  /**
   * Guarda el pago en Firestore
   */
  async save() {
    this.validate();

    const paymentRef = this.id
      ? db.collection('payments').doc(this.id)
      : db.collection('payments').doc();

    this.id = paymentRef.id;
    this.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await paymentRef.set(this.toJSON(), { merge: true });
    return this;
  }

  /**
   * Actualiza el estado del pago
   */
  async updateStatus(status, statusDetail = null, mpResponse = null) {
    this.status = status;
    this.statusDetail = statusDetail;
    
    if (mpResponse) {
      this.mpResponse = mpResponse;
    }
    
    if (status === 'approved') {
      this.processedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    await this.save();
    return this;
  }

  /**
   * Encuentra un pago por ID
   */
  static async findById(paymentId) {
    const doc = await db.collection('payments').doc(paymentId).get();
    if (!doc.exists) return null;
    
    return new Payment({ id: doc.id, ...doc.data() });
  }

  /**
   * Encuentra un pago por ID de Mercado Pago
   */
  static async findByPaymentId(paymentId) {
    const snapshot = await db.collection('payments')
      .where('paymentId', '==', paymentId)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return new Payment({ id: doc.id, ...doc.data() });
  }

  /**
   * Encuentra un pago por compraId
   */
  static async findByCompraId(compraId) {
    const snapshot = await db.collection('payments')
      .where('compraId', '==', compraId)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return new Payment({ id: doc.id, ...doc.data() });
  }

  /**
   * Encuentra un pago por preferenceId
   */
  static async findByPreferenceId(preferenceId) {
    const snapshot = await db.collection('payments')
      .where('preferenceId', '==', preferenceId)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return new Payment({ id: doc.id, ...doc.data() });
  }

  /**
   * Obtiene todos los pagos de un comercio
   */
  static async findByComercio(comercioId, limit = 50) {
    const snapshot = await db.collection('payments')
      .where('comercioId', '==', comercioId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => new Payment({ id: doc.id, ...doc.data() }));
  }

  /**
   * Convierte a JSON
   */
  toJSON() {
    return {
      id: this.id,
      compraId: this.compraId,
      comercioId: this.comercioId,
      eventoId: this.eventoId,
      userId: this.userId,
      paymentMethod: this.paymentMethod,
      paymentType: this.paymentType,
      amount: this.amount,
      currency: this.currency,
      description: this.description,
      preferenceId: this.preferenceId,
      paymentId: this.paymentId,
      merchantOrderId: this.merchantOrderId,
      externalReference: this.externalReference,
      status: this.status,
      statusDetail: this.statusDetail,
      payer: this.payer,
      mpResponse: this.mpResponse,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      processedAt: this.processedAt
    };
  }
}

module.exports = Payment;

