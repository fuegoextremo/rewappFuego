# 📡 Arquitectura de Realtime - Documentación Técnica

## 🔍 Investigación y Descubrimiento (Sept 8, 2025)

### Problema Inicial
- Usuario reportó que los cupones otorgados desde admin no se reflejaban en tiempo real en la SPA
- Se asumía que el RealtimeManager no estaba siendo inicializado en la SPA
- Los giros de ruleta SÍ funcionaban en tiempo real, lo que creó confusión

### 🕵️ Proceso de Investigación

#### 1. Primera Búsqueda (Fallida)
```bash
# Buscamos si RealtimeInitializer se usaba en la SPA
grep -r "RealtimeInitializer" src/app/client/
grep -r "useRealtimeManager" src/components/client/
# ❌ No encontramos referencias directas
```

#### 2. Verificación de AppShell y ClientProviders
```typescript
// ❌ AppShell.tsx - No tiene inicialización de realtime
// ❌ ClientProviders.tsx - Solo QueryClientProvider
```

#### 3. Verificación de RealtimeManager
```typescript
// ✅ RealtimeManager existe como Singleton
// ❌ Pero solo se configura/conecta en useRealtimeManager()
// ❌ Y useRealtimeManager() solo se usa en RealtimeInitializer
```

#### 4. **DESCUBRIMIENTO CLAVE** 🎯
```bash
# Buscamos más profundamente los Providers
grep -r "import.*Providers" src/
```

**Resultado:** Encontramos que existe **DOS archivos de providers diferentes:**
- `src/components/providers/ClientProviders.tsx` (usado en layout.tsx del cliente)
- `src/components/providers/Providers.tsx` (usado en layout.tsx global)

## 🏗️ Arquitectura Real del Sistema

### Estructura de Inicialización

```
src/app/layout.tsx (GLOBAL)
├── Providers.tsx
    ├── ReduxProvider + PersistGate
    ├── QueryClientProvider
    ├── RealtimeInitializer ⭐ (AQUÍ SE INICIALIZA)
    │   └── useRealtimeManager()
    │       ├── realtimeManager.configure(queryClient, dispatch)
    │       └── realtimeManager.connect(userId)
    └── ModalProvider
```

### ¿Por Qué Funciona?

1. **Layout Global**: `src/app/layout.tsx` envuelve TODA la aplicación
2. **Providers Global**: Incluye `RealtimeInitializer`
3. **Singleton Pattern**: RealtimeManager persiste entre componentes
4. **Redux Integration**: Una vez configurado, funciona en toda la app

### Archivos Clave

| Archivo | Propósito | ¿Se Usa? |
|---------|-----------|----------|
| `src/app/layout.tsx` | Layout global de la app | ✅ SÍ |
| `src/components/providers/Providers.tsx` | Providers globales con Realtime | ✅ SÍ |
| `src/app/client/layout.tsx` | Layout específico del cliente | ✅ SÍ |
| `src/components/providers/ClientProviders.tsx` | Providers solo del cliente | ✅ SÍ |
| `src/components/providers/RealtimeInitializer.tsx` | Inicializador de Realtime | ✅ SÍ (via Providers.tsx) |

## 🔄 Flujo de Realtime

### 1. Inicialización
```typescript
// src/app/layout.tsx
<Providers>
  <RealtimeInitializer>
    // useRealtimeManager() ejecuta aquí
  </RealtimeInitializer>
</Providers>
```

### 2. Configuración Automática
```typescript
// hooks/useRealtimeManager.ts
useEffect(() => {
  realtimeManager.configure(queryClient, dispatch)
  if (userId) {
    realtimeManager.connect(userId)
  }
}, [userId, queryClient, dispatch])
```

### 3. Eventos Escuchados
```typescript
// RealtimeManager.ts - Canal único por usuario
.on('postgres_changes', { table: 'user_spins' }, handleUserSpinsChange)
.on('postgres_changes', { table: 'check_ins' }, handleCheckinChange)  
.on('postgres_changes', { table: 'coupons' }, handleCouponChange) ⭐
```

### 4. Actualización de Redux
```typescript
// handleCouponChange en RealtimeManager
if (payload.event === 'INSERT') {
  if (!coupon.is_redeemed && !isExpired) {
    this.reduxDispatch(addActiveCoupon(coupon))
  } else {
    this.reduxDispatch(prependExpiredCoupon(coupon))
  }
}
```

## 🐛 Diagnóstico de Problemas

### ✅ Realtime FUNCIONA porque:
- RealtimeManager se inicializa globalmente
- Singleton persiste en toda la aplicación
- Redux se actualiza correctamente para user_spins
- Configuración correcta de Supabase Realtime

### ❓ Si cupones no aparecen, verificar:
1. **Supabase RLS**: ¿Tiene permisos la tabla `coupons`?
2. **Realtime habilitado**: ¿Está `coupons` en `supabase_realtime.subscription`?
3. **Eventos correctos**: ¿Se disparan INSERT/UPDATE en `coupons`?
4. **Redux actions**: ¿Están `addActiveCoupon`/`prependExpiredCoupon` funcionando?
5. **Console logs**: ¿Aparecen eventos de cupones en DevTools?

## 📝 Comandos de Debugging

### Verificar Realtime en DevTools
```javascript
// En la consola del navegador
console.log('RealtimeManager connected:', window.__realtimeManager?.isConnected())
console.log('Current user:', window.__realtimeManager?.getCurrentUserId())
```

### Verificar Redux State
```javascript
// Estado actual de cupones en Redux
console.log('Redux coupons:', store.getState().auth.activeCoupons)
```

### Verificar Supabase Realtime
```sql
-- En Supabase SQL Editor
SELECT * FROM supabase_realtime.subscription 
WHERE entity = 'coupons';
```

## 🎯 Conclusiones

1. **El sistema de Realtime SÍ funciona globalmente**
2. **Se inicializa en el layout global, no en el del cliente**
3. **El Singleton pattern permite que funcione en toda la app**
4. **Si algo no funciona, es específico de esa tabla/evento, no del sistema**

## 📅 Historial

- **Sept 8, 2025**: Documentación inicial después de investigación detallada
- **Commit relevante**: `ccd92d66cb2646d4ea4bc0a0ec3e9184d39894a8` - Implementación original del RealtimeManager Singleton

---

**Nota para futuros desarrolladores**: Siempre verificar que el Realtime se inicializa en `src/app/layout.tsx` y que el `RealtimeInitializer` esté incluido en los `Providers` globales.
