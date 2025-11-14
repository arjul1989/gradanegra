# ✅ Despliegue Completo en Google Cloud Platform

**Fecha:** 12 de Noviembre de 2025  
**Proyecto:** gradanegra-prod  
**Región:** us-central1 (Iowa, USA)

---

## 🚀 **URLs de la Aplicación**

### **Frontend (Usuario Final)**
- **URL Principal:** https://gradanegra-frontend-350907539319.us-central1.run.app
- **Funcionalidades:**
  - ✅ Home page con eventos destacados
  - ✅ Navegación por categorías
  - ✅ Búsqueda y filtros por ciudad
  - ✅ Login/Registro de usuarios (Google + Email/Password)
  - ✅ Checkout con Mercado Pago (integración directa)
  - ✅ Visualización de tickets con QR
  - ✅ Perfil de usuario
  - ✅ Dark mode implementado

### **Backend (API)**
- **URL API:** https://gradanegra-api-350907539319.us-central1.run.app
- **Endpoint de salud:** https://gradanegra-api-350907539319.us-central1.run.app/health
- **Configuración de MP:** https://gradanegra-api-350907539319.us-central1.run.app/api/payments/config

---

## 🔐 **Configuración de Secretos**

Los siguientes secretos fueron creados en **Google Cloud Secret Manager**:

| Secreto | Uso | Configurado |
|---------|-----|-------------|
| `MERCADOPAGO_ACCESS_TOKEN_PROD` | Access Token de Mercado Pago para producción | ✅ |
| `MERCADOPAGO_PUBLIC_KEY_PROD` | Public Key de Mercado Pago para producción | ✅ |
| `SECRET_SALT` | Salt para generar hashes de seguridad de tickets | ✅ |

**Permisos:** Todos los secretos tienen permisos otorgados al service account de Cloud Run (`350907539319-compute@developer.gserviceaccount.com`).

---

## 📦 **Servicios Desplegados**

### **1. gradanegra-api (Backend)**
- **Imagen:** `gcr.io/gradanegra-prod/gradanegra-api:v20251112-004614`
- **Memoria:** 1Gi
- **Timeout:** 300s
- **Variables de entorno:**
  - `NODE_ENV=production`
  - `FIREBASE_PROJECT_ID=gradanegra-prod`
  - `GCS_BUCKET_NAME=gradanegra-prod-tickets`
- **Secretos montados:**
  - `MP_ACCESS_TOKEN_PROD` ← `MERCADOPAGO_ACCESS_TOKEN_PROD:latest`
  - `MP_PUBLIC_KEY_PROD` ← `MERCADOPAGO_PUBLIC_KEY_PROD:latest`
  - `SECRET_SALT` ← `SECRET_SALT:latest`

### **2. gradanegra-frontend (Frontend)**
- **Imagen:** `gcr.io/gradanegra-prod/gradanegra-frontend:latest`
- **Memoria:** 512Mi
- **Timeout:** 300s
- **Puerto:** 3000
- **Build Args (baked into image):**
  - `NEXT_PUBLIC_API_URL=https://gradanegra-api-350907539319.us-central1.run.app`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID=gradanegra-prod`
  - `NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBjWWCKF2hG3hEb_iYjNl5n3ht-2NGbXy4`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gradanegra-prod.firebaseapp.com`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gradanegra-prod.firebasestorage.app`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=350907539319`
  - `NEXT_PUBLIC_FIREBASE_APP_ID=1:350907539319:web:5fbca8e8be0ddeeeb06849`

---

## 🛠️ **Correcciones Realizadas Durante el Despliegue**

### **Backend**
1. ✅ Actualizado `cloudbuild.yaml` para usar `SHORT_SHA` en lugar de `COMMIT_SHA`
2. ✅ Agregados secretos de Mercado Pago y SECRET_SALT
3. ✅ Corregido mapeo de variables de entorno (`MP_ACCESS_TOKEN_PROD`, `MP_PUBLIC_KEY_PROD`)

