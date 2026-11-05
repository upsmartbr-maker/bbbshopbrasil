-- =====================================================================
-- BBB Shop Brasil — Migração inicial
-- =====================================================================
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- settings (singleton: apenas id = 1)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  active_gateway text not null default 'mercadopago'
    check (active_gateway in ('mercadopago', 'pagseguro')),
  mp_access_token text,
  mp_public_key text,
  pagseguro_token text,
  pagseguro_email text
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- banners
-- ---------------------------------------------------------------------
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  button_text text,
  link text,
  order_index integer not null default 0,
  is_active boolean not null default true
);
create index if not exists idx_banners_active_order on public.banners (is_active, order_index);

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  is_featured boolean not null default false,
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now()
);
create index if not exists idx_products_featured on public.products (is_featured, created_at desc);

-- ---------------------------------------------------------------------
-- product_images (limite lógico de 8 fotos por produto)
-- ---------------------------------------------------------------------
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  order_index integer not null default 0
);
create index if not exists idx_product_images_product on public.product_images (product_id, order_index);

create or replace function public.enforce_max_product_images()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.product_images where product_id = new.product_id) >= 8 then
    raise exception 'Limite de 8 imagens por produto atingido.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_max_product_images on public.product_images;
create trigger trg_max_product_images
  before insert on public.product_images
  for each row execute function public.enforce_max_product_images();

-- ---------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  items jsonb not null default '[]'::jsonb,
  total numeric(10,2) not null check (total >= 0),
  gateway text not null check (gateway in ('mercadopago', 'pagseguro')),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
  created_at timestamptz not null default now()
);
create index if not exists idx_orders_status_created on public.orders (status, created_at desc);

-- ---------------------------------------------------------------------
-- Row Level Security
-- settings e orders: sem policies => acessíveis somente via service role.
-- ---------------------------------------------------------------------
alter table public.settings enable row level security;
alter table public.orders enable row level security;
alter table public.banners enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

drop policy if exists "banners_public_read" on public.banners;
create policy "banners_public_read" on public.banners
  for select using (is_active = true);

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (true);

drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read" on public.product_images
  for select using (true);

-- ---------------------------------------------------------------------
-- Storage: buckets públicos 'products' e 'banners'
-- Leitura pública; escrita/alteração/remoção apenas para usuários autenticados
-- (o painel admin também usa service role, que ignora RLS).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('products', 'products', true), ('banners', 'banners', true)
on conflict (id) do update set public = true;

drop policy if exists "public_read_products_banners" on storage.objects;
create policy "public_read_products_banners" on storage.objects
  for select using (bucket_id in ('products', 'banners'));

drop policy if exists "auth_insert_products_banners" on storage.objects;
create policy "auth_insert_products_banners" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('products', 'banners'));

drop policy if exists "auth_update_products_banners" on storage.objects;
create policy "auth_update_products_banners" on storage.objects
  for update to authenticated
  using (bucket_id in ('products', 'banners'))
  with check (bucket_id in ('products', 'banners'));

drop policy if exists "auth_delete_products_banners" on storage.objects;
create policy "auth_delete_products_banners" on storage.objects
  for delete to authenticated
  using (bucket_id in ('products', 'banners'));

