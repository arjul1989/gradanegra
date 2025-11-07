const { db, admin } = require('../config/firebase');

/**
 * Registra una acción administrativa en Firestore
 * @param {Object} params - Parámetros del log
 * @param {string} params.adminId - UID del administrador
 * @param {string} params.adminEmail - Email del administrador
 * @param {string} params.adminRole - Rol del administrador
 * @param {string} params.accion - Descripción de la acción
 * @param {string} params.entidad - Tipo de entidad afectada
 * @param {string} params.entidadId - ID de la entidad
 * @param {Object} params.datosAnteriores - Estado anterior
 * @param {Object} params.datosNuevos - Nuevo estado
 * @param {string} params.motivo - Motivo del cambio (opcional)
 */
async function logAdminAction({
  adminId,
  adminEmail,
  adminRole,
  accion,
  entidad,
  entidadId,
  datosAnteriores = {},
  datosNuevos = {},
  motivo = null
}) {
  try {
    await db.collection('admin_logs').add({
      adminId,
      adminEmail,
      adminRole,
      accion,
      entidad,
      entidadId,
      datosAnteriores,
      datosNuevos,
      motivo,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Log admin registrado: ${accion} en ${entidad} ${entidadId}`);
  } catch (error) {
    console.error('❌ Error al registrar log de admin:', error);
    // No lanzar error para no bloquear la operación principal
  }
}

module.exports = { logAdminAction };
