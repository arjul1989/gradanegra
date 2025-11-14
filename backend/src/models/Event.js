const admin = require('firebase-admin');
const { db } = require('../config/firebase');

/**
 * Event Model
 * Representa un evento creado por un tenant
 */
class Event {
  constructor(data) {
    this.id = data.id || null;
    this.tenantId = data.tenantId || data.comercioId; // ID del tenant propietario
    
    // Soporte para campos en inglés y español
    this.name = data.name || data.nombre;
    this.nombre = data.nombre || data.name;
    
    this.description = data.description || data.descripcion || '';
    this.descripcion = data.descripcion || data.description || '';
    
    this.date = data.date || data.fecha; // ISO timestamp del evento
    this.fecha = data.fecha || data.date;
    
    this.endDate = data.endDate || null; // Para eventos de varios días
    
    this.venue = data.venue || data.lugar || {
      name: '',
      address: '',
      city: '',
      state: '',
      country: 'MX',
      coordinates: null // { lat, lng }
    };
    this.lugar = data.lugar || data.venue;
    this.ciudad = data.ciudad || data.venue?.city;
    this.pais = data.pais || data.venue?.country || 'CO';
    
    this.status = data.status || 'draft'; // draft, published, active, past, cancelled
    
    this.capacity = data.capacity || data.capacidad || 1000; // Capacidad máxima total (límite: 1000)
    this.capacidad = data.capacidad || data.capacity || 1000;
    
    this.tiers = data.tiers || []; // Array de tipos de entrada (max 10)
    
    this.images = data.images || data.imagenes || (data.imagen ? { banner: data.imagen, thumbnail: data.imagen } : {
      banner: null,
      thumbnail: null,
      gallery: []
    });
    this.imagen = data.imagen || data.images?.banner;
    this.imagenes = data.imagenes || data.images;
    
    this.settings = data.settings || {
      isPublic: true,
      requiresApproval: false,
      allowTransfers: false,
      maxTicketsPerPurchase: 10
    };
    this.stats = data.stats || {
      totalTicketsSold: 0,
      totalRevenue: 0,
      checkedInCount: 0
    };
    this.metadata = data.metadata || {
      category: data.categoria || '', // Música, Deportes, Arte, etc.
      tags: [],
      ageRestriction: null // 18+, etc.
    };
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.createdBy = data.createdBy || null; // User ID
  }

