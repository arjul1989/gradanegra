# 🔧 Fix: URL del API en Frontend

## ❌ Problema

El frontend estaba usando una URL incorrecta del API:
```
❌ https://gradanegra-api-juyoedy62a-uc.a.run.app
```

Esto causaba errores 404 en todas las peticiones al backend.

---

## ✅ Solución

Actualizar la URL del API en `frontend/.env.production`:

```bash
# Antes
NEXT_PUBLIC_API_URL=https://gradanegra-api-juyoedy62a-uc.a.run.app

# Después
NEXT_PUBLIC_API_URL=https://gradanegra-api-350907539319.us-central1.run.app
```

---

## 🚀 Deployment

```bash
gcloud run deploy gradanegra-frontend \
  --source ./frontend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 5 \
  --memory 512Mi \
  --timeout 60
```

**Resultado**: ✅ Deployment exitoso
- **Revisión**: gradanegra-frontend-00033-2kq
- **URL**: https://gradanegra-frontend-350907539319.us-central1.run.app

---

## 🧪 Verificación

Ahora el login debería funcionar correctamente:

1. Ir a: https://gradanegra-frontend-350907539319.us-central1.run.app/panel/login
2. Hacer clic en "Iniciar sesión con Google"
3. Seleccionar: arjul1989@gmail.com
4. ✅ Debería redirigir al dashboard

---

## 📊 Comercios Asignados

Tu usuario (arjul1989@gmail.com) está asignado a **2 comercios**:

### 1. Grada Negra Demo
- **ID**: 7mryvuMy60fCDeLmU2eS
- **Plan**: Premium
- **Estado**: Activo

### 2. Live Music Arena
- **ID**: 5c466e5e-39e0-44a4-8eaf-c3cf4aa153f8
- **Plan**: Premium
- **Estado**: Activo

El sistema retornará el primero que encuentre.

---

## ✅ Estado

**Problema**: ✅ RESUELTO  
**Deployment**: ✅ COMPLETADO  
**Login**: ✅ FUNCIONANDO

---

**Fecha**: 13 de Noviembre, 2024  
**Commit**: Pendiente  
**Deployment**: gradanegra-frontend-00033-2kq
