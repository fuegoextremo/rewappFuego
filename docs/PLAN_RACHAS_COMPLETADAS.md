# 🔥 PLAN DE IMPLEMENTACIÓN: RACHAS COMPLETADAS Y CUPONES AUTOMÁTICOS

**Fecha:** 9 de septiembre de 2025  
**Rama:** feature/spa-architecture  
**Estado:** 📋 Planificación completa - Lista para implementar  

---

## 🎯 **OBJETIVOS PRINCIPALES**

1. **Generar cupones automáticos** al alcanzar cada `streak_threshold`
2. **Implementar contador de rachas completadas** (`completed_count`)
3. **Manejo correcto de estados**: Racha rota vs Racha expirada
4. **Sistema de temporadas** con reinicio automático
5. **Imagen de "completada"** hasta el siguiente check-in

---

## 📋 **LÓGICA DE NEGOCIO DETALLADA**

### **🎫 GENERACIÓN DE CUPONES**
- **CUÁNDO:** Cada vez que el usuario alcanza un `streak_threshold` específico
- **FRECUENCIA:** **Cada vez** (no "una vez por temporada")
- **EJEMPLO:** 
  - Usuario alcanza 5 visitas → Genera cupón "Premio 5 Visitas"
  - Usuario completa racha, reinicia, vuelve a alcanzar 5 visitas → **Genera cupón nuevamente**

### **🔄 ESTADOS DE RACHA**

#### **1. RACHA ROTA (Break)**
- **CAUSA:** Excede `streak_break_days` sin check-in (default: 1 día)
- **COMPORTAMIENTO:** 
  - `current_count` se resetea a 0
  - `completed_count` **NO cambia** (mantiene historial)
  - **Puede reiniciar** con el siguiente check-in
- **UI:** Mostrar "Racha perdida - ¡Reinicia!" con `streak_broken_image`

#### **2. RACHA EXPIRADA (Season End)**
- **CAUSA:** Excede `streak_expiry_days` desde `created_at` (default: 90 días)
- **COMPORTAMIENTO:**
  - `current_count` se resetea a 0
  - `completed_count` **SE MANTIENE** (historial permanente)
  - **Nueva temporada** inicia desde cero
- **UI:** Mostrar "¡Nueva temporada de rachas!" con `streak_expired_image` 

#### **3. RACHA COMPLETADA**
- **CAUSA:** Alcanza el threshold más alto configurado
- **COMPORTAMIENTO:**
  - `completed_count += 1`
  - `current_count` se resetea a 0
  - **Imagen "completada" se mantiene** hasta el **siguiente check-in**
  - En el siguiente check-in: inicia nueva racha desde 1
- **UI:** Mostrar imagen de "¡Racha completada!" hasta próximo check-in

---

## 🗄️ **MODIFICACIONES DE BASE DE DATOS**

### **1. Agregar campo `completed_count`**
```sql
-- Migración: 014_add_completed_count.sql
ALTER TABLE public.streaks 
ADD COLUMN completed_count INTEGER DEFAULT 0;

-- Comentario para documentar
COMMENT ON COLUMN public.streaks.completed_count IS 'Contador de rachas completadas históricamente';
```

### **2. Modificar función `process_checkin`**

#### **A. Corregir cálculo dinámico de `expires_at`**
```sql
-- Usar configuración del sistema en lugar de hardcode
v_expiry_days := get_system_setting('streak_expiry_days', '90')::int;
expires_at = (SELECT created_at FROM streaks WHERE user_id = p_user) + (v_expiry_days || ' days')::INTERVAL
```

#### **B. Agregar lógica de generación automática de cupones**
```sql
-- DESPUÉS de actualizar current_count
-- Verificar si alcanzó algún streak_threshold
-- Generar cupón automático usando función existente grant_manual_coupon
FOR prize_record IN 
  SELECT id, streak_threshold, validity_days 
  FROM prizes 
  WHERE type = 'streak' 
    AND is_active = true 
    AND streak_threshold = NEW.current_count
LOOP
  -- Generar cupón automáticamente
  PERFORM grant_manual_coupon(p_user, prize_record.id, prize_record.validity_days);
END LOOP;
```

