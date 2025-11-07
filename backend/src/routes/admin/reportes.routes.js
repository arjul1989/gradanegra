const express = require('express');
const router = express.Router();
const { db } = require('../../config/firebase');
const { verifyAdmin } = require('../../middleware/verifyAdmin');

// Aplicar middleware a todas las rutas
router.use(verifyAdmin);

/**
 * GET /api/admin/reportes/comisiones
 * Generar reporte de comisiones con filtros
 */
router.get('/comisiones', async (req, res) => {
  try {
    const { 
      fechaInicio, 
      fechaFin, 
      comercioId, 
      tipoPlan, 
      ciudad 
    } = req.query;

    // Calcular rango de fechas (por defecto último mes)
    const now = new Date();
    const start = fechaInicio ? new Date(fechaInicio) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = fechaFin ? new Date(fechaFin) : now;

    // Obtener comercios con filtros
    let comerciosQuery = db.collection('comercios');
    
    if (tipoPlan) {
      comerciosQuery = comerciosQuery.where('tipoPlan', '==', tipoPlan);
    }
    if (ciudad) {
      comerciosQuery = comerciosQuery.where('ciudad', '==', ciudad);
    }
    if (comercioId) {
      // Si se proporciona un comercioId específico
      const comercioDoc = await db.collection('comercios').doc(comercioId).get();
      if (!comercioDoc.exists) {
        return res.status(404).json({ error: 'Comercio no encontrado' });
      }
    }

    const comerciosSnapshot = await comerciosQuery.get();
    const comerciosMap = {};
    comerciosSnapshot.forEach(doc => {
      comerciosMap[doc.id] = { id: doc.id, ...doc.data() };
    });

    // Si se especificó un comercioId, filtrar solo ese
    let comerciosAAnalizar = Object.values(comerciosMap);
    if (comercioId) {
      comerciosAAnalizar = comerciosAAnalizar.filter(c => c.id === comercioId);
    }

    // Obtener compras del período
    let comprasQuery = db.collection('compras')
      .where('status', '==', 'completada')
      .where('fechaCompra', '>=', start)
      .where('fechaCompra', '<=', end);

    const comprasSnapshot = await comprasQuery.get();

    // Procesar datos por comercio
    const detalles = [];
    let totalIngresosBrutos = 0;
    let totalComisiones = 0;
    let totalBoletos = 0;

    comerciosAAnalizar.forEach(comercio => {
      const comprasComercio = comprasSnapshot.docs.filter(doc => 
        doc.data().comercioId === comercio.id
      );

      if (comprasComercio.length === 0) return;

      let ingresosBrutos = 0;
      let cantidadBoletos = 0;
      let cantidadCompras = comprasComercio.length;

      comprasComercio.forEach(doc => {
        const compra = doc.data();
        ingresosBrutos += compra.total || 0;
        cantidadBoletos += compra.cantidadBoletos || 0;
      });

      // Calcular comisión (usar custom si existe)
      const comisionPorcentaje = comercio.comisionCustom !== undefined 
        ? comercio.comisionCustom 
        : comercio.comision || 10;

      const comisionGenerada = (ingresosBrutos * comisionPorcentaje) / 100;

      totalIngresosBrutos += ingresosBrutos;
      totalComisiones += comisionGenerada;
      totalBoletos += cantidadBoletos;

      detalles.push({
        comercioId: comercio.id,
        comercioNombre: comercio.nombre,
        tipoPlan: comercio.tipoPlan,
        ciudad: comercio.ciudad,
        comisionPorcentaje: Math.round(comisionPorcentaje * 100) / 100,
        esComisionCustom: comercio.comisionCustom !== undefined,
        cantidadCompras,
        cantidadBoletos,
        ingresosBrutos: Math.round(ingresosBrutos * 100) / 100,
        comisionGenerada: Math.round(comisionGenerada * 100) / 100
      });
    });

    // Ordenar por comisión generada (descendente)
    detalles.sort((a, b) => b.comisionGenerada - a.comisionGenerada);

    // Resumen general
    const resumen = {
      totalComercios: detalles.length,
      totalCompras: comprasSnapshot.size,
      totalBoletos,
      ingresosBrutosTotales: Math.round(totalIngresosBrutos * 100) / 100,
      comisionesTotales: Math.round(totalComisiones * 100) / 100,
      comisionPromedio: detalles.length > 0 
        ? Math.round((totalComisiones / detalles.length) * 100) / 100 
        : 0,
      periodo: {
        inicio: start,
        fin: end
      }
    };

    res.json({
      resumen,
      detalles
    });
  } catch (error) {
    console.error('Error generando reporte de comisiones:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/reportes/exportar
 * Exportar reporte de comisiones (Excel/CSV/PDF)
 */
router.get('/exportar', async (req, res) => {
  try {
    const { 
      formato = 'csv', 
      fechaInicio, 
      fechaFin, 
      comercioId, 
      tipoPlan, 
      ciudad 
    } = req.query;

    if (!['csv', 'excel', 'pdf'].includes(formato)) {
      return res.status(400).json({ error: 'Formato inválido. Valores permitidos: csv, excel, pdf' });
    }

    // Calcular rango de fechas
    const now = new Date();
    const start = fechaInicio ? new Date(fechaInicio) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = fechaFin ? new Date(fechaFin) : now;

    // Obtener comercios con filtros
    let comerciosQuery = db.collection('comercios');
    
    if (tipoPlan) {
      comerciosQuery = comerciosQuery.where('tipoPlan', '==', tipoPlan);
    }
    if (ciudad) {
      comerciosQuery = comerciosQuery.where('ciudad', '==', ciudad);
    }

    const comerciosSnapshot = await comerciosQuery.get();
    const comerciosMap = {};
    comerciosSnapshot.forEach(doc => {
      comerciosMap[doc.id] = { id: doc.id, ...doc.data() };
    });

    let comerciosAAnalizar = Object.values(comerciosMap);
    if (comercioId) {
      comerciosAAnalizar = comerciosAAnalizar.filter(c => c.id === comercioId);
    }

    // Obtener compras del período
    let comprasQuery = db.collection('compras')
      .where('status', '==', 'completada')
      .where('fechaCompra', '>=', start)
      .where('fechaCompra', '<=', end);

    const comprasSnapshot = await comprasQuery.get();

    // Procesar datos
    const datos = [];
    let totalIngresos = 0;
    let totalComisiones = 0;

    comerciosAAnalizar.forEach(comercio => {
      const comprasComercio = comprasSnapshot.docs.filter(doc => 
        doc.data().comercioId === comercio.id
      );

      if (comprasComercio.length === 0) return;

      let ingresosBrutos = 0;
      let cantidadBoletos = 0;

      comprasComercio.forEach(doc => {
        const compra = doc.data();
        ingresosBrutos += compra.total || 0;
        cantidadBoletos += compra.cantidadBoletos || 0;
      });

      const comisionPorcentaje = comercio.comisionCustom !== undefined 
        ? comercio.comisionCustom 
        : comercio.comision || 10;

      const comisionGenerada = (ingresosBrutos * comisionPorcentaje) / 100;

      totalIngresos += ingresosBrutos;
      totalComisiones += comisionGenerada;

      datos.push({
        comercio: comercio.nombre,
        plan: comercio.tipoPlan,
        ciudad: comercio.ciudad || 'N/A',
        compras: comprasComercio.length,
        boletos: cantidadBoletos,
        ingresos: Math.round(ingresosBrutos * 100) / 100,
        comision_porcentaje: comisionPorcentaje,
        comision_generada: Math.round(comisionGenerada * 100) / 100
      });
    });

    // Agregar fila de totales
    datos.push({
      comercio: 'TOTAL',
      plan: '',
      ciudad: '',
      compras: comprasSnapshot.size,
      boletos: datos.reduce((sum, d) => sum + (d.boletos || 0), 0),
      ingresos: Math.round(totalIngresos * 100) / 100,
      comision_porcentaje: '',
      comision_generada: Math.round(totalComisiones * 100) / 100
    });

    // Generar archivo según formato
    if (formato === 'csv') {
      // CSV simple
      let csv = 'Comercio,Plan,Ciudad,Compras,Boletos,Ingresos,Comision %,Comision Generada\n';
      
      datos.forEach(row => {
        csv += `"${row.comercio}","${row.plan}","${row.ciudad}",${row.compras},${row.boletos},${row.ingresos},${row.comision_porcentaje},${row.comision_generada}\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_comisiones_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.csv"`);
      return res.send('\uFEFF' + csv); // BOM para UTF-8
    }

    if (formato === 'excel') {
      // Para Excel necesitarías una librería como exceljs
      // Por ahora retornamos JSON con instrucción
      return res.json({
        error: 'Excel export requiere instalar librería exceljs',
        datos,
        instrucciones: 'npm install exceljs y actualizar este endpoint'
      });
    }

    if (formato === 'pdf') {
      // Para PDF necesitarías una librería como pdfkit
      return res.json({
        error: 'PDF export requiere instalar librería pdfkit o puppeteer',
        datos,
        instrucciones: 'npm install pdfkit y actualizar este endpoint'
      });
    }

  } catch (error) {
    console.error('Error exportando reporte:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
