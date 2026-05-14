-- Fix search_path on set_updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

-- Lock down execution rights of SECURITY DEFINER helpers
revoke all on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;