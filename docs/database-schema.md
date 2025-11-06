# Modelo de Datos - Sistema de Ticketing Grada Negra

## Diagrama Entidad-Relación

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            MODELO DE DATOS RELACIONAL                           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│      COMERCIOS       │
├──────────────────────┤
│ PK id                │
│    nombre            │
│    slug              │
│    descripcion       │
│    logo              │
│    imagenBanner      │
│    email             │
│    telefono          │
│    direccion         │
│    ciudad            │
│    pais              │
│    website?          │
│    redesSociales     │ (JSON)
│    colorPrimario     │
│    colorSecundario   │
│    tipoPlan          │ (free, basic, pro, enterprise)
│    limiteEventos     │
│    comision          │ (%)
│    status            │
│    createdAt         │
│    updatedAt         │
│    deletedAt?        │
└──────────────────────┘
         │
         │ 1
         │
         │ N
         ▼
┌──────────────────────┐
│      EVENTOS         │
├──────────────────────┤
│ PK id                │◄──────────┐
│ FK comercioId        │           │
│    nombre            │           │
│    descripcion       │           │
│    imagen            │           │
│    ciudad            │           │
│    ubicacion         │           │
│    status            │           │ 1
│    createdAt         │           │
│    updatedAt         │           │
│    deletedAt?        │           │
└──────────────────────┘           │
         │                         │
         │ 1                       │
         │                         │
         │ N                       │
         ▼                         │
┌──────────────────────┐           │
│  EVENTOS_CATEGORIAS  │           │
├──────────────────────┤           │
│ PK id                │           │
│ FK eventoId          │───────────┘
│ FK categoriaId       │───────────┐
│    createdAt         │           │
└──────────────────────┘           │
                                   │
         ┌─────────────────────────┘
         │ N
         │
         │ 1
         ▼
┌──────────────────────┐
│     CATEGORIAS       │
├──────────────────────┤
│ PK id                │
│    slug              │
│    nombre            │
│    descripcion       │
│    imagen            │
│    icono             │
│    status            │
│    createdAt         │
└──────────────────────┘


┌──────────────────────┐
│      COMERCIOS       │
├──────────────────────┤
│ PK id                │◄───────────────┐
└──────────────────────┘                │
         │                              │
         │ 1                            │ N
         │                              │
         │ N                            │
         ▼                              │
┌──────────────────────┐                │
│  USUARIOS_COMERCIO   │                │
├──────────────────────┤                │
│ PK id                │                │
│ FK comercioId        │────────────────┘
│ FK userId            │────────────┐
│    rol               │ (admin, finanzas, operaciones)
│    permisos          │ (JSON)
│    status            │
│    createdAt         │
└──────────────────────┘
                                   │
         ┌─────────────────────────┘
         │ N
         │
         │ 1
         ▼
┌──────────────────────┐
│       USUARIOS       │
├──────────────────────┤
│ PK id                │
│    firebaseUid       │
│    email             │
│    nombre?           │
│    telefono?         │
│    rol               │ (comprador, organizador, admin)
│    status            │
│    createdAt         │
│    updatedAt         │
└──────────────────────┘


┌──────────────────────┐
│      EVENTOS         │
├──────────────────────┤
│ PK id                │◄───────────────┐
│ FK comercioId        │
└──────────────────────┘                │
         │                              │
         │ 1                            │ 1
         │                              │
         │ N                            │
         ▼                              │
┌──────────────────────┐                │
│    FECHAS_EVENTO     │                │
├──────────────────────┤                │
│ PK id                │                │
│ FK eventoId          │────────────────┘
│    fecha             │ (YYYY-MM-DD)
│    horaInicio        │ (HH:MM)
│    horaFin?          │ (HH:MM)
│    aforoTotal        │
│    aforoDisponible   │
│    status            │ (activa, agotada, cancelada)
│    createdAt         │
│    updatedAt         │
│    deletedAt?        │
└──────────────────────┘
         │
         │ 1
         │
         │ N
         ▼
