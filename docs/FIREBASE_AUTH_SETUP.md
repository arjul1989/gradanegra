# Configuración de Firebase Authentication

## 1. Habilitar Firebase Authentication

1. Ve a [Firebase Console](https://console.firebase.google.com/project/gradanegra-prod/authentication)
2. Haz clic en "Get Started" o "Authentication"
3. Ve a la pestaña "Sign-in method"
4. Habilita los siguientes proveedores:
   - **Email/Password**: Click en "Enable" y guarda
   - **Google**: Click en "Enable", configura el email de soporte y guarda

## 2. Obtener las Credenciales de Firebase

1. En Firebase Console, ve a Project Settings (ícono de engranaje)
2. En la sección "Your apps", busca la configuración web
3. Si no existe una app web, haz clic en "Add app" > Web (ícono </>) y crea una
4. Copia todas las credenciales que aparecen:

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "gradanegra-prod",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## 3. Configurar Variables de Entorno - Frontend

Crea o actualiza el archivo `/frontend/.env.local` con estas variables:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=<tu_api_key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gradanegra-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gradanegra-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gradanegra-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<tu_messaging_sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<tu_app_id>

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**IMPORTANTE**: No commitear el archivo `.env.local` al repositorio

## 4. Actualizar Cloud Build - Frontend

Agrega las variables de Firebase como build args en `frontend/cloudbuild.yaml`:

```yaml
- name: 'gcr.io/cloud-builders/docker'
  args:
    - 'build'
    - '-t'
    - 'gcr.io/$PROJECT_ID/gradanegra-frontend:$COMMIT_SHA'
    - '--build-arg'
    - 'NEXT_PUBLIC_API_URL=https://gradanegra-api-350907539319.us-central1.run.app'
    - '--build-arg'
    - 'NEXT_PUBLIC_FIREBASE_PROJECT_ID=gradanegra-prod'
    - '--build-arg'
    - 'NEXT_PUBLIC_FIREBASE_API_KEY=${_FIREBASE_API_KEY}'
    - '--build-arg'
    - 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${_FIREBASE_AUTH_DOMAIN}'
    - '--build-arg'
    - 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${_FIREBASE_STORAGE_BUCKET}'
    - '--build-arg'
    - 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${_FIREBASE_MESSAGING_SENDER_ID}'
    - '--build-arg'
    - 'NEXT_PUBLIC_FIREBASE_APP_ID=${_FIREBASE_APP_ID}'
    - '.'
```

## 5. Configurar Substitutions en Cloud Build Triggers

Cuando crees el trigger en Cloud Build, agrega estas substitution variables:

```bash
gcloud builds triggers create github \
  --name="deploy-frontend" \
  --repo-name="arjul1989/gradanegra" \
  --repo-owner="arjul1989" \
  --branch-pattern="^main$" \
  --build-config="frontend/cloudbuild.yaml" \
  --included-files="frontend/**" \
  --substitutions='
    _FIREBASE_API_KEY=<tu_api_key>,
    _FIREBASE_AUTH_DOMAIN=gradanegra-prod.firebaseapp.com,
    _FIREBASE_STORAGE_BUCKET=gradanegra-prod.appspot.com,
    _FIREBASE_MESSAGING_SENDER_ID=<tu_messaging_sender_id>,
    _FIREBASE_APP_ID=<tu_app_id>
  '
```

## 6. Actualizar Dockerfile - Frontend

El Dockerfile ya está preparado para recibir los build args. Verifica que tenga:

```dockerfile
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
ENV NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
ENV NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}
```

## 7. Probar Localmente

1. Asegúrate de tener el `.env.local` configurado
2. Reinicia el servidor de desarrollo:
   ```bash
   cd frontend
   npm run dev
   ```
3. Abre http://localhost:3000
4. Prueba:
   - Registro con email/password en `/register`
   - Login con email/password en `/login`
   - Login con Google en `/login`
   - Acceso a páginas protegidas como `/mis-boletos`

## 8. Verificar Funcionalidad

### Frontend
- ✅ Registro de nuevos usuarios
- ✅ Login con email/password
- ✅ Login con Google
- ✅ Cierre de sesión
- ✅ Redirección a `/login` si intenta acceder a rutas protegidas sin autenticación
- ✅ Navbar muestra usuario autenticado
- ✅ Acceso a `/mis-boletos` solo para usuarios autenticados

### Backend
- ✅ Rutas públicas accesibles sin token (`/api/public/events`)
- ✅ Rutas protegidas requieren token de Firebase (`/api/buyers/me/*`)
- ✅ Verificación de tokens de Firebase Auth
- ✅ Creación automática de perfil en Firestore al primer acceso

## 9. Dominio Autorizado para OAuth

Para que funcione Google Sign-In en producción:

1. Ve a Firebase Console > Authentication > Settings > Authorized domains
2. Agrega tu dominio de Cloud Run:
   - `gradanegra-frontend-350907539319.us-central1.run.app`
3. Si tienes dominio custom, agrégalo también

## 10. Testing en Producción

Una vez deployado:

```bash
# Test registro
curl -X POST https://gradanegra-frontend-350907539319.us-central1.run.app/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Test ruta protegida (debe retornar 401 sin token)
curl https://gradanegra-api-350907539319.us-central1.run.app/api/buyers/me

# Test ruta pública (debe funcionar sin token)
curl https://gradanegra-api-350907539319.us-central1.run.app/api/public/events
```

## Solución de Problemas

### Error: "Firebase: Error (auth/invalid-api-key)"
- Verifica que `NEXT_PUBLIC_FIREBASE_API_KEY` esté correctamente configurado
- Asegúrate que la API key sea la correcta de Firebase Console

### Error: "Firebase: Error (auth/unauthorized-domain)"
- Ve a Firebase Console > Authentication > Settings
- Agrega el dominio en "Authorized domains"

### Error: "Token inválido o expirado" en el backend
- Verifica que el token se esté enviando en el header: `Authorization: Bearer <token>`
- Verifica que el backend tenga el service account de Firebase configurado

### Usuarios no pueden hacer login después de registrarse
- Verifica que Firebase Auth esté habilitado
- Revisa los logs de Firebase en Console > Authentication > Users
