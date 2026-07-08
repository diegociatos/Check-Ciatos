-- Tarefas pessoais: o colaborador cria tarefas PARA SI, apenas para a própria
-- gestão do dia — nascem com 0 ponto. Só o master concede pontos ("valorar"),
-- reusando o extrato (score_ledger) idempotente por task_id. O colaborador nunca
-- pontua a si mesmo. RLS segue restrito: colaborador escreve só via estas RPCs
-- SECURITY DEFINER (a tabela continua liberando escrita direta só p/ gestão).

alter table public.tasks add column if not exists "Pessoal" boolean not null default false;
create index if not exists idx_tasks_pessoal on public.tasks ("Pessoal") where "Pessoal";

-- ---------------------------------------------------------------------------
-- Colaborador cria a própria tarefa pessoal (sempre 0 ponto, para si mesmo).
-- ---------------------------------------------------------------------------
create or replace function public.criar_tarefa_pessoal(
  p_titulo text,
  p_descricao text default null,
  p_data_limite date default null
)
returns json language plpgsql security definer set search_path = public
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  v_emp   text := public.app_empresa();
  novo    public.tasks%rowtype;
begin
  if v_email is null then raise exception 'Sem sessão ativa'; end if;
  if coalesce(trim(p_titulo), '') = '' then raise exception 'Informe o título da tarefa'; end if;

  insert into public.tasks (
    "Titulo", "Descricao", "Responsavel", "DataGeracao", "DataLimite", "DataCriacao",
    "Prioridade", "Status", "PontosValor", "Tentativas", "Pessoal", empresa_id
  ) values (
    p_titulo, p_descricao, v_email, now(),
    coalesce(p_data_limite, (now() at time zone 'America/Sao_Paulo')::date), now(),
    'Media', 'Pendente', 0, 0, true, v_emp
  ) returning * into novo;

  return json_build_object('task', to_jsonb(novo));
end $$;
grant execute on function public.criar_tarefa_pessoal(text, text, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Colaborador marca a própria tarefa pessoal como feita (sem aprovação; 0 pt).
-- ---------------------------------------------------------------------------
create or replace function public.concluir_tarefa_pessoal(p_id text)
returns json language plpgsql security definer set search_path = public
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  t public.tasks%rowtype;
begin
  select * into t from public.tasks where "ID" = p_id;
  if t."ID" is null then raise exception 'Tarefa não encontrada'; end if;
  if not t."Pessoal" then raise exception 'Não é uma tarefa pessoal'; end if;
  if lower(t."Responsavel") <> v_email then raise exception 'Sem permissão'; end if;

  update public.tasks set "Status" = 'Aprovada', "DataConclusao" = now() where "ID" = p_id;
  return json_build_object('ok', true);
end $$;
grant execute on function public.concluir_tarefa_pessoal(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Colaborador reabre a própria tarefa pessoal (volta a pendente) — só se ainda
-- não foi valorada pelo master (sem pontos lançados).
-- ---------------------------------------------------------------------------
create or replace function public.reabrir_tarefa_pessoal(p_id text)
returns json language plpgsql security definer set search_path = public
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  t public.tasks%rowtype;
begin
  select * into t from public.tasks where "ID" = p_id;
  if t."ID" is null then raise exception 'Tarefa não encontrada'; end if;
  if not t."Pessoal" then raise exception 'Não é uma tarefa pessoal'; end if;
  if lower(t."Responsavel") <> v_email then raise exception 'Sem permissão'; end if;
  if coalesce(t."PontosValor", 0) > 0 then raise exception 'Tarefa já valorada pelo gestor'; end if;

  update public.tasks set "Status" = 'Pendente', "DataConclusao" = null where "ID" = p_id;
  return json_build_object('ok', true);
end $$;
grant execute on function public.reabrir_tarefa_pessoal(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Colaborador exclui a própria tarefa pessoal (só se ainda sem pontos).
-- ---------------------------------------------------------------------------
create or replace function public.excluir_tarefa_pessoal(p_id text)
returns json language plpgsql security definer set search_path = public
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  t public.tasks%rowtype;
begin
  select * into t from public.tasks where "ID" = p_id;
  if t."ID" is null then raise exception 'Tarefa não encontrada'; end if;
  if not t."Pessoal" then raise exception 'Não é uma tarefa pessoal'; end if;
  if lower(t."Responsavel") <> v_email then raise exception 'Sem permissão'; end if;
  if coalesce(t."PontosValor", 0) > 0 then raise exception 'Tarefa já valorada pelo gestor'; end if;

  delete from public.tasks where "ID" = p_id;
  return json_build_object('ok', true);
end $$;
grant execute on function public.excluir_tarefa_pessoal(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Master "valora" a tarefa pessoal: concede o valor CHEIO (sem multiplicadores
-- de atraso/reentrega — é reconhecimento discricionário) e grava no extrato,
-- idempotente por task_id (revalorar substitui, nunca duplica). p_pontos = 0
-- remove a pontuação (volta a ser só gestão).
-- ---------------------------------------------------------------------------
create or replace function public.valorar_tarefa_pessoal(
  p_id text,
  p_pontos int,
  p_obs text default null
)
returns json language plpgsql security definer set search_path = public
as $$
declare
  t public.tasks%rowtype;
begin
  if not public.app_is_manager() then raise exception 'Sem permissão'; end if;
  select * into t from public.tasks where "ID" = p_id;
  if t."ID" is null then raise exception 'Tarefa não encontrada'; end if;
  if not public.app_tem_acesso(t.empresa_id) then raise exception 'Sem permissão (outra empresa)'; end if;
  if not t."Pessoal" then raise exception 'Só tarefas pessoais são valoradas por aqui'; end if;
  if coalesce(p_pontos, 0) < 0 then raise exception 'Pontos inválidos'; end if;

  update public.tasks set
    "PontosValor"       = p_pontos,
    "Status"            = 'Aprovada',
    "DataConclusao"     = coalesce(t."DataConclusao", now()),
    "ConferenciaStatus" = 'Aprovado',
    "ObservacaoGestor"  = p_obs
  where "ID" = p_id;

  delete from public.score_ledger where task_id = p_id;
  if p_pontos > 0 then
    -- 'GANHO' em maiúsculo p/ casar com audit_task e o mapeamento do frontend.
    insert into public.score_ledger ("UserEmail", "Data", "Pontos", "Tipo", "Descricao", empresa_id, task_id)
    values (t."Responsavel", now(), p_pontos, 'GANHO', 'Reconhecimento: ' || t."Titulo", t.empresa_id, p_id);
  end if;

  return json_build_object('pontos', p_pontos);
end $$;
grant execute on function public.valorar_tarefa_pessoal(text, int, text) to authenticated;