┌──────────────────────┐
│       TIERS          │
├──────────────────────┤
│ PK id                │
│ FK fechaEventoId     │────────────────┐
│    nombre            │ (General, VIP, Palco)
│    descripcion       │
│    precio            │
│    cantidad          │ (total de boletos en tier)
│    disponibles       │ (boletos disponibles)
│    orden             │ (para ordenar tiers)
│    status            │
│    createdAt         │
│    updatedAt         │
│    deletedAt?        │
└──────────────────────┘
         │                              │
         │ 1                            │
         │                              │
         │ N                            │
         ▼                              │
┌──────────────────────┐                │
│      BOLETOS         │                │
├──────────────────────┤                │
│ PK id                │                │
│ FK tierId            │────────────────┘
│ FK compraId?         │────────────┐
│    numeroBoleto      │ (único)    │
│    codigoQR          │            │
│    hash              │ (SHA-256)  │
│    precio            │            │
│    status            │ (disponible, vendido, usado, cancelado)
│    fechaUso?         │            │
│    createdAt         │            │
│    updatedAt         │            │
└──────────────────────┘            │
                                    │
                                    │ N
                                    │
                                    │ 1
                                    ▼
                        ┌──────────────────────┐
                        │       COMPRAS        │
                        ├──────────────────────┤
                        │ PK id                │
                        │ FK userId?           │──────────┐
                        │    nombreComprador   │          │
                        │    emailComprador    │          │
                        │    telefonoComprador │          │
                        │    total             │          │
                        │    metodoPago        │          │
                        │    stripePaymentId?  │          │
                        │    status            │          │
                        │    createdAt         │          │
                        │    updatedAt         │          │
                        └──────────────────────┘          │
                                                          │ N
                                                          │
                                                          │ 1
                                                          ▼
                                            ┌──────────────────────┐
                                            │       USUARIOS       │
                                            ├──────────────────────┤
                                            │ PK id                │
                                            │    firebaseUid       │
                                            │    email             │
                                            │    nombre?           │
                                            │    telefono?         │
                                            │    rol               │
                                            │    status            │
                                            │    createdAt         │
                                            │    updatedAt         │
                                            └──────────────────────┘
