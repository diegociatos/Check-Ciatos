-- Auditoria: persistir novo prazo em reprovações + Score Engine idempotente.
-- score_ledger.task_id permite: (a) idempotência (uma tarefa = uma linha no extrato)
-- e (b) rastrear a origem do ponto.

alter table public.score_ledger add column if not exists task_id text;
create index if not exists idx_ledger_task on public.score_ledger (task_id);

-- Substitui a versão de 3 args por uma de 4 (com novo prazo opcional).
drop function if exists public.audit_task(text, text, text);

create or replace function public.audit_task(
  p_id text,
  p_status text,
  p_obs text,
  p_nova_data_limite date default null
)
returns json language plpgsql security definer set search_path = public
as $$
declare
  t public.tasks%rowtype;
  v_new text; v_delta int := 0; v_tipo text := 'GANHO'; v_desc text := ''; v_ap boolean := false;
  v_atrasada boolean; v_reentrega boolean; v_mult numeric; v_base int; v_nova_dl date;
begin
  if not public.app_is_manager() then raise exception 'Sem permissão'; end if;
  select * into t from public.tasks where "ID" = p_id;
  if t."ID" is null then raise exception 'Tarefa não encontrada'; end if;
  if not public.app_tem_acesso(t.empresa_id) then raise exception 'Sem permissão (outra empresa)'; end if;

  -- Contexto de pontuação (mesmas regras do lib/scoreEngine.ts)
  v_atrasada := t."DataConclusao" is not null and t."DataLimite" is not null
                and (t."DataConclusao" at time zone 'America/Sao_Paulo')::date > t."DataLimite";
  v_reentrega := coalesce(t."Tentativas", 0) > 0;
  v_mult := case upper(coalesce(t."Prioridade", 'Media'))
              when 'URGENTE' then 1.25 when 'ALTA' then 1.10 else 1.0 end;

  if p_status = 'APROVADO' then
    v_new := 'Aprovada'; v_ap := true;
    v_base := case when v_atrasada or v_reentrega then ceil(t."PontosValor" * 0.5) else t."PontosValor" end;
    v_delta := ceil(v_base * v_mult)::int; v_tipo := 'GANHO'; v_desc := 'Aprovação: ' || t."Titulo";
  elsif p_status = 'ERRO_EXECUCAO' then
    v_new := 'Feita Errada'; v_delta := -ceil(t."PontosValor" * 0.5)::int; v_tipo := 'PENALIDADE'; v_desc := 'Pena – Erro: ' || t."Titulo";
  elsif p_status = 'NAO_CUMPRIU' then
    v_new := 'Não Feita'; v_delta := -t."PontosValor"; v_tipo := 'PENALIDADE'; v_desc := 'Penalidade – Não Concluída: ' || t."Titulo";
  else
    raise exception 'Status de auditoria inválido: %', p_status;
  end if;

  -- Novo prazo persiste apenas em reprovações e quando informado
  v_nova_dl := case when not v_ap and p_nova_data_limite is not null then p_nova_data_limite else t."DataLimite" end;

  update public.tasks set
    "Status"              = v_new,
    "ConferenciaStatus"   = p_status,
    "ObservacaoGestor"    = p_obs,
    "JustificativaGestor" = p_obs,
    "Tentativas"          = case when v_ap then t."Tentativas" else coalesce(t."Tentativas", 0) + 1 end,
    "DataConclusao"       = case when v_ap then t."DataConclusao" else null end,
    "DataLimite"          = v_nova_dl
  where "ID" = p_id;

  -- Idempotência: cada tarefa contribui com UMA linha (o resultado atual da auditoria).
  -- Reaprovar/reauditar substitui, nunca duplica os pontos.
  delete from public.score_ledger where task_id = p_id;
  insert into public.score_ledger ("UserEmail", "Data", "Pontos", "Tipo", "Descricao", empresa_id, task_id)
  values (t."Responsavel", now(), v_delta, v_tipo, v_desc, t.empresa_id, p_id);

  return json_build_object('pontos', v_delta, 'status', v_new, 'dataLimite', v_nova_dl);
end $$;

grant execute on function public.audit_task(text, text, text, date) to authenticated;
