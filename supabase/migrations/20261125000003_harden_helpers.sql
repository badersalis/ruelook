-- Advisor follow-up (non-destructive): RLS helpers move to a non-exposed `private` schema;
-- policies are repointed with ALTER POLICY; the old public helpers lose EXECUTE (not dropped).
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'); $$;

create or replace function private.is_published(p_product uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.products p where p.id = p_product and p.status = 'published'); $$;

revoke execute on function private.is_admin() from public;
revoke execute on function private.is_published(uuid) from public;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_published(uuid) to anon, authenticated;

alter policy categories_admin on public.categories using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy products_read on public.products using (status = 'published' or (select private.is_admin()));
alter policy products_admin_ins on public.products with check ((select private.is_admin()));
alter policy products_admin_upd on public.products using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy products_admin_del on public.products using ((select private.is_admin()));
alter policy colors_read on public.product_colors using (private.is_published(product_id) or (select private.is_admin()));
alter policy colors_admin_ins on public.product_colors with check ((select private.is_admin()));
alter policy colors_admin_upd on public.product_colors using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy colors_admin_del on public.product_colors using ((select private.is_admin()));
alter policy variants_read on public.product_variants using (private.is_published(product_id) or (select private.is_admin()));
alter policy variants_admin_ins on public.product_variants with check ((select private.is_admin()));
alter policy variants_admin_upd on public.product_variants using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy variants_admin_del on public.product_variants using ((select private.is_admin()));
alter policy images_read on public.product_images using (private.is_published(product_id) or (select private.is_admin()));
alter policy images_admin_ins on public.product_images with check ((select private.is_admin()));
alter policy images_admin_upd on public.product_images using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy images_admin_del on public.product_images using ((select private.is_admin()));
alter policy looks_read on public.ai_looks using (private.is_published(product_id) or (select private.is_admin()));
alter policy looks_admin on public.ai_looks using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy profiles_select on public.profiles using (id = (select auth.uid()) or (select private.is_admin()));
alter policy orders_select on public.orders using (user_id = (select auth.uid()) or (select private.is_admin()));
alter policy order_items_select on public.order_items
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or (select private.is_admin()))));
alter policy product_images_admin_insert on storage.objects with check (bucket_id = 'product-images' and (select private.is_admin()));
alter policy product_images_admin_update on storage.objects
  using (bucket_id = 'product-images' and (select private.is_admin())) with check (bucket_id = 'product-images' and (select private.is_admin()));
alter policy product_images_admin_delete on storage.objects using (bucket_id = 'product-images' and (select private.is_admin()));

create or replace function public.guard_profile_role()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and coalesce((select auth.role()), '') <> 'service_role'
     and not private.is_admin() then
    raise exception 'role cannot be changed';
  end if;
  return new;
end; $$;

create or replace function public.get_order(p_number text, p_token uuid default null)
returns jsonb language sql stable security definer set search_path = ''
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
         or private.is_admin());
$$;

create or replace function public.admin_set_order_status(p_order uuid, p_status public.order_status)
returns public.order_status language plpgsql security definer set search_path = ''
as $$
declare
  v_cur public.order_status;
  v_applied boolean;
begin
  if not private.is_admin() then raise exception 'admins only'; end if;
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

-- Old public helpers: no longer referenced; remove API access (kept, not dropped)
revoke execute on function public.is_admin() from public, anon, authenticated;
revoke execute on function public.is_published(uuid) from public, anon, authenticated;
