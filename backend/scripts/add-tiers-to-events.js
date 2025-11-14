const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('../firebase-credentials.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function addTiersToEvents() {
  console.log('🔧 Actualizando eventos para agregar tiers...\n');

  try {
    // Obtener todos los eventos activos
    const eventsSnapshot = await db.collection('eventos')
      .where('status', '==', 'activo')
      .get();

    if (eventsSnapshot.empty) {
      console.log('❌ No se encontraron eventos activos');
      return;
    }

    console.log(`📅 Encontrados ${eventsSnapshot.size} eventos activos\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const doc of eventsSnapshot.docs) {
      const evento = doc.data();
      const eventoId = doc.id;

      // Si ya tiene tiers, omitir
      if (evento.tiers && Array.isArray(evento.tiers) && evento.tiers.length > 0) {
        console.log(`⏭️  ${evento.nombre} - Ya tiene tiers`);
        skippedCount++;
        continue;
      }

      // Obtener precio base
      const precioBase = evento.precio || evento.precioBase || 50000;
      const precioGeneral = precioBase;
      const precioVip = Math.round(precioBase * 2.5);

      // Crear tiers
      const tiers = [
        {
          id: uuidv4(),
          nombre: 'General',
          descripcion: 'Acceso general al evento',
          precio: precioGeneral,
          capacidad: Math.floor((evento.capacidad || 100) * 0.7), // 70% capacidad
          vendidos: 0,
          disponible: true
        },
        {
          id: uuidv4(),
          nombre: 'VIP',
          descripcion: 'Acceso VIP con beneficios exclusivos',
          precio: precioVip,
          capacidad: Math.floor((evento.capacidad || 100) * 0.3), // 30% capacidad
          vendidos: 0,
          disponible: true
        }
      ];

      // Actualizar evento
      await db.collection('eventos').doc(eventoId).update({
        tiers: tiers,
        precioBase: precioGeneral,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ ${evento.nombre}`);
      console.log(`   General: $${precioGeneral.toLocaleString('es-CO')}`);
      console.log(`   VIP: $${precioVip.toLocaleString('es-CO')}\n`);

      updatedCount++;
    }

    console.log('🎉 ¡Actualización completada!');
    console.log(`📊 Eventos actualizados: ${updatedCount}`);
    console.log(`⏭️  Eventos omitidos (ya tenían tiers): ${skippedCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

addTiersToEvents().catch(console.error);

