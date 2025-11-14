const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('../firebase-credentials.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

// URLs de imágenes de eventos (Unsplash)
const eventImages = {
  concert: [
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800',
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800'
  ],
  nightclub: [
    'https://images.unsplash.com/photo-1571266028243-d220c6b5a4cc?w=800',
    'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800',
    'https://images.unsplash.com/photo-1571266028243-d220c6b5a4cc?w=800',
    'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800'
  ],
  festival: [
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800'
  ],
  comedy: [
    'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800',
    'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800',
    'https://images.unsplash.com/photo-1516981442399-a91139e20ff8?w=800',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800'
  ],
  sport: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
    'https://images.unsplash.com/photo-1516731566880-1c3a4d1f9e0e?w=800',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800'
  ]
};

// Datos de los 2 comercios
const comercios = [
  {
    nombre: 'Live Music Arena',
    descripcion: 'El mejor lugar para conciertos y eventos musicales en vivo en la ciudad',
    email: 'contacto@livemusicarena.com',
    telefono: '+57 300 123 4567',
    direccion: 'Calle 45 #23-15, Bogotá',
    ciudad: 'Bogotá',
    pais: 'Colombia',
    categoria: 'conciertos',
    plan: 'premium',
    logo: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=200',
    featured: true
  },
  {
    nombre: 'Comedy Central Club',
    descripcion: 'Stand-up, humor y entretenimiento de primera calidad',
    email: 'info@comedycentralclub.com',
    telefono: '+57 301 234 5678',
    direccion: 'Carrera 13 #85-24, Bogotá',
    ciudad: 'Bogotá',
    pais: 'Colombia',
    categoria: 'comedia',
    plan: 'premium',
    logo: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=200',
    featured: true
  }
];

// Eventos para Live Music Arena (10 eventos)
const eventosLiveMusic = [
  {
    nombre: 'Rock en Español - Tributo a Soda Stereo',
    descripcion: 'Una noche mágica reviviendo los mejores éxitos de Soda Stereo con músicos de primer nivel',
    categoria: 'rock-underground',
    fecha: '2025-12-15T20:00:00',
    imagen: eventImages.concert[0],
    precio: 80000,
    capacidad: 500,
    destacado: true
  },
  {
    nombre: 'Noche de Salsa con Orquesta en Vivo',
    descripcion: 'Baila toda la noche con los mejores ritmos de salsa interpretados por músicos profesionales',
    categoria: 'salsa-tropical',
    fecha: '2025-12-20T21:00:00',
    imagen: eventImages.concert[1],
    precio: 60000,
    capacidad: 400,
    destacado: true
  },
  {
    nombre: 'Festival Electrónico - New Year Edition',
    descripcion: 'Cierra el año con los mejores DJs nacionales e internacionales',
    categoria: 'electronica-oscuridad',
    fecha: '2025-12-31T22:00:00',
    imagen: eventImages.nightclub[0],
    precio: 150000,
    capacidad: 800,
    destacado: true
  },
  {
    nombre: 'Concierto de Jazz & Blues',
    descripcion: 'Una velada íntima con los mejores exponentes del jazz contemporáneo',
    categoria: 'rock-underground',
    fecha: '2026-01-10T19:30:00',
    imagen: eventImages.concert[2],
    precio: 70000,
    capacidad: 300,
    destacado: false
  },
  {
    nombre: 'Reggaeton & Urban Party',
    descripcion: 'Lo mejor del reggaeton y música urbana con artistas invitados',
    categoria: 'reggaeton-urbano',
    fecha: '2026-01-15T22:00:00',
    imagen: eventImages.nightclub[1],
    precio: 65000,
    capacidad: 600,
    destacado: true
  },
  {
    nombre: 'Rock Clásico - The Beatles Tribute',
    descripcion: 'Revive la magia de The Beatles con la mejor banda tributo de Latinoamérica',
    categoria: 'rock-underground',
    fecha: '2026-01-20T20:00:00',
    imagen: eventImages.concert[3],
    precio: 85000,
    capacidad: 450,
    destacado: false
  },
  {
    nombre: 'Cumbia y Vallenato - Fiesta Colombiana',
    descripcion: 'Celebra la música colombiana con los mejores exponentes del género',
    categoria: 'salsa-tropical',
    fecha: '2026-01-25T21:00:00',
    imagen: eventImages.festival[0],
    precio: 55000,
    capacidad: 500,
    destacado: false
  },
  {
    nombre: 'Techno Night - Underground Session',
    descripcion: 'Los mejores sets de techno y house con DJs internacionales',
    categoria: 'electronica-oscuridad',
    fecha: '2026-02-01T23:00:00',
    imagen: eventImages.nightclub[2],
    precio: 75000,
    capacidad: 700,
    destacado: true
  },
  {
    nombre: 'Indie Rock Festival',
    descripcion: '6 bandas emergentes de la escena indie colombiana',
    categoria: 'rock-underground',
    fecha: '2026-02-05T18:00:00',
    imagen: eventImages.festival[1],
    precio: 90000,
    capacidad: 600,
    destacado: false
  },
  {
    nombre: 'Salsa Brava - Orquesta Internacional',
    descripcion: 'La mejor salsa brava con una orquesta de 15 músicos profesionales',
    categoria: 'salsa-tropical',
    fecha: '2026-02-14T20:00:00',
    imagen: eventImages.concert[1],
    precio: 95000,
    capacidad: 400,
    destacado: true
  }
];

