-- RLS + RPC authorization tests (threat model T1–T5, T7; AC-10).
-- Runs as one DO block and ALWAYS ends by raising the report as an exception,
-- so every fixture (fake auth users, orders, draft product) is rolled back.
-- Run: paste into the SQL editor / execute_sql. Read the "RLS_REPORT" error text.
do $$
declare
  a uuid := '00000000-0000-4000-a000-00000000000a';   -- shopper A (fictional)
  b uuid := '00000000-0000-4000-a000-00000000000b';   -- shopper B (fictional)
  adm uuid := '00000000-0000-4000-a000-0000000000ad'; -- admin (fictional)
  v_variant uuid;
  v_product uuid;
  v_draft uuid;
  v_order_b uuid;
  v_guest record;
  n int;
  ok boolean;
  report text := '';
  passed int := 0;
  failed int := 0;

begin
  -- ---------- fixtures (as the owner) ----------
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@example.test', '{"full_name":"Test A"}', now(), now()),
         (b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@example.test', '{"full_name":"Test B"}', now(), now()),
         (adm, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-admin@example.test', '{}', now(), now());
  update public.profiles set role = 'admin' where id = adm;

  select v.id, v.product_id into v_variant, v_product
  from public.product_variants v join public.products p on p.id = v.product_id
  where p.status = 'published' and v.stock >= 2 limit 1;

  insert into public.products (slug, name, category_id, price_cents, status)
  values ('rls-draft-test', 'RLS Draft', (select id from public.categories limit 1), 1000, 'draft') returning id into v_draft;

  insert into public.orders (number, user_id, email, phone, full_name, country, city, address, subtotal_cents)
  values ('RL-TESTB1', b, 'rls-b@example.test', '+233 20 000 0001', 'Test B', 'Ghana', 'Accra', '1 Test St', 1000) returning id into v_order_b;
  insert into public.order_items (order_id, product_id, variant_id, name, size, qty, unit_price_cents)
  values (v_order_b, v_product, v_variant, 'x', 'M', 1, 1000);

  -- ================= ANON =================
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';

  select count(*) into n from public.products where status <> 'published';
  ok := n = 0; report := report || format(E'\n%s anon cannot see draft products (saw %s)', case when ok then 'PASS' else 'FAIL' end, n);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  select count(*) into n from public.products;
  ok := n > 0; report := report || format(E'\n%s anon can browse published products (%s)', case when ok then 'PASS' else 'FAIL' end, n);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  select (select count(*) from public.orders) + (select count(*) from public.order_items) + (select count(*) from public.profiles) + (select count(*) from public.cart_items) into n;
  ok := n = 0; report := report || format(E'\n%s anon sees no orders/items/profiles/carts (saw %s)', case when ok then 'PASS' else 'FAIL' end, n);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  begin
    insert into public.products (slug, name, category_id, price_cents) values ('anon-hack', 'x', 1, 1);
    ok := false;
  exception when others then ok := true; end;
  report := report || format(E'\n%s anon cannot insert products', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  update public.product_variants set stock = 999 where id = v_variant;
  get diagnostics n = row_count;
  ok := n = 0; report := report || format(E'\n%s anon cannot change stock (rows %s)', case when ok then 'PASS' else 'FAIL' end, n);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  -- guest checkout via RPC works; server computes prices
  select * into v_guest from public.place_order(
    jsonb_build_array(jsonb_build_object('variant_id', v_variant, 'qty', 1)),
    '{"email":"guest@example.test","phone":"+233 20 000 0000","full_name":"Guest Test","country":"Ghana","city":"Accra","address":"2 Test St"}'::jsonb);
  ok := v_guest.order_number is not null; report := report || format(E'\n%s anon guest can place an order request (%s)', case when ok then 'PASS' else 'FAIL' end, v_guest.order_number);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  ok := public.get_order(v_guest.order_number) is null;
  report := report || format(E'\n%s get_order without token returns nothing', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  ok := public.get_order(v_guest.order_number, gen_random_uuid()) is null;
  report := report || format(E'\n%s get_order with a wrong token returns nothing', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  ok := public.get_order(v_guest.order_number, v_guest.guest_token) is not null;
  report := report || format(E'\n%s get_order with the right token returns the order', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  begin
    perform public.place_order(jsonb_build_array(jsonb_build_object('variant_id', v_variant, 'qty', 100000)),
      '{"email":"guest@example.test","phone":"000000","full_name":"G","country":"Ghana","city":"Accra","address":"2 Test St"}'::jsonb);
    ok := false;
  exception when others then ok := sqlerrm ilike '%stock%' or sqlerrm ilike '%qty%' or sqlerrm ilike '%quantity%'; end;
  report := report || format(E'\n%s place_order rejects quantities above stock', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  begin
    perform public.admin_set_order_status(v_order_b, 'confirmed');
    ok := false;
  exception when others then ok := true; end;
  report := report || format(E'\n%s anon cannot call admin_set_order_status', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  -- ================= SHOPPER A =================
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  insert into public.cart_items (user_id, variant_id, qty) values (a, v_variant, 1);
  select count(*) into n from public.cart_items;
  ok := n = 1; report := report || format(E'\n%s A can write and read own cart (%s)', case when ok then 'PASS' else 'FAIL' end, n);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  begin
    insert into public.cart_items (user_id, variant_id, qty) values (b, v_variant, 1);
    ok := false;
  exception when others then ok := true; end;
  report := report || format(E'\n%s A cannot write into B''s cart', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  begin
    insert into public.wishlist_items (user_id, product_id) values (b, v_product);
    ok := false;
  exception when others then ok := true; end;
  report := report || format(E'\n%s A cannot write into B''s wishlist', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  select count(*) into n from public.orders where user_id = b;
  ok := n = 0; report := report || format(E'\n%s A cannot read B''s orders (saw %s)', case when ok then 'PASS' else 'FAIL' end, n);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  select count(*) into n from public.order_items where order_id = v_order_b;
  ok := n = 0; report := report || format(E'\n%s A cannot read B''s order items (saw %s)', case when ok then 'PASS' else 'FAIL' end, n);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  select count(*) into n from public.profiles;
  ok := n = 1; report := report || format(E'\n%s A sees only own profile (saw %s)', case when ok then 'PASS' else 'FAIL' end, n);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  begin
    update public.profiles set role = 'admin' where id = a;
  exception when others then null; end;
  select (role = 'shopper') into ok from public.profiles where id = a;
  report := report || format(E'\n%s A cannot promote self to admin', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  update public.profiles set full_name = 'Renamed A' where id = a;
  select (full_name = 'Renamed A') into ok from public.profiles where id = a;
  report := report || format(E'\n%s A can update own name', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  update public.profiles set full_name = 'Hacked' where id = b;
  get diagnostics n = row_count;
  ok := n = 0; report := report || format(E'\n%s A cannot update B''s profile (rows %s)', case when ok then 'PASS' else 'FAIL' end, n);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  update public.products set price_cents = 1 where id = v_product;
  get diagnostics n = row_count;
  ok := n = 0; report := report || format(E'\n%s A cannot change product prices (rows %s)', case when ok then 'PASS' else 'FAIL' end, n);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  select count(*) into n from public.products where id = v_draft;
  ok := n = 0; report := report || format(E'\n%s A cannot see draft products', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  begin
    perform public.admin_set_order_status(v_order_b, 'confirmed');
    ok := false;
  exception when others then ok := true; end;
  report := report || format(E'\n%s A cannot change order status', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  begin
    insert into storage.objects (bucket_id, name, owner) values ('product-images', 'rls-test/x.jpg', a);
    ok := false;
  exception when others then ok := true; end;
  report := report || format(E'\n%s A cannot upload to product-images', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  -- ================= SHOPPER B (owner) =================
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  select count(*) into n from public.orders where id = v_order_b;
  ok := n = 1; report := report || format(E'\n%s B can read own order', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  select count(*) into n from public.cart_items;
  ok := n = 0; report := report || format(E'\n%s B cannot see A''s cart (saw %s)', case when ok then 'PASS' else 'FAIL' end, n);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  -- ================= ADMIN =================
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  select count(*) into n from public.products where id = v_draft;
  ok := n = 1; report := report || format(E'\n%s admin sees draft products', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  update public.products set name = 'RLS Draft (edited)' where id = v_draft;
  get diagnostics n = row_count;
  ok := n = 1; report := report || format(E'\n%s admin can edit products', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  select count(*) into n from public.orders where id = v_order_b;
  ok := n = 1; report := report || format(E'\n%s admin can read any order', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  ok := public.admin_set_order_status(v_order_b, 'confirmed') = 'confirmed';
  report := report || format(E'\n%s admin can confirm an order', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  begin
    perform public.admin_set_order_status(v_order_b, 'requested');
    ok := false;
  exception when others then ok := true; end;
  report := report || format(E'\n%s invalid status transitions are rejected', case when ok then 'PASS' else 'FAIL' end);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  select count(*) into n from public.cart_items;
  ok := n = 0; report := report || format(E'\n%s admin cannot read shoppers'' carts (saw %s)', case when ok then 'PASS' else 'FAIL' end, n);
  if ok then passed := passed + 1; else failed := failed + 1; end if;

  execute 'reset role';
  raise exception 'RLS_REPORT passed=% failed=% %', passed, failed, report;
end $$;
