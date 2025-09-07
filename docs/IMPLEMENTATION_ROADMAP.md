# REWAPP - Roadmap de Implementación SPA

**Basado en:** PROJECT_MASTER_GUIDE.md + DATA_STRUCTURE_GUIDE.md  
**Objetivo:** MVP funcional con arquitectura híbrida Redux + React Query

---

## 🎯 RESUMEN EJECUTIVO

### **Estado Actual:**
- ✅ **Arquitectura Híbrida**: Redux + React Query configurado
- ✅ **Sistema de Seguridad**: Completo y funcional
- ✅ **API Base**: User y Coupons implementados
- ✅ **Providers**: Sistema combinado funcionando
- ✅ **Documentación**: Completa y actualizada

### **Próximo Objetivo:**
Completar las **7 vistas principales del cliente SPA** con datos dinámicos y funcionalidad completa.

---

## 🚀 FASES DE DESARROLLO

### **FASE 1: API Layer Completo** 
**⏱️ Duración Estimada: 2-3 días**

#### **Día 1: APIs de Check-ins y Streaks**
```typescript
// Archivos a crear:
src/lib/api/checkins.ts
src/lib/api/streaks.ts

// Funciones requeridas:
- getUserCheckins() ✅ (ya existe)
- createCheckin(userId, branchId, verifiedBy)
- validateQRCode(qrData)  
- generateUserQR(userId)
- getUserStreak(userId)
- updateStreak(userId, checkinData)
- getStreakConfig()
- getStreakHistory(userId)
```

#### **Día 2: APIs de Ruleta y Spins**
```typescript
// Archivos a crear:
src/lib/api/roulette.ts
src/lib/api/spins.ts

// Funciones requeridas:
- getAvailableSpins(userId)
- addSpins(userId, amount)
- consumeSpin(userId)
- spinRoulette(userId)
- getRouletteConfig()
- getPrizes()
- updateSpinCooldown(userId)
```

#### **Día 3: APIs de Sistema y Configuración**
```typescript
// Archivos a crear:
src/lib/api/system.ts

// Funciones requeridas:
- getSystemConfig(category?)
- updateSystemConfig(key, value)
- getBranches()
- getCompanyInfo()
- getVisualTheme()
```

### **FASE 2: React Query Hooks**
**⏱️ Duración Estimada: 1 día**

#### **Hooks a Crear:**
```typescript
// src/hooks/queries/useCheckinQueries.ts
- useUserCheckins()
- useCreateCheckin()
- useQRValidation()

// src/hooks/queries/useStreakQueries.ts  
- useUserStreak()
- useStreakConfig()
- useStreakHistory()

// src/hooks/queries/useRouletteQueries.ts
- useAvailableSpins()
- useSpinRoulette()
- useRouletteConfig()
- usePrizes()

// src/hooks/queries/useSystemQueries.ts
- useSystemConfig()
- useCompanyInfo()
- useVisualTheme()
```

### **FASE 3: Vistas SPA Principales**
**⏱️ Duración Estimada: 5-7 días**

#### **Día 1-2: HomeView Completa**
```typescript
// src/components/client/views/HomeView.tsx
Secciones:
- Estadísticas rápidas (visitas, giros)
- Estado de racha visual
- Giros disponibles con acceso directo a ruleta
- Actividad reciente (últimos check-ins)
- Placeholders cuando no hay datos

Hooks usados:
- useUserStats(userId)
- useUserStreak(userId) 
- useRecentCheckins(userId, 5)
- useAvailableSpins(userId)
```

#### **Día 3: StreakView Avanzada**
```typescript
// src/components/client/views/StreakView.tsx
Estados a manejar:
- Sin racha: Imagen motivacional
- Racha activa: Progreso visual + countdown
- Racha en riesgo: Alerta visual
- Racha completada: Celebración + nueva meta
- Historial de rachas completadas

Componentes:
- StreakProgress
- StreakCountdown  
- StreakHistory
- StreakMotivation
```

#### **Día 4: CouponsView Funcional**
```typescript
// src/components/client/views/CouponsView.tsx
Secciones:
- Cupones disponibles (con filtros)
- Cupones usados (historial)
- Componente de cupón individual
- Modal de redención con QR
- Placeholder sin cupones

Componentes a reutilizar/adaptar:
- CouponCard (de versión clásica)
- CouponQRModal
- CouponFilters
```

#### **Día 5: ProfileView con Edición**
```typescript
// src/components/client/views/ProfileView.tsx
Funcionalidades:
- Avatar/imagen de perfil
- Edición de datos personales
- Cambio de contraseña
- Configuraciones de cuenta
- Botón cerrar sesión
- Área peligrosa: borrar cuenta (soft delete)

Forms:
- EditProfileForm
- ChangePasswordForm
- DeleteAccountConfirmation
```

#### **Día 6: RouletteView Interactiva**
```typescript
// src/components/client/views/RouletteView.tsx
Componentes:
- Ruleta visual (animación)
- Contador de giros disponibles
- Cooldown timer
- Resultado de premio
- Historial de giros recientes

Estados:
- Sin giros: CTA para hacer check-in
- Con giros: Ruleta activa
- En cooldown: Timer de espera
- Resultado: Animación de premio
```

