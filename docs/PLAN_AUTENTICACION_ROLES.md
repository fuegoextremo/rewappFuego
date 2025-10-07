# Plan: Sistema de Autenticación por Roles con Middleware

**Fecha:** 6 de octubre de 2025  
**Rama:** `feature/supabase-local-migrations`  
**Prioridad:** Alta - Seguridad  
**Estado:** Listo para implementar

---

## 📋 Tabla de Contenidos

1. [Problema Actual](#problema-actual)
2. [Solución Propuesta](#solución-propuesta)
3. [Arquitectura](#arquitectura)
4. [Plan de Implementación](#plan-de-implementación)
5. [Testing](#testing)
6. [Rollback Plan](#rollback-plan)

---

## 🔴 Problema Actual

### Situación
Los **verificadores** tienen acceso completo a todas las rutas del admin cuando solo deberían acceder al scanner.

### Análisis de Capas de Seguridad

| Capa | Estado | Problema |
|------|--------|----------|
| **Middleware** | ⚠️ Básico | Solo verifica sesión, no rol específico |
| **AdminLayout** | ⚠️ Permisivo | Incluye 'verifier' en `ADMIN_ROLES` |
| **AdminGuard** | ⚠️ Genérico | Permite verifier en todas las rutas |
| **Sidebar** | ❌ Sin filtro | Muestra todos los links a todos los roles |
| **Páginas** | ❌ Sin guards | No verifican rol individual |

### Flujo Actual del Verificador

```
1. Login exitoso → ✅ Sesión válida
2. Middleware → ✅ Permite /admin/* (solo verifica sesión)
3. AdminLayout → ✅ 'verifier' está en ADMIN_ROLES
4. AdminGuard → ✅ 'verifier' está en allowedRoles
5. Sidebar → ❌ Muestra TODOS los links
6. Navega a /admin/users → ❌ Sin protección, ACCEDE

RESULTADO: Verificador tiene acceso total ❌
```

---

## ✅ Solución Propuesta

### Estrategia: Middleware + Sidebar Filtrado

**Fase 1: Middleware con Mapa de Permisos** (Seguridad Real)
- Validar rol específico por ruta ANTES de llegar al componente
- Centralizado en un solo lugar
- Imposible de bypassear

**Fase 2: Sidebar Filtrado por Rol** (UX Mejorada)
- Mostrar solo links a los que el usuario tiene acceso
- Prevenir confusión
- Complementa la seguridad del middleware

---

## 🏗️ Arquitectura

### Jerarquía de Roles

```
Roles y sus Permisos:

├─ client       → /client/* (no accede a admin)
├─ verifier     → /admin/scanner únicamente
├─ manager      → /admin/* (excepto settings)
├─ admin        → /admin/* (todo)
└─ superadmin   → /admin/* + /superadmin/*
```

### Mapa de Permisos por Ruta

```typescript
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  // Rutas que requieren manager o superior
  '/admin/dashboard': ['manager', 'admin', 'superadmin'],
  '/admin/users': ['manager', 'admin', 'superadmin'],
  '/admin/prizes': ['manager', 'admin', 'superadmin'],
  
  // Scanner: accesible para verifier+
  '/admin/scanner': ['verifier', 'manager', 'admin', 'superadmin'],
  
  // Settings: solo admin+
  '/admin/settings': ['admin', 'superadmin'],
}
```

### Nuevo Flujo con Middleware

```
REQUEST → Middleware
          ├─ Verifica sesión
          ├─ Obtiene rol del usuario
          ├─ Verifica permisos por ruta
          ├─ ✅ Permitir o ❌ Redirigir
          └─ Continue to Layout/Page

BENEFICIO: Protección a nivel de infraestructura
```

---

## 📝 Plan de Implementación

### Paso 1: Actualizar Middleware ⭐

**Archivo:** `middleware.ts`

#### 1.1 Agregar Mapa de Permisos

```typescript
// 📋 MAPA DE PERMISOS POR RUTA
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/admin/dashboard': ['manager', 'admin', 'superadmin'],
  '/admin/users': ['manager', 'admin', 'superadmin'],
  '/admin/prizes': ['manager', 'admin', 'superadmin'],
  '/admin/scanner': ['verifier', 'manager', 'admin', 'superadmin'],
  '/admin/settings': ['admin', 'superadmin'],
}
```

#### 1.2 Función para Verificar Permisos

```typescript
// 🔐 Verificar si el rol tiene permiso para la ruta
function hasRolePermission(pathname: string, userRole: string): boolean {
  // Normalizar pathname (remover query params y trailing slash)
  const normalizedPath = pathname.split('?')[0].replace(/\/$/, '')
  
  // Buscar permisos para la ruta exacta
  const requiredRoles = ROUTE_PERMISSIONS[normalizedPath]
  
  // Si no hay permisos definidos, denegar por seguridad
  if (!requiredRoles) {
    // Rutas no definidas: permitir solo admin+
    return ['admin', 'superadmin'].includes(userRole)
  }
  
  // Verificar si el rol del usuario está permitido
  return requiredRoles.includes(userRole)
}
```

#### 1.3 Función para Redirección Inteligente

```typescript
// 🏠 Obtener destino según rol cuando no tiene permiso
function getRoleRedirect(userRole: string): string {
  const roleRedirects: Record<string, string> = {
    'client': '/client',
    'verifier': '/admin/scanner',
    'manager': '/admin/dashboard',
    'admin': '/admin/dashboard',
    'superadmin': '/superadmin/dashboard',
  }
  
  return roleRedirects[userRole] || '/login'
}
```

#### 1.4 Actualizar Lógica Principal del Middleware

```typescript
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { pathname } = req.nextUrl
  
  // ... código de logout bypass ...
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const hasValidSession = !!session?.user
    
    // Verificación básica de sesión
    if (!hasRouteAccess(pathname, hasValidSession)) {
      const loginUrl = new URL('/login', req.url)
      if (pathname !== '/login') {
        loginUrl.searchParams.set('redirect', pathname)
      }
      return NextResponse.redirect(loginUrl)
    }
    
    // ⭐ NUEVA LÓGICA: Verificar permisos por rol para rutas /admin/*
    if (pathname.startsWith('/admin') && hasValidSession) {
      // Obtener perfil del usuario
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session!.user.id)
        .single()
      
      const userRole = profile?.role
      
      // Si no tiene rol o no tiene permiso para esta ruta
      if (!userRole || !hasRolePermission(pathname, userRole)) {
        console.log(`🚫 Acceso denegado: ${userRole} intentó acceder a ${pathname}`)
        const redirectUrl = getRoleRedirect(userRole || 'client')
        return NextResponse.redirect(new URL(redirectUrl, req.url))
      }
      
      console.log(`✅ Acceso permitido: ${userRole} → ${pathname}`)
    }
    
    // ... resto del código ...
  } catch (error) {
    // ... manejo de errores ...
  }
}
```

**Notas Importantes:**
- ✅ Clientes NUNCA llegan aquí (no acceden a `/admin/*`)
- ✅ Query a DB ya se hace en AdminLayout, no es overhead adicional significativo
- ✅ Caché de Supabase optimiza queries repetidas
- ✅ Redirección inteligente según rol

---

### Paso 2: Filtrar Sidebar por Rol

**Archivo:** `src/components/admin/Sidebar.tsx`

#### 2.1 Función para Obtener Links Visibles

```typescript
// 🔐 Filtrar links según el rol del usuario
function getVisibleLinks(userRole: string | null) {
  const allLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Usuarios", href: "/users", icon: Users },
    { name: "Premios", href: "/prizes", icon: Award },
    { name: "Scanner", href: "/scanner", icon: QrCode },
    { name: "Ajustes", href: "/settings", icon: Settings },
  ];
  
  if (!userRole) return []
  
  // Verifier: solo scanner
  if (userRole === 'verifier') {
    return allLinks.filter(link => link.href === '/scanner')
  }
  
  // Manager: todo excepto ajustes
  if (userRole === 'manager') {
    return allLinks.filter(link => link.href !== '/settings')
  }
  
  // Admin y SuperAdmin: todo
  if (userRole === 'admin' || userRole === 'superadmin') {
    return allLinks
  }
  
  return []
}
```

#### 2.2 Usar Links Filtrados en el Render

```typescript
export default function Sidebar() {
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  // ...código existente...
  
  // ⭐ Obtener links filtrados
  const visibleLinks = getVisibleLinks(userProfile?.role)
  
  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center py-2 px-1">
          {visibleLinks.map((link) => {
            // ...render de links...
          })}
          {/* Logout Button */}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full flex-col bg-white border-r border-gray-200 shadow-sm">
        {/* ...header... */}
        <nav className="flex-1 p-3">
          <div className="space-y-1">
            {visibleLinks.map((link) => {
              // ...render de links...
            })}
          </div>
        </nav>
        {/* ...actions... */}
      </div>
    </>
  );
}
```

---

### Paso 3: Opcional - Componente de Acceso Denegado

**Archivo:** `src/app/admin/unauthorized/page.tsx` (nuevo)

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Acceso Denegado</h1>
          <p className="text-gray-600">
            No tienes permisos para acceder a esta página.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/admin/scanner">
            <Button variant="default">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Scanner
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

## 🧪 Testing

### Plan de Pruebas

#### 1. Testing Manual por Rol

**Preparación:**
```bash
# Tener usuarios de prueba con diferentes roles:
- test-client@example.com (client)
- test-verifier@example.com (verifier)
- test-manager@example.com (manager)
- test-admin@example.com (admin)
```

**Test Cases:**

| Usuario | Ruta | Resultado Esperado | Acción |
|---------|------|-------------------|--------|
| **Verifier** | `/admin/scanner` | ✅ Acceso permitido | Ver scanner |
| **Verifier** | `/admin/dashboard` | ❌ Redirect a `/admin/scanner` | No ve dashboard |
| **Verifier** | `/admin/users` | ❌ Redirect a `/admin/scanner` | No ve usuarios |
| **Verifier** | `/admin/prizes` | ❌ Redirect a `/admin/scanner` | No ve premios |
| **Verifier** | Sidebar | Solo ve link "Scanner" | Un solo item |
| **Manager** | `/admin/dashboard` | ✅ Acceso permitido | Ve dashboard |
| **Manager** | `/admin/users` | ✅ Acceso permitido | Ve usuarios |
| **Manager** | `/admin/scanner` | ✅ Acceso permitido | Ve scanner |
| **Manager** | `/admin/settings` | ❌ Redirect a `/admin/dashboard` | No ve settings |
| **Manager** | Sidebar | Ve 4 items (sin Settings) | Dashboard, Usuarios, Premios, Scanner |
| **Admin** | `/admin/*` | ✅ Acceso a todo | Ve todo |
| **Admin** | Sidebar | Ve 5 items | Todos los links |
| **Client** | `/admin/*` | ❌ Redirect a `/client` | No accede a admin |
| **Client** | `/client` | ✅ Acceso permitido | Ve app cliente |

#### 2. Testing de Navegación Directa

**Propósito:** Verificar que el middleware bloquea acceso directo por URL

```bash
# Test 1: Verifier intenta acceder directamente
1. Login como verifier
2. Escribir manualmente: http://localhost:3000/admin/users
3. ESPERADO: Redirect a /admin/scanner ✅

# Test 2: Manager intenta acceder a settings
1. Login como manager
2. Escribir manualmente: http://localhost:3000/admin/settings
3. ESPERADO: Redirect a /admin/dashboard ✅

# Test 3: Cliente intenta acceder a admin
1. Login como client
2. Escribir manualmente: http://localhost:3000/admin/dashboard
3. ESPERADO: Redirect a /client ✅
```

#### 3. Testing de Console Logs

```typescript
// Al implementar, deberías ver en consola del servidor:
✅ Acceso permitido: verifier → /admin/scanner
🚫 Acceso denegado: verifier intentó acceder a /admin/users
✅ Acceso permitido: manager → /admin/dashboard
🚫 Acceso denegado: manager intentó acceder a /admin/settings
```

#### 4. Testing de Regresión

**Verificar que NO rompimos nada:**

- [ ] Clientes pueden acceder a `/client` sin problemas
- [ ] Admins pueden acceder a todo `/admin/*`
- [ ] Login y logout funcionan correctamente
- [ ] Redirección después de login funciona
- [ ] Rutas públicas (`/`, `/login`, `/register`) funcionan
- [ ] Sidebar muestra items correctos para cada rol
- [ ] Mobile navigation funciona igual que desktop

---

## 🔄 Rollback Plan

### Si algo sale mal durante implementación

#### Opción 1: Revertir Commit (Rápido)

```bash
# Ver último commit
git log --oneline -1

# Revertir cambios
git revert HEAD

# Push
git push origin feature/supabase-local-migrations
```

#### Opción 2: Deshabilitar Validación de Rol (Temporal)

```typescript
// middleware.ts - Comentar validación de rol temporalmente
export async function middleware(req: NextRequest) {
  // ... código existente ...
  
  // ⚠️ TEMPORALMENTE DESHABILITADO - REVERTIR LUEGO
  /*
  if (pathname.startsWith('/admin') && hasValidSession) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session!.user.id)
      .single()
    
    const userRole = profile?.role
    
    if (!userRole || !hasRolePermission(pathname, userRole)) {
      const redirectUrl = getRoleRedirect(userRole || 'client')
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }
  }
  */
  
  return res
}
```

#### Opción 3: Rollback Completo a Branch Anterior

```bash
# Ver branches
git branch -a

# Cambiar a branch anterior
git checkout main

# O forzar reset si es necesario
git reset --hard origin/main
```

---

## 📊 Métricas de Éxito

### KPIs a Validar

| Métrica | Antes | Objetivo | Método |
|---------|-------|----------|--------|
| **Verifier accede a /users** | ✅ Sí | ❌ No | Navegación manual |
| **Verifier ve todos los links** | ✅ Sí (5 links) | ❌ No (1 link) | Inspeccionar sidebar |
| **Manager accede a settings** | ✅ Sí | ❌ No | Navegación manual |
| **Admin accede a todo** | ✅ Sí | ✅ Sí | Navegación manual |
| **Cliente no afectado** | ✅ Normal | ✅ Normal | App cliente |
| **Performance middleware** | N/A | <100ms | Console logs |

### Criterios de Aceptación

- ✅ Verifier solo accede a `/admin/scanner`
- ✅ Verifier solo ve link "Scanner" en sidebar
- ✅ Manager accede a todo excepto `/admin/settings`
- ✅ Manager ve 4 de 5 links (sin Settings)
- ✅ Admin y SuperAdmin acceden a todo
- ✅ Admin y SuperAdmin ven todos los links
- ✅ Cliente NO afectado (puede usar app normalmente)
- ✅ Logs de consola muestran control de acceso
- ✅ No hay errores de compilación
- ✅ No hay errores en runtime

---

## 🚀 Orden de Implementación

### Secuencia Recomendada

1. **Paso 1: Actualizar Middleware** (20 min)
   - Agregar mapa de permisos
   - Implementar funciones helper
   - Actualizar lógica principal
   - Agregar logs de debug

2. **Paso 2: Testing Inicial** (10 min)
   - Verificar que compile
   - Login con diferentes roles
   - Verificar logs en consola
   - Confirmar redirects funcionan

3. **Paso 3: Actualizar Sidebar** (15 min)
   - Implementar función `getVisibleLinks()`
   - Actualizar renders mobile y desktop
   - Verificar que compile

4. **Paso 4: Testing Completo** (20 min)
   - Ejecutar todos los test cases
   - Verificar sidebar por rol
   - Probar navegación directa
   - Confirmar cliente no afectado

5. **Paso 5: Commit y Push** (5 min)
   - Commit con mensaje descriptivo
   - Push a branch
   - Verificar en GitHub

**Total estimado: ~70 minutos**

---

## 📚 Referencias

- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

---

## 📝 Notas Adicionales

### Consideraciones de Performance

- Query a `user_profiles` ya se ejecuta en `AdminLayout`
- Middleware caché de Supabase optimiza queries repetidas
- Overhead adicional: ~10-20ms por request (aceptable)

### Consideraciones de Seguridad

- Validación en servidor (middleware) es la más segura
- Guards de componente son solo UX, no seguridad
- RLS policies en Supabase complementan esta validación

### Futuras Mejoras

- [ ] Agregar caché de rol en cookie para evitar query DB
- [ ] Implementar sistema de permisos más granular (RBAC completo)
- [ ] Agregar auditoría de accesos denegados
- [ ] Agregar rate limiting por rol

---

**Preparado por:** AI Copilot  
**Fecha:** 6 de octubre de 2025  
**Versión:** 1.0  
**Estado:** ✅ Listo para implementar
