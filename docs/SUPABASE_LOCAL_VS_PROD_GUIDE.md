# 🚀 Guía: Cómo Usar Supabase Local vs Producción

## 📋 TL;DR - Comandos Rápidos

```bash
# Desarrollo con base de datos LOCAL
npm run dev:local

# Desarrollo con base de datos PRODUCCIÓN  
npm run dev:prod

# Ver estado de Supabase local
npm run supabase:status

# Iniciar Supabase local
npm run supabase:start

# Detener Supabase local
npm run supabase:stop
```

---

## 🔍 Cómo Saber en Qué Base de Datos Estás

### Opción 1: Ver en la Terminal

```bash
npm run supabase:status
```

**Output:**
- Si está corriendo: muestra `API URL: http://127.0.0.1:54321`
- Si no está corriendo: `Error: Supabase not running`

### Opción 2: Ver en el Navegador (DevTools)

1. Abre **DevTools** (F12 o Cmd+Option+I)
2. Ve a la pestaña **Console**
3. Busca:
   ```
   Supabase URL: http://127.0.0.1:54321  ← LOCAL
   Supabase URL: https://xxx.supabase.co ← PRODUCCIÓN
   ```

### Opción 3: Ver en la UI de tu App

En tu app, el nombre mostrará:
- **LOCAL:** "REWAPP (LOCAL)"
- **PRODUCCIÓN:** "REWAPP"

---

## 🎯 Workflow Recomendado

### 1. Testing de Migraciones (SIEMPRE)

```bash
# 1. Asegúrate que Supabase local esté corriendo
npm run supabase:start

# 2. Aplica nuevas migraciones en local
supabase db reset  # Aplica TODAS desde cero
# O
supabase db push   # Solo las nuevas

# 3. Verifica en Studio local
open http://localhost:54323

# 4. Testing con tu app
npm run dev:local

# 5. Si todo funciona, aplica en producción
supabase db push --linked
```

### 2. Desarrollo de Features Nuevas

```bash
# 1. Trabajar con base local para no afectar producción
npm run supabase:start
npm run dev:local

# 2. Desarrollar y testear

# 3. Cuando esté listo, cambiar a producción
npm run dev:prod
```

### 3. Debugging de Problemas en Producción

```bash
# 1. Reproducir el problema en local
npm run supabase:start
npm run dev:local

# 2. Agregar datos de prueba en local

# 3. Debuggear con datos reales sin afectar producción
```

---

## 📂 Archivos de Configuración

### Estructura

```
.env.local              ← Archivo ACTIVO (cambia según dev:local o dev:prod)
.env.local.supabase     ← Template para LOCAL
.env.local.production   ← Template para PRODUCCIÓN
```

### Contenido de cada archivo

#### `.env.local.supabase` (LOCAL)
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (key de local)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (key de local)
NEXT_PUBLIC_APP_NAME=REWAPP (LOCAL)
```

#### `.env.local.production` (PRODUCCIÓN)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://wapzrqysraazykcfmrhd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (key de producción)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (key de producción)
NEXT_PUBLIC_APP_NAME=REWAPP
```

---

## 🔄 Cambiar entre Local y Producción

### Método 1: Usando Scripts npm (RECOMENDADO)

```bash
# Cambiar a LOCAL
npm run env:local
# Output: ✅ Usando Supabase LOCAL

# Iniciar app
npm run dev

# Cambiar a PRODUCCIÓN
npm run env:prod
# Output: ✅ Usando Supabase PRODUCCIÓN

# Reiniciar app (Ctrl+C y npm run dev)
```

### Método 2: Manualmente

```bash
# Para LOCAL
cp .env.local.supabase .env.local

# Para PRODUCCIÓN
cp .env.local.production .env.local

# Reiniciar npm run dev
```

---

## 🧪 Testing de Migración 031 (Email en user_profiles)

### 1. Verificar en Supabase Studio Local

```bash
# Abrir Studio local
open http://localhost:54323

# Navegar a: Table Editor > user_profiles
# Verificar que existe la columna "email"
```

### 2. Verificar en tu App

```bash
# 1. Asegúrate de estar en local
npm run env:local

# 2. Regenerar types de LOCAL
npm run types:generate:local

# 3. Iniciar app
npm run dev

# 4. Ir a /admin/users
# Debería ver emails en la lista (aunque vacíos sin datos)
```

### 3. Agregar Datos de Prueba

En Studio local (http://localhost:54323):

```sql
-- 1. Crear usuario de prueba en auth.users
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
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"first_name": "Test", "last_name": "User"}',
  now(),
  now()
);

-- 2. El trigger handle_new_user() debería crear automáticamente
--    el user_profiles con email incluido

-- 3. Verificar
SELECT id, first_name, last_name, email 
FROM user_profiles 
WHERE email = 'test@example.com';
```

---

## ⚠️ Cosas Importantes a Recordar

### ❌ NO hacer en LOCAL:
- ❌ No modificar datos si `.env.local` está apuntando a producción
- ❌ No olvidar cambiar a producción antes de hacer deploy
- ❌ No commitear `.env.local` (ya está en .gitignore)

### ✅ SÍ hacer:
- ✅ Siempre testear migraciones en local primero
- ✅ Verificar con `npm run supabase:status` antes de empezar
- ✅ Usar `npm run dev:local` para desarrollo con datos de prueba
- ✅ Usar `npm run dev:prod` solo para validación final

---

## 🆘 Troubleshooting

### Problema: "Error connecting to Supabase"

```bash
# Verificar que Supabase local esté corriendo
npm run supabase:status

# Si no está corriendo:
npm run supabase:start
```

### Problema: "Columna email no existe"

```bash
# Regenerar types desde local
npm run types:generate:local

# Reiniciar Next.js
# Ctrl+C y npm run dev
```

### Problema: "No veo mis datos de producción en local"

**Esto es NORMAL y ESPERADO.**

Supabase local es una base de datos VACÍA. Para trabajar con datos:

**Opción A:** Agregar datos de prueba manualmente en Studio local

**Opción B:** Hacer seed con datos de prueba
```bash
# Crear archivo supabase/seed.sql con datos de prueba
# Aplicar:
supabase db reset
```

**Opción C:** Usar producción para datos reales (cuidado!)
```bash
npm run dev:prod
```

---

## 📊 Resumen de URLs

| Servicio | LOCAL | PRODUCCIÓN |
|----------|-------|------------|
| **App** | http://localhost:3000 | https://tu-app.vercel.app |
| **Supabase API** | http://127.0.0.1:54321 | https://wapzrqysraazykcfmrhd.supabase.co |
| **Supabase Studio** | http://localhost:54323 | https://supabase.com/dashboard/project/wapzrqysraazykcfmrhd |
| **Database** | postgresql://postgres:postgres@127.0.0.1:54322/postgres | (via API) |

---

## 🚀 Próximos Pasos

Ahora que tienes Supabase local configurado:

1. ✅ **Testea la migración 031** en local
2. ✅ **Desarrolla la paginación** contra local
3. ✅ **Valida con datos de prueba**
4. ✅ **Aplica a producción** con confianza

**¡Listo para desarrollar sin miedo a romper producción!** 🎉
