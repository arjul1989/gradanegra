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

async function listarComercios() {
  try {
    const snapshot = await db.collection('comercios').limit(10).get();
    console.log('');
    console.log('Comercios disponibles:');
    console.log('');
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('-----------------------------------');
      console.log('ID:', doc.id);
      console.log('Nombre:', data.nombre);
      console.log('Email:', data.email);
      console.log('Plan:', data.plan);
      console.log('Estado:', data.estado);
      console.log('Owner UID:', data.ownerId || 'Sin dueno');
    });
    console.log('-----------------------------------');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listarComercios();
