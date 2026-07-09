# Backend Supabase — Check-Ciatos

Tudo versionado em `supabase/`. Aplicar num projeto novo:

```bash
supabase link --project-ref <ref>
supabase db push                     # aplica todas as migrations (schema + RLS + RPCs + storage)
supabase functions deploy admin-users
```

Depois, criar o primeiro usuário **Plataforma** (via SQL / painel): um registro em `auth.users` + uma linha em `public.users` com `Role = 'plataforma'`.

## Tabelas

| Tabela | Papel |
|---|---|
| `empresas` | Tenants (clientes). `id, Nome, Status (Ativa/Suspensa), Plano, DataCriacao`. |
| `users` | Perfil/papel do usuário. PK `Email`; `Role, Status, Time, Gestor, SenhaProvisoria, empresa_id (casa), user_id → auth.users`. |
| `tasks` | Tarefas. `ID, Titulo, Responsavel (email), DataLimite, Status, PontosValor, Prioridade, Tentativas, DataConclusao, ConferenciaStatus, ProofAttachment, empresa_id`. |
| `task_templates` | Modelos recorrentes. `Recorrencia, DiasRecorrencia, DiaDoMes, DataInicio, PularFinalDeSemana, Ativa, empresa_id`. |
| `score_ledger` | Extrato de pontos. `UserEmail, Data, Pontos, Tipo (GANHO/PENALIDADE), Descricao, task_id, empresa_id`. |
| `user_empresas` | Vínculo usuário↔empresas (acesso multi-empresa). `email, empresa_id`. |
| `bonus_rules` | Regras de pontuação/bonificação por empresa (1 linha por empresa). Ver seção abaixo. |

## Isolamento (RLS)

Toda leitura/escrita é isolada por empresa. Funções auxiliares (SECURITY DEFINER):

- `app_role()` → papel do usuário logado (por e-mail do JWT).
- `app_is_plataforma()` → é plataforma? (bypass do isolamento).
- `app_is_manager()` → plataforma/master/admin/gestor (case-insensitive).
- `app_empresas()` → conjunto de empresas que o usuário acessa (casa + vínculos).
- `app_tem_acesso(emp)` → o usuário pode acessar a empresa `emp`?

As policies de SELECT/escrita usam `app_tem_acesso(empresa_id)`. Um gatilho (`stamp_empresa`) carimba `empresa_id` automaticamente nos inserts do frontend.

## Funções (RPCs) chamadas pelo app

| RPC | Uso |
|---|---|
| `criar_empresa(p_nome, p_plano)` | Plataforma cria uma empresa. |
| `complete_task(p_id, p_note, p_proof)` | Colaborador conclui uma tarefa (→ Aguardando Aprovação). |
| `audit_task(p_id, p_status, p_obs, p_nova_data_limite)` | Gestor aprova/reprova. Aplica pontos (idempotente, 1 linha por tarefa) e persiste o novo prazo em reprovações. `p_status`: `APROVADO` \| `ERRO_EXECUCAO` \| `NAO_CUMPRIU`. |
| `generate_from_template(p_template_id, p_force)` | Gera uma tarefa a partir de um modelo (recorrência, pula fim de semana, anti-duplicata). |
| `toggle_template(p_id)` | Ativa/desativa um modelo. |
| `clear_senha_provisoria()` | Limpa a flag de senha provisória após a troca. |

Regras de pontuação: ver `lib/scoreEngine.ts` (fonte das regras) — a `audit_task` segue exatamente as mesmas fórmulas.

## Edge Function `admin-users`

Operações privilegiadas (service role), autorizadas pelo papel do chamador. Ações (`body.action`):

- `create` — cria usuário (auth + perfil) na empresa; idempotente (mesmo e-mail em outra empresa vira vínculo). Senha provisória `123456`.
- `update` — edita um usuário.
- `reset-password` — redefine para `123456` + `SenhaProvisoria`.
- `toggle-status` — Ativo/Inativo.
- `delete` — exclui usuário (perfil + auth).
- `set-empresas` — define quais empresas (entre as do chamador) um usuário acessa (Master concede ao Gestor).
- `delete-empresa` — (plataforma) exclui a empresa e seus dados; usuários exclusivos são removidos, multi-empresa realocados; nunca apaga a plataforma.

## Regras de Bonificação (`bonus_rules`)

Cada empresa configura as próprias regras de pontuação/bonificação (migration `20260709120000_bonus_rules.sql`). **1 linha por empresa** (PK = `empresa_id`). Se a empresa não tiver linha, o app usa `DEFAULT_BONUS_RULES` (em `types.ts`), que espelha o comportamento histórico — **compatibilidade garantida**.

| Campo | Tipo | Default | Significado |
|---|---|---|---|
| `empresa_id` | text (PK, FK `empresas`) | — | Empresa dona da regra. |
| `eficiencia_minima` | numeric (0–100) | 90 | % mínimo de eficiência para ficar elegível ao bônus. |
| `bonus_tipo` | text (`FIXO`\|`PERCENTUAL`) | `PERCENTUAL` | Bônus fixo (pontos) ou percentual sobre os pontos realizados. |
| `bonus_valor` | numeric (≥0) | 10 | Valor do bônus (pontos fixos ou %). |
| `bonus_com_atraso` | boolean | false | Permitir bônus mesmo com tarefas atrasadas no período. |
| `peso_prioridade` | jsonb | `{Urgente:1.25,Alta:1.10,Media:1.0,Baixa:1.0}` | Multiplicador por prioridade aplicado no ganho. |
| `reentrega_fator` | numeric (0–1) | 0.5 | Fator dos pontos em reentrega/atraso. |
| `pessoal_valorada` | boolean | true | Tarefas pessoais valoradas entram na base do bônus. |
| `fechamento_dia` | int (1–28) | 1 | Dia do fechamento mensal do período. |
| `updated_at`, `updated_by` | — | now() | Auditoria da última alteração. |

**RLS:**
- `bonus_rules_select` — leitura para quem tem acesso à empresa (`app_tem_acesso`) e plataforma. O dashboard/relatórios de cada usuário lê a regra da própria empresa.
- `bonus_rules_manage` — escrita apenas para **Master** (`app_role()='master'` na empresa) e **Plataforma** (`app_is_plataforma()`). Gestor **não** configura.

Aplicação no frontend: o motor puro em `lib/scoreEngine.ts` (`multiplicadorPrioridade`, `calcularBonus`) consome as regras; `store.ts` deriva `bonusRules` da empresa ativa; a tela `components/BonusRulesView.tsx` (rota `BONUS_RULES`, menu Administração) edita; **Dashboard** e **Relatórios** aplicam nos cálculos de elegibilidade e valor do bônus.

## Storage

Bucket **privado** `evidencias` (limite 5 MB; imagem/PDF). Caminho `{empresa_id}/{task_id}/{arquivo}`. RLS isola por empresa (upload/leitura só à própria empresa). O app salva o `path` em `tasks.ProofAttachment` e gera **URL assinada** para abrir/baixar.

## Autenticação

Supabase Auth (e-mail/senha). Login barrado se o usuário estiver Bloqueado/Inativo ou se a empresa estiver **Suspensa**. Senha provisória `123456` para novos usuários e resets.
