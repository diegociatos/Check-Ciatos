-- Check-Ciatos — Monetização self-service (Asaas).
-- Planos comerciais (Controle x Evidências), cota de armazenamento por empresa,
-- contratações pendentes (signups), aceite de contrato (prova jurídica) e
-- controle de memória extra recorrente. Aditivo e seguro (idempotente).

-- =====================================================================
-- 1. Cota de armazenamento por empresa
-- =====================================================================
alter table public.empresas
  add column if not exists "StorageLimitMB" numeric not null default 1024,
  add column if not exists "StorageUsedMB"  numeric not null default 0,
  add column if not exists "StorageExtraMB" numeric not null default 0;

comment on column public.empresas."StorageLimitMB" is 'Limite BASE de armazenamento (MB). Plano Controle = 0; Plano Evidências = 1024.';
comment on column public.empresas."StorageUsedMB"  is 'Uso aproximado de anexos/evidências (MB). Incrementa no upload, decrementa na exclusão.';
comment on column public.empresas."StorageExtraMB" is 'Memória adicional contratada (MB), somada ao limite base. Passos de 500 MB (R$100/mês cada).';

-- Plano Controle não guarda documentos; Evidências começa com 1 GB.
update public.empresas set "StorageLimitMB" = 0
  where lower(coalesce("Plano", '')) like '%controle%';
update public.empresas set "StorageLimitMB" = 1024
  where lower(coalesce("Plano", '')) like '%evid%' and coalesce("StorageLimitMB", 0) = 0;

-- Empresa dona (Grupo Ciatos) usa o app inteiro, sem limite prático.
update public.empresas set "StorageLimitMB" = 102400
  where id = 'grupo-ciatos' and coalesce("StorageLimitMB", 0) < 102400;

-- =====================================================================
-- 2. Contratações self-service (pendentes até o pagamento confirmar)
-- =====================================================================
create table if not exists public.signups (
  id                    uuid primary key default gen_random_uuid(),
  "Plano"               text not null,                 -- 'Controle' | 'Evidencias'
  empresa_nome          text not null,
  cnpj                  text,
  responsavel_nome      text not null,
  responsavel_email     text not null,
  telefone              text,
  status                text not null default 'pendente', -- pendente|pago|provisionado|cancelado|erro
  erro                  text,
  asaas_customer_id     text,
  asaas_subscription_id text,
  empresa_id            text references public.empresas(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists idx_signups_email  on public.signups (lower(responsavel_email));
create index if not exists idx_signups_status on public.signups (status);
create index if not exists idx_signups_sub    on public.signups (asaas_subscription_id);

-- =====================================================================
-- 3. Aceite de contrato/termos (prova jurídica do "de acordo")
-- =====================================================================
create table if not exists public.contrato_aceites (
  id               uuid primary key default gen_random_uuid(),
  signup_id        uuid references public.signups(id) on delete set null,
  documento        text not null,        -- ex.: 'contrato-saas'
  versao           text not null,        -- ex.: '2026-07-10'
  aceitante_nome   text not null,
  aceitante_email  text not null,
  cnpj             text,
  ip               text,
  user_agent       text,
  aceito_em        timestamptz not null default now()
);
create index if not exists idx_aceite_signup on public.contrato_aceites (signup_id);

-- =====================================================================
-- 4. Memória extra recorrente — cada assinatura Asaas soma 500 MB uma única vez
--    (renovações mensais NÃO acumulam; cancelamento devolve os 500 MB).
-- =====================================================================
create table if not exists public.memoria_extra (
  id                    uuid primary key default gen_random_uuid(),
  empresa_id            text references public.empresas(id),
  asaas_subscription_id text unique,
  mb                    numeric not null default 500,
  status                text not null default 'ativa',   -- ativa|cancelada
  created_at            timestamptz not null default now()
);
create index if not exists idx_memoria_empresa on public.memoria_extra (empresa_id);

-- =====================================================================
-- 5. RLS: signups/aceites/memória extra são dados comerciais — só a plataforma
--    lê pelo app. As Edge Functions gravam com service role (bypassa RLS).
-- =====================================================================
alter table public.signups          enable row level security;
alter table public.contrato_aceites enable row level security;
alter table public.memoria_extra    enable row level security;

drop policy if exists signups_plataforma on public.signups;
create policy signups_plataforma on public.signups for all to authenticated
  using (public.app_is_plataforma()) with check (public.app_is_plataforma());

drop policy if exists aceites_plataforma on public.contrato_aceites;
create policy aceites_plataforma on public.contrato_aceites for all to authenticated
  using (public.app_is_plataforma()) with check (public.app_is_plataforma());

drop policy if exists memoria_plataforma on public.memoria_extra;
create policy memoria_plataforma on public.memoria_extra for all to authenticated
  using (public.app_is_plataforma()) with check (public.app_is_plataforma());

-- =====================================================================
-- 6. Incremento ATÔMICO do uso de storage (evita corrida no lê-modifica-grava
--    do client). Aceita delta negativo (exclusão de evidência). Nunca fica < 0.
--    Só permite mexer na própria empresa (ou plataforma).
-- =====================================================================
create or replace function public.incrementar_uso_storage(p_empresa text, p_delta_mb numeric)
returns numeric language plpgsql security definer set search_path = public
as $$
declare v_novo numeric;
begin
  if not public.app_is_plataforma()
     and p_empresa is distinct from public.app_empresa()
     and p_empresa not in (select public.app_empresas()) then
    raise exception 'Sem permissão para esta empresa';
  end if;
  update public.empresas
     set "StorageUsedMB" = greatest(0, coalesce("StorageUsedMB", 0) + p_delta_mb)
   where id = p_empresa
   returning "StorageUsedMB" into v_novo;
  return v_novo;
end $$;

grant execute on function public.incrementar_uso_storage(text, numeric) to authenticated;
