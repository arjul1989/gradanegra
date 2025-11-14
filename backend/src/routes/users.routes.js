const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const admin = require('firebase-admin');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route   GET /api/users/:uid
 * @desc    Obtener información del usuario
 * @access  Private (el mismo usuario)
 */
router.get('/:uid', authMiddleware, async (req, res) => {
  try {
    const { uid } = req.params;
    
    // Verificar que el usuario solo puede acceder a su propia información
    if (req.user.uid !== uid) {
      return res.status(403).json({ 
        error: 'No tienes permisos para acceder a esta información' 
      });
    }

    // Obtener usuario de Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      // Si no existe en Firestore, obtener de Firebase Auth
      try {
        const authUser = await admin.auth().getUser(uid);
        
        // Crear documento básico en Firestore
        const newUser = {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName || '',
          photoURL: authUser.photoURL || '',
          phoneNumber: authUser.phoneNumber || '',
          cedula: '',
          fechaNacimiento: '',
          genero: '',
          ciudad: '',
          pais: 'Colombia',
          notificacionesEmail: true,
          notificacionesSMS: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(uid).set(newUser);
        
        return res.json(newUser);
      } catch (authError) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
    }

    res.json({ uid: userDoc.id, ...userDoc.data() });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/users/:uid
 * @desc    Actualizar información del usuario
 * @access  Private (el mismo usuario)
 */
router.put('/:uid', authMiddleware, async (req, res) => {
  try {
    const { uid } = req.params;
    
    // Verificar que el usuario solo puede actualizar su propia información
    if (req.user.uid !== uid) {
      return res.status(403).json({ 
        error: 'No tienes permisos para actualizar esta información' 
      });
    }
    
    const {
      displayName,
      phoneNumber,
      cedula,
      fechaNacimiento,
      genero,
      ciudad,
      pais,
      notificacionesEmail,
      notificacionesSMS
    } = req.body;

    // Verificar que el usuario existe
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Preparar datos a actualizar
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (cedula !== undefined) updateData.cedula = cedula;
    if (fechaNacimiento !== undefined) updateData.fechaNacimiento = fechaNacimiento;
    if (genero !== undefined) updateData.genero = genero;
    if (ciudad !== undefined) updateData.ciudad = ciudad;
    if (pais !== undefined) updateData.pais = pais;
    if (notificacionesEmail !== undefined) updateData.notificacionesEmail = notificacionesEmail;
    if (notificacionesSMS !== undefined) updateData.notificacionesSMS = notificacionesSMS;

    // Actualizar en Firestore
    await db.collection('users').doc(uid).update(updateData);

    // Actualizar displayName en Firebase Auth si cambió
    if (displayName !== undefined) {
      try {
        await admin.auth().updateUser(uid, { displayName });
      } catch (authError) {
        console.error('Error actualizando Auth:', authError);
      }
    }

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/users/:uid
 * @desc    Eliminar cuenta de usuario
 * @access  Private (el mismo usuario)
 */
router.delete('/:uid', authMiddleware, async (req, res) => {
  try {
    const { uid } = req.params;
    
    // Verificar que el usuario solo puede eliminar su propia cuenta
    if (req.user.uid !== uid) {
      return res.status(403).json({ 
        error: 'No tienes permisos para eliminar esta cuenta' 
      });
    }

    // Verificar que no tenga boletos activos próximos
    const now = new Date();
    const boletosSnapshot = await db.collection('boletos')
      .where('compraId', '!=', null)
      .get();

    let hasActiveTickets = false;
    for (const doc of boletosSnapshot.docs) {
      const boleto = doc.data();
      const compraDoc = await db.collection('compras').doc(boleto.compraId).get();
      
      if (compraDoc.exists) {
        const compra = compraDoc.data();
        if (compra.userId === uid && boleto.status === 'vendido') {
          // Verificar si el evento es futuro
          const fechaEvento = new Date(boleto.fechaEvento);
          if (fechaEvento > now) {
            hasActiveTickets = true;
            break;
          }
        }
      }
    }

    if (hasActiveTickets) {
      return res.status(400).json({ 
        error: 'No puedes eliminar tu cuenta mientras tengas boletos activos para eventos futuros' 
      });
    }

    // Soft delete en Firestore
    await db.collection('users').doc(uid).update({
      status: 'eliminado',
      eliminadoAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Opcionalmente, eliminar de Firebase Auth
    // await admin.auth().deleteUser(uid);

    res.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/users/:uid/stats
 * @desc    Obtener estadísticas del usuario
 * @access  Private (el mismo usuario)
 */
router.get('/:uid/stats', authMiddleware, async (req, res) => {
  try {
    const { uid } = req.params;
    
    // Verificar que el usuario solo puede ver sus propias estadísticas
    if (req.user.uid !== uid) {
      return res.status(403).json({ 
        error: 'No tienes permisos para acceder a esta información' 
      });
    }

    // Obtener todas las compras del usuario
    const comprasSnapshot = await db.collection('compras')
      .where('userId', '==', uid)
      .where('status', '==', 'completada')
      .get();

    const totalCompras = comprasSnapshot.size;
    let totalGastado = 0;
    let eventosAsistidos = 0;

    for (const doc of comprasSnapshot.docs) {
      const compra = doc.data();
      totalGastado += compra.total;
    }

    // Contar boletos usados (eventos asistidos)
    const boletosSnapshot = await db.collection('boletos')
      .where('status', '==', 'usado')
      .get();

    for (const doc of boletosSnapshot.docs) {
      const boleto = doc.data();
      const compraDoc = await db.collection('compras').doc(boleto.compraId).get();
      
      if (compraDoc.exists && compraDoc.data().userId === uid) {
        eventosAsistidos++;
      }
    }

    res.json({
      totalCompras,
      totalGastado,
      eventosAsistidos,
      boletosActivos: totalCompras - eventosAsistidos
    });

  } catch (error) {
    console.error('Error al obtener stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
