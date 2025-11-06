/**
 * Script de Seed Completo - Modelo de Datos Grada Negra
 * 
 * Este script crea:
 * 1. Categorías (9)
 * 2. Comercios (3)
 * 3. Eventos (30+)
 * 4. Fechas de Eventos
 * 5. Tiers por fecha
 * 6. Boletos por tier
 */

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

// Colores para logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.bright}${colors.cyan}[${step}]${colors.reset} ${colors.bright}${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`  ${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`  ${colors.red}✗${colors.reset} ${message}`);
}

function logInfo(message) {
  console.log(`  ${colors.blue}ℹ${colors.reset} ${colors.dim}${message}${colors.reset}`);
}

// ========================================
// 1. CATEGORÍAS
// ========================================

const categorias = [
  {
    slug: 'rock-underground',
    nombre: 'Rock Underground',
    nameAction: '¡Rockea con nosotros!',
    descripcion: 'Lo mejor del rock alternativo y underground',
    imagen: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&h=600&fit=crop',
    icono: 'music_note',
    status: 'activa'
  },
  {
    slug: 'electronica-oscuridad',
    nombre: 'Electrónica Oscuridad',
    nameAction: 'Sumérgete en la oscuridad',
    descripcion: 'Techno, house y electrónica experimental',
    imagen: 'https://images.unsplash.com/photo-1571266028243-d220c2f06d29?w=800&h=600&fit=crop',
    icono: 'nightlife',
    status: 'activa'
  },
  {
    slug: 'reggaeton-urbano',
    nombre: 'Reggaeton y Urbano',
    nameAction: '¡Perréale sin parar!',
    descripcion: 'Lo mejor del reggaeton y música urbana latina',
    imagen: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
    icono: 'album',
    status: 'activa'
  },
  {
    slug: 'salsa-tropical',
    nombre: 'Salsa y Tropical',
    nameAction: '¡A bailar salsa!',
    descripcion: 'Salsa, merengue, bachata y música tropical',
    imagen: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800&h=600&fit=crop',
    icono: 'music_note',
    status: 'activa'
  },
  {
    slug: 'comedia-stand-up',
    nombre: 'Comedia y Stand-Up',
    nameAction: 'Ríete sin parar',
    descripcion: 'Los mejores comediantes en vivo',
    imagen: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&h=600&fit=crop',
    icono: 'sentiment_very_satisfied',
    status: 'activa'
  },
  {
    slug: 'deportes-extremos',
    nombre: 'Deportes Extremos',
    nameAction: 'Vive la adrenalina',
    descripcion: 'BMX, skateboarding, parkour y más',
    imagen: 'https://images.unsplash.com/photo-1547841243-eacb14453cd9?w=800&h=600&fit=crop',
    icono: 'sports_soccer',
    status: 'activa'
  },
  {
    slug: 'gastronomia',
    nombre: 'Gastronomía',
    nameAction: 'Reserva y disfruta',
    descripcion: 'Festivales gastronómicos y experiencias culinarias',
    imagen: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
    icono: 'restaurant',
    status: 'activa'
  },
  {
    slug: 'festivales',
    nombre: 'Festivales',
    nameAction: 'Vive el festival',
    descripcion: 'Los mejores festivales de música y cultura',
    imagen: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop',
    icono: 'celebration',
    status: 'activa'
  },
  {
    slug: 'arte-cultura',
    nombre: 'Arte y Cultura',
    nameAction: 'Explora el arte',
    descripcion: 'Exposiciones, teatro, danza y performance',
    imagen: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop',
    icono: 'palette',
    status: 'activa'
  }
];

async function seedCategorias() {
  logStep('1/6', 'Creando Categorías');
  
  const batch = db.batch();
  const categoriasCreadas = [];

  for (const categoria of categorias) {
    const id = uuidv4();
    const categoriaData = {
      id,
      ...categoria,
      createdAt: new Date().toISOString()
    };

    const ref = db.collection('categorias').doc(id);
    batch.set(ref, categoriaData);
    categoriasCreadas.push(categoriaData);
    logSuccess(`${categoria.nombre} - "${categoria.nameAction}"`);
  }

  await batch.commit();
  logInfo(`Total: ${categoriasCreadas.length} categorías creadas`);
  
  return categoriasCreadas;
}

