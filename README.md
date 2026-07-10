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

A landing usa dois links de assinatura recorrente do Asaas:

| Variável | Uso |
|---|---|
| `VITE_ASAAS_CONTROLE_URL` | Link recorrente do Plano Controle, sem anexos/documentos. |
| `VITE_ASAAS_EVIDENCIAS_URL` | Link recorrente do Plano Evidências, com documentos, comprovantes e storage privado. |

Enquanto essas variáveis não forem configuradas, os botões apontam para a própria seção de planos. Para operar em modo self-service, crie os links de pagamento recorrente no Asaas e configure as variáveis no Cloudflare Pages.

## Fluxo self-service desejado

1. Cliente entra no site.
2. Escolhe Plano Controle ou Plano Evidências.
3. Paga a assinatura recorrente pelo Asaas.
4. Recebe acesso automaticamente.
5. Cadastra empresa, equipe, modelos de tarefas e começa a usar seguindo o manual do site.

Para o passo 4 ser 100% automático, o backend precisa de um webhook do Asaas. O webhook deve receber a confirmação de pagamento/assinatura, criar ou ativar a empresa, criar o usuário Master, gravar o plano contratado e disparar o e-mail de primeiro acesso. A landing já está preparada para os links recorrentes; a automação de provisionamento deve ser implementada no backend/Supabase.

## Alterar WhatsApp

O número comercial fica em `components/landing/LandingPage.tsx`:

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
cp .env.example .env.local
npm run dev                  # http://localhost:3000
```

Variáveis principais:

- `VITE_SUPABASE_URL` — URL do projeto Supabase.
- `VITE_SUPABASE_ANON_KEY` — anon key pública do Supabase.
- `VITE_ASAAS_CONTROLE_URL` — link de assinatura recorrente do Plano Controle.
- `VITE_ASAAS_EVIDENCIAS_URL` — link de assinatura recorrente do Plano Evidências.

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
  storage.ts            → evidências (upload / URL assinada)
  notifications.ts      → notificações a partir das tarefas
components/             → telas do app interno
supabase/
  migrations/           → schema, RLS, RPCs (SQL)
  functions/admin-users → Edge Function
docs/SUPABASE.md        → documentação do backend
```
