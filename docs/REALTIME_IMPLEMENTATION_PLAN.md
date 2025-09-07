# REWAPP - Plan de Implementación Supabase Realtime

## 🎯 **OBJETIVO**
Implementar feedback visual en tiempo real para que los usuarios vean inmediatamente cuando su check-in es procesado exitosamente por el verificador.

---

## 💰 **ANÁLISIS DE COSTOS**

### **Supabase Realtime - Plan Free**
- ✅ **Mensajes**: Hasta 2,000,000/mes - **GRATIS**
- ✅ **Conexiones**: Hasta 200 simultáneas - **GRATIS**
- ✅ **Postgres Changes**: Sin límite específico - **GRATIS**

### **Estimación REWAPP**
- **Usuarios activos**: ~50 usuarios
- **Mensajes estimados**: ~7,500/mes (0.375% del límite)
- **Conexiones pico**: ~100 usuarios (50% del límite)
- **Costo estimado**: **$0.00**

✅ **CONCLUSIÓN**: Implementación sin costo adicional

---

## 🛠️ **PLAN DE IMPLEMENTACIÓN**

### **FASE 1: Hook de Realtime Base (30 min)**

#### **1.1 Crear Hook Principal**
```typescript
// src/hooks/useUserRealtime.ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClientBrowser } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useUserRealtime(userId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    if (!userId) return

    const supabase = createClientBrowser()
    
    const channel = supabase
      .channel(`user-${userId}-realtime`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        // Nuevo check-in detectado
        toast({
          title: "¡Check-in exitoso! 🎉",
          description: `Has ganado ${payload.new.spins_earned || 1} giros`,
        })
        
        // Invalidar datos para actualizar UI
        queryClient.invalidateQueries({ queryKey: ['user', userId] })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public', 
        table: 'user_spins',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        // Giros actualizados
        queryClient.invalidateQueries({ 
          queryKey: ['user', userId, 'stats'] 
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'streaks', 
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        // Racha actualizada
        queryClient.invalidateQueries({ 
          queryKey: ['user', userId, 'stats'] 
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient, toast])
}
```

#### **1.2 Hook de Notificaciones Globales**
```typescript
// src/hooks/useRealtimeNotifications.ts
import { useEffect } from 'react'
import { useUser } from '@/store/hooks'

export function useRealtimeNotifications() {
  const user = useUser()
  
  // Solo activar para usuarios autenticados
  useUserRealtime(user?.id || '')
}
```

### **FASE 2: Integración en Componentes (15 min)**

#### **2.1 Integrar en HomeView**
```typescript
// src/components/client/views/HomeView.tsx
import { useUserRealtime } from '@/hooks/useUserRealtime'

export default function HomeView() {
  const user = useUser()
  
  // ✨ Activar realtime para este usuario
  useUserRealtime(user?.id)
  
  // El resto del componente permanece igual
  // Los datos se actualizarán automáticamente
}
```

#### **2.2 Integrar en Layout Principal (Opcional)**
```typescript
// src/components/client/layout.tsx
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'

export default function ClientLayout({ children }) {
  // ✨ Notificaciones globales para toda la SPA
  useRealtimeNotifications()
  
  return (
    <div>
      {children}
    </div>
  )
}
```

### **FASE 3: Optimizaciones y Feedback Visual (15 min)**

#### **3.1 Animaciones para Cambios**
```typescript
// Agregar a HomeView.tsx
const [recentUpdate, setRecentUpdate] = useState(false)

// En useUserRealtime, agregar callback:
onDataUpdate={() => {
  setRecentUpdate(true)
  setTimeout(() => setRecentUpdate(false), 2000)
}}

// En UI:
<div className={`transition-all ${recentUpdate ? 'ring-2 ring-green-400' : ''}`}>
  {user.total_checkins || 0}
</div>
```

#### **3.2 Estado de Conexión**
```typescript
// Indicador de estado realtime
const [isConnected, setIsConnected] = useState(false)

// En channel subscription:
.on('system', {}, (status) => {
  setIsConnected(status.status === 'SUBSCRIBED')
})

// En UI:
{isConnected && (
  <div className="text-xs text-green-600">
    🟢 Datos en tiempo real
  </div>
)}
```

---

## 🔧 **CONFIGURACIÓN SUPABASE**