// ========================================
// 2. COMERCIOS
// ========================================

const comercios = [
  {
    nombre: 'Producciones Rock Latino',
    descripcion: 'Organizadores de los mejores eventos de rock en Colombia',
    email: 'contacto@prodrocklatino.com',
    telefono: '+57 310 555 1234',
    direccion: 'Calle 85 #15-25, Oficina 401',
    ciudad: 'Bogotá',
    logo: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
    imagenBanner: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=400&fit=crop',
    redesSociales: {
      facebook: 'https://facebook.com/prodrocklatino',
      instagram: '@prodrocklatino',
      twitter: '@prodrocklatino',
      tiktok: '@prodrocklatino'
    },
    colorPrimario: '#FF3333',
    colorSecundario: '#1A1A1A',
    tipoPlan: 'pro'
  },
  {
    nombre: 'Urban Beats Colombia',
    descripcion: 'Los mejores eventos de música urbana y reggaeton',
    email: 'info@urbanbeatscol.com',
    telefono: '+57 320 555 5678',
    direccion: 'Carrera 15 #93-85, Piso 8',
    ciudad: 'Medellín',
    logo: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
    imagenBanner: 'https://images.unsplash.com/photo-1571266028243-d220c2f06d29?w=1200&h=400&fit=crop',
    redesSociales: {
      facebook: 'https://facebook.com/urbanbeatscol',
      instagram: '@urbanbeatscol',
      twitter: '@urbanbeatscol',
      tiktok: '@urbanbeatscol'
    },
    colorPrimario: '#00D9FF',
    colorSecundario: '#FF00FF',
    tipoPlan: 'enterprise'
  },
  {
    nombre: 'Cultura y Eventos SA',
    descripcion: 'Organizadores de eventos culturales y gastronómicos',
    email: 'hola@culturayeventos.co',
    telefono: '+57 315 555 9012',
    direccion: 'Avenida El Poblado #10-20',
    ciudad: 'Cali',
    logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
    imagenBanner: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=400&fit=crop',
    redesSociales: {
      facebook: 'https://facebook.com/culturayeventos',
      instagram: '@culturayeventos',
      twitter: '@culturayeventos',
      tiktok: ''
    },
    colorPrimario: '#8B4513',
    colorSecundario: '#F4A460',
    tipoPlan: 'basic'
  }
];

