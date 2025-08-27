-- ============================================
-- REWAPP - Schema Completo - PARA DB RESET
-- ============================================

-- 0. EXTENSIONES NECESARIAS
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. CREAR TABLAS BASE PRIMERO
-- ============================================

-- Tabla de sucursales
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de perfiles de usuario (extiende auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  birth_date DATE,
  role TEXT CHECK (role IN ('client', 'verifier', 'manager', 'admin', 'superadmin')) DEFAULT 'client',
  unique_code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de premios
CREATE TABLE IF NOT EXISTS prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('roulette', 'streak')) NOT NULL,
  inventory_count INTEGER DEFAULT 0,
  validity_days INTEGER DEFAULT 30,
  weight INTEGER DEFAULT 1,
  streak_threshold INTEGER,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Tabla de check-ins (visitas)
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  verified_by UUID REFERENCES user_profiles(id),
  spins_earned INTEGER DEFAULT 1,
  check_in_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de rachas
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  current_count INTEGER DEFAULT 0,
  max_count INTEGER DEFAULT 20,
  last_check_in DATE,
  expires_at DATE,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de cupones ganados
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  prize_id UUID REFERENCES prizes(id),
  unique_code TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES user_profiles(id),
  branch_id UUID REFERENCES branches(id),
  source TEXT CHECK (source IN ('roulette', 'streak', 'manual')) DEFAULT 'roulette',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de giros disponibles
CREATE TABLE IF NOT EXISTS user_spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  available_spins INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de historial de giros
CREATE TABLE IF NOT EXISTS roulette_spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  prize_id UUID REFERENCES prizes(id),
  coupon_id UUID REFERENCES coupons(id),
  won_prize BOOLEAN DEFAULT false,
  spin_result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de configuraciones
CREATE TABLE IF NOT EXISTS app_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. CREAR FUNCIONES DE UTILIDAD PRIMERO
-- ============================================

CREATE OR REPLACE FUNCTION generate_unique_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTR(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 8));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_coupon_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CPN-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 10));
END;
$$ LANGUAGE plpgsql;

-- 2. HELPER FUNCTIONS PARA RLS
-- ============================================

CREATE OR REPLACE FUNCTION public.uid() 
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_branch()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT branch_id FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_any()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN public.current_role() IN ('manager','admin','superadmin');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_verifier()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN public.current_role() = 'verifier';
END;
$$;

-- 3. TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- ============================================

