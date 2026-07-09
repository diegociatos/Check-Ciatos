-- Correção de datas na geração de tarefas.
-- BUG: generate_from_template gravava DataLimite = HOJE, ignorando o DataInicio
-- (Data Específica) e a recorrência (Semanal/Mensal). Resultado: tarefas com data
-- futura apareciam no dia da geração e como atrasadas.
-- Agora a data-limite respeita o tipo do modelo e nunca é gerada no passado
-- (exceto Data Específica, que usa exatamente a data escolhida).
create or replace function public.generate_from_template(p_template_id text, p_force boolean)
returns json language plpgsql security definer set search_path = public
as $$
declare
  tpl public.task_templates%rowtype;
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_inicio date;
  v_base date;
  v_due date;
  v_rec text;
  v_dow int;
  v_abbr text;
  v_dias text[];
  i int;
  v_exists boolean;
  novo public.tasks%rowtype;
begin
  if not public.app_is_manager() then raise exception 'Sem permissão'; end if;
  select * into tpl from public.task_templates where "ID" = p_template_id;
  if tpl."ID" is null then raise exception 'Modelo não encontrado'; end if;
  if not public.app_tem_acesso(tpl.empresa_id) then raise exception 'Sem permissão (outra empresa)'; end if;

  v_inicio := coalesce(tpl."DataInicio", v_hoje);
  v_base   := greatest(v_hoje, v_inicio);   -- recorrentes nunca no passado
  v_rec    := lower(coalesce(tpl."Recorrencia", ''));

  if v_rec in ('data especifica', 'data específica') then
    v_due := v_inicio;                       -- avulsa: exatamente a data escolhida
  elsif v_rec = 'semanal' then
    v_dias := coalesce(tpl."DiasRecorrencia", array[]::text[]);
    v_due := v_base;
    for i in 0..6 loop
      v_dow  := extract(dow from (v_base + i))::int;   -- 0=Dom .. 6=Sáb
      v_abbr := case v_dow when 0 then 'Dom' when 1 then 'Seg' when 2 then 'Ter'
                           when 3 then 'Qua' when 4 then 'Qui' when 5 then 'Sex' else 'Sab' end;
      if array_length(v_dias, 1) is null or v_abbr = any(v_dias) then
        v_due := v_base + i; exit;
      end if;
    end loop;
  elsif v_rec = 'mensal' then
    v_due := make_date(extract(year from v_base)::int, extract(month from v_base)::int, least(coalesce(tpl."DiaDoMes", 1), 28));
    if v_due < v_base then v_due := (v_due + interval '1 month')::date; end if;
  else
    v_due := v_base;                         -- Diária / Anual / Por Data Fixa / Nenhuma
  end if;

  -- Pular fim de semana: não se aplica a Semanal (que já escolhe dias específicos).
  if tpl."PularFinalDeSemana" and v_rec <> 'semanal' then
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

grant execute on function public.generate_from_template(text, boolean) to authenticated;
