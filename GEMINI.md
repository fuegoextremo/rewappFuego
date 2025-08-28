📑 Documento de Proyecto — REWAPP (MVP)

1. Resumen Ejecutivo

Proyecto: REWAPP
Stack: Next.js (App Router, TypeScript) + Supabase (Auth, Postgres, Storage, RLS) + Vercel (free).
Objetivo: WebApp de recompensas multitenant (múltiples empresas), con check-ins por QR, racha de visitas, ruleta, cupones, panel administrativo y centro de escaneo.
Alcance del MVP: Todas las secciones descritas en brief inicial.
Tiempo estimado: ~6 semanas (155 h aprox).
Disponibilidad: 5 h/día × 5 días/semana (25 h/semana).

⸻

2. Decisiones Técnicas Finales
	•	1 empresa, con múltiples sucursales.
	•	Login: único por tenant. La sucursal solo se usa como dato operativo.
	•	Verificador: login normal, pero su perfil (users_profile) tiene sucursal asignada fija. Todos sus check-ins/redenciones se ligan automáticamente a esa sucursal.
	•	Admin/Gestor: pueden elegir sucursal en el centro de escaneo.
	•	Racha: configurable por tenant (número total de visitas, duración máxima en meses, umbrales con imágenes). Al expirar o completar, la racha se reinicia.
	•	Check-in: 1 por día por defecto (día calendario), con ventanas horarias configurables. Cada check-in otorga giros configurables.
	•	Ruleta: probabilidad global de ganar; si gana, premio ponderado por inventario. Transacciones server-side atómicas.
	•	Cupones: caducidad por instancia. No transferibles. Redención única con registro de quién y en qué sucursal.
	•	QR usuario: user_id|tenant_id|nonce + firma HMAC-SHA256 (clave por tenant).
	•	Centro de escaneo: página web responsiva (PWA ligera), cámara dispositivo (WebRTC).
	•	Soft delete: deleted_at y auditoría, sin pérdida histórica.
	•	Anti-fraude inicial: firma QR, rate-limiting, logging, bloqueo de reintentos.
	•	Timezone: América/México_City para todo.
	•	Backups: snapshots automáticos de Supabase + dump semanal programado.

⸻

3. Plan de Trabajo (WBS con dependencias y tiempos)

Setup
	•	Repo, entornos y Vercel – 3 h – 2025-08-25
	•	Supabase proyecto y claves – 2 h – 2025-08-25

Data Modeling & RLS
	•	Modelo multitenant (DDL) – 6 h – 2025-08-26
	•	Ajuste de modelo por sucursal asignada – 3 h – 2025-08-26
	•	Políticas RLS revisadas – 2 h – 2025-08-27
	•	Seeds y datos de prueba – 2 h – 2025-08-27

Autenticación & Roles
	•	Auth (email, Google, Facebook) – 5 h – 2025-08-28
	•	Sincronización perfiles y roles – 3 h – 2025-08-28
	•	Sincronización de perfiles con sucursal asignada – 2 h – 2025-08-28
	•	Rutas por tenant y theming – 5 h – 2025-08-29

Check-in & QR
	•	Esquema QR usuario + firma HMAC – 4 h – 2025-09-01
	•	Centro de escaneo (UI staff) – 6 h – 2025-09-01/02
	•	Centro de escaneo — atribución automática de sucursal – 3 h – 2025-09-01
	•	Endpoint check-in transaccional – 4 h – 2025-09-02
	•	Endpoint check-in — lógica de sucursal – 2 h – 2025-09-02

Cupones
	•	Modelo y emisión de cupones – 4 h – 2025-09-03
	•	Redención segura (única vez) – 4 h – 2025-09-03
	•	Redención — lógica de sucursal – 2 h – 2025-09-03
	•	QR de cupón y verificación en escaneo – 4 h – 2025-09-04

Ruleta
	•	Motor de ruleta (server) – 6 h – 2025-09-05
	•	Configuración de ruleta por tenant – 2 h – 2025-09-05
	•	UI de ruleta (cliente) – 4 h – 2025-09-08

App del Usuario
	•	Inicio (racha, giros, actividad) – 6 h – 2025-09-09
	•	QR del usuario (card modal) – 2 h – 2025-09-09
	•	Cupones (listado y detalle) – 6 h – 2025-09-10
	•	Perfil del usuario – 6 h – 2025-09-11

Panel Administrativo
	•	Dashboard (hoy, 7/30/custom) – 8 h – 2025-09-12/15
	•	Dashboard y reportes por sucursal – 3 h – 2025-09-15/18
	•	Gestión de usuarios (lista) – 6 h – 2025-09-15/16
	•	Edición de usuario (detalle) – 8 h – 2025-09-16/17
	•	Gestión de usuarios — sucursal asignada (verificadores) – 2 h – 2025-09-16
	•	Premios fijos por racha – 6 h – 2025-09-18
	•	Premios ruleta – 6 h – 2025-09-19
	•	Centro de escaneo (admin) – 4 h – 2025-09-22
	•	Configuración (superadmin) – 6 h – 2025-09-23

