-- 004_add_test_branch.sql
-- This migration adds a test branch and assigns it to a specific user.

do $$
declare
  test_branch_id uuid;
begin
  -- 1. Insert a new branch for testing purposes.
  -- The 'returning id into ...' clause captures the UUID of the new row.
  insert into public.branches (name, address)
  values ('Sucursal de Prueba', 'Ubicación de prueba')
  returning id into test_branch_id;

  -- 2. Assign the newly created branch to the specified user profile.
  -- The user ID was provided in the request.
  update public.user_profiles
  set branch_id = test_branch_id
  where id = 'a57ed65e-3132-4a40-aae8-700318c5d03c';
end $$;
