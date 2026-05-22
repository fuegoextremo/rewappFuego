# Proposal: Cupón de Bienvenida Configurable

**Change ID**: `add-welcome-coupon`
**Date**: 2026-05-21
**Status**: Pending Approval

---

## Why

Actualmente no existe mecanismo para incentivar el registro de nuevos usuarios con un beneficio inmediato. El flujo de registro completa el perfil y lleva al usuario directamente a la app cliente sin ningún premio de entrada.

Agregar un cupón de bienvenida configurable permite:
- Aumentar la conversión del registro ofreciendo un beneficio tangible desde el primer momento.
- Darle al administrador control total sobre qué premio se otorga, si está activo, y por cuánto tiempo es válido el cupón o la campaña.
- Reutilizar toda la infraestructura existente de cupones (escaneo, canje, historial, reportes) sin duplicar lógica.

---

## What Changes

### Base de datos
- **`user_profiles`**: agregar columna `welcome_coupon_granted BOOLEAN DEFAULT FALSE` para registrar si ya se entregó el cupón al usuario (evita duplicados sin consultas adicionales).
- **Nueva función RPC `grant_welcome_coupon(p_user UUID)`**: otorga el cupón de bienvenida de forma atómica, verificando que la feature esté activa, que la campaña no haya vencido, y que el usuario no haya recibido uno antes. Inserta en `coupons` con `source = 'welcome'`.
- **`system_settings`**: agregar 5 claves nuevas en categoría `general`:
  - `welcome_coupon_enabled` — `'true'` | `'false'`
  - `welcome_coupon_prize_id` — UUID del premio a otorgar
  - `welcome_coupon_expiry_mode` — `'days'` | `'fixed_date'`
  - `welcome_coupon_expiry_days` — número de días desde el registro (ej. `'30'`)
  - `welcome_coupon_expiry_date` — fecha ISO tope del cupón (ej. `'2026-12-31'`)
  - `welcome_coupon_campaign_end` — fecha ISO después de la cual ya no se otorgan cupones nuevos

### Backend / lógica de negocio
- **`src/app/auth/callback/route.ts`**: después de confirmar que el perfil está completo (o al completarse en el WelcomeWizard), llamar a `grant_welcome_coupon` via RPC. Si el RPC retorna error, loguear y continuar — no bloquear el flujo de login.
- **`src/app/welcome/`** (WelcomeWizard): al completar el wizard y guardar perfil por primera vez, disparar `grant_welcome_coupon`. Mostrar un toast de bienvenida si se otorgó el cupón.

### Admin / Superadmin UI
- **`EmpresaSection`** (admin y superadmin): agregar sub-sección "Cupón de Bienvenida" con:
  - Toggle on/off (`welcome_coupon_enabled`)
  - Selector de premio (`welcome_coupon_prize_id`) — dropdown con premios activos
  - Selector de modo de expiración: radio "Por días" / "Fecha fija"
  - Campo número de días (visible si modo = 'days')
  - Date picker para expiración del cupón (visible si modo = 'fixed_date')
  - Date picker para fin de campaña (`welcome_coupon_campaign_end`) — fecha límite para otorgar nuevos cupones

### Reglas de negocio clave
1. Si `welcome_coupon_enabled = false` → no se otorga ningún cupón.
2. Si `welcome_coupon_campaign_end` ha pasado → no se otorgan más cupones nuevos (los ya otorgados siguen siendo válidos).
3. Si `welcome_coupon_expiry_mode = 'fixed_date'` y `welcome_coupon_expiry_date` ya pasó → el RPC rechaza la creación sin insertar nada. La feature se auto-deshabilita al vencer la fecha: no se crean cupones nacidos expirados ni se requiere intervención del administrador.
4. El cupón solo se otorga en el **evento de registro**, no en logins de usuarios existentes. El callback verifica que `user.created_at` sea reciente (< 10 min) antes de llamar al RPC. Esto garantiza que activar la feature no afecte retroactivamente a cuentas antiguas.
5. El check de duplicado usa `user_profiles.welcome_coupon_granted` — una columna booleana simple, sin consultas adicionales.
6. El cupón se comporta exactamente igual que uno de ruleta o racha: aparece en la bandeja del cliente, se escanea con QR, se canjea en sucursal.

---

## Impact

### Archivos afectados
| Archivo | Tipo de cambio |
|---------|---------------|
| `supabase/migrations/049_welcome_coupon.sql` | Nuevo — columna + función RPC + system_settings |
| `src/app/auth/callback/route.ts` | Modificado — llamar RPC tras perfil completo |
| `src/app/welcome/page.tsx` o WelcomeWizard | Modificado — llamar RPC al guardar perfil |
| `src/components/admin/settings/EmpresaSection.tsx` | Modificado — nueva sub-sección UI |
| `src/app/superadmin/sistema/components/EmpresaSection.tsx` | Modificado — misma sub-sección UI |
| `src/constants/default-settings.ts` | Modificado — nuevas keys en SystemSettings |

### Usuarios afectados
- **Nuevos usuarios**: reciben cupón automáticamente al completar perfil (si la feature está activa).
- **Usuarios existentes**: no reciben cupón — la columna `welcome_coupon_granted` quedará `false` para usuarios previos, pero la lógica solo se dispara en el flujo de primer login/registro.
- **Administradores**: pueden activar, configurar y monitorear el cupón desde el panel de configuración.

### Sin impacto
- Flujo de canje en scanner: sin cambios — el cupón 'welcome' pasa exactamente igual que 'manual' o 'roulette'.
- Sistema de rachas: sin cambios.
- Usuarios existentes con `welcome_coupon_granted = false`: para proteger contra retroactividad indeseada, la RPC verifica que el usuario se haya registrado **después** de que la feature esté activa, o alternativamente simplemente marca `granted = true` si se dispara y ya existe, sin crear duplicado.
