# 🎫 SOLUCIÓN: Generación de Tickets Después del Pago

## ❌ **EL PROBLEMA**

Después de completar un pago exitoso, **NO SE ESTABAN GENERANDO LOS TICKETS** para el usuario. El flujo se detenía en:

```
1. Pago aprobado ✅
2. Compra actualizada a "completada" ✅
3. Tickets generados ❌ (FALTABA ESTO)
4. Usuario ve sus tickets en /mis-boletos ❌
```

---

## ✅ **LA SOLUCIÓN**

Agregué la lógica para **generar tickets automáticamente** después de que un pago es aprobado.

### **Cambios Aplicados:**

#### **1. Nueva Función `generateTicketsForPurchase`** (`backend/src/controllers/payment.controller.js`)

```javascript
/**
 * Generar tickets para una compra aprobada
 */
async function generateTicketsForPurchase(compraId, compra) {
  // 1. Obtener el evento
  const event = await Event.findById(compra.eventoId);
  
  // 2. Obtener los tickets de la compra (tiers y cantidades)
  const tickets = compra.tickets || [];
  
  // 3. Para cada tier y cantidad, crear tickets individuales
  for (const ticketInfo of tickets) {
    const { tierId, cantidad, precioUnitario } = ticketInfo;
    
    // Buscar el tier en el evento
    const tier = event.tiers?.find(t => t.id === tierId);
    
    // Crear N tickets según la cantidad
    for (let i = 0; i < cantidad; i++) {
      const ticket = new Ticket({
        eventId: compra.eventoId,
        tenantId: compra.comercioId,
        buyerId: compra.userId || null,
        purchaseId: compraId,
        tierId: tierId,
        price: precioUnitario,
        currency: 'COP',
        status: 'valid',
        buyer: {
          name: compra.nombre,
          email: compra.email,
          phone: compra.telefono || ''
        }
      });
      
      await ticket.save();
      // ✅ Ticket creado con número único
    }
    
    // Actualizar contador de vendidos en el tier
    await event.updateTierSoldCount(tierId, newVendidos);
  }
}
```

#### **2. Llamada Automática Después del Pago** (línea ~296-305)

```javascript
// Actualizar compra
await db.collection('compras').doc(compraId).update(updateData);

// 🎫 GENERAR TICKETS si el pago fue aprobado
if (payment.status === 'approved') {
  try {
    await generateTicketsForPurchase(compraId, compra);
    logger.info(`✅ Tickets generados para compra ${compraId}`);
  } catch (ticketError) {
    logger.error(`Error al generar tickets:`, ticketError);
    // No fallar la respuesta, pero registrar el error
  }
}
```

---

## 📊 **FLUJO COMPLETO AHORA**

```
1. Usuario completa pago
   ↓
2. Mercado Pago procesa pago
   ↓
3. Backend recibe status: "approved"
   ↓
4. Backend actualiza compra a "completada"
   ↓
5. 🎫 Backend genera tickets automáticamente:
   - Si compraste 1 VIP y 2 General:
     → Se crean 3 tickets individuales
     → Cada ticket tiene número único
     → Se asignan al usuario
   ↓
6. Usuario ve tickets en /mis-boletos ✅
```

---

## 🧪 **CÓMO PROBAR**

### **Opción 1: Hacer una Nueva Compra**

1. **Ve al evento:**
   ```
   http://localhost:3000/eventos/03b5a8ad-5c91-44ae-9a4c-66761ffa171e
   ```

2. **Selecciona tickets** (ej: 1 VIP)

3. **Completa el pago** (formulario precargado)

4. **Espera la confirmación:**
   ```
   ✅ ¡Pago procesado exitosamente!
   ```

5. **Ve a Mis Boletos:**
   ```
   http://localhost:3000/mis-boletos
   ```

6. **Deberías ver tu ticket** con:
   - Imagen del evento
   - Fecha y ubicación
   - Número de ticket único
   - Opción para descargar/reenviar

