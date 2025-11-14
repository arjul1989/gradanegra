# 🚀 Deployment Directo a GCP (Sin GitHub)

## Situación Actual

GitHub está bloqueando el push por credenciales de Firebase en el historial.

## Solución: Deploy Directo desde Local

Podemos desplegar directamente a Cloud Run sin pasar por GitHub.

---

## 📋 Comandos de Deployment

### 1. Backend

```bash
# Navegar al directorio backend
cd backend

# Deploy directo a Cloud Run
gcloud run deploy gradanegra-api \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --memory 1Gi \
  --timeout 300 \
  --project gradanegra-prod

cd ..
```

### 2. Frontend

```bash
# Navegar al directorio frontend
cd frontend

# Deploy directo a Cloud Run
gcloud run deploy gradanegra-frontend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 5 \
  --memory 512Mi \
  --timeout 60 \
  --project gradanegra-prod

cd ..
```

---

## ✅ Verificación

```bash
# Health check backend
curl https://gradanegra-api-350907539319.us-central1.run.app/health

# Health check frontend
curl https://gradanegra-frontend-350907539319.us-central1.run.app
```

---

## 🔧 Solución del Problema de GitHub (Para Después)

### Opción 1: Limpiar Historial (Recomendado)

```bash
# Instalar git-filter-repo
brew install git-filter-repo

# Limpiar archivo del historial
git filter-repo --path backend/firebase-credentials.json --invert-paths

# Force push
git push origin main --force
```

### Opción 2: Permitir Secret Temporalmente

1. Visitar: https://github.com/arjul1989/gradanegra/security/secret-scanning/unblock-secret/35Rk7UhxUvw8ypVc9RJTAZ6yGwJ
2. Hacer clic en "Allow secret"
3. Push inmediatamente
4. Rotar credenciales después

---

## 📊 Estado Actual

- ✅ Código listo para deployment
- ✅ Backend funcional localmente
- ✅ Frontend funcional localmente
- ✅ Integración MercadoPago completa
- ✅ Sistema de buyers con OAuth
- ✅ Panel de administración
- ⏳ Pendiente: Deploy a producción
- ⏳ Pendiente: Limpiar historial de Git

---

**Ejecutar ahora**: Los comandos de arriba desplegarán directamente a GCP
