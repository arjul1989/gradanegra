require('dotenv').config();
const admin = require('firebase-admin');
const { db, initializeFirebase } = require('../src/config/firebase');
const { v4: uuidv4 } = require('uuid');

initializeFirebase();

const eventosRelaciones = [
  // Electrónica Oscuridad
  { nombre: 'Amelie Lens Live Set', categorias: ['electronica-oscuridad'] },
  { nombre: 'Charlotte de Witte: Dark Techno', categorias: ['electronica-oscuridad'] },
  { nombre: 'Ben Klock & Marcel Dettmann', categorias: ['electronica-oscuridad'] },
  { nombre: 'Techno Underground Night', categorias: ['electronica-oscuridad'] },
  
  // Deportes Extremos
  { nombre: 'Red Bull BMX Masters Colombia', categorias: ['deportes-extremos'] },
  { nombre: 'Skateboarding Championship 2025', categorias: ['deportes-extremos'] },
  { nombre: 'Motocross Extreme Show', categorias: ['deportes-extremos'] },
];

async function fixRelaciones() {
  console.log('🔗 Creando relaciones eventos-categorías faltantes...\n');
  
  try {
    // Obtener todas las categorías
    const categoriasSnapshot = await db.collection('categorias').get();
    
    const categorias = {};
    categoriasSnapshot.forEach(doc => {
      const data = doc.data();
      if (!data.deletedAt && data.slug) {
        categorias[data.slug] = doc.id;
      }
    });
    
    console.log('Categorías encontradas:', Object.keys(categorias));
    console.log('');
    
    let created = 0;
    
    for (const item of eventosRelaciones) {
      // Buscar evento
      const eventoSnapshot = await db.collection('eventos')
        .where('nombre', '==', item.nombre)
        .limit(1)
        .get();
      
      if (eventoSnapshot.empty) {
        console.log(`⚠️  Evento no encontrado: ${item.nombre}`);
        continue;
      }
      
      const eventoId = eventoSnapshot.docs[0].id;
      
      // Verificar si ya existen relaciones
      const relacionesExistentes = await db.collection('eventos_categorias')
        .where('eventoId', '==', eventoId)
        .get();
      
      if (!relacionesExistentes.empty) {
        console.log(`ℹ️  ${item.nombre} - Ya tiene relaciones`);
        continue;
      }
      
      // Crear relaciones
      for (const catSlug of item.categorias) {
        const categoriaId = categorias[catSlug];
        
        if (!categoriaId) {
          console.log(`   ⚠️  Categoría no encontrada: ${catSlug}`);
          continue;
        }
        
        const relId = uuidv4();
        await db.collection('eventos_categorias').doc(relId).set({
          id: relId,
          eventoId: eventoId,
          categoriaId: categoriaId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          deletedAt: null
        });
        
        created++;
      }
      
      console.log(`✅ ${item.nombre} - Relaciones creadas`);
    }
    
    console.log(`\n✨ ${created} relaciones creadas`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

fixRelaciones()
  .then(() => {
    console.log('\n🎉 Completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
