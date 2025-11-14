# 🔐 Configurar Dominios Autorizados OAuth Google

**Error:** `No puedes iniciar sesión en esta aplicación porque no cumple con la política OAuth 2.0 de Google`

**Causa:** Los dominios no están autorizados en Firebase Authentication y Google Cloud Console.

---

## 🚀 **SOLUCIÓN RÁPIDA (Firebase Console)**

### **Paso 1: Ir a Firebase Console**

1. Abre: https://console.firebase.google.com/project/gradanegra-prod/authentication/settings
2. O navega: Firebase Console → gradanegra-prod → Authentication → Settings → Authorized domains

### **Paso 2: Agregar Dominios Autorizados**

Agrega estos dominios si no están:

✅ **Dominios que DEBEN estar autorizados:**
```
grada-prod.firebaseapp.com
gradanegra-frontend-350907539319.us-central1.run.app
localhost
```

**Pasos:**
1. Haz clic en **"Add domain"**
2. Pega cada dominio
3. Haz clic en **"Add"**

### **Paso 3: Verificar la Configuración**

Después de agregar los dominios, verifica que tengas:
- ✅ `grada-prod.firebaseapp.com` (dominio de Firebase)
- ✅ `gradanegra-frontend-350907539319.us-central1.run.app` (Cloud Run)
- ✅ `localhost` (para desarrollo local)

---

## 🔧 **SOLUCIÓN COMPLETA (Google Cloud Console)**

Si el problema persiste después de agregar los dominios en Firebase, también necesitas configurar OAuth:

### **Paso 1: Ir a OAuth Consent Screen**

1. Abre: https://console.cloud.google.com/apis/credentials/consent?project=gradanegra-prod
2. O navega: Google Cloud Console → APIs & Services → OAuth consent screen

### **Paso 2: Configurar Authorized Domains**

1. Haz clic en **"EDIT APP"**
2. Scroll hasta **"Authorized domains"**
3. Agrega:
   ```
   firebaseapp.com
   run.app
   ```
4. Haz clic en **"SAVE AND CONTINUE"**

### **Paso 3: Configurar URIs de Redirección**

1. Ve a: https://console.cloud.google.com/apis/credentials?project=gradanegra-prod
2. Encuentra tu **OAuth 2.0 Client ID** (debería decir "Web client (auto created by Google Service)")
3. Haz clic en el nombre para editarlo
4. En **"Authorized redirect URIs"**, agrega:
   ```
   https://grada-prod.firebaseapp.com/__/auth/handler
   https://gradanegra-frontend-350907539319.us-central1.run.app/__/auth/handler
   http://localhost:3000/__/auth/handler
   ```
5. Haz clic en **"SAVE"**

---

## 🎯 **CONFIGURACIÓN COMPLETA**

### **Firebase Authorized Domains:**
```
✅ localhost
✅ grada-prod.firebaseapp.com
✅ gradanegra-frontend-350907539319.us-central1.run.app
```

### **Google Cloud OAuth - Authorized domains:**
```
✅ firebaseapp.com
✅ run.app
```

### **OAuth 2.0 Client - Redirect URIs:**
```
✅ https://grada-prod.firebaseapp.com/__/auth/handler
✅ https://gradanegra-frontend-350907539319.us-central1.run.app/__/auth/handler
✅ http://localhost:3000/__/auth/handler
```

---

## 🔍 **VERIFICACIÓN**

Después de configurar:

1. **Espera 5-10 minutos** para que los cambios se propaguen
2. **Limpia el caché del navegador** (Ctrl+Shift+Del o Cmd+Shift+Del)
3. **Recarga la aplicación** con Ctrl+Shift+R o Cmd+Shift+R
4. **Intenta login con Google** nuevamente

---

## 🐛 **SI EL ERROR PERSISTE**

### **Error: "redirect_uri_mismatch"**

Si ves este error, verifica que el URI de redirección exacto esté en la lista:
```
https://grada-prod.firebaseapp.com/__/auth/handler
```

### **Error: "unauthorized_client"**

Si ves este error:
1. Verifica que el **OAuth consent screen** esté configurado
2. Verifica que tu email esté en los **Test users** (si la app está en modo Testing)
3. Cambia el estado a **"In production"** si ya está listo

---

## 📋 **CHECKLIST**

- [ ] Agregados dominios en Firebase Authentication → Settings → Authorized domains
- [ ] Agregados dominios en Google Cloud → OAuth consent screen → Authorized domains
- [ ] Agregadas URIs de redirección en Google Cloud → Credentials → OAuth 2.0 Client
- [ ] Esperados 5-10 minutos para propagación
- [ ] Limpiado caché del navegador
- [ ] Probado login con Google

---

## 🎥 **GUÍA VISUAL RÁPIDA**

### **Firebase Console:**
```
1. https://console.firebase.google.com/project/gradanegra-prod/authentication/settings
2. Scroll hasta "Authorized domains"
3. Click "Add domain"
4. Pegar: gradanegra-frontend-350907539319.us-central1.run.app
5. Click "Add"
```

### **Google Cloud Console:**
```
1. https://console.cloud.google.com/apis/credentials?project=gradanegra-prod
2. Click en "Web client (auto created by Google Service)"
3. Scroll hasta "Authorized redirect URIs"
4. Click "ADD URI"
5. Pegar: https://gradanegra-frontend-350907539319.us-central1.run.app/__/auth/handler
6. Click "SAVE"
```

---

## ⚠️ **NOTA IMPORTANTE**

El dominio de Firebase es `grada-prod.firebaseapp.com` (sin "negra"), no `gradanegra-prod.firebaseapp.com`.

Este es el dominio correcto que Firebase asignó a tu proyecto y es el que debes usar en todas las configuraciones.

---

**Estado:** ⏳ Pendiente de configuración manual en consolas de Firebase y Google Cloud

