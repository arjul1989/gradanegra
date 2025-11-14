# 🔍 COMPARACIÓN: Frontend vs Backend

## ✅ **BACKEND QUE FUNCIONÓ**

### **Archivo:** `/backend/test-payment-with-token.js`

```javascript
// 1. Tokenización
{
  card_number: '5031755734530604',  // SIN ESPACIOS
  security_code: '123',
  expiration_month: 11,              // NÚMERO
  expiration_year: 2025,             // NÚMERO
  cardholder: {
    name: 'APRO',
    identification: {
      type: 'CC',
      number: '12345678'              // CAMBIÉ A ESTE NÚMERO
    }
  }
}

// Resultado: ✅ Token generado: a8df64db...
// Resultado: ✅ Pago aprobado: approved
```

---

## 🔄 **FRONTEND ACTUALIZADO**

### **Archivo:** `/frontend/app/checkout/[eventoId]/page.tsx`

```typescript
// Datos precargados
{
  cardNumber: "5031 7557 3453 0604",    // CON ESPACIOS (se limpian después)
  cardholderName: "APRO",
  expirationMonth: "11",                // STRING
  expirationYear: "2025",               // STRING
  securityCode: "123",
  identificationType: "CC",
  identificationNumber: "12345678"      // ✅ CAMBIÉ A ESTE NÚMERO
}

// Al enviar a MP SDK:
{
  cardNumber: "5031755734530604",       // SIN ESPACIOS ✅
  cardholderName: "APRO",
  cardExpirationMonth: "11",            // STRING (MP SDK acepta ambos)
  cardExpirationYear: "2025",           // STRING (MP SDK acepta ambos)
  securityCode: "123",
  identificationType: "CC",
  identificationNumber: "12345678"      // ✅ IGUAL AL BACKEND
}
```

---

## 📊 **DIFERENCIAS CLAVE**

| Campo | Backend | Frontend | ¿Problema? |
|-------|---------|----------|------------|
| `card_number` | `'5031755734530604'` | `'5031755734530604'` (limpiado) | ✅ IGUAL |
| `expiration_month` | `11` (número) | `'11'` (string) | ✅ MP SDK acepta ambos |
| `expiration_year` | `2025` (número) | `'2025'` (string) | ✅ MP SDK acepta ambos |
| `cardholder.name` | `'APRO'` | `'APRO'` | ✅ IGUAL |
| `identification.number` | `'12345678'` | `'12345678'` | ✅ **CORREGIDO** |
| `security_code` | `'123'` | `'123'` | ✅ IGUAL |

**ANTES:** `identificationNumber: "1095799788"` ❌  
**AHORA:** `identificationNumber: "12345678"` ✅

---

## 🛠️ **CAMBIOS APLICADOS**

### **1. Corrección de Número de Documento**
```diff
- identificationNumber: "1095799788"
+ identificationNumber: "12345678"
```

### **2. Logs Detallados de Tokenización**
```typescript
console.log('🔐 Iniciando tokenización...');
console.log('   Public Key:', publicKey);
console.log('   Datos de la tarjeta:');
console.log('     Número:', cardData.cardNumber);
console.log('     Nombre:', cardData.cardholderName);
console.log('     Mes:', cardData.expirationMonth);
console.log('     Año:', cardData.expirationYear);
console.log('     CVV:', cardData.securityCode);
console.log('     Doc Tipo:', cardData.identificationType);
console.log('     Doc Número:', cardData.identificationNumber);

console.log('📤 Enviando a MP SDK:', tokenData);

// ... tokenización ...

console.log('🎫 Token generado:', cardToken);
console.log('   Token ID:', cardToken?.id);
console.log('   First 6:', cardToken?.first_six_digits);
console.log('   Last 4:', cardToken?.last_four_digits);
```

### **3. Manejo Correcto de Status de Pago**
```typescript
// ANTES: Solo verificaba success
if (paymentResult.success) { ... }

// AHORA: Verifica success Y status approved
if (paymentResult.success && paymentResult.status === 'approved') {
  setSuccess("¡Pago procesado exitosamente!");
  router.push(`/pago/exito?compraId=${newCompraId}`);
} else if (paymentResult.status === 'rejected') {
  throw new Error(`Pago rechazado: ${paymentResult.message || paymentResult.statusDetail}`);
} else if (paymentResult.status === 'pending' || paymentResult.status === 'in_process') {
  setError("El pago está en proceso de verificación. Te notificaremos cuando se complete.");
}
```

