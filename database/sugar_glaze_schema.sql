-- Sugar & Glaze — базова схема Supabase/PostgreSQL
-- Запустіть цей SQL у Supabase SQL Editor.

create table if not exists public.sweets (
  id bigint generated always as identity primary key,
  name text not null,
  price numeric(10,2) not null,
  description text,
  image_url text
);

create table if not exists public.users (
  id bigint generated always as identity primary key,
  full_name text not null,
  email text not null unique,
  phone text,
  address text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  password_hash text not null,
  password_salt text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.auth_sessions (
  id bigint generated always as identity primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  order_id text not null unique,
  user_id bigint references public.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  customer_email text,
  items jsonb not null,
  total_amount numeric(10,2) not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.order_verifications (
  verification_id text primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  draft jsonb not null,
  code_salt text not null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists user_id bigint references public.users(id) on delete set null;

alter table public.orders
  add column if not exists customer_email text;

alter table public.orders
  add column if not exists items jsonb;

alter table public.orders
  alter column items type jsonb
  using items::jsonb;

alter table public.orders
  alter column items set not null;

alter table public.orders
  add column if not exists created_at timestamptz not null default now();

alter table public.orders
  alter column status set default 'new';

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_auth_sessions_token on public.auth_sessions(session_token_hash);
create index if not exists idx_auth_sessions_user_id on public.auth_sessions(user_id);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_verifications_user_id on public.order_verifications(user_id);
create index if not exists idx_order_verifications_expires_at on public.order_verifications(expires_at);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'sweets_price_positive'
  ) then
    alter table public.sweets
      add constraint sweets_price_positive check (price > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_total_amount_non_negative'
  ) then
    alter table public.orders
      add constraint orders_total_amount_non_negative check (total_amount >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_status_valid'
  ) then
    alter table public.orders
      add constraint orders_status_valid check (status in ('new', 'confirmed', 'completed', 'cancelled'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'order_verifications_attempts_non_negative'
  ) then
    alter table public.order_verifications
      add constraint order_verifications_attempts_non_negative check (attempts >= 0);
  end if;
end $$;

alter table public.sweets enable row level security;
alter table public.users enable row level security;
alter table public.auth_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.order_verifications enable row level security;

drop policy if exists sweets_service_role_all on public.sweets;
create policy sweets_service_role_all
  on public.sweets
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists users_service_role_all on public.users;
create policy users_service_role_all
  on public.users
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists auth_sessions_service_role_all on public.auth_sessions;
create policy auth_sessions_service_role_all
  on public.auth_sessions
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists orders_service_role_all on public.orders;
create policy orders_service_role_all
  on public.orders
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists order_verifications_service_role_all on public.order_verifications;
create policy order_verifications_service_role_all
  on public.order_verifications
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.users is 'Користувачі магазину та адміністратори';
comment on table public.auth_sessions is 'Web-сесії користувачів для cookie-auth';
comment on table public.orders is 'Замовлення клієнтів із прив’язкою до акаунта';
comment on table public.order_verifications is 'Тимчасові email-коди підтвердження замовлень';
