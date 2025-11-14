#!/usr/bin/env node

/**
 * Script para limpiar completamente la base de datos
 * Elimina TODOS los datos excepto el superadmin especificado
 * 
 * USO: node backend/scripts/clean-database.js --confirm
 */

const admin = require('firebase-admin')

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'gradanegra-prod'
  })
}

const db = admin.firestore()
const auth = admin.auth()

// Email del superadmin que NO se debe eliminar
const SUPERADMIN_EMAIL = 'arjul1989@gmail.com'

// Colecciones a limpiar
const COLLECTIONS_TO_CLEAN = [
  'comercios',
  'eventos',
  'boletos',
  'compras',
  'fechasEvento',
  'tiers',
  'cupones',
  'usuarios-comercios',
  'categorias',
  'buyers',
  'admin_logs'
]

async function deleteCollection(collectionPath, batchSize = 500) {
  const collectionRef = db.collection(collectionPath)
  let deletedCount = 0

  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get()
    
    if (snapshot.size === 0) {
      break
    }

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    
    await batch.commit()
    deletedCount += snapshot.size
    process.stdout.write('.')
  }

  return deletedCount
}

async function getSuperadminUid() {
  try {
    const userRecord = await auth.getUserByEmail(SUPERADMIN_EMAIL)
    return userRecord.uid
  } catch (error) {
    console.error(`❌ Error: No se encontró el usuario ${SUPERADMIN_EMAIL}`)
    return null
  }
}

async function showCurrentData() {
  console.log('\n📊 DATOS ACTUALES EN LA BASE DE DATOS:')
  console.log('=====================================\n')
  
  for (const collection of COLLECTIONS_TO_CLEAN) {
    try {
      const snapshot = await db.collection(collection).count().get()
      const count = snapshot.data().count
      console.log(`  ${collection.padEnd(20)} → ${count.toLocaleString()} documentos`)
    } catch (error) {
      console.log(`  ${collection.padEnd(20)} → Error al contar`)
    }
  }
  
  // Contar usuarios
  try {
    const listUsersResult = await auth.listUsers(1000)
    console.log(`  ${'usuarios (Auth)'.padEnd(20)} → ${listUsersResult.users.length} usuarios`)
  } catch (error) {
    console.log(`  ${'usuarios (Auth)'.padEnd(20)} → Error al contar`)
  }
  
  console.log('\n')
}

async function cleanDatabase() {
  console.log('\n🧹 LIMPIEZA COMPLETA DE LA BASE DE DATOS')
  console.log('==========================================\n')
  
  // Verificar superadmin
  console.log(`🔍 Verificando superadmin: ${SUPERADMIN_EMAIL}...`)
  const superadminUid = await getSuperadminUid()
  
  if (!superadminUid) {
    console.log('❌ No se puede continuar sin un superadmin válido.')
    process.exit(1)
  }
  
  console.log(`✅ Superadmin encontrado: ${superadminUid}\n`)
  
  // Mostrar datos actuales
  await showCurrentData()
  
  // Verificar confirmación
  const hasConfirmFlag = process.argv.includes('--confirm')
  
  if (!hasConfirmFlag) {
    console.log('⚠️  ADVERTENCIA: Esta acción es IRREVERSIBLE')
    console.log(`⚠️  Se eliminarán TODOS los datos excepto el usuario: ${SUPERADMIN_EMAIL}`)
    console.log('⚠️  Esto incluye: comercios, eventos, boletos, compras, usuarios, etc.\n')
    console.log('Para ejecutar la limpieza, usa:')
    console.log('  node backend/scripts/clean-database.js --confirm\n')
    process.exit(0)
  }
  
  console.log('⚠️  INICIANDO LIMPIEZA (NO REVERSIBLE)...\n')
  
  // Eliminar colecciones
  let totalDeleted = 0
  
  for (const collection of COLLECTIONS_TO_CLEAN) {
    try {
      process.stdout.write(`  Limpiando ${collection}...`)
      const count = await deleteCollection(collection)
      console.log(` ✅ ${count.toLocaleString()} documentos eliminados`)
      totalDeleted += count
    } catch (error) {
      console.log(` ❌ Error: ${error.message}`)
    }
  }
  
  // Eliminar usuarios de Authentication (excepto superadmin)
  console.log('\n👥 Limpiando Firebase Authentication...')
  
  try {
    let deletedCount = 0
    let pageToken
    
    do {
      const listUsersResult = await auth.listUsers(1000, pageToken)
      
      for (const userRecord of listUsersResult.users) {
        if (userRecord.email !== SUPERADMIN_EMAIL) {
          try {
            await auth.deleteUser(userRecord.uid)
            deletedCount++
            process.stdout.write('.')
          } catch (error) {
            console.log(`\n  ⚠️  No se pudo eliminar ${userRecord.email}: ${error.message}`)
          }
        }
      }
      
      pageToken = listUsersResult.pageToken
    } while (pageToken)
    
    console.log(`\n  ✅ ${deletedCount} usuarios eliminados (mantenido: ${SUPERADMIN_EMAIL})`)
    
  } catch (error) {
    console.log(`  ❌ Error al limpiar usuarios: ${error.message}`)
  }
  
  // Verificar resultado
  console.log('\n\n📊 ESTADO FINAL DE LA BASE DE DATOS:')
  console.log('=====================================\n')
  
  let allClean = true
  
  for (const collection of COLLECTIONS_TO_CLEAN) {
    try {
      const snapshot = await db.collection(collection).count().get()
      const count = snapshot.data().count
      const status = count === 0 ? '✅' : '⚠️ '
      if (count > 0) allClean = false
      console.log(`  ${status} ${collection.padEnd(20)} → ${count} documentos`)
    } catch (error) {
      console.log(`  ❌ ${collection.padEnd(20)} → Error al verificar`)
    }
  }
  
  // Verificar usuarios
  try {
    const listUsersResult = await auth.listUsers(1000)
    const count = listUsersResult.users.length
    console.log(`\n  👥 ${'Usuarios en Auth'.padEnd(20)} → ${count} usuario(s)`)
    
    if (count === 1 && listUsersResult.users[0].email === SUPERADMIN_EMAIL) {
      console.log(`  ✅ Solo queda el superadmin: ${SUPERADMIN_EMAIL}`)
    } else {
      console.log(`  ⚠️  Hay ${count} usuarios (esperados: 1)`)
      allClean = false
    }
  } catch (error) {
    console.log(`  ❌ Error al verificar usuarios`)
  }
  
  console.log('\n' + '='.repeat(45) + '\n')
  
  if (allClean) {
    console.log('✅ ¡LIMPIEZA COMPLETADA EXITOSAMENTE!\n')
    console.log(`   Total de documentos eliminados: ${totalDeleted.toLocaleString()}`)
    console.log(`   Usuario mantenido: ${SUPERADMIN_EMAIL}\n`)
    console.log('La base de datos está lista para pruebas desde cero.\n')
  } else {
    console.log('⚠️  LIMPIEZA COMPLETADA CON ADVERTENCIAS\n')
    console.log('Algunos datos pueden no haberse eliminado completamente.')
    console.log('Revisa el estado final arriba.\n')
  }
  
  process.exit(0)
}

// Ejecutar
cleanDatabase().catch(error => {
  console.error('\n❌ Error fatal:', error)
  process.exit(1)
})