async function seedComercios() {
  logStep('2/6', 'Creando Comercios (Organizadores)');
  
  const batch = db.batch();
  const comerciosCreados = [];

  for (const comercio of comercios) {
    const id = uuidv4();
    const slug = comercio.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const limites = {
      free: { eventos: 2, comision: 10.0 },
      basic: { eventos: 10, comision: 7.0 },
      pro: { eventos: 50, comision: 5.0 },
      enterprise: { eventos: -1, comision: 3.0 }
    };

    const comercioData = {
      id,
      ...comercio,
      slug,
      pais: 'Colombia',
      limiteEventos: limites[comercio.tipoPlan].eventos,
      comision: limites[comercio.tipoPlan].comision,
      status: 'activo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    const ref = db.collection('comercios').doc(id);
    batch.set(ref, comercioData);
    comerciosCreados.push(comercioData);
    logSuccess(`${comercio.nombre} (Plan: ${comercio.tipoPlan})`);
    logInfo(`  Slug: ${slug} | Ciudad: ${comercio.ciudad}`);
  }

  await batch.commit();
  logInfo(`Total: ${comerciosCreados.length} comercios creados`);
  
  return comerciosCreados;
}

// ========================================
// 3. EVENTOS
// ========================================

async function seedEventos(comerciosCreados, categoriasCreadas) {
  logStep('3/6', 'Creando Eventos');
  
  const eventos = [
    // Eventos de Producciones Rock Latino (PRO)
    {
      comercioId: comerciosCreados[0].id,
      nombre: 'The Strokes Live in Bogotá',
      descripcion: 'La legendaria banda neoyorquina regresa a Colombia con su gira mundial 2025',
      imagen: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&h=800&fit=crop',
      ciudad: 'Bogotá',
      ubicacion: 'Movistar Arena',
      destacado: true,
      categorias: ['rock-underground']
    },
    {
      comercioId: comerciosCreados[0].id,
      nombre: 'Arctic Monkeys Colombia Tour',
      descripcion: 'Una noche inolvidable con los reyes del indie rock británico',
      imagen: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=800&fit=crop',
      ciudad: 'Medellín',
      ubicacion: 'Coliseo Iván de Bedout',
      destacado: true,
      categorias: ['rock-underground']
    },
    {
      comercioId: comerciosCreados[0].id,
      nombre: 'Festival Rock al Parque 2025',
      descripcion: 'El festival gratuito más grande de rock en Latinoamérica',
      imagen: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=800&fit=crop',
      ciudad: 'Bogotá',
      ubicacion: 'Parque Simón Bolívar',
      destacado: true,
      categorias: ['rock-underground', 'festivales']
    },
    {
      comercioId: comerciosCreados[0].id,
      nombre: 'Café Tacvba Acústico',
      descripcion: 'Concierto íntimo en formato acústico',
      imagen: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=800&fit=crop',
      ciudad: 'Cali',
      ubicacion: 'Teatro Jorge Isaacs',
      destacado: false,
      categorias: ['rock-underground']
    },

    // Eventos de Urban Beats Colombia (ENTERPRISE)
    {
      comercioId: comerciosCreados[1].id,
      nombre: 'Bad Bunny: Un Verano Sin Ti Tour',
      descripcion: 'El conejo malo llega a Colombia con su gira más esperada',
      imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&h=800&fit=crop',
      ciudad: 'Medellín',
      ubicacion: 'Estadio Atanasio Girardot',
      destacado: true,
      categorias: ['reggaeton-urbano', 'festivales']
    },
    {
      comercioId: comerciosCreados[1].id,
      nombre: 'Karol G: Bichota Experience',
      descripcion: 'La Bichota Mayor en un show espectacular',
      imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=800&fit=crop',
      ciudad: 'Bogotá',
      ubicacion: 'Estadio El Campín',
      destacado: true,
      categorias: ['reggaeton-urbano']
    },
    {
      comercioId: comerciosCreados[1].id,
      nombre: 'Feid: Ferxxocalipsis Tour',
      descripcion: 'El Ferxxo en concierto',
      imagen: 'https://images.unsplash.com/photo-1571266028243-d220c2f06d29?w=1200&h=800&fit=crop',
      ciudad: 'Medellín',
      ubicacion: 'Coliseo Iván de Bedout',
      destacado: true,
      categorias: ['reggaeton-urbano']
    },
    {
      comercioId: comerciosCreados[1].id,
      nombre: 'Techno Underground Night',
      descripcion: 'La mejor música electrónica experimental',
      imagen: 'https://images.unsplash.com/photo-1571266028243-d220c2f06d29?w=1200&h=800&fit=crop',
      ciudad: 'Bogotá',
      ubicacion: 'Warehouse District',
      destacado: false,
      categorias: ['electronica-oscuridad']
    },

    // Eventos de Cultura y Eventos SA (BASIC)
    {
      comercioId: comerciosCreados[2].id,
      nombre: 'Festival Gourmet Internacional',
      descripcion: 'Los mejores chefs del mundo en Cali',
      imagen: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=800&fit=crop',
      ciudad: 'Cali',
      ubicacion: 'Centro de Eventos Valle del Pacífico',
      destacado: false,
      categorias: ['gastronomia', 'festivales']
    },
    {
      comercioId: comerciosCreados[2].id,
      nombre: 'Franco Escamilla: Payaso Tour',
      descripcion: 'El comediante mexicano más famoso en Colombia',
      imagen: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&h=800&fit=crop',
      ciudad: 'Bogotá',
      ubicacion: 'Coliseo MedPlus',
      destacado: false,
      categorias: ['comedia-stand-up']
    },
    {
      comercioId: comerciosCreados[2].id,
      nombre: 'Exposición de Arte Contemporáneo',
      descripcion: 'Obras de artistas latinoamericanos emergentes',
      imagen: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&h=800&fit=crop',
      ciudad: 'Cali',
      ubicacion: 'Museo La Tertulia',
      destacado: false,
      categorias: ['arte-cultura']
    },
    {
      comercioId: comerciosCreados[2].id,
      nombre: 'Festival de Salsa Caleña',
      descripcion: 'La mejor salsa del mundo en su cuna',
      imagen: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=1200&h=800&fit=crop',
      ciudad: 'Cali',
      ubicacion: 'Plaza de Toros Cañaveralejo',
      destacado: false,
      categorias: ['salsa-tropical', 'festivales']
    }
  ];

  const batch = db.batch();
  const eventosCreados = [];

  for (const evento of eventos) {
    const id = uuidv4();
    const eventoData = {
      id,
      comercioId: evento.comercioId,
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      imagen: evento.imagen,
      ciudad: evento.ciudad,
      ubicacion: evento.ubicacion,
      destacado: evento.destacado,
      status: 'activo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    const ref = db.collection('eventos').doc(id);
    batch.set(ref, eventoData);
    eventosCreados.push({ ...eventoData, categorias: evento.categorias });
    
    const destacadoLabel = evento.destacado ? colors.yellow + '★ DESTACADO' + colors.reset : '';
    logSuccess(`${evento.nombre} ${destacadoLabel}`);
    logInfo(`  ${evento.ciudad} | ${evento.ubicacion}`);
  }

  await batch.commit();
  logInfo(`Total: ${eventosCreados.length} eventos creados`);
  
  return eventosCreados;
}

// ========================================
// 4. RELACIÓN EVENTOS-CATEGORÍAS
// ========================================

async function seedEventosCategorias(eventosCreados, categoriasCreadas) {
  logStep('4/6', 'Creando Relaciones Eventos-Categorías');
  
  const batch = db.batch();
  let relacionesCreadas = 0;

  for (const evento of eventosCreados) {
    for (const categoriaSlug of evento.categorias) {
      const categoria = categoriasCreadas.find(c => c.slug === categoriaSlug);
      if (categoria) {
        const id = uuidv4();
        const relacionData = {
          id,
          eventoId: evento.id,
          categoriaId: categoria.id,
          createdAt: new Date().toISOString()
        };

        const ref = db.collection('eventos_categorias').doc(id);
        batch.set(ref, relacionData);
        relacionesCreadas++;
      }
    }
  }

  await batch.commit();
  logSuccess(`${relacionesCreadas} relaciones evento-categoría creadas`);
}

// ========================================
// 5. FECHAS DE EVENTOS
// ========================================

async function seedFechasEventos(eventosCreados) {
  logStep('5/6', 'Creando Fechas de Eventos y Tiers');
  
  const fechasCreadas = [];

  for (const evento of eventosCreados) {
    // Crear 1-3 fechas por evento
    const numFechas = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numFechas; i++) {
      const fechaId = uuidv4();
      
      // Fecha futura aleatoria (entre 1 y 90 días)
      const diasAdelante = Math.floor(Math.random() * 90) + 1;
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + diasAdelante);
      
      const fechaData = {
        id: fechaId,
        eventoId: evento.id,
        fecha: fecha.toISOString().split('T')[0],
        horaInicio: '20:00',
        horaFin: '23:59',
        aforoTotal: 5000,
        aforoDisponible: 5000,
        status: 'activa',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      };

      await db.collection('fechas_evento').doc(fechaId).set(fechaData);
      fechasCreadas.push(fechaData);
      
      // Crear tiers para esta fecha
      await seedTiersPorFecha(fechaId, evento.nombre);
    }
  }

  logInfo(`Total: ${fechasCreadas.length} fechas de eventos creadas`);
  return fechasCreadas;
}