### **Habilitar Realtime en Dashboard**
1. Ir a Supabase Dashboard → Settings → API
2. Habilitar Realtime para tablas:
   - ✅ `check_ins`
   - ✅ `user_spins` 
   - ✅ `streaks`

### **Verificar Row Level Security**
Las políticas RLS ya están configuradas correctamente:
```sql
-- check_ins: usuarios pueden ver sus propios check-ins
-- user_spins: usuarios pueden ver sus propios giros
-- streaks: usuarios pueden ver sus propias rachas
```

---

## ⚡ **FLUJO ESPERADO**

### **Proceso Actual (Sin Realtime)**
1. Usuario muestra QR → Verificador escanea → BD se actualiza
2. Usuario NO sabe si fue exitoso
3. Usuario debe refrescar manualmente para ver cambios
4. **Delay**: 30+ segundos hasta que usuario ve resultado

### **Proceso Nuevo (Con Realtime)**
1. Usuario muestra QR → Verificador escanea → BD se actualiza
2. **Instantáneo**: Supabase notifica cambio en `check_ins`
3. **<1 segundo**: Hook detecta cambio y muestra toast
4. **<2 segundos**: UI se actualiza con nuevos datos
5. Usuario ve feedback inmediato del éxito

---

## 📊 **MÉTRICAS DE ÉXITO**

### **Performance**
- ⏱️ **Tiempo de feedback**: <1 segundo
- 🔄 **Actualización de datos**: <2 segundos
- 📡 **Confiabilidad**: >99% de notificaciones entregadas

### **Experiencia de Usuario**
- 🎉 **Feedback inmediato** con toast notification
- 📈 **Datos siempre actualizados** sin refrescar
- 🔗 **Conexión visual** entre acción del verificador y resultado del usuario

### **Técnicas**
- 💰 **Costo**: $0 adicional
- 🔋 **Uso de límites**: <1% de mensajes, <50% de conexiones
- 🚀 **Escalabilidad**: Hasta 200x crecimiento sin costo

---

## 🚨 **RIESGOS Y MITIGACIONES**

### **Riesgo 1: Pérdida de Conexión**
- **Mitigación**: Supabase maneja reconexión automática
- **Fallback**: Polling cada 30 segundos si realtime falla

### **Riesgo 2: Exceder Límites Gratuitos**
- **Probabilidad**: Muy baja (<1% de límites)
- **Monitoreo**: Dashboard de Supabase
- **Mitigación**: Alertas al 75% de uso

### **Riesgo 3: Performance en Móviles**
- **Mitigación**: Desconectar cuando app está en background
- **Optimización**: Debouncing de actualizaciones múltiples

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

### **Preparación**
- [ ] Verificar que Realtime está habilitado en Supabase
- [ ] Confirmar Row Level Security en tablas objetivo
- [ ] Revisar límites actuales de uso

### **Desarrollo**
- [ ] Crear `src/hooks/useUserRealtime.ts`
- [ ] Crear `src/hooks/useRealtimeNotifications.ts`
- [ ] Integrar en `HomeView.tsx`
- [ ] Agregar feedback visual (toasts, animaciones)
- [ ] Testing en desarrollo local

### **Testing**
- [ ] Test: Check-in desde admin scanner
- [ ] Verificar: Toast aparece en usuario
- [ ] Verificar: Datos se actualizan automáticamente
- [ ] Test: Reconexión tras pérdida de red
- [ ] Test: Performance con múltiples usuarios

### **Deployment**
- [ ] Deploy a staging
- [ ] Test end-to-end en staging
- [ ] Verificar métricas de Supabase
- [ ] Deploy a producción
- [ ] Monitoreo post-deployment

---

## 📝 **NOTAS DE IMPLEMENTACIÓN**

### **Orden de Desarrollo**
1. **Hook base** → **Integración HomeView** → **Feedback visual**
2. Empezar con tabla `check_ins` (más crítica)
3. Agregar `user_spins` y `streaks` después

### **Testing Local**
```bash
# Terminal 1: Admin scanner
npm run dev
# Ir a /admin/scanner

# Terminal 2: Cliente
npm run dev
# Ir a /client (usuario logueado)

# Proceso: Escanear QR del cliente desde admin
# Resultado esperado: Toast inmediato en cliente
```

---

*Documento creado: Septiembre 6, 2025*  
*Tiempo estimado total: 1 hora*  
*Costo adicional: $0*
