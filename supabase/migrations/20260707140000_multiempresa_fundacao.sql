-- Check-Ciatos — Fase 1 multi-empresa: fundação (isolamento por empresa/tenant).
-- Aditivo e seguro: cria empresas, carimba tudo que existe como "Grupo Ciatos",
-- e passa a RLS a isolar por empresa (com bypass para o papel 'plataforma').

-- =====================================================================
-- 1. Tabela de empresas (tenants)
-- =====================================================================
create table if not exists public.empresas (
  id            text primary key default gen_random_uuid()::text,
  "Nome"        text not null,
  "Status"      text not null default 'Ativa',
  "Plano"       text not null default 'Padrao',
  "DataCriacao" timestamptz not null default now()
);

-- =====================================================================
-- 2. Carimbo de empresa em todas as tabelas de dados
-- =====================================================================
alter table public.users          add column if not exists empresa_id text references public.empresas(id);
alter table public.tasks          add column if not exists empresa_id text references public.empresas(id);
alter table public.task_templates add column if not exists empresa_id text references public.empresas(id);
alter table public.score_ledger   add column if not exists empresa_id text references public.empresas(id);

create index if not exists idx_users_empresa     on public.users(empresa_id);
create index if not exists idx_tasks_empresa     on public.tasks(empresa_id);
create index if not exists idx_templates_empresa on public.task_templates(empresa_id);
create index if not exists idx_ledger_empresa    on public.score_ledger(empresa_id);

-- =====================================================================
-- 3. Empresa inicial + backfill dos dados existentes
-- =====================================================================
insert into public.empresas (id, "Nome") values ('grupo-ciatos', 'Grupo Ciatos')
  on conflict (id) do nothing;

update public.users          set empresa_id = 'grupo-ciatos' where empresa_id is null;
update public.tasks          set empresa_id = 'grupo-ciatos' where empresa_id is null;
update public.task_templates set empresa_id = 'grupo-ciatos' where empresa_id is null;
update public.score_ledger   set empresa_id = 'grupo-ciatos' where empresa_id is null;

-- =====================================================================
-- 4. Helpers de contexto (empresa e papel plataforma)
-- =====================================================================
create or replace function public.app_empresa()
returns text language sql stable security definer set search_path = public
as $$ select empresa_id from public.users where lower("Email") = lower(auth.jwt() ->> 'email') limit 1 $$;

create or replace function public.app_is_plataforma()
returns boolean language sql stable
as $$ select coalesce(public.app_role() = 'plataforma', false) $$;

-- 'master' (dono da empresa) entra no time de gestão, ao lado de Admin/Gestor (legado) e plataforma.
create or replace function public.app_is_manager()
returns boolean language sql stable
as $$ select coalesce(public.app_role() in ('plataforma', 'master', 'Admin', 'Gestor'), false) $$;

-- =====================================================================
-- 5. RLS por empresa (substitui "todos os autenticados veem tudo")
-- =====================================================================
alter table public.empresas enable row level security;

-- empresas: plataforma vê todas; demais veem só a própria
drop policy if exists empresas_select on public.empresas;
create policy empresas_select on public.empresas for select to authenticated
  using (public.app_is_plataforma() or id = public.app_empresa());
drop policy if exists empresas_plataforma on public.empresas;
create policy empresas_plataforma on public.empresas for all to authenticated
  using (public.app_is_plataforma()) with check (public.app_is_plataforma());

-- Leitura das 4 tabelas: só a própria empresa (ou tudo, se plataforma)
drop policy if exists users_select on public.users;
create policy users_select on public.users for select to authenticated
  using (public.app_is_plataforma() or empresa_id = public.app_empresa());

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated
  using (public.app_is_plataforma() or empresa_id = public.app_empresa());

drop policy if exists templates_select on public.task_templates;
create policy templates_select on public.task_templates for select to authenticated
  using (public.app_is_plataforma() or empresa_id = public.app_empresa());

drop policy if exists ledger_select on public.score_ledger;
create policy ledger_select on public.score_ledger for select to authenticated
  using (public.app_is_plataforma() or empresa_id = public.app_empresa());

