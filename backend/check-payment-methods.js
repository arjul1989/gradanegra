const { accessToken } = require('./src/config/mercadopago');

async function listAvailablePaymentMethods() {
  try {
    console.log('🔍 Verificando métodos de pago disponibles...');
    
    const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const methods = await response.json();
    
    console.log(`📊 Total métodos encontrados: ${methods.length}`);
    console.log('\n💰 Métodos de pago disponibles:\n');

    // Filtrar métodos relevantes
    const cashMethods = methods.filter(m => m.payment_type_id === 'ticket');
    const bankMethods = methods.filter(m => m.payment_type_id === 'bank_transfer');
    const cardMethods = methods.filter(m => m.payment_type_id === 'credit_card' || m.payment_type_id === 'debit_card');

    console.log('💵 MÉTODOS EN EFECTIVO (ticket):');
    cashMethods.forEach(method => {
      console.log(`   • ${method.id} - ${method.name}`);
      console.log(`     Type: ${method.payment_type_id}`);
      console.log(`     Status: ${method.status}`);
      console.log('');
    });

    console.log('🏦 MÉTODOS BANCARIOS:');
    bankMethods.forEach(method => {
      console.log(`   • ${method.id} - ${method.name}`);
      console.log(`     Type: ${method.payment_type_id}`);
      console.log(`     Status: ${method.status}`);
      console.log('');
    });

    console.log('💳 MÉTODOS CON TARJETA:');
    cardMethods.slice(0, 5).forEach(method => {
      console.log(`   • ${method.id} - ${method.name}`);
      console.log(`     Type: ${method.payment_type_id}`);
      console.log(`     Status: ${method.status}`);
      console.log('');
    });

    if (cardMethods.length > 5) {
      console.log(`   ... y ${cardMethods.length - 5} más`);
    }

    // Buscar específicamente Efecty o métodos similares
    const efectyLike = methods.filter(m => 
      m.name.toLowerCase().includes('efect') || 
      m.name.toLowerCase().includes('cash') ||
      m.id.toLowerCase().includes('efect')
    );

    if (efectyLike.length > 0) {
      console.log('\n🎯 MÉTODOS SIMILARES A EFECTY ENCONTRADOS:');
      efectyLike.forEach(method => {
        console.log(`   • ${method.id} - ${method.name}`);
        console.log(`     Type: ${method.payment_type_id}`);
        console.log(`     Status: ${method.status}`);
        console.log('');
      });
    } else {
      console.log('\n❌ No se encontraron métodos similares a Efecty');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listAvailablePaymentMethods();