Seguridad & Analítica
	•	Rate limiting y logging – 4 h – 2025-09-24
	•	Consultas agregadas optimizadas – 5 h – 2025-09-24/25

QA, Docs y Lanzamiento
	•	Semilla de datos realistas y pruebas E2E – 6 h – 2025-09-26
	•	Casos de prueba por rol/sucursal – 3 h – 2025-09-26
	•	Documentación operativa – 4 h – 2025-09-29
	•	Preparación de producción – 4 h – 2025-09-30
	•	Buffer y ajustes post-go-live – 5 h – 2025-10-01/03

⸻

4. Fechas clave
	•	Inicio: 2025-08-25
	•	Fin MVP: 2025-10-03
	•	Entregables intermedios:
	•	Semana 1: Setup + Modelo + RLS
	•	Semana 2: Auth + QR + Check-in
	•	Semana 3: Cupones + Ruleta
	•	Semana 4: App usuario
	•	Semana 5: Admin panel
	•	Semana 6: QA + Go Live


# Estructura de Archivos Simplificada - REWAPP MVP
## Una Empresa con Múltiples Sucursales

## Estructura del Proyecto Next.js

```
rewapp/
├── src/
│   ├── app/                          # App Router de Next.js 13+
│   ├── components/                   # Componentes necesarios
│   ├── lib/                         # Utilidades esenciales
│   ├── hooks/                       # Custom hooks básicos
│   └── types/                       # Definiciones TypeScript
├── public/                          # Archivos estáticos básicos
└── supabase/                        # Configuración de base de datos
```

## `/src/app/` - Rutas de la Aplicación

```
app/
├── globals.css                      # Estilos globales con Tailwind
├── layout.tsx                       # Layout raíz con branding
├── page.tsx                         # Página de inicio/landing
├── not-found.tsx                    # Página 404
│
├── (auth)/                          # Rutas de autenticación
│   ├── login/page.tsx               # Login único para todos los roles
│   ├── register/page.tsx            # Registro de clientes
│   └── forgot-password/page.tsx     # Recuperar contraseña
│
├── (client)/                        # App del cliente final
│   ├── layout.tsx                   # Layout con navegación cliente
│   ├── page.tsx                     # Dashboard usuario (inicio con racha)
│   ├── roulette/page.tsx            # Página de ruleta
│   ├── coupons/                     
│   │   ├── page.tsx                 # Lista de cupones del usuario
│   │   └── [id]/page.tsx            # Detalle de cupón específico
│   └── profile/page.tsx             # Perfil del usuario
│
├── (admin)/                         # Panel administrativo
│   ├── layout.tsx                   # Layout admin con sidebar
│   ├── dashboard/page.tsx           # Dashboard con métricas
│   ├── users/
│   │   ├── page.tsx                 # Lista de usuarios con filtros
│   │   └── [id]/page.tsx            # Editar usuario y su historial
│   ├── prizes/
│   │   ├── page.tsx                 # Gestión general de premios
│   │   ├── streak/page.tsx          # Configurar premios por racha
│   │   └── roulette/page.tsx        # Configurar premios de ruleta
│   ├── scanner/page.tsx             # Centro de escaneo
│   └── settings/page.tsx            # Configuración (solo superadmin)
│
└── api/                             # API Routes
    ├── auth/                        # Endpoints de autenticación
    ├── checkin/route.ts             # Procesar check-ins
    ├── roulette/route.ts            # Girar ruleta
    ├── coupons/                     
    │   ├── route.ts                 # CRUD cupones
    │   └── redeem/route.ts          # Redimir cupón
    ├── users/route.ts               # Gestión usuarios
    ├── prizes/route.ts              # Gestión premios
    └── analytics/route.ts           # Métricas y reportes
```

## `/src/components/` - Componentes Esenciales

```
components/
├── ui/                              # Componentes base (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   ├── badge.tsx
│   └── toast.tsx
│
├── auth/
│   ├── LoginForm.tsx                # Formulario de login
│   ├── RegisterForm.tsx             # Formulario de registro
│   └── ProtectedRoute.tsx           # Protección de rutas por rol
│
├── client/                          # Componentes del cliente
│   ├── Dashboard.tsx                # Dashboard con racha y actividad
│   ├── StreakProgress.tsx           # Visualización de progreso
│   ├── UserQR.tsx                   # QR del usuario para check-in
│   ├── Roulette.tsx                 # Componente de ruleta completo
│   ├── CouponList.tsx               # Lista de cupones
│   └── CouponCard.tsx               # Tarjeta individual de cupón
│
├── admin/                           # Componentes administrativos
│   ├── AdminLayout.tsx              # Layout con navegación
│   ├── UserTable.tsx                # Tabla de usuarios
│   ├── PrizeManager.tsx             # Gestión de premios
│   ├── StatsCards.tsx               # Tarjetas de métricas
│   └── BranchFilter.tsx             # Filtro por sucursal
│
├── scanner/
│   ├── QRScanner.tsx                # Scanner de QR con cámara
│   ├── CheckinForm.tsx              # Formulario de confirmación check-in
│   └── RedemptionForm.tsx           # Formulario de redención
│
└── shared/
    ├── Header.tsx                   # Header principal
    ├── Navigation.tsx               # Navegación responsive
    ├── LoadingSpinner.tsx           # Spinner de carga
    ├── ErrorMessage.tsx             # Mensaje de error
    └── DataTable.tsx                # Tabla genérica con paginación
```

