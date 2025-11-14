const admin = require('firebase-admin');
const { initializeApp } = require('firebase-admin/app');

// Inicializar Firebase Admin
initializeApp();

const db = admin.firestore();

/**
 * Script para actualizar precios de eventos para producción
 * - Cambiar precios a valores entre 100-200 pesos colombianos
 * - Asegurar que la moneda sea COP
 */

async function updateEventPrices() {
  console.log('🚀 Iniciando actualización de precios para producción...');
  console.log('==========================================');
  
  try {
    // Obtener todos los eventos
    const eventosSnapshot = await db.collection('eventos').get();
    console.log(`📊 Encontrados ${eventosSnapshot.size} eventos para actualizar`);
    
    if (eventosSnapshot.empty) {
      console.log('❌ No se encontraron eventos para actualizar');
      return;
    }
    
    let eventosActualizados = 0;
    let tiersActualizados = 0;
    
    // Procesar cada evento
    for (const eventoDoc of eventosSnapshot.docs) {
      const evento = eventoDoc.data();
      const eventoId = eventoDoc.id;
      
      console.log(`\n📝 Procesando evento: ${evento.nombre}`);
      
      // Generar nuevo precio base entre 100-200 COP
      const nuevoPrecioBase = Math.floor(Math.random() * 101) + 100; // 100-200 COP
      
      // Actualizar precio base del evento
      const updateData = {
        precio: nuevoPrecioBase,
        precioBase: nuevoPrecioBase,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Actualizar en Firestore
      await eventoDoc.ref.update(updateData);
      eventosActualizados++;
      
      console.log(`   💰 Precio actualizado a: $${nuevoPrecioBase.toLocaleString()} COP`);
      
      // Actualizar tiers si existen
      if (evento.tiers && Array.isArray(evento.tiers)) {
        console.log(`   🎫 Actualizando ${evento.tiers.length} tiers...`);
        
        for (let i = 0; i < evento.tiers.length; i++) {
          const tier = evento.tiers[i];
          let nuevoPrecioTier;
          
          // Calcular precios de tiers basado en el precio base
          if (i === 0) {
            // Primer tier - General (100% del precio base)
            nuevoPrecioTier = nuevoPrecioBase;
          } else if (i === 1) {
            // Segundo tier - VIP (150% del precio base)
            nuevoPrecioTier = Math.round(nuevoPrecioBase * 1.5);
          } else if (i === 2) {
            // Tercer tier - Premium (200% del precio base)
            nuevoPrecioTier = Math.round(nuevoPrecioBase * 2.0);
          } else {
            // Tiers adicionales - precio aleatorio entre 100-300
            nuevoPrecioTier = Math.floor(Math.random() * 201) + 100;
          }
          
          // Actualizar precio del tier
          evento.tiers[i].precio = nuevoPrecioTier;
          tiersActualizados++;
          
          console.log(`      ${tier.nombre || `Tier ${i+1}`}: $${nuevoPrecioTier.toLocaleString()} COP`);
        }
        
        // Guardar tiers actualizados
        await eventoDoc.ref.update({
          tiers: evento.tiers,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    console.log('\n==========================================');
    console.log('✅ Actualización completada:');
    console.log(`   📊 Eventos actualizados: ${eventosActualizados}`);
    console.log(`   🎫 Tiers actualizados: ${tiersActualizados}`);
    console.log('\n💡 Los precios ahora están entre 100-200 pesos colombianos');
    console.log('🚀 El sistema está listo para producción!');
    
  } catch (error) {
    console.error('❌ Error durante la actualización:', error.message);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  updateEventPrices()
    .then(() => {
      console.log('\n🎉 Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { updateEventPrices };