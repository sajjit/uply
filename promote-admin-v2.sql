-- Run this after creating the new admin user, replacing the email if needed
update public.profiles
set role = 'admin'
where email = 'sajjit999@gmail.com';

-- Confirm
select id, email, role, restaurant_id from public.profiles where email = 'sajjit999@gmail.com';
