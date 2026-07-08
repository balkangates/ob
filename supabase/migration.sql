-- ================================================================
-- ORBI LIFE — Migration v3 (Kesin düzeltme)
-- ADIM 1: Önce bu bloğu çalıştırın (temizlik)
-- ADIM 2: Sonra aşağısını çalıştırın (oluşturma)
-- ================================================================

-- ----------------------------------------------------------------
-- ADIM 1: Temizlik — mevcut her şeyi sil
-- ----------------------------------------------------------------
drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user()           cascade;
drop function if exists public.is_admin()                  cascade;
drop function if exists public.increment_coupon_usage(int) cascade;

drop table if exists public.cash_transactions  cascade;
drop table if exists public.reservations       cascade;
drop table if exists public.coupons            cascade;
drop table if exists public.apartment_amenities cascade;
drop table if exists public.apartment_videos   cascade;
drop table if exists public.apartment_images   cascade;
drop table if exists public.apartments         cascade;
drop table if exists public.amenities          cascade;
drop table if exists public.facilities         cascade;
drop table if exists public.loyalty_levels     cascade;
drop table if exists public.apartment_types    cascade;
drop table if exists public.blocks             cascade;
drop table if exists public.settings           cascade;
drop table if exists public.profiles           cascade;

-- ----------------------------------------------------------------
-- ADIM 2: Yardımcı fonksiyon (policy'lerden önce oluşturulmalı)
-- ----------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin'
     from public.profiles
     where id = (auth.uid())
     limit 1),
    false
  );
$$;

-- ----------------------------------------------------------------
-- ADIM 3: Tablolar
-- ----------------------------------------------------------------

-- PROFILES
create table public.profiles (
  id                 uuid        primary key references auth.users(id) on delete cascade,
  full_name          text        not null default '',
  phone              text        not null default '',
  role               text        not null default 'guest',
  genius_level       integer     not null default 0,
  total_reservations integer     not null default 0,
  created_at         timestamptz not null default now()
);

-- BLOCKS
create table public.blocks (
  id          serial primary key,
  code        text   not null unique,
  name        text   not null default '',
  description text   not null default '',
  floors      integer not null default 40
);

-- APARTMENT_TYPES
create table public.apartment_types (
  id         serial primary key,
  code       text    not null unique,
  name       text    not null default '',
  bedrooms   integer not null default 0,
  bathrooms  integer not null default 1,
  max_guests integer not null default 2
);

-- APARTMENTS
create table public.apartments (
  id           serial          primary key,
  code         text            not null unique,
  name         text            not null default '',
  block_id     integer         not null references public.blocks(id),
  type_id      integer         not null references public.apartment_types(id),
  floor        integer         not null default 1,
  description  text            not null default '',
  rules        text            not null default '',
  base_price   numeric(10,2)   not null default 80,
  max_guests   integer         not null default 2,
  bedrooms     integer         not null default 0,
  bathrooms    integer         not null default 1,
  size_sqm     integer         not null default 35,
  sea_view     boolean         not null default false,
  balcony      boolean         not null default false,
  cover_image  text            not null default '',
  video_url    text            not null default '',
  tour_360_url text            not null default '',
  rating       numeric(3,2)    not null default 0,
  review_count integer         not null default 0,
  status       text            not null default 'active',
  created_at   timestamptz     not null default now()
);
create index apartments_block_idx  on public.apartments(block_id);
create index apartments_type_idx   on public.apartments(type_id);
create index apartments_status_idx on public.apartments(status);

-- APARTMENT_IMAGES
create table public.apartment_images (
  id           serial  primary key,
  apartment_id integer not null references public.apartments(id) on delete cascade,
  url          text    not null default '',
  sort_order   integer not null default 0
);
create index apt_images_apt_idx on public.apartment_images(apartment_id);

-- APARTMENT_VIDEOS
create table public.apartment_videos (
  id           serial  primary key,
  apartment_id integer not null references public.apartments(id) on delete cascade,
  url          text    not null default '',
  title        text    not null default '',
  sort_order   integer not null default 0
);

-- AMENITIES
create table public.amenities (
  id       serial primary key,
  name     text   not null unique,
  icon     text   not null default '✨',
  category text   not null default 'general'
);

-- APARTMENT_AMENITIES
create table public.apartment_amenities (
  apartment_id integer not null references public.apartments(id) on delete cascade,
  amenity_id   integer not null references public.amenities(id)  on delete cascade,
  primary key (apartment_id, amenity_id)
);

-- FACILITIES
create table public.facilities (
  id          serial  primary key,
  name        text    not null unique,
  description text    not null default '',
  icon        text    not null default '🏨',
  hours       text    not null default '24/7',
  active      boolean not null default true,
  sort_order  integer not null default 0
);

