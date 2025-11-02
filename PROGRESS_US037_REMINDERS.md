# 📅 Sistema de Recordatorios Automáticos - US-037

## Descripción
Sistema que envía recordatorios automáticos por email a los compradores de tickets 24 horas antes del evento.

## ✅ Features Implementadas

### Core Functionality
- ✅ Job que busca eventos en las próximas 24 horas
- ✅ Envío de emails de recordatorio con template HTML profesional
- ✅ Agrupación de tickets por comprador (un email por persona)
- ✅ Marcado de eventos como "recordado" para evitar duplicados
- ✅ Logging completo de todas las operaciones
- ✅ Manejo de errores individual por email (no falla todo el job)

### Endpoints
- ✅ `POST /api/jobs/reminders` - Trigger manual (Platform Admin)
- ✅ `POST /api/jobs/reminders/:eventId` - Recordatorio de evento específico
- ✅ `POST /api/jobs/webhook/reminders` - Webhook para Cloud Scheduler

### Scripts
- ✅ `scripts/run-reminders.js` - Ejecutar job desde línea de comandos

---

## 🚀 Uso

### 1. Manual (Testing)

```bash
# Ejecutar job directamente
cd backend
node scripts/run-reminders.js

# O via endpoint (requiere autenticación como platform_admin)
curl -X POST http://localhost:8080/api/jobs/reminders \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Enviar recordatorio de un evento específico
curl -X POST http://localhost:8080/api/jobs/reminders/EVENT_ID \
  -H "Authorization: Bearer YOUR_TENANT_ADMIN_TOKEN"
```

### 2. Cloud Scheduler (Producción)

#### Paso 1: Configurar Secret
```bash
# Generar un secret fuerte
export SCHEDULER_SECRET=$(openssl rand -hex 32)

# Agregar a .env
echo "SCHEDULER_SECRET=$SCHEDULER_SECRET" >> .env
```

#### Paso 2: Crear Job en Cloud Scheduler

**Opción A: Via gcloud CLI**
```bash
gcloud scheduler jobs create http event-reminders-daily \
  --location=us-central1 \
  --schedule="0 10 * * *" \
  --time-zone="America/Mexico_City" \
  --uri="https://your-api-domain.com/api/jobs/webhook/reminders" \
  --http-method=POST \
  --headers="Content-Type=application/json,x-scheduler-secret=$SCHEDULER_SECRET" \
  --description="Envía recordatorios de eventos diariamente a las 10:00 AM"
```

