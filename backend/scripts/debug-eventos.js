require('dotenv').config();
const { db, initializeFirebase } = require('../src/config/firebase');

initializeFirebase();

async function debug() {
  console.log('🐛 Debug de eventos y categorías...\n');
  
  try {
    // Buscar eventos de deportes extremos
    const deportes = await db.collection('eventos')
      .where('nombre', '==', 'Red Bull BMX Masters Colombia')
      .limit(1)
      .get();
    
    if (deportes.empty) {
      console.log('❌ Evento Red Bull BMX no encontrado');
      return;
    }
    
    const eventoId = deportes.docs[0].id;
    console.log(`✅ Evento encontrado: ${eventoId}`);
    console.log(`   Datos:`, deportes.docs[0].data());
    
    // Buscar relaciones
    console.log('\n🔗 Buscando relaciones eventos_categorias...');
    const relaciones = await db.collection('eventos_categorias')
      .where('eventoId', '==', eventoId)
      .get();
    
    console.log(`   Relaciones encontradas: ${relaciones.size}`);
    
    relaciones.forEach(doc => {
      console.log(`   - ID: ${doc.id}`);
      console.log(`     Data:`, doc.data());
    });
    
    // Buscar categoría deportes-extremos
    console.log('\n🎯 Buscando categoría deportes-extremos...');
    const categoria = await db.collection('categorias')
      .where('slug', '==', 'deportes-extremos')
      .limit(1)
      .get();
    
    if (!categoria.empty) {
      const catId = categoria.docs[0].id;
      console.log(`   ✅ Categoría encontrada: ${catId}`);
      
      // Buscar todas las relaciones de esta categoría
      console.log('\n🔍 Todos los eventos de esta categoría:');
      const todasRel = await db.collection('eventos_categorias')
        .where('categoriaId', '==', catId)
        .get();
      
      console.log(`   Total relaciones: ${todasRel.size}`);
      
      for (const doc of todasRel.docs) {
        const rel = doc.data();
        const ev = await db.collection('eventos').doc(rel.eventoId).get();
        if (ev.exists) {
          console.log(`   - ${ev.data().nombre}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

debug()
  .then(() => {
    console.log('\n✅ Debug completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
