# 🚀 Despliegue a Producción - Grada Negra

## ✅ Backend Desplegado Exitosamente

### URL de Producción
```
https://gradanegra-api-350907539319.us-central1.run.app
```

### Endpoints Funcionando
- ✅ **Health Check**: https://gradanegra-api-350907539319.us-central1.run.app/health
- ✅ **GET /api/categorias** - 9 categorías
- ✅ **GET /api/eventos/destacados** - 6 eventos destacados
- ✅ **GET /api/eventos/:id** - Detalle de evento
- ✅ **GET /api/eventos/:id/disponibilidad** - Disponibilidad
- ✅ **GET /api/eventos/categoria/:slug** - Eventos por categoría

### Configuración
```bash
Service: gradanegra-api
Region: us-central1
Platform: Cloud Run
Memory: 512Mi
Timeout: 60s
Max Instances: 10
Allow Unauthenticated: Yes
```

### Pruebas en Producción
```bash
# Health check
curl https://gradanegra-api-350907539319.us-central1.run.app/health

# Categorías (9)
curl https://gradanegra-api-350907539319.us-central1.run.app/api/categorias | jq '.count'

# Eventos destacados (6)
curl https://gradanegra-api-350907539319.us-central1.run.app/api/eventos/destacados | jq '.count'

# Ejemplo de respuesta
curl https://gradanegra-api-350907539319.us-central1.run.app/api/eventos/destacados | jq '.data[0]'
```

## 🔄 Frontend - En Proceso

### Configuración Preparada

#### `.env.production`
```bash
NEXT_PUBLIC_API_URL=https://gradanegra-api-350907539319.us-central1.run.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gradanegra-prod
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDa0qWOCHkldgquB51q8oZtMI4Aoqx84lw
# ... resto de variables Firebase
```

#### Dockerfile Optimizado
- Multi-stage build para Next.js
- Standalone output para menor tamaño
- Lee `.env.production` durante el build
- Usuario no-root para seguridad

#### Script de Despliegue
```bash
./deploy-production.sh
```

### Próximos Pasos para Frontend

1. **Revisar logs de Cloud Build** para identificar error específico
2. **Ajustar Dockerfile** si es necesario
3. **Alternativa**: Desplegar a Vercel (optimizado para Next.js)

### Comando Manual de Despliegue
```bash
cd frontend

gcloud run deploy gradanegra-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production" \
  --project gradanegra-prod
```

## 🎯 Estado Actual

### ✅ Funcionando
- [x] Backend API en producción
- [x] Firestore con 130K+ documentos
- [x] 7 endpoints REST funcionando
- [x] CORS configurado
- [x] Health checks activos
- [x] Índices de Firestore configurados
- [x] Reglas de seguridad desplegadas

### 🔄 En Progreso
- [ ] Frontend desplegado a Cloud Run
- [ ] DNS configurado (opcional)
- [ ] SSL/TLS automático (incluido con Cloud Run)

### ⏳ Pendiente
- [ ] Actualizar otras páginas del frontend (categoría, detalle)
- [ ] Testing end-to-end en producción
- [ ] Monitoreo y alertas
- [ ] Backups automáticos

## 📊 Arquitectura en Producción

```
┌─────────────────────────────────────────────┐
│           FRONTEND (Next.js 16)             │
│    Cloud Run / Vercel (Por desplegar)      │
│         https://gradanegra.com              │
└──────────────────┬──────────────────────────┘
                   │
                   │ HTTPS / axios
                   │
┌──────────────────▼──────────────────────────┐
│          BACKEND API (Express)              │
│           Cloud Run ✅ ACTIVO               │
│    gradanegra-api-...run.app                │
└──────────────────┬──────────────────────────┘
                   │
                   │ Firebase Admin SDK
                   │
┌──────────────────▼──────────────────────────┐
│         FIRESTORE (Database)                │
│          Cloud Firestore ✅                 │
│       130,140 documentos                    │
│                                             │
│  • 9 categorías                             │
│  • 3 comercios                              │
│  • 12 eventos (6 destacados)                │
│  • 26 fechas de eventos                     │
│  • 78 tiers                                 │
│  • ~130,000 boletos                         │
└─────────────────────────────────────────────┘
```

## 🔐 Seguridad

### Backend
- ✅ HTTPS forzado (Cloud Run automático)
- ✅ CORS configurado
- ✅ Helmet para headers de seguridad
- ✅ Variables de entorno en Cloud Run
- ✅ Usuario no-root en container

### Firestore
- ✅ Reglas de seguridad desplegadas
- ✅ Índices optimizados
- ✅ Soft delete implementado
- ✅ Firebase Admin SDK con service account

## 📈 Monitoreo

### Cloud Run Metrics
- Ver en: https://console.cloud.google.com/run/detail/us-central1/gradanegra-api/metrics?project=gradanegra-prod

### Métricas Disponibles
- Request count
- Request latencies
- Container CPU utilization
- Container memory utilization
- Billable container time
- Instance count

### Logs
```bash
# Ver logs del backend
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=gradanegra-api" \
  --limit 50 \
  --project gradanegra-prod

# Ver errores
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=gradanegra-api AND severity>=ERROR" \
  --limit 20 \
  --project gradanegra-prod
```

## 💰 Costos Estimados (Escala Inicial)

### Cloud Run Backend
- **Requests**: ~10,000/mes → $0 (dentro de free tier)
- **CPU time**: ~20 CPU-hours/mes → $0.50
- **Memory**: ~40 GB-hours/mes → $0.40
- **Total Backend**: ~$1/mes

### Firestore
- **Reads**: ~50,000/mes → $0 (free tier)
- **Writes**: ~1,000/mes → $0 (free tier)
- **Storage**: ~1 GB → $0.18/mes
- **Total Firestore**: ~$0.20/mes

### Cloud Run Frontend (cuando se despliegue)
- Similar al backend: ~$1/mes

### **TOTAL ESTIMADO**: ~$2.20/mes (escala inicial)

## 🚀 Comandos Útiles

### Backend
```bash
# Ver servicio
gcloud run services describe gradanegra-api --region us-central1

# Ver logs en tiempo real
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=gradanegra-api"

# Actualizar configuración
gcloud run services update gradanegra-api \
  --region us-central1 \
  --memory 1Gi
```

### Frontend (cuando esté desplegado)
```bash
# Ver servicio
gcloud run services describe gradanegra-frontend --region us-central1

# Actualizar
cd frontend && ./deploy-production.sh
```

### Firestore
```bash
# Ver índices
firebase firestore:indexes --project gradanegra-prod

# Desplegar reglas
firebase deploy --only firestore:rules --project gradanegra-prod
```

## 🎉 Logros de Este Despliegue

1. ✅ **Backend API desplegado** y funcionando en Cloud Run
2. ✅ **7 endpoints REST** probados y operativos
3. ✅ **130K+ documentos** en Firestore accesibles via API
4. ✅ **Infraestructura escalable** con Cloud Run
5. ✅ **Monitoreo integrado** con Cloud Logging
6. ✅ **Costos optimizados** (~$2/mes inicial)
7. ✅ **SSL/TLS automático** incluido
8. ✅ **Health checks** funcionando

---

**Fecha**: 2025-11-06  
**Versión**: 3.0 - Production Deployment  
**Status**: 🎉 **Backend en Producción - Frontend en Desarrollo Local**
