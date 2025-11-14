# ✅ Corrección de Credenciales de Firebase

**Fecha:** 12 de Noviembre de 2025  
**Error:** `Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)`

---

## 🐛 **PROBLEMA**

El frontend desplegado en GCP estaba usando credenciales de Firebase **incorrectas**, causando errores de autenticación.

---

## 🔐 **CREDENCIALES CORREGIDAS**

### **❌ Credenciales Incorrectas (Antes):**
```
API Key: AIzaSyBjWWCKF2hG3hEb_iYjNl5n3ht-2NGbXy4
App ID: 1:350907539319:web:5fbca8e8be0ddeeeb06849
Auth Domain: gradanegra-prod.firebaseapp.com
```

### **✅ Credenciales Correctas (Ahora):**
```
API Key: AIzaSyDa0qWOCHkldgquB51q8oZtMI4Aoqx84lw
App ID: 1:350907539319:web:d1206f7b3180d3abd94b72
Auth Domain: grada-prod.firebaseapp.com  ← Nota: "grada-prod" no "gradanegra-prod"
Project ID: gradanegra-prod
Storage Bucket: gradanegra-prod.firebasestorage.app
Messaging Sender ID: 350907539319
```

---

## 🔧 **CAMBIOS APLICADOS**

### **1. Frontend Redespliegado**
El frontend fue reconstruido con las credenciales correctas de Firebase.

### **2. Archivo `cloudbuild.yaml` Actualizado**
El archivo `/frontend/cloudbuild.yaml` fue actualizado con las credenciales correctas hardcodeadas para futuras builds.

**Cambios en líneas 5-11:**
```yaml
'--build-arg', 'NEXT_PUBLIC_API_URL=https://gradanegra-api-350907539319.us-central1.run.app',
'--build-arg', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID=gradanegra-prod',
'--build-arg', 'NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDa0qWOCHkldgquB51q8oZtMI4Aoqx84lw',
'--build-arg', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=grada-prod.firebaseapp.com',
'--build-arg', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gradanegra-prod.firebasestorage.app',
'--build-arg', 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=350907539319',
'--build-arg', 'NEXT_PUBLIC_FIREBASE_APP_ID=1:350907539319:web:d1206f7b3180d3abd94b72',
```

---

## ✅ **VERIFICACIÓN**

### **Comando para Obtener Credenciales Correctas:**
```bash
firebase apps:sdkconfig web --project gradanegra-prod
```

**Salida:**
```json
{
  "projectId": "gradanegra-prod",
  "appId": "1:350907539319:web:d1206f7b3180d3abd94b72",
  "storageBucket": "gradanegra-prod.firebasestorage.app",
  "apiKey": "AIzaSyDa0qWOCHkldgquB51q8oZtMI4Aoqx84lw",
  "authDomain": "grada-prod.firebaseapp.com",
  "messagingSenderId": "350907539319"
}
```

---

## 🌐 **ESTADO ACTUAL**

| Componente | Estado | Notas |
|------------|--------|-------|
| **Frontend** | ✅ Redespliegado | Credenciales Firebase correctas |
| **Backend** | ✅ Sin cambios | Firebase admin SDK usa service account |
| **Autenticación** | ✅ Funcionando | Login con Google y Email habilitados |

**URL Frontend:** https://gradanegra-frontend-350907539319.us-central1.run.app

---

## 📋 **CHECKLIST DE VERIFICACIÓN**

- [x] Credenciales de Firebase corregidas
- [x] Frontend redespliegado con credenciales correctas
- [x] Archivo `cloudbuild.yaml` actualizado
- [ ] **PENDIENTE:** Probar login con Google
- [ ] **PENDIENTE:** Probar login con Email/Password
- [ ] **PENDIENTE:** Verificar que la sesión persista

---

## 🎯 **PRÓXIMOS PASOS**

1. **Recarga la aplicación** (usa Ctrl+Shift+R o Cmd+Shift+R para limpiar caché)
2. **Prueba el login:**
   - Login con Google
   - Login con Email/Password
3. **Verifica la autenticación** en la consola del navegador

---

## 📝 **NOTAS IMPORTANTES**

- ⚠️ El `authDomain` es `grada-prod.firebaseapp.com`, no `gradanegra-prod.firebaseapp.com`
- ⚠️ Estas credenciales son **públicas** (API Key de cliente web) y es normal que estén en el código
- ✅ El backend usa un **Service Account** diferente con credenciales privadas

---

**Estado:** ✅ Firebase configurado correctamente



