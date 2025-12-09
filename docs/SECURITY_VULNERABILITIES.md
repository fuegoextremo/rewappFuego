# Vulnerabilidades de Seguridad - REWAPP

> Documento generado: 9 de diciembre de 2025  
> Estado: Auditoría en progreso

---

## Resumen Ejecutivo

| Riesgo | Cantidad | Estado |
|--------|----------|--------|
| ALTO | 3 | ✅ Corregidas |
| MEDIO | 4 | ⚠️ Pendientes |
| BAJO | 5 | 📋 Backlog |

---

## Vulnerabilidades Corregidas

### ✅ CRÍTICA #1: API `/api/checkin` sin autenticación (IDOR)

**Commit:** `d03d34e`  
**Archivo:** `src/app/api/checkin/route.ts`

**Problema:** La API aceptaba `user_id` del body sin verificar autenticación, permitiendo a un atacante falsificar check-ins para cualquier usuario.

**Solución:** Verificar JWT con `getUser()` y usar el ID del token autenticado, ignorando el `user_id` del body.

---

### ✅ CRÍTICA #2: API `/api/branches` expuesta sin autenticación

**Commit:** `d03d34e`  
**Archivo:** `src/app/api/branches/route.ts`

**Problema:** Cualquier persona podía listar todas las sucursales sin autenticación.

**Solución:** Requerir autenticación JWT para acceder a la lista de sucursales.

---

### ✅ CRÍTICA #3: Middleware usa `getSession()` en lugar de `getUser()`

**Commit:** `d03d34e`  
**Archivo:** `src/middleware.ts`

**Problema:** `getSession()` solo lee la cookie local sin verificar el JWT contra el servidor, vulnerable a manipulación.

**Solución:** Cambiar a `getUser()` que verifica el JWT contra el servidor de Supabase.

---

## Vulnerabilidades Pendientes (MEDIO)

### ⚠️ MEDIO #1: Política de contraseñas débil

**Archivo:** `src/lib/validations/auth.ts`  
**Riesgo:** Contraseñas fáciles de adivinar  
**Esfuerzo:** Bajo

**Problema:**
```typescript
export const passwordSchema = z.string().min(6, '...')
// Solo requiere 6 caracteres, sin requisitos de complejidad
```

**Solución recomendada:**
```typescript
export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un caracter especial')
```

**Nota:** El archivo `validation.ts` ya requiere 8 caracteres para cambio de contraseña - unificar criterios.

---

### ⚠️ MEDIO #2: Sin headers de seguridad HTTP

**Archivo:** `next.config.mjs`  
**Riesgo:** XSS, Clickjacking, MIME sniffing  
**Esfuerzo:** Bajo

**Problema:** No hay Content-Security-Policy, X-Frame-Options, ni otros headers de seguridad.

**Solución recomendada en `next.config.mjs`:**
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { 
          key: 'Strict-Transport-Security', 
          value: 'max-age=31536000; includeSubDomains' 
        },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://wapzrqysraazykcfmrhd.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co"
        }
      ],
    },
    // Mantener configuración existente para .riv
    {
      source: '/:path*.riv',
      headers: [
        { key: 'Content-Type', value: 'application/octet-stream' },
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ]
}
```

---

### ⚠️ MEDIO #3: Sin Rate Limiting

**Archivos:** Todas las rutas API  
**Riesgo:** Brute force, DoS  
**Esfuerzo:** Medio

**Problema:** No hay límites de tasa en endpoints de autenticación o APIs sensibles.

**Solución recomendada con Upstash:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 requests por minuto
})

// En la API:
const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
const { success } = await ratelimit.limit(ip)
if (!success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
}
```

**Alternativa sin dependencias externas:** Usar Supabase Edge Functions con rate limiting nativo.

---

### ⚠️ MEDIO #4: dangerouslySetInnerHTML con CSS dinámico

**Archivo:** `src/app/client/layout.tsx`  
**Riesgo:** XSS potencial (bajo en este caso)  
**Esfuerzo:** Bajo

**Problema:**
```tsx
<style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
```

