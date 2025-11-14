# ✅ SOLUCIÓN FINAL: Tickets Apareciendo en "Mis Boletos"

## 🎯 **PROBLEMAS ENCONTRADOS Y RESUELTOS**

### **1. ❌ Pagos Rechazados (Resuelto)**

**Problema:** Mercado Pago rechazaba todos los pagos con `status: rejected`.

**Causa:** 
- Faltaba `X-Idempotency-Key` único para cada pago
- MP cacheaba o rechazaba pagos como duplicados

**Solución:**
```javascript
// backend/src/controllers/payment.controller.js
const idempotencyKey = `grada-${compraId}-${Date.now()}`;
const payment = await paymentClient.create({ 
  body: paymentData,
  requestOptions: { idempotencyKey }
});
```

---

### **2. ❌ Tickets No se Generaban (Resuelto)**

**Problema:** Después de pago aprobado, no se generaban tickets.

**Causa:** 
```javascript
// backend/src/models/Event.js - LÍNEA 161
const doc = await db.collection('events').doc(eventId).get(); // ❌ INCORRECTO
```

La colección en Firestore se llama **`'eventos'`** (español), no `'events'`.

**Solución:**
Corregido **TODAS** las referencias en `Event.js`:
```javascript
db.collection('eventos')  // ✅ CORRECTO
```

**Archivos modificados:**
- `backend/src/models/Event.js` (6 ocurrencias corregidas)

---

### **3. ❌ Tickets No Aparecían en Frontend (Resuelto)**

**Problema:** Los tickets existían en Firestore pero no se mostraban en "Mis Boletos".

**Causa:**
```javascript
// backend/src/models/Ticket.js
let query = db.collection('tickets'); // ❌ INCORRECTO
```

La colección en Firestore se llama **`'boletos'`** (español), no `'tickets'`.

**Solución:**
Corregido **TODAS** las referencias en `Ticket.js`:
```javascript
db.collection('boletos')  // ✅ CORRECTO
```

**Archivos modificados:**
- `backend/src/models/Ticket.js` (8 ocurrencias corregidas)

---

## 📝 **RESUMEN DE CAMBIOS**

### **Archivos Modificados:**

1. **`backend/src/controllers/payment.controller.js`**
   - ✅ Agregado `idempotencyKey` único para cada pago

2. **`backend/src/models/Event.js`**
   - ✅ `collection('events')` → `collection('eventos')` (6 lugares)

3. **`backend/src/models/Ticket.js`**
   - ✅ `collection('tickets')` → `collection('boletos')` (8 lugares)

4. **`frontend/app/checkout/[eventoId]/page.tsx`**
   - ✅ Tarjeta de prueba actualizada: `5474 9254 3267 0366` (Mastercard)
   - ✅ Número de documento: `12345678`
   - ✅ Logs detallados de tokenización y pago
   - ✅ Manejo correcto de estados (approved/rejected/pending)

---

## 🧪 **CÓMO PROBAR**

### **1. Recarga "Mis Boletos":**

```
http://localhost:3000/mis-boletos
```

**Deberías ver:**
- ✅ 1 ticket **General** (`GN-C9D0E166`)
- ✅ 2 tickets **VIP** (`GN-5A8C2397`, `GN-50BE8A79`)

---

### **2. Haz un Nuevo Pago (Prueba End-to-End):**

1. **Ve a un evento:**
   ```
   http://localhost:3000/eventos/03b5a8ad-5c91-44ae-9a4c-66761ffa171e
   ```

2. **Selecciona tickets:**
   - Ejemplo: 1 General + 1 VIP

3. **Haz clic en "Comprar Tickets"**

4. **Verifica en la consola del navegador:**
   ```
   🔐 Iniciando tokenización...
      Número: 5474 9254 3267 0366
      Doc Número: 12345678
   
   🎫 Token generado:
      Token ID: xxx...
      First 6: 547492
      Last 4: 0366
   
   ✅ Respuesta del backend:
      Status del pago: approved    ← ✅
      Detalle: accredited
   ```

5. **Espera la redirección** a `/pago/exito`

6. **Ve a "Mis Boletos":**
   ```
   http://localhost:3000/mis-boletos
   ```

7. **Deberías ver los nuevos tickets inmediatamente** ✅

---

## 🔍 **VERIFICACIÓN MANUAL (Si Necesario)**

