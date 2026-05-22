# Spec Delta: Welcome Coupon

**Feature**: `welcome-coupon`
**Change ID**: `add-welcome-coupon`
**Status**: Draft

---

## Scope

Este delta describe el contrato de comportamiento para el sistema de cupón de bienvenida. Cubre la base de datos, la función RPC, el flujo de registro y la configuración administrativa.

---

## Comportamiento — Sistema (EARS format)

### BD — Columna `welcome_coupon_granted`

**REQ-001**
> WHEN a new user profile is created,  
> THE SYSTEM SHALL set `welcome_coupon_granted = FALSE`.

**REQ-002**
> WHEN `grant_welcome_coupon` inserts a coupon successfully,  
> THE SYSTEM SHALL atomically set `user_profiles.welcome_coupon_granted = TRUE` for that user.

---

### RPC `grant_welcome_coupon(p_user_id UUID)`

**REQ-003**
> WHERE `system_settings.welcome_coupon_enabled = 'false'`,  
> WHEN `grant_welcome_coupon` is called,  
> THE SYSTEM SHALL return `{"success": false, "reason": "feature_disabled"}` and perform no writes.

**REQ-004**
> WHERE `welcome_coupon_campaign_end` is a non-empty ISO date string AND the current date is greater than or equal to `welcome_coupon_campaign_end`,  
> WHEN `grant_welcome_coupon` is called,  
> THE SYSTEM SHALL return `{"success": false, "reason": "campaign_ended"}` and perform no writes.

**REQ-004b**
> WHERE `welcome_coupon_expiry_mode = 'fixed_date'` AND `welcome_coupon_expiry_date` is a non-empty ISO date string AND the current date is greater than or equal to `welcome_coupon_expiry_date`,  
> WHEN `grant_welcome_coupon` is called,  
> THE SYSTEM SHALL return `{"success": false, "reason": "expiry_date_passed"}` and perform no writes.  
> *(Auto-deshabilita el otorgamiento sin necesidad de intervención del administrador.)*

**REQ-005**
> WHERE `user_profiles.welcome_coupon_granted = TRUE` for the given `p_user_id`,  
> WHEN `grant_welcome_coupon` is called,  
> THE SYSTEM SHALL return `{"success": false, "reason": "already_granted"}` and perform no writes.

**REQ-006**
> WHERE `welcome_coupon_prize_id` is empty or null,  
> WHEN `grant_welcome_coupon` is called,  
> THE SYSTEM SHALL return `{"success": false, "reason": "no_prize_configured"}` and perform no writes.

**REQ-007**
> WHERE all validation checks pass AND `welcome_coupon_expiry_mode = 'days'`,  
> WHEN `grant_welcome_coupon` is called,  
> THE SYSTEM SHALL insert a coupon with `expires_at = NOW() + INTERVAL '<welcome_coupon_expiry_days> days'` and `source = 'welcome'`.

**REQ-008**
> WHERE all validation checks pass AND `welcome_coupon_expiry_mode = 'fixed_date'` AND `welcome_coupon_expiry_date` is in the future,  
> WHEN `grant_welcome_coupon` is called,  
> THE SYSTEM SHALL insert a coupon with `expires_at = welcome_coupon_expiry_date::TIMESTAMPTZ` and `source = 'welcome'`.

> *Nota: si la fecha ya pasó, la ejecución nunca llega aquí — REQ-004b la intercepta antes.*

**REQ-009**
> WHEN `grant_welcome_coupon` completes a successful insert,  
> THE SYSTEM SHALL return `{"success": true, "coupon_id": "<uuid>"}`.

**REQ-010**
> WHEN any unexpected error occurs inside `grant_welcome_coupon`,  
> THE SYSTEM SHALL roll back all writes and propagate the exception to the caller.

---

### Flujo de autenticación

**REQ-011**
> WHEN the OAuth callback route (`/auth/callback`) determines that the user profile is complete  
> AND the user's `auth.users.created_at` is within the last 10 minutes (new registration),  
> THE SYSTEM SHALL call `grant_welcome_coupon` before redirecting.  
> *(El chequeo de `created_at` garantiza que solo aplica al evento de registro, no a logins subsecuentes.)*