### **4. Logs de Respuesta del Backend**
```typescript
console.log('✅ Respuesta del backend:', paymentResult);
console.log('   Status del pago:', paymentResult.status);
console.log('   Detalle:', paymentResult.statusDetail);
```

---

## 🧪 **CÓMO VERIFICAR QUE ESTÁ FUNCIONANDO**

### **Paso 1: Reiniciar Frontend (OBLIGATORIO)**

```bash
# 1. Detener el servidor (Ctrl+C en la terminal del frontend)

# 2. Borrar caché de Next.js
cd /Users/jules/MyApps/gradanegra/frontend
rm -rf .next

# 3. Reiniciar
npm run dev
```

**⚠️ IMPORTANTE:** Los cambios en `useState` inicial **NO se actualizan** con hot-reload de Next.js. Debes matar el servidor y borrar `.next`.

### **Paso 2: Abrir en Incógnito**

```
http://localhost:3000/eventos/03b5a8ad-5c91-44ae-9a4c-66761ffa171e
```

### **Paso 3: Abrir Consola del Navegador (F12)**

### **Paso 4: Hacer Pago**

1. Selecciona 1 ticket General
2. Haz clic en "Comprar Tickets"
3. Espera a que cargue (✅✅ en debug box)
4. Haz clic en "Pagar"

### **Paso 5: Revisar Logs en Consola**

Deberías ver:

```
🔐 Iniciando tokenización...
   Public Key: TEST-50bc2b0a-1d2e-4e8c-b8a2-fbf253d816fb
   Datos de la tarjeta:
     Número: 5031 7557 3453 0604
     Nombre: APRO
     Mes: 11
     Año: 2025
     CVV: 123
     Doc Tipo: CC
     Doc Número: 12345678  ← ✅ ESTE ES EL CAMBIO CLAVE

📤 Enviando a MP SDK: {
  cardNumber: "5031755734530604",
  cardholderName: "APRO",
  cardExpirationMonth: "11",
  cardExpirationYear: "2025",
  securityCode: "123",
  identificationType: "CC",
  identificationNumber: "12345678"
}

🎫 Token generado: {...}
   Token ID: abc123xyz...
   First 6: 503175
   Last 4: 0604

💳 Enviando pago al backend: {...}

✅ Respuesta del backend: {...}
   Status del pago: approved  ← ✅ DEBE DECIR "approved"
   Detalle: accredited
   
¡Pago procesado exitosamente!
```

---

## ❌ **SI SIGUE DICIENDO "rejected"**

### **Verifica en la consola:**

```
Status del pago: rejected
Detalle: cc_rejected_other_reason
```

### **Posibles causas:**

1. **Caché del navegador:**
   - Usa modo incógnito
   - O limpia caché y recarga (Ctrl+Shift+R)

2. **Frontend no se reinició correctamente:**
   - Verifica que la terminal del frontend diga: `✓ Ready in X.Xs`
   - Verifica que no haya errores de compilación

3. **Datos precargados no se actualizaron:**
   - Verifica en la consola que `Doc Número: 12345678`
   - Si sigue diciendo `1095799788`, el frontend no se reinició correctamente

4. **Credenciales incorrectas:**
   - Verifica que `Public Key: TEST-50bc2b0a...`
   - Si es otra, el backend no está usando las credenciales correctas

---

## 📋 **CHECKLIST ANTES DE PROBAR**

- [ ] Frontend detenido (Ctrl+C)
- [ ] Caché de Next.js eliminado (`rm -rf .next`)
- [ ] Frontend reiniciado (`npm run dev`)
- [ ] Terminal dice `✓ Ready in X.Xs`
- [ ] Navegador en modo incógnito
- [ ] Consola del navegador abierta (F12)
- [ ] Backend corriendo en puerto 8080

---

## 🎯 **RESULTADO ESPERADO**

```
✅ Token generado correctamente
✅ Pago enviado al backend
✅ Backend responde: status: "approved"
✅ Frontend muestra: "¡Pago procesado exitosamente!"
✅ Redirección a /pago/exito?compraId=...
✅ Tickets aparecen en "Mis Boletos"
```

---

## 🚨 **SI TODO ESTO FALLA**

Entonces el problema NO es el código, sino:
1. Las credenciales de Mercado Pago
2. La configuración de la cuenta de Mercado Pago
3. Alguna restricción de red/firewall

En ese caso, necesitaríamos:
- Verificar las credenciales en el dashboard de Mercado Pago
- Ver si hay alguna restricción en la cuenta
- Probar con otra tarjeta de prueba oficial de MP