```

## Detalle de las Entidades

### 1. COMERCIOS (Organizadores)
**Propósito:** Entidad principal que gestiona eventos (multitenant)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| nombre | String | Nombre del comercio/organizador |
| slug | String | URL-friendly (mi-empresa) |
| descripcion | Text | Descripción del comercio |
| logo | String | URL del logo (cuadrado) |
| imagenBanner | String | URL imagen de portada |
| email | String | Email de contacto |
| telefono | String | Teléfono de contacto |
| direccion | String | Dirección física |
| ciudad | String | Ciudad sede |
| pais | String | País (default: Colombia) |
| website | String? | Sitio web (opcional) |
| redesSociales | JSON | { facebook, instagram, twitter, tiktok } |
| colorPrimario | String | Color hex (#000000) para branding |
| colorSecundario | String | Color hex secundario |
| tipoPlan | Enum | free, basic, pro, enterprise |
| limiteEventos | Integer | Máximo eventos activos según plan |
| comision | Decimal(5,2) | % comisión por venta (5.00 = 5%) |
| status | Enum | activo, suspendido, inactivo |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |
| deletedAt | DateTime? | Soft delete (nullable) |

**Índices:**
- `idx_comercios_slug` en `slug` (UNIQUE)
- `idx_comercios_email` en `email` (UNIQUE)
- `idx_comercios_status` en `status`
- `idx_comercios_ciudad` en `ciudad`

**Planes de Comercio:**
- **Free**: 2 eventos activos, comisión 10%
- **Basic**: 10 eventos activos, comisión 7%
- **Pro**: 50 eventos activos, comisión 5%
- **Enterprise**: Ilimitado, comisión 3%

---

### 2. USUARIOS_COMERCIO (Tabla Intermedia)
**Propósito:** Asignar usuarios a comercios con roles específicos (máximo 3 usuarios por comercio)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| comercioId | UUID | FK a COMERCIOS |
| userId | UUID | FK a USUARIOS |
| rol | Enum | admin, finanzas, operaciones |
| permisos | JSON | Permisos granulares personalizados |
| status | Enum | activo, inactivo |
| createdAt | DateTime | Fecha de asignación |

**Roles y Permisos:**

**Admin:**
```json
{
  "eventos": ["crear", "editar", "eliminar", "publicar"],
  "tiers": ["crear", "editar", "eliminar"],
  "boletos": ["ver", "validar", "cancelar"],
  "finanzas": ["ver_reportes", "ver_ventas"],
  "usuarios": ["invitar", "editar", "eliminar"],
  "configuracion": ["editar"]
}
```

**Finanzas:**
```json
{
  "eventos": ["ver"],
  "boletos": ["ver"],
  "finanzas": ["ver_reportes", "ver_ventas", "exportar"],
  "usuarios": ["ver"]
}
```

**Operaciones:**
```json
{
  "eventos": ["ver"],
  "boletos": ["ver", "validar"],
  "finanzas": ["ver_ventas_basico"]
}
```

**Índices:**
- `idx_usuarios_comercio_comercio` en `comercioId`
- `idx_usuarios_comercio_usuario` en `userId`
- Índice compuesto UNIQUE en (comercioId, userId)

---

### 3. EVENTOS
### 3. EVENTOS
**Propósito:** Almacena la información principal de cada evento (pertenece a un comercio)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| comercioId | UUID | FK a COMERCIOS |
| nombre | String | Nombre del evento |
| descripcion | Text | Descripción completa |
| imagen | String | URL de imagen principal |
| ciudad | String | Ciudad donde se realiza |
| ubicacion | String | Dirección o nombre del venue |
| status | Enum | activo, pausado, finalizado, cancelado |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |
| deletedAt | DateTime? | Soft delete (nullable) |

**Índices:**
- `idx_eventos_comercio` en `comercioId`
- `idx_eventos_ciudad` en `ciudad`
- `idx_eventos_status` en `status`
- `idx_eventos_deleted` en `deletedAt`

---

### 4. CATEGORIAS
**Propósito:** Categorización de eventos (Rock, Electrónica, etc.)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| slug | String | URL-friendly (rock-underground) |
| nombre | String | Nombre visible |
| descripcion | Text | Descripción de la categoría |
| imagen | String | URL imagen de categoría |
| icono | String | Nombre del ícono Material |
| status | Enum | activa, inactiva |
| createdAt | DateTime | Fecha de creación |

**Índices:**
- `idx_categorias_slug` en `slug` (UNIQUE)
- `idx_categorias_status` en `status`

---

### 5. EVENTOS_CATEGORIAS (Tabla Intermedia)
**Propósito:** Relación N:M entre eventos y categorías (máximo 5 por evento)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| eventoId | UUID | FK a EVENTOS |
| categoriaId | UUID | FK a CATEGORIAS |
| createdAt | DateTime | Fecha de creación |

**Restricciones:**
- Un evento puede tener máximo 5 categorías
- Índice compuesto UNIQUE en (eventoId, categoriaId)

**Índices:**
- `idx_eventos_cat_evento` en `eventoId`
- `idx_eventos_cat_categoria` en `categoriaId`

---

### 6. FECHAS_EVENTO
**Propósito:** Un evento puede tener múltiples fechas/horarios

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| eventoId | UUID | FK a EVENTOS |
| fecha | Date | Fecha del evento (YYYY-MM-DD) |
| horaInicio | Time | Hora de inicio (HH:MM) |
| horaFin | Time? | Hora de fin (opcional) |
| aforoTotal | Integer | Capacidad total |
| aforoDisponible | Integer | Boletos disponibles |
| status | Enum | activa, agotada, cancelada |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |
| deletedAt | DateTime? | Soft delete |

**Índices:**
- `idx_fechas_evento` en `eventoId`
- `idx_fechas_fecha` en `fecha`
- `idx_fechas_status` en `status`

---

### 7. TIERS
**Propósito:** Tipos de entrada para cada fecha (General, VIP, Palco, etc.)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| fechaEventoId | UUID | FK a FECHAS_EVENTO |
| nombre | String | Nombre del tier (General, VIP) |
| descripcion | Text | Beneficios del tier |
| precio | Decimal(10,2) | Precio del tier |
| cantidad | Integer | Total de boletos en tier |
| disponibles | Integer | Boletos disponibles |
| orden | Integer | Orden de visualización (1, 2, 3...) |
| status | Enum | activo, agotado, inactivo |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |
| deletedAt | DateTime? | Soft delete |

**Índices:**
- `idx_tiers_fecha` en `fechaEventoId`
- `idx_tiers_status` en `status`

---

### 8. BOLETOS
**Propósito:** Cada boleto individual generado por tier

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único del boleto |
| tierId | UUID | FK a TIERS |
| compraId | UUID? | FK a COMPRAS (nullable hasta compra) |
| numeroBoleto | String | Número único visible (GN-2025-001234) |
| codigoQR | Text | Código QR generado |
| hash | String | Hash SHA-256 para validación |
| precio | Decimal(10,2) | Precio al momento de compra |
| status | Enum | disponible, vendido, usado, cancelado |
| fechaUso | DateTime? | Fecha/hora de check-in |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

**Restricciones:**
- `numeroBoleto` UNIQUE
- `hash` UNIQUE

**Índices:**
- `idx_boletos_tier` en `tierId`
- `idx_boletos_compra` en `compraId`
- `idx_boletos_numero` en `numeroBoleto` (UNIQUE)
- `idx_boletos_hash` en `hash` (UNIQUE)
- `idx_boletos_status` en `status`

---

### 9. COMPRAS
**Propósito:** Registro de cada transacción de compra

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| userId | UUID? | FK a USUARIOS (nullable para anónimos) |
| nombreComprador | String | Nombre del comprador |
| emailComprador | String | Email para envío |
| telefonoComprador | String? | Teléfono de contacto |
| total | Decimal(10,2) | Total de la compra |
| metodoPago | Enum | stripe, efectivo, transferencia |
| stripePaymentId | String? | ID de transacción Stripe |
| status | Enum | pendiente, completada, cancelada, reembolsada |
| createdAt | DateTime | Fecha de compra |
| updatedAt | DateTime | Última actualización |

**Índices:**
- `idx_compras_usuario` en `userId`
- `idx_compras_email` en `emailComprador`
- `idx_compras_status` en `status`
- `idx_compras_created` en `createdAt`

---

### 10. USUARIOS
**Propósito:** Usuarios registrados del sistema

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| firebaseUid | String | UID de Firebase Auth |
| email | String | Email del usuario |
| nombre | String? | Nombre completo |
| telefono | String? | Teléfono |
| rol | Enum | comprador, organizador, admin |
| status | Enum | activo, inactivo, bloqueado |
| createdAt | DateTime | Fecha de registro |
| updatedAt | DateTime | Última actualización |

**Restricciones:**
- `firebaseUid` UNIQUE
- `email` UNIQUE

**Índices:**
- `idx_usuarios_firebase` en `firebaseUid` (UNIQUE)
- `idx_usuarios_email` en `email` (UNIQUE)

---

## Relaciones Clave

### 1. Comercio → Usuarios (Equipo)
```
COMERCIO (1) ←→ USUARIOS_COMERCIO ←→ USUARIO (N)
(Máximo 3 usuarios por comercio: Admin, Finanzas, Operaciones)
```

### 2. Comercio → Eventos → Fechas → Tiers → Boletos
```
COMERCIO (1)
  ↓
