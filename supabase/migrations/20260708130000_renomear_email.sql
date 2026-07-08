-- Renomear e-mail de um usuário de forma TRANSACIONAL: o e-mail é a chave do
-- cadastro e aparece como referência (por valor) em várias tabelas. Esta função
-- atualiza todas de uma vez (ou nada). O Auth é atualizado à parte pela Edge
-- Function admin-users (que chama esta função e reverte o Auth se ela falhar).

create or replace function public.renomear_email(p_old text, p_new text)
returns json language plpgsql security definer set search_path = public
as $$
declare
  v_old text := lower(p_old);
  v_new text := lower(p_new);
begin
  -- Só a plataforma/gestão (ou o próprio service role da Edge Function) renomeia.
  if not (coalesce(auth.jwt() ->> 'role', '') = 'service_role' or public.app_is_manager()) then
    raise exception 'Sem permissão';
  end if;

  if v_new is null or position('@' in v_new) = 0 then raise exception 'E-mail inválido'; end if;
  if not exists (select 1 from public.users where lower("Email") = v_old) then raise exception 'Usuário não encontrado'; end if;
  if v_old <> v_new and exists (select 1 from public.users where lower("Email") = v_new) then
    raise exception 'Este e-mail já está em uso';
  end if;

  -- Referências por valor (sem FK) — atualiza todas.
  update public.users          set "Gestor"      = p_new where lower("Gestor")      = v_old;
  update public.tasks          set "Responsavel" = p_new where lower("Responsavel") = v_old;
  update public.task_templates set "Responsavel" = p_new where lower("Responsavel") = v_old;
  update public.score_ledger   set "UserEmail"   = p_new where lower("UserEmail")   = v_old;
  update public.user_empresas  set email         = p_new where lower(email)         = v_old;
  -- A chave primária por último.
  update public.users          set "Email"       = p_new where lower("Email")       = v_old;

  return json_build_object('ok', true, 'email', p_new);
end $$;

grant execute on function public.renomear_email(text, text) to authenticated, service_role;
