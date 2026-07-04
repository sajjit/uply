-- ============================================================
-- UPLY — Migration v6
-- Secure admin user-creation function
-- Allows the app to create new client accounts without exposing
-- the service role key in the browser.
-- ============================================================

-- This function runs as SECURITY DEFINER (elevated privileges)
-- so it can insert into auth.users. It checks the caller is admin first.
create or replace function public.admin_create_user(
  p_email text,
  p_password text,
  p_name text,
  p_restaurant_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_encrypted_pw text;
begin
  -- Security check: only admins can call this
  if not public.is_admin() then
    raise exception 'Permission refusée : réservé aux administrateurs';
  end if;

  -- Validate inputs
  if p_email is null or p_email = '' then
    raise exception 'Adresse e-mail requise';
  end if;

  if length(p_password) < 6 then
    raise exception 'Le mot de passe doit contenir au moins 6 caractères';
  end if;

  -- Check if email already exists
  if exists (select 1 from auth.users where email = lower(p_email)) then
    raise exception 'Un compte existe déjà avec cette adresse e-mail';
  end if;

  -- Generate user id
  v_user_id := gen_random_uuid();

  -- Encrypt password using Supabase's internal method
  v_encrypted_pw := crypt(p_password, gen_salt('bf'));

  -- Insert into auth.users (Supabase internal auth table)
  insert into auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    aud,
    role
  ) values (
    v_user_id,
    lower(p_email),
    v_encrypted_pw,
    now(), -- auto-confirm
    jsonb_build_object('name', p_name),
    now(),
    now(),
    'authenticated',
    'authenticated'
  );

  -- The trigger on_auth_user_created will create the profile row automatically.
  -- We just need to update it with the right restaurant and name.
  update public.profiles
  set
    name = p_name,
    restaurant_id = p_restaurant_id,
    role = 'client'
  where id = v_user_id;

  return json_build_object(
    'id', v_user_id,
    'email', lower(p_email),
    'success', true
  );

exception when others then
  return json_build_object(
    'success', false,
    'error', SQLERRM
  );
end;
$$;

-- Grant execute permission to authenticated users
-- (is_admin() check inside the function prevents non-admins from actually using it)
grant execute on function public.admin_create_user(text, text, text, uuid) to authenticated;
