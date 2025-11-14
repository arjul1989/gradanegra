const admin = require('firebase-admin');

/**
 * Modelo para registro detallado de pagos
 * Registra cada transacción de pago para análisis y reportes
 */
class PaymentRecord {
  constructor(data = {}) {
    this.id = data.id || admin.firestore().collection('payment_records').doc().id;
    
    // Información del pago de Mercado Pago
    this.mercadoPagoId = data.mercadoPagoId || null; // ID del pago en MP
    this.externalReference = data.externalReference || null; // ID de compra interno
    this.status = data.status || 'pending'; // pending, approved, rejected, cancelled, refunded
    this.statusDetail = data.statusDetail || null; // Detalle específico del estado
    this.processor = 'mercadopago'; // procesador de pagos
    
    // Información financiera
    this.amount = data.amount || 0; // Monto total
    this.currency = data.currency || 'COP'; // Moneda
    this.installments = data.installments || 1; // Número de cuotas
    this.installmentAmount = data.installmentAmount || 0; // Monto por cuota
    
    // Información del método de pago
    this.paymentMethod = data.paymentMethod || 'unknown'; // card, pse, efecty, etc
    this.paymentMethodId = data.paymentMethodId || null; // ID específico del método
    this.cardLastFourDigits = data.cardLastFourDigits || null; // Últimos 4 dígitos de tarjeta
    this.cardBrand = data.cardBrand || null; // Visa, Mastercard, etc
    this.financialInstitution = data.financialInstitution || null; // Para PSE
    
    // Información del comprador
    this.payerEmail = data.payerEmail || null;
    this.payerFirstName = data.payerFirstName || null;
    this.payerLastName = data.payerLastName || null;
    this.payerPhone = data.payerPhone || null;
    this.payerIdentificationType = data.payerIdentificationType || null;
    this.payerIdentificationNumber = data.payerIdentificationNumber || null;
    
    // Información del comercio
    this.comercioId = data.comercioId || null;
    this.eventoId = data.eventoId || null;
    this.compraId = data.compraId || null;
    
    // Timestamps
    this.createdAt = data.createdAt || admin.firestore.FieldValue.serverTimestamp();
    this.updatedAt = data.updatedAt || admin.firestore.FieldValue.serverTimestamp();
    this.processedAt = data.processedAt || null; // Cuando se procesó el webhook
    this.approvedAt = data.approvedAt || null; // Cuando fue aprobado
    this.rejectedAt = data.rejectedAt || null; // Cuando fue rechazado
    
    // Información adicional
    this.description = data.description || '';
    this.metadata = data.metadata || {}; // Metadatos adicionales
    this.ipAddress = data.ipAddress || null; // IP del cliente
    this.userAgent = data.userAgent || null; // User agent del cliente
    
    // Para reportes y análisis
    this.dailyTransaction = data.dailyTransaction || this.getDailyTransaction();
    this.monthlyTransaction = data.monthlyTransaction || this.getMonthlyTransaction();
    this.weeklyTransaction = data.weeklyTransaction || this.getWeeklyTransaction();
  }

