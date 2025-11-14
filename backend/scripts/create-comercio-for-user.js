#!/usr/bin/env node

/**
 * Script para crear un comercio y asociarlo a un usuario de Firebase
 * Uso: node scripts/create-comercio-for-user.js
 */

const { db, admin } = require('../src/config/firebase');

async function createComercioForUser() {
  try {
    console.log('🚀 Iniciando creación de comercio...\n');

    // Datos del usuario
    const userId = 'JCtjgVYHDwcf1Q5sqnJ8rLRofLC3'; // arjul1989@gmail.com
    const userEmail = 'arjul1989@gmail.com';

    // Verificar si el usuario ya tiene un comercio
    const existingComercio = await db.collection('comercios')
      .where('ownerId', '==', userId)
      .limit(1)
      .get();

    if (!existingComercio.empty) {
      console.log('⚠️  El usuario ya tiene un comercio asociado:');
      const comercio = existingComercio.docs[0];
      console.log(JSON.stringify({ id: comercio.id, ...comercio.data() }, null, 2));
      return;
    }

    // Datos del comercio
    const comercioData = {
      nombre: 'Grada Negra Demo',
      slug: 'grada-negra-demo',
      descripcion: 'Comercio de demostración para Grada Negra',
      email: userEmail,
      telefono: '+57 300 123 4567',
      ownerId: userId,
      
      // Dirección
      direccion: {
        calle: 'Calle 123',
        ciudad: 'Bogotá',
        departamento: 'Cundinamarca',
        pais: 'Colombia',
        codigoPostal: '110111'
      },

      // Configuración
      configuracion: {
        moneda: 'COP',
        idioma: 'es',
        zonaHoraria: 'America/Bogota',
        comision: 10, // 10% de comisión
        iva: 19 // 19% IVA
      },

      // Branding
      branding: {
        logo: 'https://via.placeholder.com/200x200?text=Grada+Negra',
        colorPrimario: '#FF6B35',
        colorSecundario: '#004E89',
        colorFondo: '#FFFFFF'
      },

      // Plan y límites
      plan: 'premium',
      limites: {
        eventosMaximos: 100,
        boletosMaximos: 10000,
        usuariosMaximos: 10
      },

      // Estado
      status: 'activo',
      verificado: true,

      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deletedAt: null
    };

    // Crear comercio
    const comercioRef = await db.collection('comercios').add(comercioData);
    console.log('✅ Comercio creado exitosamente!');
    console.log(`   ID: ${comercioRef.id}`);
    console.log(`   Nombre: ${comercioData.nombre}`);
    console.log(`   Owner: ${userEmail} (${userId})`);
    console.log(`   Plan: ${comercioData.plan}`);

    // Crear relación en usuarios_comercios (opcional, para compatibilidad)
    await db.collection('usuarios_comercios').add({
      userId: userId,
      comercioId: comercioRef.id,
      rol: 'owner',
      permisos: ['all'],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Relación usuario-comercio creada');

    // Obtener el comercio completo
    const comercioDoc = await comercioRef.get();
    console.log('\n📊 Datos del comercio:');
    console.log(JSON.stringify({ id: comercioDoc.id, ...comercioDoc.data() }, null, 2));

    console.log('\n🎉 ¡Listo! Ahora puedes iniciar sesión en:');
    console.log('   https://gradanegra-frontend-350907539319.us-central1.run.app/panel/login');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar
createComercioForUser()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
