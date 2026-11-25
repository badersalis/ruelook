-- Fix: guard_profile_role still called public.is_admin() (execute revoked in 000003),
-- and blocked the database owner from promoting the demo admin from the SQL editor.
-- Role changes are allowed only for: the DB owner (dashboard SQL), service_role, or an admin.
create or replace function public.guard_profile_role()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and current_user not in ('postgres', 'supabase_admin')
     and coalesce((select auth.role()), '') <> 'service_role'
     and not (select private.is_admin()) then
    raise exception 'role cannot be changed';
  end if;
  return new;
end; $$;
