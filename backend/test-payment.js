const { MercadoPagoConfig, Payment } = require('mercadopago');

// Configuración
const client = new MercadoPagoConfig({ 
  accessToken: 'TEST-3273184217457598-111121-561acd2f22512e81ec5f796bc4926c88-206690440',
  options: { timeout: 5000 }
});

const payment = new Payment(client);

async function testPayment() {
  try {
    console.log('🧪 Probando pago con Mercado Pago...\n');

    // Datos de la tarjeta de prueba APROBADA
    const paymentData = {
      transaction_amount: 100,
      description: 'Test Payment',
      payment_method_id: 'master',
      payer: {
        email: 'test@test.com',
        identification: {
          type: 'CC',
          number: '12345678'
        }
      },
      // Usando tarjeta directamente (solo en test)
      card: {
        number: '5031755734530604',
        security_code: '123',
        expiration_month: '11',
        expiration_year: '2025',
        cardholder: {
          name: 'APRO',
          identification: {
            type: 'CC',
            number: '12345678'
          }
        }
      }
    };

    console.log('📤 Enviando pago a Mercado Pago...');
    console.log('💳 Tarjeta:', paymentData.card.number);
    console.log('👤 Nombre:', paymentData.card.cardholder.name);
    
    const result = await payment.create({ body: paymentData });

    console.log('\n✅ RESPUESTA DE MERCADO PAGO:');
    console.log('   ID:', result.id);
    console.log('   Status:', result.status);
    console.log('   Status Detail:', result.status_detail);
    console.log('   Payment Method:', result.payment_method_id);
    
    if (result.status === 'approved') {
      console.log('\n🎉 ¡PAGO APROBADO!');
    } else if (result.status === 'rejected') {
      console.log('\n❌ PAGO RECHAZADO');
      console.log('   Razón:', result.status_detail);
    } else {
      console.log('\n⏳ PAGO PENDIENTE');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.cause) {
      console.error('Detalle:', JSON.stringify(error.cause, null, 2));
    }
  }
}

testPayment();

