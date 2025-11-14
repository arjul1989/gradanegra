/**
 * Script para asignar un usuario a un comercio existente
 * 
 * Uso:
 * node scripts/assign-user-to-comercio.js email@example.com comercioId
 */

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

async function assignUserToComercio(email, comercioId) {
  try {
    console.log('');
    console.log('Buscando usuario:', email);
    
    // Buscar usuario por email
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log('Usuario encontrado:', user.uid);
    } catch (error) {
      console.error('Usuario no encontrado en Firebase Auth');
      console.log('El usuario debe existir primero. Crealo en Firebase Auth o mediante login en la app.');
      process.exit(1);
    }

    // Verificar que el comercio existe
    console.log('Verificando comercio:', comercioId);
    const comercioRef = db.collection('comercios').doc(comercioId);
    const comercioDoc = await comercioRef.get();
    
    if (!comercioDoc.exists) {
      console.error('Comercio no encontrado:', comercioId);
      process.exit(1);
    }

    const comercioData = comercioDoc.data();
    console.log('Comercio encontrado:', comercioData.nombre);

    // Actualizar el comercio con el ownerId
    await comercioRef.update({
      ownerId: user.uid,
      ownerEmail: email,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('');
    console.log('Comercio actualizado exitosamente');
    console.log('-----------------------------------');
    console.log('Email:', email);
    console.log('UID:', user.uid);
    console.log('Comercio ID:', comercioId);
    console.log('Comercio:', comercioData.nombre);
    console.log('-----------------------------------');
    console.log('');
    console.log('El usuario ahora puede acceder al panel de comercios');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Validar argumentos
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.log('');
  console.log('Uso: node scripts/assign-user-to-comercio.js <email> <comercioId>');
  console.log('');
  console.log('Ejemplo:');
  console.log('  node scripts/assign-user-to-comercio.js usuario@example.com 03634d5a-ab96-4eeb-a40a-d78c7b80fe67');
  console.log('');
  process.exit(1);
}

const [email, comercioId] = args;

assignUserToComercio(email, comercioId);
