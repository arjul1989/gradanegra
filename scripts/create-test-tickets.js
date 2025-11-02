#!/usr/bin/env node

/**
 * Script para crear tickets de prueba para un usuario
 * Uso: node scripts/create-test-tickets.js <email>
 */

const path = require('path');

// Cambiar al directorio del backend para tener acceso a node_modules
process.chdir(path.join(__dirname, '../backend'));

const admin = require('firebase-admin');

// Cargar variables de entorno
require('dotenv').config();

// Inicializar Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

// Eventos de ejemplo
const sampleEvents = [
  {
    name: 'Clásico Regio - Monterrey vs Tigres',
    date: new Date('2025-11-15T20:00:00'),
    location: 'Estadio BBVA',
    category: 'futbol',
    price: 450
  },
  {
    name: 'Concierto Grupo Firme',
    date: new Date('2025-11-22T21:00:00'),
    location: 'Arena Monterrey',
    category: 'conciertos',
    price: 800
  },
  {
    name: 'América vs Chivas',
    date: new Date('2025-11-30T19:00:00'),
    location: 'Estadio Azteca',
    category: 'futbol',
    price: 550
  },
  {
    name: 'Bad Bunny World Tour',
    date: new Date('2025-12-05T20:30:00'),
    location: 'Foro Sol',
    category: 'conciertos',
    price: 1200
  },
  {
    name: 'Cruz Azul vs Pumas',
    date: new Date('2025-12-10T18:00:00'),
    location: 'Estadio Azteca',
    category: 'futbol',
    price: 400
  }
];

async function createTestTickets(email) {
  try {
    console.log('🎫 Creando tickets de prueba...\n');
    
    // 1. Buscar o crear el usuario en Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`✅ Usuario encontrado: ${userRecord.uid}`);
    } catch (error) {
      console.log(`⚠️  Usuario no encontrado, creándolo...`);
      userRecord = await admin.auth().createUser({
        email: email,
        emailVerified: true,
        displayName: email.split('@')[0]
      });
      console.log(`✅ Usuario creado: ${userRecord.uid}`);
    }

    const buyerId = userRecord.uid;

    // 2. Buscar o crear el perfil de buyer
    const buyerRef = db.collection('buyers').doc(buyerId);
    const buyerDoc = await buyerRef.get();
    
    if (!buyerDoc.exists) {
      await buyerRef.set({
        email: email,
        name: userRecord.displayName || email.split('@')[0],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Perfil de buyer creado`);
    } else {
      console.log(`✅ Perfil de buyer ya existe`);
    }

    // 3. Buscar o crear eventos
    const eventIds = [];
    for (const eventData of sampleEvents) {
      const eventsQuery = await db.collection('events')
        .where('name', '==', eventData.name)
        .limit(1)
        .get();

      let eventId;
      if (eventsQuery.empty) {
        const eventRef = await db.collection('events').add({
          ...eventData,
          description: `Evento de prueba: ${eventData.name}`,
          image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800',
          venue: eventData.location,
          capacity: 1000,
          availableTickets: 900,
          status: 'active',
          featured: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        eventId = eventRef.id;
        console.log(`✅ Evento creado: ${eventData.name} (${eventId})`);
      } else {
        eventId = eventsQuery.docs[0].id;
        console.log(`✅ Evento encontrado: ${eventData.name} (${eventId})`);
      }
      eventIds.push({ id: eventId, ...eventData });
    }

    // 4. Crear tickets
    console.log('\n🎟️  Creando tickets...\n');
    const tickets = [];
    
    for (let i = 0; i < eventIds.length; i++) {
      const event = eventIds[i];
      const ticketNumber = `TICKET-${Date.now()}-${i + 1}`;
      const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketNumber}`;
      
      const ticketData = {
        ticketNumber: ticketNumber,
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        eventLocation: event.location,
        buyerId: buyerId,
        buyerEmail: email,
        buyerName: userRecord.displayName || email.split('@')[0],
        price: event.price,
        quantity: 1,
        status: 'active',
        qrCode: qrCode,
        purchaseDate: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const ticketRef = await db.collection('tickets').add(ticketData);
      tickets.push({ id: ticketRef.id, ...ticketData });
      
      console.log(`  ✅ Ticket ${i + 1}/5: ${event.name}`);
      console.log(`     Número: ${ticketNumber}`);
      console.log(`     Precio: $${event.price} MXN`);
      console.log(`     Fecha: ${event.date.toLocaleDateString('es-MX')}`);
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ¡Tickets creados exitosamente!\n');
    console.log(`👤 Usuario: ${email}`);
    console.log(`🎫 Total de tickets: ${tickets.length}`);
    console.log(`💰 Total gastado: $${tickets.reduce((sum, t) => sum + t.price, 0)} MXN\n`);
    console.log('Ahora puedes:');
    console.log('1. Iniciar sesión con: masterticketsas@gmail.com');
    console.log('2. Ir a "Mis Boletos" en: http://localhost:3000/mis-boletos');
    console.log('3. Ver tus 5 tickets de prueba');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando tickets:', error);
    process.exit(1);
  }
}

// Obtener email del argumento o usar default
const email = process.argv[2] || 'masterticketsas@gmail.com';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎫 CREADOR DE TICKETS DE PRUEBA');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`📧 Email: ${email}\n`);

createTestTickets(email);
