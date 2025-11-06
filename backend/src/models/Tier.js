const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

/**
 * Modelo de Tier
 * Representa un tipo de entrada para una fecha específica (General, VIP, Palco, etc.)
 */

class Tier {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.fechaEventoId = data.fechaEventoId;
    this.nombre = data.nombre; // General, VIP, Palco
    this.descripcion = data.descripcion || '';
    this.precio = data.precio || 0;
    this.cantidad = data.cantidad || 0; // Total de boletos en este tier
    this.disponibles = data.disponibles !== undefined ? data.disponibles : this.cantidad;
    this.orden = data.orden || 0; // Para ordenar tiers (1, 2, 3...)
    this.status = data.status || 'activo'; // activo, agotado, inactivo
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.deletedAt = data.deletedAt || null;
  }

  /**
   * Validar datos
   */
  validate() {
    const errors = [];

    if (!this.fechaEventoId) {
      errors.push('El ID de la fecha del evento es requerido');
    }

    if (!this.nombre || this.nombre.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    if (this.precio < 0) {
      errors.push('El precio no puede ser negativo');
    }

    if (this.cantidad < 1) {
      errors.push('La cantidad debe ser mayor a 0');
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
      const tierRef = db.collection('tiers').doc(this.id);
      await tierRef.set(this.toJSON());

      // Generar boletos individuales para este tier
      await this.generarBoletos();

      return this;
    } catch (error) {
      throw new Error(`Error al guardar tier: ${error.message}`);
    }
  }

  /**
   * Actualizar
   */
  async update(data) {
    try {
      this.updatedAt = new Date().toISOString();
      Object.assign(this, data);
      
      const tierRef = db.collection('tiers').doc(this.id);
      await tierRef.update(this.toJSON());
      return this;
    } catch (error) {
      throw new Error(`Error al actualizar tier: ${error.message}`);
    }
  }

  /**
   * Soft delete
   */
  async delete() {
    try {
      this.deletedAt = new Date().toISOString();
      this.status = 'inactivo';
      this.updatedAt = new Date().toISOString();
      
      const tierRef = db.collection('tiers').doc(this.id);
      await tierRef.update({
        deletedAt: this.deletedAt,
        status: this.status,
        updatedAt: this.updatedAt
      });
      return this;
    } catch (error) {
      throw new Error(`Error al eliminar tier: ${error.message}`);
    }
  }

  /**
   * Generar boletos individuales para este tier
   */
  async generarBoletos() {
    try {
      const Boleto = require('./Boleto');
      const boletos = [];

      for (let i = 0; i < this.cantidad; i++) {
        const boleto = new Boleto({
          tierId: this.id,
          precio: this.precio,
          numeroBoleto: await Boleto.generarNumeroBoleto()
        });

        boletos.push(boleto.save());
      }

      await Promise.all(boletos);
      console.log(`✅ ${this.cantidad} boletos generados para tier ${this.nombre}`);
      
      return this;
    } catch (error) {
      throw new Error(`Error al generar boletos: ${error.message}`);
    }
  }

  /**
   * Obtener boletos de este tier
   */
  async getBoletos(filters = {}) {
    try {
      let query = db.collection('boletos')
        .where('tierId', '==', this.id);

      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      const snapshot = await query.get();
      const Boleto = require('./Boleto');
      return snapshot.docs.map(doc => new Boleto(doc.data()));
    } catch (error) {
      throw new Error(`Error al obtener boletos: ${error.message}`);
    }
  }

  /**
   * Obtener boletos disponibles
   */
  async getBoletosDisponibles(cantidad = 1) {
    try {
      const snapshot = await db.collection('boletos')
        .where('tierId', '==', this.id)
        .where('status', '==', 'disponible')
        .limit(cantidad)
        .get();

      const Boleto = require('./Boleto');
      return snapshot.docs.map(doc => new Boleto(doc.data()));
    } catch (error) {
      throw new Error(`Error al obtener boletos disponibles: ${error.message}`);
    }
  }

  /**
   * Actualizar cantidad de boletos disponibles
   */
  async actualizarDisponibles() {
    try {
      const boletosDisponibles = await db.collection('boletos')
        .where('tierId', '==', this.id)
        .where('status', '==', 'disponible')
        .get();

      this.disponibles = boletosDisponibles.size;

      // Actualizar status
      if (this.disponibles === 0) {
        this.status = 'agotado';
      } else if (this.status === 'agotado') {
        this.status = 'activo';
      }

      await this.update({
        disponibles: this.disponibles,
        status: this.status
      });

      // Actualizar aforo de la fecha
      const FechaEvento = require('./FechaEvento');
      const fecha = await FechaEvento.findById(this.fechaEventoId);
      if (fecha) {
        await fecha.actualizarAforoDisponible();
      }

      return this;
    } catch (error) {
      throw new Error(`Error al actualizar disponibles: ${error.message}`);
    }
  }

  /**
   * Reservar boletos (marcarlos como vendidos)
   */
  async reservarBoletos(cantidad, compraId) {
    try {
      if (this.disponibles < cantidad) {
        throw new Error(`Solo hay ${this.disponibles} boletos disponibles`);
      }

      const boletos = await this.getBoletosDisponibles(cantidad);
      
      const Boleto = require('./Boleto');
      const updatePromises = boletos.map(boleto => {
        boleto.compraId = compraId;
        boleto.status = 'vendido';
        boleto.updatedAt = new Date().toISOString();
        return boleto.update({ compraId, status: 'vendido' });
      });

      await Promise.all(updatePromises);

      // Actualizar disponibles
      await this.actualizarDisponibles();

      return boletos;
    } catch (error) {
      throw new Error(`Error al reservar boletos: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      fechaEventoId: this.fechaEventoId,
      nombre: this.nombre,
      descripcion: this.descripcion,
      precio: this.precio,
      cantidad: this.cantidad,
      disponibles: this.disponibles,
      orden: this.orden,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt
    };
  }

  // Métodos estáticos

  static async findById(id) {
    try {
      const doc = await db.collection('tiers').doc(id).get();
      if (!doc.exists) return null;
      return new Tier(doc.data());
    } catch (error) {
      throw new Error(`Error al buscar tier: ${error.message}`);
    }
  }

  static async findByFechaEvento(fechaEventoId, filters = {}) {
    try {
      let query = db.collection('tiers')
        .where('fechaEventoId', '==', fechaEventoId)
        .where('deletedAt', '==', null);

      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      query = query.orderBy('orden', 'asc');

      const snapshot = await query.get();
      return snapshot.docs.map(doc => new Tier(doc.data()));
    } catch (error) {
      throw new Error(`Error al buscar tiers: ${error.message}`);
    }
  }
}

module.exports = Tier;
