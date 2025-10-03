# 🎨 Guía Rápida: Supabase Studio Local

## 🚀 Acceder a Studio

```bash
# 1. Asegurarse que Supabase local esté corriendo
supabase start

# 2. Abrir Studio en el navegador
open http://127.0.0.1:54323
```

**URL:** http://127.0.0.1:54323

---

## 📊 Crear Usuario Admin Manualmente

### Opción 1: Usando SQL Editor en Studio (RECOMENDADO)

1. **Abrir Studio:** http://127.0.0.1:54323
2. **Ir a:** SQL Editor (icono de database en sidebar)
3. **Pegar este código:**

```sql
-- =====================================
-- CREAR USUARIO ADMIN DE PRUEBA
-- =====================================

-- 1. Crear usuario en auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin-001-0000-0000-000000000001',  -- ID fijo para admin
  'authenticated',
  'authenticated',
  'admin@rewapp.local',
  crypt('admin123', gen_salt('bf')),  -- Password: admin123
  NOW(),
  '{"first_name": "Admin", "last_name": "Principal"}',
  NOW(),
  NOW(),
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 2. El trigger handle_new_user() creará automáticamente el user_profiles con email

-- 3. Actualizar rol a admin
UPDATE public.user_profiles 
SET 
  role = 'admin',
  branch_id = (SELECT id FROM branches LIMIT 1)  -- Asigna a primera sucursal
WHERE id = 'admin-001-0000-0000-000000000001';

-- 4. Verificar que se creó correctamente
SELECT 
  up.id,
  up.email,
  up.first_name,
  up.last_name,
  up.role,
  b.name as branch_name
FROM user_profiles up
LEFT JOIN branches b ON up.branch_id = b.id
WHERE up.id = 'admin-001-0000-0000-000000000001';
```

4. **Click:** Run (o Cmd+Enter)

---

## 👤 Credenciales Creadas

Después de ejecutar el SQL anterior:

```
Email: admin@rewapp.local
Password: admin123
Rol: admin
```

---

## 🗂️ Usar Table Editor

### Ver Usuarios
1. **Ir a:** Table Editor (icono de tabla en sidebar)
2. **Seleccionar tabla:** `user_profiles`
3. **Ver datos:** Click en cualquier fila para editar

### Editar Usuario Manualmente
1. **Doble click** en la celda que quieras editar
2. **Cambiar valor**
3. **Click fuera** o Enter para guardar

### Agregar Más Usuarios
1. **Click:** "Insert row" (botón verde)
2. **Llenar campos:**
   - `id`: Generar UUID nuevo
   - `email`: Email del usuario
   - `first_name`: Nombre
   - `last_name`: Apellido
   - `role`: `admin`, `manager`, `verifier`, o `client`
   - `branch_id`: ID de sucursal (copiar de tabla branches)

---

## 🔍 Ver Qué Datos Tienes

### Query Rápido en SQL Editor:

```sql
-- Ver todos los usuarios con sus roles
SELECT 
  up.id,
  up.email,
  up.first_name || ' ' || up.last_name as nombre_completo,
  up.role,
  b.name as sucursal,
  up.created_at
FROM user_profiles up
LEFT JOIN branches b ON up.branch_id = b.id
ORDER BY up.created_at DESC;

-- Ver sucursales disponibles
SELECT id, name, address FROM branches;

-- Ver check-ins
SELECT 
  ci.id,
  up.first_name || ' ' || up.last_name as usuario,
  b.name as sucursal,
  ci.check_in_date,
  ci.spins_earned
FROM check_ins ci
JOIN user_profiles up ON ci.user_id = up.id
JOIN branches b ON ci.branch_id = b.id
ORDER BY ci.created_at DESC
LIMIT 10;
```

---

## 🎯 Script Completo de Seed (Múltiples Usuarios)

Si quieres crear varios usuarios de prueba a la vez, usa el archivo `seed.sql` que creamos:

```bash
# En tu terminal
supabase db reset
```

Esto aplicará automáticamente `/supabase/seed.sql` y creará:
- ✅ 3 Sucursales
- ✅ 1 SuperAdmin
- ✅ 1 Admin
- ✅ 1 Manager
- ✅ 1 Verificador
- ✅ 5 Clientes con actividad

**Credenciales después del seed:**
```
SuperAdmin: superadmin@rewapp.local / admin123
Admin: admin@rewapp.local / admin123
Manager: manager@rewapp.local / admin123
Verificador: verificador@rewapp.local / admin123
Clientes: cliente1@test.com - cliente5@test.com / cliente123
```

---

## 🛠️ Comandos Útiles de Studio

### Shortcuts en SQL Editor
- **Run Query:** `Cmd + Enter` o `Ctrl + Enter`
- **Format SQL:** `Shift + Option + F`
- **Save Query:** `Cmd + S`

### Navegación
- **Table Editor:** Ver y editar datos visualmente
- **SQL Editor:** Ejecutar queries SQL custom
- **Database:** Ver schema, tablas, relaciones
- **API Docs:** Documentación auto-generada de tu API
- **Authentication:** Ver usuarios de auth.users

---

## 📝 Verificar que Email se Sincronizó

Después de crear usuario en auth.users, verifica que el trigger funcionó:

```sql
-- Verificar sincronización de email
SELECT 
  au.email as auth_email,
  up.email as profile_email,
  up.first_name,
  up.last_name,
  up.role,
  CASE 
    WHEN au.email = up.email THEN '✅ Sincronizado'
    ELSE '❌ No sincronizado'
  END as estado
FROM auth.users au
JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'admin@rewapp.local';
```

---

## 🎨 Tips de Studio

### 1. Filtros en Table Editor
- Click en header de columna → "Filter"
- Puedes filtrar por rol, email, fecha, etc.

### 2. Ordenamiento
- Click en header de columna para ordenar ASC/DESC

### 3. Búsqueda
- Usa la barra de búsqueda arriba de la tabla
- Busca por email, nombre, ID, etc.

### 4. Exportar Datos
- Click en "..." → "Export as CSV"

---

## ⚠️ Recordatorio

**Studio Local solo muestra datos de tu base de datos LOCAL**, no de producción.

Para ver datos de producción, ve a:
https://supabase.com/dashboard/project/wapzrqysraazykcfmrhd

---

## 🔄 Reset de Base de Datos

Si quieres empezar de cero:

```bash
# Opción 1: Reset con seed automático
supabase db reset

# Opción 2: Reset sin seed
supabase db reset --db-only

# Opción 3: Solo aplicar migraciones nuevas
supabase db push
```

---

**¡Ya puedes editar tu base de datos local visualmente!** 🎉

**Studio URL:** http://127.0.0.1:54323
