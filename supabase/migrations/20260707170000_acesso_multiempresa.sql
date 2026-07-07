-- Acesso multi-empresa: um usuário (master/gestor) pode acessar VÁRIAS empresas.
-- Vínculo em user_empresas; acesso = empresa "casa" (users.empresa_id) + vínculos.

create table if not exists public.user_empresas (
  email       text not null,
  empresa_id  text not null references public.empresas(id) on delete cascade,
  papel       text,
  created_at  timestamptz not null default now(),
  primary key (email, empresa_id)
);
create index if not exists idx_user_empresas_email on public.user_empresas (lower(email));
alter table public.user_empresas enable row level security;

-- Conjunto de empresas que o usuário logado acessa (casa + vínculos)
create or replace function public.app_empresas()
returns setof text language sql stable security definer set search_path = public
as $$
  select empresa_id from public.users
    where lower("Email") = lower(auth.jwt() ->> 'email') and empresa_id is not null
  union
  select empresa_id from public.user_empresas
    where lower(email) = lower(auth.jwt() ->> 'email')
$$;

create or replace function public.app_tem_acesso(emp text)
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce(public.app_is_plataforma() or emp in (select public.app_empresas()), false)
$$;

grant execute on function public.app_empresas() to authenticated;
grant execute on function public.app_tem_acesso(text) to authenticated;

-- ===== RLS passa a usar "tem acesso" (não mais empresa única) =====
drop policy if exists users_select on public.users;
create policy users_select on public.users for select to authenticated using (public.app_tem_acesso(empresa_id));
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated using (public.app_tem_acesso(empresa_id));
drop policy if exists templates_select on public.task_templates;
create policy templates_select on public.task_templates for select to authenticated using (public.app_tem_acesso(empresa_id));
drop policy if exists ledger_select on public.score_ledger;
create policy ledger_select on public.score_ledger for select to authenticated using (public.app_tem_acesso(empresa_id));

drop policy if exists tasks_manage on public.tasks;
create policy tasks_manage on public.tasks for all to authenticated
  using (public.app_is_manager() and public.app_tem_acesso(empresa_id))
  with check (public.app_is_manager() and public.app_tem_acesso(empresa_id));
drop policy if exists templates_manage on public.task_templates;
create policy templates_manage on public.task_templates for all to authenticated
  using (public.app_is_manager() and public.app_tem_acesso(empresa_id))
  with check (public.app_is_manager() and public.app_tem_acesso(empresa_id));

drop policy if exists empresas_select on public.empresas;
create policy empresas_select on public.empresas for select to authenticated
  using (public.app_is_plataforma() or id in (select public.app_empresas()));

-- Vínculos: usuário vê os próprios; plataforma e gestão (dentro da empresa) gerenciam
drop policy if exists ue_select on public.user_empresas;
create policy ue_select on public.user_empresas for select to authenticated
  using (public.app_is_plataforma() or lower(email) = lower(auth.jwt() ->> 'email') or public.app_tem_acesso(empresa_id));
drop policy if exists ue_manage on public.user_empresas;
create policy ue_manage on public.user_empresas for all to authenticated
  using (public.app_is_plataforma() or (public.app_is_manager() and public.app_tem_acesso(empresa_id)))
  with check (public.app_is_plataforma() or (public.app_is_manager() and public.app_tem_acesso(empresa_id)));

-- ===== RPCs: trocar a checagem de "mesma empresa" por "tem acesso" =====
create or replace function public.complete_task(p_id text, p_note text, p_proof text)
returns void language plpgsql security definer set search_path = public
as $$
declare v_resp text; v_emp text; v_email text := auth.jwt() ->> 'email';
begin
  select "Responsavel", empresa_id into v_resp, v_emp from public.tasks where "ID" = p_id;
  if v_resp is null then raise exception 'Tarefa não encontrada'; end if;
  if not public.app_tem_acesso(v_emp) then raise exception 'Sem permissão (outra empresa)'; end if;
  if lower(v_resp) <> lower(v_email) and not public.app_is_manager() then
    raise exception 'Sem permissão para concluir esta tarefa';
  end if;
  update public.tasks set
    "Status" = 'Aguardando Aprovação', "DataConclusao" = now(),
    "CompletionNote" = p_note, "ProofAttachment" = p_proof, "JustificativaGestor" = null
  where "ID" = p_id;
