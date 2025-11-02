# 🚀 Guía de Deployment a Google Cloud

## 📋 Pre-requisitos

- ✅ Google Cloud SDK instalado
- ✅ Proyecto `gradanegra-prod` creado
- ✅ Billing habilitado
- ✅ Docker instalado
- ✅ Autenticado en GCP (`gcloud auth login`)

---

## 🏗️ Paso 1: Setup de Infraestructura (Una sola vez)

Este paso configura toda la infraestructura necesaria en GCP:

```bash
cd /Users/jules/MyApps/gradanegra
./scripts/setup-gcp-infrastructure.sh
```

**Esto hace:**
- ✅ Habilita APIs necesarias (Cloud Run, Cloud Build, Secret Manager, etc.)
- ✅ Crea Service Account para Cloud Run
- ✅ Asigna permisos IAM necesarios
- ✅ Muestra instrucciones para crear secrets

---

## 🔐 Paso 2: Configurar Secrets

### 2.1 Firebase Service Account Key

```bash
gcloud secrets create FIREBASE_PRIVATE_KEY \
  --data-file=backend/config/serviceAccountKey.json \
  --project=gradanegra-prod
```

### 2.2 Resend API Key

```bash
echo -n 're_TuAPIKeyAqui' | gcloud secrets create RESEND_API_KEY \
  --data-file=- \
  --project=gradanegra-prod
```

### 2.3 Verificar secrets

```bash
gcloud secrets list --project=gradanegra-prod
```

---

## 🚀 Paso 3: Primer Deploy Manual

### Opción A: Deploy a Production

```bash
cd /Users/jules/MyApps/gradanegra
./scripts/deploy.sh production
```

### Opción B: Deploy a Staging (primero)

```bash
./scripts/deploy.sh staging
```

**Esto hace:**
1. Build de imagen Docker
2. Push a Google Container Registry
3. Deploy a Cloud Run
4. Configura variables de entorno
5. Te da la URL del servicio

**Tiempo estimado:** 3-5 minutos

---

## ⏰ Paso 4: Configurar Recordatorios Automáticos

Después del primer deploy exitoso:

```bash
./scripts/setup-scheduler.sh
```

**Esto crea:**
- Cloud Scheduler job que ejecuta cada hora
- Endpoint: `/api/jobs/webhook/reminders`
- Timezone: America/Mexico_City

---

## 🔄 Paso 5: Configurar CI/CD (GitHub Actions)

### 5.1 Crear Service Account Key para GitHub

```bash
# Crear key JSON
gcloud iam service-accounts keys create ~/gcp-key.json \
  --iam-account=cloud-run-sa@gradanegra-prod.iam.gserviceaccount.com

# Ver contenido
cat ~/gcp-key.json
```

### 5.2 Agregar Secrets en GitHub

Ve a: `https://github.com/arjul1989/gradanegra/settings/secrets/actions`

**Crear estos secrets:**

1. **GCP_SA_KEY**
   - Pegar todo el contenido de `gcp-key.json`

2. **FIREBASE_PROJECT_ID**
   - Valor: `gradanegra-prod`

3. **FIREBASE_PRIVATE_KEY** (opcional, ya está en Secret Manager)
   - Valor: contenido de `serviceAccountKey.json`

4. **RESEND_API_KEY** (opcional, ya está en Secret Manager)
   - Valor: tu API key de Resend

### 5.3 Activar GitHub Actions

El workflow ya está en `.github/workflows/deploy.yml`

**Funcionamiento:**
- Push a `main` → Deploy automático a **production**
- Push a `staging` → Deploy automático a **staging**
- Pull Request → Solo ejecuta tests

---

## 🧪 Paso 6: Verificar Deployment

### 6.1 Obtener URL del servicio

```bash
gcloud run services describe gradanegra-api \
  --region us-central1 \
  --project gradanegra-prod \
  --format 'value(status.url)'
```

### 6.2 Test de health check

```bash
SERVICE_URL=$(gcloud run services describe gradanegra-api \
  --region us-central1 \
  --project gradanegra-prod \
  --format 'value(status.url)')

curl $SERVICE_URL/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-01T...",
  "service": "Grada Negra API",
  "version": "1.0.0"
}
```

### 6.3 Test de endpoint de tenants

```bash
curl $SERVICE_URL/api/tenants
```

---

## 📊 Monitoreo y Logs

### Ver logs en tiempo real

