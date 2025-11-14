/**
 * Script para probar la subida de imágenes a Firebase Storage
 */
const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

async function testStorageUpload() {
  try {
    console.log('');
    console.log('Probando subida de imagen a Firebase Storage...');
    console.log('');

    const bucket = getStorage().bucket();
    console.log('Bucket:', bucket.name);

    // Crear un archivo de prueba
    const testContent = Buffer.from('Test image content');
    const testPath = 'eventos/test/test-image.txt';
    
    const file = bucket.file(testPath);
    
    await file.save(testContent, {
      metadata: {
        contentType: 'text/plain',
        metadata: {
          test: 'true'
        }
      }
    });

    console.log('Archivo subido exitosamente a:', testPath);

    // Hacer el archivo público
    await file.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${testPath}`;
    console.log('URL publica:', publicUrl);

    // Obtener el archivo para verificar
    const [exists] = await file.exists();
    console.log('Archivo existe:', exists);

    // Eliminar archivo de prueba
    await file.delete();
    console.log('Archivo de prueba eliminado');

    console.log('');
    console.log('Firebase Storage esta funcionando correctamente!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testStorageUpload();
