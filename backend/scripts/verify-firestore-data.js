/**
 * Script para verificar los datos creados en Firestore
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('../firebase-credentials.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Colores para logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function verificarDatos() {
  console.log(`\n${colors.bright}${colors.cyan}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║     VERIFICACIÓN DE DATOS EN FIRESTORE                  ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // 1. Categorías
    const categoriasSnapshot = await db.collection('categorias').get();
    console.log(`${colors.green}✓${colors.reset} Categorías: ${colors.bright}${categoriasSnapshot.size}${colors.reset}`);
    
    if (categoriasSnapshot.size > 0) {
      console.log(`  ${colors.blue}Ejemplos:${colors.reset}`);
      categoriasSnapshot.docs.slice(0, 3).forEach(doc => {
        const data = doc.data();
        console.log(`    • ${data.nombre} - "${data.nameAction}"`);
      });
    }

    // 2. Comercios
    const comerciosSnapshot = await db.collection('comercios').get();
    console.log(`\n${colors.green}✓${colors.reset} Comercios: ${colors.bright}${comerciosSnapshot.size}${colors.reset}`);
    
    if (comerciosSnapshot.size > 0) {
      console.log(`  ${colors.blue}Detalles:${colors.reset}`);
      comerciosSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`    • ${data.nombre} (${data.tipoPlan.toUpperCase()}) - ${data.ciudad}`);
        console.log(`      Límite eventos: ${data.limiteEventos === -1 ? 'Ilimitado' : data.limiteEventos} | Comisión: ${data.comision}%`);
      });
    }

    // 3. Eventos
    const eventosSnapshot = await db.collection('eventos').get();
    const eventosDestacados = eventosSnapshot.docs.filter(doc => doc.data().destacado);
    console.log(`\n${colors.green}✓${colors.reset} Eventos: ${colors.bright}${eventosSnapshot.size}${colors.reset}`);
    console.log(`  ${colors.yellow}★${colors.reset} Destacados: ${colors.bright}${eventosDestacados.length}${colors.reset}`);
    
    if (eventosDestacados.length > 0) {
      console.log(`  ${colors.blue}Eventos destacados:${colors.reset}`);
      eventosDestacados.forEach(doc => {
        const data = doc.data();
        console.log(`    ${colors.yellow}★${colors.reset} ${data.nombre} - ${data.ciudad}`);
      });
    }

    // 4. Relaciones Eventos-Categorías
    const relacionesSnapshot = await db.collection('eventos_categorias').get();
    console.log(`\n${colors.green}✓${colors.reset} Eventos-Categorías: ${colors.bright}${relacionesSnapshot.size}${colors.reset}`);

    // 5. Fechas de Eventos
    const fechasSnapshot = await db.collection('fechas_evento').get();
    console.log(`\n${colors.green}✓${colors.reset} Fechas de Eventos: ${colors.bright}${fechasSnapshot.size}${colors.reset}`);
    
    if (fechasSnapshot.size > 0) {
      const fechaEjemplo = fechasSnapshot.docs[0].data();
      console.log(`  ${colors.blue}Ejemplo:${colors.reset}`);
      console.log(`    Fecha: ${fechaEjemplo.fecha} ${fechaEjemplo.horaInicio}`);
      console.log(`    Aforo: ${fechaEjemplo.aforoTotal} | Disponible: ${fechaEjemplo.aforoDisponible}`);
    }

    // 6. Tiers
    const tiersSnapshot = await db.collection('tiers').get();
    console.log(`\n${colors.green}✓${colors.reset} Tiers: ${colors.bright}${tiersSnapshot.size}${colors.reset}`);
    
    if (tiersSnapshot.size > 0) {
      const tiers = {};
      tiersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        tiers[data.nombre] = (tiers[data.nombre] || 0) + 1;
      });
      console.log(`  ${colors.blue}Distribución:${colors.reset}`);
      Object.entries(tiers).forEach(([nombre, count]) => {
        console.log(`    • ${nombre}: ${count}`);
      });
    }

    // 7. Boletos
    const boletosSnapshot = await db.collection('boletos').limit(100).get();
    const totalBoletosEstimado = tiersSnapshot.size > 0 
      ? tiersSnapshot.docs.reduce((sum, doc) => sum + (doc.data().cantidad || 0), 0)
      : 0;
    
    console.log(`\n${colors.green}✓${colors.reset} Boletos: ${colors.bright}~${totalBoletosEstimado.toLocaleString()}${colors.reset} (estimado)`);
    
    if (boletosSnapshot.size > 0) {
      const boletoEjemplo = boletosSnapshot.docs[0].data();
      console.log(`  ${colors.blue}Ejemplo:${colors.reset}`);
      console.log(`    Número: ${boletoEjemplo.numeroBoleto}`);
      console.log(`    Hash: ${boletoEjemplo.hash.substring(0, 16)}...`);
      console.log(`    Precio: $${boletoEjemplo.precio.toLocaleString()}`);
      console.log(`    Status: ${boletoEjemplo.status}`);
    }

    // Resumen por comercio
    console.log(`\n${colors.bright}${colors.cyan}Resumen por Comercio:${colors.reset}`);
    for (const comercioDoc of comerciosSnapshot.docs) {
      const comercio = comercioDoc.data();
      const eventosComercio = await db.collection('eventos')
        .where('comercioId', '==', comercio.id)
        .get();
      
      console.log(`\n  ${colors.bright}${comercio.nombre}${colors.reset}`);
      console.log(`    Eventos totales: ${eventosComercio.size}`);
      console.log(`    Eventos destacados: ${eventosComercio.docs.filter(d => d.data().destacado).length}`);
    }

    console.log(`\n${colors.bright}${colors.green}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.green}║            ✓ VERIFICACIÓN COMPLETADA                    ║${colors.reset}`);
    console.log(`${colors.bright}${colors.green}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.blue}Firebase Console:${colors.reset}`);
    console.log(`https://console.firebase.google.com/project/${admin.app().options.projectId}/firestore\n`);

  } catch (error) {
    console.error(`\n${colors.red}✗ Error al verificar datos:${colors.reset}`, error.message);
    console.error(error);
  }

  process.exit(0);
}

// Ejecutar
verificarDatos();