// Eventos para Comedy Central Club (10 eventos)
const eventosComedy = [
  {
    nombre: 'Stand-Up Night - Especial Navidad',
    descripcion: 'Los mejores comediantes colombianos en una noche llena de risas',
    categoria: 'comedia-stand-up',
    fecha: '2025-12-18T20:00:00',
    imagen: eventImages.comedy[0],
    precio: 45000,
    capacidad: 200,
    destacado: true
  },
  {
    nombre: 'Noche de Improvisación - Comedy Lab',
    descripcion: 'Comedy show totalmente improvisado con participación del público',
    categoria: 'comedia-stand-up',
    fecha: '2025-12-22T21:00:00',
    imagen: eventImages.comedy[1],
    precio: 35000,
    capacidad: 150,
    destacado: false
  },
  {
    nombre: 'Año Nuevo con Risas - Especial 2026',
    descripcion: 'Celebra el año nuevo con los mejores comediantes del país',
    categoria: 'comedia-stand-up',
    fecha: '2025-12-31T19:00:00',
    imagen: eventImages.comedy[2],
    precio: 80000,
    capacidad: 250,
    destacado: true
  },
  {
    nombre: 'Humor Negro - Solo para Adultos',
    descripcion: 'Stand-up sin censura con los comediantes más atrevidos',
    categoria: 'comedia-stand-up',
    fecha: '2026-01-08T22:00:00',
    imagen: eventImages.comedy[3],
    precio: 50000,
    capacidad: 180,
    destacado: false
  },
  {
    nombre: 'Comedy Roast Battle',
    descripcion: 'Los comediantes se enfrentan en batallas de insultos con buen humor',
    categoria: 'comedia-stand-up',
    fecha: '2026-01-12T21:00:00',
    imagen: eventImages.comedy[0],
    precio: 55000,
    capacidad: 200,
    destacado: true
  },
  {
    nombre: 'Mujeres al Poder - Stand-Up Femenino',
    descripcion: 'Las mejores comediantes colombianas en un show exclusivo',
    categoria: 'comedia-stand-up',
    fecha: '2026-01-18T20:00:00',
    imagen: eventImages.comedy[1],
    precio: 45000,
    capacidad: 180,
    destacado: false
  },
  {
    nombre: 'Comedy Open Mic - Nuevos Talentos',
    descripcion: 'Descubre los nuevos talentos del stand-up colombiano',
    categoria: 'comedia-stand-up',
    fecha: '2026-01-24T20:30:00',
    imagen: eventImages.comedy[2],
    precio: 25000,
    capacidad: 120,
    destacado: false
  },
  {
    nombre: 'Humor en Pareja - San Valentín Edition',
    descripcion: 'Show especial de San Valentín sobre relaciones y amor con humor',
    categoria: 'comedia-stand-up',
    fecha: '2026-02-14T21:00:00',
    imagen: eventImages.comedy[3],
    precio: 60000,
    capacidad: 220,
    destacado: true
  },
  {
    nombre: 'Stand-Up Internacional - Especial USA',
    descripcion: 'Comediantes estadounidenses traen su humor en español',
    categoria: 'comedia-stand-up',
    fecha: '2026-02-20T20:00:00',
    imagen: eventImages.comedy[0],
    precio: 75000,
    capacidad: 250,
    destacado: true
  },
  {
    nombre: 'Comedy & Music - Show Híbrido',
    descripcion: 'Combinación perfecta de stand-up y música en vivo',
    categoria: 'comedia-stand-up',
    fecha: '2026-02-28T21:00:00',
    imagen: eventImages.comedy[1],
    precio: 65000,
    capacidad: 200,
    destacado: false
  }
];

