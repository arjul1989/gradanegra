require('dotenv').config();
const { db, initializeFirebase } = require('../src/config/firebase');

initializeFirebase();

async function checkEvents() {
  console.log('🔍 Verificando eventos por categoría...\n');
  
  try {
    // Obtener categorías
    const categoriasSnapshot = await db.collection('categorias')
      .where('deletedAt', '==', null)
      .get();
    
    const categorias = {};
    categoriasSnapshot.forEach(doc => {
      const data = doc.data();
      categorias[data.slug] = doc.id;
    });
    
    // Verificar Electrónica Oscuridad
    console.log('📀 Electrónica Oscuridad:');
    const electronicaId = categorias['electronica-oscuridad'];
    const electronicaRel = await db.collection('eventos_categorias')
      .where('categoriaId', '==', electronicaId)
      .where('deletedAt', '==', null)
      .get();
    
    console.log(`   Relaciones: ${electronicaRel.size}`);
    
    for (const doc of electronicaRel.docs) {
      const rel = doc.data();
      const eventoDoc = await db.collection('eventos').doc(rel.eventoId).get();
      if (eventoDoc.exists) {
        const evento = eventoDoc.data();
        console.log(`   - ${evento.nombre}`);
      }
    }
    
    // Verificar Deportes Extremos
    console.log('\n🏂 Deportes Extremos:');
    const deportesId = categorias['deportes-extremos'];
    const deportesRel = await db.collection('eventos_categorias')
      .where('categoriaId', '==', deportesId)
      .where('deletedAt', '==', null)
      .get();
    
    console.log(`   Relaciones: ${deportesRel.size}`);
    
    for (const doc of deportesRel.docs) {
      const rel = doc.data();
      const eventoDoc = await db.collection('eventos').doc(rel.eventoId).get();
      if (eventoDoc.exists) {
        const evento = eventoDoc.data();
        console.log(`   - ${evento.nombre}`);
      }
    }
    
    // Verificar Rock Underground
    console.log('\n🎸 Rock Underground:');
    const rockId = categorias['rock-underground'];
    const rockRel = await db.collection('eventos_categorias')
      .where('categoriaId', '==', rockId)
      .where('deletedAt', '==', null)
      .get();
    
    console.log(`   Relaciones: ${rockRel.size}`);
    
    for (const doc of rockRel.docs) {
      const rel = doc.data();
      const eventoDoc = await db.collection('eventos').doc(rel.eventoId).get();
      if (eventoDoc.exists) {
        const evento = eventoDoc.data();
        console.log(`   - ${evento.nombre}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkEvents()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
