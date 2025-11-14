# 🏪 GUÍA: Registro de Comercios/Organizadores

**Fecha:** 10 de Noviembre, 2025  
**Estado:** ✅ Implementado y funcional

---

## 📋 RESUMEN

Se ha creado una página completa de registro para que nuevos comercios/organizadores puedan registrarse en la plataforma Grada Negra de forma autónoma.

### URL:
```
http://localhost:3000/panel/register
```

---

## 🎯 CARACTERÍSTICAS

### ✅ Wizard de 2 Pasos

#### **Paso 1: Información del Negocio**
- Nombre del comercio/organizador *
- Email de contacto *
- Teléfono *
- Ciudad * (selector con 15 ciudades principales de Colombia)
- Descripción (opcional)
- Sitio web (opcional)
- Aceptación de términos y condiciones *

#### **Paso 2: Autenticación Segura**
- Autenticación con Google (OAuth)
- Resumen de la información ingresada
- Confirmación de plan FREE incluido

---

## 🔄 FLUJO DE REGISTRO

### 1. Usuario completa el formulario (Paso 1)
```
- Ingresa información del negocio
- Selecciona ciudad
- Acepta términos y condiciones
- Click en "Continuar"
```

### 2. Validación de datos
```javascript
if (!nombre || !email || !telefono || !ciudad) {
  error: "Por favor completa todos los campos obligatorios"
}

if (!acceptTerms) {
  error: "Debes aceptar los términos y condiciones"
}
```

### 3. Autenticación con Google (Paso 2)
```
- Click en "Continuar con Google"
- Popup de Google Sign-In
- Usuario autoriza acceso
- Obtiene: uid, email, displayName
```

### 4. Creación del Comercio (Backend)
```javascript
POST /api/comercios
Body: {
  nombre: string,
  email: string,
  telefono: string,
  ciudad: string,
  descripcion: string,
  website: string | null,
  pais: 'Colombia',
  tipoPlan: 'free',
  status: 'activo'
}

Respuesta: { id, nombre, slug, email, ... }
```

### 5. Asignación del Usuario al Comercio
```javascript
POST /api/comercios/:id/usuarios
Body: {
  uid: string,          // Firebase Auth UID
  email: string,        // Email del usuario
  nombre: string,       // Display name
  rol: 'admin'          // Rol inicial
}
```

### 6. Redirección
```
router.push('/panel/dashboard')
```

---

## 📊 PLAN FREE (Por Defecto)

Todos los nuevos comercios se registran automáticamente con el plan FREE:

```javascript
{
  eventos: 2,                    // Máximo 2 eventos
  usuarios: 1,                   // 1 usuario (el que se registra)
  comision: 10.0,               // 10% de comisión
  eventosDestacados: 0,         // No puede destacar eventos
  puedeDestacar: false
}
```

### Cómo actualizar el plan:
- El super admin puede cambiar el plan desde `/admin/comercios/[id]`
- También puede configurar límites personalizados

---

## 🎨 DISEÑO Y UX

### Colores y Estilos
- **Background:** Degradado oscuro (`from-[#0a0e1a] via-[#101622] to-[#1a1f2e]`)
- **Cards:** Fondo semi-transparente con blur (`bg-[#1b1f27]/80 backdrop-blur-xl`)
- **Botón principal:** Degradado azul (`from-[#0d59f2] to-blue-600`)
- **Campos:** Fondo oscuro con borde (`bg-[#282e39]/50 border-gray-700/50`)

### Indicadores de Progreso
```
Step 1: [●] ──── [ ]  (Información / Autenticación)
Step 2: [●] ──── [●]  (Completado)
```

### Iconos Material Symbols
- `store` - Información del negocio
- `verified_user` - Autenticación segura
- `arrow_forward` - Continuar
- `arrow_back` - Volver
- `error` - Mensajes de error
- `summarize` - Resumen

---

## 🔐 SEGURIDAD

### Validaciones Frontend
- Campos obligatorios marcados con *
- Validación de email (type="email")
- Validación de URL (type="url")
- Checkbox obligatorio de términos

### Validaciones Backend
- Slug único (generado desde el nombre)
- Email único por comercio
- Sanitización de datos

### Autenticación
- Firebase Authentication con Google OAuth
- No se almacenan contraseñas
- Token seguro de Firebase

---

## 📱 RESPONSIVE

El formulario es completamente responsive:

- **Desktop:** Grid de 2 columnas para teléfono/ciudad
- **Mobile:** Columna única, campos apilados
- **Tablet:** Adaptativo según tamaño

```css
grid-cols-1 md:grid-cols-2 gap-5
```

---

## 🐛 MANEJO DE ERRORES

### Errores Comunes y Mensajes

