-- ============================================================
-- UPLY — Migration v18
-- One-time cleanup: normalize existing products.category free-text
-- values (typos, accents, trailing spaces, old naming) onto the
-- fixed category list from migration-v16. This is what was causing
-- duplicate-looking entries in the Commander category filter.
-- Safe to re-run.
-- ============================================================

update public.products set category = 'Fruits et légumes'
  where category in ('Fruit et légume', 'Fruit et légume ', 'Légume ', 'Legume');

update public.products set category = 'Viandes'
  where category = 'Viande';

update public.products set category = 'Poissons et fruits de mer'
  where category = 'Poisson';

update public.products set category = 'Produits frais'
  where category in ('Produit frais ', 'Produit frais', 'BOF');

update public.products set category = 'Produits surgelés'
  where category in ('Produit congelé ', 'Congelé');

update public.products set category = 'Épicerie'
  where category in ('Épicerie ', 'Epicerie', 'Épicerir', 'Epiceriey');

update public.products set category = 'Boissons sans alcool'
  where category in ('Boisson', 'Boisson ', ' Boisson');

update public.products set category = 'Alcools'
  where category in ('Vin', 'Boisson avec alcool ', 'Boisson  avec alcool ');

update public.products set category = 'Charcuterie'
  where category = 'Charcuterie ';

update public.products set category = 'Emballages'
  where category = 'Emballage';

update public.products set category = 'Produits d''entretien'
  where category in ('Entretien', 'Entretien ');

update public.products set category = 'Sauces, sirops et purées'
  where category = 'Sirop et purée ';

update public.products set category = 'Non classé'
  where category = '' or category is null;
