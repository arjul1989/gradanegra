/**
 * Script simple para ver qué hay en las colecciones
 */

require('dotenv').config();
const { initializeFirebase, getFirestore } = require('./src/config/firebase');

initializeFirebase();
const db = getFirestore();

async function checkCollections() {
  console.log('\n🔍 Revisando colecciones en Firestore...\n');

  // Categorías
  const catSnapshot = await db.collection('categorias').limit(3).get();
  console.log(`📁 categorias: ${catSnapshot.size} documentos (sample)`);
  if (!catSnapshot.empty) {
    const primera = catSnapshot.docs[0].data();
    console.log(`   Ejemplo: ${JSON.stringify(primera, null, 2)}`);
  }

  // Comercios
  const comSnapshot = await db.collection('comercios').limit(3).get();
  console.log(`\n📁 comercios: ${comSnapshot.size} documentos (sample)`);
  
  // Eventos
  const evSnapshot = await db.collection('eventos').limit(3).get();
  console.log(`\n📁 eventos: ${evSnapshot.size} documentos (sample)`);
  if (!evSnapshot.empty) {
    const primero = evSnapshot.docs[0].data();
    console.log(`   Ejemplo: destacado=${primero.destacado}, status=${primero.status}, deletedAt=${primero.deletedAt}`);
  }

  // Fechas
  const fechaSnapshot = await db.collection('fechas_evento').limit(3).get();
  console.log(`\n📁 fechas_evento: ${fechaSnapshot.size} documentos (sample)`);

  // Tiers
  const tierSnapshot = await db.collection('tiers').limit(3).get();
  console.log(`\n📁 tiers: ${tierSnapshot.size} documentos (sample)`);

  process.exit(0);
}

checkCollections();