```bash
gcloud run services logs tail gradanegra-api \
  --region us-central1 \
  --project gradanegra-prod
```

### Ver logs en Cloud Console

https://console.cloud.google.com/run/detail/us-central1/gradanegra-api/logs?project=gradanegra-prod

### Ver métricas

```bash
gcloud run services describe gradanegra-api \
  --region us-central1 \
  --project gradanegra-prod
```

---

## 🔄 Deployments Subsecuentes

### Método 1: GitHub Actions (Recomendado)

```bash
git add .
git commit -m "nueva feature"
git push origin main
# GitHub Actions deploya automáticamente
```

### Método 2: Manual

```bash
./scripts/deploy.sh production
```

---

## 🎯 Configuración de Dominios (Opcional)

### 1. Mapear dominio custom

```bash
gcloud run domain-mappings create \
  --service gradanegra-api \
  --domain api.gradanegra.com \
  --region us-central1 \
  --project gradanegra-prod
```

### 2. Configurar DNS

Agregar estos registros en tu proveedor de DNS:
- **Tipo:** CNAME
- **Nombre:** api
- **Valor:** ghs.googlehosted.com

---

## 🔧 Troubleshooting

### Error: "Permission denied"

```bash
# Verificar autenticación
gcloud auth list

# Re-autenticar si es necesario
gcloud auth login
```

### Error: "Service account not found"

```bash
# Ejecutar setup de infraestructura nuevamente
./scripts/setup-gcp-infrastructure.sh
```

### Error: "Secret not found"

```bash
# Listar secrets
gcloud secrets list --project=gradanegra-prod

# Crear el secret faltante
gcloud secrets create NOMBRE_SECRET \
  --data-file=archivo.json \
  --project=gradanegra-prod
```

### Deploy falla en build

```bash
# Test local del Dockerfile
cd backend
docker build -t test-image .
docker run -p 8080:8080 test-image
```

### Cloud Scheduler no ejecuta

```bash
# Verificar job
gcloud scheduler jobs describe reminders-hourly \
  --location us-central1 \
  --project gradanegra-prod

# Ejecutar manualmente
gcloud scheduler jobs run reminders-hourly \
  --location us-central1 \
  --project gradanegra-prod
```

---

## 💰 Costos Estimados

### Free Tier (primeros meses)
- Cloud Run: 2M requests/mes GRATIS
- Container Registry: 0.5GB GRATIS
- Cloud Scheduler: 3 jobs GRATIS
- Secret Manager: 6 secrets GRATIS

### Después del Free Tier
- Cloud Run: ~$0.10 por 100K requests
- Cloud Scheduler: $0.10/mes por job
- Container Registry: $0.026/GB/mes

**Estimado para 10-20 eventos/mes:** $5-10 USD/mes

---

## 🎯 Checklist de Deployment

- [ ] Setup de infraestructura ejecutado
- [ ] Secrets creados (Firebase + Resend)
- [ ] Primer deploy manual exitoso
- [ ] Health check funciona
- [ ] Cloud Scheduler configurado
- [ ] GitHub Secrets configurados
- [ ] GitHub Actions funciona
- [ ] Logs verificados
- [ ] URL compartida con equipo

---

## 📞 Comandos Útiles

```bash
# Ver servicios activos
gcloud run services list --project=gradanegra-prod

# Ver revisiones
gcloud run revisions list \
  --service gradanegra-api \
  --region us-central1 \
  --project gradanegra-prod

# Rollback a versión anterior
gcloud run services update-traffic gradanegra-api \
  --to-revisions=REVISION_NAME=100 \
  --region us-central1 \
  --project gradanegra-prod

# Escalar instancias
gcloud run services update gradanegra-api \
  --min-instances=1 \
  --max-instances=10 \
  --region us-central1 \
  --project gradanegra-prod

# Eliminar servicio
gcloud run services delete gradanegra-api \
  --region us-central1 \
  --project gradanegra-prod
```

---

## 🚀 ¡Listo para Producción!

Una vez completados estos pasos:
- ✅ Backend en Cloud Run (escalable)
- ✅ CI/CD automático con GitHub
- ✅ Recordatorios ejecutando cada hora
- ✅ Monitoring y logs centralizados
- ✅ Rollback en 1 click
- ✅ HTTPS automático

**URL del servicio:** `https://gradanegra-api-XXXXX.run.app`

---

**Última actualización:** Noviembre 2024  
**Desarrollado por:** Jules + GitHub Copilot
