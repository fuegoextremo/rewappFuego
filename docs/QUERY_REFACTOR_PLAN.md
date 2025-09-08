# 🔄 PLAN DE REFACTORIZACIÓN - SISTEMA DE QUERIES

**Objetivo:** Organizar y estandarizar el sistema de React Query para mejorar mantenibilidad, performance y consistencia.

**Estado actual:** Múltiples formatos de queryKeys, invalidaciones redundantes, y falta de consistencia.

---

## 📊 **ANÁLISIS ACTUAL**

### 🏗️ **Arquitectura Híbrida existente:**
**✅ REALTIME activo para:** Spins de ruleta, stats de usuario, check-ins
**✅ REACT QUERY para:** Datos estáticos, listas, configuración
**✅ setQueryData:** Updates optimistas sin invalidación

### ❌ **Problemas identificados:**

1. **QueryKeys inconsistentes:**
   ```typescript
   // Diferentes formatos para datos similares:
   queryKey: ['user', userId]                    // Formato legacy
   queryKey: ['user', 'streak', userId]          // Formato intermedio  
   queryKey: queryKeys.user.profile(userId)      // Formato moderno ✅
   queryKey: ['user', userId, 'stats']           // Orden inconsistente
   ```

2. **Sobre-invalidación en RealtimeProvider:**
   ```typescript
   // 8+ invalidaciones por cada cambio (INNECESARIAS con Realtime):
   queryClient.invalidateQueries({ queryKey: ['user', 'streak', userId] })
   queryClient.invalidateQueries({ queryKey: ['streak', 'stage'] })
   queryClient.invalidateQueries({ queryKey: ['user', userId, 'stats'] })
   // ... 5 más
   ```

3. **Mezcla de paradigmas:**
   - ✅ Realtime + setQueryData (ÓPTIMO para datos dinámicos)
   - ❌ Realtime + invalidateQueries (REDUNDANTE)
   - ❌ Pull-to-refresh invalidando datos que ya son realtime
   - ❌ Queries similares en diferentes archivos

---

## 🎯 **OBJETIVOS DE LA REFACTORIZACIÓN**

### ✅ **Resultados esperados:**
- **Consistencia:** Un solo formato de queryKey para cada tipo de dato
- **Arquitectura Híbrida:** Realtime para datos dinámicos, React Query para estáticos
- **Performance:** Eliminar invalidaciones redundantes con Realtime
- **Mantenibilidad:** Separación clara entre datos Realtime vs Query
- **Type Safety:** TypeScript completo en queryKeys
- **Debugging:** Logs claros que distingan Realtime vs Query updates

### 🏗️ **Principios de la arquitectura híbrida:**

#### **🔴 REALTIME (sin invalidaciones):**
- ✅ **User stats** - Cambios frecuentes (spins, giros, check-ins)
- ✅ **Roulette spins** - Updates inmediatos post-spin
- ✅ **Available coupons** - Cambios al redimir/ganar
- ✅ **Streak data** - Updates tras check-in

#### **🔵 REACT QUERY (con invalidaciones):**
- ✅ **System settings** - Datos semi-estáticos
- ✅ **User profile** - Cambia raramente
- ✅ **Coupon history** - Lista histórica
- ✅ **Activity logs** - Datos de consulta

#### **🟡 HÍBRIDO (Realtime + Query):**
- ✅ **Check-ins** - Realtime para counters, Query para history
- ✅ **Prizes** - Realtime para disponibles, Query para catálogo

---

## 📋 **PLAN DE EJECUCIÓN**

### **FASE 1: Auditoría y Mapeo (1-2 horas)**

#### 1.1 **Inventario completo de queries existentes**
```bash
# Comando para ejecutar:
grep -r "queryKey" src/ --include="*.ts" --include="*.tsx" > query_inventory.txt
grep -r "useQuery" src/ --include="*.ts" --include="*.tsx" >> query_inventory.txt
grep -r "invalidateQueries" src/ --include="*.ts" --include="*.tsx" >> query_inventory.txt
```

