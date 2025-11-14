require('dotenv').config();
const { db, initializeFirebase } = require('../src/config/firebase');

initializeFirebase();

async function debugCategorias() {
  console.log('🐛 Debug de categorías...\n');
  
  try {
    const categorias = await db.collection('categorias').get();
    
    console.log(`Total categorías: ${categorias.size}\n`);
    
    categorias.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`Slug: ${data.slug}`);
      console.log(`Nombre: ${data.nombre}`);
      console.log(`DeletedAt: ${data.deletedAt}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

debugCategorias()
  .then(() => {
    console.log('\n✅ Debug completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
