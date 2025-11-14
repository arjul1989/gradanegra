# Métodos de Pago en Colombia - Mercado Pago

## Descripción General

La aplicación Grada Negra ahora soporta **tres métodos de pago** disponibles en Colombia a través de Mercado Pago:

1. **Tarjetas de crédito y débito** (Visa, Mastercard, Diners, Amex, etc.)
2. **PSE** (Pagos Seguros en Línea - Transferencia bancaria)
3. **Efecty** (Pago en efectivo en puntos físicos)

---

## 1. Tarjeta de Crédito/Débito

### Cómo funciona
- El usuario ingresa los datos de su tarjeta directamente en el formulario
- Se genera un token seguro en el frontend usando el SDK de Mercado Pago
- El pago se procesa en tiempo real
- Los tickets se generan automáticamente al ser aprobado

### Flujo técnico
1. Frontend: `mp.createCardToken()` tokeniza los datos de la tarjeta
2. Backend: `paymentClient.create()` procesa el pago con el token
3. Respuesta inmediata: `approved`, `rejected`, o `pending`
4. Si es `approved`: se generan los tickets automáticamente

### Estados posibles
- **Aprobado**: Pago exitoso, tickets generados
- **Rechazado**: Tarjeta rechazada (fondos insuficientes, límite, etc.)
- **Pendiente**: Requiere verificación adicional

### Tarjetas de prueba (TEST)
```
Visa Aprobada:
- Número: 4013 5406 8274 6260
- CVV: 123
- Vencimiento: 11/25
- Nombre: APRO
- Documento: 1095799788

Mastercard Rechazada:
- Número: 5031 7557 3453 0604
- CVV: 123
- Vencimiento: 11/25
- Nombre: OTHE
- Documento: 12345678
```

---

## 2. PSE (Pagos Seguros en Línea)

### Cómo funciona
- El usuario selecciona su banco de una lista de ~40 bancos colombianos
- Es redirigido al portal del banco para autenticarse y autorizar el pago
- Después de completar el pago en el banco, regresa a Grada Negra
- El pago se confirma asincrónicamente vía webhook

### Flujo técnico
1. Frontend: El usuario selecciona PSE y su banco
2. Backend: Crea un pago con `payment_method_id: 'pse'` y `financial_institution_id`
3. Mercado Pago responde con `transaction_details.external_resource_url`
4. Frontend: Redirige al usuario a esa URL (portal del banco)
5. Usuario completa el pago en el banco
6. Banco notifica a Mercado Pago
7. Mercado Pago notifica al backend vía webhook
8. Backend genera los tickets

### Bancos disponibles (principales)
- Bancolombia
- Banco de Bogotá
- Davivienda
- Nequi
- DaviPlata
- Banco Popular
- BBVA
- Scotiabank Colpatria
- Y ~30 más...

### Estados del pago
- **Pendiente**: Esperando que el usuario complete el pago en el banco
- **Aprobado**: El banco confirmó el pago
- **Rechazado**: El banco rechazó la transacción

### Callback URL
El backend configura:
```javascript
callback_url: `${window.location.origin}/pago/pse-retorno`
```

Este es donde el usuario regresa después de pagar en el banco.

---

## 3. Efecty (Pago en efectivo)

### Cómo funciona
- El sistema genera un comprobante con un código de referencia y código de barras
- El usuario tiene un tiempo limitado para acercarse a cualquier punto Efecty
- Presenta el código y paga en efectivo
- Efecty notifica a Mercado Pago cuando se recibe el pago
- El backend recibe la notificación vía webhook y genera los tickets

### Flujo técnico
1. Frontend: El usuario selecciona Efecty
2. Backend: Crea un pago con `payment_method_id: 'efecty'`
3. Mercado Pago responde con:
   - `transaction_details.external_resource_url`: URL del comprobante PDF
   - `barcode.content`: Código de barras
   - Fecha de vencimiento
4. Frontend: Muestra las instrucciones y el link para descargar el comprobante
5. Usuario va a Efecty y paga
6. Efecty notifica a Mercado Pago
7. Mercado Pago notifica al backend vía webhook
8. Backend genera los tickets

### Información del comprobante
- Referencia de pago
- Código de barras
- Monto a pagar
- Fecha de vencimiento (usualmente 3-7 días)

