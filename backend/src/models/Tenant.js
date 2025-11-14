const { db } = require('../config/firebase');

/**
 * Tenant Model
 * Representa un comercio/tenant en la plataforma white-label
 */
class Tenant {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name;
    this.slug = data.slug; // URL-friendly identifier
    this.email = data.email;
    this.logoUrl = data.logoUrl || null;
    this.status = data.status || 'active'; // active, suspended, inactive
    this.settings = data.settings || {
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      timezone: 'America/Bogota',
      currency: 'COP',
      taxRate: 0.19 // 19% IVA Colombia
    };
    this.contactInfo = data.contactInfo || {
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'MX',
      postalCode: ''
    };
    this.subscription = data.subscription || {
      plan: 'free', // free, basic, premium
      startDate: new Date().toISOString(),
      endDate: null,
      maxEvents: 10, // Límite para plan free
      maxTicketsPerEvent: 1000
    };
    this.stats = data.stats || {
      totalEvents: 0,
      totalTicketsSold: 0,
      totalRevenue: 0
    };
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.createdBy = data.createdBy || null; // User ID del platform_admin
  }

  /**
   * Valida los datos del tenant
   */
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Email inválido');
    }

    if (!this.slug || this.slug.trim().length < 2) {
      errors.push('El slug es requerido');
    }

    if (this.slug && !this.isValidSlug(this.slug)) {
      errors.push('El slug solo puede contener letras minúsculas, números y guiones');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidSlug(slug) {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  }

  /**
   * Genera un slug desde el nombre
   */
  static generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Spaces to hyphens
      .replace(/-+/g, '-') // Multiple hyphens to single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Guarda el tenant en Firestore
   */
  async save() {
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
    }

    this.updatedAt = new Date().toISOString();

    try {
      if (this.id) {
        // Actualizar tenant existente
        await db.collection('tenants').doc(this.id).update({
          name: this.name,
          slug: this.slug,
          email: this.email,
          logoUrl: this.logoUrl,
          status: this.status,
          settings: this.settings,
          contactInfo: this.contactInfo,
          subscription: this.subscription,
          stats: this.stats,
          updatedAt: this.updatedAt
        });
      } else {
        // Crear nuevo tenant
        const docRef = await db.collection('tenants').add({
          name: this.name,
          slug: this.slug,
          email: this.email,
          logoUrl: this.logoUrl,
          status: this.status,
          settings: this.settings,
          contactInfo: this.contactInfo,
          subscription: this.subscription,
          stats: this.stats,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          createdBy: this.createdBy
        });
        this.id = docRef.id;
      }

      return this;
    } catch (error) {
      throw new Error(`Error al guardar tenant: ${error.message}`);
    }
  }

  /**
   * Busca un tenant por ID
   */
  static async findById(tenantId) {
    try {
      const doc = await db.collection('tenants').doc(tenantId).get();
      
      if (!doc.exists) {
        return null;
      }

      return new Tenant({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error al buscar tenant: ${error.message}`);
    }
  }

  /**
   * Busca un tenant por slug
   */
  static async findBySlug(slug) {
    try {
      const snapshot = await db.collection('tenants')
        .where('slug', '==', slug)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return new Tenant({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error al buscar tenant por slug: ${error.message}`);
    }
  }

  /**
   * Busca un tenant por email
   */
  static async findByEmail(email) {
    try {
      const snapshot = await db.collection('tenants')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return new Tenant({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error al buscar tenant por email: ${error.message}`);
    }
  }

  /**
   * Lista todos los tenants con filtros opcionales
   */
  static async list(filters = {}) {
    try {
      let query = db.collection('tenants');

      // Aplicar filtros
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      if (filters.plan) {
        query = query.where('subscription.plan', '==', filters.plan);
      }

      // Ordenar por fecha de creación (más recientes primero)
      query = query.orderBy('createdAt', 'desc');

      // Límite
      const limit = filters.limit || 50;
      query = query.limit(limit);

      const snapshot = await query.get();

      return snapshot.docs.map(doc => new Tenant({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error al listar tenants: ${error.message}`);
    }
  }

  /**
   * Elimina un tenant (soft delete)
   */
  async delete() {
    if (!this.id) {
      throw new Error('No se puede eliminar un tenant sin ID');
    }

    try {
      // Soft delete: cambiar status a 'inactive'
      this.status = 'inactive';
      this.updatedAt = new Date().toISOString();

      await db.collection('tenants').doc(this.id).update({
        status: this.status,
        updatedAt: this.updatedAt
      });

      return true;
    } catch (error) {
      throw new Error(`Error al eliminar tenant: ${error.message}`);
    }
  }

  /**
   * Actualiza las estadísticas del tenant
   */
  async updateStats(stats) {
    if (!this.id) {
      throw new Error('No se puede actualizar stats de un tenant sin ID');
    }

    try {
      this.stats = { ...this.stats, ...stats };
      this.updatedAt = new Date().toISOString();

      await db.collection('tenants').doc(this.id).update({
        stats: this.stats,
        updatedAt: this.updatedAt
      });

      return this;
    } catch (error) {
      throw new Error(`Error al actualizar estadísticas: ${error.message}`);
    }
  }

  /**
   * Verifica si el tenant puede crear más eventos según su plan
   */
  canCreateMoreEvents() {
    return this.stats.totalEvents < this.subscription.maxEvents;
  }

  /**
   * Convierte el tenant a JSON sin datos sensibles
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      email: this.email,
      logoUrl: this.logoUrl,
      status: this.status,
      settings: this.settings,
      contactInfo: this.contactInfo,
      subscription: this.subscription,
      stats: this.stats,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Tenant;
