# API de Tenants - Grada Negra

Documentación completa de los endpoints de gestión de tenants (comercios).

## 📋 Índice

- [Autenticación](#autenticación)
- [Endpoints](#endpoints)
  - [Crear Tenant](#crear-tenant)
  - [Listar Tenants](#listar-tenants)
  - [Obtener Tenant](#obtener-tenant)
  - [Actualizar Tenant](#actualizar-tenant)
  - [Eliminar Tenant](#eliminar-tenant)
  - [Crear Admin de Tenant](#crear-admin-de-tenant)
  - [Obtener Estadísticas](#obtener-estadísticas)
- [Modelos de Datos](#modelos-de-datos)
- [Códigos de Error](#códigos-de-error)

## 🔐 Autenticación

Todos los endpoints requieren autenticación mediante Firebase Auth token en el header:

```
Authorization: Bearer <firebase_token>
```

### Roles y Permisos

- **platform_admin**: Acceso completo a todos los endpoints
- **tenant_admin**: Acceso limitado a su propio tenant (GET, PATCH con campos restringidos)
- **finance, operations**: Sin acceso a endpoints de tenants

---

## 📡 Endpoints

### Crear Tenant

Crea un nuevo comercio en la plataforma.

**Endpoint:** `POST /api/tenants`  
**Acceso:** Platform Admin  
**Body:**

```json
{
  "name": "Mi Comercio",
  "email": "comercio@ejemplo.com",
  "logoUrl": "https://ejemplo.com/logo.png",
  "settings": {
    "primaryColor": "#FF5733",
    "secondaryColor": "#FFFFFF",
    "timezone": "America/Mexico_City",
    "currency": "MXN",
    "taxRate": 0.16
  },
  "contactInfo": {
    "phone": "+52 55 1234 5678",
    "address": "Calle Principal 123",
    "city": "Ciudad de México",
    "state": "CDMX",
    "country": "MX",
    "postalCode": "01000"
  },
  "adminUser": {
    "email": "admin@comercio.com",
    "password": "password123",
    "displayName": "Admin del Comercio"
  }
}
```

**Campos:**
- `name` (requerido): Nombre del comercio (2-100 caracteres)
- `email` (requerido): Email del comercio (único)
- `logoUrl` (opcional): URL del logo
- `settings` (opcional): Configuración personalizada
  - `primaryColor`: Color principal en formato hexadecimal
  - `secondaryColor`: Color secundario en formato hexadecimal
  - `timezone`: Zona horaria
  - `currency`: Código de moneda (3 letras)
  - `taxRate`: Tasa de impuesto (0-1)
- `contactInfo` (opcional): Información de contacto
  - `phone`: Teléfono
  - `address`: Dirección
  - `city`: Ciudad
  - `state`: Estado
  - `country`: Código de país (2 letras)
  - `postalCode`: Código postal
- `adminUser` (opcional): Usuario administrador inicial
  - `email`: Email del admin
  - `password`: Contraseña (mínimo 6 caracteres)
  - `displayName`: Nombre del admin

**Respuesta exitosa (201):**

```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "abc123",
      "name": "Mi Comercio",
      "slug": "mi-comercio",
      "email": "comercio@ejemplo.com",
      "logoUrl": "https://ejemplo.com/logo.png",
      "status": "active",
      "settings": {
        "primaryColor": "#FF5733",
        "secondaryColor": "#FFFFFF",
        "timezone": "America/Mexico_City",
        "currency": "MXN",
        "taxRate": 0.16
      },
      "contactInfo": {
        "phone": "+52 55 1234 5678",
        "address": "Calle Principal 123",
        "city": "Ciudad de México",
        "state": "CDMX",
        "country": "MX",
        "postalCode": "01000"
      },
      "subscription": {
        "plan": "free",
        "startDate": "2025-11-01T00:00:00.000Z",
        "endDate": null,
        "maxEvents": 10,
        "maxTicketsPerEvent": 1000
      },
      "stats": {
        "totalEvents": 0,
        "totalTicketsSold": 0,
        "totalRevenue": 0
      },
      "createdAt": "2025-11-01T00:00:00.000Z",
      "updatedAt": "2025-11-01T00:00:00.000Z"
    },
    "admin": {
      "id": "user123",
      "firebaseUid": "firebase123",
      "email": "admin@comercio.com",
      "displayName": "Admin del Comercio",
      "role": "tenant_admin",
      "tenantId": "abc123",
      "permissions": ["manage_events", "manage_tickets", "view_reports"],
      "isActive": true
    }
  }
}
```

**Errores:**
- `400`: Email de tenant duplicado, slug duplicado, datos inválidos
- `401`: No autenticado
- `403`: No es platform_admin
- `500`: Error del servidor

---

### Listar Tenants

Obtiene una lista de todos los tenants con filtros opcionales.

**Endpoint:** `GET /api/tenants`  
**Acceso:** Platform Admin  
**Query Parameters:**

- `status` (opcional): Filtrar por status (`active`, `suspended`, `inactive`)
- `plan` (opcional): Filtrar por plan de suscripción (`free`, `basic`, `premium`)
- `limit` (opcional): Número máximo de resultados (default: 50)

**Ejemplo:**
```
GET /api/tenants?status=active&limit=20
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "abc123",
      "name": "Mi Comercio",
      "slug": "mi-comercio",
      "email": "comercio@ejemplo.com",
      "logoUrl": "https://ejemplo.com/logo.png",
      "status": "active",
      "settings": { "..." },
      "contactInfo": { "..." },
      "subscription": { "..." },
      "stats": { "..." },
      "createdAt": "2025-11-01T00:00:00.000Z",
      "updatedAt": "2025-11-01T00:00:00.000Z"
    },
    {
      "id": "def456",
      "name": "Otro Comercio",
      "slug": "otro-comercio",
      "email": "otro@ejemplo.com",
      "status": "active",
      "...": "..."
    }
  ]
}
```

---

### Obtener Tenant

Obtiene los detalles de un tenant específico.

**Endpoint:** `GET /api/tenants/:id`  
**Acceso:** Platform Admin, Tenant Admin (solo su propio tenant)  

**Ejemplo:**
```
GET /api/tenants/abc123
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "Mi Comercio",
    "slug": "mi-comercio",
    "email": "comercio@ejemplo.com",
    "logoUrl": "https://ejemplo.com/logo.png",
    "status": "active",
    "settings": {
      "primaryColor": "#FF5733",
      "secondaryColor": "#FFFFFF",
      "timezone": "America/Mexico_City",
      "currency": "MXN",
      "taxRate": 0.16
    },
    "contactInfo": {
      "phone": "+52 55 1234 5678",
      "address": "Calle Principal 123",
      "city": "Ciudad de México",
      "state": "CDMX",
      "country": "MX",
      "postalCode": "01000"
    },
    "subscription": {
      "plan": "free",
      "startDate": "2025-11-01T00:00:00.000Z",
      "endDate": null,
      "maxEvents": 10,
      "maxTicketsPerEvent": 1000
    },
    "stats": {
      "totalEvents": 0,
      "totalTicketsSold": 0,
      "totalRevenue": 0
    },
    "createdAt": "2025-11-01T00:00:00.000Z",
    "updatedAt": "2025-11-01T00:00:00.000Z"
  }
}
```

**Errores:**
- `403`: Tenant admin intentando acceder a otro tenant
- `404`: Tenant no encontrado

---

### Actualizar Tenant

Actualiza la información de un tenant.

**Endpoint:** `PATCH /api/tenants/:id`  
**Acceso:** Platform Admin (todos los campos), Tenant Admin (campos limitados: name, logoUrl, settings, contactInfo)  

**Body (Platform Admin puede actualizar todos estos campos):**

```json
{
  "name": "Nuevo Nombre",
  "slug": "nuevo-slug",
  "email": "nuevo@email.com",
  "logoUrl": "https://nuevo-logo.png",
  "status": "suspended",
  "settings": {
    "primaryColor": "#000000"
  },
  "contactInfo": {
    "phone": "+52 55 9999 9999"
  }
}
```

**Body (Tenant Admin solo puede actualizar):**

```json
{
  "name": "Nuevo Nombre",
  "logoUrl": "https://nuevo-logo.png",
  "settings": {
    "primaryColor": "#000000"
  },
  "contactInfo": {
    "phone": "+52 55 9999 9999"
  }
}
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "Nuevo Nombre",
    "...": "... (datos actualizados)"
  }
}
```

**Errores:**
- `400`: Slug o email duplicado
- `403`: Tenant admin intentando actualizar otro tenant
- `404`: Tenant no encontrado

---

### Eliminar Tenant

Desactiva un tenant (soft delete). El tenant cambia su status a "inactive" pero no se elimina de la base de datos.

**Endpoint:** `DELETE /api/tenants/:id`  
**Acceso:** Platform Admin  

**Ejemplo:**
```
DELETE /api/tenants/abc123
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Comercio desactivado exitosamente"
}
```

**Errores:**
- `404`: Tenant no encontrado

---

### Crear Admin de Tenant

Crea un usuario administrador para un tenant existente.

**Endpoint:** `POST /api/tenants/:id/admins`  
**Acceso:** Platform Admin  

**Body:**

```json
{
  "email": "nuevo-admin@comercio.com",
  "password": "password123",
  "displayName": "Nuevo Admin",
  "permissions": ["manage_events", "manage_tickets", "view_reports"]
}
```

**Campos:**
- `email` (requerido): Email del nuevo admin
- `password` (requerido): Contraseña (mínimo 6 caracteres)
- `displayName` (opcional): Nombre del admin
- `permissions` (opcional): Array de permisos. Valores válidos:
  - `manage_events`: Gestionar eventos
  - `manage_tickets`: Gestionar tickets
  - `view_reports`: Ver reportes
  - `manage_users`: Gestionar usuarios

**Respuesta exitosa (201):**

```json
{
  "success": true,
  "data": {
    "id": "user456",
    "firebaseUid": "firebase456",
    "email": "nuevo-admin@comercio.com",
    "displayName": "Nuevo Admin",
    "role": "tenant_admin",
    "tenantId": "abc123",
    "permissions": ["manage_events", "manage_tickets", "view_reports"],
    "isActive": true,
    "createdAt": "2025-11-01T00:00:00.000Z"
  }
}
```

**Errores:**
- `400`: Email duplicado
- `404`: Tenant no encontrado

---

### Obtener Estadísticas

Obtiene las estadísticas y límites de suscripción de un tenant.

**Endpoint:** `GET /api/tenants/:id/stats`  
**Acceso:** Platform Admin, Tenant Admin (solo su propio tenant)  

**Ejemplo:**
```
GET /api/tenants/abc123/stats
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalEvents": 3,
      "totalTicketsSold": 150,
      "totalRevenue": 15000.00
    },
    "subscription": {
      "plan": "free",
      "startDate": "2025-11-01T00:00:00.000Z",
      "endDate": null,
      "maxEvents": 10,
      "maxTicketsPerEvent": 1000
    },
    "canCreateMoreEvents": true
  }
}
```

**Errores:**
- `403`: Tenant admin intentando acceder a otro tenant
- `404`: Tenant no encontrado

---

### Obtener Dashboard

Obtiene el dashboard completo del tenant con métricas, overview y eventos recientes.

**Endpoint:** `GET /api/tenants/:id/dashboard`  
**Acceso:** Platform Admin, Tenant Admin, Finance (solo su propio tenant)  

**Ejemplo:**
```
GET /api/tenants/abc123/dashboard
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "abc123",
      "name": "Mi Comercio",
      "slug": "mi-comercio",
      "logoUrl": "https://...",
      "status": "active"
    },
    "overview": {
      "totalEvents": 5,
      "totalTicketsSold": 250,
      "totalRevenue": 25000.00,
      "activeEvents": 2,
      "pastEvents": 3
    },
    "metrics": {
      "avgRevenuePerEvent": 5000.00,
      "avgTicketsPerEvent": 50.00,
      "occupancyRate": 75.50
    },
    "subscription": {
      "plan": "free",
      "maxEvents": 10,
      "eventsUsed": 5,
      "eventsRemaining": 5,
      "canCreateMore": true
    },
    "recentEvents": [
      {
        "id": "event1",
        "name": "Concierto Rock",
        "date": "2025-12-15",
        "ticketsSold": 80,
        "revenue": 8000.00
      }
    ]
  }
}
```

**Campos:**
- `tenant`: Información básica del comercio
- `overview`: Resumen de números clave
  - `totalEvents`: Total de eventos creados
  - `totalTicketsSold`: Total de tickets vendidos
  - `totalRevenue`: Ingresos totales
  - `activeEvents`: Eventos próximos/activos
  - `pastEvents`: Eventos pasados
- `metrics`: Métricas calculadas
  - `avgRevenuePerEvent`: Promedio de ingresos por evento
  - `avgTicketsPerEvent`: Promedio de tickets por evento
  - `occupancyRate`: Tasa de ocupación promedio (%)
- `subscription`: Estado de la suscripción
  - `eventsUsed`: Eventos ya creados
  - `eventsRemaining`: Eventos disponibles según el plan
  - `canCreateMore`: Si puede crear más eventos
- `recentEvents`: Últimos 5 eventos (ordenados por fecha)

**Errores:**
- `403`: Usuario sin acceso a este tenant
- `404`: Tenant no encontrado

---

### Obtener Eventos del Tenant

Obtiene la lista de eventos de un tenant con filtros y paginación.

**Endpoint:** `GET /api/tenants/:id/events`  
**Acceso:** Platform Admin, Tenant Admin, Finance, Operations (solo su propio tenant)  

**Query Parameters:**
- `status` (opcional): Filtrar por status (`upcoming`, `active`, `past`, `cancelled`)
- `limit` (opcional): Número de resultados (default: 50)
- `offset` (opcional): Offset para paginación (default: 0)

**Ejemplo:**
```
GET /api/tenants/abc123/events?status=upcoming&limit=20
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event123",
        "name": "Concierto Rock",
        "description": "Gran concierto...",
        "date": "2025-12-15T20:00:00.000Z",
        "venue": "Arena CDMX",
        "status": "upcoming",
        "ticketsSold": 80,
        "capacity": 1000,
        "revenue": 8000.00,
        "createdAt": "2025-11-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

**Errores:**
- `403`: Usuario sin acceso a este tenant
- `404`: Tenant no encontrado

---

## 📊 Modelos de Datos

### Tenant

```javascript
{
  id: string,              // ID único en Firestore
  name: string,            // Nombre del comercio
  slug: string,            // URL-friendly identifier (único)
  email: string,           // Email del comercio (único)
  logoUrl: string | null,  // URL del logo
  status: string,          // 'active' | 'suspended' | 'inactive'
  
  settings: {
    primaryColor: string,    // Color principal (#RRGGBB)
    secondaryColor: string,  // Color secundario (#RRGGBB)
    timezone: string,        // Zona horaria
    currency: string,        // Código de moneda (MXN, USD, etc.)
    taxRate: number         // Tasa de impuesto (0-1)
  },
  
  contactInfo: {
    phone: string,
    address: string,
    city: string,
    state: string,
    country: string,        // Código ISO de 2 letras
    postalCode: string
  },
  
  subscription: {
    plan: string,           // 'free' | 'basic' | 'premium'
    startDate: string,      // ISO timestamp
    endDate: string | null, // ISO timestamp
    maxEvents: number,      // Límite de eventos
    maxTicketsPerEvent: number
  },
  
  stats: {
    totalEvents: number,
    totalTicketsSold: number,
    totalRevenue: number
  },
  
  createdAt: string,        // ISO timestamp
  updatedAt: string,        // ISO timestamp
  createdBy: string | null  // User ID del platform_admin
}
```

### Plan Limits

| Plan | Max Events | Max Tickets/Event |
|------|------------|------------------|
| Free | 10 | 1,000 |
| Basic | 50 | 5,000 |
| Premium | ∞ | 20,000 |

---

## ❌ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos, duplicados o validación fallida |
| 401 | Unauthorized - Token inválido o no proporcionado |
| 403 | Forbidden - Sin permisos para realizar la acción |
| 404 | Not Found - Tenant no encontrado |
| 500 | Internal Server Error - Error del servidor |

### Formato de Error

```json
{
  "success": false,
  "error": "Mensaje de error",
  "details": ["Detalle 1", "Detalle 2"]
}
```

---

## 🧪 Ejemplos de Uso

### Crear tenant con admin inicial

```bash
curl -X POST http://localhost:8080/api/tenants \
  -H "Authorization: Bearer <platform_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Primer Comercio",
    "email": "comercio@test.com",
    "adminUser": {
      "email": "admin@test.com",
      "password": "password123",
      "displayName": "Admin Test"
    }
  }'
```

### Listar tenants activos

```bash
curl -X GET "http://localhost:8080/api/tenants?status=active&limit=10" \
  -H "Authorization: Bearer <platform_admin_token>"
```

### Actualizar información de contacto (Tenant Admin)

```bash
curl -X PATCH http://localhost:8080/api/tenants/abc123 \
  -H "Authorization: Bearer <tenant_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "contactInfo": {
      "phone": "+52 55 1111 2222",
      "city": "Guadalajara"
    }
  }'
```

### Obtener estadísticas

```bash
curl -X GET http://localhost:8080/api/tenants/abc123/stats \
  -H "Authorization: Bearer <tenant_admin_token>"
```

### Obtener dashboard completo

```bash
curl -X GET http://localhost:8080/api/tenants/abc123/dashboard \
  -H "Authorization: Bearer <tenant_admin_token>"
```

### Listar eventos del tenant

```bash
curl -X GET "http://localhost:8080/api/tenants/abc123/events?status=upcoming&limit=10" \
  -H "Authorization: Bearer <tenant_admin_token>"
```

---

## 📝 Notas Importantes

1. **Slug automático**: Si no se proporciona un slug, se genera automáticamente desde el nombre del tenant
2. **Unicidad**: El email y slug deben ser únicos en toda la plataforma
3. **Soft delete**: Los tenants eliminados cambian a status "inactive" pero no se borran
4. **Tenant Admin**: Solo puede ver y actualizar su propio tenant (campos limitados)
5. **Platform Admin**: Tiene acceso completo a todos los tenants
6. **Límites de plan**: El campo `canCreateMoreEvents` indica si el tenant puede crear más eventos
7. **Permisos granulares**: Los admins de tenant pueden tener permisos específicos

---

## 🔄 Próximos Pasos

- Implementar carga de logos a Cloud Storage
- Agregar paginación para listado de tenants
- Implementar búsqueda por nombre/email
- Agregar endpoint para cambiar plan de suscripción
- Implementar webhooks para eventos de tenant
