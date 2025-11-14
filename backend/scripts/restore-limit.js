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

async function restoreLimit() {
  try {
    const comercioId = '03634d5a-ab96-4eeb-a40a-d78c7b80fe67';
    
    // Restaurar límite original de plan premium
    await db.collection('comercios').doc(comercioId).update({
      limiteEventos: 50,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Límite restaurado a 50 eventos (plan premium)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

restoreLimit();
