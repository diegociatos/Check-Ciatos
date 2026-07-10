-- =====================================================================
-- Regras de Bonificação por empresa
-- Cada empresa configura as próprias regras de pontuação/bonificação.
-- 1 linha por empresa (PK = empresa_id). Sem linha => o app usa os
-- defaults (que espelham o comportamento atual), garantindo compatibilidade.
-- =====================================================================
create table if not exists public.bonus_rules (
  empresa_id        text primary key references public.empresas(id) on delete cascade,
  -- % mínimo de eficiência (pontos realizados / possíveis) para ficar elegível ao bônus
  eficiencia_minima numeric  not null default 90   check (eficiencia_minima >= 0 and eficiencia_minima <= 100),
  -- 'FIXO' = bônus é um nº fixo de pontos; 'PERCENTUAL' = % sobre os pontos realizados no período
  bonus_tipo        text     not null default 'PERCENTUAL' check (bonus_tipo in ('FIXO', 'PERCENTUAL')),
  bonus_valor       numeric  not null default 10   check (bonus_valor >= 0),
  -- permitir bônus mesmo quando o colaborador teve tarefas atrasadas no período
  bonus_com_atraso  boolean  not null default false,
  -- peso multiplicador por prioridade aplicado na aprovação (ganho)
  peso_prioridade   jsonb    not null default '{"Urgente":1.25,"Alta":1.10,"Media":1.0,"Baixa":1.0}'::jsonb,
  -- fator aplicado aos pontos quando a tarefa é reentrega/atrasada (0.5 = metade)
  reentrega_fator   numeric  not null default 0.5  check (reentrega_fator >= 0 and reentrega_fator <= 1),
  -- se tarefas pessoais valoradas entram na base do bônus
  pessoal_valorada  boolean  not null default true,
  -- dia do mês em que o período de bonificação fecha (1..28)
  fechamento_dia    int      not null default 1    check (fechamento_dia >= 1 and fechamento_dia <= 28),
  updated_at        timestamptz not null default now(),
  updated_by        text
);

alter table public.bonus_rules enable row level security;

-- Leitura: todos que têm acesso à empresa (o dashboard/relatórios de cada usuário
-- precisa das regras da própria empresa). Plataforma vê todas.
drop policy if exists bonus_rules_select on public.bonus_rules;
create policy bonus_rules_select on public.bonus_rules for select to authenticated
  using (public.app_is_plataforma() or public.app_tem_acesso(empresa_id));

-- Escrita: apenas Master (dono da empresa) e Plataforma. Gestor NÃO configura.
drop policy if exists bonus_rules_manage on public.bonus_rules;
create policy bonus_rules_manage on public.bonus_rules for all to authenticated
  using (public.app_is_plataforma() or (lower(public.app_role()) = 'master' and public.app_tem_acesso(empresa_id)))
  with check (public.app_is_plataforma() or (lower(public.app_role()) = 'master' and public.app_tem_acesso(empresa_id)));
