require('dotenv').config();
const admin = require('firebase-admin');
const { db, initializeFirebase } = require('../src/config/firebase');

initializeFirebase();

async function fixFechasStatus() {
  console.log('🔧 Actualizando status de fechas de evento...\n');
  
  try {
    const fechasSnapshot = await db.collection('fechas_evento')
      .where('status', '==', 'disponible')
      .get();
    
    console.log(`Fechas encontradas con status 'disponible': ${fechasSnapshot.size}`);
    
    const batch = db.batch();
    
    fechasSnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        status: 'activa',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    
    console.log(`✅ ${fechasSnapshot.size} fechas actualizadas a status 'activa'`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

fixFechasStatus()
  .then(() => {
    console.log('\n✨ Completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