EVENTO (N) - Un comercio puede tener múltiples eventos
  ↓
FECHAS_EVENTO (N) - Un evento puede tener múltiples fechas
  ↓
TIERS (N) - Cada fecha puede tener múltiples tiers
  ↓
BOLETOS (N) - Cada tier tiene múltiples boletos individuales
```

### 3. Evento → Categorías
```
EVENTO (N) ←→ EVENTOS_CATEGORIAS ←→ CATEGORIA (M)
(Máximo 5 categorías por evento)
```

### 4. Compra → Boletos
```
COMPRA (1) ←─ BOLETOS (N)
(Una compra puede incluir múltiples boletos)
```

### 5. Usuario → Compras
```
USUARIO (1) ←─ COMPRAS (N)
(Un usuario puede tener múltiples compras)
```

---

## Flujo de Datos

### 1. Registro de Comercio
```
1. Crear COMERCIO (nombre, email, plan)
2. Asignar usuario creador como Admin
3. Crear entrada en USUARIOS_COMERCIO
4. Generar slug único
5. Configurar branding (logo, colores)
```

### 2. Creación de Evento
```
1. Validar límite de eventos según plan del COMERCIO
2. Crear EVENTO (asociado a comercioId)
3. Asociar CATEGORIAS (1-5)
4. Crear FECHAS_EVENTO
5. Para cada fecha, crear TIERS
6. Para cada tier, generar BOLETOS individuales
```

### 3. Proceso de Compra
```
1. Usuario selecciona evento + fecha + tier + cantidad
2. Sistema verifica disponibilidad en BOLETOS
3. Se crea COMPRA
4. Se asignan BOLETOS.compraId
5. Se actualiza BOLETOS.status = 'vendido'
6. Se actualiza TIERS.disponibles
7. Se actualiza FECHAS_EVENTO.aforoDisponible
8. Se calcula comisión del COMERCIO
9. Se genera PDF + QR por cada boleto
```

### 4. Validación de Entrada
```
1. Escanear QR de BOLETO
2. Verificar BOLETO.hash
3. Validar BOLETO.status = 'vendido'
4. Actualizar BOLETO.status = 'usado'
5. Registrar BOLETO.fechaUso
```

---

## Reglas de Negocio

### Soft Delete
- **COMERCIOS**: `deletedAt` no nulo = comercio eliminado (se preservan eventos históricos)
- **EVENTOS**: `deletedAt` no nulo = evento eliminado (no se muestra)
- **FECHAS_EVENTO**: `deletedAt` no nulo = fecha cancelada
- **TIERS**: `deletedAt` no nulo = tier desactivado
- **Historial**: Nunca se eliminan físicamente para preservar compras

### Estados (Status)

**COMERCIOS:**
- `activo`: Operando normalmente
- `suspendido`: Temporalmente deshabilitado (impago, violación)
- `inactivo`: Comercio cerrado voluntariamente

**EVENTOS:**
- `activo`: Visible y vendiendo
- `pausado`: Existe pero no se vende
- `finalizado`: Evento ya ocurrió
- `cancelado`: Evento cancelado

**FECHAS_EVENTO:**
- `activa`: Vendiendo boletos
- `agotada`: Sin boletos disponibles
- `cancelada`: Fecha cancelada

**TIERS:**
- `activo`: Disponible para venta
- `agotado`: Sin boletos
- `inactivo`: Desactivado manualmente

**BOLETOS:**
- `disponible`: No vendido
- `vendido`: Comprado, pendiente de uso
- `usado`: Ya ingresó al evento
- `cancelado`: Compra reembolsada

**COMPRAS:**
- `pendiente`: Pago en proceso
- `completada`: Pago exitoso
- `cancelada`: Compra cancelada
- `reembolsada`: Dinero devuelto

---

## Consultas Frecuentes (Queries)

### 1. Obtener eventos de un comercio
```sql
SELECT e.*, 
       array_agg(DISTINCT c.nombre) as categorias,
       count(DISTINCT fe.id) as totalFechas,
       min(t.precio) as precioDesde,
       sum(t.disponibles) as boletosDisponibles
