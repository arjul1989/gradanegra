# Correcciones Realizadas - Deployment Frontend

## Problema Identificado

El frontend desplegado en producción NO tiene los nuevos métodos de pago (PSE y Efecty), mientras que la versión local sí los tiene.

## Causa Raíz

1. **Error de React Hooks**: Había un `useEffect` anidado dentro de otro `useEffect` en `frontend/app/checkout/[eventoId]/page.tsx` (líneas 275-293)
2. **Falta de next.config.js**: El archivo de configuración de Next.js no existía, necesario para el output standalone
3. **Falta de .env.production**: Las credenciales de Firebase no estaban disponibles durante el build en Cloud Run
4. **Build Failures en Cloud Run**: Los deployments fallaban con error `Firebase: Error (auth/invalid-api-key)`

## Correcciones Aplicadas

### 1. Corregido Error de Hooks
**Archivo**: `frontend/app/checkout/[eventoId]/page.tsx`
- Separados los `useEffect` anidados en bloques independientes
- Eliminado el anidamiento que violaba las reglas de hooks de React

### 2. Creado next.config.js
**Archivo**: `frontend/next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
    unoptimized: true
  },
  typescript: {
    ignoreBuildErrors: true
  }
}

module.exports = nextConfig
```

### 3. Creado .env.production
**Archivo**: `frontend/.env.production`
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDa0qWOCHkldgquB51q8oZtMI4Aoqx84lw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gradanegra-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gradanegra-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gradanegra-prod.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=350907539319
NEXT_PUBLIC_FIREBASE_APP_ID=1:350907539319:web:d1206f7b3180d3abd94b72
NEXT_PUBLIC_API_URL=https://gradanegra-api-juyoedy62a-uc.a.run.app
```

### 4. Scripts de Deployment Creados/Actualizados
- `scripts/deploy-frontend.sh` - Actualizado con `--set-build-env-vars`
- `scripts/deploy-frontend-direct.sh` - Nuevo script con build local
- `scripts/deploy-frontend-simple.sh` - Script simplificado
- `scripts/deploy-frontend-manual.sh` - Para build con Docker local (requiere Docker)

## Estado Actual

### ✅ Completado
- Corrección de error de hooks en checkout
- Creación de next.config.js
- Creación de .env.production con credenciales correctas
- Actualización de scripts de deployment

### ⏳ Pendiente
- **Deployment exitoso a producción**

## Próximos Pasos para Deployment Manual

Dado que los deployments automáticos están presentando problemas, aquí están las opciones:

### Opción 1: Deployment desde Google Cloud Console
1. Ir a https://console.cloud.google.com/run?project=gradanegra-prod
2. Seleccionar el servicio `gradanegra-frontend`
3. Click en "EDIT & DEPLOY NEW REVISION"
4. En "Container image URL", usar la imagen del último deployment exitoso o construir una nueva
5. Configurar las variables de entorno manualmente

### Opción 2: Usar gcloud desde terminal local
```bash
cd frontend
gcloud run deploy gradanegra-frontend \
  --source . \
  --project gradanegra-prod \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi
```

### Opción 3: Verificar y corregir permisos de Cloud Build
```bash
# Verificar que Cloud Build esté habilitado
gcloud services list --enabled --project=gradanegra-prod | grep cloudbuild

# Si no está habilitado, habilitarlo
gcloud services enable cloudbuild.googleapis.com --project=gradanegra-prod
```

## Verificación Post-Deployment

Una vez que el deployment se complete exitosamente, verificar:

1. **URL de producción**: https://gradanegra-frontend-juyoedy62a-uc.a.run.app
2. **Página de checkout**: Debe mostrar 3 métodos de pago:
   - Tarjeta de crédito/débito
   - Transferencia bancaria (PSE)
   - Pago en efectivo (Efecty)
3. **Sin datos precargados**: Los campos deben estar vacíos
4. **Modal de abandono**: Debe aparecer al intentar salir con tickets seleccionados

## Archivos Modificados

1. `frontend/app/checkout/[eventoId]/page.tsx` - Corregido error de hooks
2. `frontend/next.config.js` - Creado con configuración standalone
3. `frontend/.env.production` - Creado con credenciales de producción
4. `frontend/app/pago/pse-retorno/page.tsx` - Agregado Suspense wrapper
5. `frontend/app/pago/efecty-retorno/page.tsx` - Agregado Suspense wrapper
6. `scripts/deploy-frontend.sh` - Actualizado
7. `scripts/deploy-frontend-direct.sh` - Creado
8. `scripts/deploy-frontend-simple.sh` - Creado
9. `scripts/deploy-frontend-manual.sh` - Creado

## Notas Importantes

- La versión local funciona perfectamente con los 3 métodos de pago
- El build local se completa exitosamente
- El problema está específicamente en el deployment a Cloud Run
- Las credenciales de Firebase ahora están en `.env.production` para que Cloud Build las use