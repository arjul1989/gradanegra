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

// Mapeo de categorías antiguas a slugs de categorías
const categoryMapping = {
  'rock-underground': 'rock-underground',
  'salsa-tropical': 'salsa-tropical',
  'electronica-oscuridad': 'electronica-oscuridad',
  'reggaeton-urbano': 'reggaeton-urbano',
  'arte-cultura': 'arte-cultura',
  'deportes': 'deportes',
  'comedia-stand-up': 'comedia',
  'comedia': 'comedia'
};

async function fixEventCategories() {
  console.log('🔧 Corrigiendo relaciones eventos-categorías...\n');

  try {
    // 1. Obtener todas las categorías
    const categoriasSnapshot = await db.collection('categorias').get();
    const categorias = {};
    categoriasSnapshot.forEach(doc => {
      categorias[doc.data().slug] = doc.id;
    });

    console.log('📋 Categorías encontradas:', Object.keys(categorias));

    // 2. Obtener todos los eventos
    const eventosSnapshot = await db.collection('eventos')
      .where('status', '==', 'activo')
      .get();

    console.log(`\n📅 Eventos a procesar: ${eventosSnapshot.size}\n`);

    let processed = 0;
    let skipped = 0;

    for (const eventoDoc of eventosSnapshot.docs) {
      const evento = eventoDoc.data();
      const eventoId = eventoDoc.id;
      
      // Verificar si el evento tiene categoría
      if (!evento.categoria) {
        console.log(`⚠️  Evento sin categoría: ${evento.nombre}`);
        skipped++;
        continue;
      }

      // Obtener el slug de la categoría
      const categoriaSlug = categoryMapping[evento.categoria] || evento.categoria;
      const categoriaId = categorias[categoriaSlug];

      if (!categoriaId) {
        console.log(`⚠️  Categoría no encontrada para: ${evento.categoria} (${evento.nombre})`);
        skipped++;
        continue;
      }

      // Verificar si ya existe la relación
      const relacionSnapshot = await db.collection('eventos_categorias')
        .where('eventoId', '==', eventoId)
        .where('categoriaId', '==', categoriaId)
        .get();

      if (!relacionSnapshot.empty) {
        // Ya existe, saltar
        continue;
      }

      // Crear la relación
      const relacionId = uuidv4();
      await db.collection('eventos_categorias').doc(relacionId).set({
        id: relacionId,
        eventoId: eventoId,
        categoriaId: categoriaId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ ${evento.nombre} → ${categoriaSlug}`);
      processed++;
    }

    console.log('\n🎉 ¡Relaciones creadas exitosamente!');
    console.log(`📊 Procesados: ${processed}`);
    console.log(`⏭️  Omitidos: ${skipped}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

fixEventCategories();