// ========================================
// 6. TIERS Y BOLETOS
// ========================================

async function seedTiersPorFecha(fechaEventoId, nombreEvento) {
  const tiers = [
    {
      nombre: 'General',
      descripcion: 'Acceso general al evento',
      precio: 50000,
      cantidad: 3000,
      orden: 1
    },
    {
      nombre: 'VIP',
      descripcion: 'Acceso preferencial + bebida de cortesía',
      precio: 120000,
      cantidad: 1500,
      orden: 2
    },
    {
      nombre: 'Palco',
      descripcion: 'Zona exclusiva con la mejor vista',
      precio: 250000,
      cantidad: 500,
      orden: 3
    }
  ];

  for (const tier of tiers) {
    const tierId = uuidv4();
    const tierData = {
      id: tierId,
      fechaEventoId,
      nombre: tier.nombre,
      descripcion: tier.descripcion,
      precio: tier.precio,
      cantidad: tier.cantidad,
      disponibles: tier.cantidad,
      orden: tier.orden,
      status: 'activo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    await db.collection('tiers').doc(tierId).set(tierData);
    
    // Crear boletos para este tier
    await seedBoletosPorTier(tierId, tier.cantidad, tier.precio);
    
    logSuccess(`  ${tier.nombre} - ${tier.cantidad} boletos - $${tier.precio.toLocaleString()}`);
  }
}

async function seedBoletosPorTier(tierId, cantidad, precio) {
  const batch = db.batch();
  
  for (let i = 0; i < cantidad; i++) {
    const boletoId = uuidv4();
    const numeroBoleto = `GN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const hash = require('crypto').createHash('sha256').update(numeroBoleto + boletoId).digest('hex');
    
    const boletoData = {
      id: boletoId,
      tierId,
      compraId: null,
      numeroBoleto,
      codigoQR: `https://gradanegra.com/validar/${hash}`,
      hash,
      precio,
      status: 'disponible',
      fechaUso: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const ref = db.collection('boletos').doc(boletoId);
    batch.set(ref, boletoData);
  }

  await batch.commit();
}

// ========================================
// FUNCIÓN PRINCIPAL
// ========================================

async function seedCompleteModel() {
  log('\n╔══════════════════════════════════════════════════════════════╗', 'bright');
  log('║      GRADA NEGRA - SEED MODELO DE DATOS COMPLETO            ║', 'bright');
  log('╚══════════════════════════════════════════════════════════════╝\n', 'bright');

  try {
    const startTime = Date.now();

    // 1. Categorías
    const categoriasCreadas = await seedCategorias();

    // 2. Comercios
    const comerciosCreados = await seedComercios();

    // 3. Eventos
    const eventosCreados = await seedEventos(comerciosCreados, categoriasCreadas);

    // 4. Relación Eventos-Categorías
    await seedEventosCategorias(eventosCreados, categoriasCreadas);

    // 5. Fechas, Tiers y Boletos
    await seedFechasEventos(eventosCreados);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    log('\n╔══════════════════════════════════════════════════════════════╗', 'green');
    log('║                  ✓ SEED COMPLETADO EXITOSAMENTE             ║', 'green');
    log('╚══════════════════════════════════════════════════════════════╝\n', 'green');

    log(`${colors.bright}Resumen:${colors.reset}`);
    log(`  • Categorías: ${colors.cyan}${categoriasCreadas.length}${colors.reset}`);
    log(`  • Comercios: ${colors.cyan}${comerciosCreados.length}${colors.reset}`);
    log(`  • Eventos: ${colors.cyan}${eventosCreados.length}${colors.reset}`);
    log(`  • Eventos destacados: ${colors.yellow}${eventosCreados.filter(e => e.destacado).length}${colors.reset}`);
    log(`  • Tiempo total: ${colors.green}${duration}s${colors.reset}\n`);

    log(`${colors.dim}Puedes verificar los datos en Firebase Console:${colors.reset}`);
    log(`${colors.blue}https://console.firebase.google.com${colors.reset}\n`);

    process.exit(0);
  } catch (error) {
    logError(`\nError durante el seed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
seedCompleteModel();