**Análisis:** El `criticalCSS` viene de `generateCriticalCSS()` que genera CSS con valores HSL numéricos. El riesgo es BAJO porque los valores pasan por conversión hexadecimal y solo se insertan números.

**Solución preventiva en `src/lib/server/system-settings.ts`:**
```typescript
function sanitizeHex(hex: string): string {
  const clean = hex.replace(/[^0-9A-Fa-f#]/g, '')
  return /^#?[0-9A-Fa-f]{6}$/.test(clean) ? clean : '#000000'
}

export function generateCriticalCSS(settings: SystemSettings): string {
  const primaryHSL = hexToHSL(sanitizeHex(settings.company_theme_primary))
  const secondaryHSL = hexToHSL(sanitizeHex(settings.company_theme_secondary))
  // ...
}
```

---

## Vulnerabilidades de Bajo Riesgo (Backlog)

### 📋 BAJO #1: Console.logs con información de usuario

**Archivos:** Múltiples (providers, middleware)  
**Mitigación existente:** `removeConsole: true` en producción

**Recomendación:** El `RealtimeManager` ya sanitiza IDs en logs - aplicar el mismo patrón en otros lugares.

---

### 📋 BAJO #2: Middleware solo protege `/admin/*`

**Archivo:** `src/middleware.ts`

**Problema:**
```typescript
export const config = {
  matcher: '/admin/:path*', // Solo protege /admin
}
```

Las rutas `/superadmin/*` y `/client/*` no pasan por el middleware.

**Solución:**
```typescript
export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*', '/client/:path*']
}

// Agregar al ROUTE_PERMISSIONS:
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/superadmin': ['superadmin'],
  '/superadmin/dashboard': ['superadmin'],
  '/superadmin/users': ['superadmin'],
  '/client': ['client', 'verifier', 'manager', 'admin', 'superadmin'],
  // ...rutas existentes
}
```

---

### 📋 BAJO #3: Validación inconsistente de contraseñas

**Archivos:** `auth.ts` vs `validation.ts`

- `auth.ts`: `min(6)` para registro
- `validation.ts`: `min(8)` para cambio de contraseña

**Recomendación:** Unificar en 8 caracteres mínimo con complejidad.

---

### 📋 BAJO #4: Sin protección CSRF explícita

**Contexto:** Next.js con cookies `SameSite=Lax` provee protección básica. Las APIs usan JWT en cookies con flags seguros.

**Recomendación:** Para acciones críticas (cambio de email, eliminación de cuenta), considerar tokens CSRF adicionales.

---

### 📋 BAJO #5: Variables de entorno

**Estado actual:** `.env.local` en `.gitignore` (correcto)

**Recomendaciones:**
- Rotar `QR_SECRET_KEY` periódicamente
- Considerar usar un vault (Doppler, Infisical, HashiCorp Vault)
- Habilitar MFA para usuarios admin en Supabase Auth

---

## Recomendaciones de Hardening Adicionales

### Auditoría automatizada
```bash
npm install --save-dev eslint-plugin-security
```

### Monitoreo
- Implementar logging de eventos de seguridad
- Alertas para múltiples intentos fallidos de login
- Monitorear uso anómalo de APIs

### Supabase Security
- Habilitar MFA para usuarios admin
- Revisar RLS policies periódicamente
- Usar `auth.jwt()` en funciones PostgreSQL para validar roles

---

## Prioridad de Corrección

| Prioridad | Vulnerabilidad | Esfuerzo |
|-----------|----------------|----------|
| 1 | Headers de seguridad HTTP | Bajo |
| 2 | Política de contraseñas | Bajo |
| 3 | Sanitización CSS | Bajo |
| 4 | Extender middleware | Medio |
| 5 | Rate limiting | Medio |

---

## Historial de Cambios

| Fecha | Commit | Descripción |
|-------|--------|-------------|
| 2025-12-09 | `d03d34e` | Corregir IDOR en /api/checkin, auth en /api/branches, getUser en middleware |

---

*Última actualización: 9 de diciembre de 2025*