### Ventajas
- No requiere tarjeta ni cuenta bancaria
- Perfecto para usuarios no bancarizados
- Múltiples puntos de pago en todo Colombia

---

## Implementación Técnica

### Backend

#### Endpoint: `POST /api/payments/process`

**Para tarjetas:**
```json
{
  "compraId": "uuid",
  "eventoId": "event-id",
  "transaction_amount": 50000,
  "description": "Tickets para Evento X",
  "payer": {
    "email": "user@example.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "identification": {
      "type": "CC",
      "number": "1095799788"
    }
  },
  "paymentMethod": "card",
  "token": "card_token_from_mp_sdk",
  "installments": 1
}
```

**Para PSE:**
```json
{
  "compraId": "uuid",
  "eventoId": "event-id",
  "transaction_amount": 50000,
  "description": "Tickets para Evento X",
  "payer": {
    "email": "user@example.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "identification": {
      "type": "CC",
      "number": "1095799788"
    },
    "entity_type": "individual"
  },
  "paymentMethod": "pse",
  "financialInstitution": "1007",
  "callbackUrl": "https://example.com/pago/pse-retorno"
}
```

**Para Efecty:**
```json
{
  "compraId": "uuid",
  "eventoId": "event-id",
  "transaction_amount": 50000,
  "description": "Tickets para Evento X",
  "payer": {
    "email": "user@example.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "identification": {
      "type": "CC",
      "number": "1095799788"
    }
  },
  "paymentMethod": "efecty"
}
```

#### Endpoint: `GET /api/payments/methods`

Devuelve todos los métodos de pago disponibles, incluyendo:
- Tarjetas (crédito, débito, prepago)
- PSE con lista de ~40 bancos
- Efecty

**Respuesta:**
```json
{
  "success": true,
  "methods": [
    {
      "id": "visa",
      "name": "Visa",
      "paymentType": "credit_card",
      "status": "active",
      "minAmount": 1000,
      "maxAmount": 50000000,
      "thumbnail": "https://...",
      "financialInstitutions": []
    },
    {
      "id": "pse",
      "name": "PSE",
      "paymentType": "bank_transfer",
      "status": "active",
      "minAmount": 1600,
      "maxAmount": 340000000,
      "thumbnail": "https://...",
      "financialInstitutions": [
        {"id": "1007", "description": "Bancolombia"},
        {"id": "1001", "description": "Banco de Bogotá"},
        ...
      ]
    },
    {
      "id": "efecty",
      "name": "Efecty",
      "paymentType": "ticket",
      "status": "active",
      "minAmount": 5000,
      "maxAmount": 8000000,
      "thumbnail": "https://...",
      "financialInstitutions": []
    }
  ]
}
```

### Frontend

#### Selector de método de pago
```tsx
const [paymentMethod, setPaymentMethod] = useState<'card' | 'pse' | 'efecty'>('card');
```

#### Flujo de tarjeta
```typescript
// 1. Tokenizar
const cardToken = await mp.createCardToken({
  cardNumber: cardData.cardNumber,
  cardholderName: cardData.cardholderName,
  cardExpirationMonth: cardData.expirationMonth,
  cardExpirationYear: cardData.expirationYear,
  securityCode: cardData.securityCode,
  identificationType: cardData.identificationType,
  identificationNumber: cardData.identificationNumber
});

// 2. Enviar al backend
const response = await fetch('/api/payments/process', {
  method: 'POST',
  body: JSON.stringify({
    ...paymentData,
    token: cardToken.id,
    paymentMethod: 'card'
  })
});
```

#### Flujo de PSE
```typescript
// 1. Enviar al backend
const response = await fetch('/api/payments/process', {
  method: 'POST',
  body: JSON.stringify({
    ...paymentData,
    paymentMethod: 'pse',
    financialInstitution: selectedPseBank,
    callbackUrl: `${window.location.origin}/pago/pse-retorno`
  })
});

// 2. Redirigir al banco
const result = await response.json();
if (result.redirectUrl) {
  window.location.href = result.redirectUrl;
}
```

#### Flujo de Efecty
```typescript
// 1. Enviar al backend
const response = await fetch('/api/payments/process', {
  method: 'POST',
  body: JSON.stringify({
    ...paymentData,
    paymentMethod: 'efecty'
  })
});

// 2. Mostrar instrucciones
const result = await response.json();
setPaymentInstructions({
  type: 'efecty',
  ticketUrl: result.ticketUrl,
  barcode: result.instructions.barcode,
  referenceId: result.instructions.reference,
  expirationDate: result.instructions.expirationDate
});
```

