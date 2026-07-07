-- Correção: app_is_manager() deve retornar booleano ESTRITO (nunca null).
-- Antes, papel null -> `in (...)` = null -> `if not null then raise` não disparava,
-- deixando passar chamadas de RPC sem papel. COALESCE fecha o furo.
create or replace function public.app_is_manager()
returns boolean
language sql stable
as $$ select coalesce(public.app_role() in ('Admin', 'Gestor'), false) $$;
