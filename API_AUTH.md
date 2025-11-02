# 🔐 API de Autenticación - Grada Negra

**Versión:** 1.0  
**Base URL:** `http://localhost:8080/api/auth`

---

## 📋 Endpoints Disponibles

### 1. Registro de Usuario

**POST** `/api/auth/register`

Crea un nuevo usuario en el sistema (Firebase Auth + Database).

#### Request Body:
```json
{
  "email": "admin@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "tenant_admin",
  "tenantId": "tenant-123"
}
```

#### Roles Disponibles:
- `platform_admin` - Administrador de toda la plataforma
- `tenant_admin` - Administrador de un comercio
- `finance` - Usuario de finanzas (solo lectura financiera)
- `operations` - Usuario de operaciones (validación de tickets)

#### Response (201 Created):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "usr_a1b2c3d4e5f6g7h8",
    "email": "admin@example.com",
    "name": "John Doe",
    "role": "tenant_admin",
    "tenantId": "tenant-123",
    "active": true,
    "createdAt": "2025-11-01T21:00:00.000Z",
    "updatedAt": "2025-11-01T21:00:00.000Z"
  }
}
```

#### Errores:
- `400` - Validación fallida
- `409` - Email ya existe
- `500` - Error interno

---

### 2. Login

**POST** `/api/auth/login`

Obtiene información del usuario después de autenticarse con Firebase.

> ⚠️ **Nota:** La autenticación real se hace con Firebase SDK en el cliente. Este endpoint solo obtiene los datos del usuario de la base de datos.

#### Request Body:
```json
{
  "firebaseUid": "firebase-uid-from-client"
}
```

#### Response (200 OK):
```json
{
  "message": "Login successful",
  "user": {
    "id": "usr_a1b2c3d4e5f6g7h8",
    "email": "admin@example.com",
    "name": "John Doe",
    "role": "tenant_admin",
    "tenantId": "tenant-123",
    "active": true,
    "createdAt": "2025-11-01T21:00:00.000Z",
    "updatedAt": "2025-11-01T21:00:00.000Z"
  }
}
```

#### Errores:
- `400` - Firebase UID requerido
- `403` - Cuenta desactivada
- `404` - Usuario no encontrado
- `500` - Error interno

---

### 3. Obtener Usuario Actual

**GET** `/api/auth/me`

Obtiene la información del usuario autenticado.

#### Headers:
```
Authorization: Bearer <firebase-id-token>
```

#### Response (200 OK):
```json
{
  "user": {
    "id": "usr_a1b2c3d4e5f6g7h8",
    "email": "admin@example.com",
    "name": "John Doe",
    "role": "tenant_admin",
    "tenantId": "tenant-123",
    "active": true,
    "createdAt": "2025-11-01T21:00:00.000Z",
    "updatedAt": "2025-11-01T21:00:00.000Z"
  }
}
```

#### Errores:
- `401` - No autenticado o token inválido
- `403` - Cuenta desactivada
- `500` - Error interno

---

### 4. Actualizar Perfil

**PATCH** `/api/auth/profile`

Actualiza el perfil del usuario autenticado.

#### Headers:
```
Authorization: Bearer <firebase-id-token>
```

#### Request Body:
```json
{
  "name": "John Updated Doe"
}
```

#### Response (200 OK):
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "usr_a1b2c3d4e5f6g7h8",
    "email": "admin@example.com",
    "name": "John Updated Doe",
    "role": "tenant_admin",
    "tenantId": "tenant-123",
    "active": true,
    "createdAt": "2025-11-01T21:00:00.000Z",
    "updatedAt": "2025-11-01T21:10:00.000Z"
  }
}
```

---

### 5. Cambiar Contraseña

**POST** `/api/auth/change-password`

Cambia la contraseña del usuario autenticado.

#### Headers:
```
Authorization: Bearer <firebase-id-token>
```

#### Request Body:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

#### Response (200 OK):
```json
{
  "message": "Password changed successfully"
}
```

#### Errores:
- `400` - Validación fallida o contraseña muy corta
- `401` - No autenticado
- `500` - Error interno

---

## 🧪 Testing con cURL

### 1. Crear Admin (usando script):
```bash
cd backend
node ../scripts/create-admin.js
```

### 2. Registrar Usuario Manualmente:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "comercio@example.com",
    "password": "password123",
    "name": "Comercio Test",
    "role": "tenant_admin",
    "tenantId": "tenant-123"
  }'
```

### 3. Login:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "YOUR_FIREBASE_UID"
  }'
```

### 4. Get Current User:
```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

### 5. Update Profile:
```bash
curl -X PATCH http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'
```

---

## 🔑 Flujo de Autenticación Completo

### En el Cliente (Frontend):

1. **Registro:**
   ```javascript
   // Crear usuario en Firebase Auth (cliente)
   const userCredential = await createUserWithEmailAndPassword(auth, email, password);
   const firebaseUid = userCredential.user.uid;
   
   // Registrar en backend
   const response = await fetch('/api/auth/register', {
     method: 'POST',
     body: JSON.stringify({
       email,
       password,
       name,
       role,
       tenantId,
       firebaseUid
     })
   });
   ```

2. **Login:**
   ```javascript
   // Login con Firebase Auth (cliente)
   const userCredential = await signInWithEmailAndPassword(auth, email, password);
   const idToken = await userCredential.user.getIdToken();
   const firebaseUid = userCredential.user.uid;
   
   // Obtener datos del usuario del backend
   const response = await fetch('/api/auth/login', {
     method: 'POST',
     body: JSON.stringify({ firebaseUid })
   });
   ```

3. **Requests Autenticados:**
   ```javascript
   // Obtener token actual
   const idToken = await auth.currentUser.getIdToken();
   
   // Hacer request
   const response = await fetch('/api/auth/me', {
     headers: {
       'Authorization': `Bearer ${idToken}`
     }
   });
   ```

---

## 🛡️ Seguridad

### Token de Firebase:
- Los tokens tienen duración de 1 hora
- El cliente debe refrescar el token automáticamente
- Firebase SDK maneja esto automáticamente

### Permisos por Rol:

| Permiso | platform_admin | tenant_admin | finance | operations |
|---------|----------------|--------------|---------|------------|
| all | ✅ | ❌ | ❌ | ❌ |
| manage_tenant | ✅ | ✅ | ❌ | ❌ |
| manage_users | ✅ | ✅ | ❌ | ❌ |
| manage_events | ✅ | ✅ | ❌ | ❌ |
| view_finance | ✅ | ✅ | ✅ | ❌ |
| validate_tickets | ✅ | ✅ | ❌ | ✅ |
| export_reports | ✅ | ✅ | ✅ | ❌ |
| view_events | ✅ | ✅ | ✅ | ✅ |

---

## ✅ Estado de Implementación

### US-006: Login de administrador de comercio
- [x] ✅ Modelo de Usuario creado
- [x] ✅ Middleware de autenticación
- [x] ✅ Middleware de autorización (roles/permisos)
- [x] ✅ Controlador de autenticación
- [x] ✅ Validaciones con Joi
- [x] ✅ Endpoints implementados
- [x] ✅ Script para crear admin
- [x] ✅ Documentación de API

### Próximo: US-007 - Dashboard de comercio

---

**Última actualización:** Noviembre 1, 2025  
**Estado:** ✅ COMPLETADO
