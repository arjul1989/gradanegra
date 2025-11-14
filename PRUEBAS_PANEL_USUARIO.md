# 🧪 PRUEBAS MANUALES - Panel de Usuario Grada Negra

**Fecha:** 7 de Noviembre, 2025  
**Versión:** 1.0 - Fase 1 MVP  
**Tester:** [Tu nombre]

---

## ✅ CHECKLIST DE FUNCIONALIDADES

### **1. AUTENTICACIÓN Y ACCESO**

#### Login
- [ ] Usuario puede hacer login con Google
- [ ] Usuario ve su nombre y avatar en el navbar después de login
- [ ] Si no está autenticado, se redirige a /login
- [ ] Después del login, puede acceder a las páginas protegidas

**URLs a probar:**
- http://localhost:3000/login
- http://localhost:3000/usuario/perfil (debe redirigir si no está autenticado)

---

### **2. MI PERFIL** (`/usuario/perfil`)

#### Tab 1: Información Personal
- [ ] Se muestra el avatar del usuario (de Google o generado)
- [ ] Se muestra nombre y email
- [ ] Campos editables:
  - [ ] Nombre completo
  - [ ] Teléfono
  - [ ] Cédula
  - [ ] Fecha de nacimiento
  - [ ] Género (select con 4 opciones)
  - [ ] Ciudad
  - [ ] País (default: Colombia)
- [ ] Email es solo lectura con ícono de candado
- [ ] Botón "Guardar Cambios" funciona
- [ ] Botón "Cancelar" resetea los cambios
- [ ] Mensaje de éxito aparece después de guardar
- [ ] Los datos se persisten en Firestore

#### Tab 2: Preferencias
- [ ] Toggle "Notificaciones por Email" funciona
- [ ] Toggle "Notificaciones por SMS" funciona
- [ ] Los cambios se guardan correctamente
- [ ] Estado de los toggles se mantiene después de recargar

#### Tab 3: Seguridad
- [ ] Se muestra la fecha de creación de cuenta
- [ ] Se muestra la última actualización
- [ ] Botón "Eliminar mi cuenta" muestra confirmación
- [ ] Responsive en mobile/tablet/desktop

**URLs:**
- http://localhost:3000/usuario/perfil

**Pruebas de API:**
```bash
# GET perfil (en terminal)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/users/YOUR_UID

# PUT actualizar perfil
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Test User","ciudad":"Bogotá"}' \
  http://localhost:8080/api/users/YOUR_UID
```

---

### **3. MIS BOLETOS** (`/usuario/boletos`)

#### Vista Principal
- [ ] Se muestran todos los boletos del usuario
- [ ] Grid responsive: 1 columna (mobile), 2 (tablet), 3 (desktop)
- [ ] Cada card muestra:
  - [ ] Imagen del evento
  - [ ] Badge de estado (Válido/Usado/Cancelado/Próximo)
  - [ ] Nombre del evento
  - [ ] Fecha y hora
  - [ ] Ubicación y ciudad
  - [ ] Tier del boleto
  - [ ] Número de boleto (font monospace)

#### Filtros
- [ ] Filtro "Próximos" muestra solo eventos futuros
- [ ] Filtro "Pasados" muestra solo eventos pasados
- [ ] Filtro "Usados" muestra boletos con status='usado'
- [ ] Filtro "Cancelados" muestra boletos cancelados
- [ ] Select de ciudad funciona correctamente
- [ ] Búsqueda por nombre de evento funciona
- [ ] Los filtros se pueden combinar

#### Acciones en Cards
- [ ] Botón "Ver QR" abre el modal
- [ ] Botón "PDF" descarga el PDF del boleto
- [ ] Botón reenviar email funciona
- [ ] Boletos usados/cancelados tienen opacidad reducida
- [ ] Boletos próximos (24h) tienen badge amarillo

**URLs:**
- http://localhost:3000/usuario/boletos
- http://localhost:3000/usuario/boletos?status=proximos
- http://localhost:3000/usuario/boletos?ciudad=Bogotá