---

## Webhooks

### Endpoint: `POST /api/payments/webhook`

Mercado Pago notifica cuando el estado de un pago cambia (especialmente importante para PSE y Efecty).

**Tipos de notificación:**
- `payment`: Cambio en el estado de un pago
- `merchant_order`: Cambio en una orden

**Flujo:**
1. Mercado Pago envía POST con `{ id: "payment_id", topic: "payment" }`
2. Backend consulta el pago actualizado: `GET /v1/payments/{id}`
3. Si el pago es `approved` y no se han generado tickets, los genera
4. Actualiza el estado de la compra en Firestore

---

## Montos y Limitaciones

| Método | Monto Mínimo | Monto Máximo |
|--------|--------------|--------------|
| Tarjeta de crédito | $1,000 COP | $50,000,000 COP |
| Tarjeta de débito | $1,000 COP | $50,000,000 COP |
| PSE | $1,600 COP | $340,000,000 COP |
| Efecty | $5,000 COP | $8,000,000 COP |

---

## Consideraciones de Seguridad

### Tarjetas
- **Nunca** se envían los datos de la tarjeta al backend
- Se usa tokenización del lado del cliente (SDK de Mercado Pago)
- El token es de un solo uso
- PCI-DSS compliance garantizado por Mercado Pago

### PSE
- Autenticación en el portal del banco (2FA, OTP, etc.)
- Certificado SSL en toda la comunicación
- Callback firmado por Mercado Pago

### Efecty
- Código de referencia único
- Fecha de vencimiento
- Solo puede pagarse una vez

---

## Testing

### Ambiente TEST

**Variables de entorno:**
```bash
MP_PUBLIC_KEY_TEST=TEST-50bc2b0a-1d2e-4ec8-b8a2-fbf253d816fb
MP_ACCESS_TOKEN_TEST=TEST-3273184217457598-111121-5...
NODE_ENV=development
```

### Tarjetas de prueba
Ver sección "Tarjeta de Crédito/Débito" arriba.

### PSE (TEST)
En ambiente de prueba, PSE simula el flujo completo pero no interactúa con bancos reales. El redirect te lleva a una página simulada de Mercado Pago donde puedes aprobar o rechazar el pago.

### Efecty (TEST)
En ambiente de prueba, Efecty genera comprobantes simulados. Mercado Pago puede simular la notificación de pago recibido.

---

## Troubleshooting

### Error 401 en `/api/payments/methods`
- Verificar que `MP_ACCESS_TOKEN_TEST` esté configurado
- Verificar que el token sea válido (no vencido)

### PSE: No se redirige al banco
- Verificar que `transaction_details.external_resource_url` exista en la respuesta
- Verificar que el `callback_url` sea accesible públicamente (no `localhost`)

### Efecty: No se muestra el comprobante
- Verificar que `transaction_details.external_resource_url` exista
- Verificar que el monto esté entre $5,000 y $8,000,000 COP

### Tickets no se generan después del pago
- Verificar logs del webhook
- Verificar que el `notification_url` esté configurado y accesible
- Verificar que el pago esté en estado `approved`
- Verificar que `event.updateTierSoldCount()` no lance error

---

## Próximos Pasos

1. **Producción:**
   - Cambiar a credenciales de producción
   - Configurar dominio público para webhooks
   - Probar con transacciones reales pequeñas

2. **Mejoras:**
   - Página de seguimiento para pagos pendientes (PSE, Efecty)
   - Notificaciones por email cuando se confirma el pago
   - Dashboard de pagos pendientes para administradores

3. **Optimizaciones:**
   - Cache de métodos de pago disponibles
   - Retry automático de webhooks fallidos
   - Logs más detallados de transacciones

---

## Referencias

- [Mercado Pago API Docs](https://www.mercadopago.com.co/developers/es/docs)
- [Tarjetas de prueba](https://www.mercadopago.com.co/developers/es/docs/checkout-api/testing)
- [PSE Integration](https://www.mercadopago.com.co/developers/es/docs/checkout-api/payment-methods/pse)
- [Ticket Integration (Efecty)](https://www.mercadopago.com.co/developers/es/docs/checkout-api/payment-methods/cash)



