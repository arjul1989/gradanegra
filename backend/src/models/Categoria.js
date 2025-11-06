const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

/**
 * Modelo de Categoria
 * Representa las categorías de eventos (Rock, Electrónica, etc.)
 */

class Categoria {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.slug = data.slug || this.generateSlug(data.nombre);
    this.nombre = data.nombre;
    this.nameAction = data.nameAction || `¡Descubre ${data.nombre}!`;
    this.descripcion = data.descripcion || '';
    this.imagen = data.imagen || '';
    this.icono = data.icono || 'celebration';
    this.status = data.status || 'activa';
    this.createdAt = data.createdAt || new Date().toISOString();
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
   * Crear categoría en Firestore
   */
  async save() {
    try {
      // Verificar que el slug sea único
      const existing = await Categoria.findBySlug(this.slug);
      if (existing && existing.id !== this.id) {
        throw new Error(`Ya existe una categoría con el slug: ${this.slug}`);
      }

      const categoriaRef = db.collection('categorias').doc(this.id);
      await categoriaRef.set(this.toJSON());
      return this;
    } catch (error) {
      throw new Error(`Error al guardar categoría: ${error.message}`);
    }
  }

  /**
   * Actualizar categoría
   */
  async update(data) {
    try {
      Object.assign(this, data);
      const categoriaRef = db.collection('categorias').doc(this.id);
      await categoriaRef.update(this.toJSON());
      return this;
    } catch (error) {
      throw new Error(`Error al actualizar categoría: ${error.message}`);
    }
  }

  /**
   * Contar eventos de esta categoría
   */
  async contarEventos() {
    try {
      const eventosCategoriasSnapshot = await db.collection('eventoCategorias')
        .where('categoriaId', '==', this.id)
        .get();
      
      let eventosActivos = 0;
      for (const doc of eventosCategoriasSnapshot.docs) {
        const eventoId = doc.data().eventoId;
        const eventoDoc = await db.collection('eventos').doc(eventoId).get();
        if (eventoDoc.exists) {
          const evento = eventoDoc.data();
          if (evento.status === 'activo' && !evento.deletedAt) {
            eventosActivos++;
          }
        }
      }
      
      return eventosActivos;
    } catch (error) {
      throw new Error(`Error al contar eventos: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      slug: this.slug,
      nombre: this.nombre,
      nameAction: this.nameAction,
      descripcion: this.descripcion,
      imagen: this.imagen,
      icono: this.icono,
      status: this.status,
      createdAt: this.createdAt
    };
  }

  // Métodos estáticos

  static async findById(id) {
    try {
      const doc = await db.collection('categorias').doc(id).get();
      if (!doc.exists) return null;
      return new Categoria(doc.data());
    } catch (error) {
      throw new Error(`Error al buscar categoría: ${error.message}`);
    }
  }

  static async findBySlug(slug) {
    try {
      const snapshot = await db.collection('categorias')
        .where('slug', '==', slug)
        .limit(1)
        .get();
      if (snapshot.empty) return null;
      return new Categoria(snapshot.docs[0].data());
    } catch (error) {
      throw new Error(`Error al buscar categoría por slug: ${error.message}`);
    }
  }

  static async findAll(filters = {}) {
    try {
      let query = db.collection('categorias');

      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => new Categoria(doc.data()));
    } catch (error) {
      throw new Error(`Error al listar categorías: ${error.message}`);
    }
  }

  static async findActivas() {
    return this.findAll({ status: 'activa' });
  }
}

module.exports = Categoria;
