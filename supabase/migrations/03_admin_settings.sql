-- =====================================================================
-- BBB Shop Brasil — Migração 03: Campos adicionais PagSeguro e Policies Admin
-- =====================================================================

alter table public.settings
  add column if not exists pagseguro_app_id text,
  add column if not exists pagseguro_app_key text;

-- Permite que administradores autenticados via Supabase Auth gerenciem os registros
drop policy if exists "admin_auth_all_settings" on public.settings;
create policy "admin_auth_all_settings" on public.settings
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_auth_all_products" on public.products;
create policy "admin_auth_all_products" on public.products
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_auth_all_product_images" on public.product_images;
create policy "admin_auth_all_product_images" on public.product_images
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_auth_all_banners" on public.banners;
create policy "admin_auth_all_banners" on public.banners
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_auth_all_orders" on public.orders;
create policy "admin_auth_all_orders" on public.orders
  for all to authenticated using (true) with check (true);

