/**
 * Script de prueba rápido para los nuevos endpoints de la API
 * Ejecutar: node test-api.js
 */

require('dotenv').config();
const { initializeFirebase, getFirestore } = require('./src/config/firebase');

// Inicializar Firebase
initializeFirebase();
const db = getFirestore();

async function testCategoriasEndpoint() {
  console.log('\n🧪 Probando lógica de GET /api/categorias\n');
  
  try {
    const snapshot = await db.collection('categorias')
      .where('status', '==', 'activa')
      .where('deletedAt', '==', null)
      .get();
    
    const categorias = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ Categorías encontradas: ${categorias.length}`);
    console.log('\n📋 Ejemplo (primera categoría):');
    console.log(JSON.stringify(categorias[0], null, 2));
    
    return categorias;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
}

async function testEventosDestacadosEndpoint() {
  console.log('\n\n🧪 Probando lógica de GET /api/eventos/destacados\n');
  
  try {
    const eventosSnapshot = await db.collection('eventos')
      .where('destacado', '==', true)
      .where('status', '==', 'activo')
      .where('deletedAt', '==', null)
      .limit(10)
      .get();
    
    const eventos = [];
    
    for (const doc of eventosSnapshot.docs) {
      const evento = { id: doc.id, ...doc.data() };
      
      // Obtener comercio
      if (evento.comercioId) {
        const comercioDoc = await db.collection('comercios').doc(evento.comercioId).get();
        if (comercioDoc.exists) {
          evento.comercio = { id: comercioDoc.id, ...comercioDoc.data() };
        }
      }
      
      // Obtener categorías
      const relacionesSnapshot = await db.collection('eventos_categorias')
        .where('eventoId', '==', evento.id)
        .get();
      
      const categoriaIds = relacionesSnapshot.docs.map(doc => doc.data().categoriaId);
      const categorias = [];
      
      for (const catId of categoriaIds) {
        const catDoc = await db.collection('categorias').doc(catId).get();
        if (catDoc.exists) {
          categorias.push({ id: catDoc.id, ...catDoc.data() });
        }
      }
      
      evento.categorias = categorias;
      
      // Obtener próxima fecha
      const fechasSnapshot = await db.collection('fechas_evento')
        .where('eventoId', '==', evento.id)
        .where('fecha', '>=', new Date())
        .orderBy('fecha', 'asc')
        .limit(1)
        .get();
      
      if (!fechasSnapshot.empty) {
        const fechaDoc = fechasSnapshot.docs[0];
        evento.proximaFecha = { id: fechaDoc.id, ...fechaDoc.data() };
        
        // Obtener precio mínimo
        const tiersSnapshot = await db.collection('tiers')
          .where('fechaEventoId', '==', fechaDoc.id)
          .orderBy('precio', 'asc')
          .limit(1)
          .get();
        
        if (!tiersSnapshot.empty) {
          evento.precioDesde = tiersSnapshot.docs[0].data().precio;
        }
      }
      
      eventos.push(evento);
    }
    
    console.log(`✅ Eventos destacados encontrados: ${eventos.length}`);
    
    if (eventos.length > 0) {
      console.log('\n📋 Ejemplo (primer evento):');
      const ejemplo = { ...eventos[0] };
      // Simplificar comercio para mostrar
      if (ejemplo.comercio) {
        ejemplo.comercio = { nombre: ejemplo.comercio.nombre, ciudad: ejemplo.comercio.ciudad };
      }
      // Simplificar categorías
      if (ejemplo.categorias) {
        ejemplo.categorias = ejemplo.categorias.map(c => c.nombre);
      }
      // Simplificar fecha
      if (ejemplo.proximaFecha) {
        ejemplo.proximaFecha = { fecha: ejemplo.proximaFecha.fecha };
      }
      console.log(JSON.stringify(ejemplo, null, 2));
    }
    
    return eventos;
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    return [];
  }
}

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         GRADA NEGRA - TEST DE ENDPOINTS API             ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  await testCategoriasEndpoint();
  await testEventosDestacadosEndpoint();
  
  console.log('\n✅ Tests completados\n');
  process.exit(0);
}

runTests();