#### 1.2 **Categorizar queries por tipo de dato:**

##### **🔴 REALTIME DATA (sin invalidaciones):**
- **User Stats:** Spins disponibles, puntos, level
- **Roulette:** Estado actual, último spin
- **Streaks:** Contador actual, progreso diario
- **Coupons:** Disponibles, recién ganados

##### **🔵 STATIC/CACHED DATA (con invalidaciones):**
- **System:** Settings, configuración, precios
- **User Profile:** Datos personales, preferencias
- **History:** Logs de actividad, cupones usados
- **Catalogs:** Lista de premios, categorías

##### **🟡 HYBRID DATA (Realtime + Query):**
- **Check-ins:** Contador (Realtime) + History (Query)
- **Notifications:** Nuevas (Realtime) + Archive (Query)

#### 1.3 **Mapear relaciones y dependencias**
- Qué queries se invalidan juntas
- Qué datos dependen de otros
- Patterns de actualización en tiempo real

---

### **FASE 2: Diseño del Sistema Unificado (1 hora)**

#### 2.1 **Definir estructura estándar de queryKeys**
```typescript
// Propuesta de estructura:
const queryKeys = {
  // User domain
  user: {
    all: ['user'] as const,
    lists: () => [...queryKeys.user.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.user.lists(), userId] as const,
    details: () => [...queryKeys.user.all, 'detail'] as const,
    detail: (userId: string) => [...queryKeys.user.details(), userId] as const,
    
    // Specific user data
    profile: (userId: string) => [...queryKeys.user.detail(userId), 'profile'] as const,
    stats: (userId: string) => [...queryKeys.user.detail(userId), 'stats'] as const,
    checkins: (userId: string) => [...queryKeys.user.detail(userId), 'checkins'] as const,
  },
  
  // Coupons domain
  coupons: {
    all: ['coupons'] as const,
    lists: () => [...queryKeys.coupons.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.coupons.lists(), userId] as const,
    available: (userId: string) => [...queryKeys.coupons.list(userId), 'available'] as const,
    used: (userId: string) => [...queryKeys.coupons.list(userId), 'used'] as const,
  },
  
  // Streaks domain
  streaks: {
    all: ['streaks'] as const,
    lists: () => [...queryKeys.streaks.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.streaks.lists(), userId] as const,
    current: (userId: string) => [...queryKeys.streaks.list(userId), 'current'] as const,
    stage: (userId: string, count?: number) => 
      [...queryKeys.streaks.list(userId), 'stage', count] as const,
    prizes: () => [...queryKeys.streaks.all, 'prizes'] as const,
  },
  
  // Roulette domain
  roulette: {
    all: ['roulette'] as const,
    lists: () => [...queryKeys.roulette.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.roulette.lists(), userId] as const,
    spins: (userId: string) => [...queryKeys.roulette.list(userId), 'spins'] as const,
    results: (userId: string) => [...queryKeys.roulette.list(userId), 'results'] as const,
  },
  
  // System domain
  system: {
    all: ['system'] as const,
    settings: () => [...queryKeys.system.all, 'settings'] as const,
    config: () => [...queryKeys.system.all, 'config'] as const,
  }
} as const
```

#### 2.2 **Definir strategies de actualización (Realtime vs Query)**

