const { db } = require('../config/firebase');

/**
 * Controlador de Eventos (Nuevo Modelo)
 */

/**
 * @route GET /api/eventos/destacados
 * @desc Obtener eventos destacados para el carrusel principal
 */
const getEventosDestacados = async (req, res) => {
  try {
    // 1. Obtener eventos destacados
    const eventosSnapshot = await db.collection('eventos')
      .where('destacado', '==', true)
      .where('status', '==', 'activo')
      .limit(15) // Traemos más para filtrar después
      .get();

    if (eventosSnapshot.empty) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // 2. Enriquecer con datos del comercio y categorías
    const eventosPromises = eventosSnapshot.docs.map(async (doc) => {
      const evento = { id: doc.id, ...doc.data() };

      // Filtrar eliminados
      if (evento.deletedAt) return null;

      // Obtener comercio
      const comercioDoc = await db.collection('comercios').doc(evento.comercioId).get();
      const comercio = comercioDoc.exists ? comercioDoc.data() : null;

      // Obtener categorías
      const categoriasSnapshot = await db.collection('eventos_categorias')
        .where('eventoId', '==', evento.id)
        .get();

      const categoriaIds = categoriasSnapshot.docs.map(d => d.data().categoriaId);
      const categorias = [];

      for (const catId of categoriaIds) {
        const catDoc = await db.collection('categorias').doc(catId).get();
        if (catDoc.exists) {
          categorias.push(catDoc.data().nombre);
        }
      }

      // Obtener próxima fecha (sin índice compuesto)
      const fechasSnapshot = await db.collection('fechas_evento')
        .where('eventoId', '==', evento.id)
        .get();

      // Filtrar y ordenar en memoria
      const ahora = new Date();
      const fechasActivas = fechasSnapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(f => {
          if (f.status !== 'activa' || f.deletedAt) return false;
          // Convertir fecha a Date si es un Timestamp
          const fechaDate = f.fecha?.toDate ? f.fecha.toDate() : new Date(f.fecha);
          return fechaDate >= ahora;
        })
        .sort((a, b) => {
          const fechaA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
          const fechaB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
          return fechaA - fechaB;
        });

      const proximaFecha = fechasActivas.length > 0 ? fechasActivas[0] : null;

      // Obtener precio mínimo
      let precioDesde = null;
      if (proximaFecha) {
        const tiersSnapshot = await db.collection('tiers')
          .where('fechaEventoId', '==', proximaFecha.id)
          .get();

        const tiersActivos = tiersSnapshot.docs
          .map(d => d.data())
          .filter(t => t.status === 'activo' && !t.deletedAt)
          .sort((a, b) => a.precio - b.precio);

        if (tiersActivos.length > 0) {
          precioDesde = tiersActivos[0].precio;
        }
      }

      return {
        ...evento,
        comercio: comercio ? {
          nombre: comercio.nombre,
          logo: comercio.logo
        } : null,
        categorias,
        proximaFecha: proximaFecha ? proximaFecha.fecha : null,
        precioDesde
      };
    });

    const eventosEnriquecidos = (await Promise.all(eventosPromises))
      .filter(e => e !== null) // Remover nulos (eliminados)
      .slice(0, 10); // Limitar a 10

    res.status(200).json({
      success: true,
      count: eventosEnriquecidos.length,
      data: eventosEnriquecidos
    });
  } catch (error) {
    console.error('Error al obtener eventos destacados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos destacados',
      error: error.message
    });
  }
};

/**
 * @route GET /api/eventos
 * @desc Buscar eventos con filtros
 * @query ciudad, fecha, categoria
 */
