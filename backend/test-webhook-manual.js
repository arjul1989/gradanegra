const fetch = require('node-fetch');

// Script para simular manualmente la confirmación de webhook de Mercado Pago
// Solo para testing local - NO usar en producción

const BACKEND_URL = 'http://localhost:8080';

// IDs de las compras que quieres simular
const COMPRAS_A_SIMULAR = [
  '87a4b3a7-83b4-4a05-af30-427a1f387c84', // Tu compra más reciente
  '70816b58-cb2c-47ec-bc18-18fdaf4b50c0', // Primera compra
  '05738750-bffe-4990-b805-ad883f4895fa'  // Segunda compra
];

async function simularWebhook(compraId, status = 'approved') {
  try {
    console.log(`\n🧪 Simulando webhook para compra: ${compraId}`);
    console.log(`📊 Status: ${status}`);

    const response = await fetch(`${BACKEND_URL}/api/payments/simulate-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        compraId: compraId,
        status: status,
        paymentMethodId: 'pse'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Respuesta exitosa:`, result);
    
    return result;
  } catch (error) {
    console.error(`❌ Error simulando webhook para ${compraId}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Iniciando simulación de webhooks de Mercado Pago');
  console.log('==========================================');
  
  for (const compraId of COMPRAS_A_SIMULAR) {
    const result = await simularWebhook(compraId, 'approved');
    
    if (result.success) {
      console.log(`🎫 Compra ${compraId} procesada exitosamente`);
    } else {
      console.log(`❌ Error procesando compra ${compraId}`);
    }
    
    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✨ Simulación completada');
  console.log('📝 Ahora revisa la sección "Mis Tickets" para ver los tickets generados');
}

// Si se ejecuta directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { simularWebhook, main };