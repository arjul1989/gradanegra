const admin = require('firebase-admin');
const serviceAccount = require('./firebase-credentials.json');

// Inicializar Firebase
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const crypto = require('crypto');

async function generateTickets() {
  const compraId = '152c7a0c-354e-4e8c-95cb-d18ca913b442';
  
  console.log('🔍 Buscando compra...');
  const compraDoc = await db.collection('compras').doc(compraId).get();
  
  if (!compraDoc.exists) {
    throw new Error('Compra no encontrada');
  }
  
  const compra = compraDoc.data();
  console.log('✅ Compra encontrada:', compra.status);
  
  // Buscar evento
  console.log('🔍 Buscando evento...');
  const eventoDoc = await db.collection('eventos').doc(compra.eventoId).get();
  
  if (!eventoDoc.exists) {
    throw new Error('Evento no encontrado');
  }
  
  const evento = eventoDoc.data();
  console.log('✅ Evento encontrado:', evento.nombre);
  
  // Generar tickets
  const tickets = compra.tickets || [];
  let totalCreated = 0;
  
  for (const ticketInfo of tickets) {
    const { tierId, cantidad, precioUnitario, nombre } = ticketInfo;
    
    console.log(`\n📝 Generando ${cantidad} tickets de tipo "${nombre}"...`);
    
    for (let i = 0; i < cantidad; i++) {
      const ticketNumber = `GN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const qrData = `${ticketNumber}|${compra.eventoId}|${tierId}`;
      const qrHash = crypto.createHash('sha256').update(qrData).digest('hex');
      
      const ticketData = {
        ticketNumber: ticketNumber,
        eventId: compra.eventoId,
        tenantId: compra.comercioId,
        buyerId: compra.userId || null,
        purchaseId: compraId,
        tierId: tierId,
        price: precioUnitario,
        status: 'valid',
        qrCode: qrHash,
        usedAt: null,
        checkedInAt: null,
        metadata: {
          tierName: nombre,
          purchaseEmail: compra.email,
          buyerName: compra.nombre
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('boletos').add(ticketData);
      console.log(`  ✅ ${ticketNumber}`);
      totalCreated++;
    }
  }
  
  console.log(`\n🎉 Total tickets generados: ${totalCreated}`);
}

generateTickets()
  .then(() => {
    console.log('\n✅ LISTO - Tickets generados exitosamente');
    process.exit(0);
  })
  .catch(e => {
    console.error('\n❌ Error:', e.message);
    process.exit(1);
  });


