require('dotenv').config();
const admin = require('firebase-admin');
const { db, initializeFirebase } = require('../src/config/firebase');

// Inicializar Firebase
initializeFirebase();

async function updateTechnoImage() {
  console.log('🔧 Actualizando imagen de Techno Underground Night...\n');
  
  try {
    // Buscar el evento
    const eventosSnapshot = await db.collection('eventos')
      .where('nombre', '==', 'Techno Underground Night')
      .where('deletedAt', '==', null)
      .get();
    
    if (eventosSnapshot.empty) {
      console.log('❌ Evento no encontrado');
      return;
    }
    
    const newImage = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=800&fit=crop';
    
    eventosSnapshot.forEach(async (doc) => {
      await doc.ref.update({
        imagen: newImage,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Imagen actualizada');
      console.log(`   Evento: ${doc.data().nombre}`);
      console.log(`   Nueva imagen: ${newImage}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

updateTechnoImage()
  .then(() => {
    console.log('\n✨ Completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