-- Función para updated_at automático
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Función para unique_code automático en perfiles
CREATE OR REPLACE FUNCTION public.ensure_profile_unique_code()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.unique_code IS NULL OR LENGTH(NEW.unique_code) = 0 THEN
    NEW.unique_code := generate_unique_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_coupon_code()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.unique_code IS NULL OR LENGTH(NEW.unique_code) = 0 THEN
    NEW.unique_code := generate_coupon_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: crear perfil automáticamente al crear usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, unique_code, is_active, created_at, updated_at)
  VALUES (NEW.id, generate_unique_code(), true, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 4. APLICAR TRIGGERS A LAS TABLAS EXISTENTES
-- ============================================

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trg_touch_user_profiles ON public.user_profiles;
CREATE TRIGGER trg_touch_user_profiles
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_coupons ON public.coupons;
CREATE TRIGGER trg_touch_coupons
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_prizes ON public.prizes;
CREATE TRIGGER trg_touch_prizes
  BEFORE UPDATE ON public.prizes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_check_ins ON public.check_ins;
CREATE TRIGGER trg_touch_check_ins
  BEFORE UPDATE ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_streaks ON public.streaks;
CREATE TRIGGER trg_touch_streaks
  BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Triggers para códigos únicos
DROP TRIGGER IF EXISTS trg_user_profiles_unique_code ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_unique_code
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_profile_unique_code();

DROP TRIGGER IF EXISTS trg_coupons_unique_code ON public.coupons;
CREATE TRIGGER trg_coupons_unique_code
  BEFORE INSERT ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.ensure_coupon_code();

-- 5. CREAR ÍNDICES ÚNICOS NECESARIOS
-- ============================================

-- Índice único para user_spins (necesario para el ON CONFLICT)
DROP INDEX IF EXISTS idx_user_spins_user_id;
CREATE UNIQUE INDEX idx_user_spins_user_id ON user_spins(user_id);

-- Índice único para streaks (necesario para el ON CONFLICT)
DROP INDEX IF EXISTS uq_streaks_user_id;
CREATE UNIQUE INDEX uq_streaks_user_id ON public.streaks(user_id);

-- Otros índices de performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_branch ON public.user_profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON public.check_ins(user_id, check_in_date);
CREATE INDEX IF NOT EXISTS idx_check_ins_branch_created ON public.check_ins(branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_coupons_user_status_exp ON public.coupons(user_id, is_redeemed, expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_coupons_unique_code ON public.coupons(unique_code);
CREATE INDEX IF NOT EXISTS idx_streaks_user_completed ON public.streaks(user_id, is_completed);

-- Índice útil para reportes de giros
CREATE INDEX IF NOT EXISTS idx_roulette_spins_user_created
  ON public.roulette_spins(user_id, created_at);

-- 6. RPC FUNCTIONS CORREGIDAS
-- ============================================

-- Función para procesar check-in (CORREGIDA)
CREATE OR REPLACE FUNCTION public.process_checkin(p_user uuid, p_branch uuid, p_spins int DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_my_branch uuid;
  v_existing_checkins int;
BEGIN
  -- Validar autenticación
  SELECT role, branch_id INTO v_role, v_my_branch
  FROM public.user_profiles WHERE id = auth.uid();

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificador solo puede procesar su sucursal
  IF v_role = 'verifier' AND v_my_branch IS DISTINCT FROM p_branch THEN
    RAISE EXCEPTION 'Verificador solo puede procesar check-ins de su sucursal';
  END IF;

  -- Validar máximo 1 check-in por día
  SELECT COUNT(*) INTO v_existing_checkins
  FROM public.check_ins 
  WHERE user_id = p_user AND check_in_date = CURRENT_DATE;

  IF v_existing_checkins > 0 THEN
    RAISE EXCEPTION 'El usuario ya realizó check-in hoy';
  END IF;

  -- Insertar check-in
  INSERT INTO public.check_ins(user_id, branch_id, verified_by, check_in_date, spins_earned, created_at)
  VALUES (p_user, p_branch, auth.uid(), CURRENT_DATE, COALESCE(p_spins,1), NOW());

  -- Actualizar giros disponibles
  INSERT INTO public.user_spins(user_id, available_spins, updated_at)
  VALUES (p_user, COALESCE(p_spins,1), NOW())
  ON CONFLICT (user_id) DO UPDATE SET 
    available_spins = user_spins.available_spins + COALESCE(p_spins,1),
    updated_at = NOW();

  -- Actualizar o crear racha
  INSERT INTO public.streaks(user_id, current_count, last_check_in, expires_at, updated_at)
  VALUES (p_user, 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    current_count = CASE 
      WHEN streaks.last_check_in >= CURRENT_DATE - INTERVAL '1 day' THEN streaks.current_count + 1
      ELSE 1
    END,
    last_check_in = CURRENT_DATE,
    expires_at = CURRENT_DATE + INTERVAL '90 days',
    updated_at = NOW();
END;
$$;

-- Función para girar ruleta (CORREGIDA - Selección proporcional matemáticamente correcta)
CREATE OR REPLACE FUNCTION public.spin_roulette(p_user uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_spins int;
  v_prize_id uuid;
  v_prize_name text;
  v_coupon_id uuid;
  v_won boolean := false;
  v_win_probability float := 0.2; -- 20% probabilidad global
  v_total_weight int;
  v_random_value int;
BEGIN
  -- Verificar que el usuario tiene giros disponibles
  SELECT available_spins INTO v_spins
  FROM public.user_spins
  WHERE user_id = p_user;

  IF COALESCE(v_spins,0) <= 0 THEN
    RETURN json_build_object('won', false, 'reason', 'no_spins');
  END IF;

  -- Determinar si gana (probabilidad global)
  IF RANDOM() < v_win_probability THEN
    -- Calcular peso total de premios disponibles
    SELECT COALESCE(SUM(COALESCE(weight,1)), 0) INTO v_total_weight
    FROM public.prizes
    WHERE is_active = true AND inventory_count > 0 AND type = 'roulette';

    IF v_total_weight > 0 THEN
      -- Generar número random basado en peso total
      v_random_value := FLOOR(RANDOM() * v_total_weight) + 1;

      -- Seleccionar premio usando selección proporcional correcta
      WITH weighted_prizes AS (
        SELECT id, name, COALESCE(weight,1) AS w,
               SUM(COALESCE(weight,1)) OVER (ORDER BY id) AS cumulative_weight
        FROM public.prizes
        WHERE is_active = true AND inventory_count > 0 AND type = 'roulette'
      )
      SELECT id, name INTO v_prize_id, v_prize_name
      FROM weighted_prizes
      WHERE cumulative_weight >= v_random_value
      ORDER BY cumulative_weight
      LIMIT 1;

      IF v_prize_id IS NOT NULL THEN
        v_won := true;

        -- Crear cupón
        INSERT INTO public.coupons(user_id, prize_id, expires_at, source, created_at)
        VALUES (p_user, v_prize_id, NOW() + INTERVAL '30 days', 'roulette', NOW())
        RETURNING id INTO v_coupon_id;

        -- Decrementar inventario (con protección)
        UPDATE public.prizes
        SET inventory_count = GREATEST(inventory_count - 1, 0)
        WHERE id = v_prize_id AND inventory_count > 0;
      END IF;
    END IF;
  END IF;

  -- Descontar giro
  UPDATE public.user_spins
  SET available_spins = GREATEST(available_spins - 1, 0),
      updated_at = NOW()
  WHERE user_id = p_user;

  -- Registrar giro en historial
  INSERT INTO public.roulette_spins(user_id, prize_id, coupon_id, won_prize, created_at)
  VALUES (p_user, v_prize_id, v_coupon_id, v_won, NOW());

  RETURN json_build_object(
    'won', v_won,
    'prize_id', v_prize_id,
    'prize_name', v_prize_name,
    'coupon_id', v_coupon_id
  );
END;
$$;

-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roulette_spins ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "user_profiles_select_self" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_self" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_self" ON public.user_profiles;
-- Nota: eliminamos explícitamente políticas de admin/verifier sobre esta tabla
DROP POLICY IF EXISTS "user_profiles_select_admin_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_admin_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_verifier_branch" ON public.user_profiles;

-- USER_PROFILES (políticas sin recursión; NO usar helpers que leen esta misma tabla)
CREATE POLICY "user_profiles_select_self"
  ON public.user_profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "user_profiles_update_self"
  ON public.user_profiles
  FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "user_profiles_insert_self"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- BRANCHES (lectura pública)
DROP POLICY IF EXISTS "branches_public_read" ON public.branches;
CREATE POLICY "branches_public_read" ON public.branches
  FOR SELECT USING (true);

-- PRIZES (lectura pública de premios activos)
DROP POLICY IF EXISTS "prizes_public_read" ON public.prizes;
CREATE POLICY "prizes_public_read" ON public.prizes
  FOR SELECT USING (COALESCE(is_active,true));

-- CHECK_INS
DROP POLICY IF EXISTS "check_ins_select_own" ON public.check_ins;
DROP POLICY IF EXISTS "check_ins_select_verifier_branch" ON public.check_ins;
DROP POLICY IF EXISTS "check_ins_select_admin_all" ON public.check_ins;

CREATE POLICY "check_ins_select_own" ON public.check_ins
  FOR SELECT USING (user_id = uid());

CREATE POLICY "check_ins_select_verifier_branch" ON public.check_ins
  FOR SELECT USING (public.is_verifier() AND branch_id = public.current_branch());

CREATE POLICY "check_ins_select_admin_all" ON public.check_ins
  FOR SELECT USING (public.is_admin_any());

-- COUPONS
DROP POLICY IF EXISTS "coupons_select_own" ON public.coupons;
DROP POLICY IF EXISTS "coupons_select_admin_all" ON public.coupons;
DROP POLICY IF EXISTS "coupons_update_verifier_redeem" ON public.coupons;

CREATE POLICY "coupons_select_own" ON public.coupons
  FOR SELECT USING (user_id = uid());

CREATE POLICY "coupons_select_admin_all" ON public.coupons
  FOR SELECT USING (public.is_admin_any());

-- POLÍTICA CORREGIDA: Verificadores pueden redimir cupones y forzar asignación de sucursal
CREATE POLICY "coupons_update_verifier_redeem" ON public.coupons
  FOR UPDATE
  USING (public.is_verifier())
  WITH CHECK (branch_id = public.current_branch());

-- STREAKS
DROP POLICY IF EXISTS "streaks_select_own" ON public.streaks;
DROP POLICY IF EXISTS "streaks_select_admin_all" ON public.streaks;

CREATE POLICY "streaks_select_own" ON public.streaks
  FOR SELECT USING (user_id = uid());

CREATE POLICY "streaks_select_admin_all" ON public.streaks
  FOR SELECT USING (public.is_admin_any());

-- USER_SPINS
DROP POLICY IF EXISTS "user_spins_select_own" ON public.user_spins;
DROP POLICY IF EXISTS "user_spins_select_admin_all" ON public.user_spins;

CREATE POLICY "user_spins_select_own" ON public.user_spins
  FOR SELECT USING (user_id = uid());

CREATE POLICY "user_spins_select_admin_all" ON public.user_spins
  FOR SELECT USING (public.is_admin_any());

-- ROULETTE_SPINS
DROP POLICY IF EXISTS "roulette_spins_select_own" ON public.roulette_spins;
DROP POLICY IF EXISTS "roulette_spins_select_admin_all" ON public.roulette_spins;

CREATE POLICY "roulette_spins_select_own" ON public.roulette_spins
  FOR SELECT USING (user_id = uid());

CREATE POLICY "roulette_spins_select_admin_all" ON public.roulette_spins
  FOR SELECT USING (public.is_admin_any());

-- 8. DATOS DE PRUEBA ADICIONALES
-- ============================================

-- Premios para la ruleta
INSERT INTO public.prizes (name, description, type, inventory_count, validity_days, weight, is_active) VALUES 
('Café Gratis', 'Un café de cualquier tamaño', 'roulette', 100, 7, 5, true),
('Descuento 10%', '10% de descuento en tu próxima compra', 'roulette', 200, 15, 8, true),
('Postre Gratis', 'Un postre de la casa', 'roulette', 50, 7, 4, true),
('Bebida Gratis', 'Una bebida de cualquier tamaño', 'roulette', 100, 10, 6, true),
('Combo Especial', 'Combo del día gratis', 'roulette', 25, 3, 2, true)
ON CONFLICT DO NOTHING;

-- Premios de racha
INSERT INTO public.prizes (name, description, type, streak_threshold, inventory_count, validity_days, weight, is_active) VALUES 
('Premio 5 Visitas', 'Regalo especial por 5 visitas consecutivas', 'streak', 5, 1000, 30, 0, true),
('Premio 10 Visitas', 'Regalo especial por 10 visitas consecutivas', 'streak', 10, 1000, 30, 0, true),
('Premio 15 Visitas', 'Regalo especial por 15 visitas consecutivas', 'streak', 15, 1000, 45, 0, true),
('Premio Racha Completa', 'Premio especial por completar 20 visitas', 'streak', 20, 1000, 60, 0, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- SCHEMA COMPLETO Y ALINEADO - FINAL
-- ============================================

SELECT 'Base de datos configurada correctamente - Versión Final' as status;