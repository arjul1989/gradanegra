# 🚀 Grada Negra - Guía Rápida de Inicio

## ✅ Estado Actual

- ✅ Backend API desplegado en Cloud Run
- ✅ Frontend desplegado en Cloud Run  
- ✅ Base de datos Firestore con 12 eventos
- ✅ Firebase Authentication configurado
- ✅ CI/CD configurado con Cloud Build
- ✅ Rutas protegidas implementadas

## 🏃 Inicio Rápido

### 1. Frontend (puerto 3000)

```bash
cd frontend
npm run dev
```

Abre: http://localhost:3000

### 2. Backend (puerto 8080)

```bash
cd backend
npm start
```

API disponible en: http://localhost:8080

## 🔐 Autenticación

### Primera vez - Configurar Firebase

Si aún no has configurado Firebase:

```bash
./scripts/setup-firebase.sh
```

Este script te guiará para:
1. Habilitar Firebase Authentication
2. Obtener las credenciales
3. Configurar `.env.local`

### Verificar Configuración

El archivo `frontend/.env.local` debe contener:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gradanegra-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gradanegra-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gradanegra-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=350907539319
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 🧪 Probar Autenticación

1. **Registrarse**: http://localhost:3000/register
2. **Iniciar Sesión**: http://localhost:3000/login
3. **Ruta Protegida**: http://localhost:3000/mis-boletos (requiere login)

### Funcionalidades Disponibles

- ✅ Registro con email/password
- ✅ Login con email/password
- ✅ Login con Google OAuth
- ✅ Cierre de sesión
- ✅ Rutas protegidas
- ✅ Navbar dinámico (muestra usuario autenticado)

## 📂 Estructura del Proyecto

```
gradanegra/
├── backend/              # API Node.js + Express
│   ├── src/
│   │   ├── routes/      # Rutas públicas y protegidas
│   │   ├── middleware/  # Auth middleware
│   │   └── controllers/
│   ├── Dockerfile
│   └── cloudbuild.yaml
├── frontend/            # Next.js 16 + React
│   ├── app/            # App Router
│   │   ├── page.tsx           # Home
│   │   ├── login/page.tsx     # Login
│   │   ├── register/page.tsx  # Registro
│   │   └── mis-boletos/       # Protegido
│   ├── components/
│   │   ├── Navbar.tsx         # Con auth state
│   │   └── ProtectedRoute.tsx # HOC
│   ├── contexts/
│   │   └── AuthContext.tsx    # Firebase Auth
│   ├── lib/
│   │   ├── firebase.ts        # Firebase config
│   │   └── eventService.ts    # API client
│   ├── Dockerfile
│   └── cloudbuild.yaml
├── scripts/
│   ├── setup-firebase.sh      # Configurar Firebase
│   └── setup-ci-cd.sh         # Configurar CI/CD
└── docs/
    ├── FIREBASE_AUTH_SETUP.md
    └── FIREBASE_AUTH_IMPLEMENTATION.md
```

## 🌐 URLs de Producción

- **Frontend**: https://gradanegra-frontend-350907539319.us-central1.run.app
- **Backend API**: https://gradanegra-api-350907539319.us-central1.run.app
- **Firebase Console**: https://console.firebase.google.com/project/gradanegra-prod
- **Cloud Run Console**: https://console.cloud.google.com/run?project=gradanegra-prod

## 🔧 Comandos Útiles

### Frontend

```bash
cd frontend

# Desarrollo
npm run dev

# Build
npm run build

# Build Docker local
docker build -t gradanegra-frontend .

# Run Docker
docker run -p 3000:3000 gradanegra-frontend
```

### Backend

```bash
cd backend

# Desarrollo
npm start

# Build Docker
docker build -t gradanegra-api .

# Run Docker
docker run -p 8080:8080 gradanegra-api
```

### Deploy Manual

```bash
# Backend
cd backend
gcloud builds submit --tag gcr.io/gradanegra-prod/gradanegra-api:latest
gcloud run deploy gradanegra-api \
  --image gcr.io/gradanegra-prod/gradanegra-api:latest \
  --region us-central1 \
  --platform managed

# Frontend
cd frontend
gcloud builds submit --tag gcr.io/gradanegra-prod/gradanegra-frontend:latest
gcloud run deploy gradanegra-frontend \
  --image gcr.io/gradanegra-prod/gradanegra-frontend:latest \
  --region us-central1 \
  --platform managed
```

## 📚 Documentación Completa

- **Firebase Auth Setup**: `docs/FIREBASE_AUTH_SETUP.md`
- **Firebase Auth Implementation**: `docs/FIREBASE_AUTH_IMPLEMENTATION.md`
- **Firebase Status**: `FIREBASE_STATUS.md`

## 🐛 Problemas Comunes

### Frontend no carga eventos

**Problema**: `401 Unauthorized` en la consola

**Solución**: Verifica que el backend esté corriendo en `http://localhost:8080`

### Error de Firebase: invalid-api-key

**Problema**: Credenciales de Firebase incorrectas

**Solución**: 
```bash
./scripts/setup-firebase.sh
```

### Rutas protegidas no funcionan

**Problema**: No redirige a login

**Solución**: Verifica que `AuthProvider` esté en `app/layout.tsx`

### Google Sign-In no funciona

**Problema**: Error de dominio no autorizado

**Solución**: 
1. Ve a Firebase Console > Authentication > Settings
2. Agrega `localhost` en Authorized Domains

## 🚀 Próximas Features

- [ ] Página de perfil completamente funcional
- [ ] Compra de tickets integrada
- [ ] Historial de compras
- [ ] Notificaciones por email (Resend)
- [ ] QR codes en tickets
- [ ] Validación de tickets
- [ ] Reset password / Forgot password
- [ ] Verificación de email obligatoria

## 🔐 Variables de Entorno

### Frontend (.env.local)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_API_URL=
```

### Backend (.env)

```bash
NODE_ENV=development
PORT=8080
FIREBASE_PROJECT_ID=gradanegra-prod
GCS_BUCKET_NAME=gradanegra-prod-tickets
```

## 📞 Soporte

Si encuentras algún problema:

1. Revisa `FIREBASE_STATUS.md` para el estado actual
2. Consulta la documentación en `docs/`
3. Verifica los logs:
   ```bash
   # Frontend
   Ver la consola del navegador
   
   # Backend
   Ver la terminal donde corre npm start
   ```

---

**Última actualización**: Nov 1, 2025
**Versión**: 1.0.0
**Estado**: ✅ Funcionando en desarrollo y producción
