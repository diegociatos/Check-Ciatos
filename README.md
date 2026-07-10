# Check-Ciatos — Checklist Diário

SaaS multi-empresa de **checklist diário com pontuação de colaboradores**. Cada empresa-cliente tem sua própria equipe e dados isolados. O objetivo é aumentar a produtividade deixando claro o que precisa ser feito, auditando entregas e apoiando políticas internas de reconhecimento por performance.

**Stack:** React 19 + Vite + TypeScript + TailwindCSS + Supabase (Postgres, Auth, Storage, Edge Functions).
**Deploy:** Cloudflare Pages (frontend estático) + Supabase (backend gerenciado).

## Site comercial e app interno

| Rota | O que abre |
|---|---|
| `/` | Site comercial autoexplicativo, com planos, imagens, manual de uso e botões para pagamento recorrente no Asaas. |
| `/app` | App interno existente, com login e fluxo operacional. |
| `/login` | Mesmo app interno, iniciando pelo login quando não houver usuário autenticado. |

## Planos e Asaas

A contratação é self-service. Não há formulário para a equipe tratar contratação manualmente.

| Plano | Valor | Armazenamento |
|---|---:|---|
| Plano Controle | R$ 39,90/mês | Sem anexos/documentos. Upload bloqueado. |
| Plano Evidências | R$ 149,90/mês | Inclui 1 GB para documentos, comprovantes e evidências. |

Variáveis usadas pela landing:

| Variável | Uso |
|---|---|
| `VITE_ASAAS_CONTROLE_URL` | Link recorrente do Plano Controle. |
| `VITE_ASAAS_EVIDENCIAS_URL` | Link recorrente do Plano Evidências. |
| `VITE_ASAAS_MEMORIA_EXTRA_URL` | Link recorrente para contratar memória adicional. |

Enquanto essas variáveis não forem configuradas, os botões apontam para a própria seção de planos/memória. Para operar em modo self-service, crie os links de pagamento recorrente no Asaas e configure as variáveis no Cloudflare Pages.

## Controle de armazenamento

O Plano Controle não permite anexos. O Plano Evidências permite anexos até o limite contratado.

A migration `supabase/migrations/20260710150000_empresa_storage_quota.sql` adiciona campos de quota em `empresas`:

| Campo | Uso |
|---|---|
| `StorageLimitMB` | Limite base de armazenamento. Controle: 0 MB. Evidências: 1024 MB. |
| `StorageUsedMB` | Uso aproximado atual em MB. |
| `StorageExtraMB` | Memória adicional contratada em MB. |

A validação inicial fica em `lib/storage.ts`: bloqueia upload no Plano Controle e impede novo anexo quando `StorageUsedMB + arquivo` ultrapassa `StorageLimitMB + StorageExtraMB`.

Para controle 100% forte, o backend/webhook deve atualizar essas colunas de forma transacional e recalcular uso ao remover arquivos antigos.

## Fluxo self-service desejado

1. Cliente entra no site.
2. Escolhe Plano Controle ou Plano Evidências.
3. Paga a assinatura recorrente pelo Asaas.
4. Recebe acesso automaticamente.
5. Cadastra empresa, equipe, modelos de tarefas e começa a usar seguindo o manual do site.

Para o passo 4 ser 100% automático, o backend precisa de um webhook do Asaas. O webhook deve receber a confirmação de pagamento/assinatura, criar ou ativar a empresa, criar o usuário Master, gravar o plano contratado, configurar a quota de armazenamento e disparar o e-mail de primeiro acesso.

## Papéis

| Papel | Descrição |
|---|---|
| **Plataforma** | Dono do sistema. Cria/gerencia empresas-clientes. Enxerga tudo. |
| **Master** | Dono de uma empresa-cliente. Administra a própria empresa (usuários, modelos, auditoria). Pode atender várias empresas. |
| **Gestor** | Supervisiona a equipe; pode ser vinculado a várias empresas pelo Master. |
| **Colaborador** | Cumpre tarefas e ganha pontos. |

## Rodar localmente

Pré-requisitos: **Node.js 18+**.

```bash
npm install
cp .env.example .env.local
npm run dev                  # http://localhost:3000
```

Variáveis principais:

- `VITE_SUPABASE_URL` — URL do projeto Supabase.
- `VITE_SUPABASE_ANON_KEY` — anon key pública do Supabase.
- `VITE_ASAAS_CONTROLE_URL` — link de assinatura recorrente do Plano Controle.
- `VITE_ASAAS_EVIDENCIAS_URL` — link de assinatura recorrente do Plano Evidências.
- `VITE_ASAAS_MEMORIA_EXTRA_URL` — link recorrente para contratar memória adicional.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite). |
| `npm run build` | Build de produção em `dist/`. |
| `npm run preview` | Serve o build localmente. |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`). |
| `npm run lint` | ESLint. |
| `npm run check` | typecheck + lint. |

## Deploy no Cloudflare Pages

Configuração de build:

| Campo | Valor |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

Variáveis de ambiente no Cloudflare Pages:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ASAAS_CONTROLE_URL`
- `VITE_ASAAS_EVIDENCIAS_URL`
- `VITE_ASAAS_MEMORIA_EXTRA_URL`

O arquivo `public/_redirects` garante o fallback de SPA, mantendo `/login` e `/app` funcionando ao acessar por link direto.

## Backend (Supabase)

Todo o schema, RLS, funções (RPCs), Edge Function e Storage estão versionados em `supabase/`. Aplicar no projeto:

```bash
supabase link --project-ref <ref-do-projeto>
supabase db push
supabase functions deploy admin-users
```

Detalhes das tabelas, funções e políticas em **[docs/SUPABASE.md](docs/SUPABASE.md)**.

## Estrutura

```
App.tsx                 → separa landing pública e app interno por pathname
components/landing/     → site comercial, planos, manual e fluxo self-service
public/_redirects       → fallback de SPA para Cloudflare Pages
store.ts                → estado global (dados, empresa ativa, notificações)
services/api.ts         → camada de dados (supabase-js)
lib/
  supabase.ts           → cliente Supabase
  scoreEngine.ts        → regras de pontuação
  storage.ts            → evidências, upload e validação de quota
  notifications.ts      → notificações a partir das tarefas
components/             → telas do app interno
supabase/
  migrations/           → schema, RLS, RPCs (SQL)
  functions/admin-users → Edge Function
docs/SUPABASE.md        → documentação do backend
```
