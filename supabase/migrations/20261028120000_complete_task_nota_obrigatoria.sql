-- Trava de conclusão no SERVIDOR: a tarefa só é concluída com um comentário
-- (CompletionNote). Reforça a trava do frontend para pegar qualquer cliente
-- (app antigo/congelado, cache, acesso fora do app). Definição baseada na
-- função vigente em produção, acrescida apenas da validação do comentário.
create or replace function public.complete_task(p_id text, p_note text, p_proof text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_resp text; v_emp text; v_email text := auth.jwt() ->> 'email';
begin
  -- >>> Trava: obriga comentário sobre a entrega.
  if coalesce(btrim(p_note), '') = '' then
    raise exception 'Escreva um comentário sobre a entrega para concluir a tarefa.';
  end if;
  -- <<<
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
end $function$;
