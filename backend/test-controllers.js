/**
 * Prueba directa de controladores sin servidor
 */

require('dotenv').config();
const { initializeFirebase } = require('./src/config/firebase');
const { getCategorias } = require('./src/controllers/categoria.controller');
const { getEventosDestacados } = require('./src/controllers/eventos.controller');

initializeFirebase();

// Mock de request y response
const mockReq = {};
const mockRes = {
  status: (code) => {
    mockRes.statusCode = code;
    return mockRes;
  },
  json: (data) => {
    console.log(`\n📤 Response (${mockRes.statusCode}):`);
    console.log(JSON.stringify(data, null, 2));
  }
};

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║      GRADA NEGRA - TEST DE CONTROLADORES                ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  console.log('\n🧪 Probando getCategorias()...\n');
  await getCategorias(mockReq, mockRes);

  console.log('\n\n🧪 Probando getEventosDestacados()...\n');
  await getEventosDestacados(mockReq, mockRes);

  process.exit(0);
}

runTests();
