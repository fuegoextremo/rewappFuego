-- Migration 031: Add email to user_profiles for efficient search and pagination
-- Date: 2024-10-02
-- Purpose: Denormalize email from auth.users to enable efficient user search and pagination

-- 1. Add email column
ALTER TABLE public.user_profiles 
ADD COLUMN email TEXT;

-- 2. Sync existing emails from auth.users (one-time for historical data)
UPDATE public.user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.id = au.id;

-- 3. Create indices for search and pagination
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_first_name ON public.user_profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_name ON public.user_profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at DESC);

-- 4. Full-text search index for combined search (Spanish)
CREATE INDEX IF NOT EXISTS idx_user_profiles_search ON public.user_profiles 
USING gin(
  to_tsvector('spanish', 
    coalesce(first_name, '') || ' ' || 
    coalesce(last_name, '') || ' ' || 
    coalesce(email, '') || ' ' || 
    coalesce(phone, '')
  )
);

-- 5. Update existing trigger to include email and handle updates
-- This replaces the function from migration 001
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create profile automatically for new user, including email
    INSERT INTO public.user_profiles (
        id,
        first_name,
        last_name,
        email,  -- NEW: include email from auth.users
        unique_code,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,  -- NEW: sync email on creation
        generate_unique_code(),
        'client',
        true,
        NOW(),
        NOW()
    ) 
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,           -- NEW: update email if user already exists
        first_name = EXCLUDED.first_name, -- Also update name in case it changed
        last_name = EXCLUDED.last_name,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating/updating profile for user %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$;

-- The existing trigger on_auth_user_created (from migration 001) already handles INSERT
-- Now it will also handle email updates because we changed DO NOTHING to DO UPDATE

-- 6. Comments for documentation
COMMENT ON COLUMN public.user_profiles.email IS 'Denormalized from auth.users for efficient search. Automatically synced via handle_new_user() trigger.';
COMMENT ON INDEX idx_user_profiles_search IS 'Full-text search index for first_name, last_name, email, and phone';
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user_profiles on auth.users INSERT and syncs email/name on conflicts';
