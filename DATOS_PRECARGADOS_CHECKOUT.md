# 🚀 DATOS PRECARGADOS EN CHECKOUT

## ✅ **ACTUALIZACIÓN APLICADA**

El formulario de checkout ahora viene **completamente precargado** con datos de prueba válidos para Mercado Pago.

---

## 📝 **DATOS PRECARGADOS**

### **👤 Información del Comprador:**
```
Nombre Completo: Juan Perez
Email: test@example.com
Teléfono: 3001234567
Documento: 1095799788
Tipo de Documento: CC
```

### **💳 Datos de la Tarjeta (Mastercard - APROBADA):**
```
Número de Tarjeta: 5254 1336 7440 3564
Nombre en la Tarjeta: JUAN PEREZ
Mes de Vencimiento: 11
Año de Vencimiento: 2030
CVV: 123
Tipo de Documento: CC
Número de Documento: 1095799788
```

---

## 🎯 **CÓMO PROBAR AHORA**

### **Paso 1: Navega al evento**
```
http://localhost:3000/eventos/03b5a8ad-5c91-44ae-9a4c-66761ffa171e
```

### **Paso 2: Selecciona tickets**
- Elige la cantidad de entradas que quieras
- Haz clic en **"Comprar Tickets"**

### **Paso 3: Verifica los datos precargados**
- Todos los campos del formulario estarán llenos
- No necesitas escribir nada

### **Paso 4: Espera a que el SDK cargue**
- Verás el debug box:
  ```
  ✅ SDK: Cargado
  ✅ Public Key: TEST-50bc2b0a...
  ```

### **Paso 5: Haz clic en "Pagar"**
- El botón se habilitará automáticamente cuando todo esté listo
- ¡Y listo! El pago se procesará

---

## ⚡ **VENTAJAS**

### **Antes:**
```
1. Abrir checkout
2. Escribir nombre
3. Escribir email
4. Escribir teléfono
5. Escribir documento
6. Escribir número de tarjeta
7. Escribir nombre en tarjeta
8. Seleccionar mes
9. Escribir año
10. Escribir CVV
11. Escribir documento de tarjeta
12. Clic en pagar
```
⏱️ **Tiempo: ~2 minutos**

### **Ahora:**
```
1. Abrir checkout
2. Esperar 2-3 segundos
3. Clic en pagar
```
⏱️ **Tiempo: ~5 segundos** 🚀

---

## 🔧 **PARA PRODUCCIÓN**

Cuando quieras desactivar la precarga de datos:

1. Abre: `/frontend/app/checkout/[eventoId]/page.tsx`

2. Busca estas líneas (~62-80):

```typescript
// Datos del comprador (precargados para testing)
const [formData, setFormData] = useState({
  nombre: "Juan Perez",
  email: "test@example.com",
  telefono: "3001234567",
  documento: "1095799788",
  tipoDocumento: "CC"
});

// Card data (precargados para testing)
const [cardData, setCardData] = useState({
  cardNumber: "5254 1336 7440 3564",
  cardholderName: "JUAN PEREZ",
  expirationMonth: "11",
  expirationYear: "2030",
  securityCode: "123",
  identificationType: "CC",
  identificationNumber: "1095799788"
});
```

3. Reemplázalas con campos vacíos:

```typescript
// Datos del comprador
const [formData, setFormData] = useState({
  nombre: "",
  email: "",
  telefono: "",
  documento: "",
  tipoDocumento: "CC"
});

// Card data
const [cardData, setCardData] = useState({
  cardNumber: "",
  cardholderName: "",
  expirationMonth: "",
  expirationYear: "",
  securityCode: "",
  identificationType: "CC",
  identificationNumber: ""
});
```

---

## 🧪 **OTRAS TARJETAS DE PRUEBA**

Si quieres probar con otras tarjetas, puedes cambiar manualmente en el formulario:

### **VISA - APROBADA**
```
4009 1753 3280 6001
```

### **RECHAZADA (Fondos Insuficientes)**
```
5031 4332 1540 6351
```

### **RECHAZADA (Otros motivos)**
```
5323 5966 8230 0581
```

---

## 📊 **ESTADO ACTUAL**

✅ **Formulario:** PRECARGADO  
✅ **Datos válidos:** SÍ  
✅ **Tarjeta de prueba:** APROBADA  
✅ **Listo para probar:** SÍ  

---

## 🎉 **¡LISTO PARA PRUEBAS RÁPIDAS!**

Ahora puedes probar el flujo de pago completo en **5 segundos** en lugar de 2 minutos. 🚀

Solo:
1. Abre el checkout
2. Espera a que el SDK cargue
3. Clic en "Pagar"
4. ¡Ver el resultado!

✨ **Testing ágil y eficiente** ✨

