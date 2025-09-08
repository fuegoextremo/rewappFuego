# 🎯 GUÍA: Actualizaciones Eficientes en Tiempo Real

## 📋 **PROBLEMA COMÚN**
```typescript
// ❌ MAL - Invalidación completa (ineficiente)
queryClient.invalidateQueries({ queryKey: ['user', 'spins', userId] })
dispatch(loadUserProfile(userId)) // Re-fetch completo desde BD
```

**Consecuencias:**
- ❌ Re-fetching innecesario de toda la BD
- ❌ Re-renders completos de componentes
- ❌ Pérdida de estados locales y animaciones
- ❌ Peor performance y UX

---

## ✅ **SOLUCIÓN CORRECTA**

### **Para React Query:**
```typescript
// ✅ BIEN - Actualización granular
queryClient.setQueryData(['user', 'spins', userId], (oldData: any) => {
  if (oldData) {
    return { ...oldData, available_spins: newValue }
  }
  return oldData
})
```

### **Para Redux Store:**
```typescript
// ✅ BIEN - Action granular
const authSlice = createSlice({
  reducers: {
    updateAvailableSpins: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.available_spins = action.payload
      }
    }
  }
})

// Uso
dispatch(updateAvailableSpins(newValue))
```

---

## 🏗️ **ARQUITECTURA COMPLETA**

### **RealtimeProvider Implementación:**
```typescript
// Listener para cambios específicos
.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'user_spins'
}, (payload) => {
  if (payload.new && payload.new.user_id === userId) {
    const newValue = payload.new.available_spins
    
    // 🎯 React Query: Actualización directa
    queryClient.setQueryData(['user', 'spins', userId], (oldData: any) => ({
      ...oldData,
      available_spins: newValue
    }))
    
    // 🎯 Redux: Action granular
    dispatch(updateAvailableSpins(newValue))
  }
})
```

---

## 📈 **BENEFICIOS**

| Aspecto | ❌ Invalidación | ✅ setQueryData |
|---------|----------------|-----------------|
| **Performance** | Re-fetch completo | Solo actualiza campo |
| **Network** | Roundtrip a BD | Sin peticiones |
| **Renders** | Componente completo | Solo valor específico |
| **Estados** | Se pierden | Se mantienen |
| **Animaciones** | Se interrumpen | Continúan |
| **UX** | Flicker/parpadeo | Fluido |

---

## 🎯 **CUÁNDO USAR CADA UNO**

### **✅ Use setQueryData cuando:**
- Datos vienen via Realtime
- Solo cambia un campo específico
- Quiere mantener estados locales
- Performance es crítica

### **⚠️ Use invalidateQueries cuando:**
- Datos pueden estar desactualizados
- Cambio complejo que afecta múltiples campos
- Necesita validación desde servidor
- No tiene Realtime configurado

---

## 🧪 **EJEMPLO COMPLETO**

```typescript
// 1. Action granular en Redux
export const updateAvailableSpins = (state, action) => {
  if (state.user) {
    state.user.available_spins = action.payload
  }
}

// 2. Listener en RealtimeProvider
.on('postgres_changes', { table: 'user_spins' }, (payload) => {
  const newSpins = payload.new.available_spins
  
  // React Query: setQueryData
  queryClient.setQueryData(['user', 'spins', userId], old => ({
    ...old, 
    available_spins: newSpins
  }))
  
  // Redux: granular update
  dispatch(updateAvailableSpins(newSpins))
})

// 3. Componentes se actualizan automáticamente
function HomeView() {
  const user = useUser() // Redux - se actualiza automáticamente
  return <div>Giros: {user.available_spins}</div>
}

function RouletteView() {
  const { data } = useUserSpins(userId) // React Query - se actualiza automáticamente
  return <div>Giros: {data.available_spins}</div>
}
```

---

## 🔥 **REGLA DE ORO**

> **"Si tienes Realtime activo, usa setQueryData + actions granulares.  
> Solo invalida cuando realmente necesites re-validar desde el servidor."**

Esta es la práctica recomendada por las librerías modernas de estado para aplicaciones en tiempo real.

---

## 📚 **Referencias**
- [TanStack Query - Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [Redux Toolkit - Efficient Updates](https://redux-toolkit.js.org/usage/efficient-updates)
- [Supabase Realtime - Best Practices](https://supabase.com/docs/guides/realtime)
