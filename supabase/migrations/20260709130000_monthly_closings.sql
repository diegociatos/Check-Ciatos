-- =====================================================================
-- Fechamento Mensal de Pontuação
-- Master/Gestor fecha oficialmente a pontuação do mês para fins de bônus.
-- 1 linha por (empresa, ano, mês, colaborador). Aditivo e seguro: enquanto
-- nenhum período estiver "fechado"/"pago", nada muda no comportamento atual.
-- =====================================================================
create table if not exists public.monthly_score_closings (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        text not null references public.empresas(id) on delete cascade,
  ano               int  not null,
  mes               int  not null check (mes between 1 and 12),
  colaborador       text not null,                 -- e-mail do colaborador
  pontos_possiveis  numeric not null default 0,
  pontos_realizados numeric not null default 0,
  eficiencia        numeric not null default 0,
  penalidades       numeric not null default 0,
  saldo_final       numeric not null default 0,
  status_bonus      text not null default 'nao_elegivel' check (status_bonus in ('elegivel', 'nao_elegivel')),
  bonus_sugerido    numeric not null default 0,
  status_fechamento text not null default 'aberto'  check (status_fechamento in ('aberto', 'em_revisao', 'fechado', 'pago')),
  fechado_por       text,
  fechado_em        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (empresa_id, ano, mes, colaborador)
);

create index if not exists idx_closings_empresa_periodo on public.monthly_score_closings (empresa_id, ano, mes);

alter table public.monthly_score_closings enable row level security;

-- Leitura: quem tem acesso à empresa (e plataforma). Relatórios/telas precisam saber se está fechado.
drop policy if exists closings_select on public.monthly_score_closings;
create policy closings_select on public.monthly_score_closings for select to authenticated
  using (public.app_is_plataforma() or public.app_tem_acesso(empresa_id));

-- Escrita: gestão da empresa (Gestor/Master/Admin) e Plataforma.
drop policy if exists closings_manage on public.monthly_score_closings;
create policy closings_manage on public.monthly_score_closings for all to authenticated
  using (public.app_is_plataforma() or (public.app_is_manager() and public.app_tem_acesso(empresa_id)))
  with check (public.app_is_plataforma() or (public.app_is_manager() and public.app_tem_acesso(empresa_id)));

-- =====================================================================
-- audit_task: CÓPIA IDÊNTICA da versão vigente (20260707180000) + trava de
-- período fechado. A trava é dormante até existir um fechamento 'fechado'/'pago'.
-- =====================================================================
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

  -- >>> TRAVA DE FECHAMENTO: se o período do colaborador está fechado/pago,
  -- somente a Plataforma pode alterar a pontuação retroativa.
  if not public.app_is_plataforma() and t."DataLimite" is not null then
    if exists (
      select 1 from public.monthly_score_closings c
      where c.empresa_id = t.empresa_id
        and c.colaborador = t."Responsavel"
        and c.ano = extract(year  from t."DataLimite")::int
        and c.mes = extract(month from t."DataLimite")::int
        and c.status_fechamento in ('fechado', 'pago')
    ) then
      raise exception 'Período fechado: apenas a Plataforma pode alterar a pontuação retroativa.';
    end if;
  end if;
  -- <<< fim da trava

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
  delete from public.score_ledger where task_id = p_id;
  insert into public.score_ledger ("UserEmail", "Data", "Pontos", "Tipo", "Descricao", empresa_id, task_id)
  values (t."Responsavel", now(), v_delta, v_tipo, v_desc, t.empresa_id, p_id);

  return json_build_object('pontos', v_delta, 'status', v_new, 'dataLimite', v_nova_dl);
end $$;

grant execute on function public.audit_task(text, text, text, date) to authenticated;
