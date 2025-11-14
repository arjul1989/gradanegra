const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('../firebase-credentials.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Ciudades de Colombia para filtros
const ciudadesColombia = [
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Bucaramanga',
  'Pereira',
  'Santa Marta',
  'Manizales',
  'Ibagué'
];

// Imágenes funcionales por categoría (Unsplash con parámetros de calidad)
const imagesByCategory = {
  'rock-underground': [
    'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=1200&q=85&fm=jpg', // Rock concert
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=85&fm=jpg', // Live music
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=85&fm=jpg', // Band performance
    'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=1200&q=85&fm=jpg'  // Concert crowd
  ],
  'salsa-tropical': [
    'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=1200&q=85&fm=jpg', // Dancing
    'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=1200&q=85&fm=jpg', // Salsa dancers
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=85&fm=jpg', // Party lights
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=85&fm=jpg'  // Live band
  ],
  'electronica-oscuridad': [
    'https://images.unsplash.com/photo-1571266028243-d220c6b5a4cc?w=1200&q=85&fm=jpg', // DJ setup
    'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200&q=85&fm=jpg', // Electronic festival
    'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=1200&q=85&fm=jpg', // Neon lights
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=85&fm=jpg'  // Club atmosphere
  ],
  'reggaeton-urbano': [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=85&fm=jpg', // Urban party
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=85&fm=jpg', // Concert stage
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&q=85&fm=jpg', // Festival crowd
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200&q=85&fm=jpg'  // Live performance
  ],
  'arte-cultura': [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=85&fm=jpg', // Theater
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&q=85&fm=jpg', // Cultural event
    'https://images.unsplash.com/photo-1496449903678-68ddcb189a24?w=1200&q=85&fm=jpg', // Art gallery
    'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=1200&q=85&fm=jpg'  // Exhibition
  ],
  'deportes': [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=85&fm=jpg', // Sports stadium
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=85&fm=jpg', // Soccer match
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&q=85&fm=jpg', // Basketball
    'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200&q=85&fm=jpg'  // Running event
  ],
  'comedia-stand-up': [
    'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&q=85&fm=jpg', // Comedy show
    'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=1200&q=85&fm=jpg', // Stand-up stage
    'https://images.unsplash.com/photo-1516981442399-a91139e20ff8?w=1200&q=85&fm=jpg', // Microphone
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&q=85&fm=jpg'  // Audience laughing
  ],
  'comedia': [
    'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&q=85&fm=jpg',
    'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=1200&q=85&fm=jpg',
    'https://images.unsplash.com/photo-1516981442399-a91139e20ff8?w=1200&q=85&fm=jpg',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&q=85&fm=jpg'
  ]
};

function getRandomCity() {
  return ciudadesColombia[Math.floor(Math.random() * ciudadesColombia.length)];
}

function getRandomImage(categoria) {
  const images = imagesByCategory[categoria] || imagesByCategory['rock-underground'];
  return images[Math.floor(Math.random() * images.length)];
}

async function fixEventsImagesAndCities() {
  console.log('🔧 Actualizando imágenes y ciudades de eventos...\n');

  try {
    // Obtener todos los eventos activos
    const eventosSnapshot = await db.collection('eventos')
      .where('status', '==', 'activo')
      .get();

    console.log(`📅 Eventos a actualizar: ${eventosSnapshot.size}\n`);

    let updated = 0;
    const batch = db.batch();

    for (const eventoDoc of eventosSnapshot.docs) {
      const evento = eventoDoc.data();
      const eventoRef = db.collection('eventos').doc(eventoDoc.id);
      
      // Asignar ciudad aleatoria
      const ciudad = getRandomCity();
      
      // Asignar imagen según categoría
      const imagen = getRandomImage(evento.categoria);
      
      // Actualizar el evento
      batch.update(eventoRef, {
        ciudad: ciudad,
        imagen: imagen,
        imagenes: [imagen],
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ ${evento.nombre}`);
      console.log(`   📍 Ciudad: ${ciudad}`);
      console.log(`   🎨 Categoría: ${evento.categoria}`);
      console.log('');
      
      updated++;
    }

    // Ejecutar batch
    await batch.commit();

    console.log('🎉 ¡Eventos actualizados exitosamente!');
    console.log(`📊 Total actualizado: ${updated}`);
    console.log(`\n🏙️ Ciudades disponibles para filtros: ${ciudadesColombia.join(', ')}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

fixEventsImagesAndCities();

