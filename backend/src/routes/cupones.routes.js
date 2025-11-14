const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * @route   POST /api/cupones
 * @desc    Crear un nuevo cupón
 * @access  Private (comercio)
 */
router.post('/', async (req, res) => {
  try {
    const {
      codigo,
      comercioId,
      tipo,
      valor,
      eventosAplicables,
      limiteUsos,
      vigenciaInicio,
      vigenciaFin,
      descripcion
    } = req.body;

    // Validaciones
    if (!codigo || !comercioId || !tipo || !valor) {
      return res.status(400).json({ 
        error: 'Campos requeridos: codigo, comercioId, tipo, valor' 
      });
    }

    if (!['porcentaje', 'monto'].includes(tipo)) {
      return res.status(400).json({ 
        error: 'Tipo debe ser "porcentaje" o "monto"' 
      });
    }

    if (tipo === 'porcentaje' && (valor < 1 || valor > 100)) {
      return res.status(400).json({ 
        error: 'El porcentaje debe estar entre 1 y 100' 
      });
    }

    if (tipo === 'monto' && valor < 1000) {
      return res.status(400).json({ 
        error: 'El monto mínimo debe ser 1000 COP' 
      });
    }

    // Verificar que el código no exista para este comercio
    const codigoUpperCase = codigo.toUpperCase().trim();
    const existingSnapshot = await db.collection('cupones')
      .where('comercioId', '==', comercioId)
      .where('codigo', '==', codigoUpperCase)
      .where('status', '!=', 'eliminado')
      .get();

    if (!existingSnapshot.empty) {
      return res.status(400).json({ 
        error: 'Ya existe un cupón con este código' 
      });
    }

    // Crear cupón
    const cuponData = {
      codigo: codigoUpperCase,
      comercioId,
      tipo,
      valor: parseFloat(valor),
      eventosAplicables: eventosAplicables || [], // [] = todos los eventos
      limiteUsos: parseInt(limiteUsos) || 0, // 0 = ilimitado
      usosActuales: 0,
      vigenciaInicio: vigenciaInicio ? new Date(vigenciaInicio) : null,
      vigenciaFin: vigenciaFin ? new Date(vigenciaFin) : null,
      descripcion: descripcion || '',
      status: 'activo',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const cuponRef = await db.collection('cupones').add(cuponData);

    res.status(201).json({
      id: cuponRef.id,
      ...cuponData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

  } catch (error) {
    console.error('Error al crear cupón:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/cupones/comercio/:comercioId
 * @desc    Obtener todos los cupones de un comercio
 * @access  Private (comercio)
 */
router.get('/comercio/:comercioId', async (req, res) => {
  try {
    const { comercioId } = req.params;
    const { status, activos } = req.query;

    // Query simple solo por comercioId (no requiere índice compuesto)
    let query = db.collection('cupones')
      .where('comercioId', '==', comercioId);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.json([]);
    }

    const cupones = [];
    const now = new Date();

    snapshot.forEach(doc => {
      const cupon = { id: doc.id, ...doc.data() };
      
      // Filtrar eliminados en el código
      if (cupon.status === 'eliminado') {
        return;
      }

      // Auto-expirar cupones si es necesario
      if (cupon.vigenciaFin) {
        const vigenciaFin = cupon.vigenciaFin.toDate ? cupon.vigenciaFin.toDate() : new Date(cupon.vigenciaFin);
        if (vigenciaFin < now && cupon.status === 'activo') {
          doc.ref.update({ status: 'expirado' });
          cupon.status = 'expirado';
        }
      }

      // Filtrar por status si se especificó
      if (status && cupon.status !== status) {
        return;
      }

      // Filtrar solo activos si se solicitó
      if (activos === 'true') {
        if (cupon.status === 'activo') {
          cupones.push(cupon);
        }
      } else {
        cupones.push(cupon);
      }
    });

    // Ordenar en memoria por fecha de creación (más reciente primero)
    cupones.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    });

    res.json(cupones);

  } catch (error) {
    console.error('Error al obtener cupones:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/cupones/:id
 * @desc    Obtener un cupón específico
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection('cupones').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    res.json({ id: doc.id, ...doc.data() });

  } catch (error) {
    console.error('Error al obtener cupón:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/cupones/validar
 * @desc    Validar un código de cupón para el checkout
 * @access  Public
 */
router.post('/validar', async (req, res) => {
  try {
    const { codigo, comercioId, eventoId, subtotal } = req.body;

    if (!codigo || !comercioId) {
      return res.status(400).json({ 
        error: 'Código y comercioId requeridos' 
      });
    }

    // Buscar cupón
    const codigoUpperCase = codigo.toUpperCase().trim();
    const snapshot = await db.collection('cupones')
      .where('comercioId', '==', comercioId)
      .where('codigo', '==', codigoUpperCase)
      .where('status', '==', 'activo')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ 
        valid: false,
        error: 'Cupón no encontrado o inactivo' 
      });
    }

    const cuponDoc = snapshot.docs[0];
    const cupon = { id: cuponDoc.id, ...cuponDoc.data() };

    // Validaciones
    const validations = {
      valid: true,
      errors: []
    };

    // 1. Verificar vigencia
    const now = new Date();
    
    if (cupon.vigenciaInicio) {
      const vigenciaInicio = cupon.vigenciaInicio.toDate ? cupon.vigenciaInicio.toDate() : new Date(cupon.vigenciaInicio);
      if (now < vigenciaInicio) {
        validations.valid = false;
        validations.errors.push('Este cupón aún no está vigente');
      }
    }

    if (cupon.vigenciaFin) {
      const vigenciaFin = cupon.vigenciaFin.toDate ? cupon.vigenciaFin.toDate() : new Date(cupon.vigenciaFin);
      if (now > vigenciaFin) {
        validations.valid = false;
        validations.errors.push('Este cupón ha expirado');
        // Auto-expirar
        await cuponDoc.ref.update({ status: 'expirado' });
      }
    }

    // 2. Verificar límite de usos
    if (cupon.limiteUsos > 0 && cupon.usosActuales >= cupon.limiteUsos) {
      validations.valid = false;
      validations.errors.push('Este cupón alcanzó su límite de usos');
    }

    // 3. Verificar evento aplicable
    if (eventoId && cupon.eventosAplicables.length > 0) {
      if (!cupon.eventosAplicables.includes(eventoId)) {
        validations.valid = false;
        validations.errors.push('Este cupón no es válido para este evento');
      }
    }

    // Calcular descuento
    let descuento = 0;
    if (validations.valid && subtotal) {
      if (cupon.tipo === 'porcentaje') {
        descuento = Math.round(subtotal * (cupon.valor / 100));
      } else {
        descuento = Math.min(cupon.valor, subtotal);
      }
    }

    if (validations.valid) {
      res.json({
        valid: true,
        cupon: {
          id: cupon.id,
          codigo: cupon.codigo,
          tipo: cupon.tipo,
          valor: cupon.valor,
          descripcion: cupon.descripcion
        },
        descuento,
        subtotal,
        total: subtotal ? subtotal - descuento : 0
      });
    } else {
      res.status(400).json(validations);
    }

  } catch (error) {
    console.error('Error al validar cupón:', error);
    res.status(500).json({ 
      valid: false,
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/cupones/:id/aplicar
 * @desc    Aplicar cupón a una compra (registrar uso)
 * @access  Private
 */
router.post('/:id/aplicar', async (req, res) => {
  try {
    const { id } = req.params;
    const { compraId, descuentoAplicado } = req.body;

    if (!compraId || descuentoAplicado === undefined) {
      return res.status(400).json({ 
        error: 'compraId y descuentoAplicado requeridos' 
      });
    }

    const cuponDoc = await db.collection('cupones').doc(id).get();

    if (!cuponDoc.exists) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    const cupon = cuponDoc.data();

    // Verificar límite
    if (cupon.limiteUsos > 0 && cupon.usosActuales >= cupon.limiteUsos) {
      return res.status(400).json({ 
        error: 'Cupón alcanzó su límite de usos' 
      });
    }

    // Registrar uso
    await db.collection('usos_cupones').add({
      cuponId: id,
      compraId,
      descuentoAplicado: parseFloat(descuentoAplicado),
      fechaUso: admin.firestore.FieldValue.serverTimestamp()
    });

    // Incrementar contador
    await cuponDoc.ref.update({
      usosActuales: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Cupón aplicado exitosamente',
      usosActuales: cupon.usosActuales + 1,
      limiteUsos: cupon.limiteUsos
    });

  } catch (error) {
    console.error('Error al aplicar cupón:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/cupones/:id
 * @desc    Actualizar un cupón
 * @access  Private (comercio)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      descripcion,
      limiteUsos,
      vigenciaInicio,
      vigenciaFin,
      eventosAplicables,
      status
    } = req.body;

    const cuponDoc = await db.collection('cupones').doc(id).get();

    if (!cuponDoc.exists) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    // No se puede editar código, tipo o valor después de creado
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (limiteUsos !== undefined) updateData.limiteUsos = parseInt(limiteUsos);
    if (vigenciaInicio !== undefined) updateData.vigenciaInicio = new Date(vigenciaInicio);
    if (vigenciaFin !== undefined) updateData.vigenciaFin = new Date(vigenciaFin);
    if (eventosAplicables !== undefined) updateData.eventosAplicables = eventosAplicables;
    if (status !== undefined) updateData.status = status;

    await cuponDoc.ref.update(updateData);

    res.json({
      success: true,
      message: 'Cupón actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar cupón:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/cupones/:id
 * @desc    Desactivar/eliminar un cupón
 * @access  Private (comercio)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const cuponDoc = await db.collection('cupones').doc(id).get();

    if (!cuponDoc.exists) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    // Soft delete
    await cuponDoc.ref.update({
      status: 'eliminado',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Cupón eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar cupón:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/cupones/:id/estadisticas
 * @desc    Obtener estadísticas de uso de un cupón
 * @access  Private (comercio)
 */
router.get('/:id/estadisticas', async (req, res) => {
  try {
    const { id } = req.params;

    const cuponDoc = await db.collection('cupones').doc(id).get();

    if (!cuponDoc.exists) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    const cupon = cuponDoc.data();

    // Obtener usos
    const usosSnapshot = await db.collection('usos_cupones')
      .where('cuponId', '==', id)
      .get();

    const usos = [];
    let totalDescuentos = 0;

    usosSnapshot.forEach(doc => {
      const uso = { id: doc.id, ...doc.data() };
      usos.push(uso);
      totalDescuentos += uso.descuentoAplicado;
    });

    res.json({
      cupon: {
        codigo: cupon.codigo,
        tipo: cupon.tipo,
        valor: cupon.valor,
        status: cupon.status
      },
      usosActuales: cupon.usosActuales,
      limiteUsos: cupon.limiteUsos,
      totalDescuentos,
      usos: usos.sort((a, b) => {
        const aTime = a.fechaUso?.toDate ? a.fechaUso.toDate() : new Date(0);
        const bTime = b.fechaUso?.toDate ? b.fechaUso.toDate() : new Date(0);
        return bTime - aTime;
      })
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
