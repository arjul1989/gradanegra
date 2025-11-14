const { db } = require('../config/firebase');

/**
 * Buyer Model
 * Representa un comprador/cliente de la plataforma
 * Usuarios finales que compran tickets
 */
class Buyer {
  constructor(data) {
    this.id = data.id || null; // UID de Firebase Auth
    this.email = data.email;
    this.displayName = data.displayName || '';
    this.photoURL = data.photoURL || null;
    this.phoneNumber = data.phoneNumber || null;
    
    // Información personal
    this.profile = data.profile || {
      firstName: '',
      lastName: '',
      dateOfBirth: null,
      gender: null,
      address: {
        street: '',
        city: '',
        state: '',
        country: 'MX',
        postalCode: ''
      },
      preferences: {
        language: 'es',
        currency: 'COP',
        notifications: {
          email: true,
          sms: false,
          push: false
        },
        categories: [] // Categorías de eventos favoritas
      }
    };

    // Autenticación
    this.authProvider = data.authProvider || 'password'; // password, google.com, facebook.com
    this.emailVerified = data.emailVerified || false;

    // Estadísticas
    this.stats = data.stats || {
      totalTicketsPurchased: 0,
      totalSpent: 0,
      totalEventsAttended: 0,
      favoriteVenues: [],
      favoriteCategories: []
    };

    // Metadata
    this.status = data.status || 'active'; // active, suspended, deleted
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.lastLoginAt = data.lastLoginAt || null;
  }

  /**
   * Valida los datos del comprador
   */
  validate() {
    const errors = [];

    if (!this.email) {
      errors.push('El email es requerido');
    } else {
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        errors.push('Formato de email inválido');
      }
    }

    if (!this.id) {
      errors.push('El ID de Firebase Auth es requerido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Guarda el comprador en Firestore
   */
  async save() {
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
    }

    this.updatedAt = new Date().toISOString();

    try {
      const buyerData = {
        email: this.email,
        displayName: this.displayName,
        photoURL: this.photoURL,
        phoneNumber: this.phoneNumber,
        profile: this.profile,
        authProvider: this.authProvider,
        emailVerified: this.emailVerified,
        stats: this.stats,
        status: this.status,
        updatedAt: this.updatedAt,
        lastLoginAt: this.lastLoginAt
      };

      // Usar el UID de Firebase como document ID
      if (this.id) {
        const docRef = db.collection('buyers').doc(this.id);
        const doc = await docRef.get();
        
        if (doc.exists) {
          // Actualizar comprador existente
          await docRef.update(buyerData);
        } else {
          // Crear nuevo comprador
          buyerData.createdAt = this.createdAt;
          await docRef.set(buyerData);
        }
      } else {
        throw new Error('ID de Firebase Auth es requerido para guardar');
      }

      return this;
    } catch (error) {
      throw new Error(`Error al guardar comprador: ${error.message}`);
    }
  }

  /**
   * Busca un comprador por ID (UID de Firebase)
   */
  static async findById(buyerId) {
    try {
      const doc = await db.collection('buyers').doc(buyerId).get();
      
      if (!doc.exists) {
        return null;
      }

      return new Buyer({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error al buscar comprador: ${error.message}`);
    }
  }

  /**
   * Busca un comprador por email
   */
  static async findByEmail(email) {
    try {
      const snapshot = await db.collection('buyers')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return new Buyer({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error al buscar comprador por email: ${error.message}`);
    }
  }

  /**
   * Lista compradores con filtros (para admin)
   */
  static async list(filters = {}) {
    try {
      let query = db.collection('buyers');

      // Filtrar por status
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      // Ordenar
      const orderBy = filters.orderBy || 'createdAt';
      const orderDirection = filters.orderDirection || 'desc';
      query = query.orderBy(orderBy, orderDirection);

      // Límite y offset
      const limit = filters.limit || 50;
      if (filters.offset) {
        query = query.offset(filters.offset);
      }
      query = query.limit(limit);

      const snapshot = await query.get();

      return snapshot.docs.map(doc => new Buyer({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error al listar compradores: ${error.message}`);
    }
  }

  /**
   * Actualiza el timestamp de último login
   */
  async updateLastLogin() {
    if (!this.id) {
      throw new Error('No se puede actualizar login sin ID');
    }

    try {
      this.lastLoginAt = new Date().toISOString();
      
      await db.collection('buyers').doc(this.id).update({
        lastLoginAt: this.lastLoginAt
      });

      return this;
    } catch (error) {
      throw new Error(`Error al actualizar último login: ${error.message}`);
    }
  }

  /**
   * Actualiza las estadísticas del comprador
   */
  async updateStats(stats) {
    if (!this.id) {
      throw new Error('No se puede actualizar stats sin ID');
    }

    try {
      this.stats = { ...this.stats, ...stats };
      this.updatedAt = new Date().toISOString();

      await db.collection('buyers').doc(this.id).update({
        stats: this.stats,
        updatedAt: this.updatedAt
      });

      return this;
    } catch (error) {
      throw new Error(`Error al actualizar estadísticas: ${error.message}`);
    }
  }

  /**
   * Actualiza el perfil del comprador
   */
  async updateProfile(profileData) {
    if (!this.id) {
      throw new Error('No se puede actualizar perfil sin ID');
    }

    try {
      // Merge con datos existentes
      this.profile = {
        ...this.profile,
        ...profileData,
        address: {
          ...this.profile.address,
          ...(profileData.address || {})
        },
        preferences: {
          ...this.profile.preferences,
          ...(profileData.preferences || {}),
          notifications: {
            ...this.profile.preferences.notifications,
            ...(profileData.preferences?.notifications || {})
          }
        }
      };

      this.updatedAt = new Date().toISOString();

      await db.collection('buyers').doc(this.id).update({
        profile: this.profile,
        updatedAt: this.updatedAt
      });

      return this;
    } catch (error) {
      throw new Error(`Error al actualizar perfil: ${error.message}`);
    }
  }

  /**
   * Desactiva el comprador (soft delete)
   */
  async deactivate() {
    if (!this.id) {
      throw new Error('No se puede desactivar sin ID');
    }

    try {
      this.status = 'deleted';
      this.updatedAt = new Date().toISOString();

      await db.collection('buyers').doc(this.id).update({
        status: this.status,
        updatedAt: this.updatedAt
      });

      return true;
    } catch (error) {
      throw new Error(`Error al desactivar comprador: ${error.message}`);
    }
  }

  /**
   * Verifica si el comprador está activo
   */
  isActive() {
    return this.status === 'active';
  }

  /**
   * Obtiene el nombre completo del comprador
   */
  getFullName() {
    if (this.profile.firstName && this.profile.lastName) {
      return `${this.profile.firstName} ${this.profile.lastName}`;
    }
    return this.displayName || this.email.split('@')[0];
  }

  /**
   * Convierte el comprador a JSON (público)
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      displayName: this.displayName,
      photoURL: this.photoURL,
      phoneNumber: this.phoneNumber,
      profile: this.profile,
      authProvider: this.authProvider,
      emailVerified: this.emailVerified,
      stats: this.stats,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt
    };
  }

  /**
   * Convierte el comprador a JSON (privado con más detalles)
   */
  toPrivateJSON() {
    return this.toJSON();
  }
}

module.exports = Buyer;