| Error | Mensaje |
|-------|---------|
| Campos incompletos | "Por favor completa todos los campos obligatorios" |
| Sin aceptar términos | "Debes aceptar los términos y condiciones" |
| Email duplicado | "Ya existe un comercio con el email: [email]" |
| Slug duplicado | "Ya existe un comercio con el slug: [slug]" |
| Error de autenticación | "Error al iniciar sesión con Google" |
| Error al crear comercio | "Error al crear el comercio: [detalle]" |

### Estados de Loading

```typescript
loading={true}
  - Botón deshabilitado
  - Spinner animado
  - Texto: "Creando tu cuenta..."
```

---

## 🧪 TESTING

### Prueba Manual - Flujo Completo

1. **Abrir la página de registro**
   ```
   http://localhost:3000/panel/register
   ```

2. **Completar formulario (Paso 1)**
   - Nombre: "Mi Empresa de Eventos"
   - Email: "contacto@mievento.com"
   - Teléfono: "3001234567"
   - Ciudad: "Bogotá"
   - Descripción: "Organizamos los mejores eventos"
   - Website: "https://mievento.com"
   - ✅ Aceptar términos

3. **Click en "Continuar"**
   - Debe pasar al Paso 2

4. **Click en "Continuar con Google"**
   - Popup de Google
   - Seleccionar cuenta
   - Autorizar acceso

5. **Verificar creación**
   - Debe redirigir a `/panel/dashboard`
   - Ver mensaje de bienvenida
   - Verificar comercio en Firestore

### Verificación en Firestore

```javascript
// Colección: comercios
{
  id: "[uuid]",
  nombre: "Mi Empresa de Eventos",
  slug: "mi-empresa-de-eventos",
  email: "contacto@mievento.com",
  telefono: "3001234567",
  ciudad: "Bogotá",
  descripcion: "Organizamos los mejores eventos",
  website: "https://mievento.com",
  tipoPlan: "free",
  status: "activo",
  ...
}

// Colección: usuarios-comercios
{
  uid: "[firebase-uid]",
  comercioId: "[comercio-id]",
  email: "[usuario@gmail.com]",
  nombre: "[Nombre del usuario]",
  rol: "admin",
  ...
}
```

---

## 🔗 INTEGRACIÓN CON OTROS COMPONENTES

### Backend Endpoints Utilizados

1. **POST `/api/comercios`**
   - Archivo: `backend/src/routes/comercio.routes.js`
   - Función: Crear nuevo comercio
   - Validaciones: Slug único, email único

2. **POST `/api/comercios/:id/usuarios`**
   - Archivo: `backend/src/routes/usuarios-comercios.routes.js`
   - Función: Asignar usuario al comercio
   - Crea relación en colección `usuarios-comercios`

### Frontend Components

- **Firebase Auth:** `@/lib/firebase`
- **Router:** `next/navigation`
- **Estilos:** Tailwind CSS
- **Iconos:** Material Symbols Outlined

---

## 📄 DOCUMENTOS RELACIONADOS

- `URLS_PLATAFORMA.md` - Listado completo de URLs
- `IMPLEMENTACION_PANEL_ADMIN.md` - Panel de super admin
- `backend/src/models/Comercio.js` - Modelo de datos

---

## 🚀 PRÓXIMOS PASOS

### Mejoras Sugeridas

1. **Validación de teléfono**
   - Formato colombiano (+57)
   - Validación de dígitos

2. **Email de bienvenida**
   - Enviar email al completar registro
   - Incluir guía de primeros pasos

3. **Verificación de email**
   - Opcional: verificar email antes de activar
   - Link de verificación

4. **Onboarding**
   - Tour guiado al entrar al panel
   - Tips y mejores prácticas

5. **Soporte**
   - Chat de ayuda durante registro
   - FAQ integrado

---

## 💡 TIPS PARA USUARIOS

### Para el Comercio que se registra:

1. **Elige un nombre descriptivo**
   - Será visible para tus clientes
   - Debe ser profesional

2. **Email de contacto**
   - Usa un email profesional
   - Los clientes verán este email

3. **Ciudad**
   - Selecciona tu ciudad principal
   - Puedes crear eventos en otras ciudades

4. **Cuenta de Google**
   - Usa una cuenta profesional
   - Tendrás acceso de administrador

5. **Plan FREE**
   - Puedes crear hasta 2 eventos
   - Contacta al super admin para actualizar

---

## 📞 SOPORTE

Si hay problemas durante el registro:

1. Verificar que el backend esté corriendo
2. Verificar credenciales de Firebase
3. Revisar consola del navegador
4. Revisar logs del backend
5. Contactar al super admin

---

**Autor:** Jules + Claude  
**Fecha:** 10 de Noviembre, 2025  
**Estado:** ✅ Implementado y probado  
**URL:** http://localhost:3000/panel/register

