# 🔐 Guía Rápida de Autenticación - Grada Negra

## ⚠️ SOLUCIÓN AL ERROR DE AUTENTICACIÓN

El error `(invalid_grant) Bad Request` típicamente ocurre cuando:
- El código de verificación expiró (tienen una vida de ~5 minutos)
- El código se copió incorrectamente
- La sesión del navegador tiene problemas

---

## ✅ MÉTODO 1: Autenticación con Navegador (RECOMENDADO)

### Paso 1: Abre una nueva terminal y ejecuta:

```bash
cd /Users/jules/MyApps/gradanegra
gcloud auth login
```

### Paso 2: 
Se abrirá automáticamente tu navegador. Si no se abre, copia el link que aparece en la terminal.

### Paso 3:
1. **Selecciona tu cuenta de Google** (la que tiene acceso a GCP)
2. **Acepta los permisos** que solicita Google Cloud SDK
3. **Cierra el navegador** cuando veas el mensaje "You are now authenticated"

### Paso 4: Verifica la autenticación
```bash
gcloud auth list
```

Deberías ver tu email con un asterisco (*) indicando que es la cuenta activa.

---

## 🔄 MÉTODO 2: Si el Método 1 no funciona

### Usar Application Default Credentials directamente:

```bash
gcloud auth application-default login
```

Este método es más simple y funciona bien para desarrollo local.

---

## 🆘 MÉTODO 3: Forzar Re-autenticación

Si ya tienes credenciales pero están dañadas:

```bash
# Revocar credenciales existentes
gcloud auth revoke --all

# Re-autenticar
gcloud auth login
```

---

## 🧪 VERIFICAR QUE FUNCIONÓ

Después de autenticarte correctamente, ejecuta:

```bash
# Ver cuenta activa
gcloud auth list

# Ver configuración
gcloud config list

# Probar acceso
gcloud projects list
```

---

## 📝 NOTAS IMPORTANTES

### ¿Por qué falló el código?
Los códigos de OAuth tienen una ventana muy corta (3-5 minutos). Si demoras en copiar/pegar, expiran.

### Solución rápida:
1. **No uses** `--no-launch-browser` a menos que estés en un servidor remoto
2. Deja que gcloud abra el navegador automáticamente
3. Completa el proceso lo más rápido posible

### Si estás detrás de un proxy o firewall corporativo:
```bash
gcloud auth login --no-launch-browser --console-only
```

---

## 🚀 DESPUÉS DE AUTENTICARTE

### Configurar proyecto por defecto:

```bash
# Ver proyectos disponibles
gcloud projects list

# Configurar proyecto
gcloud config set project [PROJECT_ID]
```

### Si NO tienes proyectos, crear uno:

```bash
# Crear proyecto
gcloud projects create gradanegra-prod --name="Grada Negra Production"

# Configurarlo como default
gcloud config set project gradanegra-prod

# Verificar
gcloud config get-value project
```

---

## 💳 IMPORTANTE: Verificar Billing

Google Cloud requiere una cuenta de facturación activa para muchos servicios:

1. Ve a: https://console.cloud.google.com/billing
2. Asegúrate de tener una cuenta de facturación
3. Vincula tu proyecto a esa cuenta

O desde terminal:
```bash
# Ver cuentas de billing
gcloud billing accounts list

# Vincular proyecto a billing account
gcloud billing projects link gradanegra-prod \
    --billing-account=BILLING_ACCOUNT_ID
```

---

## ✅ CHECKLIST POST-AUTENTICACIÓN

- [ ] `gcloud auth list` muestra tu email
- [ ] `gcloud projects list` muestra tus proyectos
- [ ] `gcloud config list` muestra configuración válida
- [ ] Tienes un proyecto seleccionado
- [ ] El proyecto tiene billing habilitado

---

## 🔧 TROUBLESHOOTING ADICIONAL

### Error: "gcloud command not found"
```bash
source ~/.zshrc
# O reinicia la terminal
```

### Error: "You do not currently have an active account selected"
```bash
gcloud auth login
gcloud config set account tu-email@gmail.com
```

### Error: "API has not been used in project"
```bash
# Habilitar APIs necesarias
gcloud services enable cloudresourcemanager.googleapis.com
```

---

## 📞 ¿NECESITAS AYUDA?

Si sigues teniendo problemas:
1. Comparte el error exacto que recibes
2. Ejecuta: `gcloud info` y comparte la salida
3. Verifica que tengas permisos en Google Cloud Console

---

**Última actualización:** Noviembre 2025  
**Proyecto:** Grada Negra  
**Estado:** Esperando autenticación exitosa
