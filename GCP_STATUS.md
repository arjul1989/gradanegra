# ✅ Estado de Configuración de Google Cloud - Grada Negra

**Fecha:** Noviembre 1, 2025  
**Estado:** ✅ Autenticado | ⚠️ Billing Pendiente

---

## ✅ COMPLETADO

### 1. Autenticación Exitosa
- **Cuenta activa:** masterticketsas@gmail.com
- **Estado:** ✅ Autenticado correctamente

### 2. Proyecto Creado
- **Project ID:** `gradanegra-prod`
- **Project Name:** Grada Negra Production
- **Project Number:** 350907539319
- **Estado:** ✅ Creado y configurado como default

### 3. Región Configurada
- **Región:** us-central1
- **Zona:** us-central1-a
- **Estado:** ✅ Configurado

### 4. APIs Habilitadas
- **compute.googleapis.com** ✅ Habilitado
- **cloudapis.googleapis.com** ✅ Habilitado

---

## ⚠️ PENDIENTE: Configuración de Facturación

### ¿Por qué es necesario?

Google Cloud requiere una cuenta de facturación activa para usar la mayoría de los servicios, incluyendo:
- Cloud Run (hosting de aplicaciones)
- Cloud SQL (base de datos)
- Cloud Storage (almacenamiento de archivos)
- Secret Manager (gestión de secretos)
- Cloud Build (CI/CD)

---

## 🔧 CÓMO CONFIGURAR BILLING

### Opción 1: Desde Google Cloud Console (RECOMENDADO)

1. **Abre:** https://console.cloud.google.com/billing

2. **Inicia sesión** con: masterticketsas@gmail.com

3. **Opciones:**
   
   **A. Si NO tienes cuenta de facturación:**
   - Click en "CREATE BILLING ACCOUNT"
   - Ingresa información de tarjeta de crédito
   - Google te dará **$300 USD de créditos gratis** por 90 días
   - No te cobrarán hasta que uses los $300 o pasen 90 días
   
   **B. Si YA tienes cuenta de facturación:**
   - Click en "LINK A BILLING ACCOUNT"
   - Selecciona tu cuenta de facturación existente
   - Click en "SET ACCOUNT"

4. **Vincular al proyecto:**
   - Selecciona el proyecto "gradanegra-prod"
   - Click en "LINK BILLING ACCOUNT"

---

### Opción 2: Desde la Terminal (si ya tienes billing account)

```bash
# Listar cuentas de billing
gcloud billing accounts list

# Vincular proyecto a billing account
gcloud billing projects link gradanegra-prod \
    --billing-account=BILLING_ACCOUNT_ID
```

---

## 💰 Google Cloud Free Tier

### Créditos Iniciales:
- **$300 USD** gratis para nuevas cuentas
- Válido por **90 días**
- No se cobra automáticamente después

### Always Free (permanentemente gratis):
- Cloud Run: 2 millones de peticiones/mes
- Cloud Storage: 5 GB/mes
- Cloud Functions: 2 millones de invocaciones/mes
- Firestore: 1 GB de almacenamiento
- Cloud Build: 120 build-minutes/día

**Para Grada Negra MVP:** Los créditos gratuitos son más que suficientes para desarrollo y pruebas iniciales.

---

## 📊 Estimación de Costos Mensual (después de free tier)

### Escenario: 1000 usuarios activos, 10 eventos/mes

| Servicio | Uso Estimado | Costo Mensual |
|----------|--------------|---------------|
| Cloud Run | ~500K requests | $0 - $5 |
| Cloud SQL (db-f1-micro) | 1 instancia | $7 - $10 |
| Cloud Storage | ~5 GB | $0.10 |
| SendGrid (email) | ~1000 emails | $0 - $15 |
| **TOTAL** | | **~$25-30/mes** |

### Escenario: 10K usuarios activos, 100 eventos/mes

| Servicio | Uso Estimado | Costo Mensual |
|----------|--------------|---------------|
| Cloud Run | ~5M requests | $15 - $25 |
| Cloud SQL (db-g1-small) | 1 instancia | $25 - $35 |
| Cloud Storage | ~50 GB | $1 |
| SendGrid (email) | ~10K emails | $15 - $80 |
| **TOTAL** | | **~$60-140/mes** |

---

## 🚀 DESPUÉS DE CONFIGURAR BILLING

Una vez que hayas vinculado la cuenta de facturación, ejecuta:

```bash
# Habilitar todas las APIs necesarias
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    storage.googleapis.com \
    secretmanager.googleapis.com \
    firestore.googleapis.com \
    cloudscheduler.googleapis.com

# Verificar que se habilitaron
gcloud services list --enabled
```

---

## 📋 CHECKLIST DE CONFIGURACIÓN

- [x] ✅ Autenticación con Google Cloud
- [x] ✅ Proyecto "gradanegra-prod" creado
- [x] ✅ Región configurada (us-central1)
- [x] ✅ APIs básicas habilitadas
- [ ] ⚠️ **Billing account vinculada** ← PENDIENTE
- [ ] ⏳ APIs de servicios habilitadas (después de billing)
- [ ] ⏳ Service accounts creadas
- [ ] ⏳ Base de datos configurada

---

## 💡 PRÓXIMOS PASOS (después de billing)

### 1. Habilitar APIs
```bash
./scripts/enable-apis.sh
```

### 2. Configurar Application Default Credentials
```bash
gcloud auth application-default login
```

### 3. Crear Service Account
```bash
gcloud iam service-accounts create gradanegra-api \
    --display-name="Grada Negra API Service Account"
```

### 4. Crear Cloud SQL Instance
```bash
gcloud sql instances create gradanegra-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1
```

---

## 🔗 Links Útiles

- **Google Cloud Console:** https://console.cloud.google.com
- **Billing:** https://console.cloud.google.com/billing
- **Proyecto Grada Negra:** https://console.cloud.google.com/home/dashboard?project=gradanegra-prod
- **Free Tier Details:** https://cloud.google.com/free
- **Pricing Calculator:** https://cloud.google.com/products/calculator

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que tu tarjeta sea válida internacionalmente
2. Algunos bancos bloquean cargos de Google Cloud por seguridad
3. Contacta a tu banco si ves rechazos
4. Usa el chat de soporte en console.cloud.google.com

---

**Última actualización:** Noviembre 1, 2025  
**Proyecto:** gradanegra-prod (350907539319)  
**Cuenta:** masterticketsas@gmail.com  
**Estado:** Esperando configuración de billing para continuar
