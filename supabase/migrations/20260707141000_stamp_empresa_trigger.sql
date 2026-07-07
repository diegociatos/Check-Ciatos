-- Carimbo automático de empresa nas inserções diretas do frontend.
-- Assim, criar modelo/tarefa/lançamento continua funcionando sem o frontend
-- precisar informar a empresa: o banco preenche com a empresa do usuário logado.
create or replace function public.stamp_empresa()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.empresa_id is null then
    new.empresa_id := public.app_empresa();
  end if;
  return new;
end $$;

drop trigger if exists trg_stamp_empresa_tasks on public.tasks;
create trigger trg_stamp_empresa_tasks before insert on public.tasks
  for each row execute function public.stamp_empresa();

drop trigger if exists trg_stamp_empresa_templates on public.task_templates;
create trigger trg_stamp_empresa_templates before insert on public.task_templates
  for each row execute function public.stamp_empresa();

drop trigger if exists trg_stamp_empresa_ledger on public.score_ledger;
create trigger trg_stamp_empresa_ledger before insert on public.score_ledger
  for each row execute function public.stamp_empresa();
