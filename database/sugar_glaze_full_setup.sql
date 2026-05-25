-- Sugar & Glaze — DEMO ONLY повне початкове розгортання БД
-- Для production на Render запускайте database/sugar_glaze_schema.sql.
-- Цей файл створює демонстраційні акаунти та демо-замовлення для локального показу.
-- Запустіть цей файл у Supabase SQL Editor одним блоком.
--
-- Наповнення:
-- - 1 адміністратор
-- - 20 клієнтів
-- - 40 товарів
-- - 24 демо-замовлення
--
-- Демо-акаунти:
-- 1. Адмін
--    Email: dmytro.paguta@sugarglaze.test
--    Пароль: PagutaDmytro2026!
--
-- 2. Клієнт
--    Email: anna.koval@sugarglaze.test
--    Пароль: AnnaKoval2026!
--
-- 3. Клієнт
--    Email: ihor.melnyk@sugarglaze.test
--    Пароль: IhorMelnyk2026!
--
-- 4. Усі інші демо-клієнти
--    Пароль: SugarGlazeCustomer2026!

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

insert into public.users (
  full_name,
  email,
  phone,
  address,
  role,
  password_hash,
  password_salt
)
select
  seed.full_name,
  seed.email,
  seed.phone,
  seed.address,
  seed.role,
  seed.password_hash,
  seed.password_salt
from (
  values
    (
      'Дмитро Пагута',
      'dmytro.paguta@sugarglaze.test',
      '+380671112233',
      'м. Дніпро, вул. Центральна, 10',
      'admin',
      'a33bfcece372f5d4eacc7119324e4b5fb0a16540cd9bc8c2367e559f921852031fcc94fc69401fc85d66812ef97f3d9fe4e6398444cef518fc9626a3e90defa4',
      '608158512c51098bdd5c3ca61b64cb1c'
    ),
    (
      'Анна Коваль',
      'anna.koval@sugarglaze.test',
      '+380931234567',
      'м. Київ, вул. Січових Стрільців, 25, кв. 14',
      'customer',
      '5c23491b88a90608cfc023687d4b94df6aa756718188570b8a688fcdfb05d92c3ae6d72d61ad41644e9071625262b3b950c2357b841621eb84b7439e50a1ceb6',
      '57a9929f85f18d1694d81611decb4472'
    ),
    (
      'Ігор Мельник',
      'ihor.melnyk@sugarglaze.test',
      '+380501234567',
      'м. Львів, вул. Зелена, 88',
      'customer',
      '2999f0f3361128968105567889c865b0ff52fd7ed01471555a872cb88ae9af8dba360113d0122a9e8d19924af6562e9045586af5207a50fcebdc1f4695d23ea0',
      '1cefc9a10420bd4dc99b25df548a65ab'
    ),
    (
      'Петро Шевчук',
      'petro.shevchuk@sugarglaze.test',
      '+380671200101',
      'м. Київ, вул. Ярославів Вал, 17',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Олена Гриценко',
      'olena.hrytsenko@sugarglaze.test',
      '+380671200102',
      'м. Харків, вул. Культури, 12',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Марта Бондар',
      'marta.bondar@sugarglaze.test',
      '+380671200103',
      'м. Івано-Франківськ, вул. Грушевського, 28',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Роман Кравець',
      'roman.kravets@sugarglaze.test',
      '+380671200104',
      'м. Тернопіль, вул. Руська, 44',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Софія Марченко',
      'sofia.marchenko@sugarglaze.test',
      '+380671200105',
      'м. Одеса, вул. Канатна, 39',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Максим Біленко',
      'maksym.bilenko@sugarglaze.test',
      '+380671200106',
      'м. Полтава, вул. Європейська, 71',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Ірина Савчук',
      'iryna.savchuk@sugarglaze.test',
      '+380671200107',
      'м. Луцьк, просп. Волі, 19',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Вікторія Левченко',
      'viktoria.levchenko@sugarglaze.test',
      '+380671200108',
      'м. Вінниця, вул. Пирогова, 51',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Андрій Коваленко',
      'andrii.kovalenko@sugarglaze.test',
      '+380671200109',
      'м. Черкаси, вул. Смілянська, 83',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Тетяна Поліщук',
      'tetiana.polishchuk@sugarglaze.test',
      '+380671200110',
      'м. Житомир, вул. Велика Бердичівська, 27',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Юлія Данильчук',
      'yuliia.danylchuk@sugarglaze.test',
      '+380671200111',
      'м. Рівне, вул. Соборна, 66',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Богдан Ткачук',
      'bohdan.tkachuk@sugarglaze.test',
      '+380671200112',
      'м. Хмельницький, вул. Проскурівська, 14',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Аліна Руденко',
      'alina.rudenko@sugarglaze.test',
      '+380671200113',
      'м. Чернігів, вул. Шевченка, 9',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Назар Гончар',
      'nazar.honchar@sugarglaze.test',
      '+380671200114',
      'м. Ужгород, вул. Корзо, 22',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Оксана Вербицька',
      'oksana.verbytska@sugarglaze.test',
      '+380671200115',
      'м. Кропивницький, вул. Дворцова, 30',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Денис Сидоренко',
      'denys.sydorenko@sugarglaze.test',
      '+380671200116',
      'м. Суми, вул. Харківська, 41',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Катерина Лисенко',
      'kateryna.lysenko@sugarglaze.test',
      '+380671200117',
      'м. Чернівці, вул. Головна, 58',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    ),
    (
      'Владислав Павленко',
      'vladyslav.pavlenko@sugarglaze.test',
      '+380671200118',
      'м. Дніпро, вул. Робоча, 101',
      'customer',
      '6022e254237ae798c36e70b0ec449f45da77bd7a3797542b8e64d6f0115bec83b22299c12ec451389f1232abac9ac7bfc2ac41dcbe811caa279b3e4bcfff2bf0',
      'ff9fbba370e003ffc02e460cc341d988'
    )
) as seed (
  full_name,
  email,
  phone,
  address,
  role,
  password_hash,
  password_salt
)
on conflict (email) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  address = excluded.address,
  role = excluded.role,
  password_hash = excluded.password_hash,
  password_salt = excluded.password_salt;

