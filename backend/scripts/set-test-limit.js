const admin = require('firebase-admin');
require('dotenv').config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function setTestLimit() {
  try {
    const comercioId = '03634d5a-ab96-4eeb-a40a-d78c7b80fe67';
    
    // Temporalmente bajar límite a 5 para probar el modal
    await db.collection('comercios').doc(comercioId).update({
      limiteEventos: 5,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Límite temporal establecido a 5 eventos para pruebas');
    console.log('El comercio actualmente tiene 5 eventos activos');
    console.log('Esto activará el modal de límite alcanzado');
    console.log('');
    console.log('Para volver al límite original (50):');
    console.log('node scripts/restore-limit.js');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setTestLimit();
