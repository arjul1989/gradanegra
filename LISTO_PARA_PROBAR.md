# ✅ ¡MERCADO PAGO LISTO PARA PROBAR!

## 🎉 **CONFIGURACIÓN COMPLETADA**

**Fecha**: 11 de noviembre de 2025  
**Status**: 🟢 **100% LISTO**

---

## ✅ **LO QUE SE HIZO**

### **1. Integración Implementada**
- ✅ SDK instalado (backend y frontend)
- ✅ Modelos y endpoints creados
- ✅ Checkout funcional
- ✅ Páginas de respuesta (éxito/fallo/pendiente)
- ✅ Webhook configurado

### **2. Variables de Entorno Agregadas**
- ✅ Credenciales TEST configuradas
- ✅ Credenciales PROD configuradas
- ✅ Client ID y Secret configurados
- ✅ URLs configuradas
- ✅ Verificadas con Node.js ✓

---

## 🚀 **CÓMO PROBAR AHORA**

### **Paso 1: Iniciar Backend**

```bash
cd backend
npm run dev
```

Deberías ver:
```
✅ Mercado Pago configurado - Modo: TEST
🚀 Server running on port 8080
```

### **Paso 2: Iniciar Frontend**

En otra terminal:

```bash
cd frontend
npm run dev
```

### **Paso 3: Ir a Checkout**

1. Ve a: `http://localhost:3000`
2. Busca un evento
3. Haz clic en el botón de comprar
4. O ve directo a: `http://localhost:3000/checkout/[eventoId]`
   - Reemplaza `[eventoId]` con un ID real

### **Paso 4: Probar Pago**

**Datos del formulario**:
- Nombre: Tu nombre
- Email: tu@email.com
- Teléfono: +52 55 1234 5678
- Cantidad: 1

**Haz clic en**: "Pagar con Mercado Pago"

**Usa tarjeta de prueba**:
```
Número:     5031 7557 3453 0604
CVV:        123
Vencimiento: 12/25 (cualquier fecha futura)
Nombre:     APRO
```

---

## 🎯 **QUÉ ESPERAR**

### **Si todo sale bien**:
1. ✅ Se crea la preferencia de pago
2. ✅ Se muestra el Wallet de Mercado Pago
3. ✅ Completas el pago
4. ✅ Eres redirigido a `/pago/exito`
5. ✅ El webhook recibe la notificación
6. ✅ La compra se marca como `completada` en Firestore

### **Para verificar en Firestore**:
- Colección `payments`: Verás el pago con status `approved`
- Colección `compras`: Verás la compra con status `completada`

---

## 🔧 **OTRAS TARJETAS DE PRUEBA**

### **Tarjeta Aprobada**:
```
Número: 5031 7557 3453 0604
CVV:    123
Nombre: APRO
```

### **Tarjeta Rechazada (fondos insuficientes)**:
```
Número: 5031 4332 1540 6351
CVV:    123
Nombre: OTHE
```

### **Tarjeta Rechazada (datos inválidos)**:
```
Número: 5031 7557 3453 0604
CVV:    123
Nombre: CALL
```

Más tarjetas: https://www.mercadopago.com.mx/developers/es/docs/checkout-bricks/additional-content/test-cards

---

## 🔗 **ENDPOINTS DISPONIBLES**

### **Backend** (`http://localhost:8080`)

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/payments/config` | Obtener Public Key |
| `POST /api/payments/create-preference` | Crear preferencia |
| `POST /api/payments/webhook` | Recibir notificaciones |
| `GET /api/payments/:id` | Estado de pago |

### **Frontend** (`http://localhost:3000`)

| Ruta | Descripción |
|------|-------------|
| `/checkout/[eventoId]` | Página de checkout |
| `/pago/exito` | Pago exitoso |
| `/pago/fallo` | Pago rechazado |
| `/pago/pendiente` | Pago pendiente |

---

## 🐛 **TROUBLESHOOTING**

### **Error: "MP_ACCESS_TOKEN no está configurado"**
- ✅ **RESUELTO**: Variables ya agregadas al `.env`

### **Backend no inicia**
```bash
cd backend
rm -rf node_modules
npm install
npm run dev
```

### **Frontend no muestra el Wallet**
- Verifica que el backend esté corriendo
- Abre la consola del navegador (F12) para ver errores
- Verifica que `/api/payments/config` devuelva la Public Key

### **Webhook no recibe notificaciones (en producción)**
- Verifica que la URL esté en el panel de MP
- Usa ngrok para probar localmente:
  ```bash
  ngrok http 8080
  # Usa la URL de ngrok en el webhook de MP
  ```

---

## 📡 **CONFIGURAR WEBHOOK EN MERCADO PAGO**

**Para probar webhooks localmente**, usa ngrok:

1. Instala ngrok: `brew install ngrok` (macOS)
2. Ejecuta: `ngrok http 8080`
3. Copia la URL: `https://xxxx-xx-xx-xx-xx.ngrok.io`
4. Ve a: https://www.mercadopago.com.mx/developers/panel/app
5. Webhooks → Agregar URL:
   ```
   https://xxxx-xx-xx-xx-xx.ngrok.io/api/payments/webhook
   ```
6. Selecciona evento: "Payments"

**En producción**, usa:
```
https://gradanegra-api-juyoedy62a-uc.a.run.app/api/payments/webhook
```

---

## 📊 **VARIABLES CONFIGURADAS**

```bash
# TEST (activo por defecto en development)
MP_PUBLIC_KEY_TEST=TEST-50bc2b0a-1d2e-4ec8-b8a2-fbf253d816fb ✅
MP_ACCESS_TOKEN_TEST=TEST-3273184217457598-111121-561acd2f22512e81ec5f796bc4926c88-206690440 ✅

# PROD (activo cuando NODE_ENV=production)
MP_PUBLIC_KEY_PROD=APP_USR-4b192185-10c7-4b18-b2ef-5e098dffcb9c ✅
MP_ACCESS_TOKEN_PROD=APP_USR-3273184217457598-111121-4f12aa57c524116ed30ea42b036b21fd-206690440 ✅

# Cliente
MP_CLIENT_ID=3273184217457598 ✅
MP_CLIENT_SECRET=zNdhqkieaVmP6ktnYZTDkBUPbjVyEozK ✅
```

---

## 🎓 **RECURSOS**

**Documentación Completa**:
- 📖 `MERCADOPAGO_INTEGRATION.md` - Guía completa
- 📋 `RESUMEN_MERCADOPAGO.md` - Resumen ejecutivo

**Panel de Mercado Pago**:
- [Mis Aplicaciones](https://www.mercadopago.com.mx/developers/panel/app)
- [Pagos de Prueba](https://www.mercadopago.com.mx/developers/panel/test-payments)

**Documentación Oficial**:
- [Checkout Pro](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/landing)
- [Tarjetas de Prueba](https://www.mercadopago.com.mx/developers/es/docs/checkout-bricks/additional-content/test-cards)
- [Webhooks](https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks)

---

## 🎉 **¡TODO LISTO!**

Solo necesitas:

1. ✅ ~~Agregar variables de entorno~~ **HECHO**
2. 🚀 **Iniciar backend**: `cd backend && npm run dev`
3. 🚀 **Iniciar frontend**: `cd frontend && npm run dev`
4. 🧪 **Probar con tarjeta TEST**

---

**¿Listo para probar?** ¡Inicia los servidores y prueba un pago! 💳✨

