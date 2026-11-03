-- Direct profile updates never grant administrative privileges.
-- Privileged changes go through admin-users with the service-role JWT.
create or replace function public.users_guard_self_update()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;
  -- usuário comum: permite APENAS quitar a própria senha provisória (true -> false)
  if not (old."SenhaProvisoria" = true and new."SenhaProvisoria" = false) then
    new."SenhaProvisoria" := old."SenhaProvisoria";
  end if;
  new."Time"               := old."Time";
  new."DataCriacao"        := old."DataCriacao";
  new."Role"               := old."Role";
  new."Status"             := old."Status";
  new."TentativasFalhadas" := old."TentativasFalhadas";
  new."Gestor"             := old."Gestor";
  new."Email"              := old."Email";
  new.user_id              := old.user_id;
  new.empresa_id           := old.empresa_id;
  return new;
end $$;

-- Email changes must pass the tenant/role checks in the Edge Function.
create or replace function public.renomear_email(p_old text, p_new text)
returns json language plpgsql security definer set search_path = public
as $$
declare
  v_old text := lower(p_old);
  v_new text := lower(p_new);
begin
  -- Só a plataforma/gestão (ou o próprio service role da Edge Function) renomeia.
  if not (coalesce(auth.jwt() ->> 'role', '') = 'service_role') then
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

revoke all on function public.renomear_email(text, text) from public, anon, authenticated;
grant execute on function public.renomear_email(text, text) to service_role;

-- Access grants are administrative too; the direct table API must enforce the
-- same boundary as set-empresas, while preserving admins' multi-company scope.
drop policy if exists ue_manage on public.user_empresas;
create policy ue_manage on public.user_empresas for all to authenticated
  using (public.app_is_plataforma() or (
    lower(public.app_role()) in ('admin', 'master') and public.app_tem_acesso(empresa_id)
  ))
  with check (public.app_is_plataforma() or (
    lower(public.app_role()) in ('admin', 'master') and public.app_tem_acesso(empresa_id)
  ));