```typescript
// ===== REALTIME UPDATES (vía postgres_changes) =====
const realtimeUpdates = {
  onUserStatsChange: (userId: string, newData: any) => {
    // ✅ setQueryData directo (NO invalidation)
    queryClient.setQueryData(queryKeys.user.stats(userId), newData)
    
    // ✅ Update Redux granular
    dispatch(updateAvailableSpins(newData.available_spins))
  },
  
  onSpinComplete: (userId: string, spinResult: any) => {
    // ✅ setQueryData para múltiples queries relacionadas
    queryClient.setQueryData(queryKeys.user.stats(userId), (old) => ({
      ...old,
      available_spins: spinResult.remaining_spins
    }))
    queryClient.setQueryData(queryKeys.coupons.available(userId), spinResult.new_coupons)
  },
}

// ===== QUERY INVALIDATIONS (para datos estáticos) =====
const queryInvalidations = {
  // Solo para datos que NO son Realtime
  onProfileUpdate: (userId: string) => [
    queryKeys.user.profile(userId), // Datos personales cambian raramente
  ],
  
  onSystemSettingsChange: () => [
    queryKeys.system.settings(), // Configuración del sistema
    queryKeys.system.config(),
  ],
  
  // Pull-to-refresh: Solo datos no-Realtime
  onPullRefresh: (userId: string) => [
    queryKeys.user.profile(userId),     // Profile estático
    queryKeys.coupons.history(userId),  // History no cambia en tiempo real
    queryKeys.system.settings(),        // Settings del sistema
    // ❌ NO invalidar: user.stats, coupons.available, streaks.current
  ],
}

// ===== HYBRID STRATEGIES =====
const hybridStrategies = {
  onCheckIn: (userId: string) => {
    // Realtime: Counter actual
    queryClient.setQueryData(queryKeys.streaks.current(userId), newStreakData)
    
    // Query: History de check-ins (invalidar para refetch)
    queryClient.invalidateQueries({ queryKey: queryKeys.user.checkins(userId) })
  },
}
```

---

### **FASE 3: Migración Gradual (3-4 horas)**

#### 3.1 **Actualizar queryKeys centralizados**
**Archivo:** `src/lib/queryClient.ts`

```typescript
// Reemplazar queryKeys actual con nueva estructura
export const queryKeys = { /* nueva estructura */ }

// Agregar helper functions
export const createQueryKey = (domain: string, ...parts: (string | number)[]) => {
  return [domain, ...parts] as const
}

// Agregar invalidation helpers
export const invalidationHelpers = {
  invalidateUserData: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.user.detail(userId) })
  },
  
  invalidateUserCoupons: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.coupons.list(userId) })
  },
  
  // ... más helpers
}
```

#### 3.2 **Migrar queries por archivo (uno a la vez)**

**Orden sugerido:**
1. `useUserQueries.ts` - Más usado
2. `useCouponQueries.ts` - Muchas invalidaciones  
3. `useStreakQueries.ts` - Lógica compleja
4. Otros archivos menores

**Para cada archivo:**
```typescript
// Antes:
const { data } = useQuery({
  queryKey: ['user', userId, 'stats'],
  queryFn: () => fetchUserStats(userId)
})

// Después:
const { data } = useQuery({
  queryKey: queryKeys.user.stats(userId),
  queryFn: () => fetchUserStats(userId)
})
```

#### 3.3 **Limpiar RealtimeProvider (eliminar invalidaciones redundantes)**

```typescript
// ❌ ANTES: Sobre-invalidación con Realtime
const handleRealtimeUpdate = (payload) => {
  // Múltiples invalidaciones innecesarias
  queryClient.invalidateQueries({ queryKey: ['user', 'streak', userId] })
  queryClient.invalidateQueries({ queryKey: ['streak', 'stage'] })
  queryClient.invalidateQueries({ queryKey: ['user', userId, 'stats'] })
  queryClient.invalidateQueries({ queryKey: ['coupons', userId] })
  // ... 4 más invalidaciones
}

// ✅ DESPUÉS: setQueryData directo
const handleRealtimeUpdate = (payload) => {
  const { eventType, new: newData, old: oldData } = payload
  
  if (eventType === 'UPDATE' && newData.table === 'users') {
    // ✅ Update directo sin invalidación
    queryClient.setQueryData(
      queryKeys.user.stats(newData.id), 
      {
        available_spins: newData.available_spins,
        level: newData.level,
        total_check_ins: newData.total_check_ins,
        // Solo campos que cambian en Realtime
      }
    )
    
    // ✅ Redux granular (mantener compatibility)
    dispatch(updateAvailableSpins(newData.available_spins))
    
    console.log('🔴 Realtime update:', newData.id, 'spins:', newData.available_spins)
  }
  
  // ❌ NO más invalidaciones masivas
}
```