FROM eventos e
LEFT JOIN fechas_evento fe ON fe.eventoId = e.id AND fe.deletedAt IS NULL
LEFT JOIN tiers t ON t.fechaEventoId = fe.id AND t.deletedAt IS NULL
LEFT JOIN eventos_categorias ec ON ec.eventoId = e.id
LEFT JOIN categorias c ON c.id = ec.categoriaId
WHERE e.comercioId = ?
  AND e.deletedAt IS NULL
GROUP BY e.id
ORDER BY e.createdAt DESC
```

### 2. Listar eventos por ciudad y fecha (búsqueda pública)
```sql
SELECT e.*, 
       co.nombre as nombreComercio,
       co.logo as logoComercio,
       array_agg(c.nombre) as categorias,
       min(t.precio) as precioDesde,
       fe.fecha, fe.horaInicio
FROM eventos e
JOIN comercios co ON co.id = e.comercioId AND co.status = 'activo'
JOIN fechas_evento fe ON fe.eventoId = e.id
JOIN tiers t ON t.fechaEventoId = fe.id
JOIN eventos_categorias ec ON ec.eventoId = e.id
JOIN categorias c ON c.id = ec.categoriaId
WHERE e.ciudad = ? 
  AND fe.fecha >= ?
  AND e.status = 'activo'
  AND e.deletedAt IS NULL
  AND fe.status = 'activa'
