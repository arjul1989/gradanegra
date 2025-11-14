# PROMPT: Panel de Usuario - Grada Negra

## 🎯 CONTEXTO DEL PROYECTO

**Grada Negra** es una plataforma de venta de boletos para eventos en Colombia (similar a Ticketmaster). Necesitamos implementar un **Panel de Usuario** que permita a los compradores gestionar su perfil, ver sus boletos comprados, descargar QR codes, y agregar tickets a Google Wallet y Apple Wallet.

---

## 🏗️ ESTRUCTURA DEL SISTEMA

### Modelo de Datos Actual

#### **USUARIO** (Comprador de Boletos)
```javascript
{
  uid: string, // Firebase Auth UID
  email: string,
  displayName: string,
  photoURL: string,
  phoneNumber: string,
  cedula: string,
  fechaNacimiento: string (YYYY-MM-DD),
  genero: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir',
  ciudad: string,
  pais: string (default: 'Colombia'),
  notificacionesEmail: boolean,
  notificacionesSMS: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### **COMPRA** (Registro de una transacción)
```javascript
{
  id: string,
  userId: string, // Firebase Auth UID del comprador
  comercioId: string,
  eventoId: string,
  metodoPago: 'tarjeta' | 'pse' | 'efectivo' | 'transferencia',
  subtotal: number,
  descuento: number,
  total: number,
  cuponId: string (nullable),
  status: 'pendiente' | 'completada' | 'cancelada' | 'reembolsada',
  nombre: string, // Nombre del comprador
  email: string,
  telefono: string,
  cedula: string,
  fechaCompra: timestamp,
  comprobantePago: string (URL, opcional),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### **BOLETO** (Boleto individual comprado)
```javascript
{
  id: string,
  tierId: string,
  numeroBoleto: string (único, ej: 'GN-001234'),
  precio: number,
  compraId: string,
  status: 'vendido' | 'usado' | 'cancelado',
  qrCode: string (URL del QR generado),
  fechaUso: timestamp (nullable),
  verificadorId: string (nullable),
  ubicacionUso: string (nullable),
  
  // Datos embebidos para evitar joins
  eventoNombre: string,
  eventoImagen: string,
  eventoCiudad: string,
  eventoUbicacion: string,
  fechaEvento: string (YYYY-MM-DD),
  horaInicio: string (HH:MM),
  horaFin: string (HH:MM),
  tierNombre: string,
  tierDescripcion: string,
  
  // Wallet integrations
  googleWalletUrl: string (nullable),
  appleWalletUrl: string (nullable),
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## 🎨 REQUISITOS DE DISEÑO

### 1. **ACCESO AL PANEL DE USUARIO**

**Ubicación del Botón:**
- En el header principal (menú de usuario cuando está logueado)
- Icono: Avatar del usuario o Material Symbol `account_circle`
- Dropdown con opciones:
  - 👤 Mi Perfil
  - 🎟️ Mis Boletos
  - ⚙️ Configuración
  - 🚪 Cerrar Sesión

**Flujo de Autenticación:**
1. Usuario hace login con Google (reutilizar sistema existente)
2. Puede acceder al panel desde cualquier página
3. Si no está autenticado → Redirigir a login
4. Después de comprar boletos → Opción de crear cuenta o continuar como invitado

---

### 2. **PANTALLAS REQUERIDAS**

#### **A. MI PERFIL**
Vista principal del usuario con información personal editable.

**Layout:**
- **Header:**
  - Avatar grande (circular)
  - Nombre del usuario
  - Email
  - Badge: "Miembro desde [fecha]"
  - Botón: "Editar Perfil"

- **Tabs de Contenido:**
  
  **Tab 1: Información Personal**
  - Nombre completo *
  - Email * (solo lectura si es de Google)
  - Teléfono
  - Cédula / Documento de identidad
  - Fecha de nacimiento (date picker)
  - Género (select)
  - Ciudad *
  - País (default: Colombia)
  
  **Tab 2: Preferencias**
  - **Notificaciones:**
    - ✓ Recibir emails sobre mis eventos
    - ✓ Recibir SMS recordatorios
    - ✓ Ofertas y promociones
    - ✓ Eventos recomendados
  
  - **Idioma y Región:**
    - Idioma: Español
    - Zona horaria: América/Bogotá
  
  **Tab 3: Seguridad**
  - Email de cuenta (solo lectura)
  - Último inicio de sesión
  - Dispositivos activos
  - Botón: "Cerrar todas las sesiones"
  - Botón: "Eliminar mi cuenta" (con confirmación)

**Botones de Acción:**
- "💾 Guardar Cambios"
- "❌ Cancelar"

---

#### **B. MIS BOLETOS**
Lista de todos los boletos comprados por el usuario.

**Vista Principal:**
- **Filtros y Búsqueda:**
  - Buscar por nombre de evento
  - Filtrar por:
    - Status: Todos | Próximos | Usados | Cancelados
    - Fecha: Próxima semana | Próximo mes | Pasados
    - Ciudad: Todas | [ciudades]
  - Ordenar por: Fecha del evento | Fecha de compra | Nombre

- **Cards de Boletos (Grid):**
  Cada card debe mostrar:
  - **Header del Card:**
    - Imagen del evento (thumbnail)
    - Badge de status:
      - 🟢 "Válido" (verde) → Boleto vendido, evento futuro
      - 🔵 "Usado" (azul) → Boleto ya utilizado
      - 🔴 "Cancelado" (rojo) → Evento o boleto cancelado
      - ⏰ "Próximo" (amarillo) → Evento en las próximas 24hrs
  
  - **Información del Boleto:**
    - Nombre del evento (título bold)
    - 📅 Fecha: "Sábado, 15 Nov 2025"
    - 🕐 Hora: "20:00 - 23:00"
    - 📍 Ubicación: "Movistar Arena, Bogotá"
    - 🎫 Tier: "General" | "VIP" | "Palco"
    - 💰 Precio: "$50,000 COP"
    - 🔢 # Boleto: "GN-001234"
  
  - **Acciones (Botones):**
    - 📱 "Ver QR" → Modal con QR grande
    - 📥 "Descargar PDF" → Generar PDF del boleto
    - 📲 "Google Wallet" → Agregar a Google Wallet
    - 🍎 "Apple Wallet" → Agregar a Apple Wallet
    - 📧 "Reenviar por Email" → Enviar boleto por correo
    - ℹ️ "Ver Detalles" → Modal con info completa

**Estados Visuales:**
- Boletos próximos: Border destacado (azul)
- Boletos del día: Animación sutil o glow
- Boletos usados: Opacidad reducida, marca de agua "USADO"
- Boletos cancelados: Opacidad muy baja, tachado

---

#### **C. DETALLE DE BOLETO (Modal/Página)**
Vista ampliada de un boleto individual.

**Contenido:**
- **Sección 1: QR Code**
  - QR Code grande y centrado (300x300px mínimo)
  - Texto: "Presenta este código en la entrada"
  - Si está usado: Marca de agua "USADO" sobre el QR
  - Número de boleto debajo del QR (fuente monospace)

- **Sección 2: Información del Evento**
  - Imagen del evento
  - Nombre del evento
  - Descripción corta
  - Fecha y hora completa
  - Ubicación con mapa embebido (Google Maps)
  - Botón: "¿Cómo llegar?" → Abrir en Google Maps

- **Sección 3: Detalles del Boleto**
  - Tier y descripción
  - Precio pagado
  - Fecha de compra
  - Método de pago
  - Número de confirmación
  - Descuento aplicado (si hubo cupón)

- **Sección 4: Información del Comprador**
  - Nombre
  - Email
  - Teléfono
  - Cédula

- **Sección 5: Acciones Rápidas**
  - 📥 Descargar PDF
  - 📲 Agregar a Google Wallet
  - 🍎 Agregar a Apple Wallet
  - 📧 Reenviar por Email
  - 📤 Compartir (WhatsApp, Telegram, etc.)

- **Sección 6: Términos y Condiciones**
  - Link a políticas de reembolso
  - Link a términos del evento
  - Información de contacto del organizador

---

#### **D. HISTORIAL DE COMPRAS**
Lista de todas las transacciones realizadas.

**Tabla/Cards con:**
- Fecha de compra
- Evento
- Cantidad de boletos
- Total pagado
- Método de pago
- Status de la compra
- Botón: "Ver Boletos" → Redirige a filtro de boletos de esa compra
- Botón: "Descargar Factura" (si aplica)

**Filtros:**
- Rango de fechas
- Status: Todas | Completadas | Pendientes | Canceladas
- Búsqueda por evento

---

#### **E. DESCARGAR PDF DE BOLETO**
Diseño del PDF que se puede descargar.

**Estructura del PDF:**
```
┌────────────────────────────────────────┐
│ [Logo Grada Negra]    Boleto Digital  │
│────────────────────────────────────────│
│                                         │
│        [QR CODE GRANDE]                │
│                                         │
│        Número: GN-001234               │
│────────────────────────────────────────│
│ EVENTO                                 │
│ Nombre del Evento                      │
│ Sábado, 15 de Noviembre 2025          │
│ 20:00 hrs                              │
│────────────────────────────────────────│
│ UBICACIÓN                              │
│ Movistar Arena                         │
│ Calle 123 #45-67, Bogotá              │
│────────────────────────────────────────│
│ DETALLES DEL BOLETO                   │
│ Tier: General                          │
│ Precio: $50,000 COP                    │
│ Comprador: Juan Pérez                  │
│────────────────────────────────────────│
│ IMPORTANTE:                            │
│ • Presenta este código en la entrada  │
│ • No se permiten reembolsos           │
│ • Llega 30 min antes del evento       │
│────────────────────────────────────────│
│ Grada Negra © 2025                     │
│ www.gradanegra.com                     │
└────────────────────────────────────────┘
```

---

#### **F. INTEGRACIÓN CON GOOGLE WALLET**
Permitir agregar boleto a Google Wallet.

**Flujo:**
1. Usuario hace click en "Agregar a Google Wallet"
2. Sistema genera un Google Wallet Pass con:
   - Logo del evento
   - Nombre del evento
   - Fecha y hora
   - QR Code
   - Número de boleto
   - Ubicación
   - Status del boleto
3. Se abre Google Wallet para guardar el pase
4. El pase se actualiza automáticamente si cambia el status

**Campos del Google Wallet Pass:**
```json
{
  "type": "EventTicket",
  "eventName": "Nombre del Evento",
  "eventDateTime": "2025-11-15T20:00:00",
  "venueName": "Movistar Arena",
  "venueAddress": "Calle 123 #45-67, Bogotá",
  "seatInfo": "General",
  "barcode": {
    "type": "QR_CODE",
    "value": "GN-001234"
  },
  "logo": "https://...",
  "backgroundColor": "#1a1a1a"
}
```

---

#### **G. INTEGRACIÓN CON APPLE WALLET**
Permitir agregar boleto a Apple Wallet (iOS/macOS).

**Flujo:**
1. Usuario hace click en "Agregar a Apple Wallet"
2. Sistema genera un `.pkpass` file con:
   - Logo del evento
   - Nombre del evento
   - Fecha y hora
   - QR Code (strip image)
   - Número de boleto
   - Ubicación con coordenadas GPS
   - Notificaciones de recordatorio
3. Se descarga el archivo .pkpass
4. iOS/macOS abre Wallet automáticamente
5. El pase puede recibir push notifications

**Campos del Apple Wallet Pass:**
```json
{
  "passTypeIdentifier": "pass.com.gradanegra.ticket",
  "formatVersion": 1,
  "organizationName": "Grada Negra",
  "serialNumber": "GN-001234",
  "description": "Boleto - Nombre del Evento",
  "eventTicket": {
    "primaryFields": [
      {
        "key": "event",
        "label": "EVENTO",
        "value": "Nombre del Evento"
      }
    ],
    "secondaryFields": [
      {
        "key": "date",
        "label": "FECHA",
        "value": "15 Nov 2025"
      },
      {
        "key": "time",
        "label": "HORA",
        "value": "20:00"
      }
    ],
    "auxiliaryFields": [
      {
        "key": "seat",
        "label": "TIER",
        "value": "General"
      }
    ],
    "backFields": [
      {
        "key": "venue",
        "label": "Ubicación",
        "value": "Movistar Arena\nCalle 123 #45-67, Bogotá"
      }
    ]
  },
  "barcode": {
    "message": "GN-001234",
    "format": "PKBarcodeFormatQR",
    "messageEncoding": "iso-8859-1"
  },
  "locations": [
    {
      "latitude": 4.7110,
      "longitude": -74.0721,
      "relevantText": "Has llegado al Movistar Arena"
    }
  ],
  "relevantDate": "2025-11-15T20:00:00Z"
}
```

---

#### **H. NOTIFICACIONES Y RECORDATORIOS**
Sistema de recordatorios automáticos.

**Tipos de Notificaciones:**
1. **Email de Confirmación** (inmediato después de compra)
   - Resumen de la compra
   - Links a los boletos
   - Botones de wallet

2. **Recordatorio 7 días antes**
   - Email: "Tu evento se acerca"
   - Push notification (si tiene wallet)

3. **Recordatorio 24 horas antes**
   - Email: "Mañana es tu evento"
   - SMS: "Recuerda tu evento mañana a las 20:00"

4. **Recordatorio 2 horas antes**
   - Push notification: "Tu evento comienza pronto"
   - Link directo al QR

5. **Notificación de Cambios**
   - Email/Push si cambia fecha, hora o ubicación
   - Email/Push si el evento es cancelado

---

#### **I. COMPARTIR BOLETOS (Opcional - Fase 2)**
Permitir transferir boletos a otros usuarios.

**Funcionalidad:**
- Botón: "Transferir Boleto"
- Modal con opciones:
  - Email del destinatario
  - Mensaje opcional
  - Confirmación
- El boleto se transfiere a la cuenta del destinatario
- Se envía email a ambos usuarios
- El remitente pierde acceso al boleto

---

## 🎨 GUÍA DE ESTILO

### **Paleta de Colores:**
- **Primary:** Grays de Grada Negra (#1a1a1a, #2d2d2d)
- **Success:** Verde (#10b981) para boletos válidos
- **Warning:** Amarillo (#f59e0b) para próximos eventos
- **Danger:** Rojo (#ef4444) para cancelados
- **Info:** Azul (#3b82f6) para usados
- **Accents:** Morado (#8b5cf6) para wallets

### **Tipografía:**
- Mantener Inter como fuente base
- **Número de boleto:** Fuente monospace (JetBrains Mono o Courier)
- Tamaños:
  - H1: 2rem - Títulos de sección
  - H2: 1.5rem - Nombre de evento
  - Body: 1rem - Información general
  - Small: 0.875rem - Detalles secundarios

### **Componentes:**

**Cards de Boletos:**
```css
.ticket-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.ticket-card.upcoming {
  border-color: #3b82f6;
  box-shadow: 0 4px 20px rgba(59,130,246,0.2);
}

.ticket-card.used {
  opacity: 0.6;
  background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
}
```

**Botones de Wallet:**
- Google Wallet: Fondo negro, logo de Google
- Apple Wallet: Fondo negro, logo de Apple
- Tamaño uniforme: 48px alto
- Border radius: 8px
- Hover: Escala 1.05

**QR Code:**
- Tamaño mínimo: 200x200px
- Tamaño recomendado: 300x300px
- Padding: 16px alrededor
- Fondo blanco
- Border radius: 12px
- Box shadow suave

### **Iconografía:**
- Material Symbols para consistencia
- Tamaños:
  - Cards: 20px
  - Botones: 20px
  - Headers: 24px
  - QR labels: 16px

### **Layout:**
- **Desktop:** 
  - Max-width: 1200px
  - Grid de boletos: 3 columnas
  - Sidebar de filtros: 280px

- **Tablet:**
  - Grid de boletos: 2 columnas
  - Sidebar colapsable

- **Mobile:**
  - Grid de boletos: 1 columna
  - Filtros en modal
  - Bottom navigation bar

### **Responsive:**
- **Mobile (<768px):**
  - Stack vertical
  - Botones full-width
  - QR code adaptable

- **Tablet (768px-1024px):**
  - Grid 2x2
  - Sidebar visible

- **Desktop (>1024px):**
  - Grid 3x3
  - Sidebar fijo
  - Hover effects

---

## 🔐 CONSIDERACIONES DE SEGURIDAD

1. **Protección de QR Codes:**
   - No exponer QR codes en URLs públicas
   - Generar URLs firmadas con expiración
   - Watermark en screenshots

2. **Privacidad:**
   - No mostrar datos sensibles (cédula completa)
   - Ofuscar email: j***@gmail.com
   - Ofuscar teléfono: +57 300 *** **34

3. **Transferencias:**
   - Verificar identidad antes de transferir
   - Límite de transferencias por boleto (1 vez)
   - Registro de historial de transferencias

4. **Wallet Security:**
   - Firmar passes con certificados
   - Validar tokens de wallet
   - Rate limiting en generación de passes

---

## 📱 FLUJO DE USUARIO COMPLETO

### **Caso de Uso 1: Comprar y Agregar a Wallet**
```
1. Usuario compra boletos → Checkout
2. Pago exitoso → Email de confirmación
3. Email incluye links: Ver Boletos | Google Wallet | Apple Wallet
4. Click en "Google Wallet" → Se abre Google Wallet
5. Boleto guardado en wallet
6. 24 horas antes → Push notification recordatorio
7. Día del evento → Presentar QR desde wallet
8. QR escaneado → Boleto marcado como "usado"
9. Wallet se actualiza automáticamente
```

### **Caso de Uso 2: Acceder a Boletos desde el Panel**
```
1. Usuario hace login → Header dropdown
2. Click "Mis Boletos" → Lista de boletos
3. Filtrar por "Próximos" → Ver solo eventos futuros
4. Click en un boleto → Modal con detalle
5. Ver QR grande → Presentar en puerta
6. Descargar PDF → Backup del boleto
```

### **Caso de Uso 3: Reenviar Boleto por Email**
```
1. Usuario en "Mis Boletos"
2. Click "Reenviar por Email" en un boleto
3. Modal: "¿A qué email quieres reenviar?"
4. Ingresar email (validar formato)
5. Click "Enviar"
6. Sistema envía email con boleto adjunto
7. Confirmación: "✅ Boleto reenviado a email@ejemplo.com"
```

---

## 🛠️ TECNOLOGÍA

### **Frontend:**
- Next.js 14+ con App Router
- Tailwind CSS
- Material Symbols
- QR Code: `qrcode.react` o `qr-code-styling`
- PDF: `jsPDF` o `react-pdf`

### **Backend:**
- Node.js + Express
- Firestore para datos
- Firebase Storage para QR codes
- Google Wallet API
- Apple Wallet PKPass generation

### **APIs y Librerías:**
```bash
# QR Codes
npm install qrcode.react

# PDF Generation
npm install jspdf jspdf-autotable

# Google Wallet
npm install @google-pay/wallet-sdk

# Apple Wallet
npm install passkit-generator

# Date/Time
npm install date-fns

# Notifications
npm install firebase-admin (FCM)
```

---

## 📋 PRIORIDAD DE DESARROLLO

### **Fase 1 (MVP):**
1. ✅ Mi Perfil (información básica)
2. ✅ Mis Boletos (lista y filtros)
3. ✅ Ver QR Code (modal)
4. ✅ Descargar PDF de boleto

### **Fase 2:**
5. ✅ Integración Google Wallet
6. ✅ Integración Apple Wallet
7. ✅ Historial de compras
8. ✅ Sistema de notificaciones

### **Fase 3:**
9. Transferir boletos
10. Compartir en redes sociales
11. Recomendaciones personalizadas
12. Favoritos y eventos guardados

---

## 🎯 OBJETIVO FINAL

Crear una experiencia de usuario intuitiva, moderna y completa que permita:
- ✅ Gestionar perfil fácilmente
- ✅ Acceder a boletos desde cualquier dispositivo
- ✅ Usar QR codes para ingresar a eventos
- ✅ Integración nativa con Google/Apple Wallet
- ✅ Recibir notificaciones oportunas
- ✅ Diseño mobile-first y responsive
- ✅ Experiencia similar a apps como Ticketmaster, Stubhub, o Eventbrite

---

## 📸 REFERENCIAS VISUALES (inspiración)

- **Ticketmaster App:** Lista de boletos, QR codes, wallet integration
- **Stubhub:** Diseño de cards de eventos
- **Eventbrite:** Perfil de usuario, gestión de boletos
- **Airbnb:** Estilo de cards y navegación
- **Uber:** Diseño de QR codes y confirmaciones

---

## ✅ ENTREGABLES ESPERADOS

Por favor, genera diseños detallados para:

1. **Mi Perfil** (3 tabs: Personal, Preferencias, Seguridad)
2. **Mis Boletos** (grid con filtros)
3. **Detalle de Boleto** (modal con QR)
4. **Descarga de PDF** (diseño del boleto)
5. **Google Wallet Integration** (flujo y diseño del pass)
6. **Apple Wallet Integration** (flujo y diseño del pass)
7. **Historial de Compras**
8. **Notificaciones** (emails y push)

**Formato:** Figma, Sketch, Adobe XD, o capturas de pantalla de alta fidelidad

**Incluir:**
- Versiones desktop (1920px)
- Versiones mobile (375px)
- Estados: default, hover, loading, error, usado, cancelado
- Paleta de colores exacta
- Componentes de QR code
- Botones de wallet (Google/Apple)
- Animaciones y transiciones

---

## 📊 MODELO DE DATOS RELACIONADO

### **Colecciones Firestore:**

```javascript
// Collection: users
{
  uid: "firebase_uid",
  email: "user@example.com",
  displayName: "Juan Pérez",
  photoURL: "https://...",
  phoneNumber: "+57 300 123 4567",
  cedula: "1234567890",
  fechaNacimiento: "1990-01-15",
  genero: "masculino",
  ciudad: "Bogotá",
  pais: "Colombia",
  notificacionesEmail: true,
  notificacionesSMS: true,
  createdAt: timestamp,
  updatedAt: timestamp
}

// Collection: compras
{
  id: "compra_123",
  userId: "firebase_uid",
  comercioId: "comercio_abc",
  eventoId: "evento_xyz",
  metodoPago: "tarjeta",
  subtotal: 100000,
  descuento: 10000,
  total: 90000,
  cuponId: "cupon_verano",
  status: "completada",
  nombre: "Juan Pérez",
  email: "user@example.com",
  telefono: "+57 300 123 4567",
  cedula: "1234567890",
  fechaCompra: timestamp,
  createdAt: timestamp
}

// Collection: boletos
{
  id: "boleto_001",
  tierId: "tier_general",
  numeroBoleto: "GN-001234",
  precio: 50000,
  compraId: "compra_123",
  status: "vendido",
  qrCode: "https://storage.../qr-GN001234.png",
  
  // Datos embebidos
  eventoNombre: "Concierto Rock",
  eventoImagen: "https://...",
  eventoCiudad: "Bogotá",
  eventoUbicacion: "Movistar Arena",
  fechaEvento: "2025-11-15",
  horaInicio: "20:00",
  horaFin: "23:00",
  tierNombre: "General",
  tierDescripcion: "Acceso general al evento",
  
  // Wallet
  googleWalletUrl: "https://pay.google.com/...",
  appleWalletUrl: "https://api.gradanegra.com/wallet/...",
  
  // Uso
  fechaUso: null,
  verificadorId: null,
  ubicacionUso: null,
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

**¿Necesitas alguna aclaración sobre el flujo de wallet integration o el diseño de los QR codes?**
