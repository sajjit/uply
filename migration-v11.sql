-- ============================================================
-- UPLY — Migration v11
-- Fix: admin_create_user failed with "function gen_salt(unknown)
-- does not exist". crypt()/gen_salt() come from the pgcrypto
-- extension, which Supabase installs into the "extensions" schema —
-- not "public". The function's `search_path = public` hid them.
-- ============================================================

create or replace function public.admin_create_user(
  p_email text,
  p_password text,
  p_name text,
  p_restaurant_id uuid
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
  v_encrypted_pw text;
begin
  if not public.is_admin() then
    raise exception 'Permission refusée : réservé aux administrateurs';
  end if;

  if p_email is null or p_email = '' then
    raise exception 'Adresse e-mail requise';
  end if;

  if length(p_password) < 6 then
    raise exception 'Le mot de passe doit contenir au moins 6 caractères';
  end if;

  if exists (select 1 from auth.users where email = lower(p_email)) then
    raise exception 'Un compte existe déjà avec cette adresse e-mail';
  end if;

  v_user_id := gen_random_uuid();
  v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

  insert into auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at, aud, role
  ) values (
    v_user_id, lower(p_email), v_encrypted_pw, now(),
    jsonb_build_object('name', p_name), now(), now(), 'authenticated', 'authenticated'
  );

  update public.profiles
  set
    name = p_name,
    restaurant_id = p_restaurant_id,
    role = 'client',
    must_reset_password = true
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

grant execute on function public.admin_create_user(text, text, text, uuid) to authenticated;
