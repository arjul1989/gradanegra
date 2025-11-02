# 🔐 Configuración de Google Cloud Platform

## ✅ Paso 1: Google Cloud SDK Instalado

Google Cloud SDK ya está instalado en tu sistema:
- **Versión:** 545.0.0
- **Ubicación:** `/Users/jules/google-cloud-sdk`

---

## 📋 Paso 2: Autenticación con Google Cloud

### **Opción A: Autenticación de Usuario (Recomendado para desarrollo)**

Ejecuta el siguiente comando para autenticarte con tu cuenta de Google:

```bash
gcloud auth login
```

Esto abrirá tu navegador para que inicies sesión con tu cuenta de Google Cloud.

---

## 🏢 Paso 3: Configurar Proyecto

### 3.1 Listar proyectos existentes

```bash
gcloud projects list
```

### 3.2 Crear un nuevo proyecto (si no tienes uno)

```bash
gcloud projects create gradanegra-prod --name="Grada Negra"
```

### 3.3 Establecer proyecto activo

```bash
gcloud config set project gradanegra-prod
```

---

## 🌍 Paso 4: Configurar Región por Defecto

Se recomienda `us-central1` o `southamerica-east1` (São Paulo) para latencia:

```bash
# Para región de US
gcloud config set compute/region us-central1
gcloud config set compute/zone us-central1-a

# O para región de Sudamérica
gcloud config set compute/region southamerica-east1
gcloud config set compute/zone southamerica-east1-a
```

---

## 🔑 Paso 5: Habilitar APIs Necesarias

Habilita las APIs que usaremos:

```bash
# APIs esenciales
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable cloudtasks.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable firebase.googleapis.com
```

---

## 🗝️ Paso 6: Configuración de Credenciales para la Aplicación

### Opción 1: Application Default Credentials (Desarrollo local)

```bash
gcloud auth application-default login
```

Esto configurará credenciales para que tu aplicación local pueda acceder a GCP.

### Opción 2: Service Account (Producción)

```bash
# Crear service account
gcloud iam service-accounts create gradanegra-app \
    --display-name="Grada Negra Application"

# Asignar roles necesarios
gcloud projects add-iam-policy-binding gradanegra-prod \
    --member="serviceAccount:gradanegra-app@gradanegra-prod.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding gradanegra-prod \
    --member="serviceAccount:gradanegra-app@gradanegra-prod.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

# Crear y descargar key
gcloud iam service-accounts keys create ./service-account-key.json \
    --iam-account=gradanegra-app@gradanegra-prod.iam.gserviceaccount.com
```

⚠️ **IMPORTANTE:** Nunca subas `service-account-key.json` a git. Ya está en `.gitignore`.

---

## ✅ Paso 7: Verificar Configuración

```bash
# Ver configuración actual
gcloud config list

# Ver información de la cuenta
gcloud auth list

# Verificar proyecto activo
gcloud config get-value project
```

---

## 🚀 Comandos Útiles Adicionales

### Ver cuota y uso
```bash
gcloud compute project-info describe --project=gradanegra-prod
```

### Configurar múltiples configuraciones (dev, staging, prod)
```bash
# Crear configuración de desarrollo
gcloud config configurations create dev
gcloud config set project gradanegra-dev

# Crear configuración de producción
gcloud config configurations create prod
gcloud config set project gradanegra-prod

# Listar configuraciones
gcloud config configurations list

# Activar una configuración
gcloud config configurations activate dev
```

---

## 🔒 Mejores Prácticas de Seguridad

1. **Nunca** compartas tus credenciales o service account keys
2. Usa **Application Default Credentials** para desarrollo local
3. Usa **Service Accounts** con permisos mínimos para producción
4. Rota las keys periódicamente
5. Usa **Secret Manager** para almacenar secretos (API keys, passwords)
6. Habilita **2FA** en tu cuenta de Google Cloud

---

## 📊 Monitoreo de Costos

```bash
# Ver uso actual
gcloud billing accounts list
gcloud billing projects describe gradanegra-prod

# Configurar alertas de presupuesto en console
# https://console.cloud.google.com/billing/budgets
```

---

## 🆘 Solución de Problemas

### Error: "gcloud command not found"
```bash
# Recargar shell
source ~/.zshrc
# O reiniciar terminal
```

### Error de permisos
```bash
# Re-autenticar
gcloud auth login
gcloud auth application-default login
```

### Cambiar cuenta
```bash
# Ver cuentas
gcloud auth list

# Cambiar cuenta activa
gcloud config set account tu-email@gmail.com
```

---

## 📚 Recursos Adicionales

- [Documentación oficial de gcloud](https://cloud.google.com/sdk/gcloud)
- [Best practices para GCP](https://cloud.google.com/docs/enterprise/best-practices-for-enterprise-organizations)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
- [GCP Free Tier](https://cloud.google.com/free)

---

**Última actualización:** Noviembre 2025  
**Proyecto:** Grada Negra  
**Estado:** Configuración inicial