const getEventos = async (req, res) => {
  try {
    const { ciudad, categoria, limit = 20 } = req.query;

    let query = db.collection('eventos')
      .where('status', '==', 'activo')
      .where('deletedAt', '==', null);

    // Filtro por ciudad
    if (ciudad && ciudad !== 'Todas las ciudades') {
      query = query.where('ciudad', '==', ciudad);
    }

    const eventosSnapshot = await query.limit(parseInt(limit)).get();

    if (eventosSnapshot.empty) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Filtrar por categoría si se especifica
    let eventosIds = eventosSnapshot.docs.map(doc => doc.id);

    if (categoria) {
      // Buscar categoría por slug
      const categoriaSnapshot = await db.collection('categorias')
        .where('slug', '==', categoria)
        .limit(1)
        .get();

      if (!categoriaSnapshot.empty) {
        const categoriaId = categoriaSnapshot.docs[0].id;

        // Buscar eventos de esa categoría
        const relacionesSnapshot = await db.collection('eventos_categorias')
          .where('categoriaId', '==', categoriaId)
          .get();

        const eventosConCategoria = relacionesSnapshot.docs.map(d => d.data().eventoId);
        eventosIds = eventosIds.filter(id => eventosConCategoria.includes(id));
      }
    }

    // Enriquecer eventos
    const eventosPromises = eventosSnapshot.docs
      .filter(doc => eventosIds.includes(doc.id))
      .map(async (doc) => {
        const evento = { id: doc.id, ...doc.data() };

        // Obtener categorías
        const categoriasSnapshot = await db.collection('eventos_categorias')
          .where('eventoId', '==', evento.id)
          .get();

        const categoriaIds = categoriasSnapshot.docs.map(d => d.data().categoriaId);
        const categorias = [];

        for (const catId of categoriaIds) {
          const catDoc = await db.collection('categorias').doc(catId).get();
          if (catDoc.exists) {
            categorias.push(catDoc.data().nombre);
          }
        }

        // Obtener próxima fecha
        const fechaSnapshot = await db.collection('fechas_evento')
          .where('eventoId', '==', evento.id)
          .where('status', '==', 'activa')
          .where('deletedAt', '==', null)
          .orderBy('fecha', 'asc')
          .limit(1)
          .get();

        const proximaFecha = !fechaSnapshot.empty ? fechaSnapshot.docs[0].data() : null;

        // Obtener precio mínimo
        let precioDesde = null;
        if (proximaFecha) {
          const tiersSnapshot = await db.collection('tiers')
            .where('fechaEventoId', '==', proximaFecha.id)
            .where('status', '==', 'activo')
            .where('deletedAt', '==', null)
            .orderBy('precio', 'asc')
            .limit(1)
            .get();

          if (!tiersSnapshot.empty) {
            precioDesde = tiersSnapshot.docs[0].data().precio;
          }
        }

        return {
          ...evento,
          categorias,
          proximaFecha: proximaFecha ? proximaFecha.fecha : null,
          precioDesde
        };
      });

    const eventos = await Promise.all(eventosPromises);

    res.status(200).json({
      success: true,
      count: eventos.length,
      data: eventos,
      filters: { ciudad, categoria }
    });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos',
      error: error.message
    });
  }
};

/**
 * @route GET /api/eventos/:id
 * @desc Obtener detalle completo de un evento
 */
const getEventoById = async (req, res) => {
  try {
    const { id } = req.params;

    const eventoDoc = await db.collection('eventos').doc(id).get();

    if (!eventoDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    const evento = { id: eventoDoc.id, ...eventoDoc.data() };

    // Obtener comercio
    const comercioDoc = await db.collection('comercios').doc(evento.comercioId).get();
    const comercio = comercioDoc.exists ? comercioDoc.data() : null;

    // Obtener categorías
    const categoriasSnapshot = await db.collection('eventos_categorias')
      .where('eventoId', '==', evento.id)
      .get();

    const categoriaIds = categoriasSnapshot.docs.map(d => d.data().categoriaId);
    const categorias = [];

    for (const catId of categoriaIds) {
      const catDoc = await db.collection('categorias').doc(catId).get();
      if (catDoc.exists) {
        categorias.push({
          id: catDoc.id,
          ...catDoc.data()
        });
      }
    }

    // Obtener fechas con tiers (simplified to avoid composite index)
    const fechasSnapshot = await db.collection('fechas_evento')
      .where('eventoId', '==', evento.id)
      .get();

    // Filter and sort in memory to avoid Firestore index requirement
    const fechasFiltered = fechasSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(fecha => fecha.deletedAt === null)
      .sort((a, b) => {
        const dateA = a.fecha?.toDate?.() || new Date(a.fecha);
        const dateB = b.fecha?.toDate?.() || new Date(b.fecha);
        return dateA.getTime() - dateB.getTime();
      });

    const fechasPromises = fechasFiltered.map(async (fecha) => {
      // Obtener tiers de esta fecha (simplified query)
      const tiersSnapshot = await db.collection('tiers')
        .where('fechaEventoId', '==', fecha.id)
        .get();

      // Filter and sort in memory
      const tiers = tiersSnapshot.docs
        .map(tierDoc => ({ id: tierDoc.id, ...tierDoc.data() }))
        .filter(tier => tier.deletedAt === null)
        .sort((a, b) => (a.orden || 0) - (b.orden || 0));

      return {
        ...fecha,
        tiers
      };
    });

    const fechas = await Promise.all(fechasPromises);

    res.status(200).json({
      success: true,
      data: {
        ...evento,
        comercio,
        categorias,
        fechas
      }
    });
  } catch (error) {
    console.error('Error al obtener evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener evento',
      error: error.message
    });
  }
};

/**
 * @route GET /api/eventos/:id/disponibilidad
 * @desc Obtener disponibilidad de un evento (fechas y tiers)
 */
