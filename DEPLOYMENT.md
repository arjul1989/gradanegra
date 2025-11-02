# 🚀 Deployment a Google Cloud Platform

Guía para desplegar Grada Negra a GCP usando Cloud Run.

## Prerrequisitos

1. **Google Cloud SDK (gcloud)**
   ```bash
   # Instalar (macOS con Homebrew)
   brew install --cask google-cloud-sdk
   
   # O descargar desde: https://cloud.google.com/sdk/docs/install
   ```

2. **Autenticación**
   ```bash
   gcloud auth login
   gcloud config set project gradanegra-prod
   ```

3. **Credenciales de Firebase**
   - Archivo `backend/firebase-credentials.json` debe existir
   - Se descarga desde Firebase Console → Project Settings → Service Accounts

## 🎯 Deployment Completo (Recomendado)

Ejecuta el script maestro que despliega todo automáticamente:

```bash
cd scripts
./deploy-gcp.sh
```

Este script:
- ✅ Verifica autenticación y proyecto
- ✅ Habilita APIs necesarias de GCP
- ✅ Configura secretos de Firebase en Secret Manager
- ✅ Despliega backend a Cloud Run
- ✅ Despliega frontend a Cloud Run
- ✅ Muestra URLs finales

## 📦 Deployment Individual

### Backend

```bash
cd scripts
./deploy-backend.sh
```

### Frontend

```bash
cd scripts
./deploy-frontend.sh
```

> ⚠️ **Importante**: El frontend necesita que el backend esté desplegado primero.

## 🔧 Configuración Manual

### 1. Habilitar APIs

```bash
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  --project=gradanegra-prod
```

### 2. Crear Secretos

```bash
# Private Key
cat backend/firebase-credentials.json | jq -r '.private_key' | \
  gcloud secrets create firebase-private-key \
  --data-file=- \
  --replication-policy="automatic" \
  --project=gradanegra-prod

# Client Email
cat backend/firebase-credentials.json | jq -r '.client_email' | \
  gcloud secrets create firebase-client-email \
  --data-file=- \
  --replication-policy="automatic" \
  --project=gradanegra-prod
```

### 3. Deploy Backend Manualmente

```bash
cd backend

gcloud run deploy gradanegra-api \
  --source . \
  --project gradanegra-prod \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production,FIREBASE_PROJECT_ID=gradanegra-prod" \
  --set-secrets "FIREBASE_PRIVATE_KEY=firebase-private-key:latest,FIREBASE_CLIENT_EMAIL=firebase-client-email:latest"
```

### 4. Deploy Frontend Manualmente

```bash
cd frontend

# Obtener URL del backend
BACKEND_URL=$(gcloud run services describe gradanegra-api \
  --project gradanegra-prod \
  --region us-central1 \
  --format 'value(status.url)')

gcloud run deploy gradanegra-frontend \
  --source . \
  --project gradanegra-prod \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars "\
NODE_ENV=production,\
NEXT_PUBLIC_API_URL=$BACKEND_URL,\
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDa0qWOCHkldgquB51q8oZtMI4Aoqx84lw,\
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gradanegra-prod.firebaseapp.com,\
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gradanegra-prod,\
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gradanegra-prod.appspot.com,\
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=350907539319,\
NEXT_PUBLIC_FIREBASE_APP_ID=1:350907539319:web:d1206f7b3180d3abd94b72"
```

## 📊 Monitoreo

### Ver Logs

```bash
# Backend
gcloud run services logs read gradanegra-api \
  --project gradanegra-prod \
  --region us-central1 \
  --follow

# Frontend
gcloud run services logs read gradanegra-frontend \
  --project gradanegra-prod \
  --region us-central1 \
  --follow
```

### Ver Estado de Servicios

```bash
# Listar servicios
gcloud run services list --project gradanegra-prod --region us-central1

# Descripción detallada
gcloud run services describe gradanegra-api --project gradanegra-prod --region us-central1
gcloud run services describe gradanegra-frontend --project gradanegra-prod --region us-central1
```

## 🔄 Actualizar Deployment

Para redesplegar con cambios:

```bash
# Opción 1: Script automático
cd scripts
./deploy-gcp.sh

# Opción 2: Solo backend o frontend
./deploy-backend.sh
./deploy-frontend.sh
```

## 🌐 URLs de Producción

Después del deployment, las URLs serán:

- **Frontend**: `https://gradanegra-frontend-[hash].us-central1.run.app`
- **Backend**: `https://gradanegra-api-[hash].us-central1.run.app`

Puedes obtenerlas con:

```bash
gcloud run services describe gradanegra-frontend \
  --project gradanegra-prod \
  --region us-central1 \
  --format 'value(status.url)'
```

## 🔐 Configuración de Dominio Personalizado

1. Ve a Cloud Run Console
2. Selecciona el servicio (frontend)
3. Click en "Manage Custom Domains"
4. Sigue las instrucciones para mapear tu dominio

## 💰 Costos Estimados

Cloud Run cobra por:
- ✅ Uso de CPU y memoria (solo cuando se usa)
- ✅ Número de peticiones
- ✅ Tráfico de red

Estimado mensual con uso moderado: $5-20 USD

## 🐛 Troubleshooting

### Error: "Permission denied"

```bash
# Verificar permisos
gcloud projects get-iam-policy gradanegra-prod

# Agregar rol de Editor si es necesario
gcloud projects add-iam-policy-binding gradanegra-prod \
  --member="user:TU_EMAIL@gmail.com" \
  --role="roles/editor"
```

### Error: "API not enabled"

```bash
gcloud services enable NOMBRE_API.googleapis.com --project=gradanegra-prod
```

### Error en build del Frontend

```bash
# Verificar que next.config.ts tiene output: 'standalone'
cat frontend/next.config.ts | grep standalone
```

## 📝 Notas

- Los secretos de Firebase se manejan con **Secret Manager** (más seguro que variables de entorno)
- El backend usa **Cloud Run** con 1GB RAM y 1 CPU
- El frontend usa **Cloud Run** con 512MB RAM y 1 CPU
- Ambos servicios escalan automáticamente de 0 a 10 instancias
- El tiempo de timeout es de 5 minutos (300s)

## ✅ Checklist Post-Deployment

- [ ] Verificar health check del backend: `https://[backend-url]/health`
- [ ] Verificar eventos públicos: `https://[backend-url]/api/public/events`
- [ ] Abrir frontend en navegador
- [ ] Probar login con Firebase
- [ ] Probar "Mis Boletos"
- [ ] Verificar que las imágenes carguen
- [ ] Revisar logs por errores
- [ ] Configurar alertas en Cloud Monitoring (opcional)
- [ ] Configurar dominio personalizado (opcional)

## 📞 Soporte

Para problemas con el deployment, revisa:
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- Logs en Cloud Console: https://console.cloud.google.com/logs
