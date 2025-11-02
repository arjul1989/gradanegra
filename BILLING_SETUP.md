# 💰 Instrucciones para Vincular Billing Account

## ⚠️ ACCIÓN REQUERIDA

El billing debe vincularse desde la consola web de Google Cloud.

---

## 📋 PASOS EXACTOS

### 1. Abre la Consola de Billing
👉 **https://console.cloud.google.com/billing?project=gradanegra-prod**

### 2. Sigue estas instrucciones:

#### Si NO tienes cuenta de billing:
1. Click en **"CREATE BILLING ACCOUNT"**
2. Completa el formulario con:
   - Nombre de la cuenta
   - País (Colombia)
   - Tarjeta de crédito/débito
3. **Recibirás $300 USD gratis** por 90 días
4. Acepta términos y condiciones
5. Click en **"START MY FREE TRIAL"**

#### Si YA tienes cuenta de billing:
1. En la parte superior, click en **"LINK A BILLING ACCOUNT"**
2. Selecciona tu cuenta de facturación existente
3. Click en **"SET ACCOUNT"**

### 3. Vincular al Proyecto
1. Ve a **"Account Management"** en el menú izquierdo
2. Click en **"MY PROJECTS"**
3. Busca **"gradanegra-prod"**
4. Click en los 3 puntos (⋮) al lado del proyecto
5. Click en **"Change billing"**
6. Selecciona tu billing account
7. Click en **"SET ACCOUNT"**

---

## 🔍 VERIFICAR QUE FUNCIONÓ

Una vez vinculado, ejecuta en la terminal:

```bash
gcloud billing projects describe gradanegra-prod
```

Deberías ver:
```yaml
billingAccountName: billingAccounts/XXXXXX-XXXXXX-XXXXXX
billingEnabled: true
name: projects/gradanegra-prod/billingInfo
projectId: gradanegra-prod
```

---

## 💰 ESTRATEGIA $0 PARA DESARROLLO

### Servicios que usaremos SIN COSTO:

#### 1. **Cloud Run** (Free Tier permanente)
- ✅ 2 millones de requests/mes GRATIS
- ✅ 360,000 GB-segundos/mes GRATIS
- ✅ 180,000 vCPU-segundos/mes GRATIS
- **Estrategia:** Configurar min-instances=0 (escala a 0)

#### 2. **Cloud SQL** (Cuidado con costos)
- ⚠️ No tiene free tier permanente
- **Alternativa GRATIS:** Usar **Firestore/Firebase** para MVP
- **Otra alternativa:** PostgreSQL en Cloud Run (contenedor)
- **Plan B:** db-f1-micro = ~$7/mes (más barato)

#### 3. **Cloud Storage** (Free Tier permanente)
- ✅ 5 GB/mes GRATIS
- ✅ 5,000 operaciones Class A/mes
- ✅ 50,000 operaciones Class B/mes

#### 4. **Secret Manager** (Free)
- ✅ 6 versiones activas de secretos GRATIS
- ✅ 10,000 accesos/mes GRATIS

#### 5. **Cloud Build** (Free Tier)
- ✅ 120 build-minutes/día GRATIS

#### 6. **Firebase/Firestore** (Free Tier permanente)
- ✅ 1 GB almacenamiento GRATIS
- ✅ 50K lecturas/día GRATIS
- ✅ 20K escrituras/día GRATIS
- ✅ 20K deletes/día GRATIS

---

## 🎯 CONFIGURACIÓN RECOMENDADA PARA $0

### Arquitectura MVP Sin Costos:

```
┌─────────────────────────────────────────────────────┐
│                   Frontend                          │
│              (Vercel - FREE)                        │
│              o Netlify - FREE                       │
│              o GitHub Pages                         │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              Cloud Run API                          │
│         (min-instances: 0)                          │
│         (FREE TIER: 2M requests/mes)                │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│           Firestore Database                        │
│         (FREE: 1GB + 50K reads/día)                 │
└─────────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│          Cloud Storage                              │
│       (FREE: 5GB almacenamiento)                    │
│       (Logos, PDFs, assets)                         │
└─────────────────────────────────────────────────────┘
```

### Para emails (tickets):
- **SendGrid:** 100 emails/día GRATIS
- **Resend:** 3,000 emails/mes GRATIS (recomendado)
- **Mailgun:** 5,000 emails/mes GRATIS (primeros 3 meses)

---

## 📊 MONITOREO DE COSTOS

### Configurar alertas ANTES de que genere costos:

```bash
# Una vez vinculado el billing, ejecuta:
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Grada Negra Budget Alert" \
  --budget-amount=5USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

### Ver costos en tiempo real:
👉 **https://console.cloud.google.com/billing/reports?project=gradanegra-prod**

---

## ⚡ ALTERNATIVAS SI QUIERES 100% GRATIS

### Opción 1: Supabase (Backend completo gratis)
- PostgreSQL gratis
- Storage gratis (1GB)
- Auth gratis
- APIs automáticas
- **Límite:** 500MB DB, 1GB storage

### Opción 2: PlanetScale (MySQL gratis)
- 5GB almacenamiento
- 1 billion row reads/mes
- 10 million row writes/mes

### Opción 3: Railway (PostgreSQL + hosting gratis)
- $5 USD/mes de crédito gratis
- PostgreSQL incluido
- Auto-deploy desde GitHub

### Opción 4: Render (Backend + DB gratis)
- PostgreSQL gratis (expira cada 90 días, pero puedes renovar)
- Web services gratis (con sleep después de inactividad)

---

## 🚨 COSAS QUE COBRAN (EVITAR EN MVP)

❌ **Cloud SQL** (sin free tier permanente)
❌ **Cloud Load Balancer** ($18/mes base)
❌ **Cloud NAT** ($44/mes aprox)
❌ **Persistent Disks** (sin free tier)
❌ **Static External IPs** ($7/mes)
❌ **Cloud Run con min-instances > 0** (siempre cobra)

---

## ✅ CHECKLIST ANTES DE CONTINUAR

- [ ] Billing account creada
- [ ] Billing vinculado a "gradanegra-prod"
- [ ] Verificado con: `gcloud billing projects describe gradanegra-prod`
- [ ] Decidido: ¿Firestore o Cloud SQL?
- [ ] Configurar alertas de presupuesto en $5 USD

---

## 🎯 DESPUÉS DE VINCULAR BILLING

Ejecutaremos:
1. `./scripts/enable-apis.sh` - Habilitar todas las APIs
2. Configurar Firestore (GRATIS)
3. Deploy de Cloud Run con min-instances=0 (GRATIS)
4. Configurar Cloud Storage (GRATIS dentro de 5GB)
5. Integrar SendGrid/Resend para emails (GRATIS)

---

**🔔 AVÍSAME CUANDO HAYAS VINCULADO EL BILLING Y CONTINUAMOS**

Mientras tanto, voy a preparar toda la estructura del código para que podamos hacer deploy inmediatamente.
