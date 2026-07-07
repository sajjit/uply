-- ============================================================
-- UPLY — Migration v10
-- Forced password reset for admin-created accounts, plus support
-- for the self-service "forgot password" flow (which uses Supabase's
-- built-in resetPasswordForEmail — no schema change needed for that
-- part, it's handled entirely by Supabase Auth).
-- ============================================================

alter table public.profiles
  add column if not exists must_reset_password boolean default false;

-- Re-create admin_create_user so newly created client accounts are
-- flagged to change their temporary password on first login.
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
  v_encrypted_pw := crypt(p_password, gen_salt('bf'));

  insert into auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at, aud, role
  ) values (
    v_user_id, lower(p_email), v_encrypted_pw, now(),
    jsonb_build_object('name', p_name), now(), now(), 'authenticated', 'authenticated'
  );

  -- The trigger on_auth_user_created creates the profile row automatically.
  -- We update it with the right restaurant, name, and force a password
  -- change on first login since the admin picked this temporary password.
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
