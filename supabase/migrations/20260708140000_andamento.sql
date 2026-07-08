-- Andamento: status de trabalho que o RESPONSÁVEL controla (Pendente / Em andamento).
-- "Concluído" e "Atrasado" são derivados do fluxo existente (Status + prazo), não
-- ficam aqui — assim a pontuação (só na conferência do gestor) segue intacta.
-- "Concluído" continua sendo o envio para aprovação (complete_task).

alter table public.tasks add column if not exists "Andamento" text not null default 'Pendente';

-- O responsável (ou a gestão) marca Pendente / Em andamento. Só faz sentido enquanto
-- a tarefa ainda não foi enviada para conferência nem aprovada.
create or replace function public.definir_andamento(p_id text, p_andamento text)
returns json language plpgsql security definer set search_path = public
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  t public.tasks%rowtype;
begin
  if p_andamento not in ('Pendente', 'Em andamento') then raise exception 'Situação inválida'; end if;
  select * into t from public.tasks where "ID" = p_id;
  if t."ID" is null then raise exception 'Tarefa não encontrada'; end if;
  if lower(t."Responsavel") <> v_email and not public.app_is_manager() then raise exception 'Sem permissão'; end if;
  if t."Status" in ('Aprovada', 'Aguardando Aprovação') then
    raise exception 'A tarefa já foi enviada para conferência';
  end if;

  update public.tasks set "Andamento" = p_andamento where "ID" = p_id;
  return json_build_object('ok', true, 'andamento', p_andamento);
end $$;
grant execute on function public.definir_andamento(text, text) to authenticated;
