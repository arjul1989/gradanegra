#!/usr/bin/env node

/**
 * Script para crear un tenant desde la línea de comandos
 * Uso: node scripts/create-tenant.js
 */

const readline = require('readline');
const { db, admin } = require('../backend/src/config/firebase');
const Tenant = require('../backend/src/models/Tenant');
const User = require('../backend/src/models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createTenant() {
  try {
    console.log('\n🏢 === Crear Nuevo Tenant (Comercio) ===\n');

    // Datos del tenant
    const name = await question('Nombre del comercio: ');
    if (!name || name.trim().length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }

    const email = await question('Email del comercio: ');
    if (!email || !email.includes('@')) {
      throw new Error('Email inválido');
    }

    // Verificar si el email ya existe
    const existingTenant = await Tenant.findByEmail(email);
    if (existingTenant) {
      throw new Error('Ya existe un comercio con ese email');
    }

    const logoUrl = await question('URL del logo (opcional, presiona Enter para omitir): ');

    // Generar slug único
    let slug = Tenant.generateSlug(name);
    let existingSlug = await Tenant.findBySlug(slug);
    let counter = 1;
    
    while (existingSlug) {
      slug = `${Tenant.generateSlug(name)}-${counter}`;
      existingSlug = await Tenant.findBySlug(slug);
      counter++;
    }

    console.log(`\n📝 Slug generado: ${slug}`);

    // Crear tenant
    const tenant = new Tenant({
      name: name.trim(),
      slug,
      email: email.trim(),
      logoUrl: logoUrl.trim() || null,
      status: 'active'
    });

    await tenant.save();

    console.log(`\n✅ Tenant creado exitosamente!`);
    console.log(`   ID: ${tenant.id}`);
    console.log(`   Nombre: ${tenant.name}`);
    console.log(`   Slug: ${tenant.slug}`);
    console.log(`   Email: ${tenant.email}`);
    console.log(`   Plan: ${tenant.subscription.plan}`);
    console.log(`   Max Eventos: ${tenant.subscription.maxEvents}`);

    // Preguntar si quiere crear un admin
    const createAdmin = await question('\n¿Deseas crear un administrador para este tenant? (s/n): ');

    if (createAdmin.toLowerCase() === 's' || createAdmin.toLowerCase() === 'si') {
      console.log('\n👤 === Crear Administrador del Tenant ===\n');

      const adminEmail = await question('Email del admin: ');
      if (!adminEmail || !adminEmail.includes('@')) {
        throw new Error('Email inválido');
      }

      const adminPassword = await question('Contraseña (mínimo 6 caracteres): ');
      if (!adminPassword || adminPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      const adminName = await question('Nombre del admin: ');

      // Crear usuario en Firebase Auth
      const firebaseUser = await admin.auth().createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: adminName || tenant.name
      });

      // Crear usuario en Firestore
      const tenantAdmin = new User({
        firebaseUid: firebaseUser.uid,
        email: adminEmail,
        displayName: adminName || tenant.name,
        role: 'tenant_admin',
        tenantId: tenant.id,
        permissions: ['manage_events', 'manage_tickets', 'view_reports'],
        isActive: true
      });

      await tenantAdmin.save();

      console.log(`\n✅ Administrador creado exitosamente!`);
      console.log(`   ID: ${tenantAdmin.id}`);
      console.log(`   Firebase UID: ${tenantAdmin.firebaseUid}`);
      console.log(`   Email: ${tenantAdmin.email}`);
      console.log(`   Rol: ${tenantAdmin.role}`);
      console.log(`   Permisos: ${tenantAdmin.permissions.join(', ')}`);

      console.log('\n📧 El administrador puede iniciar sesión con:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Contraseña: ${adminPassword}`);
    }

    console.log('\n🎉 ¡Proceso completado!\n');

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Ejecutar
createTenant();
