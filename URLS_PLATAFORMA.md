# 📍 URLS DE LA PLATAFORMA GRADA NEGRA

**Fecha:** 10 de Noviembre, 2025  
**Estado:** ✅ Actualizado después de limpieza de BD

---

## 🏠 SITIO PÚBLICO (Buyers/Usuarios)

### Home/Landing Page
```
http://localhost:3000/
```
- ✅ **Acceso:** Público (no requiere login)
- **Descripción:** Página principal con eventos destacados, categorías y búsqueda
- **Funcionalidad:** Ver eventos, categorías, buscar eventos por ciudad

### Registro de Usuario (Buyer)
```
http://localhost:3000/register
```
- ✅ **Acceso:** Público
- **Descripción:** Crear cuenta de usuario para comprar boletos
- **Opciones:** Email/password o Google Sign-In

### Login de Usuario (Buyer)
```
http://localhost:3000/login
```
- ✅ **Acceso:** Público
- **Descripción:** Iniciar sesión como usuario comprador
- **Opciones:** Email/password o Google Sign-In

### Ver Evento
```
http://localhost:3000/eventos/[id]
```
- ✅ **Acceso:** Público
- **Descripción:** Ver detalles de un evento específico

### Ver Categoría
```
http://localhost:3000/categoria/[slug]
```
- ✅ **Acceso:** Público
- **Descripción:** Ver todos los eventos de una categoría

### Mis Boletos
```
http://localhost:3000/mis-boletos
```
- 🔒 **Acceso:** Requiere login de usuario
- **Descripción:** Ver boletos comprados

### Perfil de Usuario
```
http://localhost:3000/usuario/perfil
```
- 🔒 **Acceso:** Requiere login de usuario
- **Descripción:** Ver y editar perfil de usuario

### Compras
```
http://localhost:3000/usuario/compras
```
- 🔒 **Acceso:** Requiere login de usuario
- **Descripción:** Historial de compras

---

## 🏪 PANEL DE COMERCIOS (Organizadores)

### Login de Comercio
```
http://localhost:3000/panel/login
```
- ✅ **Acceso:** Público (pero requiere cuenta de comercio)
- **Descripción:** Login con Google para comercios/organizadores
- **Requisito:** Usuario debe estar asignado a un comercio

### Registro de Comercio
```
http://localhost:3000/panel/register
```
- ✅ **Acceso:** Público
- **Descripción:** Registro de nuevo comercio con wizard de 2 pasos
- **Características:**
  - Paso 1: Información del negocio (nombre, email, teléfono, ciudad)
  - Paso 2: Autenticación con Google
  - Plan FREE por defecto (2 eventos, 1 usuario, 10% comisión)
  - Asignación automática del usuario al comercio

### Dashboard del Comercio
```
http://localhost:3000/panel/dashboard
```
- 🔒 **Acceso:** Requiere login de comercio
- **Descripción:** Dashboard con métricas y resumen del comercio

### Gestión de Eventos
```
http://localhost:3000/panel/eventos
```
- 🔒 **Acceso:** Requiere login de comercio
- **Descripción:** Lista de eventos del comercio

### Crear Evento
```
http://localhost:3000/panel/eventos/crear
http://localhost:3000/panel/eventos/crear/paso-2
http://localhost:3000/panel/eventos/crear/paso-3
http://localhost:3000/panel/eventos/crear/paso-4
```
- 🔒 **Acceso:** Requiere login de comercio
- **Descripción:** Wizard de 4 pasos para crear un evento

### Editar Evento
```
http://localhost:3000/panel/eventos/[id]/editar
```
- 🔒 **Acceso:** Requiere login de comercio
- **Descripción:** Editar información del evento

### Gestionar Fechas del Evento
```
http://localhost:3000/panel/eventos/[id]/gestionar-fechas
```
- 🔒 **Acceso:** Requiere login de comercio
- **Descripción:** Crear y gestionar fechas y tiers de un evento

### Verificar Boletos
```
http://localhost:3000/panel/eventos/[id]/verificar
```
- 🔒 **Acceso:** Requiere login de comercio
- **Descripción:** Verificar boletos escaneando QR

### Estadísticas
```
http://localhost:3000/panel/estadisticas
```
- 🔒 **Acceso:** Requiere login de comercio
- **Descripción:** Estadísticas de ventas y eventos

### Cupones
```
http://localhost:3000/panel/cupones
```
- 🔒 **Acceso:** Requiere login de comercio
- **Descripción:** Crear y gestionar cupones de descuento