#### **C. Lógica de completación y reinicio**
```sql
-- Verificar si completó racha máxima
v_max_threshold := (
  SELECT MAX(streak_threshold) 
  FROM prizes 
  WHERE type = 'streak' AND is_active = true
);

IF NEW.current_count >= v_max_threshold THEN
  -- Marcar como completada y reiniciar
  UPDATE streaks 
  SET 
    completed_count = completed_count + 1,
    current_count = 0,  -- Reiniciar para próxima racha
    is_just_completed = true  -- Nuevo campo para UI
  WHERE user_id = p_user;
END IF;
```

### **3. Agregar campo temporal `is_just_completed`**
```sql
-- Para manejar estado visual "recién completada"
ALTER TABLE public.streaks 
ADD COLUMN is_just_completed BOOLEAN DEFAULT false;
```

---

## 💻 **MODIFICACIONES DE FRONTEND**

### **1. Actualizar Redux authSlice**
```typescript
// Agregar nuevos campos al estado
interface UserStreakData {
  current_count: number
  completed_count: number        // ← NUEVO
  is_just_completed: boolean     // ← NUEVO
  expires_at: string | null
  last_check_in: string | null
}
```

### **2. Lógica de estados visuales**
```typescript
// En calculateStreakStage
function calculateStreakStage(currentCount: number, streakData: UserStreakData, prizes: StreakPrize[]) {
  
  // PRIORIDAD 1: Racha recién completada
  if (streakData.is_just_completed) {
    return {
      image: settings.streak_complete_image || "🏆",
      stage: `¡Racha completada! (${streakData.completed_count} total)`,
      progress: 100,
      isCompleted: true,
      showCompletedBadge: true
    }
  }
  
  // PRIORIDAD 2: Racha expirada (temporada)
  const isExpired = streakData.expires_at && new Date(streakData.expires_at) < new Date()
  if (isExpired) {
    return {
      image: settings.streak_expired_image || "�",
      stage: "¡Nueva temporada de rachas!",
      progress: 0,
      canRestart: true,
      seasonsCompleted: streakData.completed_count
    }
  }
  
  // PRIORIDAD 3: Racha rota
  const daysSinceLastCheckin = calculateDaysDifference(streakData.last_check_in)
  const breakDaysLimit = parseInt(settings.streak_break_days || '1')
  
  if (daysSinceLastCheckin > breakDaysLimit) {
    return {
      image: settings.streak_broken_image || "😴",
      stage: "Racha perdida - ¡Reinicia!",
      progress: 0,
      canRestart: true,
      seasonsCompleted: streakData.completed_count
    }
  }
  
  // PRIORIDAD 4: Racha activa normal
  return calculateActiveStreak(currentCount, prizes, settings)
}
```

### **3. UI Components**

#### **A. Mostrar contador de rachas completadas**
```tsx
// En StreakSection.tsx
{streakData.completed_count > 0 && (
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <span>🏆</span>
    <span>{streakData.completed_count} racha{streakData.completed_count > 1 ? 's' : ''} completada{streakData.completed_count > 1 ? 's' : ''}</span>
  </div>
)}
```

#### **B. Badge de "recién completada"**
```tsx
{streakStage.isCompleted && streakStage.showCompletedBadge && (
  <div className="animate-pulse bg-gold-100 border border-gold-300 rounded-lg p-3">
    <div className="text-center">
      <div className="text-2xl mb-2">🎉</div>
      <div className="font-bold text-gold-800">¡Racha completada!</div>
      <div className="text-sm text-gold-600">Tu próximo check-in iniciará una nueva racha</div>
    </div>
  </div>
)}
```

#### **C. Notificación de cupones automáticos**
```tsx
// Hook para detectar nuevos cupones
useEffect(() => {
  // Escuchar cambios en cupones via Realtime
  // Mostrar toast cuando se genera cupón automático
  if (newCoupon && newCoupon.source === 'streak') {
    toast.success(`🎫 ¡Cupón obtenido por racha de ${newCoupon.streak_threshold} visitas!`)
  }
}, [coupons])
```

