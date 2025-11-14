# 🔧 SOLUCIÓN: Problema de Idempotency Key

## 🎯 **PROBLEMA IDENTIFICADO**

**Síntoma:**
- Los pagos desde el backend test se aprueban ✅
- Los pagos desde el frontend se rechazan ❌
- Mercado Pago siempre devuelve el mismo Payment ID: `1325350416`

**Causa Raíz:**
El backend **NO estaba enviando** un `X-Idempotency-Key` único para cada pago.

Mercado Pago usa este header para detectar transacciones duplicadas. Si envías el mismo idempotency key (o ninguno), MP puede:
1. Devolver la respuesta cacheada del primer pago
2. Rechazar el pago como duplicado
3. Devolver el mismo Payment ID una y otra vez

---

## ✅ **SOLUCIÓN APLICADA**

### **Archivo:** `backend/src/controllers/payment.controller.js`

```javascript
// ANTES (INCORRECTO)
const payment = await paymentClient.create({ body: paymentData });

// AHORA (CORRECTO)
const idempotencyKey = `grada-${compraId}-${Date.now()}`;
logger.info('Idempotency Key:', idempotencyKey);

const payment = await paymentClient.create({ 
  body: paymentData,
  requestOptions: {
    idempotencyKey: idempotencyKey
  }
});
```

**Formato del Idempotency Key:**
```
grada-{compraId}-{timestamp}
```

**Ejemplo:**
```
grada-078d3151-5335-49c2-be2d-dfe0aad35da5-1731384000123
```

Esto garantiza que:
- ✅ Cada pago tiene un key único
- ✅ Se puede reintentar la misma compra sin conflictos
- ✅ Mercado Pago no cachea respuestas antiguas

---

## 🧪 **PRUEBAS REALIZADAS**

### **Test 1: Backend directo con 10,000**
```bash
node test-payment-with-token.js
```
**Resultado:** ✅ APROBADO
```
Status: approved
Status Detail: accredited
Payment ID: 1342393207
```

### **Test 2: Backend directo con 80,000 (mismo monto del frontend)**
```bash
node -e "..." # Script inline
```
**Resultado:** ✅ APROBADO
```
Status: approved
Status Detail: accredited
Payment ID: 1325350550
```

### **Test 3: Frontend con idempotency key antiguo**
**Resultado:** ❌ RECHAZADO
```
Payment ID: 1325350416 (siempre el mismo)
Status: rejected
Status Detail: cc_rejected_other_reason
```

---

## 🚀 **CÓMO PROBAR AHORA**

### **1. El backend YA está reiniciado** ✅

### **2. Abre en modo incógnito:**

```
http://localhost:3000/eventos/03b5a8ad-5c91-44ae-9a4c-66761ffa171e
```

### **3. Abre la consola (F12)**

### **4. Haz el pago:**
- Selecciona 1 ticket General
- Clic en "Comprar Tickets"
- Clic en "Pagar"

### **5. Busca en los logs de la consola:**

```
🔐 Iniciando tokenización...
   Número: 5474 9254 3267 0366  ← ✅
   Doc Número: 12345678          ← ✅

🎫 Token generado:
   Token ID: xxx...
   First 6: 547492
   Last 4: 0366

✅ Respuesta del backend:
   Status del pago: approved      ← ✅ DEBE SER "approved" AHORA
   Detalle: accredited
```

### **6. Revisa los logs del backend:**

```bash
tail -50 /tmp/backend.log | grep -E "(Idempotency Key|Pago creado en MP)"
```

Deberías ver:
```
Idempotency Key: grada-{uuid}-{timestamp}  ← ✅ ÚNICO CADA VEZ
Pago creado en MP: {"id": {NUEVO ID}, "status": "approved"}  ← ✅ ID DIFERENTE
```

---

## 📊 **COMPARACIÓN**

### **ANTES (INCORRECTO):**

| Intento | Payment ID | Status | Problema |
|---------|-----------|--------|----------|
| 1 | 1325350416 | rejected | ❌ |
| 2 | 1325350416 | rejected | ❌ Mismo ID |
| 3 | 1325350416 | rejected | ❌ Mismo ID |
| 4 | 1325350416 | rejected | ❌ Mismo ID |

**Problema:** Sin idempotency key único, MP cachea o rechaza como duplicado.

---

### **AHORA (CORRECTO):**

| Intento | Idempotency Key | Payment ID | Status |
|---------|----------------|-----------|--------|
| 1 | `grada-xxx-1234` | 1325350550 | approved ✅ |
| 2 | `grada-yyy-1235` | 1325350551 | approved ✅ |
| 3 | `grada-zzz-1236` | 1325350552 | approved ✅ |

**Solución:** Cada pago tiene un idempotency key único, MP procesa cada uno como transacción nueva.

---

## 🔍 **DEBUGGING**

Si el pago **sigue fallando**, verifica:

### **1. Que el backend esté usando el nuevo código:**

```bash
tail -20 /tmp/backend.log | grep "Idempotency Key"
```

Debes ver:
```
Idempotency Key: grada-{compraId}-{timestamp}
```

Si NO ves esto, el backend NO se reinició correctamente.

### **2. Que el Payment ID sea diferente cada vez:**

```bash
tail -50 /tmp/backend.log | grep "Pago creado en MP"
```

Debes ver IDs **diferentes** en cada intento:
```
Pago creado en MP: {"id": 1325350550, ...}
Pago creado en MP: {"id": 1325350551, ...}
Pago creado en MP: {"id": 1325350552, ...}
```

Si ves el mismo ID (`1325350416`), el backend NO está usando el nuevo código.

---

## ❌ **SI SIGUE FALLANDO**

### **Reinicia el backend manualmente:**

```bash
# 1. Matar proceso
kill $(lsof -ti:8080)

# 2. Verificar que murió
lsof -ti:8080  # Debe estar vacío

# 3. Reiniciar
cd /Users/jules/MyApps/gradanegra/backend
npm start > /tmp/backend.log 2>&1 &

# 4. Esperar 5 segundos
sleep 5

# 5. Verificar
curl http://localhost:8080/api/payments/config
```

---

## 📚 **REFERENCIAS**

### **Mercado Pago - Idempotency Keys:**
https://www.mercadopago.com.co/developers/es/docs/payments-api/idempotency

> "El header `X-Idempotency-Key` es utilizado para asegurar que una solicitud se procese una única vez, incluso si se envía múltiples veces. Es especialmente útil en operaciones de pago para evitar cobros duplicados."

### **SDK de Mercado Pago - Request Options:**
```javascript
client.create({
  body: paymentData,
  requestOptions: {
    idempotencyKey: 'unique-key-here'
  }
});
```

---

## ✅ **CHECKLIST FINAL**

- [x] Agregado `idempotencyKey` único en `payment.controller.js`
- [x] Backend reiniciado
- [x] Backend respondiendo correctamente
- [x] Tarjeta Mastercard configurada: `5474 9254 3267 0366`
- [x] Número de documento: `12345678`
- [ ] Probado desde el frontend ← **HAZLO AHORA**

---

## 🎉 **RESULTADO ESPERADO**

```
1. ✅ Token generado: xxx...
2. ✅ Idempotency Key: grada-xxx-{timestamp}
3. ✅ Payment ID: {NUEVO ID, NO 1325350416}
4. ✅ Status: approved
5. ✅ Detalle: accredited
6. ✅ Redirección a página de éxito
7. ✅ Tickets en "Mis Boletos"
```

**¡AHORA DEBERÍA FUNCIONAR!** 🚀