### **Frontend**
1. ✅ Eliminado archivo `app/explorar/page.tsx` (modo exploración abandonado)
2. ✅ Agregado `Suspense` boundary a todas las páginas con `useSearchParams`:
   - `/pago/exito/page.tsx`
   - `/pago/fallo/page.tsx`
   - `/pago/pendiente/page.tsx`
3. ✅ Corregida configuración de build para Next.js 16 con Turbopack

### **Modelo de Tickets**
1. ✅ Corregida importación de `generateTicketHash` (antes `generateHash`)
2. ✅ Renombrado método `validate()` a `checkIn()` para evitar conflictos
3. ✅ Actualizado controlador de payments para usar `status: 'confirmed'`

---

## 🔄 **Comandos para Redespliegue**

### **Backend**
```bash
cd /Users/jules/MyApps/gradanegra/backend
BUILD_TAG="v$(date +%Y%m%d-%H%M%S)"
gcloud builds submit --tag gcr.io/gradanegra-prod/gradanegra-api:${BUILD_TAG}

gcloud run deploy gradanegra-api \
  --image gcr.io/gradanegra-prod/gradanegra-api:${BUILD_TAG} \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --timeout 300 \
  --set-env-vars NODE_ENV=production,FIREBASE_PROJECT_ID=gradanegra-prod,GCS_BUCKET_NAME=gradanegra-prod-tickets \
  --update-secrets MP_ACCESS_TOKEN_PROD=MERCADOPAGO_ACCESS_TOKEN_PROD:latest,MP_PUBLIC_KEY_PROD=MERCADOPAGO_PUBLIC_KEY_PROD:latest,SECRET_SALT=SECRET_SALT:latest
```

### **Frontend**
```bash
cd /Users/jules/MyApps/gradanegra/frontend
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_FIREBASE_API_KEY=AIzaSyBjWWCKF2hG3hEb_iYjNl5n3ht-2NGbXy4,_FIREBASE_AUTH_DOMAIN=gradanegra-prod.firebaseapp.com,_FIREBASE_STORAGE_BUCKET=gradanegra-prod.firebasestorage.app,_FIREBASE_MESSAGING_SENDER_ID=350907539319,_FIREBASE_APP_ID=1:350907539319:web:5fbca8e8be0ddeeeb06849
```

---

## 📊 **Verificación del Estado**

### **1. Verificar servicios activos**
```bash
gcloud run services list --platform managed --region us-central1
```

### **2. Ver logs del backend**
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=gradanegra-api" --limit 50 --format=json
```

### **3. Ver logs del frontend**
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=gradanegra-frontend" --limit 50 --format=json
```

### **4. Verificar salud del backend**
```bash
curl https://gradanegra-api-350907539319.us-central1.run.app/health
```

### **5. Verificar configuración de Mercado Pago**
```bash
curl https://gradanegra-api-350907539319.us-central1.run.app/api/payments/config
```

---

## 🎯 **Próximos Pasos Recomendados**

1. **Dominio Personalizado:**
   - Configurar un dominio como `www.gradanegra.com` apuntando al frontend
   - Configurar `api.gradanegra.com` apuntando al backend

2. **Monitoreo:**
   - Configurar alertas en Cloud Monitoring para errores 5xx
   - Configurar alertas para uso excesivo de memoria/CPU

3. **Optimizaciones:**
   - Habilitar Cloud CDN para el frontend
   - Configurar caché para assets estáticos

4. **Seguridad:**
   - Implementar Cloud Armor para protección DDoS
   - Configurar Cloud IAP si es necesario

5. **CI/CD:**
   - Configurar Cloud Build Triggers para despliegue automático desde GitHub/GitLab

---

## ✅ **Estado Final**

- ✅ Backend desplegado y funcionando
- ✅ Frontend desplegado y funcionando
- ✅ Mercado Pago configurado en modo producción
- ✅ Secretos configurados correctamente
- ✅ Todos los tickets generándose correctamente
- ✅ Sistema de pagos operativo

**¡La aplicación Grada Negra está completamente desplegada y operativa en Google Cloud Platform!** 🎉