end $$;

create or replace function public.audit_task(p_id text, p_status text, p_obs text)
returns json language plpgsql security definer set search_path = public
as $$
declare t public.tasks%rowtype; v_new text; v_delta int := 0; v_tipo text := 'GANHO'; v_desc text := ''; v_ap boolean := false;
begin
  if not public.app_is_manager() then raise exception 'Sem permissão'; end if;
  select * into t from public.tasks where "ID" = p_id;
  if t."ID" is null then raise exception 'Tarefa não encontrada'; end if;
  if not public.app_tem_acesso(t.empresa_id) then raise exception 'Sem permissão (outra empresa)'; end if;

  if p_status = 'APROVADO' then
    v_new := 'Aprovada'; v_ap := true; v_delta := t."PontosValor"; v_tipo := 'GANHO'; v_desc := 'Aprovação: ' || t."Titulo";
  elsif p_status = 'ERRO_EXECUCAO' then
    v_new := 'Feita Errada'; v_delta := -ceil(t."PontosValor"::numeric * 0.5)::int; v_tipo := 'PENALIDADE'; v_desc := 'Pena – Erro: ' || t."Titulo";
  elsif p_status = 'NAO_CUMPRIU' then
    v_new := 'Não Feita'; v_delta := -t."PontosValor"; v_tipo := 'PENALIDADE'; v_desc := 'Penalidade – Não Concluída: ' || t."Titulo";
  else raise exception 'Status de auditoria inválido: %', p_status; end if;

  update public.tasks set
    "Status" = v_new, "ConferenciaStatus" = p_status, "ObservacaoGestor" = p_obs, "JustificativaGestor" = p_obs,
    "Tentativas" = case when v_ap then t."Tentativas" else coalesce(t."Tentativas",0)+1 end,
    "DataConclusao" = case when v_ap then t."DataConclusao" else null end
  where "ID" = p_id;

  insert into public.score_ledger ("UserEmail", "Data", "Pontos", "Tipo", "Descricao", empresa_id)
  values (t."Responsavel", now(), v_delta, v_tipo, v_desc, t.empresa_id);
  return json_build_object('pontos', v_delta, 'status', v_new);
end $$;

create or replace function public.generate_from_template(p_template_id text, p_force boolean)
returns json language plpgsql security definer set search_path = public
as $$
declare tpl public.task_templates%rowtype; v_due date; v_dow int; v_exists boolean; novo public.tasks%rowtype;
begin
  if not public.app_is_manager() then raise exception 'Sem permissão'; end if;
  select * into tpl from public.task_templates where "ID" = p_template_id;
  if tpl."ID" is null then raise exception 'Modelo não encontrado'; end if;
  if not public.app_tem_acesso(tpl.empresa_id) then raise exception 'Sem permissão (outra empresa)'; end if;

  v_due := (now() at time zone 'America/Sao_Paulo')::date;
  if tpl."PularFinalDeSemana" then
    v_dow := extract(dow from v_due)::int;
    if v_dow = 6 then v_due := v_due + 2; elsif v_dow = 0 then v_due := v_due + 1; end if;
  end if;

  select exists(select 1 from public.tasks where "Titulo" = tpl."Titulo"
    and lower("Responsavel") = lower(tpl."Responsavel") and "DataLimite" = v_due) into v_exists;
  if v_exists and not p_force then return json_build_object('duplicate', true); end if;

  insert into public.tasks (
    "TemplateID","Titulo","Descricao","Responsavel","DataGeracao","DataLimite",
    "DataCriacao","Prioridade","Status","PontosValor","Tentativas", empresa_id
  ) values (
    tpl."ID", tpl."Titulo", tpl."Descricao", tpl."Responsavel", now(), v_due,
    now(), tpl."Prioridade", 'Pendente', tpl."PontosValor", 0, tpl.empresa_id
  ) returning * into novo;

  update public.task_templates set "UltimaExecucao" = now() where "ID" = tpl."ID";
  return json_build_object('task', to_jsonb(novo));
end $$;
