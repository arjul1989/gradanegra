# 🚀 SISTEMA DE DEPLOYMENT ROBUSTO - GRADA NEGRA API

## 📋 Resumen Ejecutivo

He implementado un sistema completo de deployment robusto para el backend de Grada Negra API que resuelve los problemas de credenciales y proporciona despliegues consistentes y seguros.

### ✅ Problemas Resueltos
- ❌ **ANTES**: Credenciales con espacios en blanco (`"-n"` y `\n`)
- ✅ **AHORA**: Credenciales limpias automáticamente con `.trim()`
- ❌ **ANTES**: Despliegues manuales propensos a errores
- ✅ **AHORA**: Despliegues automatizados con validaciones
- ❌ **ANTES**: Sin verificación post-deployment
- ✅ **AHORA**: Verificación automática completa

## 🏗️ Arquitectura del Sistema

```
├── backend/
│   ├── .deployment-config          # Configuración centralizada
│   ├── deploy-robust.sh           # Deployment robusto local
│   ├── verify-deployment.sh       # Verificación completa
│   ├── Makefile                   # Comandos simplificados
│   ├── cloudbuild.yaml           # CI/CD automático
│   ├── Dockerfile                # Container optimizado
│   └── .gcloudignore            # Configuración de builds
```

## 🔧 Configuración Centralizada

### Archivo: `.deployment-config`
Contiene todas las configuraciones del proyecto en un solo lugar:

```bash
# Proyecto
PROJECT_ID=gradanegra-api-350907539319
SERVICE_NAME=gradanegra-api
REGION=us-central1

# Recursos
MEMORY=512Mi
CPU=1
MAX_INSTANCES=10

# Secretos (Versión 8 - Corregida)
SECRETS=(
  "MERCADOPAGO_ACCESS_TOKEN_PROD:MERCADOPAGO_ACCESS_TOKEN_PROD:8"
  "MERCADOPAGO_PUBLIC_KEY_PROD:MERCADOPAGO_PUBLIC_KEY_PROD:8"
)
```

## 🚀 Scripts de Deployment

### 1. Deployment Local Robusto (`deploy-robust.sh`)

**Características:**
- ✅ Validaciones pre-deployment
- ✅ Verificación de configuración
- ✅ Health check automático
- ✅ Verificación de credenciales MercadoPago
- ✅ Manejo de errores robusto

**Uso:**
```bash
cd backend
chmod +x deploy-robust.sh
./deploy-robust.sh
```

### 2. Deployment Automático (`cloudbuild.yaml`)

**Características:**
- ✅ Build automático con Docker
- ✅ Deployment a Cloud Run
- ✅ Verificación post-deployment integrada
- ✅ Tags para tracking de versiones

**Uso:**
```bash
cd backend
gcloud builds submit --config cloudbuild.yaml .
```

### 3. Verificación Completa (`verify-deployment.sh`)

**Tests incluidos:**
- 🔍 Health check
- 🔍 Configuración MercadoPago
- 🔍 Verificación de espacios en blanco
- 🔍 Métodos de pago
- 🔍 Bancos PSE (47 bancos)
- 🔍 Frontend disponible
- 🔍 Panel admin

**Uso:**
```bash
chmod +x verify-deployment.sh
./verify-deployment.sh
```

## 🛠️ Comandos Simplificados (Makefile)

### Desarrollo
```bash
make install      # Instalar dependencias
make dev          # Modo desarrollo
make test         # Ejecutar tests
```

### Deployment
```bash
make deploy       # Deployment robusto local
make deploy-prod  # Deployment automático
make verify       # Verificar deployment
```

### Monitoreo
```bash
make logs         # Ver logs
make status       # Estado del servicio
make health       # Health check rápido
make info         # Información del proyecto
```

### Mantenimiento
```bash
make clean        # Limpiar archivos
make secrets      # Verificar secretos
make setup        # Setup inicial
```

## 🔐 Gestión de Secretos

### Secretos en Google Secret Manager

**Versiones Corregidas (8):**
- ✅ `MERCADOPAGO_ACCESS_TOKEN_PROD:8`
- ✅ `MERCADOPAGO_PUBLIC_KEY_PROD:8`
- ✅ `MERCADOPAGO_ACCESS_TOKEN_TEST:8`
- ✅ `MERCADOPAGO_PUBLIC_KEY_TEST:8`