const getDisponibilidad = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el evento existe
    const eventoDoc = await db.collection('eventos').doc(id).get();

    if (!eventoDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    // Obtener fechas activas futuras
    const hoy = new Date().toISOString().split('T')[0];

    const fechasSnapshot = await db.collection('fechas_evento')
      .where('eventoId', '==', id)
      .where('status', '==', 'activa')
      .where('deletedAt', '==', null)
      .where('fecha', '>=', hoy)
      .orderBy('fecha', 'asc')
      .get();

    if (fechasSnapshot.empty) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Obtener tiers por fecha
    const disponibilidadPromises = fechasSnapshot.docs.map(async (fechaDoc) => {
      const fecha = { id: fechaDoc.id, ...fechaDoc.data() };

      const tiersSnapshot = await db.collection('tiers')
        .where('fechaEventoId', '==', fecha.id)
        .where('status', '==', 'activo')
        .where('deletedAt', '==', null)
        .orderBy('orden', 'asc')
        .get();

      const tiers = tiersSnapshot.docs.map(tierDoc => ({
        id: tierDoc.id,
        ...tierDoc.data()
      }));

      return {
        fecha: fecha.fecha,
        horaInicio: fecha.horaInicio,
        horaFin: fecha.horaFin,
        aforoTotal: fecha.aforoTotal,
        aforoDisponible: fecha.aforoDisponible,
        tiers: tiers.map(t => ({
          id: t.id,
          nombre: t.nombre,
          descripcion: t.descripcion,
          precio: t.precio,
          cantidad: t.cantidad,
          disponibles: t.disponibles,
          agotado: t.disponibles === 0
        }))
      };
    });

    const disponibilidad = await Promise.all(disponibilidadPromises);

    res.status(200).json({
      success: true,
      count: disponibilidad.length,
      data: disponibilidad
    });
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener disponibilidad',
      error: error.message
    });
  }
};

/**
 * @route GET /api/eventos/categoria/:slug
 * @desc Obtener eventos por categoría
 */
const getEventosByCategoria = async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit = 20 } = req.query;

    // Buscar categoría
    const categoriaSnapshot = await db.collection('categorias')
      .where('slug', '==', slug)
      .where('status', '==', 'activa')
      .limit(1)
      .get();

    if (categoriaSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const categoria = {
      id: categoriaSnapshot.docs[0].id,
      ...categoriaSnapshot.docs[0].data()
    };

    // Buscar eventos de esta categoría
    const relacionesSnapshot = await db.collection('eventos_categorias')
      .where('categoriaId', '==', categoria.id)
      .get();

    const eventosIds = relacionesSnapshot.docs.map(d => d.data().eventoId);

    if (eventosIds.length === 0) {
      return res.status(200).json({
        success: true,
        categoria,
        count: 0,
        data: []
      });
    }

    // Obtener eventos (en batches de 10 por limitación de Firestore)
    const eventosPromises = eventosIds.slice(0, parseInt(limit)).map(async (eventoId) => {
      const eventoDoc = await db.collection('eventos').doc(eventoId).get();
      
      if (!eventoDoc.exists || eventoDoc.data().deletedAt || eventoDoc.data().status !== 'activo') {
        return null;
      }

      const evento = { id: eventoDoc.id, ...eventoDoc.data() };

      // Obtener próxima fecha (sin filtros complejos)
      const fechasSnapshot = await db.collection('fechas_evento')
        .where('eventoId', '==', evento.id)
        .get();

      // Filtrar en memoria
      const ahora = new Date();
      const fechasActivas = fechasSnapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(f => {
          if (f.status !== 'activa' || f.deletedAt) return false;
          const fechaDate = f.fecha?.toDate ? f.fecha.toDate() : new Date(f.fecha);
          return fechaDate >= ahora;
        })
        .sort((a, b) => {
          const fechaA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
          const fechaB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
          return fechaA - fechaB;
        });

      const proximaFecha = fechasActivas.length > 0 ? fechasActivas[0] : null;

      // Obtener precio mínimo
      let precioDesde = null;
      if (proximaFecha) {
        const tiersSnapshot = await db.collection('tiers')
          .where('fechaEventoId', '==', proximaFecha.id)
          .get();

        const tiersActivos = tiersSnapshot.docs
          .map(d => d.data())
          .filter(t => t.status === 'activo' && !t.deletedAt)
          .sort((a, b) => a.precio - b.precio);

        if (tiersActivos.length > 0) {
          precioDesde = tiersActivos[0].precio;
        }
      }

      return {
        ...evento,
        proximaFecha: proximaFecha ? proximaFecha.fecha : null,
        precioDesde
      };
    });

    const eventos = (await Promise.all(eventosPromises)).filter(e => e !== null);

    res.status(200).json({
      success: true,
      categoria,
      count: eventos.length,
      data: eventos
    });
  } catch (error) {
    console.error('Error al obtener eventos por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos por categoría',
      error: error.message
    });
  }
};

module.exports = {
  getEventosDestacados,
  getEventos,
  getEventoById,
  getDisponibilidad,
  getEventosByCategoria
};
