const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

/**
 * Modelo de Evento (Nuevo Esquema)
 * Representa un evento creado por un comercio organizador
 */

class Evento {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.comercioId = data.comercioId;
    this.nombre = data.nombre;
    this.descripcion = data.descripcion || '';
    this.imagen = data.imagen || '';
    this.ciudad = data.ciudad || '';
    this.ubicacion = data.ubicacion || '';
    this.destacado = data.destacado || false;
    this.status = data.status || 'activo'; // activo, pausado, finalizado, cancelado
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.deletedAt = data.deletedAt || null;
  }

  /**
   * Validar datos del evento
   */
  validate() {
    const errors = [];

    if (!this.comercioId) {
      errors.push('El ID del comercio es requerido');
    }

    if (!this.nombre || this.nombre.trim().length < 3) {
      errors.push('El nombre debe tener al menos 3 caracteres');
    }

    if (!this.ciudad || this.ciudad.trim().length < 2) {
      errors.push('La ciudad es requerida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Guardar evento en Firestore
   */
  async save() {
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
    }

    try {
      // Verificar límite de eventos del comercio
      const { Comercio } = require('./Comercio');
      const comercio = await Comercio.findById(this.comercioId);
      
      if (!comercio) {
        throw new Error('Comercio no encontrado');
      }

      const puedeCrear = await comercio.puedeCrearEvento();
      if (!puedeCrear) {
        throw new Error(`Has alcanzado el límite de ${comercio.limiteEventos} eventos activos para tu plan ${comercio.tipoPlan}`);
      }

      // Si quiere destacar, verificar que su plan lo permita
      if (this.destacado) {
        if (!comercio.puedeDestacarEvento()) {
          throw new Error(`Tu plan ${comercio.tipoPlan} no permite destacar eventos. Actualiza a PRO o ENTERPRISE`);
        }

        const eventosDestacados = await comercio.contarEventosDestacados();
        const limiteDestacados = require('./Comercio').PLANES[comercio.tipoPlan].eventosDestacados;
        
        if (eventosDestacados >= limiteDestacados) {
          throw new Error(`Has alcanzado el límite de ${limiteDestacados} eventos destacados para tu plan`);
        }
      }

      const eventoRef = db.collection('eventos').doc(this.id);
      await eventoRef.set(this.toJSON());
      return this;
    } catch (error) {
      throw new Error(`Error al guardar evento: ${error.message}`);
    }
  }

  /**
   * Actualizar evento
   */
  async update(data) {
    try {
      this.updatedAt = new Date().toISOString();
      
      // Si se intenta destacar, verificar permisos
      if (data.destacado && !this.destacado) {
        const { Comercio } = require('./Comercio');
        const comercio = await Comercio.findById(this.comercioId);
        
        if (!comercio.puedeDestacarEvento()) {
          throw new Error(`Tu plan no permite destacar eventos`);
        }

        const eventosDestacados = await comercio.contarEventosDestacados();
        const limiteDestacados = require('./Comercio').PLANES[comercio.tipoPlan].eventosDestacados;
        
        if (eventosDestacados >= limiteDestacados) {
          throw new Error(`Has alcanzado el límite de eventos destacados`);
        }
      }

      Object.assign(this, data);
      
      const eventoRef = db.collection('eventos').doc(this.id);
      await eventoRef.update(this.toJSON());
      return this;
    } catch (error) {
      throw new Error(`Error al actualizar evento: ${error.message}`);
    }
  }

  /**
   * Soft delete
   */
  async delete() {
    try {
      this.deletedAt = new Date().toISOString();
      this.status = 'cancelado';
      this.updatedAt = new Date().toISOString();
      
      const eventoRef = db.collection('eventos').doc(this.id);
      await eventoRef.update({
        deletedAt: this.deletedAt,
        status: this.status,
        updatedAt: this.updatedAt
      });
      return this;
    } catch (error) {
      throw new Error(`Error al eliminar evento: ${error.message}`);
    }
  }

  /**
   * Asociar categorías al evento (máximo 5)
   */
  async asociarCategorias(categoriaIds) {
    if (categoriaIds.length > 5) {
      throw new Error('Un evento puede tener máximo 5 categorías');
    }

    try {
      // Eliminar asociaciones existentes
      const existingSnapshot = await db.collection('eventoCategorias')
        .where('eventoId', '==', this.id)
        .get();
      
      const deletePromises = existingSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);

      // Crear nuevas asociaciones
      const createPromises = categoriaIds.map(categoriaId => {
        return db.collection('eventoCategorias').add({
          id: uuidv4(),
          eventoId: this.id,
          categoriaId,
          createdAt: new Date().toISOString()
        });
      });

      await Promise.all(createPromises);
      return this;
    } catch (error) {
      throw new Error(`Error al asociar categorías: ${error.message}`);
    }
  }

  /**
   * Obtener categorías del evento
   */
  async getCategorias() {
    try {
      const snapshot = await db.collection('eventoCategorias')
        .where('eventoId', '==', this.id)
        .get();

      const Categoria = require('./Categoria');
      const categoriaIds = snapshot.docs.map(doc => doc.data().categoriaId);
      
      const categorias = await Promise.all(
        categoriaIds.map(id => Categoria.findById(id))
      );

      return categorias.filter(cat => cat !== null);
    } catch (error) {
      throw new Error(`Error al obtener categorías: ${error.message}`);
    }
  }

  /**
   * Obtener fechas del evento
   */
  async getFechas() {
    try {
      const snapshot = await db.collection('fechasEvento')
        .where('eventoId', '==', this.id)
        .where('deletedAt', '==', null)
        .orderBy('fecha', 'asc')
        .get();

      const FechaEvento = require('./FechaEvento');
      return snapshot.docs.map(doc => new FechaEvento(doc.data()));
    } catch (error) {
      throw new Error(`Error al obtener fechas: ${error.message}`);
    }
  }

  /**
   * Obtener comercio organizador
   */
  async getComercio() {
    try {
      const { Comercio } = require('./Comercio');
      return await Comercio.findById(this.comercioId);
    } catch (error) {
      throw new Error(`Error al obtener comercio: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      comercioId: this.comercioId,
      nombre: this.nombre,
      descripcion: this.descripcion,
      imagen: this.imagen,
      ciudad: this.ciudad,
      ubicacion: this.ubicacion,
      destacado: this.destacado,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt
    };
  }

  // Métodos estáticos

  static async findById(id) {
    try {
      const doc = await db.collection('eventos').doc(id).get();
      if (!doc.exists) return null;
      return new Evento(doc.data());
    } catch (error) {
      throw new Error(`Error al buscar evento: ${error.message}`);
    }
  }

  static async findAll(filters = {}) {
    try {
      let query = db.collection('eventos');

      if (filters.comercioId) {
        query = query.where('comercioId', '==', filters.comercioId);
      }

      if (filters.ciudad) {
        query = query.where('ciudad', '==', filters.ciudad);
      }

      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      if (filters.destacado !== undefined) {
        query = query.where('destacado', '==', filters.destacado);
      }

      // Solo eventos no eliminados
      query = query.where('deletedAt', '==', null);

      // Ordenar
      const orderBy = filters.orderBy || 'createdAt';
      const orderDirection = filters.orderDirection || 'desc';
      query = query.orderBy(orderBy, orderDirection);

      // Límite
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => new Evento(doc.data()));
    } catch (error) {
      throw new Error(`Error al listar eventos: ${error.message}`);
    }
  }

  /**
   * Obtener eventos destacados para el carrusel
   */
  static async findDestacados(limit = 10) {
    try {
      const eventosSnapshot = await db.collection('eventos')
        .where('destacado', '==', true)
        .where('status', '==', 'activo')
        .where('deletedAt', '==', null)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const eventos = eventosSnapshot.docs.map(doc => new Evento(doc.data()));

      // Verificar que tengan fechas futuras
      const eventosConFechas = [];
      for (const evento of eventos) {
        const fechasSnapshot = await db.collection('fechasEvento')
          .where('eventoId', '==', evento.id)
          .where('status', '==', 'activa')
          .where('deletedAt', '==', null)
          .get();

        const tieneFechasFuturas = fechasSnapshot.docs.some(doc => {
          const fecha = new Date(doc.data().fecha);
          return fecha >= new Date();
        });

        if (tieneFechasFuturas) {
          eventosConFechas.push(evento);
        }
      }

      return eventosConFechas;
    } catch (error) {
      throw new Error(`Error al obtener eventos destacados: ${error.message}`);
    }
  }

  /**
   * Buscar eventos por categoría
   */
  static async findByCategoria(categoriaSlug, filters = {}) {
    try {
      const Categoria = require('./Categoria');
      const categoria = await Categoria.findBySlug(categoriaSlug);
      
      if (!categoria) {
        throw new Error('Categoría no encontrada');
      }

      const eventosCategoriasSnapshot = await db.collection('eventoCategorias')
        .where('categoriaId', '==', categoria.id)
        .get();

      const eventoIds = eventosCategoriasSnapshot.docs.map(doc => doc.data().eventoId);

      if (eventoIds.length === 0) {
        return [];
      }

      // Firestore no soporta IN con más de 10 elementos, así que haremos múltiples queries
      const chunks = [];
      for (let i = 0; i < eventoIds.length; i += 10) {
        chunks.push(eventoIds.slice(i, i + 10));
      }

      const eventos = [];
      for (const chunk of chunks) {
        let query = db.collection('eventos')
          .where('__name__', 'in', chunk)
          .where('status', '==', 'activo')
          .where('deletedAt', '==', null);

        if (filters.ciudad) {
          query = query.where('ciudad', '==', filters.ciudad);
        }

        const snapshot = await query.get();
        eventos.push(...snapshot.docs.map(doc => new Evento(doc.data())));
      }

      return eventos;
    } catch (error) {
      throw new Error(`Error al buscar eventos por categoría: ${error.message}`);
    }
  }
}

module.exports = Evento;
