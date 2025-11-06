/**
 * Script de Seed para Firestore
 * Pobla la base de datos con datos dummy para desarrollo
 * 
 * Ejecutar: node scripts/seed-firestore.js
 */

const path = require('path');

// Configurar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Inicializar Firebase Admin
const admin = require('firebase-admin');
const serviceAccount = require('../firebase-credentials.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Importar modelos
const { Comercio, PLANES } = require('../src/models/Comercio');
const Categoria = require('../src/models/Categoria');
const Evento = require('../src/models/Evento');
const FechaEvento = require('../src/models/FechaEvento');
const Tier = require('../src/models/Tier');

// Colores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.blue}
╔═══════════════════════════════════════════════════════════╗
║         SEED DE BASE DE DATOS - GRADA NEGRA              ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

/**
 * Limpiar colecciones existentes
 */
async function limpiarColecciones() {
  console.log(`\n${colors.yellow}🧹 Limpiando colecciones...${colors.reset}`);
  
  const colecciones = [
    'comercios',
    'categorias',
    'eventos',
    'eventoCategorias',
    'fechasEvento',
    'tiers',
    'boletos',
    'counters'
  ];

  for (const coleccion of colecciones) {
    const snapshot = await db.collection(coleccion).get();
    const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    console.log(`   ✓ ${coleccion}: ${snapshot.size} documentos eliminados`);
  }
}

/**
 * Crear categorías
 */
async function crearCategorias() {
  console.log(`\n${colors.blue}🎨 Creando categorías...${colors.reset}`);

  const categoriasData = [
    {
      nombre: 'Rock Underground',
      nameAction: '¡Rockea con nosotros!',
      descripcion: 'Los mejores eventos de rock alternativo y underground',
      imagen: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800',
      icono: 'music_note'
    },
    {
      nombre: 'Electrónica Oscuridad',
      nameAction: 'Baila hasta el amanecer',
      descripcion: 'Techno, house y música electrónica experimental',
      imagen: 'https://images.unsplash.com/photo-1571266028243-4eb3f8dd914a?w=800',
      icono: 'nightlife'
    },
    {
      nombre: 'Reggaeton y Urbano',
      nameAction: 'Perreo hasta abajo 🔥',
      descripcion: 'Los mejores exponentes del reggaeton y música urbana',
      imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
      icono: 'album'
    },
    {
      nombre: 'Salsa y Tropical',
      nameAction: '¡Sácale brillo a tus zapatos!',
      descripcion: 'Salsa, merengue y música tropical para bailar',
      imagen: 'https://images.unsplash.com/photo-1504898770365-14faca1a5e98?w=800',
      icono: 'music_note'
    },
    {
      nombre: 'Comedia y Stand-Up',
      nameAction: 'Ríete sin parar',
      descripcion: 'Los mejores comediantes en vivo',
      imagen: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800',
      icono: 'sentiment_very_satisfied'
    },
    {
      nombre: 'Deportes Extremos',
      nameAction: 'Vive la adrenalina',
      descripcion: 'BMX, skateboarding, parkour y más',
      imagen: 'https://images.unsplash.com/photo-1621017092806-b715df60f141?w=800',
      icono: 'sports_soccer'
    },
    {
      nombre: 'Gastronomía',
      nameAction: 'Reservemos y vamos a cenar',
      descripcion: 'Festivales gastronómicos y experiencias culinarias',
      imagen: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      icono: 'restaurant'
    },
    {
      nombre: 'Festivales',
      nameAction: 'Vive la experiencia completa',
      descripcion: 'Los mejores festivales de música y cultura',
      imagen: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
      icono: 'celebration'
    },
    {
      nombre: 'Arte y Cultura',
      nameAction: 'Inspírate con el arte',
      descripcion: 'Exposiciones, teatro y eventos culturales',
      imagen: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
      icono: 'palette'
    }
  ];

  const categorias = [];
  for (const catData of categoriasData) {
    const categoria = new Categoria(catData);
    await categoria.save();
    categorias.push(categoria);
    console.log(`   ${colors.green}✅${colors.reset} ${categoria.nombre}`);
  }

  return categorias;
}

/**
 * Crear comercios
 */
async function crearComercios() {
  console.log(`\n${colors.blue}🏢 Creando comercios...${colors.reset}`);

  const comerciosData = [
    {
      nombre: 'Producciones Rock Latino',
      descripcion: 'Organizadores de los mejores eventos de rock en Colombia',
      email: 'contacto@prodrocklatino.com',
      telefono: '+57 310 555 1234',
      ciudad: 'Bogotá',
      direccion: 'Calle 85 #15-25, Oficina 401',
      logo: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
      imagenBanner: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200',
      colorPrimario: '#FF3333',
      colorSecundario: '#1A1A1A',
      tipoPlan: 'pro',
      redesSociales: {
        facebook: 'https://facebook.com/prodrocklatino',
        instagram: '@prodrocklatino',
        twitter: '@prodrocklatino',
        tiktok: ''
      }
    },
    {
      nombre: 'Urban Beats Colombia',
      descripcion: 'Los mejores eventos de música urbana y reggaeton',
      email: 'info@urbanbeatscol.com',
      telefono: '+57 311 555 5678',
      ciudad: 'Medellín',
      direccion: 'Carrera 43A #34-95',
      logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
      imagenBanner: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200',
      colorPrimario: '#00D9FF',
      colorSecundario: '#0A0A0A',
      tipoPlan: 'enterprise',
      redesSociales: {
        facebook: 'https://facebook.com/urbanbeatscol',
        instagram: '@urbanbeatscol',
        twitter: '@urbanbeatscol',
        tiktok: '@urbanbeatscol'
      }
    },
    {
      nombre: 'Festivales del Sur',
      descripcion: 'Grandes festivales de música y cultura',
      email: 'contacto@festivalesdelsur.co',
      telefono: '+57 312 555 9012',
      ciudad: 'Cali',
      direccion: 'Avenida 6N #23-45',
      logo: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
      imagenBanner: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200',
      colorPrimario: '#FFD700',
      colorSecundario: '#2C2C2C',
      tipoPlan: 'pro',
      redesSociales: {
        facebook: 'https://facebook.com/festivalesdelsur',
        instagram: '@festivalesdelsur',
        twitter: '',
        tiktok: ''
      }
    },
    {
      nombre: 'Comedia en Vivo',
      descripcion: 'Los mejores shows de stand-up comedy',
      email: 'hola@comedianvivo.com',
      telefono: '+57 313 555 3456',
      ciudad: 'Bogotá',
      direccion: 'Calle 72 #10-34',
      logo: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=400',
      imagenBanner: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=1200',
      colorPrimario: '#FF6B35',
      colorSecundario: '#1F1F1F',
      tipoPlan: 'basic',
      redesSociales: {
        facebook: '',
        instagram: '@comedianvivo',
        twitter: '',
        tiktok: '@comedianvivo'
      }
    }
  ];

  const comercios = [];
  for (const comData of comerciosData) {
    const comercio = new Comercio(comData);
    await comercio.save();
    comercios.push(comercio);
    console.log(`   ${colors.green}✅${colors.reset} ${comercio.nombre} (${comercio.tipoPlan.toUpperCase()})`);
  }

  return comercios;
}

/**
 * Crear eventos con fechas y tiers
 */
async function crearEventos(comercios, categorias) {
  console.log(`\n${colors.blue}🎫 Creando eventos...${colors.reset}`);

  const eventosData = [
    // Producciones Rock Latino (Comercio 1)
    {
      comercioId: comercios[0].id,
      nombre: 'The Voidz en Bogotá',
      descripcion: 'Julian Casablancas y su banda The Voidz regresan a Colombia con su sonido experimental.',
      imagen: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200',
      ciudad: 'Bogotá',
      ubicacion: 'Teatro Colsubsidio Roberto Arias Pérez',
      destacado: true,
      categoriaIds: [categorias.find(c => c.slug === 'rock-underground').id],
      fechas: [
        {
          fecha: '2025-12-15',
          horaInicio: '20:00',
          horaFin: '23:00',
          aforoTotal: 500,
          tiers: [
            { nombre: 'General', descripcion: 'Acceso general al concierto', precio: 80000, cantidad: 300, orden: 1 },
            { nombre: 'VIP', descripcion: 'Zona preferencial + merchandise', precio: 150000, cantidad: 150, orden: 2 },
            { nombre: 'Meet & Greet', descripcion: 'VIP + encuentro con la banda', precio: 300000, cantidad: 50, orden: 3 }
          ]
        }
      ]
    },
    {
      comercioId: comercios[0].id,
      nombre: 'Rock al Parque 2025',
      descripcion: 'El festival de rock más grande de Colombia con bandas nacionales e internacionales.',
      imagen: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200',
      ciudad: 'Bogotá',
      ubicacion: 'Parque Simón Bolívar',
      destacado: true,
      categoriaIds: [
        categorias.find(c => c.slug === 'rock-underground').id,
        categorias.find(c => c.slug === 'festivales').id
      ],
      fechas: [
        {
          fecha: '2025-11-20',
          horaInicio: '12:00',
          horaFin: '23:00',
          aforoTotal: 800,
          tiers: [
            { nombre: 'Entrada Libre', descripcion: 'Acceso general al festival', precio: 0, cantidad: 800, orden: 1 }
          ]
        },
        {
          fecha: '2025-11-21',
          horaInicio: '12:00',
          horaFin: '23:00',
          aforoTotal: 800,
          tiers: [
            { nombre: 'Entrada Libre', descripcion: 'Acceso general al festival', precio: 0, cantidad: 800, orden: 1 }
          ]
        }
      ]
    },

    // Urban Beats Colombia (Comercio 2)
    {
      comercioId: comercios[1].id,
      nombre: 'Bad Bunny: Un Verano Sin Ti Tour',
      descripcion: 'El conejo malo llega a Medellín con su gira mundial.',
      imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
      ciudad: 'Medellín',
      ubicacion: 'Estadio Atanasio Girardot',
      destacado: true,
      categoriaIds: [categorias.find(c => c.slug === 'reggaeton-y-urbano').id],
      fechas: [
        {
          fecha: '2025-12-10',
          horaInicio: '19:00',
          horaFin: '23:00',
          aforoTotal: 700,
          tiers: [
            { nombre: 'Gramilla', descripcion: 'Cerca del escenario', precio: 200000, cantidad: 300, orden: 1 },
            { nombre: 'Tribuna', descripcion: 'Asientos con buena vista', precio: 350000, cantidad: 300, orden: 2 },
            { nombre: 'Palco VIP', descripcion: 'Palco privado + servicio', precio: 800000, cantidad: 100, orden: 3 }
          ]
        }
      ]
    },
    {
      comercioId: comercios[1].id,
      nombre: 'Karol G: Bichota Experience',
      descripcion: 'La Bichota en su tour más grande hasta la fecha.',
      imagen: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200',
      ciudad: 'Medellín',
      ubicacion: 'Estadio Atanasio Girardot',
      destacado: true,
      categoriaIds: [categorias.find(c => c.slug === 'reggaeton-y-urbano').id],
      fechas: [
        {
          fecha: '2025-11-25',
          horaInicio: '20:00',
          horaFin: '23:30',
          aforoTotal: 600,
          tiers: [
            { nombre: 'General', descripcion: 'Acceso general', precio: 180000, cantidad: 350, orden: 1 },
            { nombre: 'Golden', descripcion: 'Zona premium', precio: 320000, cantidad: 200, orden: 2 },
            { nombre: 'Diamante', descripcion: 'Lo mejor del show', precio: 650000, cantidad: 50, orden: 3 }
          ]
        }
      ]
    },

    // Festivales del Sur (Comercio 3)
    {
      comercioId: comercios[2].id,
      nombre: 'Vive Latino Colombia 2025',
      descripcion: 'El festival de música latina más importante llega a Cali.',
      imagen: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200',
      ciudad: 'Cali',
      ubicacion: 'Parque de la Caña',
      destacado: true,
      categoriaIds: [
        categorias.find(c => c.slug === 'festivales').id,
        categorias.find(c => c.slug === 'rock-underground').id
      ],
      fechas: [
        {
          fecha: '2025-12-05',
          horaInicio: '14:00',
          horaFin: '23:00',
          aforoTotal: 600,
          tiers: [
            { nombre: 'Pase 1 Día', descripcion: 'Acceso día 1', precio: 120000, cantidad: 400, orden: 1 },
            { nombre: 'VIP 1 Día', descripcion: 'VIP día 1', precio: 250000, cantidad: 200, orden: 2 }
          ]
        },
        {
          fecha: '2025-12-06',
          horaInicio: '14:00',
          horaFin: '23:00',
          aforoTotal: 600,
          tiers: [
            { nombre: 'Pase 1 Día', descripcion: 'Acceso día 2', precio: 120000, cantidad: 400, orden: 1 },
            { nombre: 'VIP 1 Día', descripcion: 'VIP día 2', precio: 250000, cantidad: 200, orden: 2 }
          ]
        }
      ]
    },
    {
      comercioId: comercios[2].id,
      nombre: 'Salsa al Parque 2025',
      descripcion: 'Festival gratuito de salsa con las mejores orquestas.',
      imagen: 'https://images.unsplash.com/photo-1504898770365-14faca1a5e98?w=1200',
      ciudad: 'Cali',
      ubicacion: 'Parque del Avión',
      destacado: false,
      categoriaIds: [
        categorias.find(c => c.slug === 'salsa-y-tropical').id,
        categorias.find(c => c.slug === 'festivales').id
      ],
      fechas: [
        {
          fecha: '2025-11-30',
          horaInicio: '15:00',
          horaFin: '22:00',
          aforoTotal: 500,
          tiers: [
            { nombre: 'Entrada Libre', descripcion: 'Gratis', precio: 0, cantidad: 500, orden: 1 }
          ]
        }
      ]
    },

    // Comedia en Vivo (Comercio 4)
    {
      comercioId: comercios[3].id,
      nombre: 'Franco Escamilla: Bienvenido al Mundo',
      descripcion: 'El comediante mexicano más famoso regresa a Colombia.',
      imagen: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200',
      ciudad: 'Bogotá',
      ubicacion: 'Movistar Arena',
      destacado: false,
      categoriaIds: [categorias.find(c => c.slug === 'comedia-y-stand-up').id],
      fechas: [
        {
          fecha: '2025-12-20',
          horaInicio: '19:00',
          horaFin: '21:30',
          aforoTotal: 400,
          tiers: [
            { nombre: 'Platea', descripcion: 'Asientos platea', precio: 90000, cantidad: 250, orden: 1 },
            { nombre: 'Palco', descripcion: 'Palcos laterales', precio: 150000, cantidad: 150, orden: 2 }
          ]
        }
      ]
    },
    {
      comercioId: comercios[3].id,
      nombre: 'Sofía Niño de Rivera: La Sobremesa',
      descripcion: 'Una noche de comedia irreverente con Sofía.',
      imagen: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=1200',
      ciudad: 'Bogotá',
      ubicacion: 'Teatro Julio Mario Santo Domingo',
      destacado: false,
      categoriaIds: [categorias.find(c => c.slug === 'comedia-y-stand-up').id],
      fechas: [
        {
          fecha: '2025-11-28',
          horaInicio: '20:00',
          horaFin: '22:00',
          aforoTotal: 300,
          tiers: [
            { nombre: 'General', descripcion: 'Asientos generales', precio: 70000, cantidad: 200, orden: 1 },
            { nombre: 'Preferencial', descripcion: 'Primeras filas', precio: 120000, cantidad: 100, orden: 2 }
          ]
        }
      ]
    }
  ];

  let eventosCreados = 0;
  let fechasCreadas = 0;
  let tiersCreados = 0;
  let boletosCreados = 0;

  for (const eventoData of eventosData) {
    try {
      // Crear evento
      const evento = new Evento({
        comercioId: eventoData.comercioId,
        nombre: eventoData.nombre,
        descripcion: eventoData.descripcion,
        imagen: eventoData.imagen,
        ciudad: eventoData.ciudad,
        ubicacion: eventoData.ubicacion,
        destacado: eventoData.destacado
      });

      await evento.save();
      eventosCreados++;

      // Asociar categorías
      if (eventoData.categoriaIds) {
        await evento.asociarCategorias(eventoData.categoriaIds);
      }

      // Crear fechas y tiers
      for (const fechaData of eventoData.fechas) {
        const fecha = new FechaEvento({
          eventoId: evento.id,
          fecha: fechaData.fecha,
          horaInicio: fechaData.horaInicio,
          horaFin: fechaData.horaFin,
          aforoTotal: fechaData.aforoTotal
        });

        await fecha.save();
        fechasCreadas++;

        // Crear tiers
        for (const tierData of fechaData.tiers) {
          const tier = new Tier({
            fechaEventoId: fecha.id,
            nombre: tierData.nombre,
            descripcion: tierData.descripcion,
            precio: tierData.precio,
            cantidad: tierData.cantidad,
            orden: tierData.orden
          });

          await tier.save(); // Esto también genera los boletos
          tiersCreados++;
          boletosCreados += tierData.cantidad;
        }

        // Actualizar aforo disponible de la fecha
        await fecha.actualizarAforoDisponible();
      }

      console.log(`   ${colors.green}✅${colors.reset} ${evento.nombre} ${evento.destacado ? '⭐' : ''}`);

    } catch (error) {
      console.log(`   ${colors.red}❌${colors.reset} Error: ${error.message}`);
    }
  }

  console.log(`\n   ${colors.green}📊 Resumen:${colors.reset}`);
  console.log(`      • ${eventosCreados} eventos creados`);
  console.log(`      • ${fechasCreadas} fechas creadas`);
  console.log(`      • ${tiersCreados} tiers creados`);
  console.log(`      • ${boletosCreados} boletos generados`);
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log(`${colors.yellow}⚠️  Este script eliminará TODOS los datos existentes.${colors.reset}`);
    console.log(`${colors.yellow}   Presiona Ctrl+C para cancelar o espera 3 segundos...${colors.reset}\n`);
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Limpiar colecciones
    await limpiarColecciones();

    // Crear datos
    const categorias = await crearCategorias();
    const comercios = await crearComercios();
    await crearEventos(comercios, categorias);

    console.log(`\n${colors.green}
╔═══════════════════════════════════════════════════════════╗
║             ✅ SEED COMPLETADO EXITOSAMENTE              ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

    console.log(`\n${colors.blue}📝 Resumen final:${colors.reset}`);
    console.log(`   • ${categorias.length} categorías`);
    console.log(`   • ${comercios.length} comercios`);
    console.log(`   • Eventos con múltiples fechas y tiers`);
    console.log(`   • Boletos individuales generados`);
    console.log(`\n${colors.green}✨ La base de datos está lista para usar!${colors.reset}\n`);

    process.exit(0);

  } catch (error) {
    console.error(`\n${colors.red}❌ Error en el seed:${colors.reset}`, error);
    process.exit(1);
  }
}

// Ejecutar
main();
