# Zustand Infinite Loops - Guía de Depuración y Soluciones

## 🚨 Problema Principal
**Error:** `Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.`

## 🔍 Causa Raíz Identificada
El problema más común es usar **selectores que devuelven objetos nuevos** en cada render, causando re-renders infinitos.

## ❌ Código Problemático

```tsx
// MAL: Objeto nuevo en cada render
const state = useAppStore((state) => ({
  currentView: state.currentView,
  user: state.user,
  openCheckin: state.openCheckin
}));
```

**¿Por qué causa infinite loop?**
1. El selector devuelve un objeto nuevo `{}` en cada render
2. React detecta que el valor "cambió" (nueva referencia)
3. Esto dispara un re-render
4. El re-render ejecuta el selector otra vez
5. Se crea otro objeto nuevo → loop infinito

## ✅ Solución Correcta

```tsx
// BIEN: Selectores individuales
const currentView = useAppStore((state) => state.currentView);
const user = useAppStore((state) => state.user);
const setCurrentView = useAppStore((state) => state.setCurrentView);
```

**¿Por qué funciona?**
1. Cada selector devuelve un valor primitivo o referencia estable
2. Zustand puede comparar eficientemente si el valor realmente cambió
3. Solo re-renderiza cuando hay cambios reales

## 📋 Lista de Verificación para Debugging

### 1. Selectores que devuelven objetos/arrays nuevos
```tsx
// ❌ MAL
const data = useAppStore(s => ({ view: s.view, user: s.user }));
const items = useAppStore(s => s.items.map(i => i.name));

// ✅ BIEN
const view = useAppStore(s => s.view);
const user = useAppStore(s => s.user);
const items = useAppStore(s => s.items);
```

### 2. set() dentro de selectores o durante render
```tsx
// ❌ MAL
const view = useAppStore(s => {
  if (!s.user) s.setCurrentView('home');  // set() en selector
  return s.currentView;
});

// ❌ MAL
if (view === 'home') doSomething(); // acción durante render

// ✅ BIEN
const user = useAppStore(s => s.user);
const view = useAppStore(s => s.currentView);
const setView = useAppStore(s => s.setCurrentView);

useEffect(() => {
  if (!user && view !== 'home') setView('home'); // con guard
}, [user, view, setView]);
```

### 3. useEffect que depende de valor que él mismo actualiza
```tsx
// ❌ MAL
useEffect(() => {
  setUser(userFromAuth); // sin guard, dispara update aunque sea igual
}, [user, setUser, userFromAuth]);

// ✅ BIEN
useEffect(() => {
  if (user?.id !== userFromAuth?.id) {
    setUser(userFromAuth);
  }
}, [user?.id, userFromAuth?.id, setUser]);
```

### 4. Suscripciones sin cleanup
```tsx
// ❌ MAL
useEffect(() => {
  const unsubscribe = useAppStore.subscribe((state) => {
    doSomething(state); // puede causar otro set()
  });
  // sin return unsubscribe
}, []);

// ✅ BIEN
useEffect(() => {
  const unsubscribe = useAppStore.subscribe((state) => {
    if (shouldDoSomething(state)) { // con guard
      doSomething(state);
    }
  });
  return unsubscribe;
}, []);
```

## 🛠️ Herramientas de Debugging

### 1. Console logs estratégicos
```tsx
console.log('Component render - currentView:', currentView, 'user:', user?.email);
```

### 2. React DevTools Profiler
- Busca componentes que re-renderizan constantemente
- Identifica qué props/state están cambiando

### 3. Zustand DevTools
```tsx
import { devtools } from 'zustand/middleware';

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // store implementation
      }),
      { name: 'app-store', skipHydration: true }
    ),
    { name: 'app-store' } // nombre para DevTools
  )
);
```

## 📖 Casos Reales del Proyecto

### Problema Original
```tsx
// AppShell.tsx - CAUSABA INFINITE LOOP
const state = useAppStore((state) => ({
  currentView: state.currentView,
  user: state.user,
  openCheckin: state.openCheckin
}));
```

### Solución Implementada
```tsx
// AppShell.tsx - FUNCIONA PERFECTAMENTE
const currentView = useAppStore((state) => state.currentView);
const user = useAppStore((state) => state.user);
const setCurrentView = useAppStore((state) => state.setCurrentView);
```

## 🎯 Mejores Prácticas

### 1. Selectores Específicos
```tsx
// ✅ Usa selectores específicos para cada valor
const userName = useAppStore(s => s.user?.name);
const isLoggedIn = useAppStore(s => !!s.user);
```

### 2. Memoización para Objetos Complejos
```tsx
// Si necesitas devolver un objeto, usa useMemo
const userInfo = useMemo(() => ({
  name: user?.name,
  email: user?.email
}), [user?.name, user?.email]);
```

### 3. Guards en useEffect
```tsx
// Siempre usa guards para evitar sets innecesarios
useEffect(() => {
  if (currentValue !== newValue) {
    setValue(newValue);
  }
}, [currentValue, newValue, setValue]);
```

## 🔧 Configuración del Store

### Persist Middleware
```tsx
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // store implementation
    }),
    { 
      name: 'app-store',
      skipHydration: true // ← IMPORTANTE para Next.js
    }
  )
);
```

## 📝 Checklist de Revisión

Antes de hacer commit, verifica:

- [ ] ¿Uso selectores individuales en lugar de objetos?
- [ ] ¿No hay set() dentro de selectores?
- [ ] ¿No hay acciones durante el render?
- [ ] ¿Todos los useEffect tienen guards apropiados?
- [ ] ¿No hay objetos/arrays nuevos en selectores?
- [ ] ¿Las suscripciones tienen cleanup?

## 📊 Rendimiento

### Antes (con infinite loop)
- Re-renders constantes
- CPU al 100%
- Aplicación inutilizable

### Después (con selectores individuales)
- Re-renders solo cuando necesario
- CPU normal
- Navegación instantánea

---

**Fecha de documentación:** 3 de septiembre de 2025  
**Proyecto:** RewApp  
**Autor:** Debugging session con GitHub Copilot

Este descubrimiento nos ahorra horas de debugging futuro. ¡Siempre usar selectores individuales con Zustand!
