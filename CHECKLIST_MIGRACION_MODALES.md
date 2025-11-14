# ✅ CHECKLIST DE MIGRACIÓN - Modales Personalizados

**Marca con ✅ cada archivo que completes**

---

## 📊 PROGRESO GENERAL

```
[█░░░░░░░░░] 8% Completado (1/11 archivos con confirm)
```

**Última actualización:** 10 Nov 2025

---

## 🔴 PRIORIDAD ALTA - Archivos con `confirm()` (Acciones críticas)

Estos archivos tienen confirmaciones de acciones importantes que NO deben usar diálogos nativos.

### Panel de Eventos
- [x] `app/panel/eventos/page.tsx` ✅ **COMPLETADO** (ejemplo de referencia)
- [ ] `app/panel/eventos/[id]/page.tsx` - 2 confirms + 6 alerts
- [ ] `app/panel/eventos/[id]/editar/page.tsx` - 1 confirm + 5 alerts
- [ ] `app/panel/eventos/[id]/gestionar-fechas/page.tsx` - 2 confirms + 16 alerts ⚠️ MUCHOS ALERTS
- [ ] `app/panel/eventos/[id]/verificar/page.tsx` - 1 confirm + 5 alerts
- [ ] `app/panel/eventos/crear/paso-4/page.tsx` - 1 confirm + 4 alerts

### Panel de Administración
- [ ] `app/panel/cupones/page.tsx` - 2 confirms + 11 alerts ⚠️ MUCHOS ALERTS
- [ ] `app/panel/equipo/page.tsx` - 2 confirms + 10 alerts ⚠️ MUCHOS ALERTS
- [ ] `app/panel/perfil/page.tsx` - 1 confirm + 4 alerts

### Panel de Admin Global
- [ ] `app/admin/comercios/[id]/page.tsx` - 1 confirm + 3 alerts

### Panel de Usuario
- [ ] `app/usuario/perfil/page.tsx` - 1 confirm + 1 alert

---

## 🟡 PRIORIDAD MEDIA - Archivos solo con `alert()` (Notificaciones)

Estos archivos solo tienen alerts/notificaciones, son más rápidos de migrar.

- [ ] `app/panel/configuracion/page.tsx` - 3 alerts
- [ ] `app/panel/estadisticas/page.tsx` - 1 alert
- [ ] `app/panel/eventos/crear/page.tsx` - 2 alerts
- [ ] `app/panel/eventos/crear/paso-2/page.tsx` - 2 alerts
- [ ] `app/panel/eventos/crear/paso-3/page.tsx` - 1 alert
- [ ] `app/panel/login/page.tsx` - 1 alert
- [ ] `app/usuario/boletos/page.tsx` - 4 alerts

---

## 📋 PROCESO POR ARCHIVO

Para cada archivo que migres, sigue estos pasos:

### 1. Preparación
- [ ] Abrir el archivo en el editor
- [ ] Ejecutar `./find-native-dialogs.sh` para ver líneas exactas
- [ ] Leer el código para entender el contexto

### 2. Implementación
- [ ] Agregar: `import { useDialog } from '@/contexts/DialogContext'`
- [ ] Agregar en el componente: `const { confirm, showSuccess, showError } = useDialog()`
- [ ] Buscar todos los `confirm(`
- [ ] Buscar todos los `alert(`
- [ ] Reemplazar cada uno según el tipo

### 3. Testing
- [ ] Abrir la página en el navegador
- [ ] Probar cada modal que reemplazaste
- [ ] Verificar en móvil (responsive)
- [ ] Probar con teclado (Escape)
- [ ] Verificar que los mensajes sean claros

### 4. Finalización
- [ ] Commit: `refactor: replace native dialogs with custom modals in [archivo]`
- [ ] Marcar como completado en este checklist
- [ ] Actualizar el progreso general arriba

---

## 🎯 PATRONES DE REEMPLAZO RÁPIDO

### Patrón 1: confirm() simple

```typescript
// ANTES
if (!confirm('¿Estás seguro?')) return

// DESPUÉS
if (!await confirm({
  title: 'Confirmar',
  message: '¿Estás seguro?',
  icon: 'warning'
})) return
```

### Patrón 2: confirm() con información

```typescript
// ANTES
if (!confirm(`¿Eliminar ${nombre}?`)) return

// DESPUÉS
if (!await confirm({
  title: '¿Eliminar?',
  message: `¿Eliminar ${nombre}?\n\nEsta acción no se puede deshacer.`,
  icon: 'danger',
  confirmText: 'Eliminar',
  cancelText: 'Cancelar'
})) return
```