**REQ-012**
> WHEN the WelcomeWizard saves a complete profile for the first time,  
> THE SYSTEM SHALL call `grant_welcome_coupon` after a successful save.

**REQ-013**
> WHEN `grant_welcome_coupon` fails or returns `success: false` during the auth flow,  
> THE SYSTEM SHALL NOT block or delay the redirect to the client app.  
> The error SHALL be logged server-side only.

**REQ-014**
> WHEN `grant_welcome_coupon` returns `success: true` from the WelcomeWizard,  
> THE SYSTEM SHALL display a toast notification:  
> `"¡Bienvenido! Tienes un cupón esperándote."`

---

### Comportamiento del cupón otorgado

**REQ-015**
> A welcome coupon SHALL behave identically to any other coupon in the system:  
> it appears in the client coupon list, generates a QR code, and is redeemable at the scanner.

**REQ-016**
> WHERE a welcome coupon has `expires_at` in the past,  
> WHEN the scanner attempts to redeem it,  
> THE SYSTEM SHALL reject the redemption with an "expired" error (existing behavior — no change required).

---

### Configuración administrativa

**REQ-017**
> WHEN an admin saves the welcome coupon settings,  
> THE SYSTEM SHALL persist all 6 keys to `system_settings` in a single `updateSystemSettings` call.

**REQ-018**
> WHEN `welcome_coupon_expiry_mode = 'days'` is selected in the UI,  
> THE SYSTEM SHALL hide the expiry date field and show the days field.

**REQ-019**
> WHEN `welcome_coupon_expiry_mode = 'fixed_date'` is selected in the UI,  
> THE SYSTEM SHALL hide the days field and show the expiry date picker.

**REQ-020**
> WHEN the prize dropdown is rendered,  
> THE SYSTEM SHALL only show prizes where `is_active = TRUE`.

---

## Schema changes

```sql
-- user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS welcome_coupon_granted BOOLEAN NOT NULL DEFAULT FALSE;

-- system_settings (6 new rows)
INSERT INTO public.system_settings (key, value, description, type, category) VALUES
  ('welcome_coupon_enabled',      'false',   'Activar cupón de bienvenida al registrarse', 'boolean', 'general'),
  ('welcome_coupon_prize_id',     '',        'UUID del premio asignado como cupón de bienvenida', 'string', 'general'),
  ('welcome_coupon_expiry_mode',  'days',    'Modo de expiración: days | fixed_date', 'string', 'general'),
  ('welcome_coupon_expiry_days',  '30',      'Días de validez del cupón desde el registro', 'number', 'general'),
  ('welcome_coupon_expiry_date',  '',        'Fecha fija de expiración del cupón (ISO date)', 'string', 'general'),
  ('welcome_coupon_campaign_end', '',        'Fecha límite para otorgar nuevos cupones de bienvenida (ISO date)', 'string', 'general')
ON CONFLICT (key) DO NOTHING;
```

---

## Dependencias

| Dependencia | Tipo | Notas |
|-------------|------|-------|
| `coupons` table | Existente | Sin modificaciones |
| `prizes` table | Existente | Solo lectura (filtro `is_active = true`) |
| `system_settings` table | Existente | 6 nuevas filas |
| `user_profiles` table | Modificada | Nueva columna `welcome_coupon_granted` |
| `updateSystemSettings` server action | Existente | Sin modificaciones (acepta keys dinámicos) |
| `useSystemSettings` hook | Existente | Sin modificaciones |

---

## Decisiones confirmadas

1. **Solo usuarios nuevos**: el cupón se otorga únicamente en el evento de registro, no en logins de usuarios existentes. El caller (`auth/callback`) verifica que `user.created_at` sea reciente (< 10 min). El WelcomeWizard solo se muestra a usuarios con perfil incompleto, por lo que este flujo ya es exclusivo de nuevos registros.

2. **`fixed_date` auto-deshabilita**: si la fecha de expiración configurada ya pasó, el RPC rechaza la creación (REQ-004b). No se crean cupones con `expires_at` en el pasado. La feature se auto-apaga al vencer la fecha sin necesidad de intervención del administrador.
