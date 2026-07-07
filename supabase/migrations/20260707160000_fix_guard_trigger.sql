-- Correção: o gatilho que impede um usuário comum de mudar o próprio papel/status
-- estava bloqueando também as atualizações administrativas (service role / Edge Function
-- e gestão). Agora ele só trava usuário comum mexendo na própria linha.
create or replace function public.users_guard_self_update()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  -- Service role (Edge Functions) e papéis de gestão podem alterar campos sensíveis.
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' or public.app_is_manager() then
    return new;
  end if;
  -- Usuário comum: preserva os campos sensíveis do próprio cadastro.
  new."Role"               := old."Role";
  new."Status"             := old."Status";
  new."SenhaProvisoria"    := old."SenhaProvisoria";
  new."TentativasFalhadas" := old."TentativasFalhadas";
  new."Gestor"             := old."Gestor";
  new."Email"              := old."Email";
  new.user_id              := old.user_id;
  new.empresa_id           := old.empresa_id;
  return new;
end $$;
