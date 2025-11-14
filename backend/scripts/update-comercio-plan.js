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

async function updateComercio() {
  try {
    const comercioId = '03634d5a-ab96-4eeb-a40a-d78c7b80fe67';
    
    await db.collection('comercios').doc(comercioId).update({
      tipoPlan: 'premium',
      plan: 'premium',
      limiteEventos: 50,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Comercio actualizado a plan PREMIUM (50 eventos)');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateComercio();
