const express = require('express');
const router = express.Router();
const { Comercio } = require('../models/Comercio');
const { db } = require('../config/firebase');

/**
 * GET /api/comercios/:id
 * Obtener comercio por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const comercio = await Comercio.findById(req.params.id);
    
    if (!comercio) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    res.json(comercio.toJSON());
  } catch (error) {
    console.error('Error al obtener comercio:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/comercios/by-user/:userId
 * Obtener comercio asociado a un usuario de Firebase
 */
router.get('/by-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Buscar comercio por ownerId directamente en la colección de comercios
    const comerciosRef = await db.collection('comercios')
      .where('ownerId', '==', userId)
      .limit(1)
      .get();

    if (comerciosRef.empty) {
      // Intentar buscar en la colección usuarios_comercios (fallback)
      const userComercioRef = await db.collection('usuarios_comercios')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (userComercioRef.empty) {
        return res.status(404).json({ error: 'Usuario no tiene comercio asociado' });
      }

      const userComercio = userComercioRef.docs[0].data();
      const comercio = await Comercio.findById(userComercio.comercioId);

      if (!comercio) {
        return res.status(404).json({ error: 'Comercio no encontrado' });
      }

      return res.json(comercio.toJSON());
    }

    // Obtener comercio directamente
    const comercioDoc = comerciosRef.docs[0];
    const comercioData = comercioDoc.data();
    
    res.json({
      id: comercioDoc.id,
      ...comercioData
    });
  } catch (error) {
    console.error('Error al obtener comercio por usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/comercios/:id/estadisticas
 * Obtener estadísticas detalladas del comercio con datos reales
 */
router.get('/:id/estadisticas', async (req, res) => {
  try {
    const { fechaInicio, fechaFin, eventoId } = req.query;
    const comercioId = req.params.id;

    // Verificar que el comercio existe
    const comercioDoc = await db.collection('comercios').doc(comercioId).get();
    if (!comercioDoc.exists) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    const comercio = comercioDoc.data();

    // Query base para eventos del comercio
    let eventosQuery = db.collection('eventos')
      .where('comercioId', '==', comercioId);

    // Filtrar por evento específico si se proporciona
    if (eventoId) {
      eventosQuery = db.collection('eventos').where('comercioId', '==', comercioId);
    }

    const eventosSnapshot = await eventosQuery.get();
    const eventosIds = eventosSnapshot.docs.map(doc => doc.id);

    if (eventosIds.length === 0) {
      return res.json({
        totalEventosCreados: 0,
        eventosActivos: 0,
        totalBoletosVendidos: 0,
        tasaOcupacionPromedio: 0,
        ingresosBrutos: 0,
        comisionesPagadas: 0,
        ingresosNetos: 0,
        ventasPorMes: [],
        eventosPorVentas: [],
        ventasPorTier: [],
        ocupacionPorEvento: []
      });
    }

    // 1. Total de eventos y eventos activos
    const totalEventosCreados = eventosSnapshot.size;
    const eventosActivos = eventosSnapshot.docs.filter(
      doc => doc.data().status === 'activo'
    ).length;

    // 2. Obtener fechas de eventos
    const fechasPromises = eventosIds.map(eventoId =>
      db.collection('fechasEvento')
        .where('eventoId', '==', eventoId)
        .get()
    );
    const fechasResults = await Promise.all(fechasPromises);
    const todasLasFechas = fechasResults.flatMap(snapshot => 
      snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    );

    const fechasIds = todasLasFechas.map(f => f.id);

    // 3. Obtener tiers
    const tiersMap = {};
    const tiersByFechaMap = {};
    
    if (fechasIds.length > 0) {
      const chunkSize = 10;
      for (let i = 0; i < fechasIds.length; i += chunkSize) {
        const chunk = fechasIds.slice(i, i + chunkSize);
        const tiersSnapshot = await db.collection('tiers')
          .where('fechaEventoId', 'in', chunk)
          .get();

        tiersSnapshot.docs.forEach(doc => {
          const tierData = { id: doc.id, ...doc.data() };
          tiersMap[doc.id] = tierData;
          
          if (!tiersByFechaMap[tierData.fechaEventoId]) {
            tiersByFechaMap[tierData.fechaEventoId] = [];
          }
          tiersByFechaMap[tierData.fechaEventoId].push(tierData);
        });
      }
    }

    const tiersIds = Object.keys(tiersMap);

    // 4. Obtener boletos vendidos
    let totalBoletosVendidos = 0;
    let ingresosBrutos = 0;
    const ventasPorMesMap = {};
    const ventasPorTierMap = {};
    const eventoVentasMap = {};

    if (tiersIds.length > 0) {
      const chunkSize = 10;
      for (let i = 0; i < tiersIds.length; i += chunkSize) {
        const chunk = tiersIds.slice(i, i + chunkSize);
        
        let boletosQuery = db.collection('boletos')
          .where('tierId', 'in', chunk)
          .where('status', 'in', ['vendido', 'usado']);

        const boletosSnapshot = await boletosQuery.get();

        boletosSnapshot.docs.forEach(doc => {
          const boleto = doc.data();
          const tier = tiersMap[boleto.tierId];
          
          if (!tier) return;

          // Filtrar por fechas si se proporcionan
          if (fechaInicio || fechaFin) {
            const fechaVenta = boleto.createdAt?._seconds 
              ? new Date(boleto.createdAt._seconds * 1000) 
              : new Date();
            
            if (fechaInicio && fechaVenta < new Date(fechaInicio)) return;
            if (fechaFin && fechaVenta > new Date(fechaFin + 'T23:59:59')) return;
          }

          totalBoletosVendidos++;
          ingresosBrutos += boleto.precio || 0;

          // Ventas por mes
          const fecha = boleto.createdAt?._seconds 
            ? new Date(boleto.createdAt._seconds * 1000) 
            : new Date();
          const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
          const mesNombre = fecha.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' });
          
          if (!ventasPorMesMap[mesKey]) {
            ventasPorMesMap[mesKey] = { mes: mesNombre, ventas: 0, ingresos: 0 };
          }
          ventasPorMesMap[mesKey].ventas++;
          ventasPorMesMap[mesKey].ingresos += boleto.precio || 0;

          // Ventas por tier
          if (!ventasPorTierMap[tier.nombre]) {
            ventasPorTierMap[tier.nombre] = 0;
          }
          ventasPorTierMap[tier.nombre]++;

          // Ventas por evento
          const fecha_evento = todasLasFechas.find(f => f.id === tier.fechaEventoId);
          if (fecha_evento) {
            if (!eventoVentasMap[fecha_evento.eventoId]) {
              eventoVentasMap[fecha_evento.eventoId] = {
                ventas: 0,
                ingresos: 0
              };
            }
            eventoVentasMap[fecha_evento.eventoId].ventas++;
            eventoVentasMap[fecha_evento.eventoId].ingresos += boleto.precio || 0;
          }
        });
      }
    }

    // 5. Calcular comisiones e ingresos netos
    const comisionPorcentaje = comercio.comision || 10;
    const comisionesPagadas = (ingresosBrutos * comisionPorcentaje) / 100;
    const ingresosNetos = ingresosBrutos - comisionesPagadas;

    // 6. Calcular tasa de ocupación promedio
    let totalCapacidad = 0;
    let totalVendidos = 0;

    todasLasFechas.forEach(fecha => {
      totalCapacidad += fecha.aforoTotal || 0;
      totalVendidos += (fecha.aforoTotal || 0) - (fecha.aforoDisponible || 0);
    });

    const tasaOcupacionPromedio = totalCapacidad > 0 
      ? (totalVendidos / totalCapacidad) * 100 
      : 0;

    // 7. Formatear datos para gráficas
    const ventasPorMes = Object.values(ventasPorMesMap)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-12); // Últimos 12 meses

    const ventasPorTier = Object.entries(ventasPorTierMap)
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        porcentaje: totalBoletosVendidos > 0 
          ? (cantidad / totalBoletosVendidos) * 100 
          : 0
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    const eventosPorVentas = await Promise.all(
      Object.entries(eventoVentasMap)
        .sort((a, b) => b[1].ventas - a[1].ventas)
        .slice(0, 10)
        .map(async ([eventoId, data]) => {
          const eventoDoc = await db.collection('eventos').doc(eventoId).get();
          return {
            nombre: eventoDoc.exists ? eventoDoc.data().nombre : 'Evento desconocido',
            ventas: data.ventas,
            ingresos: data.ingresos
          };
        })
    );

    // 8. Ocupación por evento
    const ocupacionPorEvento = await Promise.all(
      eventosSnapshot.docs
        .slice(0, 10)
        .map(async (eventoDoc) => {
          const eventoData = eventoDoc.data();
          const fechasEvento = todasLasFechas.filter(f => f.eventoId === eventoDoc.id);
          
          let totalEvento = 0;
          let vendidosEvento = 0;

          fechasEvento.forEach(fecha => {
            totalEvento += fecha.aforoTotal || 0;
            vendidosEvento += (fecha.aforoTotal || 0) - (fecha.aforoDisponible || fecha.aforoTotal || 0);
          });

          return {
            nombre: eventoData.nombre,
            vendidos: vendidosEvento,
            total: totalEvento,
            ocupacion: totalEvento > 0 ? (vendidosEvento / totalEvento) * 100 : 0
          };
        })
    );

    res.json({
      totalEventosCreados,
      eventosActivos,
      totalBoletosVendidos,
      tasaOcupacionPromedio,
      ingresosBrutos,
      comisionesPagadas,
      ingresosNetos,
      ventasPorMes,
      eventosPorVentas,
      ventasPorTier,
      ocupacionPorEvento: ocupacionPorEvento.filter(e => e.total > 0)
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/comercios/:id/eventos
 * Obtener eventos del comercio con filtros y estadísticas
 */
router.get('/:id/eventos', async (req, res) => {
  try {
    const { status, ciudad, limit = 10, offset = 0 } = req.query;
    
    // Consulta simple sin ordenamiento para evitar índices compuestos
    let query = db.collection('eventos')
      .where('comercioId', '==', req.params.id);

    // Filtros opcionales
    if (status) {
      // Usar 'status' en lugar de 'estado' para consistencia
      query = query.where('status', '==', status);
    }

    if (ciudad) {
      query = query.where('ciudad', '==', ciudad);
    }

    const snapshot = await query.get();
    
    // Ordenar y paginar en memoria
    let allEventos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar por fecha de creación (descendente)
    allEventos.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    const total = allEventos.length;
    const paginatedEventos = allEventos.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    // Por ahora devolver eventos sin estadísticas para evitar índices compuestos
    // TODO: Crear índices en Firestore o agregar campos calculados en la colección de eventos
    const eventos = paginatedEventos.map(eventoData => ({
      ...eventoData,
      totalFechas: 0,
      totalBoletos: eventoData.entradasVendidas || 0,
      totalVentas: (eventoData.entradasVendidas || 0) * (eventoData.precio || 0)
    }));

    res.json({
      eventos,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/comercios/:id
 * Actualizar comercio
 */
router.put('/:id', async (req, res) => {
  try {
    const comercio = await Comercio.findById(req.params.id);
    
    if (!comercio) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    await comercio.update(req.body);
    res.json(comercio.toJSON());
  } catch (error) {
    console.error('Error al actualizar comercio:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/comercios
 * Crear nuevo comercio
 */
router.post('/', async (req, res) => {
  try {
    const comercio = new Comercio(req.body);
    await comercio.save();
    res.status(201).json(comercio.toJSON());
  } catch (error) {
    console.error('Error al crear comercio:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
