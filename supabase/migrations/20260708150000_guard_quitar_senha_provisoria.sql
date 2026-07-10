-- Correção do loop de "primeiro acesso" para usuários comuns (Colaborador).
-- O gatilho users_guard_self_update revertia SenhaProvisoria, então a RPC
-- clear_senha_provisoria() (security definer, mas o gatilho lê o JWT do próprio
-- usuário) nunca zerava a flag — o colaborador ficava preso na tela de senha.
--
-- Agora o usuário comum PODE quitar a própria senha provisória (true -> false),
-- que não é escalada de privilégio; todo o resto continua imutável.
create or replace function public.users_guard_self_update()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' or public.app_is_manager() then
    return new;
  end if;
  -- usuário comum: permite APENAS quitar a própria senha provisória (true -> false)
  if not (old."SenhaProvisoria" = true and new."SenhaProvisoria" = false) then
    new."SenhaProvisoria" := old."SenhaProvisoria";
  end if;
  new."Role"               := old."Role";
  new."Status"             := old."Status";
  new."TentativasFalhadas" := old."TentativasFalhadas";
  new."Gestor"             := old."Gestor";
  new."Email"              := old."Email";
  new.user_id              := old.user_id;
  new.empresa_id           := old.empresa_id;
  return new;
end $$;
