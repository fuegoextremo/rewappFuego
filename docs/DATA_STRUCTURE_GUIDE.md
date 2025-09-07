# REWAPP - Estructura de Datos y Lógica de Negocio

**Complemento a:** PROJECT_MASTER_GUIDE.md  
**Enfoque:** Estructura de datos, relaciones y lógica específica

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### **Tablas Principales:**

#### **user_profiles**
```sql
- id (string, FK to auth.users)
- first_name (string)
- last_name (string) 
- phone (string)
- role (string: client|verifier|manager|admin|superadmin)
- birth_date (date)
- branch_id (string, FK to branches)
- unique_code (string) -- Código QR personal
- is_active (boolean)
- created_at, updated_at
```

#### **check_ins**
```sql
- id (string)
- user_id (string, FK to user_profiles)
- branch_id (string, FK to branches)
- check_in_date (timestamp)
- spins_earned (number) -- Giros otorgados
- verified_by (string, FK to user_profiles)
- created_at, updated_at
```

#### **streaks**
```sql
- id (string)
- user_id (string, FK to user_profiles)
- current_count (number) -- Días consecutivos actuales
- max_count (number) -- Máximo histórico
- last_check_in (timestamp)
- expires_at (timestamp) -- Cuando expira la racha
- is_completed (boolean)
- created_at, updated_at
```

#### **coupons**
```sql
- id (string)
- user_id (string, FK to user_profiles)
- prize_id (string, FK to prizes)
- unique_code (string) -- Código QR del cupón
- is_redeemed (boolean)
- redeemed_at (timestamp)
- redeemed_by (string, FK to user_profiles)
- expires_at (timestamp)
- branch_id (string, FK to branches) -- Dónde se puede usar
- source (string) -- 'roulette', 'manual', etc.
- created_at, updated_at
```

#### **prizes**
```sql
- id (string)
- name (string)
- description (text)
- type (string: discount|product|service)
- value (number) -- Porcentaje o valor
- probability_weight (number) -- % probabilidad en ruleta
- is_active (boolean)
- image_url (string)
- created_at, updated_at, deleted_at
```

#### **user_spins** / **roulette_spins**
```sql
- id (string)
- user_id (string, FK to user_profiles)
- spins_available (number) -- Giros disponibles
- last_spin_at (timestamp) -- Para cooldown
- total_spins_used (number)
- created_at, updated_at
```

#### **system_settings**
```sql
- id (string)
- category (string) -- 'checkin', 'streak', 'roulette', 'general'
- key (string) -- Nombre de la configuración
- value (json) -- Valor flexible
- description (text)
- updated_at
```

---

## ⚙️ CONFIGURACIONES DEL SISTEMA

### **Categoría: 'checkin'**
```json
{
  "spins_per_checkin": 3,           // Giros por check-in
  "daily_checkin_limit": 2,         // Máximo check-ins por día
  "cooldown_hours": 4               // Horas entre check-ins
}
```

### **Categoría: 'streak'**
```json
{
  "days_to_break": 5,               // Días sin check-in para romper racha
  "days_to_expire": 90,             // Días para expirar racha (temporada)
  "streak_goal_image": "url",       // Imagen de progreso de racha
  "no_streak_image": "url"          // Imagen motivacional inicial
}
```

### **Categoría: 'roulette'**
```json
{
  "global_win_percentage": 25,      // % global de ganar
  "cooldown_seconds": 30,           // Segundos entre giros
  "max_spins_per_day": 10          // Límite de giros diarios
}
```

### **Categoría: 'general'**
```json
{
  "company_name": "Mi Empresa",
  "logo_url": "https://...",
  "primary_color": "#FF6B35",
  "secondary_color": "#2ECC71", 
  "contact_phone": "+1234567890",
  "contact_address": "Dirección física",
  "terms_url": "https://...",
  "privacy_url": "https://...",
  "default_coupon_expiry_days": 30
}
```

---

## 🔄 FLUJOS DE DATOS CRÍTICOS

### **1. Flujo de Check-in:**
```mermaid
Usuario → Genera QR → Verificador escanea → Validación → 
Registro check_in → Actualizar streak → Otorgar spins → 
Notificación usuario
```

#### **Validaciones en Check-in:**
1. QR válido y no expirado (timestamp + seguridad)
2. Usuario activo (`is_active = true`)
3. No exceder límite diario (`daily_checkin_limit`)
4. Respetar cooldown entre check-ins
5. Verificador tiene permisos

#### **Acciones Post Check-in:**
1. Crear registro en `check_ins`
2. Actualizar o crear `streak` del usuario
3. Agregar `spins_earned` a `user_spins`
4. Calcular si racha está en riesgo de romperse

### **2. Flujo de Racha (Streak):**
```mermaid
Check-in → Verificar streak existente → 
¿Dentro del período? → SÍ: Incrementar → NO: Romper y empezar nueva →
Verificar si completó objetivo → Marcar completada → Iniciar nueva
```

