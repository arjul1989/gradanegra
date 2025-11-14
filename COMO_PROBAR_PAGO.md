# 🧪 CÓMO PROBAR EL PAGO

## ✅ **CORRECCIONES APLICADAS**

1. ✅ SDK de Mercado Pago se carga correctamente
2. ✅ Se usa `mp.createCardToken()` en lugar de `mp.fields.createCardToken()`
3. ✅ El backend acepta el token generado por el SDK
4. ✅ Se agregaron logs en consola para debugging
5. ✅ **NUEVO:** Corregido error "diff_param_bins" - solo se envía el token, no payment_method_id ni issuer_id

---

## 📝 **PASO A PASO**

### **1. Abre la consola del navegador (F12 → Console)**

Verás logs útiles:
- `🎫 Evento data:` - Información del evento
- `🎫 Token generado:` - Token creado por Mercado Pago SDK
- `💳 Enviando pago al backend:` - Datos que se envían al servidor
- `✅ Respuesta del backend:` - Resultado del pago

### **2. Navega al evento:**

```
http://localhost:3000/eventos/03b5a8ad-5c91-44ae-9a4c-66761ffa171e
```

### **3. Selecciona tickets:**

- Elige cantidad de entradas VIP o General
- Haz clic en **"Comprar Tickets"**

### **4. El formulario viene PRECARGADO con datos de prueba:**

#### **👤 Información Personal (YA PRECARGADA):**
```
Nombre Completo: Juan Perez
Email: test@example.com
Teléfono: 3001234567
Documento: 1095799788
```

#### **💳 Datos de Tarjeta (YA PRECARGADOS - Visa TEST Colombia APROBADA):**
```
Número: 4013 5406 8274 6260
Nombre: APRO
Mes: 11
Año: 2025
CVV: 123
Número Doc: 12345678
```

⚠️ **IMPORTANTE:** Esta es la tarjeta oficial de prueba de Mercado Pago para Colombia (TEST) que SIEMPRE es aprobada.

✅ **No necesitas escribir nada**, todos los campos están listos para probar.

### **5. Solo haz clic en "Pagar $XXX,XXX COP"**

---

## 🎯 **RESULTADO ESPERADO**

### **En la consola del navegador:**

```
🎫 Token generado: {
  id: "a1b2c3d4...",
  public_key: "TEST-...",
  card_number_length: 16,
  date_created: "..."
}

💳 Enviando pago al backend: {
  compraId: "uuid...",
  transaction_amount: 200000,
  token: "a1b2c3d4...",
  ...
}

✅ Respuesta del backend: {
  success: true,
  payment: { id: 123, status: "approved", ... }
}
```

### **En la interfaz:**

```
✅ ¡Pago procesado exitosamente!
→ Redirige a /pago/exito después de 2 segundos
```

---

## 🔴 **SI HAY UN ERROR**

### **Error: "Mercado Pago SDK no está cargado"**

- **Solución:** Espera unos segundos a que el SDK cargue
- El botón "Pagar" se habilita automáticamente cuando el SDK está listo

### **Error en consola: "Error en checkout: {}"**

- **Solución:** Revisa los logs anteriores en la consola
- Busca un mensaje de error más específico antes del error vacío

### **Error: "Error al generar el token de la tarjeta"**

- **Solución:** Verifica que:
  - El número de tarjeta sea válido
  - La fecha de vencimiento sea futura
  - El CVV tenga 3 dígitos

### **Error del backend: "token is invalid"**

- **Solución:** El token puede haber expirado
- Recarga la página e intenta de nuevo

---

## 📊 **FLUJO TÉCNICO**

```
1. Usuario completa formulario
   ↓
2. Click en "Pagar"
   ↓
3. Frontend: mp.createCardToken({ cardNumber, ... })
   → SDK genera token seguro
   ↓
4. Frontend: POST /api/compras (crea registro pendiente)
   ↓
5. Frontend: POST /api/payments/process
   → Envía: { token, transaction_amount, payer, ... }
   ↓
6. Backend: Mercado Pago API procesa pago
   → Usa el token para cobrar
   ↓
7. Backend: Actualiza compra según resultado
   → approved → completada
   → rejected → fallida
   ↓
8. Frontend: Muestra resultado y redirige
```

---

## 🔍 **LOGS DEL BACKEND**

Si quieres ver qué pasa en el servidor:

```bash
tail -f /tmp/backend.log | grep -E "Procesando pago|Pago creado"
```

Deberías ver:

```
[info]: Procesando pago directo: {...}
[info]: Creando pago en MP: {...}
[info]: Pago creado en MP: { id: xxx, status: "approved", ... }
```

---

## 💳 **OTRAS TARJETAS DE PRUEBA**

### **VISA - APROBADA**
```
4009 1753 3280 6001
```

### **RECHAZADA (Fondos Insuficientes)**
```
5031 4332 1540 6351
```

**Resultado esperado:**
```
❌ Pago rechazado. Por favor verifica los datos de tu tarjeta.
```

---

## 🎉 **¡LISTO!**

El sistema ahora usa **tokenización correcta** con el SDK oficial de Mercado Pago.

La integración cumple con **PCI DSS** y es completamente segura. 🔐✨

