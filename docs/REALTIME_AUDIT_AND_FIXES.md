# Auditoría de Implementación Realtime y Plan de Correcciones

**Fecha:** 11 de diciembre de 2025  
**Estado:** Análisis completado, correcciones pendientes

---

## 1. Contexto del Flujo de Negocio

### Flujo de Check-in (QR)
```
[Usuario A]              [Validador]              [Supabase]
    |                         |                       |
    |-- Muestra QR ---------> |                       |
    |                         |-- Escanea QR -------> |
    |                         |                       |-- INSERT check_ins
    |                         |                       |
    | <-------------------- Realtime Event ---------- |
    |-- Ve confirmación       |                       |
```

**Punto clave:** El usuario NO puede saber si el check-in fue exitoso hasta que Realtime le notifique. No hay forma de "optimismo" porque la acción la ejecuta otro dispositivo.

---

## 2. Arquitectura Actual

### Componentes Principales
| Componente | Ubicación | Responsabilidad |
|------------|-----------|-----------------|
| `RealtimeManager` | `src/lib/realtime/RealtimeManager.ts` | Suscripciones unificadas a 4 tablas |
| `ConnectionHealthMonitor` | `src/lib/realtime/ConnectionHealthMonitor.ts` | Heartbeat y reconexión automática |
| `RealtimeInitializer` | `src/components/providers/RealtimeInitializer.tsx` | Sincronización inicial + suscripción |
| Indicador "En vivo" | `src/components/client/views/HomeView.tsx` | Feedback visual de conexión |

### Tablas Suscritas
- `user_spins` - Giros de ruleta
- `check_ins` - Registros de visitas (⚠️ sin filtro de usuario)
- `streaks` - Rachas del usuario
- `user_coupons` - Cupones/premios ganados

### Parámetros de Conexión
- **Heartbeat:** 30 segundos
- **Timeout:** 90 segundos
- **Health check:** 15 segundos
- **Reconexión:** Exponential backoff (1s → 2s → 4s → 8s → 16s → 30s max)

---

## 3. Hallazgos de la Auditoría

### 🔴 Problema 1: Suscripción `check_ins` sin filtro de usuario (CRÍTICO)

**Ubicación:** `RealtimeManager.ts` línea ~205

**Situación actual:**
```typescript
.on('postgres_changes', { 
  event: 'INSERT', 
  schema: 'public', 
  table: 'check_ins' 
  // ⚠️ Falta: filter: `user_id=eq.${userId}`
}, this.handleCheckInInsert.bind(this))
```

**Impacto:**
- El cliente recibe TODOS los check-ins de TODOS los usuarios
- El filtro se hace manualmente en `handleCheckInInsert()`, lo cual funciona pero:
  - Genera tráfico innecesario de red
  - Aumenta carga en el cliente
  - Potencial fuga de información (el cliente recibe IDs de otros usuarios)

**Corrección requerida:**
```typescript
.on('postgres_changes', { 
  event: 'INSERT', 
  schema: 'public', 
  table: 'check_ins',
  filter: `user_id=eq.${userId}`  // ← Agregar
}, this.handleCheckInInsert.bind(this))
```

---

### 🟡 Problema 2: Pull-to-refresh no recarga datos de Redux

**Ubicación:** `AppShell.tsx` función `handleRefresh`

**Situación actual:**
```typescript
const handleRefresh = async () => {
  if (user?.id) {
    await queryClient.invalidateQueries({ queryKey: ['companyInfo'] });
    await queryClient.invalidateQueries({ queryKey: ['spinAvailability'] });
  }
  return true;
};
```

**Impacto:**
- Si Realtime falla mientras el usuario tiene la app abierta, hacer pull-to-refresh NO recupera los datos
- Los check-ins perdidos no se recuperan hasta cerrar y abrir la app

**Corrección requerida:**
```typescript
const handleRefresh = async () => {
  if (user?.id) {
    // React Query
    await queryClient.invalidateQueries({ queryKey: ['companyInfo'] });
    await queryClient.invalidateQueries({ queryKey: ['spinAvailability'] });
    
    // Redux - Recargar actividad reciente
    dispatch(loadRecentActivity(user.id));
  }
  return true;
};
```

---

### 🟡 Problema 3: Posible race condition en sincronización inicial

