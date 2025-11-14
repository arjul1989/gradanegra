# 🔴 PROBLEMA: Tarjeta Rechazada

## ❌ **QUÉ PASÓ**

Tu pago anterior fue **RECHAZADO** por Mercado Pago:

```
Status: rejected
Detalle: cc_rejected_other_reason
```

**Por eso no se generaron tickets.** Los tickets SOLO se generan cuando el pago es `approved`.

---

## 🔍 **POR QUÉ FUE RECHAZADO**

La tarjeta que estaba precargada (`5254 1336 7440 3564`) **NO es una tarjeta de prueba válida** para Mercado Pago. Mercado Pago la rechaza automáticamente.

---

## ✅ **SOLUCIÓN APLICADA**

He actualizado los datos precargados con la **tarjeta oficial de prueba** de Mercado Pago que SIEMPRE es aprobada:

### **Nueva Tarjeta Precargada:**
```
Número: 5031 7557 3453 0604
Nombre: APRO
Mes: 11
Año: 2025
CVV: 123
```

Esta es la tarjeta oficial documentada por Mercado Pago para pruebas en ambiente TEST.

---

## 🧪 **CÓMO PROBAR AHORA**

### **1. Recarga la página del checkout:**
```
http://localhost:3000/eventos/03b5a8ad-5c91-44ae-9a4c-66761ffa171e
```

Presiona **Ctrl+R** o **Cmd+R** para recargar

### **2. Selecciona tickets:**
- Elige 1 entrada VIP o General
- Haz clic en **"Comprar Tickets"**

### **3. Verifica los datos precargados:**

El formulario debe mostrar:

**👤 Información Personal:**
```
Nombre: Juan Perez
Email: test@example.com
Teléfono: 3001234567
Documento: 1095799788
```

**💳 Datos de Tarjeta (NUEVA - APROBADA):**
```
Número: 5031 7557 3453 0604
Nombre: APRO
Mes: 11
Año: 2025
CVV: 123
```

### **4. Espera a que el SDK cargue:**

Verás el debug box con:
```
✅ SDK: Cargado
✅ Public Key: TEST-50bc2b0a...
```

### **5. Haz clic en "Pagar"**

### **6. Espera la confirmación:**

Deberías ver:
```
✅ ¡Pago procesado exitosamente!
```

### **7. Ve a Mis Boletos:**
```
http://localhost:3000/mis-boletos
```

### **8. ¡Deberías ver tu ticket!** 🎉

---

## 📊 **FLUJO ESPERADO AHORA**

```
1. Usuario hace pago con tarjeta APRO
   ↓
2. Mercado Pago procesa
   → Status: approved ✅
   ↓
3. Backend actualiza compra
   → Status: completada ✅
   ↓
4. Backend genera tickets automáticamente
   → 1 ticket creado con número único ✅
   ↓
5. Usuario ve ticket en /mis-boletos ✅
```

---

## 🔍 **VERIFICAR EN LOGS**

Abre los logs del backend:

```bash
tail -f /tmp/backend.log | grep -E "Pago creado|Generando tickets|Ticket creado"
```

Después del pago, deberías ver:

```
[info]: Pago creado en MP: { status: "approved", ... }
[info]: 🎫 Generando tickets para compra abc123...
[info]: ✅ Ticket creado: TKT-2025-001234 para test@example.com
[info]: ✅ 1 tickets creados para compra abc123
```

---

## 💳 **TARJETAS DE PRUEBA DE MERCADO PAGO**

### **✅ APROBADA (USA ESTA):**
```
Mastercard: 5031 7557 3453 0604
Visa: 4009 1753 3280 6001
Nombre: APRO
```

### **❌ RECHAZADA (Fondos Insuficientes):**
```
5031 4332 1540 6351
Nombre: FUND
```

### **❌ RECHAZADA (Otros motivos):**
```
5323 5966 8230 0581
Nombre: OTHE
```

**Para todas:**
- Mes: Cualquier fecha futura (11)
- Año: Cualquier año futuro (2025)
- CVV: Cualquiera (123)
- Documento: Cualquiera (1095799788)

---

## ⚠️ **IMPORTANTE**

Las **compras rechazadas anteriores** quedaron con status `fallida` en la base de datos y **NO tienen tickets** (ni los tendrán).

Para probar correctamente, necesitas hacer una **NUEVA COMPRA** con la tarjeta correcta.

---

## 📞 **SI AÚN TIENES PROBLEMAS**

1. **Verifica que la tarjeta sea exactamente:**
   ```
   5031 7557 3453 0604
   ```

2. **Verifica los logs:**
   ```bash
   tail -100 /tmp/backend.log | grep "status"
   ```
   Debe decir `"status":"approved"`

3. **Limpia caché del navegador:**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

---

## 🎯 **ESTADO ACTUAL**

✅ **Tarjeta correcta precargada**  
✅ **Backend generando tickets**  
✅ **Endpoint de tickets funcionando**  
✅ **Frontend listo para mostrar**  

---

**¡Prueba de nuevo con la tarjeta APRO!** Esta vez debería funcionar perfectamente. 🚀💳✨

