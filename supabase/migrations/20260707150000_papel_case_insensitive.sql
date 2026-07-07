-- Checagem de papel indiferente a maiúsculas/minúsculas (master/Master/MASTER = igual).
create or replace function public.app_is_manager()
returns boolean language sql stable
as $$ select coalesce(lower(public.app_role()) in ('plataforma', 'master', 'admin', 'gestor'), false) $$;

create or replace function public.app_is_plataforma()
returns boolean language sql stable
as $$ select coalesce(lower(public.app_role()) = 'plataforma', false) $$;
