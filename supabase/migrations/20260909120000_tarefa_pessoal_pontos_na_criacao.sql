-- Tarefa pessoal: a GESTÃO pode definir os pontos JÁ na criação (evita o passo
-- separado de "valorar"). Regras preservadas:
--   * Colaborador continua nascendo com 0 (nunca se auto-premia); só app_is_manager
--     pode criar com pontos.
--   * Os pontos entram no extrato (score_ledger) na CONCLUSÃO, não na criação.
--   * Reabrir/excluir passam a travar apenas quando JÁ houve crédito no extrato
--     (antes travavam por PontosValor>0, o que quebraria com pontos definidos na criação).

-- Remove a assinatura antiga (3 args) para não gerar ambiguidade com a nova (4 args).
drop function if exists public.criar_tarefa_pessoal(text, text, date);

create or replace function public.criar_tarefa_pessoal(
  p_titulo text,
  p_descricao text default null,
  p_data_limite date default null,
  p_pontos int default 0
)
returns json language plpgsql security definer set search_path = public
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  v_emp   text := public.app_empresa();
  v_pts   int  := 0;
  novo    public.tasks%rowtype;
begin
  if v_email is null then raise exception 'Sem sessão ativa'; end if;
  if coalesce(trim(p_titulo), '') = '' then raise exception 'Informe o título da tarefa'; end if;
  -- Só a gestão pode definir pontos na criação; colaborador nasce com 0.
  if public.app_is_manager() and coalesce(p_pontos, 0) > 0 then v_pts := p_pontos; end if;

  insert into public.tasks (
    "Titulo", "Descricao", "Responsavel", "DataGeracao", "DataLimite", "DataCriacao",
    "Prioridade", "Status", "PontosValor", "Tentativas", "Pessoal", empresa_id
  ) values (
    p_titulo, p_descricao, v_email, now(),
    coalesce(p_data_limite, (now() at time zone 'America/Sao_Paulo')::date), now(),
    'Media', 'Pendente', v_pts, 0, true, v_emp
  ) returning * into novo;

  return json_build_object('task', to_jsonb(novo));
end $$;
grant execute on function public.criar_tarefa_pessoal(text, text, date, int) to authenticated;

-- Concluir: além de marcar Aprovada, credita os pontos no extrato SE a tarefa já
-- tiver PontosValor > 0 (definido pela gestão na criação). Idempotente por task_id.
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

  delete from public.score_ledger where task_id = p_id;
  if coalesce(t."PontosValor", 0) > 0 then
    insert into public.score_ledger ("UserEmail", "Data", "Pontos", "Tipo", "Descricao", empresa_id, task_id)
    values (t."Responsavel", now(), t."PontosValor", 'GANHO', 'Reconhecimento: ' || t."Titulo", t.empresa_id, p_id);
  end if;

  return json_build_object('ok', true);
end $$;
grant execute on function public.concluir_tarefa_pessoal(text) to authenticated;

-- Reabrir: bloqueia apenas se já houve crédito no extrato (não mais por PontosValor>0).
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
  if exists (select 1 from public.score_ledger where task_id = p_id) then raise exception 'Tarefa já pontuada no extrato'; end if;

  update public.tasks set "Status" = 'Pendente', "DataConclusao" = null where "ID" = p_id;
  return json_build_object('ok', true);
end $$;
grant execute on function public.reabrir_tarefa_pessoal(text) to authenticated;

-- Excluir: idem — só se ainda não houve crédito no extrato.
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
  if exists (select 1 from public.score_ledger where task_id = p_id) then raise exception 'Tarefa já pontuada no extrato'; end if;

  delete from public.tasks where "ID" = p_id;
  return json_build_object('ok', true);
end $$;
grant execute on function public.excluir_tarefa_pessoal(text) to authenticated;
