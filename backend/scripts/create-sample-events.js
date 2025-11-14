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

async function createSampleEvents() {
  try {
    const comercioId = '03634d5a-ab96-4eeb-a40a-d78c7b80fe67';
    const eventos = [
      {
        titulo: 'Festival de Rock Latino 2025',
        descripcion: 'El mejor festival de rock latino del año con bandas internacionales',
        fecha: new Date('2025-12-15'),
        hora: '18:00',
        lugar: 'Estadio El Campin',
        ciudad: 'Bogota',
        categoria: 'Conciertos',
        precio: 120000,
        capacidad: 5000,
        entradasVendidas: 2340,
        estado: 'activo',
        destacado: true,
        imagenUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
        comercioId: comercioId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        titulo: 'Noche de Jazz en Vivo',
        descripcion: 'Una velada intima con los mejores musicos de jazz de Colombia',
        fecha: new Date('2025-11-25'),
        hora: '20:00',
        lugar: 'Teatro Colon',
        ciudad: 'Bogota',
        categoria: 'Conciertos',
        precio: 80000,
        capacidad: 800,
        entradasVendidas: 650,
        estado: 'activo',
        destacado: true,
        imagenUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800',
        comercioId: comercioId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        titulo: 'Conferencia Tech Summit 2025',
        descripcion: 'El evento de tecnologia mas importante del año',
        fecha: new Date('2025-11-30'),
        hora: '09:00',
        lugar: 'Centro de Convenciones Gonzalo Jimenez',
        ciudad: 'Bogota',
        categoria: 'Conferencias',
        precio: 150000,
        capacidad: 1200,
        entradasVendidas: 980,
        estado: 'activo',
        destacado: false,
        imagenUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        comercioId: comercioId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        titulo: 'Stand Up Comedy Night',
        descripcion: 'Los mejores comediantes de Colombia en una noche inolvidable',
        fecha: new Date('2025-11-20'),
        hora: '21:00',
        lugar: 'Comedy Club Bogota',
        ciudad: 'Bogota',
        categoria: 'Entretenimiento',
        precio: 45000,
        capacidad: 300,
        entradasVendidas: 285,
        estado: 'activo',
        destacado: false,
        imagenUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800',
        comercioId: comercioId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        titulo: 'Feria Gastronomica Internacional',
        descripcion: 'Descubre los sabores del mundo en un solo lugar',
        fecha: new Date('2025-12-05'),
        hora: '11:00',
        lugar: 'Plaza de Bolivar',
        ciudad: 'Bogota',
        categoria: 'Gastronomia',
        precio: 30000,
        capacidad: 2000,
        entradasVendidas: 1456,
        estado: 'activo',
        destacado: true,
        imagenUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
        comercioId: comercioId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    console.log('');
    console.log('Creando eventos de ejemplo...');
    console.log('');

    for (const evento of eventos) {
      const docRef = await db.collection('eventos').add(evento);
      console.log('Evento creado:', evento.titulo, '- ID:', docRef.id);
    }

    console.log('');
    console.log('5 eventos creados exitosamente');
    console.log('Total de entradas vendidas simuladas: 5,711');
    console.log('Ingresos estimados: $738,240,000 COP');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createSampleEvents();
