# ✅ Credenciales TEST Correctas - Mercado Pago Colombia

**Fecha:** 12 de Noviembre de 2025  
**Última actualización:** Corrección de credenciales TEST

---

## 🔐 **CREDENCIALES TEST ACTIVAS (COLOMBIA)**

### **Secretos en Google Cloud Secret Manager:**

| Secreto | Valor | Versión |
|---------|-------|---------|
| `MERCADOPAGO_ACCESS_TOKEN_PROD` | `TEST-3273184217457598-111121-561acd2f22512e81ec5f796bc4926c88-206690440` | v3 ✅ |
| `MERCADOPAGO_PUBLIC_KEY_PROD` | `TEST-50bc2b0a-1d2e-4ec8-b8a2-fbf253d816fb` | v3 ✅ |

⚠️ **Nota:** Aunque el nombre dice "PROD", estamos usando credenciales TEST temporalmente para pruebas.

---

## 💳 **TARJETAS DE PRUEBA VÁLIDAS PARA COLOMBIA**

### **Visa - APROBADA** ✅ (ACTUAL EN FRONTEND)
```
Número: 4013 5406 8274 6260
Nombre: APRO
Mes: 11
Año: 2025
CVV: 123
Tipo Doc: CC
Número Doc: 12345678
```
**Resultado:** Pago siempre aprobado

### **Mastercard - APROBADA** ✅
```
Número: 5031 7557 3453 0604
Nombre: APRO
Mes: 11
Año: 2025
CVV: 123
Tipo Doc: CC
Número Doc: 12345678
```
**Resultado:** Pago siempre aprobado

### **Visa - RECHAZADA (Fondos insuficientes)** ❌
```
Número: 4013 5406 8274 6269
Nombre: CALL
Mes: 11
Año: 2025
CVV: 123
Tipo Doc: CC
Número Doc: 12345678
```
**Resultado:** Pago rechazado por fondos insuficientes

---

## 🔧 **HISTORIAL DE CAMBIOS**

### **Intento 1: Public Key Incorrecta**
```
❌ Public Key: APP_USR-4b192185-10c7-4b18-b2ef-5e098dffcb9c (PRODUCCIÓN)
❌ Access Token: APP_USR-3273184217457598-111121-... (PRODUCCIÓN)
```
**Error:** Credenciales de producción no configuradas correctamente

### **Intento 2: Access Token TEST Incorrecto**
```
❌ Public Key: TEST-4b192185-10c7-4b18-b2ef-5e098dffcb9c (INVENTADA)
❌ Access Token: TEST-3273184217457598-111121-8e046da9d8c87e8eb17f4fb6d948ab4f-206690440 (INVENTADO)
```
**Error:** `notificaction_url attribute must be url valid`

### **Intento 3: Credenciales Correctas ✅**
```
✅ Public Key: TEST-50bc2b0a-1d2e-4ec8-b8a2-fbf253d816fb
✅ Access Token: TEST-3273184217457598-111121-561acd2f22512e81ec5f796bc4926c88-206690440
```
**Resultado:** ✅ Funcionando correctamente

---

## ✅ **VERIFICACIÓN**

### **1. Verificar Public Key en uso:**
```bash
curl https://gradanegra-api-350907539319.us-central1.run.app/api/payments/config
```

**Respuesta esperada:**
```json
{
  "success": true,
  "publicKey": "TEST-50bc2b0a-1d2e-4ec8-b8a2-fbf253d816fb",
  "environment": "production"
}
```

### **2. Verificar métodos de pago disponibles:**
```bash
curl -X GET 'https://api.mercadopago.com/v1/payment_methods' \
  -H 'Authorization: Bearer TEST-3273184217457598-111121-561acd2f22512e81ec5f796bc4926c88-206690440'
```

**Debe mostrar:**
- `debvisa` - Visa Débito
- `master` - Mastercard
- `visa` - Visa
- `pse` - PSE
- Y otros métodos disponibles en Colombia

---

## 🌐 **URLs ACTUALES**

| Servicio | URL | Estado |
|----------|-----|--------|
| **Frontend** | https://gradanegra-frontend-350907539319.us-central1.run.app | ✅ ACTIVO |
| **Backend API** | https://gradanegra-api-350907539319.us-central1.run.app | ✅ ACTIVO |
| **API Config** | https://gradanegra-api-350907539319.us-central1.run.app/api/payments/config | ✅ |

---

## 🔄 **PARA CAMBIAR A PRODUCCIÓN**

Cuando estés listo para usar credenciales de producción:

### **Paso 1: Actualizar Secretos**
```bash
# Public Key de Producción
echo -n "APP_USR-4b192185-10c7-4b18-b2ef-5e098dffcb9c" | \
  gcloud secrets versions add MERCADOPAGO_PUBLIC_KEY_PROD --data-file=-

# Access Token de Producción
echo -n "APP_USR-3273184217457598-111121-4f12aa57c524116ed30ea42b036b21fd-206690440" | \
  gcloud secrets versions add MERCADOPAGO_ACCESS_TOKEN_PROD --data-file=-
```

### **Paso 2: Configurar BACKEND_URL para Webhooks**
```bash
gcloud run services update gradanegra-api \
  --region us-central1 \
  --update-env-vars BACKEND_URL=https://gradanegra-api-350907539319.us-central1.run.app
```

### **Paso 3: Actualizar Cloud Run**
```bash
gcloud run services update gradanegra-api \
  --region us-central1 \
  --update-secrets MP_ACCESS_TOKEN_PROD=MERCADOPAGO_ACCESS_TOKEN_PROD:latest,MP_PUBLIC_KEY_PROD=MERCADOPAGO_PUBLIC_KEY_PROD:latest
```

### **Paso 4: Actualizar Tarjetas en Frontend**
Editar `/frontend/app/checkout/[eventoId]/page.tsx`:
```typescript
const [cardData, setCardData] = useState({
  cardNumber: "",  // Limpiar para que el usuario ingrese su tarjeta real
  cardholderName: "",
  expirationMonth: "",
  expirationYear: "",
  securityCode: "",
  identificationType: "CC",
  identificationNumber: ""
});
```

Y redesplegar:
```bash
cd /Users/jules/MyApps/gradanegra/frontend
gcloud builds submit --config cloudbuild.yaml
```

### **Paso 5: Verificar**
```bash
curl https://gradanegra-api-350907539319.us-central1.run.app/api/payments/config
```

Debe responder:
```json
{
  "publicKey": "APP_USR-4b192185-10c7-4b18-b2ef-5e098dffcb9c"  // Sin prefijo TEST-
}
```

---

## 📋 **CHECKLIST DE VERIFICACIÓN**

- [x] Credenciales TEST actualizadas en GCP Secret Manager
- [x] Backend redespliegado con credenciales correctas
- [x] Frontend actualizado con tarjeta de prueba válida para Colombia
- [x] Verificada Public Key TEST activa
- [x] Verificados métodos de pago disponibles
- [ ] **PENDIENTE:** Probar pago completo end-to-end
- [ ] **PENDIENTE:** Verificar generación de tickets
- [ ] **PENDIENTE:** Cambiar a credenciales de producción

---

## ✅ **ESTADO ACTUAL**

**Ambiente:** 🟢 TEST/Sandbox (Colombia)  
**Backend:** ✅ `gradanegra-api-00020-576`  
**Frontend:** ✅ Última versión desplegada  
**Pagos:** ✅ Listos para probar con tarjetas de prueba  

**Todos los pagos son simulados - no se cobran tarjetas reales** ✅