**Ubicación:** `RealtimeInitializer.tsx`

**Situación actual:**
1. Se llama `loadRecentActivity()` para cargar datos iniciales
2. Se llama `initializeRealtime()` para suscribirse
3. Si llega un evento entre paso 1 y 2, podría perderse

**Impacto:** Bajo, pero posible pérdida de eventos en ventana de ~100-500ms

**Corrección requerida:**
Invertir el orden: primero suscribirse, luego cargar datos iniciales.

---

### 🟢 Problema 4: Sin fallback cuando Realtime está caído

**Situación actual:**
Si la conexión Realtime falla y el `ConnectionHealthMonitor` no puede reconectar, el usuario no recibe notificación de su check-in hasta que reconecte o haga pull-to-refresh.

**Consideraciones:**
- El indicador "En vivo" ya notifica al usuario si está desconectado (solo aparece cuando `isConnected = true`)
- Sin embargo, podría ser útil mostrar un estado "Reconectando..." cuando hay problemas

**Mejora opcional:**
Agregar polling temporal (cada 10s) cuando Realtime está desconectado, solo para la tabla `check_ins`.

---

## 4. Plan de Correcciones

### Prioridad 1: Agregar filtro a suscripción `check_ins`
- **Archivo:** `src/lib/realtime/RealtimeManager.ts`
- **Esfuerzo:** 5 minutos
- **Impacto:** Alto (seguridad + rendimiento)
- **Riesgo:** Ninguno

### Prioridad 2: Mejorar pull-to-refresh
- **Archivo:** `src/components/client/AppShell.tsx`
- **Esfuerzo:** 10 minutos
- **Impacto:** Alto (recuperación de datos perdidos)
- **Riesgo:** Ninguno

### Prioridad 3: Corregir orden de inicialización
- **Archivo:** `src/components/providers/RealtimeInitializer.tsx`
- **Esfuerzo:** 10 minutos
- **Impacto:** Bajo (edge case)
- **Riesgo:** Bajo

### Prioridad 4 (Opcional): Fallback polling cuando desconectado
- **Archivos:** `ConnectionHealthMonitor.ts`, nuevo hook
- **Esfuerzo:** 30-60 minutos
- **Impacto:** Medio (robustez)
- **Riesgo:** Bajo (solo activo cuando Realtime falla)

---

## 5. Estado del Indicador "En Vivo"

✅ **Ya implementado correctamente**

**Ubicación:** `HomeView.tsx` líneas 117-122

```tsx
{isConnected && (
  <div className="ml-2 flex items-center gap-1 text-xs text-green-100 bg-green-500/20 px-2 py-1 rounded-full">
    <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></div>
    En vivo
  </div>
)}
```

**Comportamiento:**
- ✅ Aparece solo cuando hay conexión activa
- ✅ Punto verde con animación pulse
- ✅ Texto discreto "En vivo"
- ⚠️ Desaparece silenciosamente cuando se pierde conexión (podría mostrar estado "Reconectando...")

---

## 6. Descartado: UI Optimista para Check-ins

**Razón:** No aplica al flujo de negocio.

El usuario muestra su QR y OTRO usuario (validador) lo escanea. El usuario no tiene forma de saber cuándo ocurrirá el escaneo, por lo tanto:
- No puede mostrar "Check-in exitoso" antes de tiempo
- Debe esperar la notificación Realtime
- El feedback visual correcto es el que ya existe: notificación cuando llega el evento

---

## 7. Resumen Ejecutivo

| Hallazgo | Severidad | Estado | Esfuerzo |
|----------|-----------|--------|----------|
| Suscripción sin filtro user_id | 🔴 Crítico | Pendiente | 5 min |
| Pull-to-refresh incompleto | 🟡 Medio | Pendiente | 10 min |
| Race condition inicialización | 🟡 Bajo | Pendiente | 10 min |
| Fallback polling | 🟢 Opcional | No iniciado | 30-60 min |
| Indicador "En vivo" | ✅ OK | Implementado | - |
| UI Optimista | ❌ N/A | Descartado | - |

**Recomendación:** Implementar prioridades 1, 2 y 3 (25 minutos total) para una mejora significativa en seguridad y robustez.

---

*Documento generado como parte de la auditoría de implementación Realtime*
