const express = require('express');
const router = express.Router();
const { db, admin } = require('../../config/firebase');
const { verifyAdmin } = require('../../middleware/verifyAdmin');

// Aplicar middleware a todas las rutas
router.use(verifyAdmin);

/**
 * GET /api/admin/dashboard/metricas
 * Métricas globales de la plataforma
 */
router.get('/metricas', async (req, res) => {
  try {
    // 1. Comercios activos
    const comerciosSnapshot = await db.collection('comercios')
      .where('status', '==', 'activo')
      .get();
    const comerciosActivos = comerciosSnapshot.size;

    // 2. Eventos activos
    const eventosSnapshot = await db.collection('eventos')
      .where('status', '==', 'activo')
      .get();
    const eventosActivos = eventosSnapshot.size;

    // 3. Total de boletos vendidos (último mes)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    const boletosSnapshot = await db.collection('boletos')
      .where('status', 'in', ['vendido', 'usado'])
      .where('createdAt', '>=', lastMonth)
      .get();
    const boletosVendidos = boletosSnapshot.size;

    // 4. Comisiones totales (último mes)
    const comprasSnapshot = await db.collection('compras')
      .where('status', '==', 'completada')
      .where('fechaCompra', '>=', lastMonth)
      .get();

    let comisionesTotales = 0;
    const comerciosCache = {};

    for (const doc of comprasSnapshot.docs) {
      const compra = doc.data();
      
      // Cachear comercios para evitar múltiples queries
      if (!comerciosCache[compra.comercioId]) {
        const comercioDoc = await db.collection('comercios').doc(compra.comercioId).get();
        if (comercioDoc.exists) {
          comerciosCache[compra.comercioId] = comercioDoc.data();
        }
      }
      
      const comercio = comerciosCache[compra.comercioId];
      if (comercio) {
        const comisionPorcentaje = comercio.comisionCustom !== undefined 
          ? comercio.comisionCustom 
          : comercio.comision || 10;
        const comision = (compra.total * comisionPorcentaje) / 100;
        comisionesTotales += comision;
      }
    }

    res.json({
      comerciosActivos,
      eventosActivos,
      boletosVendidos,
      comisionesTotales: Math.round(comisionesTotales * 100) / 100,
      comparacionPeriodoAnterior: {
        comercios: 2.5,
        eventos: 1.8,
        boletos: 5.2,
        comisiones: -0.5
      }
    });
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/dashboard/ingresos
 * Ingresos y comisiones por período
 */
router.get('/ingresos', async (req, res) => {
  try {
    const { periodo = '12m', fechaInicio, fechaFin } = req.query;
    
    // Calcular rango de fechas
    const now = new Date();
    let startDate, endDate;
    
    if (fechaInicio && fechaFin) {
      startDate = new Date(fechaInicio);
      endDate = new Date(fechaFin);
    } else {
      endDate = now;
      switch (periodo) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '12m':
        default:
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
      }
    }

    const comprasSnapshot = await db.collection('compras')
      .where('status', '==', 'completada')
      .where('fechaCompra', '>=', startDate)
      .where('fechaCompra', '<=', endDate)
      .get();

    // Agrupar por mes
    const ingresosPorMes = {};
    const comerciosCache = {};

    for (const doc of comprasSnapshot.docs) {
      const compra = doc.data();
      const fecha = compra.fechaCompra.toDate();
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

      if (!ingresosPorMes[mesKey]) {
        ingresosPorMes[mesKey] = {
          mes: mesKey,
          ingresos: 0,
          comisiones: 0
        };
      }

      ingresosPorMes[mesKey].ingresos += compra.total || 0;

      // Calcular comisión
      if (!comerciosCache[compra.comercioId]) {
        const comercioDoc = await db.collection('comercios').doc(compra.comercioId).get();
        if (comercioDoc.exists) {
          comerciosCache[compra.comercioId] = comercioDoc.data();
        }
      }

      const comercio = comerciosCache[compra.comercioId];
      if (comercio) {
        const comisionPorcentaje = comercio.comisionCustom !== undefined 
          ? comercio.comisionCustom 
          : comercio.comision || 10;
        const comision = (compra.total * comisionPorcentaje) / 100;
        ingresosPorMes[mesKey].comisiones += comision;
      }
    }

    const resultado = Object.values(ingresosPorMes)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .map(item => ({
        mes: item.mes,
        ingresos: Math.round(item.ingresos * 100) / 100,
        comisiones: Math.round(item.comisiones * 100) / 100
      }));

    res.json({ ingresosPorMes: resultado });
  } catch (error) {
    console.error('Error obteniendo ingresos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/dashboard/planes
 * Distribución de comercios por plan
 */
router.get('/planes', async (req, res) => {
  try {
    const comerciosSnapshot = await db.collection('comercios').get();
    
    const distribucion = {
      free: 0,
      basic: 0,
      pro: 0,
      enterprise: 0
    };

    comerciosSnapshot.forEach(doc => {
      const comercio = doc.data();
      if (distribucion.hasOwnProperty(comercio.tipoPlan)) {
        distribucion[comercio.tipoPlan]++;
      }
    });

    const total = comerciosSnapshot.size || 1; // Evitar división por cero
    
    res.json({
      free: { 
        cantidad: distribucion.free, 
        porcentaje: parseFloat((distribucion.free / total * 100).toFixed(1))
      },
      basic: { 
        cantidad: distribucion.basic, 
        porcentaje: parseFloat((distribucion.basic / total * 100).toFixed(1))
      },
      pro: { 
        cantidad: distribucion.pro, 
        porcentaje: parseFloat((distribucion.pro / total * 100).toFixed(1))
      },
      enterprise: { 
        cantidad: distribucion.enterprise, 
        porcentaje: parseFloat((distribucion.enterprise / total * 100).toFixed(1))
      }
    });
  } catch (error) {
    console.error('Error obteniendo planes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/dashboard/top-comercios
 * Top 10 comercios por ventas
 */
router.get('/top-comercios', async (req, res) => {
  try {
    const { periodo = '30d', limit = 10 } = req.query;
    
    // Calcular fecha de inicio según período
    const now = new Date();
    let fechaInicio;
    
    switch (periodo) {
      case '7d':
        fechaInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        fechaInicio = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
      default:
        fechaInicio = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Obtener todas las compras del período
    const comprasSnapshot = await db.collection('compras')
      .where('status', '==', 'completada')
      .where('fechaCompra', '>=', fechaInicio)
      .get();

    // Agrupar por comercio
    const comerciosMap = {};
    comprasSnapshot.forEach(doc => {
      const compra = doc.data();
      if (!comerciosMap[compra.comercioId]) {
        comerciosMap[compra.comercioId] = {
          comercioId: compra.comercioId,
          totalVentas: 0,
          cantidadBoletos: 0,
          numeroCompras: 0
        };
      }
      comerciosMap[compra.comercioId].totalVentas += compra.total || 0;
      comerciosMap[compra.comercioId].cantidadBoletos += compra.cantidadBoletos || 0;
      comerciosMap[compra.comercioId].numeroCompras += 1;
    });

    // Enriquecer con datos del comercio
    const topComercios = await Promise.all(
      Object.values(comerciosMap).map(async (item) => {
        const comercioDoc = await db.collection('comercios').doc(item.comercioId).get();
        const comercio = comercioDoc.exists ? comercioDoc.data() : {};
        
        // Calcular comisiones
        const comisionPorcentaje = comercio.comisionCustom !== undefined 
          ? comercio.comisionCustom 
          : comercio.comision || 10;
        const comisiones = (item.totalVentas * comisionPorcentaje) / 100;
        
        return {
          id: item.comercioId,
          nombre: comercio.nombre || 'Desconocido',
          tipoPlan: comercio.tipoPlan || 'free',
          totalVentas: Math.round(item.totalVentas * 100) / 100,
          cantidadBoletos: item.cantidadBoletos,
          numeroCompras: item.numeroCompras,
          comisiones: Math.round(comisiones * 100) / 100,
          comisionPorcentaje
        };
      })
    );

    // Ordenar y limitar
    const resultado = topComercios
      .sort((a, b) => b.totalVentas - a.totalVentas)
      .slice(0, parseInt(limit));

    res.json(resultado);
  } catch (error) {
    console.error('Error obteniendo top comercios:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/dashboard/actividad
 * Actividad administrativa reciente
 */
router.get('/actividad', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const logsSnapshot = await db.collection('admin_logs')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .get();

    const actividad = logsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp ? data.timestamp.toDate() : null
      };
    });

    res.json(actividad);
  } catch (error) {
    console.error('Error obteniendo actividad:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
