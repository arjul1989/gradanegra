const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * @route   POST /api/comercios/:id/usuarios
 * @desc    Invitar un usuario al comercio
 * @access  Private (solo admin del comercio)
 */
router.post('/:id/usuarios', async (req, res) => {
  try {
    const comercioId = req.params.id;
    const { email, rol } = req.body;

    // Validar rol
    const rolesPermitidos = ['admin', 'editor', 'viewer'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido. Debe ser: admin, editor o viewer' });
    }

    // Verificar que el comercio existe
    const comercioDoc = await db.collection('comercios').doc(comercioId).get();
    if (!comercioDoc.exists) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    const comercio = comercioDoc.data();

    // Verificar límite de usuarios según el plan (usar custom si existe)
    const limiteUsuariosBase = {
      free: 1,
      basic: 2,
      pro: 3,
      enterprise: 10
    }[comercio.tipoPlan] || 1;

    // Usar límite custom si está definido
    const limiteUsuariosEfectivo = comercio.limiteUsuariosCustom !== undefined 
      ? comercio.limiteUsuariosCustom 
      : limiteUsuariosBase;

    const usuariosSnapshot = await db.collection('usuarios_comercios')
      .where('comercioId', '==', comercioId)
      .where('status', '==', 'activo')
      .get();

    // -1 significa ilimitado
    if (limiteUsuariosEfectivo !== -1 && usuariosSnapshot.size >= limiteUsuariosEfectivo) {
      return res.status(403).json({ 
        error: `Has alcanzado el límite de ${limiteUsuariosEfectivo} usuario(s)${comercio.limiteUsuariosCustom !== undefined ? ' (configuración personalizada)' : ' para tu plan ' + comercio.tipoPlan.toUpperCase()}. Contacta con soporte para agregar más usuarios.` 
      });
    }

    // Buscar usuario por email en Firebase Auth
    let uid;
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      uid = userRecord.uid;
    } catch (error) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado. El usuario debe tener una cuenta en Grada Negra.' 
      });
    }

    // Verificar si ya existe la relación
    const existente = await db.collection('usuarios_comercios')
      .where('userId', '==', uid)
      .where('comercioId', '==', comercioId)
      .get();

    if (!existente.empty) {
      return res.status(400).json({ error: 'Este usuario ya está asociado a tu comercio' });
    }

    // Crear relación
    const nuevaRelacion = {
      userId: uid,
      comercioId,
      rol,
      status: 'activo',
      invitadoPor: req.body.invitadoPor || 'admin', // userId de quien invita
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const relacionRef = await db.collection('usuarios_comercios').add(nuevaRelacion);

    res.json({
      id: relacionRef.id,
      ...nuevaRelacion,
      email
    });

  } catch (error) {
    console.error('Error al invitar usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/comercios/:id/usuarios
 * @desc    Obtener todos los usuarios de un comercio
 * @access  Private
 */
router.get('/:id/usuarios', async (req, res) => {
  try {
    const comercioId = req.params.id;

    const usuariosSnapshot = await db.collection('usuarios_comercios')
      .where('comercioId', '==', comercioId)
      .get();

    const usuarios = await Promise.all(
      usuariosSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Obtener info del usuario de Firebase Auth
        let userInfo = { email: 'Usuario eliminado', displayName: null };
        try {
          const userRecord = await admin.auth().getUser(data.userId);
          userInfo = {
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL
          };
        } catch (error) {
          // Usuario fue eliminado de Firebase Auth
        }

        return {
          id: doc.id,
          userId: data.userId,
          rol: data.rol,
          status: data.status,
          invitadoPor: data.invitadoPor,
          createdAt: data.createdAt,
          ...userInfo
        };
      })
    );

    res.json(usuarios);

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/comercios/:id/usuarios/:userId
 * @desc    Actualizar rol de un usuario
 * @access  Private (solo admin)
 */
router.put('/:id/usuarios/:userId', async (req, res) => {
  try {
    const { id: comercioId, userId } = req.params;
    const { rol } = req.body;

    // Validar rol
    const rolesPermitidos = ['admin', 'editor', 'viewer'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // Buscar la relación
    const relacionSnapshot = await db.collection('usuarios_comercios')
      .where('userId', '==', userId)
      .where('comercioId', '==', comercioId)
      .get();

    if (relacionSnapshot.empty) {
      return res.status(404).json({ error: 'Usuario no encontrado en este comercio' });
    }

    const relacionDoc = relacionSnapshot.docs[0];

    // Verificar que no sea el último admin
    if (relacionDoc.data().rol === 'admin' && rol !== 'admin') {
      const adminsSnapshot = await db.collection('usuarios_comercios')
        .where('comercioId', '==', comercioId)
        .where('rol', '==', 'admin')
        .where('status', '==', 'activo')
        .get();

      if (adminsSnapshot.size <= 1) {
        return res.status(403).json({ 
          error: 'No puedes cambiar el rol del último administrador. Debe haber al menos un administrador activo.' 
        });
      }
    }

    // Actualizar rol
    await relacionDoc.ref.update({
      rol,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updated = await relacionDoc.ref.get();

    res.json({
      id: updated.id,
      ...updated.data()
    });

  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/comercios/:id/usuarios/:userId
 * @desc    Eliminar usuario del comercio
 * @access  Private (solo admin)
 */
router.delete('/:id/usuarios/:userId', async (req, res) => {
  try {
    const { id: comercioId, userId } = req.params;

    // Buscar la relación
    const relacionSnapshot = await db.collection('usuarios_comercios')
      .where('userId', '==', userId)
      .where('comercioId', '==', comercioId)
      .get();

    if (relacionSnapshot.empty) {
      return res.status(404).json({ error: 'Usuario no encontrado en este comercio' });
    }

    const relacionDoc = relacionSnapshot.docs[0];

    // Verificar que no sea el último admin
    if (relacionDoc.data().rol === 'admin') {
      const adminsSnapshot = await db.collection('usuarios_comercios')
        .where('comercioId', '==', comercioId)
        .where('rol', '==', 'admin')
        .where('status', '==', 'activo')
        .get();

      if (adminsSnapshot.size <= 1) {
        return res.status(403).json({ 
          error: 'No puedes eliminar el último administrador. Debe haber al menos un administrador activo.' 
        });
      }
    }

    // Marcar como inactivo (soft delete)
    await relacionDoc.ref.update({
      status: 'inactivo',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Usuario eliminado del comercio exitosamente' });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/usuarios/:userId/comercios
 * @desc    Obtener todos los comercios de un usuario
 * @access  Private
 */
router.get('/usuarios/:userId/comercios', async (req, res) => {
  try {
    const userId = req.params.userId;

    const relacionesSnapshot = await db.collection('usuarios_comercios')
      .where('userId', '==', userId)
      .where('status', '==', 'activo')
      .get();

    if (relacionesSnapshot.empty) {
      return res.json([]);
    }

    const comerciosIds = relacionesSnapshot.docs.map(doc => doc.data().comercioId);

    // Obtener info de cada comercio (chunked por límite de Firestore)
    const comercios = [];
    const chunkSize = 10;
    
    for (let i = 0; i < comerciosIds.length; i += chunkSize) {
      const chunk = comerciosIds.slice(i, i + chunkSize);
      const comerciosSnapshot = await db.collection('comercios')
        .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
        .get();

      comerciosSnapshot.docs.forEach(doc => {
        const relacion = relacionesSnapshot.docs.find(r => r.data().comercioId === doc.id);
        comercios.push({
          id: doc.id,
          ...doc.data(),
          rol: relacion?.data().rol
        });
      });
    }

    res.json(comercios);

  } catch (error) {
    console.error('Error al obtener comercios del usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