#### **Estados de Racha:**
- **Nueva**: Primera vez o después de romperse
- **Activa**: Dentro del período permitido
- **En Riesgo**: Cerca del límite para romperse
- **Rota**: Excedió días permitidos sin check-in
- **Completada**: Alcanzó objetivo de días consecutivos
- **Expirada**: Venció por límite de temporada

### **3. Flujo de Ruleta:**
```mermaid
Usuario tiene spins → Verifica cooldown → Ruleta gira → 
Calcula probabilidades → ¿Ganó? → SÍ: Crear cupón → NO: Consume spin
```

#### **Cálculo de Probabilidades:**
1. Verificar `global_win_percentage` del sistema
2. Si pasa filtro global, calcular premio específico
3. Cada premio tiene `probability_weight` individual
4. Algoritmo ponderado para seleccionar premio

### **4. Flujo de Cupones:**
```mermaid
Gana en ruleta → Crear cupón → Generar QR único → 
Usuario ve cupón → Decide reclamar → Muestra QR → 
Staff escanea → Validar cupón → Marcar como usado
```

---

## 📱 MÓDULOS DE CLIENTE SPA

### **Datos Requeridos por Vista:**

#### **HomeView**
```typescript
// React Query hooks necesarios:
useUserStats(userId)      // Visitas, giros disponibles
useUserStreak(userId)     // Estado de racha actual
useRecentCheckins(userId, 5) // Últimos 5 check-ins
useAvailableSpins(userId) // Giros para ruleta
```

#### **StreakView**  
```typescript
useUserStreak(userId)     // Datos completos de racha
useStreakConfig()         // Configuración de sistema
useStreakHistory(userId)  // Rachas completadas históricas
```

#### **CouponsView**
```typescript
useAvailableCoupons(userId) // Cupones activos
useUsedCoupons(userId)      // Historial de cupones
useUseCoupon()              // Mutación para usar cupón
```

#### **ProfileView**
```typescript
useUserProfile(userId)      // Datos del perfil
useUpdateProfile()          // Mutación para actualizar
useChangePassword()         // Mutación para contraseña
useDeleteAccount()          // Mutación para borrar (soft)
```

#### **RouletteView**
```typescript
useAvailableSpins(userId)   // Giros disponibles
useRouletteConfig()         // Configuración de ruleta
useSpinRoulette()           // Mutación para girar
usePrizes()                 // Lista de premios posibles
```

---

## 🔧 FUNCIONES API REQUERIDAS

### **Ya Implementadas:**
- ✅ `getUserProfile()`
- ✅ `getUserCheckins()` 
- ✅ `getUserStats()`
- ✅ `getUserCoupons()`
- ✅ `getAvailableCoupons()`
- ✅ `useCoupon()`

### **Por Implementar:**
```typescript
// Streaks
getUserStreak(userId)
updateStreak(userId, checkinData)
getStreakConfig()
getStreakHistory(userId)

// Spins/Roulette  
getAvailableSpins(userId)
addSpins(userId, amount)
spinRoulette(userId)
getRouletteConfig()
getPrizes()

// Check-ins
createCheckin(userId, branchId, verifiedBy)
validateQRCode(qrData)
generateUserQR(userId)

// System
getSystemConfig(category?)
updateSystemConfig(key, value)
```

---

## 🎨 COMPONENTES VISUALES ESPERADOS

### **Placeholders Necesarios:**
1. **Sin Check-ins**: "¡Comienza tu aventura! Muestra tu QR"
2. **Sin Cupones**: "Aún no tienes cupones activos... pero el fuego apenas comienza. ¡Muestra tu QR y prepárate para ganar!"
3. **Sin Racha**: Imagen motivacional configurable desde admin
4. **Cargando Datos**: Spinners consistentes
5. **Errores**: Mensajes amigables con acciones sugeridas

### **Estados de QR:**
1. **QR Usuario**: Para check-in (temporal, con seguridad)
2. **QR Cupón**: Para redención (único, permanente hasta uso)
3. **Scanner QR**: Para verificadores/admins

---

## 🚨 CONSIDERACIONES DE SEGURIDAD

### **QR de Usuario (Check-in):**
```typescript
// Parámetros de seguridad:
{
  userId: string,
  timestamp: number,        // Para expiración
  nonce: string,           // Número único
  signature: string        // Hash de validación
}
```

### **QR de Cupón:**
```typescript
// Datos del cupón:
{
  couponId: string,
  userId: string,
  prizeId: string,
  signature: string        // Validación de integridad
}
```

### **Validaciones:**
- QRs de check-in expiran en 5 minutos
- QRs de cupón válidos hasta fecha de expiración
- Firmas digitales para prevenir falsificación
- Rate limiting en endpoints críticos

---

**📌 Esta documentación técnica complementa el PROJECT_MASTER_GUIDE.md y debe mantenerse actualizada con cada cambio en la estructura de datos.**
