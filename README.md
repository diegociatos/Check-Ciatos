# Check-Ciatos — Checklist Diário

SaaS multi-empresa de **checklist diário com pontuação de colaboradores**. Cada empresa-cliente tem sua própria equipe e dados totalmente isolados. O objetivo é aumentar a produtividade deixando claro o que precisa ser feito e recompensando com pontos o que foi entregue e aprovado.

**Stack:** React 19 + Vite + TypeScript + TailwindCSS + Supabase (Postgres, Auth, Storage, Edge Functions).
**Deploy:** Netlify (frontend estático) + Supabase (backend gerenciado).

## Site comercial e app interno

O projeto agora separa a área pública comercial do sistema interno:

| Rota | O que abre |
|---|---|
| `/` | Landing page comercial do Check-Ciatos. Não exige login. |
| `/app` | App interno existente, com login e fluxo operacional. |
| `/login` | Mesmo app interno, iniciando pelo fluxo de autenticação quando não houver usuário logado. |

Os botões **Entrar** e **Entrar no sistema** apontam para `/login`. Os botões comerciais e o formulário de interesse abrem o WhatsApp com uma mensagem formatada.

Para alterar o número comercial do WhatsApp, edite a constante `WHATSAPP_NUMBER` em `components/landing/LandingPage.tsx`:

```ts
const WHATSAPP_NUMBER = '5531999999999';
```

Substitua pelo número real no formato internacional, somente com dígitos.

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
cp .env.example .env.local   # e preencha com as chaves do seu projeto Supabase
npm run dev                  # http://localhost:3000
```

Depois acesse:

- `http://localhost:3000/` para ver o site comercial.
- `http://localhost:3000/login` ou `http://localhost:3000/app` para entrar no app interno.

As variáveis (ver `.env.example`):

- `VITE_SUPABASE_URL` — URL do projeto Supabase.
- `VITE_SUPABASE_ANON_KEY` — anon key (pública por design; a segurança vem da RLS).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite). |
| `npm run build` | Build de produção em `dist/`. |
| `npm run preview` | Serve o build localmente. |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`). |
| `npm run lint` | ESLint. |
| `npm run check` | typecheck + lint. |

## Backend (Supabase)

Todo o schema, RLS, funções (RPCs), Edge Function e Storage estão versionados em `supabase/`. Aplicar no projeto:

```bash
supabase link --project-ref <ref-do-projeto>
supabase db push
supabase functions deploy admin-users
```

Detalhes das tabelas, funções e políticas em **[docs/SUPABASE.md](docs/SUPABASE.md)**.

## Deploy

- **Frontend:** push em `main` → a Netlify publica automaticamente. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (em `netlify.toml` ou nas variáveis do site).
- **Backend:** `supabase db push` aplica as migrations; `supabase functions deploy` publica a Edge Function.

## Estrutura

```
App.tsx                 → separa landing pública e app interno por pathname
components/landing/     → landing page comercial do Check-Ciatos
store.ts                → estado global (dados, empresa ativa, notificações)
services/api.ts         → camada de dados (supabase-js)
lib/
  supabase.ts           → cliente Supabase
  scoreEngine.ts        → regras de pontuação (funções puras)
  storage.ts            → evidências (upload / URL assinada)
  notifications.ts      → geração de notificações a partir das tarefas
components/             → telas do app interno
supabase/
  migrations/           → schema, RLS, RPCs (SQL)
  functions/admin-users → Edge Function (gestão de usuários/empresas)
docs/SUPABASE.md        → documentação do backend
```
