-- Check-Ciatos — schema inicial (migração MySQL -> Postgres/Supabase)
-- Colunas em PascalCase para bater 1:1 com o contrato que o frontend já espera.
-- Identidade do usuário = Email (as FKs lógicas Responsavel/Gestor/UserEmail usam email).
-- Auth = Supabase Auth (auth.users guarda a senha); esta tabela guarda o perfil/papel.

-- =====================================================================
-- Tabelas
-- =====================================================================

create table if not exists public.users (
  "Email"              text primary key,
  "Nome"               text not null,
  "Role"               text not null default 'Colaborador',   -- Admin | Gestor | Colaborador
  "Status"             text not null default 'Ativo',         -- Ativo | Inativo | Bloqueado
  "Time"               text,
  "Gestor"             text,                                  -- Email do gestor
  "Foto"               text,
  "Telefone"           text,
  "DataNascimento"     text,
  "Endereco"           text,
  "Bio"                text,
  "SenhaProvisoria"    boolean not null default true,
  "TentativasFalhadas" integer not null default 0,
  "DataCriacao"        timestamptz not null default now(),
  "UltimoAcesso"       timestamptz,
  user_id              uuid references auth.users(id) on delete set null,
  updated_at           timestamptz not null default now()
);

create table if not exists public.task_templates (
  "ID"                 text primary key default gen_random_uuid()::text,
  "Titulo"             text not null,
  "Descricao"          text,
  "Responsavel"        text not null,
  "PontosValor"        integer not null default 10,
  "Prioridade"         text not null default 'Media',
  "Recorrencia"        text not null default 'Nenhuma',
  "DiasRecorrencia"    text[] not null default '{}',
  "DiaDoMes"           integer,
  "DataInicio"         date,
  "PularFinalDeSemana" boolean not null default false,
  "Ativa"              boolean not null default true,
  "UltimaExecucao"     timestamptz,
  "CriadoPor"          text,
  "DataCriacao"        timestamptz not null default now()
);

create table if not exists public.tasks (
  "ID"                 text primary key default gen_random_uuid()::text,
  "TemplateID"         text references public.task_templates("ID") on delete set null,
  "OrigemModelo"       text,
  "Titulo"             text not null,
  "Descricao"          text,
  "Responsavel"        text not null,                         -- Email do responsável
  "DataGeracao"        timestamptz not null default now(),
  "DataLimite"         date,
  "DataCriacao"        timestamptz not null default now(),
  "Prioridade"         text not null default 'Media',
  "Status"             text not null default 'Pendente',
  "PontosValor"        integer not null default 10,
  "Tentativas"         integer not null default 0,
  "JustificativaGestor" text,
  "DataConclusao"      timestamptz,
  "ConferenciaStatus"  text,
  "ObservacaoGestor"   text,
  "ProofAttachment"    text,
  "CompletionNote"     text
);

create table if not exists public.score_ledger (
  "ID"                 text primary key default gen_random_uuid()::text,
  "UserEmail"          text not null,
  "Data"               timestamptz not null default now(),
  "Pontos"             integer not null,
  "Tipo"               text not null,                         -- GANHO | PENALIDADE
  "Descricao"          text
);

-- =====================================================================
-- Índices
-- =====================================================================
create index if not exists idx_users_gestor        on public.users ("Gestor");
create index if not exists idx_tasks_responsavel    on public.tasks ("Responsavel");
create index if not exists idx_tasks_status         on public.tasks ("Status");
create index if not exists idx_tasks_datalimite     on public.tasks ("DataLimite");
create index if not exists idx_tasks_templateid     on public.tasks ("TemplateID");
create index if not exists idx_ledger_useremail     on public.score_ledger ("UserEmail");
create index if not exists idx_ledger_data          on public.score_ledger ("Data");
create index if not exists idx_templates_responsavel on public.task_templates ("Responsavel");

-- =====================================================================
-- Helper: papel do usuário autenticado (por email do JWT)
-- SECURITY DEFINER para poder ler public.users sem esbarrar na RLS.
-- =====================================================================
create or replace function public.app_current_email()
returns text
language sql stable
as $$ select nullif(auth.jwt() ->> 'email', '') $$;

create or replace function public.app_role()
returns text
language sql stable security definer set search_path = public
as $$
  select "Role" from public.users
  where lower("Email") = lower(auth.jwt() ->> 'email')
  limit 1
$$;

create or replace function public.app_is_manager()
returns boolean
language sql stable
as $$ select public.app_role() in ('Admin', 'Gestor') $$;

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.users          enable row level security;
alter table public.tasks          enable row level security;
alter table public.task_templates enable row level security;
alter table public.score_ledger   enable row level security;

-- Leitura: app interno da empresa (ranking, painéis, equipe) -> todos autenticados leem.
create policy users_select     on public.users          for select to authenticated using (true);
create policy tasks_select     on public.tasks          for select to authenticated using (true);
create policy templates_select on public.task_templates for select to authenticated using (true);
create policy ledger_select    on public.score_ledger   for select to authenticated using (true);

-- Perfil próprio: o usuário pode atualizar SÓ os campos de perfil da própria linha.
-- (Role/Status/flags são bloqueados por trigger abaixo; políticas não limitam colunas.)
create policy users_update_self on public.users for update to authenticated
  using (lower("Email") = lower(auth.jwt() ->> 'email'))
  with check (lower("Email") = lower(auth.jwt() ->> 'email'));

-- Gestores/Admin: gerenciam tarefas e templates direto (o resto vai por RPC/Edge Function).
create policy tasks_manage on public.tasks for all to authenticated
  using (public.app_is_manager()) with check (public.app_is_manager());
create policy templates_manage on public.task_templates for all to authenticated
  using (public.app_is_manager()) with check (public.app_is_manager());

-- score_ledger: nunca escrito direto pelo cliente (só via RPC de auditoria / service role).

-- Trava colunas sensíveis no update de perfil próprio: impede escalar papel/status/pontos.
create or replace function public.users_guard_self_update()
returns trigger language plpgsql as $$
begin
  if public.app_is_manager() then
    return new;  -- gestor/admin altera via Edge Function (service role) ou aqui sem trava
  end if;
  -- usuário comum: preserva campos sensíveis
  new."Role"               := old."Role";
  new."Status"             := old."Status";
  new."SenhaProvisoria"    := old."SenhaProvisoria";
  new."TentativasFalhadas" := old."TentativasFalhadas";
  new."Gestor"             := old."Gestor";
  new."Email"              := old."Email";
  new.user_id              := old.user_id;
  return new;
end $$;

create trigger trg_users_guard_self_update
  before update on public.users
  for each row execute function public.users_guard_self_update();
