const express = require('express');
const router = express.Router();
const { db, admin } = require('../../config/firebase');
const { verifyAdmin } = require('../../middleware/verifyAdmin');
const { logAdminAction } = require('../../utils/adminLogger');

// Aplicar middleware a todas las rutas
router.use(verifyAdmin);

/**
 * GET /api/admin/comercios
 * Listar comercios con filtros y paginación
 */
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      tipoPlan, 
      ciudad, 
      search,
      limit = 25, 
      offset = 0,
      orderBy = 'createdAt'
    } = req.query;

    let query = db.collection('comercios');

    // Aplicar filtros
    if (status) {
      query = query.where('status', '==', status);
    }
    if (tipoPlan) {
      query = query.where('tipoPlan', '==', tipoPlan);
    }
    if (ciudad) {
      query = query.where('ciudad', '==', ciudad);
    }

    // Obtener todos para calcular total
    const allSnapshot = await query.get();
    const total = allSnapshot.size;

    // Aplicar ordenamiento y paginación
    query = query.orderBy(orderBy, 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    const snapshot = await query.get();

    // Enriquecer datos con estadísticas
    const comercios = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const comercio = { id: doc.id, ...doc.data() };

        // Contar eventos activos
        const eventosSnapshot = await db.collection('eventos')
          .where('comercioId', '==', doc.id)
          .where('status', '==', 'activo')
          .get();
        comercio.eventosActivos = eventosSnapshot.size;

        // Contar eventos destacados
        const destacadosSnapshot = await db.collection('eventos')
          .where('comercioId', '==', doc.id)
          .where('status', '==', 'activo')
          .where('destacado', '==', true)
          .get();
        comercio.eventosDestacados = destacadosSnapshot.size;

        // Calcular límite efectivo (custom override o plan estándar)
        comercio.limiteEventosEfectivo = comercio.limiteEventosCustom !== undefined 
          ? comercio.limiteEventosCustom 
          : comercio.limiteEventos;

        comercio.limiteDestacadosEfectivo = comercio.limiteDestacadosCustom !== undefined 
          ? comercio.limiteDestacadosCustom 
          : comercio.limiteDestacados || 0;

        // Calcular ventas del mes actual
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const comprasSnapshot = await db.collection('compras')
          .where('comercioId', '==', doc.id)
          .where('status', '==', 'completada')
          .where('fechaCompra', '>=', firstDayOfMonth)
          .get();

        let ventasMesActual = 0;
        comprasSnapshot.forEach(compraDoc => {
          ventasMesActual += compraDoc.data().total || 0;
        });
        comercio.ventasMesActual = Math.round(ventasMesActual * 100) / 100;

        // Calcular comisión efectiva
        comercio.comisionEfectiva = comercio.comisionCustom !== undefined 
          ? comercio.comisionCustom 
          : comercio.comision;

        return comercio;
      })
    );

    // Filtrar por búsqueda (client-side)
    let filteredComercios = comercios;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredComercios = comercios.filter(c => 
        c.nombre?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      comercios: filteredComercios,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error listando comercios:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/comercios/:id
 * Obtener detalle de comercio
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const comercioDoc = await db.collection('comercios').doc(id).get();
    if (!comercioDoc.exists) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    const comercio = { id: comercioDoc.id, ...comercioDoc.data() };

    // Agregar información de límites efectivos
    comercio.limiteEventosEfectivo = comercio.limiteEventosCustom !== undefined 
      ? comercio.limiteEventosCustom 
      : comercio.limiteEventos;

    comercio.limiteDestacadosEfectivo = comercio.limiteDestacadosCustom !== undefined 
      ? comercio.limiteDestacadosCustom 
      : comercio.limiteDestacados || 0;

    comercio.limiteUsuariosEfectivo = comercio.limiteUsuariosCustom !== undefined 
      ? comercio.limiteUsuariosCustom 
      : comercio.limiteUsuarios || 1;

    comercio.comisionEfectiva = comercio.comisionCustom !== undefined 
      ? comercio.comisionCustom 
      : comercio.comision;

    res.json(comercio);
  } catch (error) {
    console.error('Error obteniendo comercio:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/comercios/:id/estadisticas
 * Obtener estadísticas del comercio
 */
router.get('/:id/estadisticas', async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin } = req.query;

    const comercioDoc = await db.collection('comercios').doc(id).get();
    if (!comercioDoc.exists) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    // Calcular rango de fechas (por defecto últimos 30 días)
    const now = new Date();
    const start = fechaInicio ? new Date(fechaInicio) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = fechaFin ? new Date(fechaFin) : now;

    // Obtener eventos del comercio
    const eventosSnapshot = await db.collection('eventos')
      .where('comercioId', '==', id)
      .get();
    
    const totalEventos = eventosSnapshot.size;
    const eventosActivos = eventosSnapshot.docs.filter(doc => doc.data().status === 'activo').length;

    // Obtener compras del período
    const comprasSnapshot = await db.collection('compras')
      .where('comercioId', '==', id)
      .where('status', '==', 'completada')
      .where('fechaCompra', '>=', start)
      .where('fechaCompra', '<=', end)
      .get();

    let ingresosBrutos = 0;
    let totalBoletos = 0;

    comprasSnapshot.forEach(doc => {
      const compra = doc.data();
      ingresosBrutos += compra.total || 0;
      totalBoletos += compra.cantidadBoletos || 0;
    });

    // Calcular comisiones
    const comercio = comercioDoc.data();
    const comisionPorcentaje = comercio.comisionCustom !== undefined 
      ? comercio.comisionCustom 
      : comercio.comision || 10;
    const comisionesGeneradas = (ingresosBrutos * comisionPorcentaje) / 100;

    res.json({
      totalEventos,
      eventosActivos,
      boletosVendidos: totalBoletos,
      ingresosBrutos: Math.round(ingresosBrutos * 100) / 100,
      comisionesGeneradas: Math.round(comisionesGeneradas * 100) / 100,
      comisionPorcentaje,
      periodo: {
        inicio: start,
        fin: end
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/comercios/:id/eventos
 * Obtener eventos del comercio
 */
router.get('/:id/eventos', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit = 25, offset = 0 } = req.query;

    let query = db.collection('eventos').where('comercioId', '==', id);

    if (status) {
      query = query.where('status', '==', status);
    }

    // Contar total
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    // Aplicar paginación
    query = query.orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    const snapshot = await query.get();

    const eventos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      eventos,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error obteniendo eventos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/comercios/:id
 * Actualizar información básica del comercio
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, direccion, ciudad, pais, website } = req.body;

    const comercioRef = db.collection('comercios').doc(id);
    const comercioDoc = await comercioRef.get();
    
    if (!comercioDoc.exists) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    const datosAnteriores = comercioDoc.data();
    
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Solo actualizar campos proporcionados
    if (nombre !== undefined) updateData.nombre = nombre;
    if (email !== undefined) updateData.email = email;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (direccion !== undefined) updateData.direccion = direccion;
    if (ciudad !== undefined) updateData.ciudad = ciudad;
    if (pais !== undefined) updateData.pais = pais;
    if (website !== undefined) updateData.website = website;

    await comercioRef.update(updateData);

    // Log de auditoría
    await logAdminAction({
      adminId: req.admin.uid,
      adminEmail: req.admin.email,
      adminRole: req.admin.role,
      accion: 'actualizar_comercio',
      entidad: 'comercio',
      entidadId: id,
      datosAnteriores: { nombre: datosAnteriores.nombre, email: datosAnteriores.email },
      datosNuevos: updateData,
      motivo: 'Actualización de información básica'
    });

    res.json({ 
      message: 'Comercio actualizado exitosamente',
      id,
      ...updateData
    });
  } catch (error) {
    console.error('Error actualizando comercio:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/admin/comercios/:id/estado
 * Activar/Desactivar/Suspender comercio
 */
router.patch('/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, motivo } = req.body;

    if (!['activo', 'inactivo', 'suspendido'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido. Valores permitidos: activo, inactivo, suspendido' });
    }

    const comercioRef = db.collection('comercios').doc(id);
    const comercioDoc = await comercioRef.get();
    
    if (!comercioDoc.exists) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    const datosAnteriores = comercioDoc.data();
    
    // Validación: no desactivar si tiene eventos activos próximos (24h)
    if (status === 'inactivo' || status === 'suspendido') {
      const now = new Date();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const eventosSnapshot = await db.collection('eventos')
        .where('comercioId', '==', id)
        .where('status', '==', 'activo')
        .get();

      for (const eventoDoc of eventosSnapshot.docs) {
        const fechasSnapshot = await db.collection('fechasEvento')
          .where('eventoId', '==', eventoDoc.id)
          .where('status', '==', 'activa')
          .get();

        for (const fechaDoc of fechasSnapshot.docs) {
          const fecha = fechaDoc.data();
          const fechaEvento = new Date(fecha.fecha);
          
          if (fechaEvento <= next24h && fechaEvento >= now) {
            return res.status(400).json({
              error: 'No se puede desactivar el comercio. Tiene eventos activos en las próximas 24 horas.'
            });
          }
        }
      }
    }

    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (status === 'suspendido') {
      updateData.fechaSuspension = admin.firestore.FieldValue.serverTimestamp();
      updateData.motivoSuspension = motivo || 'Sin motivo especificado';
    }

    await comercioRef.update(updateData);

    // Log de auditoría
    await logAdminAction({
      adminId: req.admin.uid,
      adminEmail: req.admin.email,
      adminRole: req.admin.role,
      accion: `cambiar_estado_${status}`,
      entidad: 'comercio',
      entidadId: id,
      datosAnteriores: { status: datosAnteriores.status },
      datosNuevos: { status },
      motivo
    });

    res.json({ 
      message: `Estado actualizado a ${status}`,
      status,
      comercio: datosAnteriores.nombre
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/comercios/:id/plan
 * Configurar plan y límites custom (ENDPOINT CRÍTICO)
 */
router.put('/:id/plan', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      tipoPlan,
      limiteEventosCustom,
      limiteDestacadosCustom,
      limiteUsuariosCustom,
      comisionCustom,
      motivo 
    } = req.body;

    if (!motivo || motivo.trim() === '') {
      return res.status(400).json({ error: 'El motivo del cambio es obligatorio' });
    }

    const comercioRef = db.collection('comercios').doc(id);
    const comercioDoc = await comercioRef.get();
    
    if (!comercioDoc.exists) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    const datosAnteriores = comercioDoc.data();
    
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Actualizar plan base si se proporciona
    if (tipoPlan) {
      if (!['free', 'basic', 'pro', 'enterprise'].includes(tipoPlan)) {
        return res.status(400).json({ error: 'Plan inválido' });
      }
      updateData.tipoPlan = tipoPlan;
    }

    // Aplicar límites custom si se proporcionan (null para remover custom)
    if (limiteEventosCustom !== undefined) {
      if (limiteEventosCustom === null) {
        updateData.limiteEventosCustom = admin.firestore.FieldValue.delete();
      } else {
        // Validación: no reducir límite si ya tiene más eventos activos
        const eventosActivos = await db.collection('eventos')
          .where('comercioId', '==', id)
          .where('status', '==', 'activo')
          .get();
        
        if (limiteEventosCustom !== -1 && eventosActivos.size > limiteEventosCustom) {
          return res.status(400).json({
            error: `El comercio ya tiene ${eventosActivos.size} eventos activos. No se puede reducir el límite a ${limiteEventosCustom}.`
          });
        }
        updateData.limiteEventosCustom = limiteEventosCustom;
      }
    }

    if (limiteDestacadosCustom !== undefined) {
      if (limiteDestacadosCustom === null) {
        updateData.limiteDestacadosCustom = admin.firestore.FieldValue.delete();
      } else {
        updateData.limiteDestacadosCustom = limiteDestacadosCustom;
      }
    }

    if (limiteUsuariosCustom !== undefined) {
      if (limiteUsuariosCustom === null) {
        updateData.limiteUsuariosCustom = admin.firestore.FieldValue.delete();
      } else {
        updateData.limiteUsuariosCustom = limiteUsuariosCustom;
      }
    }

    if (comisionCustom !== undefined) {
      if (comisionCustom === null) {
        updateData.comisionCustom = admin.firestore.FieldValue.delete();
      } else {
        // Validación: 0% - 15%
        if (comisionCustom < 0 || comisionCustom > 15) {
          return res.status(400).json({
            error: 'La comisión debe estar entre 0% y 15%'
          });
        }
        updateData.comisionCustom = comisionCustom;
      }
    }

    await comercioRef.update(updateData);

    // Log de auditoría detallado
    await logAdminAction({
      adminId: req.admin.uid,
      adminEmail: req.admin.email,
      adminRole: req.admin.role,
      accion: 'configurar_plan_custom',
      entidad: 'comercio',
      entidadId: id,
      datosAnteriores: {
        tipoPlan: datosAnteriores.tipoPlan,
        limiteEventosCustom: datosAnteriores.limiteEventosCustom,
        limiteDestacadosCustom: datosAnteriores.limiteDestacadosCustom,
        limiteUsuariosCustom: datosAnteriores.limiteUsuariosCustom,
        comisionCustom: datosAnteriores.comisionCustom
      },
      datosNuevos: {
        tipoPlan: updateData.tipoPlan || datosAnteriores.tipoPlan,
        limiteEventosCustom,
        limiteDestacadosCustom,
        limiteUsuariosCustom,
        comisionCustom
      },
      motivo
    });

    res.json({ 
      message: 'Plan configurado exitosamente', 
      comercio: {
        id,
        nombre: datosAnteriores.nombre,
        ...updateData
      }
    });
  } catch (error) {
    console.error('Error configurando plan:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
