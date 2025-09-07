# 📊 DOCUMENTACIÓN DE BASE DE DATOS - ESTADO ACTUAL

> **Fuente de verdad:** `src/types/database.ts` (generado automáticamente por Supabase)
> **Fecha:** Septiembre 2025
> **Propósito:** Referencia rápida para desarrollo

## 🗃️ TABLAS PRINCIPALES

### 👤 **user_profiles**
```typescript
{
  id: string                 // PK - UUID del usuario
  first_name: string | null  // Nombre
  last_name: string | null   // Apellido  
  phone: string | null       // Teléfono
  role: string | null        // Rol (client, admin, verifier, etc.)
  branch_id: string | null   // FK a branches
  birth_date: string | null  // Fecha de nacimiento
  unique_code: string | null // Código único del usuario
  is_active: boolean | null  // Estado activo
  created_at: string | null
  updated_at: string | null
}
```

### 🔥 **check_ins**
```typescript
{
  id: string                    // PK
  user_id: string | null        // FK a user_profiles
  branch_id: string | null      // FK a branches
  verified_by: string | null    // FK a user_profiles (verificador)
  check_in_date: string | null  // Fecha del check-in
  spins_earned: number | null   // Spins ganados
  created_at: string | null
  updated_at: string | null
}
```

### 📈 **streaks**
```typescript
{
  id: string                   // PK
  user_id: string | null       // FK a user_profiles
  current_count: number | null // ⭐ CONTADOR ACTUAL DE RACHA
  max_count: number | null     // Máximo para completar racha
  last_check_in: string | null // Última fecha de check-in
  expires_at: string | null    // Cuándo expira la racha
  is_completed: boolean | null // Si completó la racha
  created_at: string | null
  updated_at: string | null
}
```

### 🎟️ **coupons**
```typescript
{
  id: string                   // PK
  user_id: string | null       // FK a user_profiles
  prize_id: string | null      // FK a prizes
  branch_id: string | null     // FK a branches
  unique_code: string | null   // Código del cupón
  source: string | null        // Origen (checkin, roulette, etc.)
  is_redeemed: boolean | null  // Si fue canjeado
  redeemed_by: string | null   // FK a user_profiles (quien canjeo)
  redeemed_at: string | null   // Cuándo fue canjeado
  expires_at: string | null    // Cuándo expira
  created_at: string | null
  updated_at: string | null
}
```

### 🎁 **prizes**
```typescript
{
  id: string                    // PK
  name: string                  // Nombre del premio
  description: string | null    // Descripción
  type: string                  // Tipo de premio
  image_url: string | null      // URL de imagen
  weight: number | null         // Peso para probabilidad en ruleta
  streak_threshold: number | null // Racha necesaria para obtenerlo
  inventory_count: number | null // Inventario disponible
  validity_days: number | null   // Días de validez del cupón
  is_active: boolean | null     // Estado activo
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}
```

### 🎰 **roulette_spins**
```typescript
{
  id: string                   // PK
  user_id: string | null       // FK a user_profiles
  prize_id: string | null      // FK a prizes (premio ganado)
  coupon_id: string | null     // FK a coupons (si generó cupón)
  spin_result: string | null   // Resultado del spin
  won_prize: boolean | null    // Si ganó premio
  created_at: string | null
}
```

### 🎯 **user_spins**
```typescript
{
  id: string                     // PK
  user_id: string | null         // FK a user_profiles (1:1 relationship)
  available_spins: number | null // ⭐ SPINS DISPONIBLES
  updated_at: string | null
}
```

### 🏢 **branches**
```typescript
{
  id: string                 // PK
  name: string               // Nombre de la sucursal
  address: string | null     // Dirección
  is_active: boolean | null  // Estado activo
  created_at: string | null
  updated_at: string | null
}
```

### ⚙️ **system_settings**
```typescript
{
  id: string                // PK
  key: string               // Clave de configuración
  value: string             // Valor de configuración
  category: string          // Categoría
  setting_type: string      // Tipo de setting
  description: string | null // Descripción
  is_active: boolean | null // Estado activo
  updated_by: string | null // FK a users (quien actualizó)
  created_at: string
  updated_at: string
}
```

## 🔧 FUNCIONES IMPORTANTES

- `process_checkin(p_user: string, p_branch: string, p_spins?: number)` - Procesar check-in
- `spin_roulette(p_user: string)` - Girar ruleta
- `grant_coupon_to_user(p_user_id: string, p_prize_id: string, p_validity_days?: number)` - Otorgar cupón
- `increment_user_spins(p_user_id: string, p_spin_amount: number)` - Incrementar spins

## 🎯 CAMPOS CLAVE PARA REDUX

### Usuario completo para el store:
```typescript
{
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string | null
  phone: string | null
  
  // Estadísticas calculadas
  total_checkins: number      // COUNT(*) from check_ins
  current_streak: number      // current_count from streaks
  available_spins: number     // available_spins from user_spins
}
```

## ⚠️ ERRORES COMUNES EVITADOS

❌ **NO usar:** `user_checkins` (no existe)
✅ **SÍ usar:** `check_ins`

❌ **NO usar:** `current_streak` en streaks
✅ **SÍ usar:** `current_count` en streaks

❌ **NO usar:** `migrations` como referencia
✅ **SÍ usar:** `database.ts` como fuente de verdad
