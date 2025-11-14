# 🚀 Instrucciones de Deployment a GCP

## ⚠️ Nota Importante sobre Credenciales

GitHub ha bloqueado el push porque detectó credenciales de Firebase en el historial de Git.

### Solución Recomendada:

1. **Permitir el secret temporalmente** usando el link proporcionado por GitHub
2. **Rotar las credenciales** inmediatamente después del deployment
3. **Actualizar .gitignore** para prevenir futuros commits (ya hecho)

### Links de GitHub para permitir secrets:

- Firebase Credentials: https://github.com/arjul1989/gradanegra/security/secret-scanning/unblock-secret/35Rk7UhxUvw8ypVc9RJTAZ6yGwJ

---

## 📋 Pasos para Deployment

### 1. Permitir el Push (Temporal)

Visita el link de arriba y permite el secret temporalmente.

### 2. Push a GitHub

```bash
git push origin main
```

### 3. Deploy Backend a Cloud Run

```bash
# Opción 1: Usando el script automatizado
./scripts/deploy-backend.sh

# Opción 2: Manual
gcloud run deploy gradanegra-api \
  --source ./backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --memory 1Gi \
  --timeout 300 \
  --set-env-vars="NODE_ENV=production"
```

### 4. Deploy Frontend a Cloud Run

```bash
# Opción 1: Usando el script automatizado
./scripts/deploy-frontend.sh

# Opción 2: Manual
gcloud run deploy gradanegra-frontend \
  --source ./frontend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 5 \
  --memory 512Mi \
  --timeout 60
```

### 5. Verificar Deployment

```bash
# Backend
curl https://gradanegra-api-350907539319.us-central1.run.app/health

# Frontend
curl https://gradanegra-frontend-350907539319.us-central1.run.app
```

---

## 🔐 Rotar Credenciales (IMPORTANTE)

Después del deployment exitoso:

### 1. Generar Nuevas Credenciales de Firebase

```bash
# En Firebase Console
# 1. Ir a Project Settings > Service Accounts
# 2. Generate New Private Key
# 3. Descargar el nuevo archivo JSON
```

### 2. Actualizar en Cloud Run

```bash
# Subir nuevo archivo a Secret Manager
gcloud secrets create firebase-credentials \
  --data-file=./backend/firebase-credentials-new.json

# Actualizar Cloud Run para usar el secret
gcloud run services update gradanegra-api \
  --region us-central1 \
  --update-secrets=FIREBASE_CREDENTIALS=firebase-credentials:latest
```

### 3. Revocar Credenciales Antiguas

En Firebase Console:
1. Ir a Project Settings > Service Accounts
2. Encontrar la cuenta de servicio antigua
3. Revocar/Eliminar

---

## 📊 URLs de Producción

- **Frontend**: https://gradanegra-frontend-350907539319.us-central1.run.app
- **Backend API**: https://gradanegra-api-350907539319.us-central1.run.app
- **Admin Panel**: https://gradanegra-frontend-350907539319.us-central1.run.app/admin

---

## 🔍 Monitoreo

```bash
# Ver logs del backend
gcloud run services logs read gradanegra-api --region us-central1 --limit 50

# Ver logs del frontend
gcloud run services logs read gradanegra-frontend --region us-central1 --limit 50

# Ver métricas
gcloud run services describe gradanegra-api --region us-central1
```

---

## 🐛 Troubleshooting

### Error: "Service account does not exist"
```bash
# Verificar que las credenciales estén en Secret Manager
gcloud secrets list

# Crear el secret si no existe
gcloud secrets create firebase-credentials \
  --data-file=./backend/firebase-credentials.json
```

### Error: "Permission denied"
```bash
# Verificar permisos
gcloud projects get-iam-policy gradanegra-prod

# Agregar rol necesario
gcloud projects add-iam-policy-binding gradanegra-prod \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT" \
  --role="roles/run.admin"
```

### Error: "Build failed"
```bash
# Ver logs detallados del build
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

---

## ✅ Checklist Post-Deployment

- [ ] Backend responde en /health
- [ ] Frontend carga correctamente
- [ ] Firebase Auth funciona
- [ ] Firestore lee/escribe datos
- [ ] MercadoPago procesa pagos
- [ ] Emails se envían correctamente
- [ ] Credenciales rotadas
- [ ] Secrets antiguos revocados
- [ ] Monitoreo configurado
- [ ] Alertas configuradas

---

**Última actualización**: Noviembre 2024
