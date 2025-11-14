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

async function setupComercio() {
  try {
    const comercioId = '03634d5a-ab96-4eeb-a40a-d78c7b80fe67';
    
    await db.collection('comercios').doc(comercioId).update({
      plan: 'premium',
      estado: 'activo',
      ciudad: 'Bogota',
      telefono: '+57 300 1234567',
      direccion: 'Calle 100 # 20-30',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Comercio actualizado con plan premium y estado activo');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupComercio();
