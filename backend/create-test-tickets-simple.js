#!/usr/bin/env node

/**
 * Script SIMPLIFICADO para crear tickets de prueba
 * Uso: node create-test-tickets-simple.js
 * 
 * IMPORTANTE: El usuario masterticketsas@gmail.com debe existir en Firebase Auth
 * Puedes crear el usuario haciendo login en el frontend primero
 */

const path = require('path');
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

// Datos del usuario
const USER_EMAIL = 'masterticketsas@gmail.com';
const USER_NAME = 'Master Tickets';

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

async function createTestTickets() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎫 CREADOR DE TICKETS DE PRUEBA (SIMPLIFICADO)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`📧 Email: ${USER_EMAIL}\n`);
    console.log('🔍 Buscando usuario en Firebase Auth...\n');
    
    // 1. Buscar el usuario en Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(USER_EMAIL);
      console.log(`✅ Usuario encontrado: ${userRecord.uid}`);
      console.log(`   Email: ${userRecord.email}`);
      console.log(`   Nombre: ${userRecord.displayName || '(sin nombre)'}\n`);
    } catch (error) {
      console.log(`\n❌ Usuario NO encontrado en Firebase Auth\n`);
      console.log('Para solucionar esto:');
      console.log('1. Ve a: http://localhost:3000/register');
      console.log(`2. Regístrate con: ${USER_EMAIL}`);
      console.log('3. Vuelve a ejecutar este script\n');
      console.log('O puedes crear el usuario manualmente en Firebase Console:');
      console.log('https://console.firebase.google.com/project/gradanegra-prod/authentication/users\n');
      process.exit(1);
    }

    const buyerId = userRecord.uid;

    // 2. Crear o actualizar el perfil de buyer
    const buyerRef = db.collection('buyers').doc(buyerId);
    const buyerDoc = await buyerRef.get();
    
    if (!buyerDoc.exists) {
      await buyerRef.set({
        email: USER_EMAIL,
        name: userRecord.displayName || USER_NAME,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Perfil de buyer creado en Firestore`);
    } else {
      console.log(`✅ Perfil de buyer ya existe en Firestore`);
    }

    // 3. Crear o buscar eventos
    console.log('\n📋 Procesando eventos...\n');
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
        console.log(`  ✅ Evento creado: ${eventData.name}`);
      } else {
        eventId = eventsQuery.docs[0].id;
        console.log(`  ✅ Evento encontrado: ${eventData.name}`);
      }
      eventIds.push({ id: eventId, ...eventData });
    }

    // 4. Crear tickets
    console.log('\n🎟️  Creando tickets...\n');
    const tickets = [];
    
    for (let i = 0; i < eventIds.length; i++) {
      const event = eventIds[i];
      const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${ticketNumber}`;
      
      const ticketData = {
        ticketNumber: ticketNumber,
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        eventLocation: event.location,
        buyerId: buyerId,
        buyerEmail: USER_EMAIL,
        buyerName: userRecord.displayName || USER_NAME,
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
      
      console.log(`  ${i + 1}. ${event.name}`);
      console.log(`     📍 ${event.location}`);
      console.log(`     📅 ${event.date.toLocaleDateString('es-MX', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`);
      console.log(`     💰 $${event.price} MXN`);
      console.log(`     🎫 ${ticketNumber}\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ¡Tickets creados exitosamente!\n');
    console.log(`👤 Usuario: ${USER_EMAIL}`);
    console.log(`🆔 UID: ${buyerId}`);
    console.log(`🎫 Total de tickets: ${tickets.length}`);
    console.log(`💰 Total: $${tickets.reduce((sum, t) => sum + t.price, 0)} MXN\n`);
    console.log('🚀 Próximos pasos:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`1. Ve a: http://localhost:3000/login`);
    console.log(`2. Inicia sesión con: ${USER_EMAIL}`);
    console.log(`3. Ve a "Mis Boletos": http://localhost:3000/mis-boletos`);
    console.log(`4. Deberías ver tus ${tickets.length} tickets de prueba\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creando tickets:', error.message);
    console.error('\nDetalles del error:', error);
    process.exit(1);
  }
}

createTestTickets();