insert into public.sweets (name, price, description, image_url)
select *
from (
  values
    ('Торт Наполеон', 850.00::numeric, 'Класичний листковий торт з вершковим кремом.', null::text),
    ('Капкейки Ванільні', 75.00::numeric, 'Ніжні капкейки з крем-чизом та ванільним бісквітом.', null::text),
    ('Макаронс Асорті', 55.00::numeric, 'Французькі макаронс з ягідними та горіховими смаками.', null::text),
    ('Чізкейк Полуничний', 980.00::numeric, 'Вершковий чізкейк на пісочній основі з полуницею.', null::text),
    ('Еклер Карамельний', 68.00::numeric, 'Заварний еклер з солоною карамеллю.', null::text),
    ('Брауні Шоколадний', 82.00::numeric, 'Насичений шоколадний брауні з волоським горіхом.', null::text),
    ('Тарт Лимонний', 120.00::numeric, 'Пісочний тарт із лимонним курдом та меренгою.', null::text),
    ('Медівник Домашній', 690.00::numeric, 'Медові коржі з ніжним сметанковим кремом.', null::text),
    ('Павлова Ягідна', 780.00::numeric, 'Хрустке безе зі збитими вершками та ягодами.', null::text),
    ('Торт Червоний Оксамит', 920.00::numeric, 'Ніжний червоний бісквіт з крем-чизом.', null::text),
    ('Тірамісу Класичне', 135.00::numeric, 'Десерт з маскарпоне, кавою та савоярді.', null::text),
    ('Сінабони з корицею', 95.00::numeric, 'Пухкі булочки з корицею та глазур’ю.', null::text),
    ('Круасан Мигдальний', 88.00::numeric, 'Листковий круасан з мигдальним кремом.', null::text),
    ('Печиво Імбирне', 36.00::numeric, 'Ароматне пряне печиво з медом та імбиром.', null::text),
    ('Трайфл Вишневий', 110.00::numeric, 'Порційний десерт з вишнею, кремом і бісквітом.', null::text),
    ('Торт Фісташковий', 1050.00::numeric, 'Фісташковий бісквіт, крем і подрібнені горіхи.', null::text),
    ('Донат Шоколадний', 48.00::numeric, 'М’який донат у шоколадній глазурі.', null::text),
    ('Кейк-попс Асорті', 45.00::numeric, 'Бісквітні кейк-попси у шоколадній оболонці.', null::text),
    ('Рулет Малина-Ваніль', 420.00::numeric, 'Ніжний рулет з малиновим конфі та ванільним кремом.', null::text),
    ('Пана-кота Манго', 96.00::numeric, 'Вершковий десерт із манговим соусом.', null::text),
    ('Тістечко Картопля', 42.00::numeric, 'Класичне шоколадне тістечко з какао.', null::text),
    ('Профітролі Заварні', 72.00::numeric, 'Профітролі з вершковим кремом.', null::text),
    ('Тарталетки Ягідні', 64.00::numeric, 'Пісочні тарталетки з кремом і ягодами.', null::text),
    ('Чізкейк Oreo', 1020.00::numeric, 'Щільний чізкейк з печивом Oreo.', null::text),
    ('Торт Снікерс', 1090.00::numeric, 'Шоколадний торт з арахісом, карамеллю і нуга-кремом.', null::text),
    ('Безе Кокосове', 38.00::numeric, 'Хрустке безе з ароматом кокоса.', null::text),
    ('Кекс Лимонний', 115.00::numeric, 'Вологий лимонний кекс з глазур’ю.', null::text),
    ('Рогалик Абрикосовий', 40.00::numeric, 'Пісочний рогалик з абрикосовим джемом.', null::text),
    ('Біскотті Мигдальне', 44.00::numeric, 'Італійське сухе печиво з мигдалем.', null::text),
    ('Фондан Шоколадний', 130.00::numeric, 'Теплий шоколадний фондан з рідкою серединкою.', null::text),
    ('Торт Рафаелло', 995.00::numeric, 'Кокосовий торт із мигдалем та кремом.', null::text),
    ('Мусовий десерт Манго-Маракуя', 145.00::numeric, 'Легкий мусовий десерт із тропічним смаком.', null::text),
    ('Капкейки Шоколадні', 78.00::numeric, 'Шоколадні капкейки з кремом ганаш.', null::text),
    ('Сирник Львівський', 580.00::numeric, 'Класичний львівський сирник у шоколадній глазурі.', null::text),
    ('Пиріг Яблучний', 540.00::numeric, 'Домашній яблучний пиріг з корицею.', null::text),
    ('Десерт Три Шоколади', 150.00::numeric, 'Порційний десерт із трьох шарів шоколаду.', null::text),
    ('Торт Медово-Горіховий', 890.00::numeric, 'Медові коржі з горіховим кремом.', null::text),
    ('Маковий Рулет', 470.00::numeric, 'Рулет із густою маковою начинкою.', null::text),
    ('Печиво Сабле', 39.00::numeric, 'Французьке вершкове печиво.', null::text),
    ('Чізкейк Солона Карамель', 1010.00::numeric, 'Чізкейк з карамельним соусом та морською сіллю.', null::text)
) as seed(name, price, description, image_url)
where not exists (
  select 1
  from public.sweets as s
  where s.name = seed.name
);

