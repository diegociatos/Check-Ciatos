-- Check-Ciatos — lógica de servidor como RPCs (SECURITY DEFINER).
-- Regras reconstruídas a partir do fallback autoritativo do store.ts (frontend).
-- Cada função valida a autorização por dentro, pois SECURITY DEFINER ignora a RLS.

-- --------------------------------------------------------------------
-- Limpa a flag de senha provisória do próprio usuário (após trocar a senha).
-- --------------------------------------------------------------------
create or replace function public.clear_senha_provisoria()
returns void
language sql security definer set search_path = public
as $$
  update public.users set "SenhaProvisoria" = false, updated_at = now()
  where lower("Email") = lower(auth.jwt() ->> 'email');
$$;

-- --------------------------------------------------------------------
-- Concluir tarefa (responsável ou gestor) -> vai para "Aguardando Aprovação".
-- --------------------------------------------------------------------
create or replace function public.complete_task(p_id text, p_note text, p_proof text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_resp text;
  v_email text := auth.jwt() ->> 'email';
begin
  select "Responsavel" into v_resp from public.tasks where "ID" = p_id;
  if v_resp is null then raise exception 'Tarefa não encontrada'; end if;
  if lower(v_resp) <> lower(v_email) and not public.app_is_manager() then
    raise exception 'Sem permissão para concluir esta tarefa';
  end if;

  update public.tasks set
    "Status"            = 'Aguardando Aprovação',
    "DataConclusao"     = now(),
    "CompletionNote"    = p_note,
    "ProofAttachment"   = p_proof,
    "JustificativaGestor" = null
  where "ID" = p_id;
end $$;

-- --------------------------------------------------------------------
-- Auditar tarefa (só gestor/admin): aplica pontos no ledger e atualiza a tarefa.
-- p_status: 'APROVADO' | 'ERRO_EXECUCAO' | 'NAO_CUMPRIU'  (contrato do frontend)
-- Regras (do store.ts):
--   APROVADO      -> +PontosValor              (GANHO)
--   ERRO_EXECUCAO -> -ceil(PontosValor*0.5)    (PENALIDADE)
--   NAO_CUMPRIU   -> -PontosValor              (PENALIDADE)
-- --------------------------------------------------------------------
create or replace function public.audit_task(p_id text, p_status text, p_obs text)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  t            public.tasks%rowtype;
  v_new_status text;
  v_delta      int := 0;
  v_tipo       text := 'GANHO';
  v_desc       text := '';
  v_aprovado   boolean := false;
begin
  if not public.app_is_manager() then raise exception 'Sem permissão'; end if;

  select * into t from public.tasks where "ID" = p_id;
  if t."ID" is null then raise exception 'Tarefa não encontrada'; end if;

  if p_status = 'APROVADO' then
    v_new_status := 'Aprovada'; v_aprovado := true;
    v_delta := t."PontosValor"; v_tipo := 'GANHO';
    v_desc := 'Aprovação: ' || t."Titulo";
  elsif p_status = 'ERRO_EXECUCAO' then
    v_new_status := 'Feita Errada';
    v_delta := -ceil(t."PontosValor"::numeric * 0.5)::int; v_tipo := 'PENALIDADE';
    v_desc := 'Pena – Erro: ' || t."Titulo";
  elsif p_status = 'NAO_CUMPRIU' then
    v_new_status := 'Não Feita';
    v_delta := -t."PontosValor"; v_tipo := 'PENALIDADE';
    v_desc := 'Penalidade – Não Concluída: ' || t."Titulo";
  else
    raise exception 'Status de auditoria inválido: %', p_status;
  end if;

  update public.tasks set
    "Status"             = v_new_status,
    "ConferenciaStatus"  = p_status,
    "ObservacaoGestor"   = p_obs,
    "JustificativaGestor"= p_obs,
    "Tentativas"         = case when v_aprovado then t."Tentativas" else coalesce(t."Tentativas",0) + 1 end,
    "DataConclusao"      = case when v_aprovado then t."DataConclusao" else null end
  where "ID" = p_id;

  insert into public.score_ledger ("UserEmail", "Data", "Pontos", "Tipo", "Descricao")
  values (t."Responsavel", now(), v_delta, v_tipo, v_desc);

  return json_build_object('pontos', v_delta, 'status', v_new_status);
end $$;

-- --------------------------------------------------------------------
-- Ativar/desativar modelo (só gestor/admin). Retorna o novo valor de Ativa.
-- --------------------------------------------------------------------
create or replace function public.toggle_template(p_id text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_ativa boolean;
begin
  if not public.app_is_manager() then raise exception 'Sem permissão'; end if;
  update public.task_templates set "Ativa" = not "Ativa"
  where "ID" = p_id returning "Ativa" into v_ativa;
  if v_ativa is null then raise exception 'Modelo não encontrado'; end if;
  return v_ativa;
end $$;

-- --------------------------------------------------------------------
-- Gerar uma tarefa a partir de um modelo (só gestor/admin).
-- Vencimento = hoje (America/Sao_Paulo); se PularFinalDeSemana e cair no fim
-- de semana, empurra para segunda. Anti-duplicata por Titulo+Responsavel+data.
-- Retorna { duplicate: true } ou { task: <linha> }.
-- --------------------------------------------------------------------
create or replace function public.generate_from_template(p_template_id text, p_force boolean)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  tpl   public.task_templates%rowtype;
  v_due date;
  v_dow int;
  v_exists boolean;
  novo  public.tasks%rowtype;
begin
  if not public.app_is_manager() then raise exception 'Sem permissão'; end if;

  select * into tpl from public.task_templates where "ID" = p_template_id;
  if tpl."ID" is null then raise exception 'Modelo não encontrado'; end if;

  v_due := (now() at time zone 'America/Sao_Paulo')::date;
  if tpl."PularFinalDeSemana" then
    v_dow := extract(dow from v_due)::int;   -- 0=Dom, 6=Sáb
    if v_dow = 6 then v_due := v_due + 2;
    elsif v_dow = 0 then v_due := v_due + 1;
    end if;
  end if;

  select exists(
    select 1 from public.tasks
    where "Titulo" = tpl."Titulo" and lower("Responsavel") = lower(tpl."Responsavel")
      and "DataLimite" = v_due
  ) into v_exists;

  if v_exists and not p_force then
    return json_build_object('duplicate', true);
  end if;

  insert into public.tasks (
    "TemplateID", "Titulo", "Descricao", "Responsavel", "DataGeracao", "DataLimite",
    "DataCriacao", "Prioridade", "Status", "PontosValor", "Tentativas"
  ) values (
    tpl."ID", tpl."Titulo", tpl."Descricao", tpl."Responsavel", now(), v_due,
    now(), tpl."Prioridade", 'Pendente', tpl."PontosValor", 0
  ) returning * into novo;

  update public.task_templates set "UltimaExecucao" = now() where "ID" = tpl."ID";

  return json_build_object('task', to_jsonb(novo));
end $$;

-- Permissões de execução para usuários autenticados.
grant execute on function public.clear_senha_provisoria()                      to authenticated;
grant execute on function public.complete_task(text, text, text)               to authenticated;
grant execute on function public.audit_task(text, text, text)                  to authenticated;
grant execute on function public.toggle_template(text)                         to authenticated;
grant execute on function public.generate_from_template(text, boolean)         to authenticated;