### Patrón 3: alert() de éxito

```typescript
// ANTES
alert('Operación exitosa')

// DESPUÉS
await showSuccess('Operación exitosa')
```

### Patrón 4: alert() de error

```typescript
// ANTES
alert('Error: ' + error.message)

// DESPUÉS
await showError('No se pudo completar la operación')
```

### Patrón 5: alert() con try-catch

```typescript
// ANTES
try {
  await doSomething()
  alert('Éxito')
} catch (error) {
  alert('Error')
}

// DESPUÉS
try {
  await doSomething()
  await showSuccess('Éxito')
} catch (error) {
  await showError('Error')
}
```

---

## 📊 ESTADÍSTICAS DE MIGRACIÓN

### Al inicio:
- **Total de archivos:** 18
- **Total de confirms:** 15
- **Total de alerts:** 83
- **Total de usos:** 98

### Progreso actual:
- **Archivos completados:** 1 ✅
- **Archivos pendientes:** 17 ⏳
- **Confirms reemplazados:** 1/15 (6.7%)
- **Alerts reemplazados:** ~2/83 (2.4%)
- **Progreso total:** ~8%

### Cuando termines:
- **Archivos completados:** 18 ✅
- **Confirms reemplazados:** 15/15 (100%)
- **Alerts reemplazados:** 83/83 (100%)
- **Progreso total:** 100% 🎉

---

## 🏆 HITOS

- [x] **Hito 1:** Sistema implementado ✅
- [x] **Hito 2:** Primer archivo migrado ✅
- [ ] **Hito 3:** 5 archivos migrados (27%)
- [ ] **Hito 4:** 10 archivos migrados (55%)
- [ ] **Hito 5:** 15 archivos migrados (83%)
- [ ] **Hito 6:** Migración completa 🎉

---

## 💡 TIPS PARA MIGRAR MÁS RÁPIDO

### 1. Empieza por los simples
Los archivos con menos usos (1-3) son más rápidos y te dan confianza.

### 2. Agrupa por contexto
Migra todos los archivos de una sección juntos (ej: todos los de eventos).

### 3. Usa snippets de código
Copia los patrones de arriba y solo cambia los textos.

### 4. Prueba en lote
Migra 2-3 archivos y prueba todos juntos.

### 5. Toma descansos
No intentes hacer todo de una vez, divide en sesiones.

---

## 🚨 COSAS A EVITAR

### ❌ NO hacer:
- No quitar el `await` de las llamadas a confirm/alert
- No mezclar alerts nativos con modales personalizados
- No olvidar importar `useDialog`
- No olvidar agregar `const { confirm, ... } = useDialog()` en el componente

### ✅ SÍ hacer:
- Siempre usar `await` con confirm() y alert()
- Elegir el ícono apropiado (danger, warning, info, success)
- Escribir mensajes claros y descriptivos
- Probar cada cambio antes de continuar

---

## 📞 ¿NECESITAS AYUDA?

Si te atascas en algún archivo:

1. **Revisa el ejemplo:** `app/panel/eventos/page.tsx`
2. **Consulta la guía:** `GUIA_MODALES_PERSONALIZADOS.md`
3. **Ejecuta el script:** `./find-native-dialogs.sh`
4. **Busca en la documentación:** Sección de troubleshooting

---

## 🎉 ¡CUANDO TERMINES!

Una vez que todos los archivos estén migrados:

1. Ejecuta `./find-native-dialogs.sh` para verificar
2. Haz un commit final: `refactor: complete migration to custom modals`
3. Celebra 🎉 - Has mejorado significativamente la UX de la app
4. Opcional: Elimina este checklist o márcalo como "COMPLETADO"

---

**Última actualización:** 10 de Noviembre, 2025  
**Por:** Jules + Claude  
**Estado:** Migración en progreso (8% completado)

---

## 📝 NOTAS PERSONALES

_Usa este espacio para notas mientras migras:_

```
Archivo migrado           | Fecha      | Tiempo | Notas
--------------------------|------------|--------|------------------
panel/eventos/page.tsx    | 10 Nov     | 15min  | Ejemplo completado
                          |            |        |
                          |            |        |
                          |            |        |
                          |            |        |
```

---

**TIP:** Imprime o ten este archivo abierto mientras trabajas para marcar tu progreso. ✅

