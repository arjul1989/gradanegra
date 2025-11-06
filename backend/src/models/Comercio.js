const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

/**
 * Modelo de Comercio (Organizador)
 * Representa a los organizadores de eventos en el sistema multitenant
 */

const PLANES = {
  free: {
    eventos: 2,
    usuarios: 1,
    comision: 10.0,
    eventosDestacados: 0,
    puedeDestacar: false
  },
  basic: {
    eventos: 10,
    usuarios: 2,
    comision: 7.0,
    eventosDestacados: 0,
    puedeDestacar: false
  },
  pro: {
    eventos: 50,
    usuarios: 3,
    comision: 5.0,
    eventosDestacados: 2,
    puedeDestacar: true
  },
  enterprise: {
    eventos: -1, // -1 = ilimitado
    usuarios: 10,
    comision: 3.0,
    eventosDestacados: 5,
    puedeDestacar: true
  }
};

class Comercio {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.nombre = data.nombre;
    this.slug = data.slug || this.generateSlug(data.nombre);
    this.descripcion = data.descripcion || '';
    this.logo = data.logo || '';
    this.imagenBanner = data.imagenBanner || '';
    this.email = data.email;
    this.telefono = data.telefono || '';
    this.direccion = data.direccion || '';
    this.ciudad = data.ciudad || '';
    this.pais = data.pais || 'Colombia';
    this.website = data.website || null;
    this.redesSociales = data.redesSociales || {
      facebook: '',
      instagram: '',
      twitter: '',
      tiktok: ''
    };
    this.colorPrimario = data.colorPrimario || '#000000';
    this.colorSecundario = data.colorSecundario || '#FFFFFF';
    this.tipoPlan = data.tipoPlan || 'free';
    this.limiteEventos = data.limiteEventos || PLANES[this.tipoPlan].eventos;
    this.comision = data.comision || PLANES[this.tipoPlan].comision;
    this.status = data.status || 'activo';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.deletedAt = data.deletedAt || null;
  }

  generateSlug(nombre) {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
      .replace(/^-+|-+$/g, ''); // Trim dashes
  }

  /**
   * Crear comercio en Firestore
   */
  async save() {
    try {
      // Verificar que el slug sea único
      const existingComercio = await Comercio.findBySlug(this.slug);
      if (existingComercio && existingComercio.id !== this.id) {
        throw new Error(`Ya existe un comercio con el slug: ${this.slug}`);
      }

      // Verificar que el email sea único
      const existingEmail = await Comercio.findByEmail(this.email);
      if (existingEmail && existingEmail.id !== this.id) {
        throw new Error(`Ya existe un comercio con el email: ${this.email}`);
      }

      const comercioRef = db.collection('comercios').doc(this.id);
      await comercioRef.set(this.toJSON());
      return this;
    } catch (error) {
      throw new Error(`Error al guardar comercio: ${error.message}`);
    }
  }

  /**
   * Actualizar comercio
   */
  async update(data) {
    try {
      this.updatedAt = new Date().toISOString();
      Object.assign(this, data);
      
      const comercioRef = db.collection('comercios').doc(this.id);
      await comercioRef.update(this.toJSON());
      return this;
    } catch (error) {
      throw new Error(`Error al actualizar comercio: ${error.message}`);
    }
  }

  /**
   * Soft delete
   */
  async delete() {
    try {
      this.deletedAt = new Date().toISOString();
      this.status = 'inactivo';
      const comercioRef = db.collection('comercios').doc(this.id);
      await comercioRef.update({
        deletedAt: this.deletedAt,
        status: this.status,
        updatedAt: this.updatedAt
      });
      return this;
    } catch (error) {
      throw new Error(`Error al eliminar comercio: ${error.message}`);
    }
  }

  /**
   * Verificar si puede crear más eventos
   */
  async puedeCrearEvento() {
    const eventosActivos = await this.contarEventosActivos();
    if (this.limiteEventos === -1) return true; // ilimitado
    return eventosActivos < this.limiteEventos;
  }

  /**
   * Verificar si puede destacar eventos
   */
  puedeDestacarEvento() {
    return PLANES[this.tipoPlan].puedeDestacar;
  }

  /**
   * Contar eventos activos del comercio
   */
  async contarEventosActivos() {
    try {
      const eventosSnapshot = await db.collection('eventos')
        .where('comercioId', '==', this.id)
        .where('status', '==', 'activo')
        .where('deletedAt', '==', null)
        .get();
      return eventosSnapshot.size;
    } catch (error) {
      throw new Error(`Error al contar eventos: ${error.message}`);
    }
  }

  /**
   * Contar eventos destacados del comercio
   */
  async contarEventosDestacados() {
    try {
      const eventosSnapshot = await db.collection('eventos')
        .where('comercioId', '==', this.id)
        .where('destacado', '==', true)
        .where('status', '==', 'activo')
        .where('deletedAt', '==', null)
        .get();
      return eventosSnapshot.size;
    } catch (error) {
      throw new Error(`Error al contar eventos destacados: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas del comercio
   */
  async getEstadisticas() {
    try {
      const eventosActivos = await this.contarEventosActivos();
      const eventosDestacados = await this.contarEventosDestacados();
      
      // Obtener ventas totales (se implementará cuando tengamos compras)
      const comprasSnapshot = await db.collection('compras')
        .where('comercioId', '==', this.id)
        .where('status', '==', 'completada')
        .get();
      
      let ventasTotales = 0;
      comprasSnapshot.forEach(doc => {
        ventasTotales += doc.data().total || 0;
      });

      const comisionesPlataforma = ventasTotales * (this.comision / 100);
      const ingresosNetos = ventasTotales - comisionesPlataforma;

      return {
        eventosActivos,
        eventosDestacados,
        limiteEventos: this.limiteEventos,
        totalCompras: comprasSnapshot.size,
        ventasTotales,
        comisionesPlataforma,
        ingresosNetos,
        plan: this.tipoPlan,
        comision: this.comision
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      slug: this.slug,
      descripcion: this.descripcion,
      logo: this.logo,
      imagenBanner: this.imagenBanner,
      email: this.email,
      telefono: this.telefono,
      direccion: this.direccion,
      ciudad: this.ciudad,
      pais: this.pais,
      website: this.website,
      redesSociales: this.redesSociales,
      colorPrimario: this.colorPrimario,
      colorSecundario: this.colorSecundario,
      tipoPlan: this.tipoPlan,
      limiteEventos: this.limiteEventos,
      comision: this.comision,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt
    };
  }

  // Métodos estáticos para consultas

  static async findById(id) {
    try {
      const doc = await db.collection('comercios').doc(id).get();
      if (!doc.exists) return null;
      return new Comercio(doc.data());
    } catch (error) {
      throw new Error(`Error al buscar comercio: ${error.message}`);
    }
  }

  static async findBySlug(slug) {
    try {
      const snapshot = await db.collection('comercios')
        .where('slug', '==', slug)
        .limit(1)
        .get();
      if (snapshot.empty) return null;
      return new Comercio(snapshot.docs[0].data());
    } catch (error) {
      throw new Error(`Error al buscar comercio por slug: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      const snapshot = await db.collection('comercios')
        .where('email', '==', email)
        .limit(1)
        .get();
      if (snapshot.empty) return null;
      return new Comercio(snapshot.docs[0].data());
    } catch (error) {
      throw new Error(`Error al buscar comercio por email: ${error.message}`);
    }
  }

  static async findAll(filters = {}) {
    try {
      let query = db.collection('comercios');

      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      if (filters.ciudad) {
        query = query.where('ciudad', '==', filters.ciudad);
      }

      if (filters.tipoPlan) {
        query = query.where('tipoPlan', '==', filters.tipoPlan);
      }

      // Solo comercios no eliminados
      query = query.where('deletedAt', '==', null);

      const snapshot = await query.get();
      return snapshot.docs.map(doc => new Comercio(doc.data()));
    } catch (error) {
      throw new Error(`Error al listar comercios: ${error.message}`);
    }
  }
}

module.exports = { Comercio, PLANES };
