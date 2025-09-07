# Sistema de Seguridad - RewardApp

## 📋 Resumen del Sistema

Hemos implementado un sistema de seguridad robusto de **doble capa** que combina:
1. **Middleware de servidor** (primera línea de defensa)
2. **RouteGuard de cliente** (segunda línea de defensa)

## 🛡️ Componentes del Sistema

### 1. Middleware (`middleware.ts`)
- **Propósito**: Verificación JWT y redirección básica por roles
- **Alcance**: Se ejecuta en el servidor antes de cada petición
- **Funcionalidad**:
  - Verifica sesión JWT de Supabase
  - Aplica redirecciones automáticas según roles
  - No consulta la base de datos (para mejor rendimiento)

### 2. RouteGuard (`/components/auth/RouteGuard.tsx`)
- **Propósito**: Protección granular de páginas y componentes
- **Alcance**: Se ejecuta en el cliente para validación detallada
- **Funcionalidad**:
  - Verifica autenticación de usuario
  - Consulta rol desde `user_profiles` table
  - Redirige según permisos específicos
  - Maneja estados de carga y error

### 3. Componentes Especializados (`/components/auth/RoleGuards.tsx`)
- `ClientGuard`: Permite todos los roles autenticados
- `AdminGuard`: Solo personal admin (verifier, manager, admin, superadmin)
- `SuperAdminGuard`: Solo superadmin
- `StaffGuard`: Solo personal (verifier, manager, admin)
- `ManagerGuard`: Solo gerencia (manager, admin, superadmin)

## 🚦 Flujo de Seguridad

### Acceso a Página Protegida:
1. **Middleware** verifica JWT y hace redirección básica
2. **RouteGuard** verifica rol específico en la BD
3. Si no autorizado → redirige a dashboard correspondiente
4. Si autorizado → muestra contenido

### Mapeo de Redirects por Rol:
```typescript
'client'     → '/client'
'verifier'   → '/admin/dashboard'
'manager'    → '/admin/dashboard'
'admin'      → '/admin/dashboard'
'superadmin' → '/superadmin/dashboard'
```

## 🔧 Implementación Actual

### Páginas Protegidas:
- ✅ `/client/*` - Protegido con `ClientGuard`
- ✅ `/admin/*` - Protegido con `AdminGuard` (layout)
- ✅ `/superadmin/*` - Protegido con `SuperAdminGuard` (layout)

### Arquitectura Dual:
- **SPA Principal** (`/client`) - Experiencia Redux + RouteGuard
- **App Clásica** (`/classicapp`) - Fallback tradicional Next.js

## 🎯 Uso Práctico

### Proteger una página individual:
```tsx
import { AdminGuard } from '@/components/auth/RoleGuards'

export default function AdminOnlyPage() {
  return (
    <AdminGuard>
      <div>Contenido solo para admins</div>
    </AdminGuard>
  )
}
```

### Proteger con roles específicos:
```tsx
import { RouteGuard } from '@/components/auth/RouteGuard'

export default function ManagerPage() {
  return (
    <RouteGuard allowedRoles={['manager', 'admin', 'superadmin']}>
      <div>Contenido para gerencia</div>
    </RouteGuard>
  )
}
```

### Personalizar redirección:
```tsx
<RouteGuard 
  allowedRoles={['admin']} 
  redirectTo="/unauthorized"
  fallbackComponent={<CustomLoader />}
>
  <SecretContent />
</RouteGuard>
```

## ✅ Ventajas del Sistema

1. **Doble Protección**: Servidor + Cliente
2. **Granularidad**: Control por página/componente
3. **Flexibilidad**: Guards predefinidos + RouteGuard customizable
4. **Performance**: Middleware sin DB queries
5. **UX**: Estados de carga personalizables
6. **Debugging**: Logs detallados en consola

## 🔍 Logs de Seguridad

El sistema genera logs informativos:
- `🚫 No hay sesión válida, redirigiendo a login`
- `🚫 Rol 'client' no autorizado. Roles permitidos: ['admin']`
- `✅ Usuario autorizado con rol: admin`
- `❌ Error en verificación de seguridad: [detalle]`

## 🧪 Testing del Sistema

Para probar la seguridad:
1. Intentar acceder a `/admin/dashboard` con rol `client`
2. Verificar redirección automática a `/client`
3. Intentar acceder a `/superadmin` con rol `admin`
4. Verificar redirección a `/admin/dashboard`

## 🚀 Estado de Implementación

**✅ COMPLETADO:**
- Middleware JWT simplificado
- RouteGuard con verificación de BD
- Guards especializados por rol
- Protección en layouts principales
- Sistema de redirects por rol
- Doble arquitectura (SPA + Classic)

**🎯 PRODUCCIÓN READY:**
El sistema está listo para producción con seguridad robusta y experiencia de usuario optimizada.