**Secretos del Sistema:**
- ✅ `SECRET_SALT:latest`
- ✅ `JWT_SECRET:latest`
- ✅ `FIREBASE_PRIVATE_KEY:latest`
- ✅ `FIREBASE_CLIENT_EMAIL:latest`

### Limpieza Automática de Credenciales

**Archivo:** `backend/src/config/mercadopago.js`

```javascript
const accessToken = isProduction 
  ? (process.env.MP_ACCESS_TOKEN_PROD || '').trim()
  : (process.env.MP_ACCESS_TOKEN_TEST || '').trim();

const publicKey = isProduction
  ? (process.env.MP_PUBLIC_KEY_PROD || '').trim()
  : (process.env.MP_PUBLIC_KEY_TEST || '').trim();
```

## 🔍 Verificación de Funcionamiento

### Test Completo de MercadoPago

```bash
# 1. Verificar credenciales limpias
curl -s "https://gradanegra-api-350907539319.us-central1.run.app/api/payments/config"

# Respuesta esperada (SIN espacios):
{
  "success": true,
  "publicKey": "APP_USR-4b192185-10c7-4b18-b2ef-5e098dffcb9c",
  "environment": "production"
}

# 2. Verificar PSE habilitado
curl -s "https://gradanegra-api-350907539319.us-central1.run.app/api/payments/pse-banks"

# Respuesta esperada:
{
  "success": true,
  "banks": [47 bancos colombianos...]
}
```

### Verificación Frontend

1. **Ir a:** https://gradanegra-frontend-350907539319.us-central1.run.app
2. **Seleccionar** un evento
3. **Verificar** que NO aparezca "Cargando sistema de pagos..."
4. **Verificar** que PSE esté habilitado
5. **Verificar** que el error aparezca DEBAJO del botón

## 📊 Monitoreo y Logs

### Logs en Tiempo Real
```bash
gcloud run services logs read gradanegra-api \
  --project=gradanegra-api-350907539319 \
  --region=us-central1 \
  --limit=50
```

### Estado del Servicio
```bash
gcloud run services describe gradanegra-api \
  --project=gradanegra-api-350907539319 \
  --region=us-central1
```

## 🔄 Flujo de Deployment Recomendado

### Para Desarrollo
```bash
# 1. Instalar y configurar
make install
make setup

# 2. Modo desarrollo local
make dev

# 3. Tests
make test
```

### Para Producción
```bash
# 1. Deployment robusto con validaciones
make deploy

# 2. Verificación completa
make verify

# 3. Si todo está bien, deployment automático
make deploy-prod

# 4. Verificación final
make verify
```

## 🚨 Solución de Problemas

### Error: "Your public_key is invalid, as it contains whitespaces"

**Causa:** Backend no actualizado con credenciales limpias

**Solución:**
```bash
make deploy
make verify
```

### Error: "PSE no disponible"

**Causa:** Token de acceso corrupto o credenciales incorrectas

**Solución:**
```bash
# Verificar secretos
make secrets

# Verificar configuración
make verify
```

### Error: "Backend no responde"

**Causa:** Deployment fallido o servicio caído

**Solución:**
```bash
# Ver logs
make logs

# Ver estado
make status

# Health check
make health
```

## 🎯 Próximos Pasos

### Mejoras Futuras
- [ ] **CI/CD con GitHub Actions**
- [ ] **Monitoring automático con alertas**
- [ ] **Auto-scaling basado en tráfico**
- [ ] **Blue-green deployment**
- [ ] **Rollback automático**

### Monitoreo Adicional
- [ ] **Google Cloud Monitoring**
- [ ] **Uptime monitoring**
- [ ] **Performance metrics**
- [ ] **Error tracking**

## 📞 Soporte

### Comandos de Emergencia
```bash
# Deployment rápido
make deploy

# Verificación urgente
make verify

# Estado crítico
make health
make status
```

### Contacto
- **Email:** masterticketsas@gmail.com
- **Proyecto:** gradanegra-api-350907539319

---

**Última actualización:** $(date)
**Versión:** 2.0 - Sistema Robusto
**Estado:** ✅ Listo para producción