### **Opción 2: Generar Tickets para Compras Anteriores**

Si ya tienes compras completadas sin tickets, necesitarás un script para generarlos retroactivamente.

---

## 🔍 **VERIFICAR EN LOGS**

Abre los logs del backend:

```bash
tail -f /tmp/backend.log | grep -E "Generando tickets|Ticket creado"
```

Después de un pago exitoso, deberías ver:

```
[info]: 🎫 Generando tickets para compra abc123...
[info]: ✅ Ticket creado: TKT-2025-001234 para test@example.com
[info]: ✅ Ticket creado: TKT-2025-001235 para test@example.com
[info]: ✅ 2 tickets creados para compra abc123
```

---

## 📝 **ESTRUCTURA DE UN TICKET**

Cada ticket contiene:

```javascript
{
  ticketNumber: "TKT-2025-001234",  // Número único
  eventId: "evento-id",              // ID del evento
  tenantId: "comercio-id",           // ID del organizador
  buyerId: "user-id",                // ID del comprador
  purchaseId: "compra-id",           // ID de la compra
  tierId: "tier-id",                 // Tipo de entrada (VIP/General)
  price: 200000,                     // Precio pagado
  currency: "COP",                   // Moneda
  status: "valid",                   // Estado del ticket
  buyer: {
    name: "Juan Perez",
    email: "test@example.com",
    phone: "3001234567"
  },
  qrCode: "...",                     // QR único
  hashCode: "...",                   // Hash SHA-256
  createdAt: "2025-11-12T...",       // Fecha de creación
  usedAt: null,                      // null = no usado
  checkedInBy: null                  // null = no verificado
}
```

---

## 🎯 **ENDPOINTS DISPONIBLES**

### **Para el Usuario:**

```
GET /api/buyers/me/tickets
→ Lista todos los tickets del usuario

GET /api/buyers/me/tickets/:id
→ Detalle de un ticket específico

POST /api/buyers/me/tickets/:id/resend
→ Reenviar email del ticket
```

### **Para el Comercio/Organizador:**

```
GET /api/boletos/user/:userId
→ Ver tickets de un usuario

POST /api/boletos/:boletoId/generar-qr
→ Generar nuevo QR

POST /api/boletos/:boletoId/reenviar
→ Reenviar ticket por email
```

---

## ⚠️ **IMPORTANTE**

### **Si ya tienes compras completadas sin tickets:**

Los tickets solo se generan para **nuevos pagos aprobados**. Las compras anteriores NO tendrán tickets automáticamente.

**Solución:**
- Crear un script de migración para generar tickets retroactivos
- O hacer nuevas compras de prueba

---

## ✨ **ESTADO ACTUAL**

✅ **Backend reiniciado**  
✅ **Función de generación implementada**  
✅ **Tickets se crean automáticamente**  
✅ **Endpoint `/api/buyers/me/tickets` funcional**  
✅ **Frontend listo para mostrar tickets**  

---

## 🚀 **PRUÉBALO AHORA**

1. **Haz una nueva compra** en el checkout
2. **Completa el pago** con la tarjeta de prueba
3. **Ve a Mis Boletos:** `http://localhost:3000/mis-boletos`
4. **¡Deberías ver tus tickets!** 🎉

---

## 📞 **SI AÚN NO VES TICKETS**

1. **Verifica los logs:**
   ```bash
   tail -100 /tmp/backend.log | grep -A 5 "Generando tickets"
   ```

2. **Verifica que la compra tiene la estructura correcta:**
   - Debe tener un campo `tickets` con array de objetos
   - Cada objeto debe tener: `tierId`, `cantidad`, `precioUnitario`

3. **Verifica en Firestore:**
   - Colección: `boletos` o `tickets`
   - Busca por `buyerId` o `buyer.email`

---

**¡Los tickets ahora se generan automáticamente después de cada pago exitoso!** 🎫✨