**Opción B: Via Console**
1. Ir a [Cloud Scheduler](https://console.cloud.google.com/cloudscheduler)
2. Click "Create Job"
3. Configurar:
   - **Name:** `event-reminders-daily`
   - **Region:** `us-central1`
   - **Frequency:** `0 10 * * *` (Diario a las 10:00 AM)
   - **Timezone:** `America/Mexico_City`
   - **Target:** HTTP
   - **URL:** `https://your-api-domain.com/api/jobs/webhook/reminders`
   - **HTTP Method:** POST
   - **Headers:**
     - `Content-Type: application/json`
     - `x-scheduler-secret: [TU_SECRET_AQUI]`

#### Paso 3: Test del Job
```bash
# Ejecutar manualmente desde Cloud Console o:
gcloud scheduler jobs run event-reminders-daily --location=us-central1
```

---

## 📧 Template de Email

El sistema utiliza el template `sendEventReminderEmail()` que incluye:
- Asunto: "Recordatorio: [Nombre del Evento] es mañana"
- Información del evento (fecha, hora, ubicación)
- Cantidad de tickets del comprador
- Botón para descargar tickets (si aplica)
- Instrucciones de acceso
- Datos de contacto del organizador

Ver detalles completos en `backend/src/utils/email.js`

---

## 🔍 Lógica del Job

### Ventana de Recordatorio
- **Inicio:** 23 horas desde ahora
- **Fin:** 25 horas desde ahora
- **Razón:** Cubre eventos que empiezan "mañana" considerando zonas horarias

### Proceso
```javascript
1. Buscar eventos con status 'published'
2. Filtrar eventos en ventana de 23-25 horas
3. Para cada evento:
   a. Obtener tickets activos
   b. Agrupar por email del comprador
   c. Enviar 1 email por comprador (con todos sus tickets)
   d. Marcar evento como 'reminderSent' en metadata
4. Retornar resumen: eventos procesados, emails enviados, errores
```

### Prevención de Duplicados
- El evento se marca con `metadata.reminderSent = true`
- En ejecuciones futuras, estos eventos se ignoran
- Si necesitas reenviar, puedes:
  - Usar el endpoint `/api/jobs/reminders/:eventId`
  - O actualizar manualmente el campo en Firestore

---

## 📊 Monitoring y Logs

### Logs Importantes
```bash
# Job iniciado
🔔 Iniciando job de recordatorios de eventos...

# Eventos encontrados
📅 Encontrados 3 eventos para enviar recordatorios

# Procesando evento
📧 Procesando recordatorios para evento: Concierto XYZ (abc123)
   Encontrados 50 tickets para este evento

# Email enviado
✅ Recordatorio enviado a user@example.com (2 tickets)

# Evento completado
✅ Evento abc123 marcado como recordado

# Job completado
✅ Job de recordatorios completado: {"eventsProcessed":3,"emailsSent":45,"errors":0}
```

### Respuesta del Job
```json
{
  "success": true,
  "eventsProcessed": 3,
  "emailsSent": 45,
  "errors": 0,
  "timestamp": "2024-12-15T10:00:00.000Z"
}
```

---

## ⚙️ Configuración Recomendada

### Schedule (Cron)
```
0 10 * * *     # Diario a las 10:00 AM
```

**Razón:** 
- La mayoría de eventos son por la tarde/noche
- A las 10 AM del día anterior, el recordatorio llega en momento oportuno
- No es demasiado temprano (7 AM) ni demasiado tarde (8 PM)

### Timezone
```
America/Mexico_City (GMT-6)
```

### Retry Policy
En Cloud Scheduler configurar:
- **Max Retry Attempts:** 3
- **Min Backoff:** 5 seconds
- **Max Backoff:** 1 hour
- **Max Doublings:** 5

---

## 🧪 Testing

### Test Local
```bash
# 1. Crear un evento de prueba para mañana
curl -X POST http://localhost:8080/api/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-tenant",
    "name": "Test Event Tomorrow",
    "date": "2024-12-16T19:00:00Z",  # MAÑANA
    "status": "published",
    "tiers": [{"name": "General", "price": 0, "capacity": 100}]
  }'

# 2. Crear un ticket de prueba
curl -X POST http://localhost:8080/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "EVENT_ID",
    "tierId": "TIER_ID",
    "buyer": {
      "name": "Test User",
      "email": "your-email@example.com"
    }
  }'

# 3. Ejecutar job
node scripts/run-reminders.js

# 4. Verificar email recibido
```

### Test de Webhook
```bash
# Simular llamada de Cloud Scheduler
curl -X POST http://localhost:8080/api/jobs/webhook/reminders \
  -H "x-scheduler-secret: YOUR_SECRET" \
  -H "Content-Type: application/json"
```

---

## 🔧 Troubleshooting

### No se envían emails
1. Verificar que Resend está configurado (`RESEND_API_KEY`)
2. Verificar que el evento tiene status `published`
3. Verificar que hay tickets con status `active`
4. Revisar logs para errores específicos

### Emails duplicados
1. Verificar que el evento no tiene `metadata.reminderSent = true`
2. No ejecutar el job múltiples veces al día
3. Cloud Scheduler debe ejecutarse solo 1 vez al día

### Job falla completamente
1. Verificar conexión a Firestore
2. Verificar permisos de Firebase Admin SDK
3. Revisar límites de Resend (100 emails/día en free tier)

### Secret del webhook inválido
1. Verificar que `SCHEDULER_SECRET` está en .env
2. Verificar que el header `x-scheduler-secret` coincide
3. Regenerar secret si es necesario

---

## 📈 Escalabilidad

### Límites Actuales
- **Resend Free Tier:** 100 emails/día
- **Job Limit:** 1000 eventos por ejecución
- **Delay entre emails:** 100ms (10 emails/segundo)

### Optimizaciones para Producción
1. **Batch Email Sending:**
   ```javascript
   // En lugar de enviar 1 por 1:
   await resend.batch.send([...emails]);
   ```

2. **Paginación de Eventos:**
   ```javascript
   // Procesar en chunks de 100 eventos
   for (let offset = 0; offset < totalEvents; offset += 100) {
     const chunk = await Event.list({ offset, limit: 100 });
     // Procesar chunk
   }
   ```

3. **Background Queue:**
   ```javascript
   // Usar Pub/Sub o Cloud Tasks para procesamiento asíncrono
   await pubsub.topic('event-reminders').publish(eventId);
   ```

---

## 🎯 Mejoras Futuras

- [ ] Permitir configurar cuándo enviar recordatorio (24h, 48h, 1 semana)
- [ ] Soporte para múltiples recordatorios por evento
- [ ] Preferencias de notificación por comprador (opt-out)
- [ ] Recordatorios vía SMS/WhatsApp (Twilio)
- [ ] Dashboard de monitoreo de recordatorios enviados
- [ ] A/B testing de templates de email
- [ ] Recordatorios post-evento (feedback/ratings)

---

## 📚 Referencias

- [Cloud Scheduler Documentation](https://cloud.google.com/scheduler/docs)
- [Cron Schedule Syntax](https://cloud.google.com/scheduler/docs/configuring/cron-job-schedules)
- [Resend Batch API](https://resend.com/docs/api-reference/batch)
- [Node-Cron (alternativa local)](https://www.npmjs.com/package/node-cron)

---

**Implementado:** Diciembre 2024  
**Version:** 1.0.0  
**Status:** ✅ Producción Ready