GROUP BY e.id, fe.id, co.nombre, co.logo
ORDER BY fe.fecha ASC
```

### 3. Dashboard de comercio (estadísticas)
```sql
SELECT 
  count(DISTINCT e.id) as totalEventos,
  count(DISTINCT CASE WHEN e.status = 'activo' THEN e.id END) as eventosActivos,
  count(DISTINCT co.id) as totalCompras,
  sum(co.total) as ventasTotales,
  sum(co.total * com.comision / 100) as comisionesPlataforma,
  sum(co.total * (100 - com.comision) / 100) as ingresosNetos
FROM comercios com
LEFT JOIN eventos e ON e.comercioId = com.id
LEFT JOIN fechas_evento fe ON fe.eventoId = e.id
LEFT JOIN tiers t ON t.fechaEventoId = fe.id
LEFT JOIN boletos b ON b.tierId = t.id
LEFT JOIN compras co ON co.id = b.compraId AND co.status = 'completada'
WHERE com.id = ?
GROUP BY com.id
```

### 4. Verificar límite de eventos según plan
```sql
SELECT 
  com.tipoPlan,
  com.limiteEventos,
  count(e.id) as eventosActivos
FROM comercios com
LEFT JOIN eventos e ON e.comercioId = com.id 
  AND e.status = 'activo' 
  AND e.deletedAt IS NULL
WHERE com.id = ?
GROUP BY com.id
HAVING count(e.id) < com.limiteEventos
```

### 5. Obtener disponibilidad de un evento
```sql
SELECT 
  fe.fecha,
  fe.horaInicio,
  t.nombre as tier,
  t.precio,
  t.disponibles
FROM fechas_evento fe
JOIN tiers t ON t.fechaEventoId = fe.id
WHERE fe.eventoId = ?
  AND fe.status = 'activa'
  AND t.status = 'activo'
  AND t.disponibles > 0
ORDER BY fe.fecha, t.orden
```

### 6. Historial de compras de usuario
```sql
SELECT 
  c.id,
  c.createdAt,
  c.total,
  e.nombre as evento,
  fe.fecha,
  count(b.id) as cantidadBoletos
FROM compras c
JOIN boletos b ON b.compraId = c.id
JOIN tiers t ON t.id = b.tierId
JOIN fechas_evento fe ON fe.id = t.fechaEventoId
JOIN eventos e ON e.id = fe.eventoId
WHERE c.userId = ?
GROUP BY c.id, e.nombre, fe.fecha
ORDER BY c.createdAt DESC
```

### 7. Usuarios de un comercio con sus roles
```sql
SELECT 
  u.id,
  u.email,
  u.nombre,
  uc.rol,
  uc.permisos,
  uc.status,
  uc.createdAt as fechaAsignacion
FROM usuarios_comercio uc
JOIN usuarios u ON u.id = uc.userId
WHERE uc.comercioId = ?
  AND uc.status = 'activo'
ORDER BY 
  CASE uc.rol
    WHEN 'admin' THEN 1
    WHEN 'finanzas' THEN 2
    WHEN 'operaciones' THEN 3
  END
