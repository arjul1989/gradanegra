/**
 * Script rápido para probar la conexión con la API
 */

const axios = require('axios');

const API_URL = 'http://localhost:8080';

async function testConnection() {
  console.log('🧪 Probando conexión con el backend...\n');

  try {
    // Test 1: Categorías
    console.log('📋 Test 1: GET /api/categorias');
    const catResponse = await axios.get(`${API_URL}/api/categorias`);
    console.log(`   ✅ ${catResponse.data.count} categorías recibidas`);
    console.log(`   📝 Ejemplo: ${catResponse.data.data[0].nombre} - "${catResponse.data.data[0].nameAction}"\n`);

    // Test 2: Eventos destacados
    console.log('⭐ Test 2: GET /api/eventos/destacados');
    const eventResponse = await axios.get(`${API_URL}/api/eventos/destacados`);
    console.log(`   ✅ ${eventResponse.data.count} eventos destacados recibidos`);
    console.log(`   📝 Ejemplo: ${eventResponse.data.data[0].nombre}`);
    console.log(`       📍 ${eventResponse.data.data[0].ciudad} - ${eventResponse.data.data[0].ubicacion}`);
    console.log(`       💰 Desde $${eventResponse.data.data[0].precioDesde?.toLocaleString('es-CO')}`);
    console.log(`       🏢 ${eventResponse.data.data[0].comercio?.nombre}\n`);

    // Test 3: Eventos por categoría
    console.log('🎸 Test 3: GET /api/eventos/categoria/rock-underground');
    const rockResponse = await axios.get(`${API_URL}/api/eventos/categoria/rock-underground`);
    console.log(`   ✅ ${rockResponse.data.count} eventos de rock recibidos\n`);

    console.log('✅ ¡Todas las pruebas pasaron exitosamente!\n');
    console.log('🎉 El frontend puede conectarse correctamente con el backend');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testConnection();