  /**
   * Valida los datos del evento
   */
  validate() {
    const errors = [];

    if (!this.tenantId) {
      errors.push('El ID del tenant es requerido');
    }

    if (!this.name || this.name.trim().length < 3) {
      errors.push('El nombre debe tener al menos 3 caracteres');
    }

    if (!this.date) {
      errors.push('La fecha del evento es requerida');
    } else {
      const eventDate = new Date(this.date);
      if (isNaN(eventDate.getTime())) {
        errors.push('Fecha inválida');
      }
    }

    if (this.capacity < 1 || this.capacity > 1000) {
      errors.push('La capacidad debe estar entre 1 y 1000');
    }

    if (this.tiers.length > 10) {
      errors.push('Máximo 10 tipos de entrada permitidos');
    }

    // Validar tiers
    if (this.tiers.length > 0) {
      const totalTierCapacity = this.tiers.reduce((sum, tier) => sum + (tier.capacity || 0), 0);
      if (totalTierCapacity > this.capacity) {
        errors.push('La suma de capacidades de los tiers excede la capacidad total del evento');
      }

      this.tiers.forEach((tier, index) => {
        if (!tier.name || tier.name.trim().length < 2) {
          errors.push(`Tier ${index + 1}: El nombre es requerido`);
        }
        if (tier.price === undefined || tier.price < 0) {
          errors.push(`Tier ${index + 1}: El precio debe ser mayor o igual a 0`);
        }
        if (!tier.capacity || tier.capacity < 1) {
          errors.push(`Tier ${index + 1}: La capacidad debe ser mayor a 0`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Guarda el evento en Firestore
   */
  async save() {
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
    }

    this.updatedAt = new Date().toISOString();

    try {
      const eventData = {
        tenantId: this.tenantId,
        name: this.name,
        description: this.description,
        date: this.date,
        endDate: this.endDate,
        venue: this.venue,
        status: this.status,
        capacity: this.capacity,
        tiers: this.tiers,
        images: this.images,
        settings: this.settings,
        stats: this.stats,
        metadata: this.metadata,
        updatedAt: this.updatedAt
      };

      if (this.id) {
        // Actualizar evento existente
        await db.collection('eventos').doc(this.id).update(eventData);
      } else {
        // Crear nuevo evento
        eventData.createdAt = this.createdAt;
        eventData.createdBy = this.createdBy;

        const docRef = await db.collection('eventos').add(eventData);
        this.id = docRef.id;
      }

      return this;
    } catch (error) {
      throw new Error(`Error al guardar evento: ${error.message}`);
    }
  }

  /**
   * Actualiza el conteo de vendidos de un tier específico
   */
  async updateTierSoldCount(tierId, newVendidos) {
    try {
      if (!this.id) {
        throw new Error('El evento debe tener un ID para actualizar');
      }

      // Buscar el tier en el array
      const tierIndex = this.tiers.findIndex(t => t.id === tierId);
      if (tierIndex === -1) {
        throw new Error(`Tier ${tierId} no encontrado en el evento`);
      }

      // Actualizar el tier localmente
      this.tiers[tierIndex].vendidos = newVendidos;
      this.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      // Actualizar en Firestore
      await db.collection('eventos').doc(this.id).update({
        tiers: this.tiers,
        updatedAt: this.updatedAt
      });

      return this;
    } catch (error) {
      throw new Error(`Error al actualizar tier vendidos: ${error.message}`);
    }
  }

  /**
   * Busca un evento por ID
   */
  static async findById(eventId) {
    try {
      const doc = await db.collection('eventos').doc(eventId).get();
      
      if (!doc.exists) {
        return null;
      }

      return new Event({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error al buscar evento: ${error.message}`);
    }
  }

  /**
   * Lista eventos con filtros
   */
  static async list(filters = {}) {
    try {
      let query = db.collection('eventos');

      // Filtrar por tenant
      if (filters.tenantId) {
        query = query.where('tenantId', '==', filters.tenantId);
      }

      // Filtrar por status
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      // Filtrar por categoría
      if (filters.category) {
        query = query.where('metadata.category', '==', filters.category);
      }

      // Ordenar
      const orderBy = filters.orderBy || 'date';
      const orderDirection = filters.orderDirection || 'asc';
      query = query.orderBy(orderBy, orderDirection);

      // Límite y offset
      const limit = filters.limit || 50;
      if (filters.offset) {
        query = query.offset(filters.offset);
      }
      query = query.limit(limit);

      const snapshot = await query.get();

      return snapshot.docs.map(doc => new Event({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error al listar eventos: ${error.message}`);
    }
  }

  /**
   * Elimina un evento (soft delete)
   */
  async delete() {
    if (!this.id) {
      throw new Error('No se puede eliminar un evento sin ID');
    }

    try {
      this.status = 'cancelled';
      this.updatedAt = new Date().toISOString();

      await db.collection('eventos').doc(this.id).update({
        status: this.status,
        updatedAt: this.updatedAt
      });

      return true;
    } catch (error) {
      throw new Error(`Error al eliminar evento: ${error.message}`);
    }
  }

  /**
   * Actualiza las estadísticas del evento
   */
  async updateStats(stats) {
    if (!this.id) {
      throw new Error('No se puede actualizar stats de un evento sin ID');
    }

    try {
      this.stats = { ...this.stats, ...stats };
      this.updatedAt = new Date().toISOString();

      await db.collection('eventos').doc(this.id).update({
        stats: this.stats,
        updatedAt: this.updatedAt
      });

      return this;
    } catch (error) {
      throw new Error(`Error al actualizar estadísticas: ${error.message}`);
    }
  }

  /**
   * Verifica si el evento tiene disponibilidad
   */
  hasAvailability() {
    return this.stats.totalTicketsSold < this.capacity;
  }

  /**
   * Obtiene la disponibilidad por tier
   */
  getTierAvailability(tierId) {
    const tier = this.tiers.find(t => t.id === tierId);
    if (!tier) return 0;

    return tier.capacity - (tier.sold || 0);
  }

  /**
   * Verifica si el evento está activo
   */
  isActive() {
    return this.status === 'published' || this.status === 'active';
  }

  /**
   * Verifica si el evento ya pasó
   */
  isPast() {
    const eventDate = new Date(this.date);
    return eventDate < new Date();
  }

  /**
   * Convierte el evento a JSON
   */
  toJSON() {
    return {
      id: this.id,
      tenantId: this.tenantId,
      // Soporte para campos en inglés y español
      name: this.name || this.nombre,
      nombre: this.nombre || this.name,
      description: this.description || this.descripcion,
      descripcion: this.descripcion || this.description,
      date: this.date || this.fecha,
      fecha: this.fecha || this.date,
      endDate: this.endDate,
      venue: this.venue || this.lugar,
      lugar: this.lugar || this.venue,
      ciudad: this.ciudad,
      pais: this.pais,
      status: this.status,
      capacity: this.capacity || this.capacidad,
      capacidad: this.capacidad || this.capacity,
      tiers: this.tiers,
      images: this.images || (this.imagen ? { banner: this.imagen, thumbnail: this.imagen } : null),
      imagen: this.imagen || this.images?.banner,
      imagenes: this.imagenes || this.images,
      settings: this.settings,
      stats: this.stats,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Event;
