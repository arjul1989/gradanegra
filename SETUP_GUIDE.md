# 🎯 Guía Rápida - Configuración Completa Post-Deployment

## Estado Actual ✅

- ✅ **Backend Desplegado:** https://gradanegra-api-350907539319.us-central1.run.app
- ✅ **Cloud Scheduler:** Configurado (reminders cada hora)
- ⏳ **Resend API:** Pendiente
- ⏳ **GitHub Actions:** Pendiente
- ⏳ **Dominio Custom:** Pendiente (opcional)

---

## 🚀 PASO 2: Configurar Resend para Emails

### ¿Qué hace?
Habilita el envío automático de emails:
- 📧 Email con ticket PDF cuando alguien compra
- 📅 Recordatorios 24h antes de eventos

### ¿Cuándo ejecutar?
**Ahora** - Es rápido y gratis (3000 emails/mes)

### Pasos:

#### 2.1 - Obtener API Key de Resend (5 min)
```bash
1. Ve a: https://resend.com/signup
2. Crea cuenta (gratis)
3. Verifica tu email
4. En el dashboard, ve a: API Keys
5. Click "Create API Key"
   - Name: "Grada Negra Production"
   - Permission: "Full Access"
6. Copia la key (empieza con 're_')
```

#### 2.2 - Ejecutar el script (1 min)
```bash
cd /Users/jules/MyApps/gradanegra
./scripts/setup-resend.sh
```

El script te pedirá:
1. Confirmar que tienes la API key
2. Pegar la API key
3. Automáticamente:
   - Guarda el secreto en Google Cloud
   - Actualiza el servicio Cloud Run
   - Habilita los emails

#### 2.3 - Verificar (opcional pero recomendado)
```bash
# Probar el endpoint de health
curl https://gradanegra-api-350907539319.us-central1.run.app/health

# Ver logs para confirmar que no hay warnings de Resend
gcloud run logs tail gradanegra-api --region us-central1
```

---

## 🔄 PASO 3: Configurar GitHub Actions (Auto-Deploy)

### ¿Qué hace?
Cada vez que hagas `git push`:
- ✅ Ejecuta tests automáticamente
- ✅ Construye la imagen Docker
- ✅ Deploya a Cloud Run automáticamente
- ✅ Te notifica si algo falla

### ¿Cuándo ejecutar?
**Cuando tengas el repo en GitHub** - Si aún no está en GitHub, configura esto después.

### Pre-requisito: ¿Tienes el código en GitHub?
```bash
# Verificar si tienes remote configurado
cd /Users/jules/MyApps/gradanegra
git remote -v

# Si NO sale nada, necesitas crear el repo en GitHub primero
```

### Si NO tienes el repo en GitHub (hazlo primero):
```bash
# 1. Ve a github.com y crea un nuevo repositorio
#    Nombre sugerido: "gradanegra"
#    Tipo: Private

# 2. Conecta tu código local
cd /Users/jules/MyApps/gradanegra
git init  # Si no lo has hecho
git add .
git commit -m "Initial commit - Backend deployed"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/gradanegra.git
git push -u origin main
```

### Pasos (una vez que el repo esté en GitHub):

#### 3.1 - Ejecutar el script
```bash
cd /Users/jules/MyApps/gradanegra
./scripts/setup-github-actions.sh
```

El script:
1. Crea service account para GitHub
2. Configura permisos necesarios
3. Genera una clave JSON
4. **Te muestra los secrets para copiar a GitHub**

#### 3.2 - Configurar Secrets en GitHub
El script te dará 3 secrets. Cópialos y:

```bash
1. Ve a: https://github.com/TU_USUARIO/gradanegra/settings/secrets/actions
2. Click "New repository secret"
3. Crea estos 3 secrets:

   Secret 1:
   Name: GCP_SA_KEY
   Value: [Todo el JSON que te mostró el script]

   Secret 2:
   Name: FIREBASE_PROJECT_ID
   Value: gradanegra-prod

   Secret 3:
   Name: GCS_BUCKET_NAME
   Value: gradanegra-prod-tickets
```

#### 3.3 - Probar (opcional)
```bash
# Hacer un cambio pequeño
echo "# Test" >> README.md
git add README.md
git commit -m "test: GitHub Actions"
git push origin main

# Ver el deployment en:
# https://github.com/TU_USUARIO/gradanegra/actions
```

---

## 🌐 PASO 4: Dominio Personalizado (OPCIONAL)

### ¿Qué hace?
Cambia la URL de:
```
https://gradanegra-api-350907539319.us-central1.run.app
```
A algo como:
```
https://api.gradanegra.com
```

### ¿Cuándo ejecutar?
**Solo si tienes un dominio** (ej: gradanegra.com)

Si no tienes dominio, puedes:
- ✅ Usar la URL actual (funciona perfectamente)
- 🛒 Comprar uno después en: Namecheap, GoDaddy, etc.

### Pasos (solo si tienes dominio):

#### 4.1 - Ejecutar el script
```bash
cd /Users/jules/MyApps/gradanegra
./scripts/setup-custom-domain.sh
```

#### 4.2 - Configurar DNS
El script te dará records DNS para agregar en tu proveedor de dominio.

Ejemplo:
```
Type: A
Name: api
Value: 216.239.32.21

Type: AAAA  
Name: api
Value: 2001:4860:4802:32::15
```

#### 4.3 - Esperar propagación
- Tiempo: 10-30 minutos (a veces hasta 48h)
- Google generará el certificado SSL automáticamente
- Tu API estará en: https://api.gradanegra.com

---

## 📋 Checklist de Ejecución

Ejecuta en este orden:

```bash
# ✅ PASO 1: COMPLETADO
# Cloud Scheduler ya configurado

# 🔄 PASO 2: Configura Resend (RECOMENDADO)
cd /Users/jules/MyApps/gradanegra
./scripts/setup-resend.sh

# 🔄 PASO 3: Configura GitHub Actions (si tienes repo en GitHub)
./scripts/setup-github-actions.sh
# Luego ve a GitHub y agrega los secrets

# 🔄 PASO 4: Dominio Custom (OPCIONAL - solo si tienes dominio)
./scripts/setup-custom-domain.sh
```

---

## ⚡ Quick Start - Configuración Mínima

Si quieres lo más rápido:

```bash
# Solo esto (5 minutos):
cd /Users/jules/MyApps/gradanegra

# 1. Resend (para emails)
./scripts/setup-resend.sh

# ¡Listo! Tu sistema está 100% funcional
```

GitHub Actions y dominio personalizado son **opcionales** y puedes hacerlos después.

---

## 🆘 Troubleshooting

### Resend no funciona
```bash
# Ver logs
gcloud run logs tail gradanegra-api --region us-central1 --project gradanegra-prod

# Verificar secreto
gcloud secrets describe RESEND_API_KEY --project gradanegra-prod
```

### GitHub Actions falla
```bash
# Ver logs en:
https://github.com/TU_USUARIO/gradanegra/actions

# Común: Permisos de service account
# Solución: Re-ejecutar ./scripts/setup-github-actions.sh
```

### Dominio no funciona
```bash
# Verificar estado
gcloud run domain-mappings describe api.tudominio.com \
  --region us-central1 \
  --project gradanegra-prod

# Verificar DNS propagación
dig api.tudominio.com
```

---

## 📞 Contacto

Si algo falla:
- 📧 masterticketsas@gmail.com
- 📂 Ver logs: Cloud Console > Cloud Run > gradanegra-api > Logs

---

**¡Tu backend está listo para producción! 🎉**
