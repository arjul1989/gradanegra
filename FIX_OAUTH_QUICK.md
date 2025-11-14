# ⚡ FIX RÁPIDO - OAuth Google

## 🎯 **HAZ ESTO AHORA (2 minutos)**

### **1️⃣ Firebase - Agregar Dominio**

1. Abre: https://console.firebase.google.com/project/gradanegra-prod/authentication/settings
2. Scroll hasta **"Authorized domains"**
3. Click **"Add domain"**
4. Pega: `gradanegra-frontend-350907539319.us-central1.run.app`
5. Click **"Add"**

✅ Debe quedar así:
```
✓ localhost
✓ grada-prod.firebaseapp.com
✓ gradanegra-frontend-350907539319.us-central1.run.app  ← NUEVO
```

---

### **2️⃣ Google Cloud - Agregar URI de Redirección**

1. Abre: https://console.cloud.google.com/apis/credentials?project=gradanegra-prod
2. Busca **"Web client (auto created by Google Service)"**
3. Click en el nombre para abrir
4. En **"Authorized redirect URIs"**, click **"+ ADD URI"**
5. Pega: `https://gradanegra-frontend-350907539319.us-central1.run.app/__/auth/handler`
6. Click **"+ ADD URI"** de nuevo
7. Pega: `https://grada-prod.firebaseapp.com/__/auth/handler`
8. Click **"SAVE"**

✅ Debe tener al menos:
```
✓ https://grada-prod.firebaseapp.com/__/auth/handler
✓ https://gradanegra-frontend-350907539319.us-central1.run.app/__/auth/handler
✓ http://localhost:3000/__/auth/handler (opcional, para desarrollo)
```

---

## ✅ **DESPUÉS DE CONFIGURAR**

1. **Espera 2-3 minutos** ⏱️
2. **Recarga la app** con Ctrl+Shift+R (o Cmd+Shift+R en Mac)
3. **Intenta login con Google** nuevamente

---

## 🎯 **RESUMEN VISUAL**

```
Firebase Console
├─ Authentication
│  └─ Settings
│     └─ Authorized domains
│        └─ [+] Add domain: gradanegra-frontend-...
│
Google Cloud Console
└─ APIs & Services
   └─ Credentials
      └─ Web client (auto created...)
         └─ Authorized redirect URIs
            └─ [+] ADD URI: https://gradanegra-frontend-.../__/auth/handler
```

---

**¡Listo!** Después de estos pasos, el login con Google funcionará. 🚀