-- Escrita direta de gestor/master: só dentro da própria empresa
drop policy if exists tasks_manage on public.tasks;
create policy tasks_manage on public.tasks for all to authenticated
  using (public.app_is_manager() and (public.app_is_plataforma() or empresa_id = public.app_empresa()))
  with check (public.app_is_manager() and (public.app_is_plataforma() or empresa_id = public.app_empresa()));

drop policy if exists templates_manage on public.task_templates;
create policy templates_manage on public.task_templates for all to authenticated
  using (public.app_is_manager() and (public.app_is_plataforma() or empresa_id = public.app_empresa()))
  with check (public.app_is_manager() and (public.app_is_plataforma() or empresa_id = public.app_empresa()));

-- perfil próprio (mantém)
drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users for update to authenticated
  using (lower("Email") = lower(auth.jwt() ->> 'email'))
  with check (lower("Email") = lower(auth.jwt() ->> 'email'));

-- =====================================================================
-- 6. RPCs: carimbar/validar empresa
-- =====================================================================
-- Concluir tarefa: valida que a tarefa é da empresa do usuário
create or replace function public.complete_task(p_id text, p_note text, p_proof text)
returns void language plpgsql security definer set search_path = public
as $$
declare v_resp text; v_emp text; v_email text := auth.jwt() ->> 'email';
begin
  select "Responsavel", empresa_id into v_resp, v_emp from public.tasks where "ID" = p_id;
  if v_resp is null then raise exception 'Tarefa não encontrada'; end if;
  if not public.app_is_plataforma() and v_emp is distinct from public.app_empresa() then
    raise exception 'Sem permissão (outra empresa)';
  end if;
  if lower(v_resp) <> lower(v_email) and not public.app_is_manager() then
    raise exception 'Sem permissão para concluir esta tarefa';
  end if;
  update public.tasks set
    "Status" = 'Aguardando Aprovação', "DataConclusao" = now(),
    "CompletionNote" = p_note, "ProofAttachment" = p_proof, "JustificativaGestor" = null
  where "ID" = p_id;
end $$;

-- Auditar: valida empresa e carimba a empresa no lançamento de pontos
create or replace function public.audit_task(p_id text, p_status text, p_obs text)
returns json language plpgsql security definer set search_path = public
as $$
declare t public.tasks%rowtype; v_new text; v_delta int := 0; v_tipo text := 'GANHO'; v_desc text := ''; v_ap boolean := false;
begin
  if not public.app_is_manager() then raise exception 'Sem permissão'; end if;
  select * into t from public.tasks where "ID" = p_id;
  if t."ID" is null then raise exception 'Tarefa não encontrada'; end if;
  if not public.app_is_plataforma() and t.empresa_id is distinct from public.app_empresa() then
    raise exception 'Sem permissão (outra empresa)';
  end if;

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

-- Gerar tarefa do modelo: nova tarefa herda a empresa do modelo
create or replace function public.generate_from_template(p_template_id text, p_force boolean)
returns json language plpgsql security definer set search_path = public
as $$
declare tpl public.task_templates%rowtype; v_due date; v_dow int; v_exists boolean; novo public.tasks%rowtype;
begin
  if not public.app_is_manager() then raise exception 'Sem permissão'; end if;
  select * into tpl from public.task_templates where "ID" = p_template_id;
  if tpl."ID" is null then raise exception 'Modelo não encontrado'; end if;
  if not public.app_is_plataforma() and tpl.empresa_id is distinct from public.app_empresa() then
    raise exception 'Sem permissão (outra empresa)';
  end if;

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

-- Criar empresa + master (só plataforma). Retorna a empresa criada.
create or replace function public.criar_empresa(p_nome text, p_plano text)
returns json language plpgsql security definer set search_path = public
as $$
declare v_id text;
begin
  if not public.app_is_plataforma() then raise exception 'Apenas a plataforma pode criar empresas'; end if;
  insert into public.empresas ("Nome", "Plano") values (p_nome, coalesce(nullif(p_plano,''),'Padrao'))
    returning id into v_id;
  return json_build_object('id', v_id, 'Nome', p_nome);
end $$;

grant execute on function public.app_empresa()                        to authenticated;
grant execute on function public.app_is_plataforma()                  to authenticated;
grant execute on function public.criar_empresa(text, text)            to authenticated;
