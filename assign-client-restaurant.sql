-- First, find your restaurant's id
select id, name from public.restaurants;

-- Then assign the client user to it (replace both values below)
update public.profiles
set restaurant_id = 'PASTE_RESTAURANT_ID_HERE'
where email = 'client@test.fr';
