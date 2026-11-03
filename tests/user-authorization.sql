-- Run ONLY against a disposable local Supabase database after migrations:
-- psql <local connection> -v ON_ERROR_STOP=1 -f tests/user-authorization.sql
-- Uses a temporary table and synthetic rows; always rolls back.
begin;
create temporary table guard_fixture (like public.users including defaults);
create trigger fixture_guard before update on guard_fixture
  for each row execute function public.users_guard_self_update();

do $$
declare
  role_name text;
  row_before record;
  row_after record;
begin
  foreach role_name in array array['Colaborador', 'Gestor', 'Admin', 'Master', 'Plataforma'] loop
    delete from guard_fixture;
    insert into guard_fixture ("Email", "Nome", "Role", "Status", "SenhaProvisoria", empresa_id)
      values ('synthetic@example.invalid', 'Before', role_name, 'Ativo', true, 'synthetic-a');
    select * into row_before from guard_fixture;
    perform set_config('request.jwt.claims', '{"role":"authenticated","email":"synthetic@example.invalid"}', true);
    update guard_fixture set "Role" = 'Plataforma', "Status" = 'Inativo',
      "Email" = 'changed@example.invalid', user_id = '00000000-0000-0000-0000-000000000001',
      empresa_id = 'synthetic-b', "Gestor" = 'changed@example.invalid', "Time" = 'Changed',
      "TentativasFalhadas" = 99, "DataCriacao" = '2000-01-01',
      "SenhaProvisoria" = false, "Nome" = 'After', "Telefone" = 'Synthetic';
    select * into row_after from guard_fixture;
    if row_after."Role" is distinct from row_before."Role"
      or row_after."Status" is distinct from row_before."Status"
      or row_after."Email" is distinct from row_before."Email"
      or row_after.user_id is distinct from row_before.user_id
      or row_after.empresa_id is distinct from row_before.empresa_id
      or row_after."Gestor" is distinct from row_before."Gestor"
      or row_after."Time" is distinct from row_before."Time"
      or row_after."TentativasFalhadas" is distinct from row_before."TentativasFalhadas"
      or row_after."DataCriacao" is distinct from row_before."DataCriacao"
      or row_after."SenhaProvisoria" is distinct from false
      or row_after."Nome" <> 'After' or row_after."Telefone" <> 'Synthetic' then
      raise exception 'Profile guard regression for %', role_name;
    end if;
    update guard_fixture set "SenhaProvisoria" = true;
    if (select "SenhaProvisoria" from guard_fixture) then raise exception 'Flag can be reset by client'; end if;
    perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
    update guard_fixture set "Role" = 'Admin', "Status" = 'Bloqueado', "SenhaProvisoria" = true, empresa_id = 'synthetic-b';
    select * into row_after from guard_fixture;
    if row_after."Role" <> 'Admin' or row_after."Status" <> 'Bloqueado'
      or not row_after."SenhaProvisoria" or row_after.empresa_id <> 'synthetic-b' then
      raise exception 'Service role blocked';
    end if;
  end loop;
  if has_function_privilege('anon', 'public.renomear_email(text,text)', 'execute')
    or has_function_privilege('authenticated', 'public.renomear_email(text,text)', 'execute')
    or not has_function_privilege('service_role', 'public.renomear_email(text,text)', 'execute') then
    raise exception 'Email RPC grants regression';
  end if;
end $$;
rollback;
