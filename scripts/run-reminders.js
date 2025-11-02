#!/usr/bin/env node

/**
 * Script para ejecutar el job de recordatorios de eventos manualmente
 * Uso: node scripts/run-reminders.js
 */

require('dotenv').config();
const { sendEventReminders } = require('../src/jobs/event-reminders');
const logger = require('../src/utils/logger');

async function main() {
  try {
    logger.info('🚀 Ejecutando job de recordatorios...');
    
    const result = await sendEventReminders();
    
    console.log('\n✅ Job completado exitosamente');
    console.log('═══════════════════════════════════════');
    console.log(`Eventos procesados: ${result.eventsProcessed}`);
    console.log(`Emails enviados: ${result.emailsSent}`);
    console.log(`Errores: ${result.errors}`);
    console.log('═══════════════════════════════════════\n');
    
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Error ejecutando job de recordatorios:', error);
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
