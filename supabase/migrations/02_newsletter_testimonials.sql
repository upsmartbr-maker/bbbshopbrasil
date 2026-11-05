-- =====================================================================
-- BBB Shop Brasil — Newsletter e Depoimentos
-- =====================================================================

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
-- Sem policies: acesso somente via service role (route handler /api/newsletter).
alter table public.newsletter_subscribers enable row level security;

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_city text,
  text text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  photo_url text,
  is_active boolean not null default true,
  order_index integer not null default 0
);
create index if not exists idx_testimonials_active_order on public.testimonials (is_active, order_index);

alter table public.testimonials enable row level security;
drop policy if exists "testimonials_public_read" on public.testimonials;
create policy "testimonials_public_read" on public.testimonials
  for select using (is_active = true);

