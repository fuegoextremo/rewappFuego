# Tasks: add-welcome-coupon

**Change ID**: `add-welcome-coupon`
**Status**: Pending

---

## Fase 1 — Base de datos

### TASK-001: Migración `049_welcome_coupon.sql`
- [ ] Agregar columna `welcome_coupon_granted BOOLEAN DEFAULT FALSE NOT NULL` a `user_profiles`
- [ ] Insertar 6 claves en `system_settings` (ON CONFLICT DO NOTHING):
  - `welcome_coupon_enabled` → `'false'` (general)
  - `welcome_coupon_prize_id` → `''` (general)
  - `welcome_coupon_expiry_mode` → `'days'` (general)
  - `welcome_coupon_expiry_days` → `'30'` (general)
  - `welcome_coupon_expiry_date` → `''` (general)
  - `welcome_coupon_campaign_end` → `''` (general)
- [ ] Crear función RPC `grant_welcome_coupon(p_user_id UUID) RETURNS JSONB`
  - Leer settings desde `system_settings`
  - Validar: feature activa, campaign_end no pasado, usuario no tiene `welcome_coupon_granted = true`
  - Calcular `expires_at` según `expiry_mode`
  - `INSERT INTO coupons (user_id, prize_id, expires_at, source) VALUES (p_user_id, ..., ..., 'welcome')`
  - `UPDATE user_profiles SET welcome_coupon_granted = true WHERE id = p_user_id`
  - Retornar `{"success": true}` o `{"success": false, "reason": "..."}`
- [ ] Aplicar migración en producción (`mcp_supabase_execute_sql`)

---

## Fase 2 — Tipos y constantes

### TASK-002: `src/constants/default-settings.ts`
- [ ] Agregar al tipo `SystemSettings`:
  ```ts
  welcome_coupon_enabled?: string
  welcome_coupon_prize_id?: string
  welcome_coupon_expiry_mode?: string
  welcome_coupon_expiry_days?: string
  welcome_coupon_expiry_date?: string
  welcome_coupon_campaign_end?: string
  ```
- [ ] Agregar valores por defecto en `DEFAULT_SETTINGS`:
  ```ts
  welcome_coupon_enabled: 'false',
  welcome_coupon_prize_id: '',
  welcome_coupon_expiry_mode: 'days',
  welcome_coupon_expiry_days: '30',
  welcome_coupon_expiry_date: '',
  welcome_coupon_campaign_end: '',
  ```

---

## Fase 3 — UI de configuración

### TASK-003: `src/components/admin/settings/EmpresaSection.tsx`
- [ ] Agregar estado local para las 6 nuevas keys en `formData`
- [ ] Agregar las 6 keys al objeto pasado a `handleSave`
- [ ] Agregar sub-sección "Cupón de Bienvenida" antes del botón Guardar:
  - `<Switch>` para `welcome_coupon_enabled`
  - Dropdown `<Select>` de premios activos para `welcome_coupon_prize_id` (fetch a prizes donde `is_active = true`)
  - `<RadioGroup>` "Por días" / "Fecha fija" para `welcome_coupon_expiry_mode`
  - `<Input type="number">` visible solo si modo = 'days'
  - `<Input type="date">` para `welcome_coupon_expiry_date` visible solo si modo = 'fixed_date'
  - `<Input type="date">` para `welcome_coupon_campaign_end` siempre visible

### TASK-004: `src/app/superadmin/sistema/components/EmpresaSection.tsx`
- [ ] Aplicar exactamente los mismos cambios que TASK-003 (archivo independiente)

---

## Fase 4 — Lógica de negocio

### TASK-005: `src/app/auth/callback/route.ts`
- [ ] Después de confirmar perfil completo (rama `isComplete === true`), verificar que el usuario es nuevo:
  ```ts
  const isNewUser = user.created_at
    ? Date.now() - new Date(user.created_at).getTime() < 10 * 60 * 1000
    : false
  ```
- [ ] Solo si `isNewUser === true`, llamar RPC:
  ```ts
  await supabase.rpc('grant_welcome_coupon', { p_user_id: userId })
  ```
  - Envolver en try/catch — si falla, loguear y continuar sin bloquear el redirect
  - No manejar la respuesta del RPC en el callback (fire-and-forget)

### TASK-006: WelcomeWizard (`src/app/welcome/` o `src/components/auth/WelcomeWizard.tsx`)
- [ ] Identificar el punto exacto donde se guarda el perfil completado por primera vez
- [ ] Después de un guardado exitoso, llamar:
  ```ts
  await supabase.rpc('grant_welcome_coupon', { p_user_id: userId })
  ```
- [ ] Mostrar toast de bienvenida si `result.success === true`:
  ```
  "¡Bienvenido! Tienes un cupón esperándote."
  ```
- [ ] Si falla, no mostrar error al usuario — solo loguear

---

## Fase 5 — Verificación

### TASK-007: Testing manual
- [ ] Crear usuario nuevo con feature activa → verificar cupón en bandeja del cliente
- [ ] Crear usuario nuevo con feature inactiva → verificar que no hay cupón
- [ ] Activar feature con `campaign_end` pasado → verificar que no se otorga cupón
- [ ] Activar feature con `expiry_mode = 'fixed_date'` y fecha pasada → verificar que el cupón se crea pero el escáner lo rechaza como expirado
- [ ] Registrar segundo login del mismo usuario → verificar que no se duplica el cupón
- [ ] Verificar que el cupón aparece en el historial de escaneos con `source = 'welcome'`
- [ ] Verificar que las configuraciones se guardan y persisten desde admin y desde superadmin

---

## Notas de implementación

- La función RPC debe ser `SECURITY DEFINER` para poder leer `system_settings` y escribir en `coupons` y `user_profiles`.
- El chequeo de `created_at < 10 min` en el callback es la barrera principal contra retroactividad. El flag `welcome_coupon_granted` es la barrera contra duplicados.
- En `fixed_date` mode, si la fecha ya pasó el RPC rechaza la operación sin crear el cupón — la feature se auto-deshabilita al vencer la fecha.
- El WelcomeWizard solo se muestra a usuarios con perfil incompleto y solo una vez; este flujo es por diseño exclusivo de nuevos registros, no requiere el chequeo de `created_at`.
