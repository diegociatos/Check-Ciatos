# Gestão de usuários: validação local

Base: `main` em `21ff5f1be72144a1511867a3d31361b81fc5053c`.
Não foram encontrados `AGENTS.md` ou `.agents/skills` no checkout ou instruções nos diretórios ancestrais.

## Alteração

- O guard de perfil liberava qualquer gestor. A migration nova reserva o bypass ao JWT `service_role`, preserva campos administrativos/identidade e mantém os dados pessoais, registro de acesso e a transição de senha provisória de true para false.
- `admin-users` repassava a linha inteira a `update`. Agora rejeita campos desconhecidos, identidade, empresa, flags e valores inválidos. A tela seleciona os campos editáveis antes de enviar.
- Gestores administram colaboradores; Admin/Master continuam administrando os papéis da empresa, incluindo outros administradores. Somente Plataforma administra/reserva o papel Plataforma. Os controles também cobrem criação/vinculação de conta existente e operações de senha, status, exclusão e e-mail.
- Concessões de acesso ficam com Admin/Master/Plataforma tanto na Edge quanto na policy de `user_empresas`. O escopo multiempresa dos administradores é preservado; operações existentes sobre perfis continuam exigindo a empresa-casa, exceto Plataforma.
- A RPC de e-mail mantém sua implementação transacional, mas requer service role e revoga EXECUTE de PUBLIC, anon e authenticated. A troca legítima continua pela Edge.
- Consultas de e-mail continuam indiferentes a maiúsculas e escapam caracteres de padrão SQL. O cliente devolve o perfil persistido, o store aplica essa linha com normalização de papel/status e envia edições administrativas próprias pela Edge. Entradas sem e-mail válido recebem 400 antes da seleção do alvo ou escrita.

## Verificação

- Node 22.21.0; dependências instaladas pelo lockfile com `npm ci --ignore-scripts`.
- `npm test`: 35 testes passaram, incluindo 21 novos de autorização. O handler real é transpilado e executado com cliente Supabase em memória; não há rede, credenciais, envio de e-mail ou dados reais nas fixtures.
- `npm run check`: typecheck e lint; 0 erros e 41 avisos preexistentes.
- `npm run build`: build Vite concluído.
- `deno check --no-lock supabase/functions/admin-users/index.ts`: verificação própria da Edge (excluída do check do frontend). A dependência remota preexistente `@2` resolveu para 2.118.0 nesta execução.
- Validação estática da migration, grants, policy e campos preservados incluída nos testes Node.
- Validação independente no SHA inicial `29f3666`: o agente principal executou a migration com fixtures fictícias e RLS em PostgreSQL isolado via PGlite. Confirmou bloqueio de autopromoção, preservação de perfil/primeiro acesso/service role e ACL correta de `renomear_email`; executou também `tests/user-authorization.sql` com sucesso. As alterações subsequentes não modificam a migration.
- Neste ambiente Windows não há `psql` e o daemon Docker está inativo. A comprovação SQL acima vem da execução independente em PGlite; não equivale a Supabase/Auth/PostgREST real.

## Limites

Nenhuma migration aplicada em projeto remoto, deploy, merge, aprovação, nova credencial ou teste contra produção. A proteção exige revisão e publicação futura coordenada de frontend, Edge e migration; este PR não altera o serviço publicado.

Os testes simulados não provam integração com Auth/PostgREST ou concorrência. A checagem de papel/empresa e a escrita da Edge continuam sendo operações separadas; não há atomicidade contra mudanças administrativas concorrentes. As demais categorias da auditoria de setembro (incluindo status de sessões, RPCs de tarefas, privacidade e armazenamento) permanecem fora deste patch.

O `npm ci` reportou 21 alertas nas dependências já fixadas (12 moderados, 8 altos, 1 crítico). O lockfile não foi alterado; a atualização de dependências exige uma rodada própria.