---

### **FASE 4: Optimización y Testing (2 horas)**

#### 4.1 **Optimizar invalidaciones**
- Eliminar invalidaciones redundantes
- Implementar invalidación en cascada cuando sea necesario
- Usar `queryClient.setQueryData` para updates optimistas

#### 4.2 **Agregar logging y debugging**
```typescript
// Query debugging helper
export const queryDebugger = {
  logQuery: (queryKey: unknown[], action: 'fetch' | 'invalidate' | 'update') => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Query ${action}:`, queryKey)
    }
  }
}
```

#### 4.3 **Testing**
- Verificar que todas las queries funcionen
- Comprobar invalidaciones en Realtime
- Testear pull-to-refresh con nuevas invalidaciones
- Performance testing (Network tab)

---

### **FASE 5: Pull-to-Refresh Inteligente (30 min)**

#### 5.1 **Invalidar solo datos NO-Realtime**
```typescript
import { useQueryClient } from '@tanstack/react-query'
import { queryInvalidations } from '@/lib/queryClient'

const handleRefresh = useCallback(async () => {
  const queryClient = useQueryClient()
  
  if (!user?.id || isRefreshing) return
  
  dispatch(setRefreshing(true))
  
  try {
    console.log('🔄 Pull-to-refresh: Solo datos estáticos...')
    
    // ✅ SOLO invalidar datos que NO son Realtime
    const queriesToInvalidate = queryInvalidations.onPullRefresh(user.id)
    
    await Promise.all(
      queriesToInvalidate.map(queryKey => 
        queryClient.invalidateQueries({ queryKey })
      )
    )
    
    // ✅ Eventos personalizados (mantener compatibility)
    window.dispatchEvent(new CustomEvent('app-refresh'))
    
    // ❌ NO invalidar datos Realtime:
    // - user.stats (viene via Realtime)
    // - coupons.available (viene via Realtime)  
    // - streaks.current (viene via Realtime)
    
    console.log('✅ Pull-to-refresh: Solo', queriesToInvalidate.length, 'queries estáticas')
  } catch (error) {
    console.error('❌ Error en pull-to-refresh:', error)
  } finally {
    dispatch(setRefreshing(false))
    setPullDistance(0)
  }
}, [user?.id, isRefreshing, dispatch])
```

#### 5.2 **Logging para debugging de arquitectura híbrida**
```typescript
// Query debugging helper con categorización
export const queryDebugger = {
  logQuery: (queryKey: unknown[], action: 'fetch' | 'invalidate' | 'realtime-update') => {
    if (process.env.NODE_ENV === 'development') {
      const isRealtimeData = queryKey.includes('stats') || queryKey.includes('available')
      const category = isRealtimeData ? '🔴 REALTIME' : '🔵 QUERY'
      
      console.log(`${category} ${action}:`, queryKey)
      
      if (action === 'invalidate' && isRealtimeData) {
        console.warn('⚠️ Invalidating Realtime data - consider setQueryData instead')
      }
    }
  }
}
```
```

---

## 📊 **CRITERIOS DE ÉXITO**

### ✅ **Métricas de validación:**

1. **Consistencia:**
   - [ ] 100% de queries usan nuevo sistema queryKeys
   - [ ] 0 queryKeys hardcodeados en components
   - [ ] TypeScript sin errores

2. **Performance:**
   - [ ] ≤50% reducción en invalidaciones redundantes
   - [ ] Network requests más enfocados
   - [ ] Tiempo de pull-to-refresh ≤1s

