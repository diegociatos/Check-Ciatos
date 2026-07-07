# Check-Ciatos — Checklist Diário

SaaS multi-empresa de **checklist diário com pontuação de colaboradores**. Cada empresa-cliente tem sua própria equipe e dados totalmente isolados. O objetivo é aumentar a produtividade deixando claro o que precisa ser feito e recompensando com pontos o que foi entregue e aprovado.

**Stack:** React 19 + Vite + TypeScript + TailwindCSS + Supabase (Postgres, Auth, Storage, Edge Functions).
**Deploy:** Netlify (frontend estático) + Supabase (backend gerenciado).

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
App.tsx                 → app principal + rotas por papel
store.ts                → estado global (dados, empresa ativa, notificações)
services/api.ts         → camada de dados (supabase-js)
lib/
  supabase.ts           → cliente Supabase
  scoreEngine.ts        → regras de pontuação (funções puras)
  storage.ts            → evidências (upload / URL assinada)
  notifications.ts      → geração de notificações a partir das tarefas
components/             → telas
supabase/
  migrations/           → schema, RLS, RPCs (SQL)
  functions/admin-users → Edge Function (gestão de usuários/empresas)
docs/SUPABASE.md        → documentação do backend
```
