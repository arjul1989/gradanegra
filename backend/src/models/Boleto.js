const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Modelo de Boleto
 * Representa un boleto individual generado por tier
 */

class Boleto {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.tierId = data.tierId;
    this.compraId = data.compraId || null;
    this.numeroBoleto = data.numeroBoleto || '';
    this.codigoQR = data.codigoQR || '';
    this.hash = data.hash || this.generarHash();
    this.precio = data.precio || 0;
    this.status = data.status || 'disponible'; // disponible, vendido, usado, cancelado
    this.fechaUso = data.fechaUso || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Generar hash único SHA-256
   */
  generarHash() {
    const data = `${this.id}-${this.tierId}-${Date.now()}-${Math.random()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generar código QR (contiene el hash)
   */
  generarCodigoQR() {
    this.codigoQR = this.hash;
    return this.codigoQR;
  }

  /**
   * Validar datos
   */
  validate() {
    const errors = [];

    if (!this.tierId) {
      errors.push('El ID del tier es requerido');
    }

    if (!this.numeroBoleto) {
      errors.push('El número de boleto es requerido');
    }

    if (this.precio < 0) {
      errors.push('El precio no puede ser negativo');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Guardar en Firestore
   */
  async save() {
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
    }

    try {
      // Generar QR si no existe
      if (!this.codigoQR) {
        this.generarCodigoQR();
      }

      const boletoRef = db.collection('boletos').doc(this.id);
      await boletoRef.set(this.toJSON());
      return this;
    } catch (error) {
      throw new Error(`Error al guardar boleto: ${error.message}`);
    }
  }

  /**
   * Actualizar
   */
  async update(data) {
    try {
      this.updatedAt = new Date().toISOString();
      Object.assign(this, data);
      
      const boletoRef = db.collection('boletos').doc(this.id);
      await boletoRef.update(this.toJSON());
      return this;
    } catch (error) {
      throw new Error(`Error al actualizar boleto: ${error.message}`);
    }
  }

  /**
   * Marcar como vendido
   */
  async marcarVendido(compraId) {
    try {
      this.compraId = compraId;
      this.status = 'vendido';
      await this.update({ compraId, status: 'vendido' });
      return this;
    } catch (error) {
      throw new Error(`Error al marcar boleto como vendido: ${error.message}`);
    }
  }

  /**
   * Validar y marcar como usado (check-in)
   */
  async validarYUsar() {
    try {
      if (this.status === 'usado') {
        throw new Error('Este boleto ya fue usado');
      }

      if (this.status === 'cancelado') {
        throw new Error('Este boleto está cancelado');
      }

      if (this.status !== 'vendido') {
        throw new Error('Este boleto no está vendido');
      }

      this.status = 'usado';
      this.fechaUso = new Date().toISOString();
      
      await this.update({
        status: 'usado',
        fechaUso: this.fechaUso
      });

      return this;
    } catch (error) {
      throw new Error(`Error al validar boleto: ${error.message}`);
    }
  }

  /**
   * Cancelar boleto (reembolso)
   */
  async cancelar() {
    try {
      this.status = 'cancelado';
      await this.update({ status: 'cancelado' });

      // Actualizar disponibles del tier
      const Tier = require('./Tier');
      const tier = await Tier.findById(this.tierId);
      if (tier) {
        await tier.actualizarDisponibles();
      }

      return this;
    } catch (error) {
      throw new Error(`Error al cancelar boleto: ${error.message}`);
    }
  }

  /**
   * Obtener información completa del boleto (con evento, fecha, tier)
   */
  async getInformacionCompleta() {
    try {
      const Tier = require('./Tier');
      const FechaEvento = require('./FechaEvento');
      const Evento = require('./Evento');

      const tier = await Tier.findById(this.tierId);
      if (!tier) throw new Error('Tier no encontrado');

      const fecha = await FechaEvento.findById(tier.fechaEventoId);
      if (!fecha) throw new Error('Fecha no encontrada');

      const evento = await Evento.findById(fecha.eventoId);
      if (!evento) throw new Error('Evento no encontrado');

      return {
        boleto: this.toJSON(),
        tier: tier.toJSON(),
        fecha: fecha.toJSON(),
        evento: evento.toJSON()
      };
    } catch (error) {
      throw new Error(`Error al obtener información: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      tierId: this.tierId,
      compraId: this.compraId,
      numeroBoleto: this.numeroBoleto,
      codigoQR: this.codigoQR,
      hash: this.hash,
      precio: this.precio,
      status: this.status,
      fechaUso: this.fechaUso,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Métodos estáticos

  static async findById(id) {
    try {
      const doc = await db.collection('boletos').doc(id).get();
      if (!doc.exists) return null;
      return new Boleto(doc.data());
    } catch (error) {
      throw new Error(`Error al buscar boleto: ${error.message}`);
    }
  }

  static async findByHash(hash) {
    try {
      const snapshot = await db.collection('boletos')
        .where('hash', '==', hash)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      return new Boleto(snapshot.docs[0].data());
    } catch (error) {
      throw new Error(`Error al buscar boleto por hash: ${error.message}`);
    }
  }

  static async findByNumeroBoleto(numeroBoleto) {
    try {
      const snapshot = await db.collection('boletos')
        .where('numeroBoleto', '==', numeroBoleto)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      return new Boleto(snapshot.docs[0].data());
    } catch (error) {
      throw new Error(`Error al buscar boleto por número: ${error.message}`);
    }
  }

  static async findByCompra(compraId) {
    try {
      const snapshot = await db.collection('boletos')
        .where('compraId', '==', compraId)
        .get();

      return snapshot.docs.map(doc => new Boleto(doc.data()));
    } catch (error) {
      throw new Error(`Error al buscar boletos por compra: ${error.message}`);
    }
  }

  /**
   * Generar número de boleto único
   * Formato: GN-AAAA-NNNNNN (ej: GN-2025-001234)
   */
  static async generarNumeroBoleto() {
    const year = new Date().getFullYear();
    
    // Obtener contador de boletos del año
    const counterRef = db.collection('counters').doc(`boletos-${year}`);
    const counterDoc = await counterRef.get();
    
    let nextNumber = 1;
    if (counterDoc.exists) {
      nextNumber = (counterDoc.data().count || 0) + 1;
    }

    // Actualizar contador
    await counterRef.set({ count: nextNumber, year });

    // Formatear número con ceros a la izquierda
    const numeroFormateado = String(nextNumber).padStart(6, '0');
    
    return `GN-${year}-${numeroFormateado}`;
  }

  /**
   * Validar hash de boleto
   */
  static async validarHash(hash) {
    try {
      const boleto = await this.findByHash(hash);
      
      if (!boleto) {
        return {
          valido: false,
          mensaje: 'Boleto no encontrado',
          boleto: null
        };
      }

      if (boleto.status === 'usado') {
        return {
          valido: false,
          mensaje: 'Boleto ya fue usado',
          boleto: boleto.toJSON(),
          fechaUso: boleto.fechaUso
        };
      }

      if (boleto.status === 'cancelado') {
        return {
          valido: false,
          mensaje: 'Boleto cancelado',
          boleto: boleto.toJSON()
        };
      }

      if (boleto.status !== 'vendido') {
        return {
          valido: false,
          mensaje: 'Boleto no válido para ingreso',
          boleto: boleto.toJSON()
        };
      }

      // Boleto válido
      const info = await boleto.getInformacionCompleta();
      
      return {
        valido: true,
        mensaje: 'Boleto válido',
        boleto: boleto.toJSON(),
        informacion: info
      };
    } catch (error) {
      throw new Error(`Error al validar hash: ${error.message}`);
    }
  }
}

module.exports = Boleto;
