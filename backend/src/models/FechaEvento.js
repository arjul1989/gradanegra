const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

/**
 * Modelo de FechaEvento
 * Representa una fecha específica de un evento (un evento puede tener múltiples fechas)
 */

class FechaEvento {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.eventoId = data.eventoId;
    this.fecha = data.fecha; // YYYY-MM-DD
    this.horaInicio = data.horaInicio; // HH:MM
    this.horaFin = data.horaFin || null; // HH:MM (opcional)
    this.aforoTotal = data.aforoTotal || 0;
    this.aforoDisponible = data.aforoDisponible || this.aforoTotal;
    this.status = data.status || 'activa'; // activa, agotada, cancelada
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.deletedAt = data.deletedAt || null;
  }

  /**
   * Validar datos
   */
  validate() {
    const errors = [];

    if (!this.eventoId) {
      errors.push('El ID del evento es requerido');
    }

    if (!this.fecha) {
      errors.push('La fecha es requerida');
    }

    if (!this.horaInicio) {
      errors.push('La hora de inicio es requerida');
    }

    if (this.aforoTotal < 1) {
      errors.push('El aforo total debe ser mayor a 0');
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
      const fechaRef = db.collection('fechasEvento').doc(this.id);
      await fechaRef.set(this.toJSON());
      return this;
    } catch (error) {
      throw new Error(`Error al guardar fecha de evento: ${error.message}`);
    }
  }

  /**
   * Actualizar
   */
  async update(data) {
    try {
      this.updatedAt = new Date().toISOString();
      Object.assign(this, data);
      
      const fechaRef = db.collection('fechasEvento').doc(this.id);
      await fechaRef.update(this.toJSON());
      return this;
    } catch (error) {
      throw new Error(`Error al actualizar fecha: ${error.message}`);
    }
  }

  /**
   * Soft delete
   */
  async delete() {
    try {
      this.deletedAt = new Date().toISOString();
      this.status = 'cancelada';
      this.updatedAt = new Date().toISOString();
      
      const fechaRef = db.collection('fechasEvento').doc(this.id);
      await fechaRef.update({
        deletedAt: this.deletedAt,
        status: this.status,
        updatedAt: this.updatedAt
      });
      return this;
    } catch (error) {
      throw new Error(`Error al eliminar fecha: ${error.message}`);
    }
  }

  /**
   * Obtener tiers de esta fecha
   */
  async getTiers() {
    try {
      const snapshot = await db.collection('tiers')
        .where('fechaEventoId', '==', this.id)
        .where('deletedAt', '==', null)
        .orderBy('orden', 'asc')
        .get();

      const Tier = require('./Tier');
      return snapshot.docs.map(doc => new Tier(doc.data()));
    } catch (error) {
      throw new Error(`Error al obtener tiers: ${error.message}`);
    }
  }

  /**
   * Actualizar aforo disponible
   */
  async actualizarAforoDisponible() {
    try {
      const tiers = await this.getTiers();
      const totalDisponible = tiers.reduce((sum, tier) => sum + tier.disponibles, 0);
      
      this.aforoDisponible = totalDisponible;
      
      // Actualizar status si está agotado
      if (this.aforoDisponible === 0) {
        this.status = 'agotada';
      } else if (this.status === 'agotada') {
        this.status = 'activa';
      }

      await this.update({
        aforoDisponible: this.aforoDisponible,
        status: this.status
      });

      return this;
    } catch (error) {
      throw new Error(`Error al actualizar aforo: ${error.message}`);
    }
  }

  /**
   * Verificar si está en el futuro
   */
  isFuture() {
    const fechaEvento = new Date(`${this.fecha}T${this.horaInicio}`);
    return fechaEvento > new Date();
  }

  /**
   * Verificar si está en el pasado
   */
  isPast() {
    return !this.isFuture();
  }

  toJSON() {
    return {
      id: this.id,
      eventoId: this.eventoId,
      fecha: this.fecha,
      horaInicio: this.horaInicio,
      horaFin: this.horaFin,
      aforoTotal: this.aforoTotal,
      aforoDisponible: this.aforoDisponible,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt
    };
  }

  // Métodos estáticos

  static async findById(id) {
    try {
      const doc = await db.collection('fechasEvento').doc(id).get();
      if (!doc.exists) return null;
      return new FechaEvento(doc.data());
    } catch (error) {
      throw new Error(`Error al buscar fecha: ${error.message}`);
    }
  }

  static async findByEvento(eventoId, filters = {}) {
    try {
      let query = db.collection('fechasEvento')
        .where('eventoId', '==', eventoId)
        .where('deletedAt', '==', null);

      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      query = query.orderBy('fecha', 'asc');

      const snapshot = await query.get();
      return snapshot.docs.map(doc => new FechaEvento(doc.data()));
    } catch (error) {
      throw new Error(`Error al buscar fechas por evento: ${error.message}`);
    }
  }
}

module.exports = FechaEvento;
