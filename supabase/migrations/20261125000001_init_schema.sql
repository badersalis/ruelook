-- Ruelook v1: schema, RLS, RPCs (see docs/architecture/system-overview.md)
create extension if not exists pg_trgm with schema extensions;

-- Enums
create type public.product_status as enum ('draft', 'published', 'archived');
create type public.user_role as enum ('shopper', 'admin');
create type public.order_status as enum ('requested', 'confirmed', 'shipped', 'completed', 'cancelled');

-- Catalogue
create table public.categories (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) <= 60),
  sort smallint not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$' and char_length(slug) <= 120),
  name text not null check (char_length(name) between 1 and 120),
  category_id smallint not null references public.categories(id),
  description text not null default '' check (char_length(description) <= 2000),
  material_care text not null default '' check (char_length(material_care) <= 1000),
  price_cents integer not null check (price_cents >= 0 and price_cents <= 10000000),
  status public.product_status not null default 'draft',
  drop_label text check (char_length(drop_label) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id, status, created_at desc);
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);

create table public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null check (char_length(name) <= 40),
  hex text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  sort smallint not null default 0
);
create index product_colors_product_idx on public.product_colors (product_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color_id uuid references public.product_colors(id) on delete cascade,
  size text not null check (char_length(size) <= 12),
  stock integer not null default 0 check (stock >= 0),
  unique nulls not distinct (product_id, color_id, size)
);
create index product_variants_product_idx on public.product_variants (product_id);
create index product_variants_color_idx on public.product_variants (color_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color_id uuid references public.product_colors(id) on delete set null,
  path text not null check (char_length(path) <= 300),
  alt text not null default '' check (char_length(alt) <= 200),
  sort smallint not null default 0
);
create index product_images_product_idx on public.product_images (product_id, sort);
create index product_images_color_idx on public.product_images (color_id);

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  phone text check (char_length(phone) <= 40),
  role public.user_role not null default 'shopper',
  created_at timestamptz not null default now()
);

-- Shopper data
create table public.cart_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  qty smallint not null check (qty between 1 and 10),
  updated_at timestamptz not null default now(),
  primary key (user_id, variant_id)
);
create index cart_items_variant_idx on public.cart_items (variant_id);

create table public.wishlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index wishlist_items_product_idx on public.wishlist_items (product_id);

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  guest_token uuid not null default gen_random_uuid(),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text not null check (char_length(phone) between 5 and 40),
  country text not null check (char_length(country) between 2 and 60),
  city text not null check (char_length(city) between 1 and 80),
  address text not null check (char_length(address) between 3 and 200),
  status public.order_status not null default 'requested',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  stock_applied boolean not null default false,
  created_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_email_idx on public.orders (email, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  name text not null,
  color text,
  size text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  qty smallint not null check (qty between 1 and 10)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);
create index order_items_variant_idx on public.order_items (variant_id);

-- AI Stylist demo outputs (D-007)
create table public.ai_looks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  look_index smallint not null check (look_index between 1 and 3),
  title text not null check (char_length(title) <= 60),
  rationale text not null check (char_length(rationale) <= 200),
  item_product_ids uuid[] not null check (array_length(item_product_ids, 1) between 2 and 4),
  model text not null,
  prompt_version text not null,
  generated_at timestamptz not null default now(),
  unique (product_id, look_index)
);

-- Helpers
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;

create or replace function public.is_published(p_product uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.products p where p.id = p_product and p.status = 'published');
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at := now(); return new; end; $$;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- New user → profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 120));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Guard: users can't change their own role
create or replace function public.guard_profile_role()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and coalesce((select auth.role()), '') <> 'service_role'
     and not public.is_admin() then
    raise exception 'role cannot be changed';
  end if;
  return new;
end; $$;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- RLS
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.profiles enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.ai_looks enable row level security;

-- Catalogue: public read of published, admin all
create policy categories_read on public.categories for select to anon, authenticated using (true);
create policy categories_admin on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy products_read on public.products for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));
create policy products_admin_ins on public.products for insert to authenticated with check ((select public.is_admin()));
create policy products_admin_upd on public.products for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy products_admin_del on public.products for delete to authenticated using ((select public.is_admin()));

create policy colors_read on public.product_colors for select to anon, authenticated
  using (public.is_published(product_id) or (select public.is_admin()));
create policy colors_admin_ins on public.product_colors for insert to authenticated with check ((select public.is_admin()));
create policy colors_admin_upd on public.product_colors for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy colors_admin_del on public.product_colors for delete to authenticated using ((select public.is_admin()));

create policy variants_read on public.product_variants for select to anon, authenticated
  using (public.is_published(product_id) or (select public.is_admin()));
create policy variants_admin_ins on public.product_variants for insert to authenticated with check ((select public.is_admin()));
create policy variants_admin_upd on public.product_variants for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy variants_admin_del on public.product_variants for delete to authenticated using ((select public.is_admin()));

create policy images_read on public.product_images for select to anon, authenticated
  using (public.is_published(product_id) or (select public.is_admin()));
create policy images_admin_ins on public.product_images for insert to authenticated with check ((select public.is_admin()));
create policy images_admin_upd on public.product_images for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy images_admin_del on public.product_images for delete to authenticated using ((select public.is_admin()));

create policy looks_read on public.ai_looks for select to anon, authenticated
  using (public.is_published(product_id) or (select public.is_admin()));