**Pruebas de API:**
```bash
# GET boletos del usuario
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/boletos/user/YOUR_UID

# GET boletos filtrados
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8080/api/boletos/user/YOUR_UID?status=proximos&ciudad=Bogotá"

# GET ciudades disponibles
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/boletos/user/YOUR_UID/ciudades
```

---

### **4. MODAL DETALLE DE BOLETO**

#### Contenido del Modal
- [ ] Se abre al hacer click en "Ver QR"
- [ ] Muestra QR code de 300x300px
- [ ] QR está centrado con fondo blanco
- [ ] Muestra número de boleto debajo del QR
- [ ] Muestra información del evento:
  - [ ] Nombre del evento
  - [ ] Fecha (con ícono de calendario)
  - [ ] Hora de inicio y fin (con ícono de reloj)
  - [ ] Ubicación completa (con ícono de lugar)
- [ ] Muestra detalles del boleto:
  - [ ] Tier
  - [ ] Precio
  - [ ] Método de pago
  - [ ] Fecha de compra

#### Acciones
- [ ] Botón "Descargar PDF" genera y descarga PDF
- [ ] Botón "Google Wallet" muestra mensaje (placeholder)
- [ ] Botón "Apple Wallet" muestra mensaje (placeholder)
- [ ] Botón cerrar (X) cierra el modal
- [ ] Click fuera del modal lo cierra

#### Generación de QR
- [ ] Si el boleto no tiene QR, muestra botón "Generar QR Code"
- [ ] Al generar QR, se actualiza automáticamente
- [ ] QR se guarda en Firestore
- [ ] Siguiente vez que se abre, muestra el QR generado

**Pruebas de API:**
```bash
# GET detalle de boleto
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/boletos/BOLETO_ID

# POST generar QR
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/boletos/BOLETO_ID/generar-qr

# POST reenviar email
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  http://localhost:8080/api/boletos/BOLETO_ID/reenviar
```

---

### **5. GENERACIÓN DE PDF**

#### Diseño del PDF
- [ ] PDF se descarga automáticamente
- [ ] Nombre del archivo: `grada-negra-GN-001234.pdf`
- [ ] Header con logo y "Boleto Digital"
- [ ] QR code está incluido (si existe)
- [ ] Sección de EVENTO:
  - [ ] Nombre del evento
  - [ ] Fecha formateada en español
  - [ ] Hora del evento
- [ ] Sección de UBICACIÓN:
  - [ ] Nombre del lugar
  - [ ] Ciudad
- [ ] Sección de DETALLES:
  - [ ] Tier
  - [ ] Precio en COP
  - [ ] Nombre del comprador
- [ ] Sección IMPORTANTE con 3 puntos
- [ ] Footer con copyright y website

#### Calidad
- [ ] PDF es tamaño A4
- [ ] Texto es legible
- [ ] QR code es escaneable (si está incluido)
- [ ] Colores son correctos (azul primary, grises)
- [ ] Layout es profesional

---

### **6. HISTORIAL DE COMPRAS** (`/usuario/compras`)

#### Vista Principal
- [ ] Se muestran 3 cards de estadísticas:
  - [ ] Total Compras
  - [ ] Total Gastado
  - [ ] Promedio por Compra
- [ ] Tabla/Cards de compras muestra:
  - [ ] Fecha de compra
  - [ ] Nombre del evento
  - [ ] Cantidad de boletos
  - [ ] Total pagado
  - [ ] Método de pago (con ícono)
  - [ ] Badge de estado (Completada/Pendiente/Cancelada)
  - [ ] Botón "Ver Boletos"

#### Filtros
- [ ] Filtro "Desde" (date picker) funciona
- [ ] Filtro "Hasta" (date picker) funciona
- [ ] Filtros de estado:
  - [ ] Todas
  - [ ] Completadas
  - [ ] Pendientes
  - [ ] Canceladas
- [ ] Botón "Limpiar Filtros" resetea todo
- [ ] Los filtros se pueden combinar

#### Responsive
- [ ] Desktop: Tabla completa
- [ ] Mobile: Cards apiladas con info condensada
- [ ] Tablet: Layout intermedio

**URLs:**
- http://localhost:3000/usuario/compras

