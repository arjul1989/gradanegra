# 🚀 DEPLOYMENT RÁPIDO - EJECUTA ESTOS COMANDOS

## 📋 Instrucciones

Abre una terminal nueva y ejecuta estos comandos uno por uno. **NO uses VS Code terminal**, usa Terminal.app o iTerm.

---

## 1️⃣ BACKEND (5-10 minutos)

```bash
cd /Users/jules/MyApps/gradanegra/backend

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
  --set-env-vars "NODE_ENV=production,FIREBASE_PROJECT_ID=gradanegra-prod"
```

**Espera a que termine completamente.** Verás algo como:
```
✓ Deploying... Done.
  ✓ Creating Revision...
  ✓ Routing traffic...
Service URL: https://gradanegra-api-XXXXX-uc.a.run.app
```

---

## 2️⃣ FRONTEND (5-10 minutos)

**IMPORTANTE:** Primero obtén la URL del backend que acabas de desplegar.

```bash
cd /Users/jules/MyApps/gradanegra/frontend

# Obtener URL del backend
BACKEND_URL=$(gcloud run services describe gradanegra-api \
  --project gradanegra-prod \
  --region us-central1 \
  --format 'value(status.url)')

echo "Backend URL: $BACKEND_URL"

# Desplegar frontend
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
  --set-env-vars "NODE_ENV=production,NEXT_PUBLIC_API_URL=$BACKEND_URL,NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDa0qWOCHkldgquB51q8oZtMI4Aoqx84lw,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gradanegra-prod.firebaseapp.com,NEXT_PUBLIC_FIREBASE_PROJECT_ID=gradanegra-prod,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gradanegra-prod.appspot.com,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=350907539319,NEXT_PUBLIC_FIREBASE_APP_ID=1:350907539319:web:d1206f7b3180d3abd94b72"
```

---

## 3️⃣ VERIFICAR

Una vez que ambos deployments terminen:

```bash
# Ver URL del backend
gcloud run services describe gradanegra-api \
  --project gradanegra-prod \
  --region us-central1 \
  --format 'value(status.url)'

# Ver URL del frontend
gcloud run services describe gradanegra-frontend \
  --project gradanegra-prod \
  --region us-central1 \
  --format 'value(status.url)'
```

---

## ✅ PRUEBAS

1. **Backend Health Check:**
   ```bash
   curl https://[TU-BACKEND-URL]/health
   ```
   Debe responder: `{"status":"healthy",...}`

2. **Backend Events:**
   ```bash
   curl https://[TU-BACKEND-URL]/api/public/events
   ```
   Debe devolver JSON con eventos

3. **Frontend:**
   - Abre la URL del frontend en tu navegador
   - Deberías ver la página principal con eventos
   - Intenta hacer login
   - Ve a "Mis Boletos" - deberías ver tus 5 tickets

---

## 🐛 Si hay errores

### Error: "API not enabled"
```bash
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project=gradanegra-prod
```

### Ver logs del backend
```bash
gcloud run services logs read gradanegra-api \
  --project gradanegra-prod \
  --region us-central1 \
  --limit 50
```

### Ver logs del frontend
```bash
gcloud run services logs read gradanegra-frontend \
  --project gradanegra-prod \
  --region us-central1 \
  --limit 50
```

---

## ⏱️ Tiempo estimado

- Backend: 5-10 minutos
- Frontend: 5-10 minutos
- **Total: 10-20 minutos**

---

## 📝 Notas

- El build del backend es más rápido porque solo instala dependencias de Node
- El build del frontend toma más tiempo porque Next.js debe compilar todo
- La primera vez puede tomar más tiempo porque crea el repositorio de Artifact Registry
- Los deployments subsecuentes serán más rápidos (usan caché)

---

## 🎉 Al finalizar

Tendrás:
- ✅ Backend en Cloud Run con escala automática
- ✅ Frontend en Cloud Run con escala automática
- ✅ Firebase Authentication funcionando
- ✅ Firestore con tus tickets
- ✅ URLs públicas para acceder a la aplicación

¡Listo para usar! 🚀
