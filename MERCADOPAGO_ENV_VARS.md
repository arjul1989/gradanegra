# 🔐 Variables de Entorno - Mercado Pago

## ⚠️ **IMPORTANTE**

Agrega estas variables a tu archivo `.env` del **backend**:

```bash
# ===================================
# MERCADO PAGO - CREDENCIALES
# ===================================

# --- CREDENCIALES DE PRUEBA (TEST) ---
MP_PUBLIC_KEY_TEST=TEST-50bc2b0a-1d2e-4ec8-b8a2-fbf253d816fb
MP_ACCESS_TOKEN_TEST=TEST-3273184217457598-111121-561acd2f22512e81ec5f796bc4926c88-206690440

# --- CREDENCIALES DE PRODUCCIÓN (PROD) ---
MP_PUBLIC_KEY_PROD=APP_USR-4b192185-10c7-4b18-b2ef-5e098dffcb9c
MP_ACCESS_TOKEN_PROD=APP_USR-3273184217457598-111121-4f12aa57c524116ed30ea42b036b21fd-206690440

# --- OTRAS CREDENCIALES ---
MP_CLIENT_ID=3273184217457598
MP_CLIENT_SECRET=zNdhqkieaVmP6ktnYZTDkBUPbjVyEozK

# ===================================
# CONFIGURACIÓN
# ===================================

# Ambiente (development = TEST, production = PROD)
NODE_ENV=development

# URLs para Webhooks (actualizar con tu dominio en producción)
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080
```

---

## 📍 **WEBHOOKS EN PRODUCCIÓN**

Cuando despliegues a Google Cloud, actualiza estas URLs en el panel de Mercado Pago:

**Webhook URL**: `https://gradanegra-api-juyoedy62a-uc.a.run.app/api/payments/webhook`

**IPN URL**: `https://gradanegra-api-juyoedy62a-uc.a.run.app/api/payments/ipn`

---

## 🔧 **CÓMO CONFIGURAR**

1. **Backend** (`/backend/.env`):
   - Copia y pega las variables de arriba

2. **Frontend** (no requiere credenciales privadas):
   - La Public Key se obtiene dinámicamente desde el backend
   - No expongas el Access Token en el frontend

3. **Google Cloud** (para producción):
   ```bash
   gcloud run services update gradanegra-api \
     --set-env-vars="NODE_ENV=production,MP_ACCESS_TOKEN_PROD=APP_USR-...,MP_PUBLIC_KEY_PROD=APP_USR-..." \
     --region=us-central1
   ```

---

## ✅ **VERIFICAR CONFIGURACIÓN**

Prueba que las variables estén cargadas:

```bash
cd backend
node -e "require('dotenv').config(); console.log('MP_ACCESS_TOKEN_TEST:', process.env.MP_ACCESS_TOKEN_TEST ? 'OK ✅' : 'FALTA ❌')"
```

---

**Fecha**: 11 de noviembre de 2025  
**Status**: ⚠️ **ACCIÓN REQUERIDA** - Agregar variables al `.env`