#### **Día 7: Componente Check-in QR**
```typescript
// src/components/client/CheckinQRModal.tsx
Funcionalidades:
- Generar QR personal temporal
- Validación de QR en tiempo real
- Feedback visual del estado
- Instrucciones para el usuario
- Botón de refresh del QR

Integración:
- Botón en BottomNav
- Modal/Sheet responsive
- Auto-refresh cada 5 minutos
```

### **FASE 4: Classic App y Compartición**
**⏱️ Duración Estimada: 3-4 días**

#### **Día 1: Extraer Componentes Compartidos**
```typescript
// src/components/shared/
- CouponComponents (reutilizar de classic)
- QRComponents
- FormComponents
- UIComponents (cards, modals, etc.)
- PlaceholderComponents
```

#### **Día 2-3: Implementar Classic App**
```typescript
// src/app/classicapp/
Páginas:
- page.tsx (inicio igual que SPA)
- profile/page.tsx
- coupons/page.tsx  
- roulette/page.tsx

Diferencias:
- Server-side rendering
- Navegación tradicional
- URLs separadas
- Mismos datos, diferente presentación
```

#### **Día 4: Cross-Navigation**
```typescript
// Links entre versiones:
- Botón "Probar nueva versión" en classic
- Botón "Versión clásica" en SPA
- Preservar estado de autenticación
- Redirecciones inteligentes
```

### **FASE 5: Polish y Optimización**
**⏱️ Duración Estimada: 2-3 días**

#### **Día 1: Estados Vacíos y Placeholders**
- Imágenes placeholder para todas las vistas
- Mensajes motivacionales
- Estados de carga consistentes
- Manejo de errores amigable

#### **Día 2: Performance y Caching**
- Optimización de queries
- Lazy loading de imágenes
- Prefetching inteligente
- Bundle analysis y optimización

#### **Día 3: Testing y Validación**
- Testing de flujos principales
- Validación de seguridad
- Testing cross-browser
- Performance testing

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### **APIs Requeridas:**
- [ ] `createCheckin()`
- [ ] `validateQRCode()` 
- [ ] `generateUserQR()`
- [ ] `getUserStreak()`
- [ ] `updateStreak()`
- [ ] `getStreakConfig()`
- [ ] `getAvailableSpins()`
- [ ] `spinRoulette()`
- [ ] `getRouletteConfig()`
- [ ] `getPrizes()`
- [ ] `getSystemConfig()`

### **Query Hooks:**
- [ ] `useUserCheckins()` ✅
- [ ] `useCreateCheckin()`
- [ ] `useUserStreak()`
- [ ] `useAvailableSpins()`
- [ ] `useSpinRoulette()`
- [ ] `useSystemConfig()`

### **Vistas SPA:**
- [ ] `HomeView` con datos dinámicos
- [ ] `StreakView` funcional completa
- [ ] `CouponsView` con gestión de estados
- [ ] `ProfileView` con edición
- [ ] `RouletteView` interactiva
- [ ] `CheckinQRModal` funcional

### **Classic App:**
- [ ] Componentes compartidos extraídos
- [ ] Páginas clásicas implementadas
- [ ] Cross-navigation funcionando

### **Polish:**
- [ ] Placeholders en todas las vistas
- [ ] Estados de carga consistentes
- [ ] Manejo de errores
- [ ] Performance optimizada

---

## 🎯 CRITERIOS DE ÉXITO MVP

### **Funcionalidad Mínima:**
1. ✅ Usuario puede autenticarse
2. [ ] Usuario puede generar QR para check-in
3. [ ] Verificador puede escanear y procesar check-in
4. [ ] Usuario ve giros disponibles después del check-in
5. [ ] Usuario puede girar ruleta y ganar premios
6. [ ] Usuario puede ver y usar cupones ganados
7. [ ] Usuario puede ver progreso de racha
8. [ ] Todas las vistas tienen placeholders apropiados

### **Technical Requirements:**
1. ✅ Arquitectura híbrida Redux + React Query
2. ✅ Sistema de seguridad por roles
3. [ ] Performance: <3s carga inicial
4. [ ] Responsive: funciona en móvil y desktop
5. [ ] Offline resilience: manejo básico
6. [ ] Error boundaries: recuperación de errores

### **UX Requirements:**
1. [ ] Navegación intuitiva
2. [ ] Feedback inmediato en acciones
3. [ ] Estados de carga consistentes
4. [ ] Mensajes de error comprensibles
5. [ ] Animaciones fluidas en ruleta
6. [ ] QR fácil de mostrar/escanear

---

## 🚨 RIESGOS Y MITIGACIONES

### **Riesgo: Complejidad de Datos**
- **Mitigación**: Usar React Query para cache automático
- **Plan B**: Simplificar queries si es necesario

### **Riesgo: Performance en Móvil**
- **Mitigación**: Lazy loading agresivo y bundle splitting
- **Plan B**: Versión lite para móviles lentos

### **Riesgo: Incompatibilidad Classic/SPA**
- **Mitigación**: Componentes compartidos desde el inicio
- **Plan B**: Desarrollo paralelo si es necesario

### **Riesgo: Seguridad de QRs**
- **Mitigación**: Implementar validación robusta desde inicio
- **Plan B**: Sistema de tokens más simple si falla

---

**📌 Este roadmap debe revisarse semanalmente y ajustarse según el progreso real. La prioridad es un MVP funcional antes que funcionalidades avanzadas.**