-- COUPONS
create table public.coupons (
  id             serial        primary key,
  code           text          not null unique,
  discount_type  text          not null default 'percent',
  discount_value numeric(10,2) not null default 10,
  min_nights     integer       not null default 1,
  valid_from     date,
  valid_to       date,
  max_uses       integer       not null default 1000,
  used_count     integer       not null default 0,
  active         boolean       not null default true
);

-- RESERVATIONS
create table public.reservations (
  id              serial        primary key,
  reference       text          not null unique,
  apartment_id    integer       not null references public.apartments(id),
  user_id         uuid                   references auth.users(id) on delete set null,
  check_in        date          not null,
  check_out       date          not null,
  nights          integer       not null default 1,
  guests          integer       not null default 1,
  base_price      numeric(10,2) not null default 0,
  subtotal        numeric(10,2) not null default 0,
  genius_discount numeric(10,2) not null default 0,
  coupon_discount numeric(10,2) not null default 0,
  total_price     numeric(10,2) not null default 0,
  coupon_id       integer                references public.coupons(id) on delete set null,
  guest_name      text          not null default '',
  guest_email     text          not null default '',
  guest_phone     text          not null default '',
  note            text          not null default '',
  status          text          not null default 'pending',
  payment_status  text          not null default 'unpaid',
  created_at      timestamptz   not null default now()
);
create index reservations_apt_idx    on public.reservations(apartment_id);
create index reservations_user_idx   on public.reservations(user_id);
create index reservations_dates_idx  on public.reservations(check_in, check_out);
create index reservations_status_idx on public.reservations(status);

-- LOYALTY_LEVELS
create table public.loyalty_levels (
  id               serial  primary key,
  level            integer not null unique,
  name             text    not null default '',
  min_reservations integer not null default 0,
  discount_percent integer not null default 0,
  perks            text    not null default ''
);

-- CASH_TRANSACTIONS
create table public.cash_transactions (
  id             serial        primary key,
  reservation_id integer                references public.reservations(id) on delete set null,
  guest_name     text          not null default '',
  apartment_code text          not null default '',
  amount         numeric(10,2) not null default 0,
  payment_type   text          not null default 'cash',
  note           text          not null default '',
  paid_at        date          not null default current_date,
  created_at     timestamptz   not null default now()
);
create index cash_paid_at_idx on public.cash_transactions(paid_at);

