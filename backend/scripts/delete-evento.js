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

const eventoId = process.argv[2];

if (!eventoId) {
  console.error('Uso: node delete-evento.js <eventoId>');
  process.exit(1);
}

admin.firestore().collection('eventos').doc(eventoId).delete()
  .then(() => {
    console.log('Evento eliminado:', eventoId);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