## `/src/lib/` - Utilidades Esenciales

```
lib/
├── supabase/
│   ├── client.ts                    # Cliente de Supabase
│   ├── auth.ts                      # Funciones de autenticación
│   └── types.ts                     # Tipos de base de datos
│
├── utils/
│   ├── auth.ts                      # Utilidades de autenticación
│   ├── date.ts                      # Formateo de fechas
│   ├── format.ts                    # Formateo de datos
│   ├── qr.ts                        # Generación y validación de QR
│   ├── validation.ts                # Esquemas de validación (Zod)
│   └── constants.ts                 # Constantes de la app
│
├── services/                        # Lógica de negocio
│   ├── checkin.ts                   # Lógica de check-ins
│   ├── streak.ts                    # Cálculo de rachas
│   ├── roulette.ts                  # Motor de ruleta
│   ├── coupon.ts                    # Gestión de cupones
│   └── analytics.ts                 # Cálculo de métricas
│
└── config/
    ├── database.ts                  # Configuración de DB
    ├── permissions.ts               # Roles y permisos
    └── app.ts                       # Configuración general
```

## `/src/hooks/` - Custom Hooks Básicos

```
hooks/
├── useAuth.ts                       # Hook de autenticación principal
├── useUser.ts                       # Datos del usuario actual
├── useCheckins.ts                   # Hook para check-ins
├── useRoulette.ts                   # Estado de ruleta y giros
├── useCoupons.ts                    # Hook para cupones
├── useScanner.ts                    # Hook para QR scanner
├── useToast.ts                      # Sistema de notificaciones
└── usePermissions.ts                # Hook de permisos por rol
```

## `/src/types/` - Definiciones TypeScript

```
types/
├── database.ts                      # Tipos de base de datos
├── auth.ts                          # Tipos de autenticación
├── user.ts                          # Tipos de usuario
├── checkin.ts                       # Tipos de check-in
├── roulette.ts                      # Tipos de ruleta
├── coupon.ts                        # Tipos de cupones
└── api.ts                           # Tipos de API responses
```

## `/public/` - Archivos Estáticos Básicos

```
public/
├── logo.png                         # Logo de la empresa
├── favicon.ico                      # Favicon
├── mascots/                         # Imágenes de mascota por nivel
│   ├── level-1.png
│   ├── level-2.png
│   └── level-3.png
└── prizes/                          # Imágenes de premios por defecto
    └── default-prize.png
```

## `/supabase/` - Base de Datos

```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql       # Tablas principales
│   ├── 002_rls_policies.sql         # Políticas de seguridad
│   ├── 003_functions.sql            # Funciones del servidor
│   └── 004_seed_data.sql            # Datos de prueba
└── seed.sql                         # Datos iniciales
```

## Archivos de Configuración Raíz

```
rewapp/
├── next.config.js                   # Configuración Next.js
├── tailwind.config.ts               # Configuración Tailwind
├── tsconfig.json                    # Configuración TypeScript
├── package.json                     # Dependencias
├── .env.local                       # Variables de entorno
├── components.json                  # Configuración shadcn/ui
└── middleware.ts                    # Middleware de autenticación
```

## Flujo de Datos Simplificado

**1. Check-in del Usuario:**
- Scanner (QRScanner.tsx) → API (/api/checkin) → Service (checkin.ts) → DB

**2. Giro de Ruleta:**
- Roulette.tsx → API (/api/roulette) → Service (roulette.ts) → DB

**3. Redención de Cupón:**
- Scanner → API (/api/coupons/redeem) → Service (coupon.ts) → DB

**4. Visualización de Datos:**
- Hooks (useCheckins, useCoupons) → Components → UI

Esta estructura está optimizada para el MVP, evitando over-engineering mientras mantiene la escalabilidad para futuras funcionalidades.

Seguridad por Página - Flujo Simplificado
1. Middleware Global (middleware.ts)
typescript// Valida sesión en TODAS las rutas
// Redirige a /login si no autenticado
// Permite rutas públicas: /, /login, /register
2. Layout por Sección
typescript// (client)/layout.tsx - Solo clientes
// (admin)/layout.tsx - Staff (admin, gestor, verificador)
// Cada layout valida rol apropiado
3. Componente ProtectedRoute
typescript// Usado dentro de páginas específicas
<ProtectedRoute allowedRoles={['admin', 'superadmin']}>
  <SettingsPage />
</ProtectedRoute>
4. Hook usePermissions
typescript// Para mostrar/ocultar elementos en UI
const { canEdit, canDelete } = usePermissions();
Flujo Real:

Usuario accede → Middleware verifica sesión
Layout carga → Verifica rol apropiado para la sección
Página específica → ProtectedRoute valida permisos granulares
Elementos UI → usePermissions controla visibilidad

RLS en Supabase maneja la seguridad de datos automáticamente por rol y sucursal.
Simple, en capas, y seguro.