-- SETTINGS
create table public.settings (
  id             integer     primary key default 1,
  site_name      text        not null default 'Orbi Life',
  site_url       text        not null default '',
  contact_email  text        not null default '',
  contact_phone  text        not null default '',
  check_in_time  text        not null default '14:00',
  check_out_time text        not null default '12:00',
  currency       text        not null default 'USD',
  updated_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- ADIM 4: RLS aktif et
-- ----------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.blocks              enable row level security;
alter table public.apartment_types     enable row level security;
alter table public.apartments          enable row level security;
alter table public.apartment_images    enable row level security;
alter table public.apartment_videos    enable row level security;
alter table public.amenities           enable row level security;
alter table public.apartment_amenities enable row level security;
alter table public.facilities          enable row level security;
alter table public.coupons             enable row level security;
alter table public.reservations        enable row level security;
alter table public.loyalty_levels      enable row level security;
alter table public.cash_transactions   enable row level security;
alter table public.settings            enable row level security;

-- ----------------------------------------------------------------
-- ADIM 5: RLS policy'leri
-- NOT: auth.uid() text döner, id uuid'dir.
-- Cast: auth.uid()::uuid ile tip eşleşmesi sağlanır.
-- ----------------------------------------------------------------

-- profiles
create policy "profiles_select"
  on public.profiles for select
  using (auth.uid()::uuid = id or public.is_admin());

create policy "profiles_insert"
  on public.profiles for insert
  with check (auth.uid()::uuid = id);

create policy "profiles_update"
  on public.profiles for update
  using (auth.uid()::uuid = id or public.is_admin());

create policy "profiles_admin_delete"
  on public.profiles for delete
  using (public.is_admin());

-- blocks, types, amenities, facilities, loyalty, settings → herkes okur
create policy "blocks_select"      on public.blocks           for select using (true);
create policy "blocks_admin"       on public.blocks           for all    using (public.is_admin());

create policy "types_select"       on public.apartment_types  for select using (true);
create policy "types_admin"        on public.apartment_types  for all    using (public.is_admin());

create policy "amenities_select"   on public.amenities        for select using (true);
create policy "amenities_admin"    on public.amenities        for all    using (public.is_admin());

create policy "apt_am_select"      on public.apartment_amenities for select using (true);
create policy "apt_am_admin"       on public.apartment_amenities for all    using (public.is_admin());

create policy "facilities_select"  on public.facilities       for select using (true);
create policy "facilities_admin"   on public.facilities       for all    using (public.is_admin());

create policy "loyalty_select"     on public.loyalty_levels   for select using (true);
create policy "loyalty_admin"      on public.loyalty_levels   for all    using (public.is_admin());

create policy "settings_select"    on public.settings         for select using (true);
create policy "settings_admin"     on public.settings         for update using (public.is_admin());

create policy "coupons_select"     on public.coupons          for select using (true);
create policy "coupons_admin"      on public.coupons          for all    using (public.is_admin());

-- apartments
create policy "apartments_select"
  on public.apartments for select
  using (status = 'active' or public.is_admin());

create policy "apartments_admin"
  on public.apartments for all
  using (public.is_admin());

-- apartment_images, apartment_videos
create policy "apt_images_select"  on public.apartment_images for select using (true);
create policy "apt_images_admin"   on public.apartment_images for all    using (public.is_admin());

create policy "apt_videos_select"  on public.apartment_videos for select using (true);
create policy "apt_videos_admin"   on public.apartment_videos for all    using (public.is_admin());

-- reservations
create policy "reservations_select"
  on public.reservations for select
  using (
    auth.uid()::uuid = user_id
    or public.is_admin()
  );

create policy "reservations_insert"
  on public.reservations for insert
  with check (
    auth.uid()::uuid = user_id
    or public.is_admin()
  );

create policy "reservations_update"
  on public.reservations for update
  using (public.is_admin());

-- cash_transactions
create policy "cash_admin"
  on public.cash_transactions for all
  using (public.is_admin());

-- ----------------------------------------------------------------
-- ADIM 6: Trigger — yeni kullanıcı → profil oluştur
-- ----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------
-- ADIM 7: RPC fonksiyonu
-- ----------------------------------------------------------------
create or replace function public.increment_coupon_usage(p_coupon_id integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.coupons
  set used_count = used_count + 1
  where id = p_coupon_id;
end;
$$;

-- ----------------------------------------------------------------
-- ADIM 8: Seed data
-- ----------------------------------------------------------------
insert into public.blocks (code, name, description, floors) values
  ('A', 'Blok A', 'Karadeniz manzaralı daireler', 40),
  ('B', 'Blok B', 'Şehir manzaralı daireler', 35),
  ('C', 'Blok C', 'Kafkas dağı manzaralı daireler', 30)
on conflict (code) do nothing;

insert into public.apartment_types (code, name, bedrooms, bathrooms, max_guests) values
  ('1+0', 'Stüdyo (1+0)', 0, 1, 2),
  ('1+1', '1+1',          1, 1, 3),
  ('2+1', '2+1',          2, 1, 5),
  ('3+1', '3+1',          3, 2, 7)
on conflict (code) do nothing;

insert into public.loyalty_levels (level, name, min_reservations, discount_percent, perks) values
  (0, 'Explorer', 0,  0,  'Standart fiyatlar'),
  (1, 'Silver',   2,  10, '%10 indirim'),
  (2, 'Gold',     5,  15, '%15 indirim · Geç çıkış'),
  (3, 'Platinum', 10, 20, '%20 indirim · VIP karşılama · Ücretsiz havalimanı transferi')
on conflict (level) do nothing;

insert into public.facilities (name, description, icon, hours, sort_order) values
  ('Havuz',       'Açık ve kapalı yüzme havuzu', '🏊', '08:00–22:00', 1),
  ('Spa & Sauna', 'Sauna, buhar odası, masaj',   '🧖', '09:00–21:00', 2),
  ('Fitness',     'Tam donanımlı spor salonu',   '💪', '07:00–23:00', 3),
  ('Restoran',    'Kahvaltı ve akşam yemeği',    '🍽️', '07:00–23:00', 4),
  ('Kafe',        'Snack, içecek, pasta',        '☕', '08:00–24:00', 5),
  ('Casino',      'Oyun ve eğlence merkezi',     '🎰', '18:00–06:00', 6),
  ('Otopark',     'Kapalı otopark, ücretsiz',    '🅿️', '24/7',       7),
  ('Resepsiyon',  '24 saat hizmet',              '🛎️', '24/7',       8)
on conflict (name) do nothing;

insert into public.settings (id, site_name, contact_email, contact_phone)
values (1, 'Orbi Life', 'info@orbicity-batumi.com', '+995 422 000 000')
on conflict (id) do nothing;

insert into public.amenities (name, icon, category) values
  ('Wi-Fi',             '📶', 'temel'),
  ('Klima',             '❄️', 'temel'),
  ('Tam Mutfak',        '🍳', 'temel'),
  ('Çamaşır Makinesi', '🫧', 'temel'),
  ('Smart TV',          '📺', 'eğlence'),
  ('Balkon',            '🌅', 'ekstra'),
  ('Jakuzi',            '🛁', 'ekstra'),
  ('Güvenli Kasa',      '🔒', 'güvenlik')
on conflict (name) do nothing;