  /**
   * Obtener clave de transacción diaria (YYYY-MM-DD)
   */
  getDailyTransaction() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  /**
   * Obtener clave de transacción mensual (YYYY-MM)
   */
  getMonthlyTransaction() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Obtener clave de transacción semanal (YYYY-WW)
   */
  getWeeklyTransaction() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const week = Math.floor(diff / oneWeek) + 1;
    return `${now.getFullYear()}-${String(week).padStart(2, '0')}`;
  }

  /**
   * Validar datos requeridos
   */
  validate() {
    const errors = [];

    if (!this.amount || this.amount <= 0) {
      errors.push('El monto debe ser mayor a 0');
    }

    if (!this.currency) {
      errors.push('La moneda es requerida');
    }

    if (!this.status) {
      errors.push('El estado es requerido');
    }

    return errors;
  }

  /**
   * Guardar en Firestore
   */
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error('Datos inválidos: ' + errors.join(', '));
    }

    const data = {
      mercadoPagoId: this.mercadoPagoId,
      externalReference: this.externalReference,
      status: this.status,
      statusDetail: this.statusDetail,
      processor: this.processor,
      amount: this.amount,
      currency: this.currency,
      installments: this.installments,
      installmentAmount: this.installmentAmount,
      paymentMethod: this.paymentMethod,
      paymentMethodId: this.paymentMethodId,
      cardLastFourDigits: this.cardLastFourDigits,
      cardBrand: this.cardBrand,
      financialInstitution: this.financialInstitution,
      payerEmail: this.payerEmail,
      payerFirstName: this.payerFirstName,
      payerLastName: this.payerLastName,
      payerPhone: this.payerPhone,
      payerIdentificationType: this.payerIdentificationType,
      payerIdentificationNumber: this.payerIdentificationNumber,
      comercioId: this.comercioId,
      eventoId: this.eventoId,
      compraId: this.compraId,
      createdAt: this.createdAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedAt: this.processedAt,
      approvedAt: this.approvedAt,
      rejectedAt: this.rejectedAt,
      description: this.description,
      metadata: this.metadata,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      dailyTransaction: this.dailyTransaction,
      monthlyTransaction: this.monthlyTransaction,
      weeklyTransaction: this.weeklyTransaction
    };

    await admin.firestore().collection('payment_records').doc(this.id).set(data);
    console.log(`✅ PaymentRecord guardado: ${this.id}`);
    
    return this;
  }

  /**
   * Actualizar desde webhook de Mercado Pago
   */
  static async updateFromWebhook(webhookData) {
    try {
      const mpId = webhookData.id;
      
      // Buscar por ID de Mercado Pago
      const snapshot = await admin.firestore()
        .collection('payment_records')
        .where('mercadoPagoId', '==', mpId)
        .limit(1)
        .get();

      let paymentRecord;
      
      if (snapshot.empty) {
        // Crear nuevo registro si no existe
        paymentRecord = new PaymentRecord({
          mercadoPagoId: mpId,
          externalReference: webhookData.external_reference,
          status: webhookData.status,
          statusDetail: webhookData.status_detail,
          amount: webhookData.transaction_amount,
          currency: webhookData.currency_id || 'COP',
          paymentMethod: webhookData.payment_method_id,
          description: webhookData.description
        });
      } else {
        // Actualizar registro existente
        paymentRecord = new PaymentRecord({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        paymentRecord.status = webhookData.status;
        paymentRecord.statusDetail = webhookData.status_detail;
        paymentRecord.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        
        // Actualizar timestamps específicos
        if (webhookData.status === 'approved') {
          paymentRecord.approvedAt = admin.firestore.FieldValue.serverTimestamp();
        } else if (webhookData.status === 'rejected') {
          paymentRecord.rejectedAt = admin.firestore.FieldValue.serverTimestamp();
        }
      }

      await paymentRecord.save();
      return paymentRecord;
      
    } catch (error) {
      console.error('❌ Error actualizando PaymentRecord desde webhook:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de pagos por comercio
   */
  static async getPaymentStatsByComercio(comercioId, timeRange = '30d') {
    try {
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const snapshot = await admin.firestore()
        .collection('payment_records')
        .where('comercioId', '==', comercioId)
        .where('createdAt', '>=', startDate)
        .get();

      const stats = {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        cancelled: 0,
        refunded: 0,
        totalAmount: 0,
        approvedAmount: 0,
        paymentMethods: {},
        processor: 'mercadopago'
      };

      snapshot.forEach(doc => {
        const payment = doc.data();
        stats.total++;
        stats[payment.status] = (stats[payment.status] || 0) + 1;
        stats.totalAmount += payment.amount || 0;
        
        if (payment.status === 'approved') {
          stats.approvedAmount += payment.amount || 0;
        }

        const method = payment.paymentMethod || 'unknown';
        stats.paymentMethods[method] = (stats.paymentMethods[method] || 0) + 1;
      });

      return stats;
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los pagos por estado
   */
  static async getPaymentsByStatus(status, comercioId = null, limit = 50) {
    try {
      let query = admin.firestore()
        .collection('payment_records')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (comercioId) {
        query = query.where('comercioId', '==', comercioId);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => new PaymentRecord({ id: doc.id, ...doc.data() }));
      
    } catch (error) {
      console.error('❌ Error obteniendo pagos por estado:', error);
      throw error;
    }
  }
}

module.exports = PaymentRecord;