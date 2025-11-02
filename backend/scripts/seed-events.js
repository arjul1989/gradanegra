#!/usr/bin/env node

/**
 * Script para crear eventos de ejemplo en Firestore
 * Ejecutar: node scripts/seed-events.js
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'gradanegra-prod'
  });
}

const db = admin.firestore();

const events = [
  // Rock Underground
  {
    name: 'The Voidz en Vivo',
    description: 'Concierto exclusivo de The Voidz. Experiencia underground única con el proyecto experimental de Julian Casablancas. Una noche de rock alternativo que desafía los límites del género.',
    category: 'rock-underground',
    categoryName: 'Rock Underground',
    date: '2024-12-15T21:00:00Z',
    location: 'Foro Indie Rocks, Ciudad de México',
    venue: 'Foro Indie Rocks',
    city: 'Ciudad de México',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
    price: 850,
    totalTickets: 500,
    availableTickets: 500,
    status: 'active',
    featured: true,
    tags: ['rock', 'alternativo', 'underground', 'indie'],
    organizer: {
      name: 'Grada Negra',
      email: 'eventos@gradanegra.com'
    }
  },
  {
    name: 'Arctic Monkeys: Live Sessions',
    description: 'Los reyes del rock indie regresan con un show íntimo. Repertorio que incluye clásicos como "Do I Wanna Know?" y material nuevo de su último álbum.',
    category: 'rock-underground',
    categoryName: 'Rock Underground',
    date: '2024-11-20T20:00:00Z',
    location: 'Palacio de los Deportes, CDMX',
    venue: 'Palacio de los Deportes',
    city: 'CDMX',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=600&fit=crop',
    price: 1200,
    totalTickets: 800,
    availableTickets: 320,
    status: 'active',
    featured: false,
    tags: ['rock', 'indie', 'británico'],
    organizer: {
      name: 'Grada Negra',
      email: 'eventos@gradanegra.com'
    }
  },
  {
    name: 'Metallica World Tour 2024',
    description: 'Los legendarios Metallica regresan a México con su gira mundial. Prepárate para una noche épica de thrash metal con los mejores hits de su carrera.',
    category: 'rock-underground',
    categoryName: 'Rock Underground',
    date: '2024-11-25T19:30:00Z',
    location: 'Foro Sol, Ciudad de México',
    venue: 'Foro Sol',
    city: 'Ciudad de México',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
    price: 1500,
    totalTickets: 1000,
    availableTickets: 450,
    status: 'active',
    featured: false,
    tags: ['metal', 'thrash', 'rock', 'legendario'],
    organizer: {
      name: 'Grada Negra',
      email: 'eventos@gradanegra.com'
    }
  },
  {
    name: 'The Strokes: Nocturno',
    description: 'Sesión nocturna especial de The Strokes. Una experiencia única con los pioneros del rock garage revival neoyorquino.',
    category: 'rock-underground',
    categoryName: 'Rock Underground',
    date: '2024-12-08T22:00:00Z',
    location: 'Teatro Metropólitan, CDMX',
    venue: 'Teatro Metropólitan',
    city: 'CDMX',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=600&fit=crop',
    price: 950,
    totalTickets: 600,
    availableTickets: 280,
    status: 'active',
    featured: false,
    tags: ['rock', 'garage', 'indie', 'new york'],
    organizer: {
      name: 'Grada Negra',
      email: 'eventos@gradanegra.com'
    }
  },

  // Electrónica Oscuridad
  {
    name: 'Dark Techno Night: Amelie Lens',
    description: 'La reina del techno oscuro llega a México. Amelie Lens presenta su set más intenso con sonidos industriales y beats hipnóticos que te llevarán a otra dimensión.',
    category: 'electronica-oscuridad',
    categoryName: 'Electrónica Oscuridad',
    date: '2024-11-30T23:00:00Z',
    location: 'Warehouse Underground, CDMX',
    venue: 'Warehouse Underground',
    city: 'CDMX',
    image: 'https://images.unsplash.com/photo-1571266028243-d220c6e8a67c?w=800&h=600&fit=crop',
    price: 700,
    totalTickets: 400,
    availableTickets: 150,
    status: 'active',
    featured: false,
    tags: ['techno', 'dark', 'industrial', 'underground'],
    organizer: {
      name: 'Grada Negra',
      email: 'eventos@gradanegra.com'
    }
  },
  {
    name: 'HYTE: Berlin Showcase',
    description: 'La legendaria marca HYTE trae lo mejor del techno berlinés. Una noche de música electrónica oscura con los mejores DJs de la escena alemana.',
    category: 'electronica-oscuridad',
    categoryName: 'Electrónica Oscuridad',
    date: '2024-12-20T22:00:00Z',
    location: 'Foro Bizarro, CDMX',
    venue: 'Foro Bizarro',
    city: 'CDMX',
    image: 'https://images.unsplash.com/photo-1598387181032-a3103a2db5b1?w=800&h=600&fit=crop',
    price: 800,
    totalTickets: 500,
    availableTickets: 200,
    status: 'active',
    featured: false,
    tags: ['techno', 'berlín', 'dark', 'warehouse'],
    organizer: {
      name: 'Grada Negra',
      email: 'eventos@gradanegra.com'
    }
  },
  {
    name: 'Industrial EBM Night',
    description: 'Noche dedicada al EBM y techno industrial. Una experiencia sonora agresiva con visuales impactantes y la mejor selección de música electrónica oscura.',
    category: 'electronica-oscuridad',
    categoryName: 'Electrónica Oscuridad',
    date: '2024-11-18T23:30:00Z',
    location: 'Club 77, Ciudad de México',
    venue: 'Club 77',
    city: 'Ciudad de México',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
    price: 600,
    totalTickets: 300,
    availableTickets: 120,
    status: 'active',
    featured: false,
    tags: ['ebm', 'industrial', 'techno', 'darkwave'],
    organizer: {
      name: 'Grada Negra',
      email: 'eventos@gradanegra.com'
    }
  },
  {
    name: 'Drumcode Showcase México',
    description: 'Adam Beyer presenta Drumcode en México. El sello más influyente del techno mundial trae su sonido característico en una noche inolvidable.',
    category: 'electronica-oscuridad',
    categoryName: 'Electrónica Oscuridad',
    date: '2024-12-28T22:00:00Z',
    location: 'Carpa Astros, CDMX',
    venue: 'Carpa Astros',
    city: 'CDMX',
    image: 'https://images.unsplash.com/photo-1571266028243-d220c6e8a67c?w=800&h=600&fit=crop',
    price: 900,
    totalTickets: 700,
    availableTickets: 350,
    status: 'active',
    featured: false,
    tags: ['techno', 'drumcode', 'underground', 'adam beyer'],
    organizer: {
      name: 'Grada Negra',
      email: 'eventos@gradanegra.com'
    }
  },

  // Arte y Cultura
  {
    name: 'Festival de Cine Independiente',
    description: 'Tres días de cine alternativo y documental. Proyecciones especiales, charlas con directores y una experiencia cinematográfica única para los amantes del séptimo arte.',
    category: 'arte-cultura',
    categoryName: 'Arte y Cultura',
    date: '2024-11-22T18:00:00Z',
    location: 'Cineteca Nacional, CDMX',
    venue: 'Cineteca Nacional',
    city: 'CDMX',
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=600&fit=crop',
    price: 350,
    totalTickets: 200,
    availableTickets: 80,
    status: 'active',
    featured: false,
    tags: ['cine', 'documental', 'independiente', 'cultura'],
    organizer: {
      name: 'Grada Negra',
      email: 'eventos@gradanegra.com'
    }
  },
  {
    name: 'Exposición: Arte Urbano Contemporáneo',
    description: 'Muestra colectiva de los mejores artistas urbanos mexicanos. Graffiti, stencil, y arte callejero en una galería underground.',
    category: 'arte-cultura',
    categoryName: 'Arte y Cultura',
    date: '2024-12-01T19:00:00Z',
    location: 'Galería Libertad, Roma Norte',
    venue: 'Galería Libertad',
    city: 'Ciudad de México',
    image: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800&h=600&fit=crop',
    price: 200,
    totalTickets: 150,
    availableTickets: 90,
    status: 'active',
    featured: false,
    tags: ['arte', 'urbano', 'graffiti', 'exposición'],
    organizer: {
      name: 'Grada Negra',
      email: 'eventos@gradanegra.com'
    }
  },
  {
    name: 'Teatro Experimental: Voces Oscuras',
    description: 'Obra de teatro experimental que explora los límites del drama contemporáneo. Una experiencia inmersiva que desafía al espectador.',
    category: 'arte-cultura',
    categoryName: 'Arte y Cultura',
    date: '2024-11-28T20:30:00Z',
    location: 'Foro Shakespeare, Coyoacán',
    venue: 'Foro Shakespeare',
    city: 'Coyoacán',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=600&fit=crop',
    price: 450,
    totalTickets: 100,
    availableTickets: 45,
    status: 'active',
    featured: false,
    tags: ['teatro', 'experimental', 'drama', 'inmersivo'],
    organizer: {
      name: 'Grada Negra',
      email: 'eventos@gradanegra.com'
    }
  },
  {
    name: 'Spoken Word & Poesía Underground',
    description: 'Noche de poesía slam y spoken word. Los mejores poetas de la escena alternativa comparten sus versos más oscuros y profundos.',
    category: 'arte-cultura',
    categoryName: 'Arte y Cultura',
    date: '2024-12-05T21:00:00Z',
    location: 'Café Cultural, Centro',
    venue: 'Café Cultural',
    city: 'Centro Histórico',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
    price: 150,
    totalTickets: 80,
    availableTickets: 50,
    status: 'active',
    featured: false,
    tags: ['poesía', 'slam', 'spoken word', 'underground'],
    organizer: {
      name: 'Grada Negra',
      email: 'eventos@gradanegra.com'
    }
  }
];

async function seedEvents() {
  console.log('🌱 Iniciando seed de eventos...\n');

  try {
    const eventsCollection = db.collection('events');
    let created = 0;

    for (const eventData of events) {
      // Verificar si el evento ya existe
      const existingEvent = await eventsCollection
        .where('name', '==', eventData.name)
        .limit(1)
        .get();

      if (!existingEvent.empty) {
        console.log(`⏭️  El evento "${eventData.name}" ya existe, saltando...`);
        continue;
      }

      // Crear el evento
      const eventRef = await eventsCollection.add({
        ...eventData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      created++;
      console.log(`✅ Creado: ${eventData.name} (ID: ${eventRef.id})`);
    }

    console.log(`\n✨ Seed completado! ${created} eventos creados.`);
    console.log('\n📊 Resumen por categoría:');
    console.log(`   - Rock Underground: ${events.filter(e => e.category === 'rock-underground').length} eventos`);
    console.log(`   - Electrónica Oscuridad: ${events.filter(e => e.category === 'electronica-oscuridad').length} eventos`);
    console.log(`   - Arte y Cultura: ${events.filter(e => e.category === 'arte-cultura').length} eventos`);
    
  } catch (error) {
    console.error('❌ Error creando eventos:', error);
    process.exit(1);
  }
}

// Ejecutar
seedEvents()
  .then(() => {
    console.log('\n🎉 ¡Todos los eventos fueron creados exitosamente!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
