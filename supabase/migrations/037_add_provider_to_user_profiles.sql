-- Migration 037: Add provider column to user_profiles for efficient filtering
-- Date: 2024-12-09
-- Purpose: Denormalize auth provider to avoid fetching all auth.users on every page load

-- 1. Add provider column with default 'email'
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email';

-- 2. Sync existing providers from auth.users (one-time for historical data)
-- El provider está en app_metadata->provider o en identities[0]->provider
UPDATE public.user_profiles up
SET provider = COALESCE(
    au.raw_app_meta_data->>'provider',
    (au.raw_app_meta_data->'providers'->>0),
    'email'
)
FROM auth.users au
WHERE up.id = au.id
  AND (up.provider IS NULL OR up.provider = 'email');

-- 3. Create index for filtering by provider
CREATE INDEX IF NOT EXISTS idx_user_profiles_provider ON public.user_profiles(provider);

-- 4. Update the handle_new_user trigger to include provider
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_provider TEXT;
BEGIN
    -- Determinar el provider del usuario
    v_provider := COALESCE(
        NEW.raw_app_meta_data->>'provider',
        (NEW.raw_app_meta_data->'providers'->>0),
        'email'
    );

    -- Create profile automatically for new user, including email and provider
    INSERT INTO public.user_profiles (
        id,
        first_name,
        last_name,
        email,
        provider,  -- NEW: include provider
        unique_code,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        v_provider,  -- NEW: sync provider on creation
        generate_unique_code(),
        'client',
        true,
        NOW(),
        NOW()
    ) 
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        provider = EXCLUDED.provider,  -- NEW: update provider if changed
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating/updating profile for user %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$;

-- 5. Comments for documentation
COMMENT ON COLUMN public.user_profiles.provider IS 'Auth provider (email, google, facebook). Denormalized from auth.users for efficient filtering.';

-- 6. Verification query (run after migration)
DO $$
DECLARE
    total_users INTEGER;
    users_with_provider INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM public.user_profiles;
    SELECT COUNT(*) INTO users_with_provider FROM public.user_profiles WHERE provider IS NOT NULL;
    RAISE NOTICE 'Migration 037 complete: %/% users have provider set', users_with_provider, total_users;
END;
$$;