```

---

## Consideraciones de Escalabilidad

### Índices Críticos
- Todos los FKs deben tener índices
- Campos de búsqueda frecuente (ciudad, fecha, status, comercioId)
- Campos únicos (hash, numeroBoleto, email, slug)

### Particionamiento
- **BOLETOS**: Particionar por `createdAt` (por año)
- **COMPRAS**: Particionar por `createdAt` (por mes)
- **EVENTOS**: Particionar por `comercioId` cuando escale

### Caché
- Comercios activos (rara vez cambian)
- Eventos activos por ciudad
- Disponibilidad de tiers
- Categorías (rara vez cambian)

### Límites por Plan
```javascript
const PLANES = {
  free: { eventos: 2, usuarios: 1, comision: 10.0 },
  basic: { eventos: 10, usuarios: 2, comision: 7.0 },
  pro: { eventos: 50, usuarios: 3, comision: 5.0 },
  enterprise: { eventos: -1, usuarios: 10, comision: 3.0 } // -1 = ilimitado
}
```

---

## Próximos Pasos

1. ✅ **Validar este modelo** con el equipo
2. ⏳ Crear migraciones de base de datos
3. ⏳ Implementar modelos en backend (Firestore/PostgreSQL)
4. ⏳ Crear scripts de seed con comercios y eventos dummy
5. ⏳ Actualizar APIs del backend
6. ⏳ Crear panel de administración de comercios
7. ⏳ Implementar sistema de invitaciones de usuarios
8. ⏳ Actualizar frontend para multi-comercio
9. ⏳ Sistema de onboarding para nuevos comercios

---

## Modelo de Negocio: Planes de Comercio

### Plan FREE (Piloto)
- **Costo:** $0/mes
- **Eventos activos:** 2
- **Usuarios:** 1 (solo admin)
- **Comisión:** 10%
- **Características:**
  - ✅ Creación de eventos básicos
  - ✅ Múltiples fechas y tiers
  - ✅ Generación de QR
  - ✅ Validación básica
  - ❌ Sin personalización de marca
  - ❌ Sin reportes avanzados

### Plan BASIC
- **Costo:** $50,000 COP/mes
- **Eventos activos:** 10
- **Usuarios:** 2 (admin + finanzas/operaciones)
- **Comisión:** 7%
- **Características:**
  - ✅ Todo lo de FREE
  - ✅ Logo personalizado
  - ✅ Colores de marca
  - ✅ Reportes básicos
  - ✅ Exportar ventas CSV
  - ❌ Sin API

### Plan PRO
- **Costo:** $150,000 COP/mes
- **Eventos activos:** 50
- **Usuarios:** 3 (admin + finanzas + operaciones)
- **Comisión:** 5%
- **Características:**
  - ✅ Todo lo de BASIC
  - ✅ Dashboard avanzado
  - ✅ Analytics en tiempo real
  - ✅ Integración email marketing
  - ✅ Soporte prioritario
  - ✅ White-label parcial

### Plan ENTERPRISE
- **Costo:** Negociable (desde $500,000 COP/mes)
- **Eventos activos:** Ilimitados
- **Usuarios:** Hasta 10
- **Comisión:** 3% (negociable)
- **Características:**
  - ✅ Todo lo de PRO
  - ✅ API privada
  - ✅ Webhooks
  - ✅ Dominio personalizado
  - ✅ White-label completo
  - ✅ Soporte 24/7
  - ✅ Integración contable
  - ✅ Account manager dedicado

---

## Estructura JSON de Ejemplo

### COMERCIO
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Producciones Rock Latino",
  "slug": "producciones-rock-latino",
  "descripcion": "Organizadores de los mejores eventos de rock en Colombia",
  "logo": "https://storage.googleapis.com/gradanegra/comercios/logo-prod-rock.jpg",
  "imagenBanner": "https://storage.googleapis.com/gradanegra/comercios/banner-prod-rock.jpg",
  "email": "contacto@prodrocklatino.com",
  "telefono": "+57 310 555 1234",
  "direccion": "Calle 85 #15-25, Oficina 401",
  "ciudad": "Bogotá",
  "pais": "Colombia",
  "website": "https://prodrocklatino.com",
  "redesSociales": {
    "facebook": "https://facebook.com/prodrocklatino",
    "instagram": "@prodrocklatino",
    "twitter": "@prodrocklatino",
    "tiktok": "@prodrocklatino"
  },
  "colorPrimario": "#FF3333",
  "colorSecundario": "#1A1A1A",
  "tipoPlan": "pro",
  "limiteEventos": 50,
  "comision": 5.0,
  "status": "activo",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-11-06T15:30:00Z",
  "deletedAt": null
}
```

### USUARIO_COMERCIO
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "comercioId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "770e8400-e29b-41d4-a716-446655440002",
  "rol": "admin",
  "permisos": {
    "eventos": ["crear", "editar", "eliminar", "publicar"],
    "tiers": ["crear", "editar", "eliminar"],
    "boletos": ["ver", "validar", "cancelar"],
    "finanzas": ["ver_reportes", "ver_ventas"],
    "usuarios": ["invitar", "editar", "eliminar"],
    "configuracion": ["editar"]
  },
  "status": "activo",
  "createdAt": "2025-01-15T10:05:00Z"
}
```

---

**¿Apruebas este modelo de datos o necesitas algún ajuste?**
