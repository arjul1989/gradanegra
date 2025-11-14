const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('../firebase-credentials.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const categories = [
  {
    id: 'rock-underground',
    nombre: 'Rock & Underground',
    slug: 'rock-underground',
    descripcion: 'Conciertos de rock, punk, metal y música alternativa',
    icono: '🎸',
    color: '#DC2626',
    status: 'activa',
    orden: 1,
  },
  {
    id: 'salsa-tropical',
    nombre: 'Salsa & Tropical',
    slug: 'salsa-tropical',
    descripcion: 'Salsa, merengue, bachata y música tropical',
    icono: '🎺',
    color: '#EA580C',
    status: 'activa',
    orden: 2,
  },
  {
    id: 'electronica-oscuridad',
    nombre: 'Electrónica',
    slug: 'electronica-oscuridad',
    descripcion: 'Techno, house, trance y música electrónica',
    icono: '🎧',
    color: '#7C3AED',
    status: 'activa',
    orden: 3,
  },
  {
    id: 'reggaeton-urbano',
    nombre: 'Reggaeton & Urbano',
    slug: 'reggaeton-urbano',
    descripcion: 'Reggaeton, trap, hip-hop y música urbana',
    icono: '🔥',
    color: '#059669',
    status: 'activa',
    orden: 4,
  },
  {
    id: 'arte-cultura',
    nombre: 'Arte & Cultura',
    slug: 'arte-cultura',
    descripcion: 'Teatro, exposiciones, conferencias y eventos culturales',
    icono: '🎭',
    color: '#2563EB',
    status: 'activa',
    orden: 5,
  },
  {
    id: 'deportes',
    nombre: 'Deportes',
    slug: 'deportes',
    descripcion: 'Eventos deportivos, competencias y actividades físicas',
    icono: '⚽',
    color: '#16A34A',
    status: 'activa',
    orden: 6,
  },
  {
    id: 'comedia',
    nombre: 'Comedia',
    slug: 'comedia',
    descripcion: 'Stand-up comedy, shows de humor e improvisación',
    icono: '😂',
    color: '#F59E0B',
    status: 'activa',
    orden: 7,
  },
];

const createCategories = async () => {
  console.log('🏷️  Creando categorías en Firestore...\n');

  try {
    for (const category of categories) {
      const categoryRef = db.collection('categorias').doc(category.id);
      await categoryRef.set({
        ...category,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Categoría creada: ${category.nombre} (${category.id})`);
    }

    console.log('\n🎉 ¡Todas las categorías fueron creadas exitosamente!');
    console.log(`📊 Total: ${categories.length} categorías`);
  } catch (error) {
    console.error('❌ Error creando categorías:', error);
    process.exit(1);
  }

  process.exit(0);
};

createCategories();

