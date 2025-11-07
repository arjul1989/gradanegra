/**
 * Script para crear usuarios administradores
 * Asigna custom claims en Firebase Auth: admin: true, adminRole: <role>
 * 
 * Uso:
 * node scripts/create-admin-user.js email@example.com super_admin
 * 
 * Roles permitidos:
 * - super_admin: Acceso total (gestión comercios, planes, comisiones, reportes)
 * - finance_admin: Acceso a reportes financieros y comisiones
 * - support_admin: Acceso a gestión de comercios (sin modificar planes/comisiones)
 */

const admin = require('firebase-admin');
const serviceAccount = require('../config/serviceAccountKey.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const ROLES_PERMITIDOS = ['super_admin', 'finance_admin', 'support_admin'];

async function createAdminUser(email, role) {
  try {
    // Validar rol
    if (!ROLES_PERMITIDOS.includes(role)) {
      console.error(`❌ Rol inválido: ${role}`);
      console.log(`Roles permitidos: ${ROLES_PERMITIDOS.join(', ')}`);
      process.exit(1);
    }

    // Buscar usuario por email
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log(`✓ Usuario encontrado: ${user.uid}`);
    } catch (error) {
      console.error(`❌ Usuario con email ${email} no encontrado en Firebase Auth`);
      console.log('Primero crea el usuario en Firebase Auth o en la aplicación web');
      process.exit(1);
    }

    // Verificar claims actuales
    const currentClaims = user.customClaims || {};
    if (currentClaims.admin) {
      console.log(`⚠️  El usuario ya es administrador (role: ${currentClaims.adminRole})`);
      console.log('¿Deseas actualizar el rol? Continuando...');
    }

    // Asignar custom claims
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
      adminRole: role
    });

    console.log('');
    console.log('✅ Custom claims asignados exitosamente');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${email}`);
    console.log(`🆔 UID: ${user.uid}`);
    console.log(`👤 Rol: ${role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('⚠️  IMPORTANTE: El usuario debe cerrar sesión y volver a iniciar sesión');
    console.log('   para que los cambios surtan efecto. Los tokens existentes no se');
    console.log('   actualizan automáticamente.');
    console.log('');
    console.log('🔐 Permisos por rol:');
    console.log('');
    
    const permisos = {
      super_admin: [
        '✓ Gestión completa de comercios (activar/desactivar/suspender)',
        '✓ Configuración de planes custom',
        '✓ Modificación de límites (eventos, usuarios, destacados)',
        '✓ Configuración de comisiones personalizadas',
        '✓ Reportes financieros y exportación',
        '✓ Visualización de dashboard con métricas'
      ],
      finance_admin: [
        '✓ Reportes financieros y comisiones',
        '✓ Exportación de reportes',
        '✓ Visualización de métricas de ingresos',
        '✗ Sin acceso a gestión de comercios',
        '✗ Sin acceso a configuración de planes'
      ],
      support_admin: [
        '✓ Visualización de comercios y eventos',
        '✓ Activar/desactivar comercios',
        '✓ Visualización de métricas básicas',
        '✗ Sin acceso a configuración de planes',
        '✗ Sin acceso a modificar comisiones',
        '✗ Sin acceso a reportes financieros'
      ]
    };

    permisos[role].forEach(permiso => console.log(`   ${permiso}`));
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando administrador:', error);
    process.exit(1);
  }
}

// Validar argumentos
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.log('');
  console.log('📋 Uso: node scripts/create-admin-user.js <email> <role>');
  console.log('');
  console.log('Ejemplos:');
  console.log('  node scripts/create-admin-user.js admin@gradanegra.com super_admin');
  console.log('  node scripts/create-admin-user.js finanzas@gradanegra.com finance_admin');
  console.log('  node scripts/create-admin-user.js soporte@gradanegra.com support_admin');
  console.log('');
  console.log('Roles disponibles:');
  console.log('  - super_admin: Acceso total al panel de administración');
  console.log('  - finance_admin: Solo reportes financieros y comisiones');
  console.log('  - support_admin: Gestión de comercios (sin planes/comisiones)');
  console.log('');
  process.exit(1);
}

const [email, role] = args;

// Ejecutar
createAdminUser(email, role);
