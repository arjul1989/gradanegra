# Certificados para Apple Wallet (.pkpass)

## Archivos Necesarios

Para generar archivos .pkpass de Apple Wallet, necesitas los siguientes archivos en este directorio:

### 1. Certificado de Firma (signerCert.pem)
- Archivo: `signerCert.pem`
- Descripción: Certificado de Pass Type ID de Apple Developer
- Cómo obtenerlo: https://developer.apple.com/account/resources/identifiers/list

### 2. Clave Privada (signerKey.pem)
- Archivo: `signerKey.pem`
- Descripción: Clave privada asociada al certificado
- Formato: PEM sin contraseña

### 3. Certificado WWDR (wwdr.pem)
- Archivo: `wwdr.pem`
- Descripción: Apple WorldWide Developer Relations Certificate
- Descargar desde: https://www.apple.com/certificateauthority/
- Archivo actual: WWDR G4 (válido hasta 2030)

---

## Cómo Generar los Certificados

### Paso 1: Crear Pass Type ID en Apple Developer

1. Ir a https://developer.apple.com/account/resources/identifiers/list
2. Click en "+" para crear nuevo identificador
3. Seleccionar "Pass Type IDs"
4. Crear con descripción: "Grada Negra Event Tickets"
5. Identificador: `pass.com.gradanegra.eventticket`

### Paso 2: Crear Certificado

1. En el Pass Type ID creado, click en "Create Certificate"
2. Seguir instrucciones para generar Certificate Signing Request (CSR)
3. Subir el CSR
4. Descargar el certificado (.cer)

### Paso 3: Convertir a PEM

```bash
# Convertir el certificado .cer a .pem
openssl x509 -inform der -in pass.cer -out signerCert.pem

# Exportar la clave privada desde Keychain Access:
# 1. Abrir "Keychain Access" en Mac
# 2. Buscar el certificado de Pass Type ID
# 3. Expandir y ver la clave privada asociada
# 4. Click derecho > Export > Guardar como .p12
# 5. NO poner contraseña (o usar una temporal)

# Convertir .p12 a .pem
openssl pkcs12 -in Certificates.p12 -out signerKey.pem -nodes -clcerts

# Si usaste contraseña, te la pedirá
```

### Paso 4: Descargar WWDR Certificate

```bash
# Descargar desde Apple
curl -O https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer

# Convertir a PEM
openssl x509 -inform der -in AppleWWDRCAG4.cer -out wwdr.pem
```

---

## Para Desarrollo/Testing

Si no tienes cuenta de Apple Developer ($99/año), puedes:

1. **Usar certificados de prueba**: Genera certificados self-signed (no funcionarán en dispositivos reales)
2. **Simulador**: Usar simulador de iOS para probar
3. **Postergar**: Implementar solo PDF por ahora, agregar .pkpass después

### Generar Certificados de Prueba (NO PRODUCCIÓN)

```bash
# ADVERTENCIA: Estos certificados NO funcionarán en dispositivos reales
# Solo para desarrollo y estructura del código

# Generar clave privada
openssl genrsa -out signerKey.pem 2048

# Generar certificado autofirmado
openssl req -new -x509 -key signerKey.pem -out signerCert.pem -days 365

# Descargar WWDR real
curl -o wwdr.pem https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer
openssl x509 -inform der -in AppleWWDRCAG4.cer -out wwdr.pem
```

---

## Estructura Final

```
backend/certificates/
├── README.md (este archivo)
├── signerCert.pem (Certificado de Pass Type ID)
├── signerKey.pem (Clave privada)
├── wwdr.pem (Apple WWDR Certificate)
└── .gitignore (NO subir certificados a Git)
```

---

## Seguridad

⚠️ **IMPORTANTE**: 
- NO subir certificados a Git
- NO compartir la clave privada
- Mantener los archivos seguros
- Usar variables de entorno en producción

---

## Variables de Entorno

En `.env`:

```bash
# Apple Wallet Configuration
APPLE_PASS_TYPE_ID=pass.com.gradanegra.eventticket
APPLE_TEAM_ID=TU_TEAM_ID_AQUI
APPLE_SIGNER_CERT_PATH=./certificates/signerCert.pem
APPLE_SIGNER_KEY_PATH=./certificates/signerKey.pem
APPLE_WWDR_CERT_PATH=./certificates/wwdr.pem
```

---

## Enlaces Útiles

- Apple Developer Portal: https://developer.apple.com
- Wallet Developer Guide: https://developer.apple.com/wallet/
- Pass Design Guidelines: https://developer.apple.com/design/human-interface-guidelines/wallet
- WWDR Certificates: https://www.apple.com/certificateauthority/
