const ACCESS_TOKEN = 'TEST-3273184217457598-111121-561acd2f22512e81ec5f796bc4926c88-206690440';
const PUBLIC_KEY = 'TEST-50bc2b0a-1d2e-4ec8-b8a2-fbf253d816fb';

async function createCardToken() {
  try {
    console.log('🔐 Creando token de tarjeta...\n');

    const tokenData = {
      card_number: '5474925432670366', // Mastercard de prueba
      security_code: '123',
      expiration_month: 11,
      expiration_year: 2025,
      cardholder: {
        name: 'APRO',
        identification: {
          type: 'CC',
          number: '12345678'
        }
      }
    };

    const response = await fetch(
      `https://api.mercadopago.com/v1/card_tokens?public_key=${PUBLIC_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenData)
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    console.log('✅ Token creado:', data.id);
    console.log('   Full token data:', JSON.stringify(data, null, 2));
    
    return data;

  } catch (error) {
    console.error('❌ Error creando token:', error.message);
    throw error;
  }
}

async function createPayment(token) {
  try {
    console.log('\n💳 Creando pago con token...\n');

    const paymentData = {
      transaction_amount: 10000, // Cambiado a un monto mayor (COP 10,000)
      description: 'Test Payment from Backend',
      token: token.id,
      installments: 1,
      payer: {
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        identification: {
          type: 'CC',
          number: '12345678'
        }
      }
    };

    console.log('📤 Enviando pago a Mercado Pago...');
    console.log('   Token ID:', token.id);
    console.log('   Payment Data:', JSON.stringify(paymentData, null, 2));

    const response = await fetch(
      'https://api.mercadopago.com/v1/payments',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `test-${Date.now()}`
        },
        body: JSON.stringify(paymentData)
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.log('\n❌ ERROR DE MERCADO PAGO:');
      console.log(JSON.stringify(data, null, 2));
      throw new Error('Pago fallido');
    }

    console.log('\n✅ RESPUESTA DE MERCADO PAGO:');
    console.log('   ID:', data.id);
    console.log('   Status:', data.status);
    console.log('   Status Detail:', data.status_detail);
    console.log('   Payment Method:', data.payment_method_id);
    
    if (data.status === 'approved') {
      console.log('\n🎉 ¡PAGO APROBADO! ✅');
      console.log('   El problema NO está en Mercado Pago');
      console.log('   El problema ESTÁ en el frontend');
    } else if (data.status === 'rejected') {
      console.log('\n❌ PAGO RECHAZADO');
      console.log('   Razón:', data.status_detail);
    }

    return data;

  } catch (error) {
    console.error('\n❌ Error creando pago:', error.message);
    throw error;
  }
}

async function test() {
  try {
    const token = await createCardToken();
    const payment = await createPayment(token);
    
  } catch (error) {
    console.error('\n💥 Test fallido');
    process.exit(1);
  }
}

test();