### Equipo
```
http://localhost:3000/panel/equipo
```
- 🔒 **Acceso:** Requiere login de comercio
- **Descripción:** Gestionar usuarios del comercio

### Perfil del Comercio
```
http://localhost:3000/panel/perfil
```
- 🔒 **Acceso:** Requiere login de comercio
- **Descripción:** Editar información del comercio (logo, datos, redes sociales)

### Configuración
```
http://localhost:3000/panel/configuracion
```
- 🔒 **Acceso:** Requiere login de comercio
- **Descripción:** Configuración general del comercio

---

## 👨‍💼 PANEL DE SUPER ADMIN (Administración de Plataforma)

### Login de Super Admin
```
http://localhost:3000/superadmin/login
```
- ✅ **Acceso:** Público (pero requiere custom claim `admin: true`)
- **Descripción:** Login exclusivo para super administradores de la plataforma
- **Usuario actual:** `arjul1989@gmail.com`
- **Verificación:** Requiere custom claim de Firebase Auth

### Redirect Legacy (Antiguo Login)
```
http://localhost:3000/admin/login
```
- ⚠️ **Redirige automáticamente a:** `/superadmin/login`

### Dashboard del Super Admin
```
http://localhost:3000/admin/dashboard
```
- 🔒 **Acceso:** Requiere login de super admin
- **Descripción:** Dashboard con métricas globales de la plataforma

### Gestión de Comercios
```
http://localhost:3000/admin/comercios
```
- 🔒 **Acceso:** Requiere login de super admin
- **Descripción:** Lista de todos los comercios en la plataforma

### Detalle de Comercio
```
http://localhost:3000/admin/comercios/[id]
```
- 🔒 **Acceso:** Requiere login de super admin
- **Descripción:** Ver y editar detalles de un comercio, configurar planes personalizados

### Planes (Por implementar)
```
http://localhost:3000/admin/planes
```
- 🔒 **Acceso:** Requiere login de super admin
- ⏳ **Estado:** Por implementar

### Reportes (Por implementar)
```
http://localhost:3000/admin/reportes
```
- 🔒 **Acceso:** Requiere login de super admin
- ⏳ **Estado:** Por implementar

---

## 🔐 RESUMEN DE AUTENTICACIÓN

### 3 Tipos de Usuarios:

1. **Buyers/Usuarios (Compradores)**
   - Login: `/login`
   - Register: `/register`
   - Auth: Firebase Auth estándar
   - Pueden: Comprar boletos, ver eventos

2. **Comercios/Organizadores**
   - Login: `/panel/login`
   - Register: `/panel/register` ⏳ (por crear)
   - Auth: Firebase Auth + asignación a comercio en Firestore
   - Pueden: Crear eventos, gestionar ventas, ver estadísticas

3. **Super Admin (Plataforma)**
   - Login: `/superadmin/login`
   - Auth: Firebase Auth + custom claim `admin: true`
   - Pueden: Administrar toda la plataforma, gestionar comercios

---

## 📊 ESTADO ACTUAL DE LA BASE DE DATOS

### Después de la limpieza (10 Nov 2025):

```
✅ comercios            → 0 documentos
✅ eventos              → 0 documentos
✅ boletos              → 0 documentos
✅ compras              → 0 documentos
✅ fechasEvento         → 0 documentos
✅ tiers                → 0 documentos
✅ cupones              → 0 documentos
✅ usuarios-comercios   → 0 documentos
✅ categorias           → 0 documentos
✅ buyers               → 0 documentos
✅ admin_logs           → 0 documentos
```

**Único usuario en Firebase Auth:**
- Email: `arjul1989@gmail.com`
- Rol: Super Admin
- Custom Claim: `admin: true`

---

## 🚀 PRÓXIMOS PASOS

### Para empezar a probar:

1. **Crear categorías** (desde backend con script)
2. **Crear un comercio de prueba**
   - Opción A: Usar script `backend/scripts/create-tenant.js`
   - Opción B: Crear página `/panel/register` ⏳
3. **Asignar usuario al comercio**
   - Usar script `backend/scripts/assign-user-to-comercio.js`
4. **Crear eventos desde el panel del comercio**

---

## 🎯 TAREAS PENDIENTES

- [x] Crear página `/panel/register` para signup de comercios ✅
- [ ] Implementar `/admin/planes`
- [ ] Implementar `/admin/reportes`
- [ ] Migrar todos los `confirm()` y `alert()` a modales personalizados

---

**Última actualización:** 10 de Noviembre, 2025  
**Por:** Jules + Claude  
**Base de datos:** Limpia y lista para pruebas desde cero