create policy looks_admin on public.ai_looks for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Cart / wishlist: own rows
create policy cart_own on public.cart_items for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy wishlist_own on public.wishlist_items for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Orders: read own or admin; writes only via RPC (security definer)
create policy orders_select on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy order_items_select on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.user_id = (select auth.uid()) or (select public.is_admin()))));

-- RPC: place an order request (T4, T5)
create or replace function public.place_order(items jsonb, contact jsonb)
returns table (order_number text, guest_token uuid)
language plpgsql security definer set search_path = ''
as $$
declare
  v_order_id uuid;
  v_number text;
  v_token uuid;
  v_subtotal integer := 0;
  v_email text := lower(trim(contact->>'email'));
  v_item jsonb;
  v_qty integer;
  v_row record;
begin
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'cart is empty';
  end if;
  if jsonb_array_length(items) > 30 then
    raise exception 'too many items';
  end if;
  if (select count(*) from public.orders o where o.email = v_email and o.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'too many orders, try again later';
  end if;

  -- validate all lines first
  for v_item in select * from jsonb_array_elements(items) loop
    v_qty := (v_item->>'qty')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 10 then raise exception 'invalid quantity'; end if;
    select v.id, v.stock, p.status into v_row
      from public.product_variants v join public.products p on p.id = v.product_id
      where v.id = (v_item->>'variant_id')::uuid;
    if not found or v_row.status <> 'published' then raise exception 'item unavailable'; end if;
    if v_qty > v_row.stock then raise exception 'not enough stock'; end if;
  end loop;

  v_number := 'RL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.orders (number, user_id, email, full_name, phone, country, city, address, subtotal_cents)
  values (v_number, (select auth.uid()), v_email,
          trim(contact->>'full_name'), trim(contact->>'phone'), trim(contact->>'country'),
          trim(contact->>'city'), trim(contact->>'address'), 0)
  returning id, orders.guest_token into v_order_id, v_token;

  insert into public.order_items (order_id, product_id, variant_id, name, color, size, unit_price_cents, qty)
  select v_order_id, p.id, v.id, p.name, c.name, v.size, p.price_cents, (i->>'qty')::smallint
  from jsonb_array_elements(items) i
  join public.product_variants v on v.id = (i->>'variant_id')::uuid
  join public.products p on p.id = v.product_id
  left join public.product_colors c on c.id = v.color_id;

  select coalesce(sum(unit_price_cents * qty), 0) into v_subtotal from public.order_items where order_id = v_order_id;
  update public.orders set subtotal_cents = v_subtotal where id = v_order_id;

  return query select v_number, v_token;
end; $$;

-- RPC: fetch one order (guest via token, owner, admin)
create or replace function public.get_order(p_number text, p_token uuid default null)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'number', o.number, 'status', o.status, 'created_at', o.created_at,
    'email', o.email, 'full_name', o.full_name, 'country', o.country, 'city', o.city,
    'subtotal_cents', o.subtotal_cents,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'name', i.name, 'color', i.color, 'size', i.size, 'qty', i.qty,
        'unit_price_cents', i.unit_price_cents, 'product_id', i.product_id))
      from public.order_items i where i.order_id = o.id), '[]'::jsonb))
  from public.orders o
  where o.number = p_number
    and ((p_token is not null and o.guest_token = p_token)
         or o.user_id = (select auth.uid())
         or public.is_admin());
$$;

-- RPC: admin status transitions, stock on confirm/cancel
create or replace function public.admin_set_order_status(p_order uuid, p_status public.order_status)
returns public.order_status
language plpgsql security definer set search_path = ''
as $$
declare
  v_cur public.order_status;
  v_applied boolean;
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  select status, stock_applied into v_cur, v_applied from public.orders where id = p_order for update;
  if not found then raise exception 'order not found'; end if;
  if not (
    (v_cur = 'requested' and p_status in ('confirmed', 'cancelled')) or
    (v_cur = 'confirmed' and p_status in ('shipped', 'cancelled')) or
    (v_cur = 'shipped' and p_status = 'completed')
  ) then
    raise exception 'invalid transition % -> %', v_cur, p_status;
  end if;

  if p_status = 'confirmed' then
    if exists (select 1 from public.order_items i join public.product_variants v on v.id = i.variant_id
               where i.order_id = p_order and v.stock < i.qty) then
      raise exception 'not enough stock to confirm';
    end if;
    update public.product_variants v set stock = v.stock - i.qty
      from public.order_items i where i.order_id = p_order and v.id = i.variant_id;
    update public.orders set stock_applied = true where id = p_order;
  elsif p_status = 'cancelled' and v_applied then
    update public.product_variants v set stock = v.stock + i.qty
      from public.order_items i where i.order_id = p_order and v.id = i.variant_id;
    update public.orders set stock_applied = false where id = p_order;
  end if;

  update public.orders set status = p_status where id = p_order;
  return p_status;
end; $$;

-- Function privileges
revoke execute on function public.admin_set_order_status(uuid, public.order_status) from public, anon;
grant execute on function public.admin_set_order_status(uuid, public.order_status) to authenticated;
revoke execute on function public.place_order(jsonb, jsonb) from public;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;
revoke execute on function public.get_order(text, uuid) from public;
grant execute on function public.get_order(text, uuid) to anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