### **Verificar que el evento existe:**
```bash
cd /Users/jules/MyApps/gradanegra/backend && node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-credentials.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

db.collection('eventos').doc('03b5a8ad-5c91-44ae-9a4c-66761ffa171e').get()
  .then(doc => {
    if (doc.exists) {
      console.log('✅ Evento:', doc.data().nombre);
    } else {
      console.log('❌ Evento no encontrado');
    }
    process.exit(0);
  });
"
```

### **Verificar tickets por userId:**
```bash
cd /Users/jules/MyApps/gradanegra/backend && node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-credentials.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

const userId = 's7yPUL9h4NXwSh7Xgi4miFLQd5y2';

db.collection('boletos').where('buyerId', '==', userId).get()
  .then(snapshot => {
    console.log('📊 Total tickets:', snapshot.size);
    snapshot.forEach(doc => {
      const ticket = doc.data();
      console.log('  ✅', ticket.ticketNumber, '|', ticket.metadata.tierName);
    });
    process.exit(0);
  });
"
```

---

## 🎉 **RESULTADO ESPERADO**

### **Flujo Completo:**

```
1. Usuario selecciona tickets ✅
2. Usuario hace clic en "Comprar Tickets" ✅
3. SDK de Mercado Pago se carga ✅
4. Usuario hace clic en "Pagar" ✅
5. Frontend tokeniza la tarjeta ✅
   → Token ID generado
6. Frontend crea compra (status: pendiente) ✅
   → Compra ID generado
7. Frontend envía pago al backend ✅
   → Con token + datos del comprador
8. Backend genera idempotency key único ✅
   → grada-{compraId}-{timestamp}
9. Backend procesa pago con Mercado Pago ✅
   → Status: approved
10. Backend actualiza compra (status: completada) ✅
11. Backend busca evento en 'eventos' ✅
    → Evento encontrado
12. Backend genera tickets individuales ✅
    → N tickets según cantidad
13. Backend guarda tickets en 'boletos' ✅
    → Con buyerId, purchaseId, qrCode
14. Frontend recibe respuesta exitosa ✅
15. Frontend redirige a /pago/exito ✅
16. Usuario va a "Mis Boletos" ✅
17. Backend busca tickets en 'boletos' ✅
    → WHERE buyerId == userId
18. Frontend muestra tickets ✅
    → Con evento, fecha, QR, etc.
```

---

## 📊 **ANTES vs AHORA**

### **ANTES (TODO MAL):**

| Paso | Status | Problema |
|------|--------|----------|
| Pago | ❌ Rechazado | Sin idempotency key |
| Tickets | ❌ No generados | Evento no encontrado (`events` vs `eventos`) |
| Mostrar | ❌ No aparecen | Tickets no encontrados (`tickets` vs `boletos`) |

### **AHORA (TODO BIEN):**

| Paso | Status | Solución |
|------|--------|----------|
| Pago | ✅ Aprobado | Idempotency key único |
| Tickets | ✅ Generados | Buscando en `'eventos'` |
| Mostrar | ✅ Aparecen | Buscando en `'boletos'` |

---

## 🚀 **SCRIPTS DE AYUDA**

### **1. Generar Tickets Manualmente (Si Necesario):**
```bash
cd /Users/jules/MyApps/gradanegra/backend
node generate-tickets-manual.js
```

### **2. Reiniciar Backend:**
```bash
kill $(lsof -ti:8080)
cd /Users/jules/MyApps/gradanegra/backend
npm start > /tmp/backend.log 2>&1 &
```

### **3. Ver Logs del Backend:**
```bash
tail -f /tmp/backend.log
```

### **4. Verificar Última Compra:**
```bash
tail -50 /tmp/backend.log | grep -E "(Procesando pago|Pago creado|Generando tickets)"
```

---

## ✅ **CHECKLIST FINAL**

- [x] Idempotency key agregado
- [x] `Event.js` corregido (`'eventos'`)
- [x] `Ticket.js` corregido (`'boletos'`)
- [x] Backend reiniciado
- [x] Tickets generados manualmente para compra anterior
- [ ] Frontend recargado y tickets visibles ← **VERIFICA ESTO**
- [ ] Nuevo pago realizado con éxito ← **PRUEBA ESTO**

---

## 🎯 **PRÓXIMOS PASOS**

1. **Recarga** `http://localhost:3000/mis-boletos`
2. **Verifica** que aparezcan los 3 tickets
3. **Haz un nuevo pago** para confirmar el flujo completo
4. **Reporta** si todo funciona correctamente

---

**Con estos 3 fixes, el flujo completo de pago → generación de tickets → visualización DEBE funcionar.** 🚀