with order_seed(order_id, customer_email, status, created_offset, lines) as (
  values
    ('SG-DEMO-0001', 'anna.koval@sugarglaze.test', 'new', interval '2 day', '[{"product":"Торт Наполеон","qty":1},{"product":"Макаронс Асорті","qty":6}]'::jsonb),
    ('SG-DEMO-0002', 'ihor.melnyk@sugarglaze.test', 'confirmed', interval '8 hour', '[{"product":"Капкейки Ванільні","qty":12},{"product":"Чізкейк Полуничний","qty":1}]'::jsonb),
    ('SG-DEMO-0003', 'petro.shevchuk@sugarglaze.test', 'completed', interval '5 day', '[{"product":"Торт Снікерс","qty":1},{"product":"Донат Шоколадний","qty":6}]'::jsonb),
    ('SG-DEMO-0004', 'olena.hrytsenko@sugarglaze.test', 'new', interval '1 day', '[{"product":"Павлова Ягідна","qty":1},{"product":"Тарталетки Ягідні","qty":8}]'::jsonb),
    ('SG-DEMO-0005', 'marta.bondar@sugarglaze.test', 'confirmed', interval '3 day', '[{"product":"Сирник Львівський","qty":1},{"product":"Печиво Сабле","qty":10}]'::jsonb),
    ('SG-DEMO-0006', 'roman.kravets@sugarglaze.test', 'completed', interval '6 day', '[{"product":"Медівник Домашній","qty":1},{"product":"Печиво Імбирне","qty":15}]'::jsonb),
    ('SG-DEMO-0007', 'sofia.marchenko@sugarglaze.test', 'cancelled', interval '9 day', '[{"product":"Тірамісу Класичне","qty":4},{"product":"Круасан Мигдальний","qty":6}]'::jsonb),
    ('SG-DEMO-0008', 'maksym.bilenko@sugarglaze.test', 'new', interval '12 hour', '[{"product":"Торт Фісташковий","qty":1},{"product":"Капкейки Шоколадні","qty":9}]'::jsonb),
    ('SG-DEMO-0009', 'iryna.savchuk@sugarglaze.test', 'confirmed', interval '18 hour', '[{"product":"Пана-кота Манго","qty":5},{"product":"Мусовий десерт Манго-Маракуя","qty":4}]'::jsonb),
    ('SG-DEMO-0010', 'viktoria.levchenko@sugarglaze.test', 'completed', interval '11 day', '[{"product":"Торт Рафаелло","qty":1},{"product":"Кейк-попс Асорті","qty":14}]'::jsonb),
    ('SG-DEMO-0011', 'andrii.kovalenko@sugarglaze.test', 'new', interval '4 hour', '[{"product":"Фондан Шоколадний","qty":3},{"product":"Десерт Три Шоколади","qty":3}]'::jsonb),
    ('SG-DEMO-0012', 'tetiana.polishchuk@sugarglaze.test', 'confirmed', interval '7 day', '[{"product":"Торт Червоний Оксамит","qty":1},{"product":"Макаронс Асорті","qty":12}]'::jsonb),
    ('SG-DEMO-0013', 'yuliia.danylchuk@sugarglaze.test', 'completed', interval '14 day', '[{"product":"Чізкейк Oreo","qty":1},{"product":"Брауні Шоколадний","qty":8}]'::jsonb),
    ('SG-DEMO-0014', 'bohdan.tkachuk@sugarglaze.test', 'new', interval '22 hour', '[{"product":"Торт Медово-Горіховий","qty":1},{"product":"Профітролі Заварні","qty":10}]'::jsonb),
    ('SG-DEMO-0015', 'alina.rudenko@sugarglaze.test', 'confirmed', interval '16 day', '[{"product":"Пиріг Яблучний","qty":1},{"product":"Кекс Лимонний","qty":4}]'::jsonb),
    ('SG-DEMO-0016', 'nazar.honchar@sugarglaze.test', 'cancelled', interval '19 day', '[{"product":"Маковий Рулет","qty":1},{"product":"Безе Кокосове","qty":12}]'::jsonb),
    ('SG-DEMO-0017', 'oksana.verbytska@sugarglaze.test', 'completed', interval '21 day', '[{"product":"Торт Наполеон","qty":1},{"product":"Трайфл Вишневий","qty":6}]'::jsonb),
    ('SG-DEMO-0018', 'denys.sydorenko@sugarglaze.test', 'new', interval '10 hour', '[{"product":"Еклер Карамельний","qty":10},{"product":"Сінабони з корицею","qty":6}]'::jsonb),
    ('SG-DEMO-0019', 'kateryna.lysenko@sugarglaze.test', 'confirmed', interval '30 hour', '[{"product":"Чізкейк Солона Карамель","qty":1},{"product":"Капкейки Ванільні","qty":8}]'::jsonb),
    ('SG-DEMO-0020', 'vladyslav.pavlenko@sugarglaze.test', 'completed', interval '24 day', '[{"product":"Торт Снікерс","qty":1},{"product":"Біскотті Мигдальне","qty":12}]'::jsonb),
    ('SG-DEMO-0021', 'anna.koval@sugarglaze.test', 'confirmed', interval '26 hour', '[{"product":"Рулет Малина-Ваніль","qty":1},{"product":"Тарт Лимонний","qty":4}]'::jsonb),
    ('SG-DEMO-0022', 'petro.shevchuk@sugarglaze.test', 'new', interval '6 hour', '[{"product":"Мусовий десерт Манго-Маракуя","qty":5},{"product":"Круасан Мигдальний","qty":5}]'::jsonb),
    ('SG-DEMO-0023', 'olena.hrytsenko@sugarglaze.test', 'completed', interval '27 day', '[{"product":"Торт Рафаелло","qty":1},{"product":"Печиво Сабле","qty":16}]'::jsonb),
    ('SG-DEMO-0024', 'marta.bondar@sugarglaze.test', 'new', interval '2 hour', '[{"product":"Тістечко Картопля","qty":8},{"product":"Пана-кота Манго","qty":4},{"product":"Капкейки Шоколадні","qty":6}]'::jsonb)
),
resolved_orders as (
  select
    os.order_id,
    customer.id as user_id,
    customer.full_name as customer_name,
    customer.phone as customer_phone,
    customer.address as customer_address,
    customer.email as customer_email,
    jsonb_agg(
      jsonb_build_object(
        'id', sweet.id,
        'name', sweet.name,
        'price', sweet.price,
        'qty', (line.item ->> 'qty')::int,
        'subtotal', round((sweet.price * ((line.item ->> 'qty')::int))::numeric, 2)
      )
      order by line.ordinality
    ) as items,
    round(sum(sweet.price * ((line.item ->> 'qty')::int))::numeric, 2) as total_amount,
    os.status,
    now() - os.created_offset as created_at
  from order_seed as os
  join public.users as customer
    on customer.email = os.customer_email
  join lateral jsonb_array_elements(os.lines) with ordinality as line(item, ordinality)
    on true
  join public.sweets as sweet
    on sweet.name = line.item ->> 'product'
  group by
    os.order_id,
    customer.id,
    customer.full_name,
    customer.phone,
    customer.address,
    customer.email,
    os.status,
    os.created_offset
)
insert into public.orders (
  order_id,
  user_id,
  customer_name,
  customer_phone,
  customer_address,
  customer_email,
  items,
  total_amount,
  status,
  created_at
)
select
  ro.order_id,
  ro.user_id,
  ro.customer_name,
  ro.customer_phone,
  ro.customer_address,
  ro.customer_email,
  ro.items,
  ro.total_amount,
  ro.status,
  ro.created_at
from resolved_orders as ro
where not exists (
  select 1
  from public.orders as existing_order
  where existing_order.order_id = ro.order_id
);