async function createDemoData() {
  try {
    console.log('🚀 Iniciando creación de datos de demo...\n');

    // 1. Crear usuarios para los comercios
    const users = [];
    for (let i = 0; i < comercios.length; i++) {
      const comercio = comercios[i];
      const email = comercio.email;
      const password = 'Demo2025!';
      
      try {
        // Verificar si el usuario ya existe
        let userRecord;
        try {
          userRecord = await auth.getUserByEmail(email);
          console.log(`✅ Usuario ${email} ya existe`);
        } catch (error) {
          // Usuario no existe, crearlo
          userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: comercio.nombre,
            emailVerified: true
          });
          console.log(`✅ Usuario creado: ${email} / ${password}`);
        }
        
        users.push(userRecord);
      } catch (error) {
        console.error(`❌ Error creando usuario ${email}:`, error.message);
        throw error;
      }
    }

    // 2. Crear comercios en Firestore
    const comercioIds = [];
    for (let i = 0; i < comercios.length; i++) {
      const comercio = comercios[i];
      const comercioId = uuidv4();
      comercioIds.push(comercioId);
      
      const comercioData = {
        id: comercioId,
        nombre: comercio.nombre,
        descripcion: comercio.descripcion,
        email: comercio.email,
        telefono: comercio.telefono,
        direccion: comercio.direccion,
        ciudad: comercio.ciudad,
        pais: comercio.pais,
        categoria: comercio.categoria,
        plan: comercio.plan,
        logo: comercio.logo,
        featured: comercio.featured,
        verified: true,
        active: true,
        stripeAccountId: null,
        stripeOnboardingComplete: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('comercios').doc(comercioId).set(comercioData);
      console.log(`✅ Comercio creado: ${comercio.nombre} (${comercioId})`);

      // Asignar usuario al comercio
      const userId = users[i].uid;
      await db.collection('usuarios-comercios').doc(`${userId}_${comercioId}`).set({
        userId: userId,
        comercioId: comercioId,
        role: 'owner',
        permissions: ['all'],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Usuario ${users[i].email} asignado a ${comercio.nombre}`);
    }

    // 3. Crear eventos para cada comercio
    const eventosArrays = [eventosLiveMusic, eventosComedy];
    
    for (let i = 0; i < comercioIds.length; i++) {
      const comercioId = comercioIds[i];
      const eventos = eventosArrays[i];
      
      console.log(`\n📅 Creando eventos para ${comercios[i].nombre}...`);
      
      for (const evento of eventos) {
        const eventoId = uuidv4();
        
        // Crear tiers para el evento
        const precioGeneral = evento.precio;
        const precioVip = Math.round(evento.precio * 2.5); // VIP es 2.5x el precio general
        
        const tiers = [
          {
            id: uuidv4(),
            nombre: 'General',
            descripcion: 'Acceso general al evento',
            precio: precioGeneral,
            capacidad: Math.floor(evento.capacidad * 0.7), // 70% capacidad
            vendidos: 0,
            disponible: true
          },
          {
            id: uuidv4(),
            nombre: 'VIP',
            descripcion: 'Acceso VIP con beneficios exclusivos',
            precio: precioVip,
            capacidad: Math.floor(evento.capacidad * 0.3), // 30% capacidad
            vendidos: 0,
            disponible: true
          }
        ];
        
        const eventoData = {
          id: eventoId,
          comercioId: comercioId,
          nombre: evento.nombre,
          descripcion: evento.descripcion,
          categoria: evento.categoria,
          fecha: admin.firestore.Timestamp.fromDate(new Date(evento.fecha)),
          hora: evento.fecha.split('T')[1].substring(0, 5),
          lugar: comercios[i].direccion,
          ciudad: comercios[i].ciudad,
          pais: comercios[i].pais,
          imagen: evento.imagen,
          imagenes: [evento.imagen],
          precio: precioGeneral, // Precio base (General)
          precioBase: precioGeneral,
          capacidad: evento.capacidad,
          ticketsDisponibles: evento.capacidad,
          destacado: evento.destacado,
          status: 'activo',
          deletedAt: null,
          tiers: tiers, // Agregar tiers al evento
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('eventos').doc(eventoId).set(eventoData);
        console.log(`  ✅ ${evento.nombre}`);
      }
    }

    console.log('\n🎉 ¡Datos de demo creados exitosamente!\n');
    console.log('📊 Resumen:');
    console.log(`  • ${comercios.length} comercios creados`);
    console.log(`  • ${eventosLiveMusic.length + eventosComedy.length} eventos creados`);
    console.log(`  • ${users.length} usuarios creados\n`);
    
    console.log('🔐 Credenciales de acceso:');
    for (let i = 0; i < comercios.length; i++) {
      console.log(`  ${comercios[i].nombre}:`);
      console.log(`    Email: ${comercios[i].email}`);
      console.log(`    Password: Demo2025!`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar
createDemoData();

