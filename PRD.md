# PRD - Sistema de Ticketing Multitenant "Grada Negra"

**Versión:** 1.0  
**Fecha:** Noviembre 2025  
**Estado:** Fase de Análisis

---

## 1. Visión del Producto

Sistema de ticketing white-label multitenant que permite a comercios asociados crear, gestionar y vender tickets para sus eventos de manera segura, con validación mediante hash criptográfico y entrega de boletas digitales vía email (PDF + Apple Wallet).

---

## 2. Objetivos del Negocio

- Proveer una plataforma SaaS para venta de tickets a múltiples comercios
- Garantizar seguridad anti-falsificación mediante hashing
- Facilitar la operación con roles diferenciados por comercio
- Generar ingresos por transacción o suscripción de comercios

---

## 3. Usuarios Objetivo

### 3.1 Administrador de Plataforma
- **Rol:** Gestión global del sistema
- **Necesidades:** Administrar comercios, monitorear sistema, configuración global

### 3.2 Comercios (Organizadores)
- **Administrador:** Gestión completa del comercio y eventos
- **Finanzas:** Acceso a reportes financieros y conciliación
- **Operaciones:** Validación de tickets, gestión operativa del evento

### 3.3 Compradores (End Users)
- **Anónimos:** Compra sin registro
- **Registrados:** Cuenta personal con historial de tickets

---

## 4. Funcionalidades Principales

### 4.1 Gestión de Comercios
- ✅ Crear/editar/desactivar comercios
- ✅ Asignar administrador inicial
- ✅ Configuración de marca (logo, colores)

### 4.2 Gestión de Usuarios por Comercio
- ✅ Máximo 3 roles: Administrador, Finanzas, Operaciones
- ✅ Permisos diferenciados por rol
- ✅ Invitación vía email

### 4.3 Gestión de Eventos
- ✅ Crear evento (nombre, descripción, fecha(s), ubicación)
- ✅ Configurar aforo máximo (hasta 1000 entradas por evento)
- ✅ Configurar hasta 10 tiers/tipos de entrada con precios diferentes
- ✅ Eventos gratuitos (precio = 0)
- ✅ Clonar eventos existentes
- ✅ Publicar/despublicar eventos

### 4.4 Venta de Tickets
- ✅ Integración con pasarela de pago
- ✅ Proceso de checkout simple
- ✅ Generación de hash único y seguro por ticket
- ✅ Límite de 1000 tickets por evento

### 4.5 Entrega de Tickets
- ✅ Envío automático de email al comprador
- ✅ Adjuntar PDF con información del ticket y QR
- ✅ Adjuntar archivo .pkpass (Apple Wallet)
- ✅ PKPASS personalizable: logo y color de fondo (5 opciones)

### 4.6 Validación de Tickets
- ✅ Escaneo de QR code
- ✅ Verificación de hash para autenticidad
- ✅ Registro de entrada (check-in)
- ✅ Prevención de uso duplicado

### 4.7 Cuenta de Comprador (Opcional)
- ✅ Registro opcional
- ✅ Visualizar historial de tickets
- ✅ Descargar tickets nuevamente
- ✅ Perfil personal

---

## 5. Requisitos No Funcionales

### 5.1 Seguridad
- Hash criptográfico único por ticket (SHA-256 o superior)
- Encriptación de datos sensibles
- Autenticación multifactor (2FA) para administradores
- Auditoría de acciones críticas

### 5.2 Escalabilidad
- Arquitectura multitenant
- Soporte para múltiples comercios simultáneos
- Base de datos escalable (Cloud SQL)
- CDN para assets estáticos

### 5.3 Performance
- Tiempo de carga < 2 segundos
- Generación de ticket < 5 segundos
- Envío de email < 30 segundos

### 5.4 Disponibilidad
- Uptime objetivo: 99.9%
- Backup diario automático
- Plan de disaster recovery

---

## 6. Stack Tecnológico (Propuesto)

### Backend
- **Framework:** Node.js + Express / Python + FastAPI
- **Base de datos:** Cloud SQL (PostgreSQL)
- **Autenticación:** Firebase Auth / Auth0
- **Storage:** Cloud Storage (PDFs, logos)

### Frontend
- **Framework:** React / Next.js / Vue.js
- **UI Library:** Material-UI / Tailwind CSS

### Infraestructura
- **Cloud Provider:** Google Cloud Platform
- **Serverless:** Cloud Functions / Cloud Run
- **CDN:** Cloud CDN

### Integraciones
- **Pagos:** Stripe / Mercado Pago / PayU
- **Email:** SendGrid / Mailgun
- **PKPASS:** Passkit.js / custom implementation
- **QR Code:** qrcode.js

---

## 7. Restricciones y Límites

| Recurso | Límite |
|---------|--------|
| Usuarios por comercio | 3 roles máximo |
| Tickets por evento | 1000 máximo |
| Tipos de entrada por evento | 10 tiers máximo |
| Eventos por comercio | Sin límite (considerar plan de pricing) |

---

## 8. Criterios de Éxito

- ✅ Primer comercio piloto operando en 3 meses
- ✅ 0% de falsificación de tickets
- ✅ 95% de satisfacción en validación de tickets
- ✅ Tiempo de checkout < 2 minutos

---

## 9. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Falsificación de tickets | Media | Alto | Hash criptográfico + validación en tiempo real |
| Sobreventa de tickets | Media | Alto | Control transaccional + locks en DB |
| Caída de pasarela de pago | Media | Alto | Respaldo con segunda pasarela |
| Pérdida de emails | Baja | Medio | Sistema de reenvío + descarga en cuenta |

---

## 10. Fases de Desarrollo

### Fase 1 (MVP - 3 meses)
- Gestión básica de comercios y eventos
- Venta de tickets con hash
- Generación de PDF + QR
- Validación básica
- Integración con 1 pasarela de pago

### Fase 2 (4-6 meses)
- Generación de PKPASS
- Cuenta de comprador
- Dashboard de finanzas
- Clonación de eventos
- Reportes básicos

### Fase 3 (7-9 meses)
- Analytics avanzado
- Múltiples pasarelas
- API pública para integraciones
- App móvil de validación

---

## 11. Preguntas Pendientes

1. ¿Modelo de pricing para comercios? (% por transacción, suscripción mensual, híbrido)
2. ¿Límite de eventos activos por comercio?
3. ¿Soporte para eventos recurrentes (series)?
4. ¿Devoluciones y reembolsos?
5. ¿Transferencia de tickets entre usuarios?
6. ¿Soporte multi-idioma?
7. ¿Integración con CRM/marketing tools?

---

**Próximos Pasos:**
1. Validar PRD con stakeholders
2. Crear User Story Map detallado
3. Definir arquitectura técnica
4. Estimar esfuerzos por feature
5. Crear backlog priorizado
