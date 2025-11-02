const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const { sendEventReminderEmail } = require('../utils/email');
const logger = require('../utils/logger');

/**
 * Job que envía recordatorios de eventos programados para las próximas 24 horas
 * Debe ejecutarse diariamente (ej: mediante cron o Cloud Scheduler)
 */
async function sendEventReminders() {
  try {
    logger.info('🔔 Iniciando job de recordatorios de eventos...');

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Rango: eventos que empiezan entre 23 y 25 horas desde ahora
    const reminderWindowStart = new Date(now);
    reminderWindowStart.setHours(reminderWindowStart.getHours() + 23);
    
    const reminderWindowEnd = new Date(now);
    reminderWindowEnd.setHours(reminderWindowEnd.getHours() + 25);

    // Buscar eventos publicados en este rango
    const events = await Event.list({
      status: 'published',
      limit: 1000 // Ajustar según necesidad
    });

    // Filtrar eventos que están en el rango de recordatorio
    const eventsToRemind = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= reminderWindowStart && eventDate <= reminderWindowEnd;
    });

    logger.info(`📅 Encontrados ${eventsToRemind.length} eventos para enviar recordatorios`);

    if (eventsToRemind.length === 0) {
      logger.info('✅ No hay eventos para recordar en las próximas 24 horas');
      return {
        success: true,
        eventsProcessed: 0,
        emailsSent: 0,
        errors: 0
      };
    }

    // Procesar cada evento
    let totalEmailsSent = 0;
    let totalErrors = 0;

    for (const event of eventsToRemind) {
      try {
        logger.info(`📧 Procesando recordatorios para evento: ${event.name} (${event.id})`);

        // Obtener todos los tickets del evento
        const tickets = await Ticket.list({
          eventId: event.id,
          status: 'active' // Solo tickets activos
        });

        logger.info(`   Encontrados ${tickets.length} tickets para este evento`);

        // Agrupar tickets por email del comprador para evitar duplicados
        const ticketsByEmail = {};
        tickets.forEach(ticket => {
          const email = ticket.buyer.email.toLowerCase();
          if (!ticketsByEmail[email]) {
            ticketsByEmail[email] = {
              buyerName: ticket.buyer.name,
              email: ticket.buyer.email,
              tickets: []
            };
          }
          ticketsByEmail[email].tickets.push(ticket);
        });

        // Enviar un email por comprador (con todos sus tickets)
        for (const [email, data] of Object.entries(ticketsByEmail)) {
          try {
            await sendEventReminderEmail({
              to: data.email,
              buyerName: data.buyerName,
              event,
              ticketCount: data.tickets.length,
              tickets: data.tickets
            });

            totalEmailsSent++;
            logger.info(`   ✅ Recordatorio enviado a ${data.email} (${data.tickets.length} tickets)`);

            // Pequeño delay para no saturar el servicio de email
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (emailError) {
            totalErrors++;
            logger.error(`   ❌ Error enviando recordatorio a ${data.email}:`, emailError);
          }
        }

        // Marcar el evento como "recordado" en metadata para no enviar duplicados
        event.metadata = {
          ...event.metadata,
          reminderSent: true,
          reminderSentAt: new Date().toISOString()
        };
        await event.save();

        logger.info(`   ✅ Evento ${event.id} marcado como recordado`);

      } catch (eventError) {
        totalErrors++;
        logger.error(`❌ Error procesando evento ${event.id}:`, eventError);
      }
    }

    const summary = {
      success: true,
      eventsProcessed: eventsToRemind.length,
      emailsSent: totalEmailsSent,
      errors: totalErrors,
      timestamp: new Date().toISOString()
    };

    logger.info(`✅ Job de recordatorios completado: ${JSON.stringify(summary)}`);

    return summary;

  } catch (error) {
    logger.error('❌ Error fatal en job de recordatorios:', error);
    throw error;
  }
}

/**
 * Job manual para enviar recordatorio de un evento específico
 * Útil para testing o reenvíos
 */
async function sendSingleEventReminder(eventId) {
  try {
    logger.info(`🔔 Enviando recordatorio manual para evento: ${eventId}`);

    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    // Obtener todos los tickets del evento
    const tickets = await Ticket.list({
      eventId: event.id,
      status: 'active'
    });

    if (tickets.length === 0) {
      logger.info('No hay tickets activos para este evento');
      return {
        success: true,
        emailsSent: 0,
        message: 'No hay tickets activos'
      };
    }

    // Agrupar tickets por email
    const ticketsByEmail = {};
    tickets.forEach(ticket => {
      const email = ticket.buyer.email.toLowerCase();
      if (!ticketsByEmail[email]) {
        ticketsByEmail[email] = {
          buyerName: ticket.buyer.name,
          email: ticket.buyer.email,
          tickets: []
        };
      }
      ticketsByEmail[email].tickets.push(ticket);
    });

    // Enviar recordatorios
    let emailsSent = 0;
    let errors = 0;

    for (const [email, data] of Object.entries(ticketsByEmail)) {
      try {
        await sendEventReminderEmail({
          to: data.email,
          buyerName: data.buyerName,
          event,
          ticketCount: data.tickets.length,
          tickets: data.tickets
        });

        emailsSent++;
        logger.info(`✅ Recordatorio enviado a ${data.email}`);
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (emailError) {
        errors++;
        logger.error(`❌ Error enviando a ${data.email}:`, emailError);
      }
    }

    return {
      success: true,
      eventId: event.id,
      eventName: event.name,
      emailsSent,
      errors
    };

  } catch (error) {
    logger.error('❌ Error en recordatorio manual:', error);
    throw error;
  }
}

module.exports = {
  sendEventReminders,
  sendSingleEventReminder
};
