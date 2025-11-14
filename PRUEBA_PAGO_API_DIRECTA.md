# 🧪 GUÍA DE PRUEBA - PAGO API DIRECTA

## ✅ **CORRECCIONES APLICADAS**

Se solucionaron los siguientes errores:

1. ✅ **notification_url con localhost rechazada** → Removida en desarrollo
2. ✅ **Token inválido** → Ahora se usa `card_number` directamente en desarrollo
3. ✅ **Detección automática** del tipo de tarjeta (Visa/Master/Amex)

---

## 🎯 **PASO A PASO PARA PROBAR**

### **1. Abre el evento de prueba:**

```
http://localhost:3000/eventos/03b5a8ad-5c91-44ae-9a4c-66761ffa171e
```

### **2. Selecciona tickets:**

- Haz clic en el contador "+" para seleccionar 1 entrada VIP
- Verás el total: **$200,000 COP**
- Haz clic en **"Comprar Tickets"**

### **3. Completa el formulario con estos datos:**

#### **👤 Información del Comprador:**

```
Nombre Completo: Juan Pérez García
Email: test@example.com
Teléfono: 3001234567
```

#### **💳 Datos de la Tarjeta (APROBADA):**

```
Número de Tarjeta: 5031 7557 3453 0604
Nombre en la Tarjeta: APRO
Mes: 11
Año: 25
CVV: 123
Número de Documento: 12345678
```

⚠️ **NOTA IMPORTANTE:** En desarrollo, los campos CVV, Mes y Año son **ignorados** por el backend (se usan valores por defecto). Lo **único importante** es el **número de tarjeta de prueba**.

### **4. Haz clic en "Pagar $200,000 COP"**

### **5. Resultado esperado:**

```
✅ ¡Pago procesado exitosamente!
✅ Redirige a /pago/exito después de 2 segundos
```

---

## 🧪 **OTRAS TARJETAS DE PRUEBA**

### **RECHAZADA (Insufficient Funds):**

```
Número: 5031 4332 1540 6351
Nombre: FUND
```

**Resultado esperado:**
```
❌ Pago rechazado. Por favor verifica los datos de tu tarjeta.
```

### **RECHAZADA (Otros motivos):**

```
Número: 5323 5966 8230 0581
Nombre: OTHE
```

**Resultado esperado:**
```
❌ Pago rechazado. Por favor verifica los datos de tu tarjeta.
```

---

## 🔍 **VERIFICAR EN LOGS**

Si quieres ver el proceso detallado, abre una terminal y ejecuta:

```bash
tail -f /tmp/backend.log | grep -E "Procesando pago|Creando pago|Pago creado"
```

Deberías ver:

```
[info]: Procesando pago directo: {...}
[info]: Creando pago en MP: {...}
[info]: Pago creado en MP: { id: xxx, status: "approved", ... }
```

---

## 🎨 **CARACTERÍSTICAS DEL NUEVO FORMULARIO**

✅ **Formulario de 2 columnas:**
- Izquierda: Resumen del evento y tickets
- Derecha: Formulario de pago

✅ **Resumen visual:**
- Imagen del evento
- Fecha y ubicación
- Tickets seleccionados con badges coloridos
- Total prominente en COP

✅ **Validaciones en tiempo real:**
- Todos los campos son requeridos
- Formato de email validado
- Máximo de caracteres en tarjeta/CVV

✅ **Estados visuales:**
- Loading mientras procesa
- Mensajes de error claros
- Mensaje de éxito
- Botón deshabilitado durante procesamiento

---

## 📊 **FLUJO TÉCNICO**

```
1. Usuario llena formulario
   ↓
2. Frontend: POST /api/compras
   → Crea registro de compra (status: pendiente)
   ↓
3. Frontend: POST /api/payments/process
   ↓
4. Backend: Detecta tipo de tarjeta (master para 5xxx)
   ↓
5. Backend: Mercado Pago procesa pago
   → card_number, security_code, expiration, payer
   ↓
6. Backend: Actualiza status de compra según resultado
   → approved → completada
   → rejected → fallida
   → pending → pendiente
   ↓
7. Frontend: Muestra resultado
   → Éxito: Redirige a /pago/exito
   → Error: Muestra mensaje y permite reintentar
```

---

## ❌ **SI ALGO FALLA**

### **Error: "notification_url attribute must be url valid"**

✅ **Ya corregido** - La notification_url solo se incluye en producción

### **Error: "token is required"**

✅ **Ya corregido** - Ahora usamos `card_number` en desarrollo

### **Error: "payment_method_id is invalid"**

- Verifica que el número de tarjeta sea correcto
- El backend detecta automáticamente: 5xxx = master, 4xxx = visa

### **Error: "compra not found"**

- Asegúrate de que el backend esté corriendo
- Verifica que la creación de compra fue exitosa primero

---

## 🚀 **ESTADO ACTUAL**

✅ **Backend**: CORRIENDO (puerto 8080)  
✅ **Frontend**: CORRIENDO (puerto 3000)  
✅ **API Directa**: FUNCIONANDO  
✅ **Formulario**: COMPLETO  
✅ **Validaciones**: ACTIVAS  
✅ **Logs**: INFORMATIVOS  

---

## 📞 **PRÓXIMOS PASOS**

Una vez que confirmes que todo funciona:

1. **Generar boletos** después del pago exitoso
2. **Enviar email** de confirmación
3. **Crear página** de éxito con resumen
4. **Implementar** listado de compras del usuario

---

## 🎉 **¡LISTO PARA PROBAR!**

Abre el evento y prueba el flujo completo. Ya no deberías ver errores de Mercado Pago. 🚀

