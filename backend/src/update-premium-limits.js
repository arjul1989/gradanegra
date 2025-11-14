const { admin, db } = require('./config/firebase');

async function updateComercioLimits() {
  try {
    console.log('🔍 Buscando comercio con plan premium...');
    
    const comerciosRef = db.collection('comercios');
    const snapshot = await comerciosRef
      .where('tipoPlan', '==', 'premium')
      .get();

    if (snapshot.empty) {
      console.log('⚠️  No se encontraron comercios con plan premium');
      return;
    }

    console.log(`✅ Encontrados ${snapshot.size} comercio(s) con plan premium`);

    for (const doc of snapshot.docs) {
      const comercio = doc.data();
      console.log(`\n📝 Actualizando comercio: ${comercio.nombre}`);
      console.log(`   Límite actual: ${comercio.limiteEventos} eventos`);
      
      await doc.ref.update({
        limiteEventos: 50,
        comision: 5
      });
      
      console.log(`   ✅ Límite actualizado a: 50 eventos`);
      console.log(`   ✅ Comisión actualizada a: 5%`);
    }

    console.log('\n🎉 Actualización completada!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateComercioLimits();
