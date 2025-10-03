# ✅ Supabase Local Setup - Completado

**Fecha:** 3 de octubre de 2025  
**Estado:** EXITOSO  

---

## 🎯 Objetivo Alcanzado

Se configuró exitosamente **Supabase Local** para testing de migraciones antes de aplicarlas en producción.

---

## 🛠️ Herramientas Instaladas

### 1. Docker Desktop
- **Versión:** Latest (arm64)
- **Estado:** ✅ Instalado y corriendo
- **Comando:** `brew install --cask docker`

### 2. Supabase CLI
- **Versión:** 2.48.3 (actualizado desde 2.31.4)
- **Estado:** ✅ Instalado y configurado
- **Comando:** `brew upgrade supabase`

---

## 🔧 Migraciones Corregidas

Durante el setup se encontraron y corrigieron problemas en migraciones existentes:

### Problema Identificado
PostgreSQL **no permite cambiar nombres de parámetros** con `CREATE OR REPLACE FUNCTION`.

### Migraciones Arregladas

| Migración | Problema | Solución Aplicada |
|-----------|----------|-------------------|
| `027_fix_streak_completion_behavior.sql` | Validación innecesaria + cambio de nombre `p_spins` → `p_spins_earned` | Comentar validación + agregar `DROP FUNCTION` |
| `028_fix_system_settings_query.sql` | Cambio de nombre de parámetro sin DROP | Agregar `DROP FUNCTION IF EXISTS` |
| `029_remove_user_roles_dependency.sql` | N/A (parámetros ya coincidían) | Sin cambios necesarios |

### Patrón de Corrección

```sql
-- ANTES (fallaba):
CREATE OR REPLACE FUNCTION process_checkin(p_user uuid, p_branch uuid, p_spins_earned int)

-- DESPUÉS (funciona):
DROP FUNCTION IF EXISTS process_checkin(uuid, uuid, int);
CREATE FUNCTION process_checkin(p_user uuid, p_branch uuid, p_spins_earned int)
```

---

## 📊 Migración 031 Aplicada Exitosamente

### Cambios Realizados

```sql
-- ✅ Columna agregada
ALTER TABLE public.user_profiles ADD COLUMN email TEXT;

-- ✅ Emails sincronizados desde auth.users
UPDATE public.user_profiles up SET email = au.email FROM auth.users au WHERE up.id = au.id;

-- ✅ Índices creados
idx_user_profiles_email
idx_user_profiles_first_name
idx_user_profiles_last_name
idx_user_profiles_created_at
idx_user_profiles_search (GIN full-text)

-- ✅ Trigger actualizado
handle_new_user() ahora incluye email en INSERT
ON CONFLICT DO UPDATE sincroniza email/nombre automáticamente
```

### Verificación

```bash
# Todas las 31 migraciones aplicadas correctamente
supabase db reset
# Output: "Applying migration 031_add_email_to_user_profiles.sql..." ✅
# Output: "Finished supabase db reset on branch feature/migrate-persist-to-realtime." ✅
```

---

## 🚀 Comandos Útiles

### Iniciar Supabase Local
```bash
supabase start
```

**Output esperado:**
```
API URL: http://127.0.0.1:54321
Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54324
```

### Aplicar Migraciones
```bash
# Aplicar nuevas migraciones
supabase db reset

# O aplicar solo las nuevas
supabase db push
```

### Detener Supabase Local
```bash
supabase stop
```

### Ver Logs
```bash
supabase logs db
```

### Acceder a Studio
```bash
open http://localhost:54323
```

---

## 📝 Próximos Pasos para Paginación

Ahora que Supabase local está funcionando, podemos proceder con:

### 1. Testing de Migración 031 en Local ✅
- [x] Migración aplicada
- [x] Columna `email` agregada a `user_profiles`
- [x] Índices creados correctamente
- [x] Trigger actualizado

### 2. Generar Tipos TypeScript
```bash
# Regenerar types con nueva columna email
npm run types:generate
```

### 3. Implementar Backend (Server Actions)
```typescript
// src/app/admin/users/actions.ts
export async function getUsersPaginated(filters: UserFilters) {
  const { data } = await supabase
    .from('user_profiles')
    .select('*, check_ins(count), coupons(count)')
    .or(`first_name.ilike.%${search}%,email.ilike.%${search}%`)
    .range(start, end);
  return data;
}
```

### 4. Implementar Frontend (Componentes)
- [ ] `UserSearchBar.tsx` - Búsqueda con email
- [ ] `UserPagination.tsx` - Controles de paginación
- [ ] Actualizar `page.tsx` - Integrar paginación

### 5. Testing E2E Local
```bash
# 1. Iniciar Supabase local
supabase start

# 2. Configurar .env.local para apuntar a local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase-start>

# 3. Iniciar app en desarrollo
npm run dev

# 4. Testing de paginación en http://localhost:3000/admin/users
```

### 6. Deploy a Producción
```bash
# Aplicar migración 031 en producción
supabase db push --linked

# Verificar en Supabase Studio producción
# Desplegar código actualizado
```

---

## 🎓 Lecciones Aprendidas

### 1. **Docker es Esencial**
- Supabase local requiere Docker Desktop
- Instalación es sencilla en Mac con Homebrew
- ~500MB de espacio necesario

### 2. **Migraciones Requieren Cuidado**
- `CREATE OR REPLACE` no permite cambiar nombres de parámetros
- Usar `DROP FUNCTION IF EXISTS` cuando sea necesario
- Validaciones innecesarias pueden causar problemas

### 3. **Testing Local Ahorra Problemas**
- Detectamos bugs en migraciones 027-028 ANTES de producción
- Ciclo de testing es más rápido (segundos vs minutos)
- Mayor confianza al deploy

### 4. **Supabase CLI es Poderoso**
- `supabase db reset` aplica todas las migraciones desde cero
- `supabase start` levanta ambiente completo
- Studio local es idéntico al de producción

---

## 📚 Recursos

- **Supabase Studio Local:** http://localhost:54323
- **API Local:** http://127.0.0.1:54321
- **Database URL:** postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Plan de Paginación:** `/docs/PLAN_USERS_PAGINATION.md`
- **Migración 031:** `/supabase/migrations/031_add_email_to_user_profiles.sql`

---

## ✅ Checklist Final

- [x] Docker Desktop instalado y corriendo
- [x] Supabase CLI actualizado a v2.48.3
- [x] Supabase local inicializado
- [x] Migraciones 027-029 corregidas
- [x] Migración 031 aplicada exitosamente
- [x] Sistema listo para testing de paginación
- [ ] Types regenerados (`npm run types:generate`)
- [ ] Backend implementado
- [ ] Frontend implementado
- [ ] Testing E2E en local
- [ ] Deploy a producción

---

**¡Sistema de testing local completamente funcional!** 🚀

Ahora podemos testear cambios en local antes de aplicarlos en producción, reduciendo riesgos y acelerando el desarrollo.