---

## 🔄 **FLUJO COMPLETO DEL SISTEMA**

### **Escenario 1: Usuario alcanza threshold intermedio**
```
Check-in → current_count = 5 → Verificar prizes con streak_threshold = 5 
→ ¿Existe? → SÍ → Generar cupón automático → Notificar usuario
```

### **Escenario 2: Usuario completa racha máxima**
```
Check-in → current_count = 20 (máximo) → Generar cupón threshold 20 
→ completed_count += 1 → current_count = 0 → is_just_completed = true
→ UI muestra "¡Racha completada!" hasta próximo check-in
```

### **Escenario 3: Próximo check-in después de completar**
```
Check-in → is_just_completed = true → Resetear is_just_completed = false
→ current_count = 1 → UI muestra nueva racha iniciada
```

### **Escenario 4: Racha rota por inactividad**
```
Días sin check-in > streak_break_days → current_count = 0 
→ completed_count SIN CAMBIOS → UI "Racha perdida - ¡Reinicia!"
```

### **Escenario 5: Temporada expirada**
```
Días totales > streak_expiry_days → current_count = 0 
→ completed_count SIN CAMBIOS → UI "¡Nueva temporada!"
→ expires_at se recalcula para nueva temporada
```

---

## 📝 **ORDEN DE IMPLEMENTACIÓN**

### **FASE 1: BASE DE DATOS** ⭐ **CRÍTICO**
1. ✅ Crear migración `014_add_completed_count.sql`
2. ✅ Agregar campo `is_just_completed`
3. ✅ Modificar función `process_checkin` con lógica completa
4. ✅ Probar generación automática de cupones

### **FASE 2: BACKEND INTEGRATION**
1. ✅ Actualizar types en `database.ts`
2. ✅ Actualizar authSlice con nuevos campos
3. ✅ Modificar RealtimeManager para escuchar cupones automáticos
4. ✅ Actualizar hooks Redux

### **FASE 3: FRONTEND UI**
1. ✅ Implementar lógica de estados en `calculateStreakStage`
2. ✅ Actualizar StreakSection con contador de completadas
3. ✅ Agregar badge de "recién completada"
4. ✅ Implementar notificaciones de cupones automáticos

### **FASE 4: TESTING Y REFINAMIENTO**
1. ✅ Probar todos los escenarios listados arriba
2. ✅ Verificar que cupones se generan correctamente
3. ✅ Validar comportamiento de UI en todos los estados
4. ✅ Optimizar performance si es necesario

---

## ⚠️ **CONSIDERACIONES IMPORTANTES**

### **Generación de cupones**
- ✅ Usar función existente `grant_manual_coupon`
- ✅ Validar que el premio existe y está activo
- ✅ Usar `validity_days` del premio específico
- ✅ Marcar fuente como `'streak'` para distinguir de manuales

### **Performance**
- ✅ Consultas optimizadas en `process_checkin`
- ✅ Índices apropiados en tablas
- ✅ Realtime updates eficientes

### **UX/UI**
- ✅ Animaciones suaves para cambios de estado
- ✅ Mensajes claros diferenciando "rota" vs "expirada"
- ✅ Feedback inmediato para cupones generados
- ✅ Badge temporal para racha "recién completada"

---

## 🎯 **MÉTRICAS DE ÉXITO**

1. **✅ Cupones automáticos** se generan cada vez que se alcanza threshold
2. **✅ Contador completed_count** se incrementa solo al completar racha máxima
3. **✅ Estados visuales** correctos para rota/expirada/completada
4. **✅ Temporadas funcionan** con expires_at dinámico
5. **✅ Performance** no se degrada con las nuevas funcionalidades

---

**🚀 ¡LISTO PARA IMPLEMENTAR!** 
Seguir este plan al pie de la letra garantiza un sistema robusto y completo.
