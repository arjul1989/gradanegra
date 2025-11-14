# 🔧 SOLUCIÓN: Error "diff_param_bins"

## ❌ **EL PROBLEMA**

Error al procesar el pago:
```
diff_param_bins
"Different parameters for the bin"
Error code: 10103
```

---

## 🔍 **CAUSA DEL ERROR**

Cuando usas el SDK de Mercado Pago para generar un token:

```javascript
const cardToken = await mp.createCardToken({
  cardNumber: "5254 1336 7440 3564",
  cardholderName: "JUAN PEREZ",
  // ...
});
```

El token generado **YA CONTIENE** toda la información de la tarjeta:
- ✅ Número de tarjeta (encriptado)
- ✅ `payment_method_id` (visa, master, etc.)
- ✅ `issuer_id` (banco emisor)
- ✅ Todos los demás parámetros

**El error ocurre** cuando intentas enviar `payment_method_id` o `issuer_id` **por separado** además del token, porque Mercado Pago detecta que hay información duplicada o conflictiva.

---

## ✅ **LA SOLUCIÓN**

**Solo enviar el token**, y dejar que Mercado Pago obtenga automáticamente todos los demás parámetros desde el token.

### **ANTES (INCORRECTO):**

```javascript
// Frontend
const paymentData = {
  token: cardToken.id,
  payment_method_id: cardToken.payment_method_id, // ❌ NO ENVIAR
  issuer_id: cardToken.issuer_id, // ❌ NO ENVIAR
  // ...
};

// Backend
const paymentData = {
  token: token,
  payment_method_id: payment_method_id || detectedPaymentMethod, // ❌ NO ENVIAR
  issuer_id: issuer_id, // ❌ NO ENVIAR
  // ...
};
```

### **DESPUÉS (CORRECTO):**

```javascript
// Frontend
const paymentData = {
  token: cardToken.id, // ✅ Solo el token
  transaction_amount: total,
  payer: { ... },
  installments: 1
  // payment_method_id: ❌ NO INCLUIR
  // issuer_id: ❌ NO INCLUIR
};

// Backend
const paymentData = {
  token: token, // ✅ Solo el token
  transaction_amount: parseFloat(transaction_amount),
  description: description,
  payer: { ... },
  installments: parseInt(installments)
  // payment_method_id: ❌ NO INCLUIR
  // issuer_id: ❌ NO INCLUIR
};
```

---

## 📊 **FLUJO CORRECTO**

```
1. Usuario ingresa datos de tarjeta
   ↓
2. SDK genera token con TODA la info:
   {
     id: "abc123...",
     payment_method_id: "visa",  ← Incluido en el token
     issuer_id: "123",           ← Incluido en el token
     ...
   }
   ↓
3. Frontend envía SOLO el token.id al backend
   ↓
4. Backend envía SOLO el token a Mercado Pago
   ↓
5. Mercado Pago extrae automáticamente:
   - payment_method_id desde el token
   - issuer_id desde el token
   - Todos los demás parámetros
   ↓
6. Pago procesado exitosamente ✅
```

---

## 🔄 **CAMBIOS APLICADOS**

### **Frontend** (`/frontend/app/checkout/[eventoId]/page.tsx`)

**Línea ~287-305:**
```typescript
// El token YA contiene payment_method_id e issuer_id
const paymentData = {
  compraId: newCompraId,
  eventoId: eventoId,
  transaction_amount: total,
  description: `Tickets para ${evento?.nombre}`,
  payer: {
    email: formData.email,
    first_name: formData.nombre.split(' ')[0],
    last_name: formData.nombre.split(' ').slice(1).join(' ') || formData.nombre,
    identification: {
      type: cardData.identificationType,
      number: cardData.identificationNumber
    }
  },
  token: cardToken.id, // Solo el token
  installments: 1
  // ❌ Removido: payment_method_id
  // ❌ Removido: issuer_id
};
```

### **Backend** (`/backend/src/controllers/payment.controller.js`)

**Línea ~212-240:**
```javascript
// El token YA contiene toda la info de la tarjeta
const paymentData = {
  transaction_amount: parseFloat(transaction_amount),
  description: description,
  token: token, // Solo el token
  installments: parseInt(installments),
  payer: {
    email: payer.email,
    first_name: payer.first_name,
    last_name: payer.last_name,
    identification: {
      type: payer.identification?.type || 'CC',
      number: payer.identification?.number || ''
    }
  },
  external_reference: compraId,
  metadata: { ... }
  // ❌ Removido: payment_method_id
  // ❌ Removido: issuer_id
};
```

---

## ✅ **ESTADO ACTUAL**

✅ **Backend reiniciado**  
✅ **Corrección aplicada**  
✅ **Token se usa correctamente**  
✅ **No se envían parámetros duplicados**  

---

## 🧪 **PRUÉBALO AHORA**

1. **Recarga la página del checkout:**
   ```
   http://localhost:3000/eventos/03b5a8ad-5c91-44ae-9a4c-66761ffa171e
   ```

2. **Selecciona tickets** (si no lo has hecho)

3. **Espera a que el SDK cargue** (verás ✅✅ en el debug box)

4. **Haz clic en "Pagar"**

5. **Observa los logs en la consola:**
   ```
   🎫 Token generado: { id: "abc123..." }
   💳 Enviando pago al backend: { token: "abc123...", ... }
   ✅ Respuesta del backend: { success: true, payment: { status: "approved" } }
   ```

---

## 📝 **NOTA IMPORTANTE**

El error `diff_param_bins` es específico de la integración API directa con tokenización. Ocurre cuando:

1. ✅ Usas `mp.createCardToken()` para generar un token
2. ❌ Luego intentas enviar `payment_method_id` o `issuer_id` por separado

**La regla es simple:** Si usas tokenización, **SOLO envía el token**. Mercado Pago hará el resto.

---

## 🎯 **RESULTADO ESPERADO**

Después de hacer clic en "Pagar", deberías ver:

```
✅ ¡Pago procesado exitosamente!
→ Redirigiendo a página de éxito...
```

Y en los logs del backend:

```
[info]: Procesando pago directo
[info]: Creando pago en MP: { token: "...", ... }
[info]: Pago creado en MP: { id: 123, status: "approved" }
```

**¡Sin errores!** 🎉

