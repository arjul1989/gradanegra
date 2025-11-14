require('dotenv').config();
const admin = require('firebase-admin');
const { db, initializeFirebase } = require('../src/config/firebase');
const { v4: uuidv4 } = require('uuid');

// Inicializar Firebase
initializeFirebase();

// Imágenes válidas y verificadas
const validImages = {
  rock: [
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=800&fit=crop',
  ],
  electronica: [
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1571266028243-d220c2f06d29?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=1200&h=800&fit=crop',
  ],
  deportes: [
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&h=800&fit=crop',
  ],
};

const newEvents = [
  // Electrónica Oscuridad
  {
    nombre: 'Amelie Lens Live Set',
    descripcion: 'La reina del techno oscuro en un set exclusivo',
    imagen: validImages.electronica[0],
    ciudad: 'Bogotá',
    ubicacion: 'Video Club',
    categorias: ['electronica-oscuridad'],
    comercioNombre: 'Cultura y Eventos SA',
    fecha: '2025-12-20',
  },
  {
    nombre: 'Charlotte de Witte: Dark Techno',
    descripcion: 'Una noche de techno industrial y oscuro',
    imagen: validImages.electronica[1],
    ciudad: 'Medellín',
    ubicacion: 'Teatro Metropolitano',
    categorias: ['electronica-oscuridad'],
    comercioNombre: 'Urban Beats Colombia',
    fecha: '2025-12-15',
  },
  {
    nombre: 'Ben Klock & Marcel Dettmann',
    descripcion: 'Los maestros del techno berlinés en Colombia',
    imagen: validImages.electronica[2],
    ciudad: 'Cali',
    ubicacion: 'Tin Tin Deo',
    categorias: ['electronica-oscuridad'],
    comercioNombre: 'Cultura y Eventos SA',
    fecha: '2025-12-10',
  },
  
  // Deportes Extremos
  {
    nombre: 'Red Bull BMX Masters Colombia',
    descripcion: 'Lo mejor del BMX freestyle mundial',
    imagen: validImages.deportes[0],
    ciudad: 'Medellín',
    ubicacion: 'Parque de las Aguas',
    categorias: ['deportes-extremos'],
    comercioNombre: 'Cultura y Eventos SA',
    fecha: '2025-11-25',
  },
  {
    nombre: 'Skateboarding Championship 2025',
    descripcion: 'Campeonato nacional de skateboarding',
    imagen: validImages.deportes[1],
    ciudad: 'Bogotá',
    ubicacion: 'Skate Park 26',
    categorias: ['deportes-extremos'],
    comercioNombre: 'Producciones Rock Latino',
    fecha: '2025-12-08',
  },
  {
    nombre: 'Motocross Extreme Show',
    descripcion: 'Acrobacias extremas en moto',
    imagen: validImages.deportes[2],
    ciudad: 'Cali',
    ubicacion: 'Autódromo de Cali',
    categorias: ['deportes-extremos'],
    comercioNombre: 'Cultura y Eventos SA',
    fecha: '2025-12-22',
  },
];

async function addEvents() {
  console.log('🎪 Agregando eventos adicionales...\n');
  
  try {
    // Obtener comercios
    const comerciosSnapshot = await db.collection('comercios').where('deletedAt', '==', null).get();
    const comercios = {};
    comerciosSnapshot.forEach(doc => {
      const data = doc.data();
      comercios[data.nombre] = doc.id;
    });
    
    // Obtener categorías
    const categoriasSnapshot = await db.collection('categorias').where('deletedAt', '==', null).get();
    const categorias = {};
    categoriasSnapshot.forEach(doc => {
      const data = doc.data();
      categorias[data.slug] = doc.id;
    });
    
    let added = 0;
    
    for (const evento of newEvents) {
      const eventoId = uuidv4();
      const comercioId = comercios[evento.comercioNombre];
      
      if (!comercioId) {
        console.log(`⚠️  Comercio no encontrado: ${evento.comercioNombre}`);
        continue;
      }
      
      // Crear evento
      await db.collection('eventos').doc(eventoId).set({
        id: eventoId,
        comercioId: comercioId,
        nombre: evento.nombre,
        descripcion: evento.descripcion,
        imagen: evento.imagen,
        ciudad: evento.ciudad,
        ubicacion: evento.ubicacion,
        destacado: false,
        status: 'activo',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: null
      });
      
      // Crear relaciones con categorías
      for (const catSlug of evento.categorias) {
        const categoriaId = categorias[catSlug];
        if (categoriaId) {
          const relId = uuidv4();
          await db.collection('eventos_categorias').doc(relId).set({
            id: relId,
            eventoId: eventoId,
            categoriaId: categoriaId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            deletedAt: null
          });
        }
      }
      
      // Crear fecha de evento
      const fechaId = uuidv4();
      await db.collection('fechas_evento').doc(fechaId).set({
        id: fechaId,
        eventoId: eventoId,
        fecha: new Date(evento.fecha),
        horaInicio: '20:00',
        horaFin: '02:00',
        status: 'disponible',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: null
      });
      
      // Crear tiers para esta fecha
      const tiers = [
        { nombre: 'General', capacidad: 3000, precio: 50000, orden: 1 },
        { nombre: 'VIP', capacidad: 1500, precio: 120000, orden: 2 },
        { nombre: 'Palco', capacidad: 500, precio: 250000, orden: 3 }
      ];
      
      for (const tier of tiers) {
        const tierId = uuidv4();
        await db.collection('tiers').doc(tierId).set({
          id: tierId,
          fechaEventoId: fechaId,
          nombre: tier.nombre,
          descripcion: `Acceso ${tier.nombre}`,
          precio: tier.precio,
          capacidadTotal: tier.capacidad,
          capacidadDisponible: tier.capacidad,
          orden: tier.orden,
          status: 'disponible',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          deletedAt: null
        });
      }
      
      console.log(`✅ ${evento.nombre}`);
      console.log(`   📍 ${evento.ciudad} - ${evento.ubicacion}`);
      console.log(`   🎭 Categorías: ${evento.categorias.join(', ')}`);
      console.log(`   🖼️  ${evento.imagen}\n`);
      added++;
    }
    
    console.log(`\n✨ ${added} eventos agregados exitosamente`);
    
  } catch (error) {
    console.error('❌ Error agregando eventos:', error);
    throw error;
  }
}

// Ejecutar
addEvents()
  .then(() => {
    console.log('\n🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