3. **Mantenibilidad:**
   - [ ] Nuevas queries siguen patrón estándar
   - [ ] Documentación actualizada
   - [ ] Tests pasan

4. **Funcionalidad:**
   - [ ] Realtime sigue funcionando
   - [ ] Pull-to-refresh más efectivo
   - [ ] No regressions en UI

---

## 🚨 **RIESGOS Y MITIGACIONES**

### ⚠️ **Riesgos identificados:**

1. **Breaking changes en Realtime**
   - **Mitigación:** Migrar gradualmente, mantener compatibility layer

2. **Queries no se invalidan correctamente**
   - **Mitigación:** Testing exhaustivo después de cada migración

3. **Performance degradation temporal**
   - **Mitigación:** Hacer en branch separado, benchmark antes/después

4. **Type errors**
   - **Mitigación:** Usar TypeScript strict, validar con tsc

---

## 📝 **CHECKLIST DE EJECUCIÓN**

### **Pre-requisitos:**
- [ ] Backup de código actual
- [ ] Branch dedicado: `feature/query-refactor`
- [ ] Testing environment disponible

### **Fase 1: Auditoría**
- [ ] Ejecutar comandos de inventario
- [ ] Documentar queries existentes  
- [ ] Identificar patterns problemáticos
- [ ] Mapear dependencias

### **Fase 2: Diseño**
- [ ] Definir nueva estructura queryKeys
- [ ] Crear invalidation strategies
- [ ] Revisar con equipo
- [ ] Documentar decisiones

### **Fase 3: Migración**
- [ ] Actualizar `queryClient.ts` con categorización Realtime/Query
- [ ] Limpiar RealtimeProvider (eliminar invalidaciones innecesarias)
- [ ] Migrar `useUserQueries.ts` con separación Realtime/Static
- [ ] Migrar `useCouponQueries.ts` diferenciando available(Realtime) vs history(Query)
- [ ] Migrar `useStreakQueries.ts` con patrón híbrido
- [ ] Testing después de cada archivo (verificar Realtime sigue funcionando)

### **Fase 4: Optimización**
- [ ] Verificar RealtimeProvider usa solo setQueryData
- [ ] Eliminar invalidaciones redundantes en pull-to-refresh
- [ ] Agregar debugging con categorización (🔴 Realtime, 🔵 Query)
- [ ] Performance testing (menos network requests)
- [ ] Documentar patrones híbridos

### **Fase 5: Pull-to-refresh inteligente**
- [ ] Actualizar AppShell para invalidar solo datos estáticos
- [ ] Verificar que datos Realtime NO se invaliden en pull-to-refresh
- [ ] Testing del flujo híbrido completo
- [ ] Validar UX (debe ser más rápido)

### **Post-refactor:**
- [ ] Code review completo
- [ ] Update documentation
- [ ] Merge a main branch
- [ ] Monitor production

---

## 🎯 **BENEFICIOS ESPERADOS**

### **Inmediatos:**
- Queries más consistentes y predecibles
- **Realtime optimizado** sin invalidaciones redundantes
- Pull-to-refresh más inteligente (solo datos estáticos)
- **Separación clara** entre datos dinámicos vs estáticos

### **A largo plazo:**
- Arquitectura híbrida escalable (Realtime + Query)
- Performance mejorado significativamente
- Más fácil agregar nuevas features con patrón claro
- Debugging más simple con categorización de datos
- Código más mantenible

---

## 📚 **RECURSOS Y REFERENCIAS**

- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Query Key Factories](https://tkdodo.eu/blog/effective-react-query-keys)
- [TypeScript Query Keys](https://tkdodo.eu/blog/type-safe-react-query)

---

**Tiempo estimado total: 6-8 horas**  
**Complejidad: Media**  
**Impacto: Alto** 

*Este plan puede ejecutarse en múltiples sesiones y permite rollback en cualquier punto.*
