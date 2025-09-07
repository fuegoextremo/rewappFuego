# REWAPP - Documentación Completa del Proyecto

**Fecha de Actualización:** September 6, 2025  
**Versión:** SPA Architecture v2.0  
**Estado:** En desarrollo activo - Migración Híbrida Redux + React Query

---

## 📋 ÍNDICE

1. [Visión General del Proyecto](#visión-general)
2. [Arquitectura Técnica](#arquitectura-técnica)
3. [Lógica de Negocio](#lógica-de-negocio)
4. [Estructura Actual](#estructura-actual)
5. [Estructura Final Esperada](#estructura-final-esperada)
6. [Módulos y Funcionalidades](#módulos-y-funcionalidades)
7. [Estado de Implementación](#estado-de-implementación)
8. [Roadmap MVP](#roadmap-mvp)

---

## 🎯 VISIÓN GENERAL DEL PROYECTO

### **¿Qué es REWAPP?**
Sistema de recompensas multi-sucursal que permite a los usuarios acumular puntos mediante check-ins con QR, participar en ruletas virtuales para ganar premios, y gestionar cupones de descuento.

### **Usuarios del Sistema:**
- **Cliente**: Usuario final que hace check-ins y participa en el sistema de recompensas
- **Verificador**: Personal que escanea QRs de clientes para confirmar check-ins
- **Manager**: Gestiona configuraciones locales de sucursal
- **Admin**: Administra sistema completo, usuarios, premios y configuraciones
- **SuperAdmin**: Control total del sistema, gestión de sucursales y configuraciones avanzadas

### **Flujo Principal:**
1. **Cliente** genera QR personal desde la app
2. **Verificador/Admin** escanea QR del cliente
3. **Sistema** otorga N giros de ruleta basado en configuración
4. **Cliente** juega ruleta y puede ganar premios (cupones)
5. **Cliente** usa cupones en establecimientos físicos

---

## 🏗️ ARQUITECTURA TÉCNICA

### **Stack Tecnológico:**
- **Frontend**: Next.js 14.2.13 + TypeScript + Tailwind CSS
- **Estado Global**: Redux Toolkit + React Query (Arquitectura Híbrida)
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth + JWT
- **UI Components**: Radix UI + Shadcn/ui

### **Arquitectura Dual:**
```
REWAPP
├── 🆕 SPA Version (/client)
│   ├── Redux Store (auth, ui, settings)
│   ├── React Query (datos dinámicos)
│   └── Experiencia fluida y moderna
└── 📱 Classic Version (/classicapp)
    ├── SSR/SSG tradicional
    ├── Fallback para compatibilidad
    └── Compartirá módulos con SPA
```

### **Patrón de Datos Híbrido:**
```typescript
// Redux Store: Solo datos críticos
{
  auth: { user, session, isAuthenticated }
  ui: { currentView, modals, loading, checkinSheet }  
  settings: { systemConfig, branches, visualTheme }
}

// React Query: Datos dinámicos con cache
{
  userProfile, userCheckins, userCoupons, userStats,
  availableCoupons, streakData, recentActivity
}
```

### **Sistema de Seguridad:**
- **Middleware JWT**: Primera línea de defensa (verificación de sesión)
- **RouteGuard Components**: Segunda línea (verificación de roles granular)
- **Roles**: client, verifier, manager, admin, superadmin

---

## 💼 LÓGICA DE NEGOCIO

### **1. SISTEMA DE CHECK-INS**

#### **Proceso:**
1. Usuario presenta QR personal único
2. Verificador/Admin escanea con scanner de la app
3. Sistema valida QR con parámetros de seguridad
4. Se registra check-in en base de datos
5. Se otorgan N giros de ruleta (configuración dinámica)

#### **Validaciones:**
- Límite de check-ins por día (configurable en sistema)
- QR debe ser válido y no expirado
- Usuario debe estar activo
- Verificador debe tener permisos

### **2. SISTEMA DE RACHAS (STREAKS)**

#### **Configuraciones del Sistema:**
1. **Giros por Check-in**: N giros otorgados por cada check-in exitoso
2. **Límite Check-ins Diarios**: Máximo N check-ins permitidos por día
3. **Días para Romper Racha**: Período de gracia (ej: 5 días) para mantener racha activa
4. **Días para Expirar Racha**: Límite de temporada (ej: 90 días) para "resetear" todas las rachas

#### **Estados de Racha:**
- **Sin Racha**: Usuario nuevo o racha expirada → Mostrar imagen motivacional
- **Racha Activa**: Usuario tiene días restantes para siguiente check-in
- **Racha Rota**: Usuario perdió racha por inactividad
- **Racha Completada**: Usuario completó objetivo → Se guarda en contador histórico

#### **Visualización:**
- Imagen configurada en admin para mostrar progreso
- Indicador visual de días restantes
- Contador de rachas completadas históricamente

### **3. SISTEMA DE RULETA VIRTUAL**

#### **Configuraciones:**
- **Porcentaje General de Ganancia**: Probabilidad global del sistema
- **Cooldown entre Giros**: Tiempo de espera entre giros (segundos)
- **Premios Individuales**: Cada premio tiene su % de probabilidad específico

#### **Proceso:**
1. Usuario recibe giros por check-in
2. Usuario accede a ruleta virtual
3. Sistema calcula probabilidades según configuración
4. Si gana: se genera cupón automáticamente
5. Si pierde: se consume el giro sin recompensa

### **4. SISTEMA DE CUPONES**

#### **Generación:**
- Se crean automáticamente al ganar en ruleta
- Tienen código único para seguridad
- Fecha de expiración individual o por defecto del sistema

#### **Estados:**
- **Activo**: Disponible para usar
- **Usado**: Ya redimido en establecimiento
- **Expirado**: Venció sin usar

#### **Redención:**
- Cliente muestra QR del cupón
- Personal escanea QR único del cupón
- Sistema valida y marca como usado

### **5. CONFIGURACIÓN GENERAL DEL SISTEMA**

#### **Información Empresarial:**
- Nombre de la empresa
- URL del logo corporativo
- Información de contacto (teléfono, dirección)
- Términos y condiciones
- Política de privacidad

#### **Tema Visual:**
- Color primario del sistema
- Color secundario
- Estilos y branding personalizable

---

## 📁 ESTRUCTURA ACTUAL

### **Directorio del Proyecto:**
```
src/
├── app/                           # Next.js App Router
│   ├── (auth)/login/             # Autenticación
│   ├── client/                   # 🆕 SPA Version
│   ├── classicapp/              # 📱 Classic Version
│   ├── admin/                   # Panel administrativo
│   ├── superadmin/              # Panel super admin
│   └── api/                     # API Routes
├── components/
│   ├── auth/                    # 🛡️ Seguridad (RouteGuard, RoleGuards)
│   ├── client/                  # 🎯 Componentes SPA
│   ├── admin/                   # Componentes admin
│   ├── shared/                  # Componentes compartidos
│   └── providers/               # 🆕 Providers (Redux + React Query)
├── hooks/
│   ├── queries/                 # 🆕 React Query hooks
│   ├── useAuth.ts              # Autenticación
│   ├── useAuthManager.ts       # Gestión de auth
│   └── use-*.ts                # Hooks utilitarios
├── lib/
│   ├── api/                    # 🆕 Funciones API reutilizables
│   │   ├── user.ts
│   │   └── coupons.ts
│   ├── queryClient.ts          # 🆕 Configuración React Query
│   ├── supabase/               # Cliente Supabase
│   └── utils/                  # Utilidades
├── store/                      # 🔄 Redux Store (simplificado)
│   ├── slices/
│   │   ├── authSlice.ts        # Solo datos críticos de auth
│   │   ├── uiSlice.ts         # Estado de UI
│   │   └── settingsSlice.ts   # Configuraciones del sistema
│   └── hooks/                  # Hooks tipados Redux
└── types/
    └── database.ts             # Tipos de Supabase
```

### **Estado de Limpieza:**
✅ **Eliminados (hooks obsoletos):**
- `use-app-actions-new.ts`
- `use-app-state.ts`
- `use-instant-navigation.ts`
- `useUserData.ts`
- `useAuthStore.ts`

✅ **Migrados:**
- `useAuthStore` → `useAuthCheck`
- SPAAppShell usa hooks de Redux directamente

---

## 🎯 ESTRUCTURA FINAL ESPERADA

### **Cliente SPA (/client) - Módulos Principales:**

#### **1. Vista de Inicio (HomeView)**
```typescript
// Datos mostrados:
- Visitas actuales del usuario
- Giros disponibles para ruleta
- Racha actual y progreso
- Actividad reciente (últimos check-ins)
- Placeholder si no hay datos: "¡Comienza tu aventura!"
```

#### **2. Vista de Rachas (StreakView)**
```typescript
// Estados visuales:
- Sin racha: Imagen motivacional "Inicia tu racha"
- Racha activa: Progreso visual + días restantes
- Meta de racha: Imagen configurable desde admin
- Historial de rachas completadas
```

#### **3. Vista de Actividad Reciente**
```typescript
// Lista de check-ins:
- Fecha y hora del check-in
- Sucursal donde se hizo
- Giros otorgados
- Placeholder: Imagen cuando no hay visitas
```

#### **4. Vista de Cupones (CouponsView)**
```typescript
// Secciones:
- Cupones activos (disponibles para usar)
- Cupones usados (historial)
- Placeholder sin cupones: "Aún no tienes cupones activos... 
  pero el fuego apenas comienza. ¡Muestra tu QR y prepárate para ganar!"

// Componente de Cupón:
- Título del premio
- Fecha de validez
- Código único
- Botón "Reclamar" → Desplegable con QR del cupón
```

#### **5. Vista de Perfil (ProfileView)**
```typescript
// Secciones:
- Imagen de perfil (editable)
- Datos personales: nombre, fecha nacimiento, teléfono
- Edición de datos (incluye cambio de contraseña)
- Botón cerrar sesión
- Área de peligro: "Borrar cuenta" (soft delete)
```

#### **6. Componente de Check-in**
```typescript
// Funcionalidad:
- Botón en menú principal
- Genera QR personal con parámetros de seguridad
- Modal/Sheet que muestra QR al verificador
- Validación y feedback de check-in exitoso
```

#### **7. Vista de Ruleta (RouletteView)**
```typescript
// Funcionalidad:
- Muestra giros disponibles
- Animación de ruleta virtual
- Respeta cooldown entre giros
- Genera cupones automáticamente al ganar
- Feedback visual de premio ganado
```

### **Compartición con Classic App:**
```typescript
// Módulos compartidos entre SPA y Classic:
- Componentes de cupones (reutilizar existentes)
- Lógica de QR generation/validation
- Componentes de perfil
- Utilidades de fecha/formato
- Componentes de UI base
```

---

## 📊 ESTADO DE IMPLEMENTACIÓN

### **✅ COMPLETADO:**
1. **Arquitectura Híbrida**: Redux + React Query configurado
2. **Sistema de Seguridad**: Middleware + RouteGuards por rol
3. **API Layer**: Funciones reutilizables para user y coupons
4. **Providers**: Sistema combinado funcionando
5. **Limpieza**: Hooks obsoletos eliminados
6. **Base SPA**: Estructura y navegación básica

### **🔄 EN PROGRESO:**
- Documentación completa (este archivo)
- Migración de componentes a React Query

### **⏳ PENDIENTE:**
1. **API Functions**: checkins, streaks, ruleta
2. **Query Hooks**: para todos los módulos de datos
3. **Componentes SPA**: Implementar las 7 vistas principales
4. **Compartición**: Extraer módulos reutilizables
5. **Classic App**: Implementar versión tradicional
6. **Testing**: Validación de funcionalidades
7. **Performance**: Optimización y caching

---

## 🚀 ROADMAP MVP

### **FASE 1: Datos y Queries** (2-3 días)
- [ ] API functions para checkins, streaks, ruleta
- [ ] Query hooks completos para todos los módulos
- [ ] Testing de todas las queries

### **FASE 2: Vistas Principales SPA** (5-7 días)
- [ ] HomeView con datos dinámicos
- [ ] StreakView con lógica completa
- [ ] CouponsView con gestión de estados
- [ ] ProfileView con edición
- [ ] RouletteView funcional
- [ ] Check-in QR component

### **FASE 3: Classic App** (3-4 días)
- [ ] Extraer componentes compartidos
- [ ] Implementar versión clásica
- [ ] Cross-navigation entre versiones

### **FASE 4: Polish y Testing** (2-3 días)
- [ ] Placeholders y estados vacíos
- [ ] Optimización de performance
- [ ] Testing integral
- [ ] Documentación de usuario

---

## 📝 NOTAS TÉCNICAS

### **Patrones a Seguir:**
```typescript
// ✅ BUENAS PRÁCTICAS:
// 1. Redux solo para estado crítico
const authState = useSelector(selectAuth)

// 2. React Query para datos dinámicos
const { data: userProfile } = useUserProfile(userId)

// 3. API functions reutilizables
const profile = await getUserProfile(userId)

// 4. Componentes pequeños y enfocados
<UserCard user={profile} />

// 5. Loading y error states consistentes
if (isLoading) return <Spinner />
if (error) return <ErrorMessage />
```

### **Consideraciones Importantes:**
- **Performance**: Cache agresivo para datos estáticos, dinámico para datos cambiantes
- **Offline**: Considerar PWA para check-ins offline
- **Security**: Validación de QRs con timestamps y firma digital
- **Scalability**: Arquitectura modular para múltiples empresas
- **UX**: Feedback inmediato en todas las acciones

---

**📌 Este documento es la fuente de verdad para el desarrollo del proyecto REWAPP SPA. Debe actualizarse con cada cambio significativo en la arquitectura o funcionalidades.**
