require('dotenv').config();
const admin = require('firebase-admin');
const { db, initializeFirebase } = require('../src/config/firebase');

// Inicializar Firebase
initializeFirebase();

// Imágenes válidas de Unsplash para eventos de música y conciertos
const validImages = {
  // Rock
  'rock-1': 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&h=800&fit=crop', // Concierto rock
  'rock-2': 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=800&fit=crop', // Festival rock
  'rock-3': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=800&fit=crop', // Guitarra eléctrica
  'rock-4': 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=800&fit=crop', // Festival multitud
  
  // Reggaeton/Urbano
  'urban-1': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=800&fit=crop', // DJ/Concierto
  'urban-2': 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&h=800&fit=crop', // Micrófono/Show
  'urban-3': 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=1200&h=800&fit=crop', // Luces concierto
  
  // General/Multitud
  'crowd-1': 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&h=800&fit=crop', // Multitud concierto
  'crowd-2': 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&h=800&fit=crop', // Festival día
  'crowd-3': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop', // Manos arriba
  
  // Electrónica
  'electronic-1': 'https://images.unsplash.com/photo-1571266028243-d220c2f06d29?w=1200&h=800&fit=crop', // DJ setup
  'electronic-2': 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=1200&h=800&fit=crop', // Luces club
};

const eventImageMap = {
  'The Strokes Live in Bogotá': validImages['rock-1'],
  'Arctic Monkeys Colombia Tour': validImages['rock-2'],
  'Festival Rock al Parque 2025': validImages['rock-4'],
  'Café Tacvba Acústico': validImages['rock-3'],
  
  'Bad Bunny: Un Verano Sin Ti Tour': validImages['urban-1'],
  'Karol G: Bichota Experience': validImages['urban-2'],
  'Feid: Ferxxocalipsis Tour': validImages['urban-3'],
  'J Balvin: Vibras Experience': validImages['urban-1'],
  
  'Cali Salsa Festival 2025': validImages['crowd-2'],
  'Aventura: Romeo Santos Tour': validImages['crowd-1'],
  'Marc Anthony Live': validImages['crowd-3'],
  
  'Medellín Comedy Fest': validImages['crowd-1'],
};

async function fixEventImages() {
  console.log('🔧 Actualizando imágenes de eventos...\n');
  
  try {
    // Obtener todos los eventos
    const eventosSnapshot = await db.collection('eventos')
      .where('deletedAt', '==', null)
      .get();
    
    let updated = 0;
    const batch = db.batch();
    
    for (const doc of eventosSnapshot.docs) {
      const evento = doc.data();
      const newImage = eventImageMap[evento.nombre];
      
      if (newImage && newImage !== evento.imagen) {
        batch.update(doc.ref, { 
          imagen: newImage,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✓ ${evento.nombre}`);
        console.log(`  Anterior: ${evento.imagen}`);
        console.log(`  Nueva: ${newImage}\n`);
        updated++;
      }
    }
    
    if (updated > 0) {
      await batch.commit();
      console.log(`\n✅ ${updated} eventos actualizados exitosamente`);
    } else {
      console.log('ℹ️  No hay imágenes para actualizar');
    }
    
  } catch (error) {
    console.error('❌ Error actualizando imágenes:', error);
    throw error;
  }
}

// Ejecutar
fixEventImages()
  .then(() => {
    console.log('\n✨ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
