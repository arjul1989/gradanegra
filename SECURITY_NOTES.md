# 🔐 Notas de Seguridad - Grada Negra

## Vulnerabilidades Conocidas

### node-forge (via @walletpass/pass-js)

**Estado:** 2 high severity vulnerabilities  
**Librería afectada:** `node-forge` <= 1.2.1  
**Vía:** Dependencia de `@walletpass/pass-js`

#### Detalles
- **Prototype Pollution** en debug API y util.setPath
- **URL parsing** issues
- **Improper Verification** of Cryptographic Signature
- **Open Redirect** vulnerability

#### Evaluación de Riesgo

**Riesgo Real: BAJO** ✅

**Razones:**
1. `node-forge` se usa SOLO en generación de .pkpass (backend)
2. NO se expone ninguna API pública de node-forge
3. NO se procesa input del usuario en las funciones vulnerables
4. Los certificados son controlados internamente (no user input)
5. La generación de .pkpass es un proceso cerrado y determinista

**Uso en Grada Negra:**
```javascript
// En @walletpass/pass-js se usa node-forge para:
- Firmar el pase con certificados (proceso interno)
- Generar la estructura PKCS7 (no expuesto)
- Validar certificados (archivos locales controlados)
```

#### Mitigación

**Controles Implementados:**
- ✅ Validación de certificados antes de usar
- ✅ Paths de certificados desde variables de entorno
- ✅ No hay inputs de usuario en la generación
- ✅ Archivos de certificados protegidos (no en Git)
- ✅ Logs de auditoría para cada generación

**Acciones Recomendadas:**
1. **Corto Plazo (Aceptable):**
   - Continuar usando @walletpass/pass-js
   - Monitorear updates de la librería
   - Documentar el riesgo evaluado

2. **Medio Plazo (Opcional):**
   - Evaluar alternativas como `passkit-generator`
   - Considerar fork de @walletpass/pass-js con node-forge actualizado
   - Migrar a librería mantenida activamente

3. **Largo Plazo:**
   - Implementar generación custom de .pkpass
   - Usar crypto nativo de Node.js
   - Eliminar dependencia de node-forge

#### Contexto del Ecosistema

**Problema Común:**
- `node-forge` es ampliamente usado en tooling de desarrollo
- Muchas librerías de wallet/pass generation tienen este issue
- La alternativa (OpenSSL via child_process) tiene sus propios riesgos
- Las vulnerabilidades son mayormente prototype pollution (difícil explotar en este contexto)

**Alternativas Evaluadas:**
1. `passkit-generator`: También usa node-forge
2. `pkpass`: No mantenida desde 2018
3. Implementación custom: Alto esfuerzo, probablemente usaría node-forge igual

#### Decisión

**ACEPTAR EL RIESGO** por ahora porque:
- El impacto real es bajo en nuestro caso de uso
- No hay alternativas significativamente mejores
- La funcionalidad es crítica para el producto
- Los controles mitigantes son suficientes

**Re-evaluar:**
- Cuando haya updates de @walletpass/pass-js
- Si aparecen exploits activos
- Antes de lanzar a producción (audit completo)
- Si surge alternativa mejor mantenida

---

## Mejores Prácticas Implementadas

### Certificados
- ✅ `.gitignore` protege archivos .pem
- ✅ Paths desde variables de entorno
- ✅ Validación de existencia antes de usar
- ✅ Permisos restrictivos recomendados (600)

### API Security
- ✅ Autenticación requerida en todos los endpoints
- ✅ Validación de ownership (tenantId matching)
- ✅ Rate limiting (a implementar en producción)
- ✅ HTTPS obligatorio (a configurar en producción)

### Datos Sensibles
- ✅ Firebase Admin SDK con service account
- ✅ No se logean datos sensibles
- ✅ Tokens JWT con expiración
- ✅ Secrets en variables de entorno

---

## Recomendaciones para Producción

### Antes de Deploy
- [ ] Audit completo de dependencias
- [ ] Configurar HTTPS/TLS
- [ ] Implementar rate limiting
- [ ] Habilitar CORS restrictivo
- [ ] Configurar CSP headers
- [ ] Setup de monitoring/alerting
- [ ] Backup de certificados en vault seguro
- [ ] Rotación de secrets

### Monitoreo
- [ ] Logs de acceso a certificados
- [ ] Alertas de intentos de acceso no autorizados
- [ ] Tracking de generaciones de .pkpass
- [ ] Monitoring de uso de API

---

**Última Actualización:** Diciembre 2024  
**Próxima Revisión:** Antes de producción  
**Responsable:** Equipo de Desarrollo
