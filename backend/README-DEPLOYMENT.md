# 🚀 SISTEMA DE DEPLOYMENT - GRADA NEGRA API

## 📋 Inicio Rápido

### Prerequisites
- Node.js 20+
- Google Cloud SDK (`gcloud`)
- Cuenta de Google con acceso a `gradanegra-api-350907539319`

### Setup Inicial
```bash
cd backend
make setup
```

### Desarrollo Local
```bash
make install    # Instalar dependencias
make dev        # Ejecutar en desarrollo
```

### Deployment
```bash
make deploy     # Deployment robusto con validaciones
make verify     # Verificar que todo funcione
```

## 🛠️ Comandos Principales

### Desarrollo
```bash
make install    # Instalar dependencias
make dev        # Servidor de desarrollo
make test       # Ejecutar tests
make clean      # Limpiar archivos temporales
```

### Deployment
```bash
make deploy         # Deployment local robusto
make deploy-prod    # Deployment automático CI/CD
make verify         # Verificación completa
```

### Monitoreo
```bash
make logs       # Ver logs en tiempo real
make status     # Estado del servicio
make health     # Health check rápido
make info       # Información del proyecto
```

## 🔧 Archivos del Sistema

### Configuración
- `.deployment-config` - Configuración centralizada del proyecto
- `cloudbuild.yaml` - Configuración CI/CD automática
- `Dockerfile` - Container optimizado para producción
- `.gcloudignore` - Archivos excluidos del build

### Scripts de Deployment
- `deploy-robust.sh` - Deployment con validaciones
- `verify-deployment.sh` - Verificación completa del sistema
- `Makefile` - Comandos simplificados

### Documentación
- `DEPLOYMENT_SYSTEM_DOCS.md` - Documentación completa
- `README.md` - Este archivo

## 🚨 Solución de Problemas

### Error: "Your public_key is invalid, as it contains whitespaces"
```bash
make deploy
make verify
```

### Error: "Permission denied"
```bash
gcloud auth login
gcloud config set project gradanegra-api-350907539319
```

### Error: "Service not available"
```bash
make logs
make status
```

## 📞 Comandos de Emergencia

### Recovery Completo
```bash
make clean
make install
make deploy
make verify
```

### Verificación de Secretos
```bash
make secrets
```

### Status del Proyecto
```bash
make info
make status
```

## 🔗 URLs Importantes

- **Backend**: https://gradanegra-api-350907539319.us-central1.run.app
- **Frontend**: https://gradanegra-frontend-350907539319.us-central1.run.app
- **Panel Admin**: https://gradanegra-frontend-350907539319.us-central1.run.app/admin

---

**Versión**: 2.0 - Sistema Robusto
**Última actualización**: $(date)
**Estado**: ✅ Listo para producción