**Pruebas de API:**
```bash
# GET historial de compras
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/compras/user/YOUR_UID

# GET compras filtradas
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8080/api/compras/user/YOUR_UID?status=completada"

# GET resumen estadístico
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/compras/user/YOUR_UID/resumen
```

---

## 🎨 PRUEBAS DE DISEÑO

### Responsive
- [ ] Mobile (< 768px): Layout vertical, botones full-width
- [ ] Tablet (768px-1024px): Grid 2 columnas
- [ ] Desktop (> 1024px): Grid 3 columnas
- [ ] Navbar se adapta en mobile
- [ ] Modal es responsive

### Dark Mode
- [ ] Todos los componentes funcionan en dark mode
- [ ] Colores son legibles en ambos modos
- [ ] Borders y shadows son apropiados

### Interacciones
- [ ] Hover states funcionan en desktop
- [ ] Transitions son suaves (300ms)
- [ ] Loading spinners aparecen cuando carga
- [ ] Error messages son claros y visibles

---

## 🔐 PRUEBAS DE SEGURIDAD

### Autenticación
- [ ] No se puede acceder sin login
- [ ] Token se valida en cada request
- [ ] Usuario solo ve sus propios datos
- [ ] Firebase Auth funciona correctamente

### Validaciones
- [ ] Campos requeridos tienen validación
- [ ] Formatos de fecha son correctos
- [ ] Email tiene formato válido
- [ ] No se pueden editar datos de otro usuario

---

## 🐛 BUGS CONOCIDOS

Registra aquí cualquier bug que encuentres:

1. **Bug:** [Descripción]
   - **Pasos para reproducir:**
   - **Comportamiento esperado:**
   - **Comportamiento actual:**
   - **Prioridad:** Alta/Media/Baja

---

## 📝 NOTAS DE TESTING

### Datos de Prueba Necesarios

Para probar completamente, necesitas:

1. **Usuario de prueba con:**
   - Perfil completo
   - Al menos 3 boletos (próximos, pasados, usados)
   - Al menos 2 compras completadas

2. **Eventos de prueba con:**
   - Diferentes ciudades
   - Fechas pasadas y futuras
   - Diferentes tiers

### Creación de Datos de Prueba

Si necesitas crear datos de prueba:

```javascript
// En Firestore Console, crear:

// 1. User
users/YOUR_UID {
  email: "test@example.com",
  displayName: "Test User",
  ciudad: "Bogotá",
  pais: "Colombia",
  createdAt: Timestamp.now()
}

// 2. Compra
compras/compra_001 {
  userId: "YOUR_UID",
  eventoId: "evento_001",
  total: 100000,
  status: "completada",
  metodoPago: "tarjeta",
  fechaCompra: Timestamp.now()
}

// 3. Boleto
boletos/boleto_001 {
  compraId: "compra_001",
  numeroBoleto: "GN-001234",
  precio: 50000,
  status: "vendido",
  eventoNombre: "Concierto Rock",
  eventoImagen: "https://...",
  eventoCiudad: "Bogotá",
  eventoUbicacion: "Movistar Arena",
  fechaEvento: "2025-12-15",
  horaInicio: "20:00",
  horaFin: "23:00",
  tierNombre: "General"
}
```

---

## ✅ RESUMEN DE RESULTADOS

**Fecha de prueba:** ___________  
**Funcionalidades probadas:** _____ / 100  
**Bugs encontrados:** _____  
**Bugs críticos:** _____  

**Estado general:** 
- [ ] ✅ Todo funciona correctamente
- [ ] ⚠️ Funciona con bugs menores
- [ ] ❌ Bugs críticos encontrados

**Comentarios adicionales:**
_________________________________
_________________________________
_________________________________

---

## 🚀 PRÓXIMOS PASOS

Después de completar estas pruebas:

1. Corregir bugs críticos
2. Implementar Fase 2 (Google Wallet, Apple Wallet)
3. Agregar sistema de notificaciones
4. Pruebas de carga y performance
5. Deploy a producción

---

**Documento generado por:** GitHub Copilot  
**Para:** Grada Negra - Panel de Usuario  
**Versión:** 1.0
