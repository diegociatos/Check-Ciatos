# Auditoria Check Ciatos / Chekly — 18/09/2026

## Resultado e limites

Base examinada: commit `92c3fe4` da branch `main`. Trabalho local na branch `codex/auditoria-melhorias-iniciais`.

O produto tem uma base funcional ampla: tarefas, evidências, conferência, pontuação, calendário, kanban, bônus, fechamento mensal e gestão multiempresa. O maior risco identificado é a autorização do backend. Melhorias visuais podem avançar, mas os itens P0 abaixo devem ser corrigidos e testados antes de ampliar o uso ou publicar esta rodada.

Esta é uma auditoria do código e das configurações versionadas, com execução local do frontend e inspeção visual do login. Não é certificação de segurança nem comprovação do estado do Supabase publicado. Nenhuma migration foi aplicada, nenhuma função foi publicada, nenhum pagamento/e-mail foi disparado e nenhum dado real foi consultado ou modificado. Não houve push, merge ou deploy.

Não havia credenciais de teste nem banco local disponível com Docker. Logo, RLS, permissões efetivas, fluxos autenticados, pagamentos e recuperação real de senha foram analisados estaticamente, não executados de ponta a ponta. Configurações do painel Cloudflare/Supabase, DNS, TLS, backups, logs, SMTP e políticas realmente instaladas precisam de conferência separada. As capturas entregues são da interface local após as melhorias; o estado inicial de carregamento também foi observado no navegador, mas não foi salvo como arquivo.

## Prioridades

| ID | Prioridade | Achado e impacto | Evidência | Próximo passo / situação |
|---|---|---|---|---|
| SEC-01 | P0 | Gestor/Master pode alterar campos privilegiados do próprio perfil: a política permite update próprio e o trigger libera qualquer gestor. Alterar `Role` para Plataforma torna o isolamento por empresa ineficaz. | `20260707140000_multiempresa_fundacao.sql`, política `users_update_self`; `20260708150000_guard_quitar_senha_provisoria.sql`, `users_guard_self_update`; `services/api.ts`, `updateUser`. | Pendente. Bloquear campos de autorização para todos os clientes, inclusive gestores; permitir alterações somente por serviço administrativo com validação de hierarquia. Testar antes de migrar. |
| SEC-02 | P0 | `admin-users` aceita `update(user)` sem lista de campos permitidos. A regra de gestor só criar colaborador existe apenas em `create`; a criação por Master/Admin não veda Plataforma. O serviço usa chave privilegiada. | `supabase/functions/admin-users/index.ts`, ações `create` e `update`. | Pendente. Validar papel solicitado, papel atual do alvo, vínculo e campos por operação. Impedir alteração de `user_id`, empresa e identidade pelo payload genérico. |
| SEC-03 | P0, condicionado aos grants reais | RPCs pessoais verificam `Responsavel <> v_email`, mas `v_email` pode ser NULL sem sessão; a comparação NULL não lança erro. Não há revogações de EXECUTE nas migrations. Se o papel anônimo herdar execução, funções privilegiadas podem modificar/excluir tarefas conhecidas sem autenticação. | `20260708120000_tarefas_pessoais.sql` e `20260909120000_tarefa_pessoal_pontos_na_criacao.sql`, concluir/reabrir/excluir; funções SECURITY DEFINER. | Pendente. Verificar ACLs reais; negar `auth.uid() IS NULL` explicitamente, usar comparação segura contra NULL e revogar PUBLIC/anon de cada RPC mutável. Testar como anon e authenticated. Não houve tentativa no ambiente real. |
| SEC-04 | P0, condicionado à configuração | Webhook aceitava eventos sem token quando `ASAAS_WEBHOOK_TOKEN` não estava definido; esses eventos podem provisionar/suspender empresas e alterar armazenamento. | `supabase/functions/asaas-webhook/index.ts`, início do handler. | Corrigido somente na branch: segredo ausente → 503; token ausente/incorreto → 401, antes do cliente privilegiado. Seis testes locais. Ainda não publicado. |
| SEC-05 | P1 | Bloqueio/inativação de usuário e suspensão de empresa dependem principalmente do login no frontend; helpers de autorização não verificam status. Uma sessão já emitida pode continuar tendo acesso pelas políticas versionadas. | `app_role`, `app_empresas`, `app_tem_acesso`, `admin-users`; `services/api.ts`, login. | Pendente. Incluir status ativo nas decisões de autorização e testar suspensão durante sessão já aberta. |
| SEC-06 | P1 | Colaboradores podem ler todos os perfis, tarefas, extratos e fechamentos da empresa pelas políticas; o frontend filtra parte da informação somente depois de recebê-la. Perfis incluem telefone, endereço e nascimento. Evidências podem ser lidas/excluídas por qualquer membro da empresa. | `20260707170000_acesso_multiempresa.sql`; `20260707190000_storage_evidencias.sql`; `20260709130000_monthly_closings.sql`; `getUsers().select('*')`. | Definir visibilidade por papel; separar diretório público de campos privados e restringir evidências por tarefa/responsável/gestão. Se essa abertura for intencional, documentá-la. |
| SEC-07 | P1 | Cota/plano de anexos são verificados no cliente. RPC aceita delta arbitrário positivo/negativo, e Storage valida só a pasta da empresa. Upload direto contorna a cota. | `lib/storage.ts`; `incrementar_uso_storage`; policies `evidencias_*`. | Pendente. Reserva e contagem pelo backend usando metadados reais, validação de tarefa e plano na autorização de upload. |
| PAY-01 | P1 | Provisionamento não é transacional; checagem do status antes de criar empresa não impede eventos concorrentes. Atualização de memória usa leitura seguida de escrita. Erros podem retornar HTTP 200 ou ser ignorados. | `asaas-webhook`, `provisionar`, `ativarMemoria`, bloco catch. | Pendente. Registro único de evento, processamento transacional/idempotente, retries controlados e conciliação. Não alterar retorno para 5xx indiscriminadamente antes de resolver duplicidade. |
| DATA-01 | P1 | Consultas gerais sem paginação nem filtro de período/empresa no servidor podem truncar dados. Configuração local limita resposta a 1.000 linhas; a configuração publicada não foi consultada. Pontos e relatórios podem ficar incompletos. | `services/api.ts`, `getAll`; `supabase/config.toml`, `max_rows`; cálculos no `store.ts`. | Pendente. Paginação estável, consultas por empresa/período e agregação de totais no banco. Testar com mais de 1.000 registros. |
| DATA-02 | P1 | Falhas de carregamento eram convertidas em arrays vazios; timeout liberava tela sem explicar a falha. Respostas antigas podiam atualizar estado após troca de sessão. | efeito de carga em `store.ts`; `App.tsx` não mostrava `store.error`. | Corrigido na carga inicial: propagação de erros, retry, descarte de respostas obsoletas e sessão como origem da identidade. Testes de troca de conta e rede em ambiente autenticado ainda pendentes. |
| DATA-03 | P1 | Refresh descartava `empresa_id` do extrato e campos de tarefas; filtro por empresa ocultava lançamentos após atualizar. | `store.ts`, `refreshData`. | Corrigido: preservados empresa, datas e andamento; erro de refresh é informado. Regressão completa multiempresa pendente. |
| DATA-04 | P1 | Auditoria da tarefa faz delete/insert do extrato sem lock inicial nem índice UNIQUE em `task_id`. Chamadas concorrentes podem duplicar lançamentos. Gestão pode editar tarefas diretamente e reabrir fechamentos via políticas amplas. | `20260709130000_monthly_closings.sql`, `audit_task`; `idx_ledger_task` não único; policies de gestão. | Pendente. Lock por tarefa, unicidade compatível com a regra de negócio, trilha de auditoria e transições de fechamento no servidor. |
| UX-01 | P1 | Tela de auditoria criava um segundo store, guardava Promise como resultado e anunciava correções que a rotina não fazia. | `components/BotHistoryView.tsx`; `store.ts`, `auditAndFixTasks`. | Corrigido: callback do store principal, await, consulta no escopo da empresa e mensagem explícita de consulta sem alteração. |
| OPS-01 | P1 | Workflow de deploy faz build sem typecheck/testes. README aponta Netlify, mas existe deploy Cloudflare para `chekly` em push de `main`; `workflow_dispatch` também força `--branch=main`. | `.github/workflows/deploy-cloudflare.yml`; README; `netlify.toml`. | README corrigido; workflow de qualidade separado adicionado. Torná-lo obrigatório na proteção da main e condicionar deploy à aprovação desses checks. Não disparar manualmente o deploy para testar uma branch. |
| SEC-08 | P2 | Função de e-mail aceita destinatário e conteúdo do cliente sem conferir a tarefa/empresa; checkout público não tem limitação de abuso explícita no código. | `notificar-tarefa/index.ts`; `asaas-checkout/index.ts`. | Usar ID da tarefa, resolver destinatário no backend, limites por conta/IP e proteção contra abuso no checkout. Proteções externas não foram verificadas. |

P0 = corrigir com urgência; P1 = próxima rodada de robustez; P2 = melhoria planejada. Os achados referem-se à versão do código examinada, não provam exploração nem instalação dessas versões em produção.

## Frontend, UX/UI e responsividade

A marca já tem identidade consistente de vermelho e fundo quente, componentes compartilhados, tabelas, estados vazios e navegação inferior no celular. Preservei a fonte editorial e a identidade existente. A primeira rodada torna o login mais leve: fundo claro, cartão sem altura mínima rígida, espaçamento adaptável, contraste melhor, rótulos permanentes, preenchimento automático, área de toque do botão de senha e status de erro anunciado. “Esqueceu a senha?” agora explica o caminho na própria tela, sem alerta nativo. Isso não implementa recuperação automática por e-mail.

Capturas: `docs/capturas/login-desktop.png` (1280×800), `login-mobile.png` (390×844), `login-320px.png` (320×740) e `login-erro-mobile.png`. As dimensões representam viewports solicitados ao navegador. Login, expansão da ajuda e erro sem ambiente configurado foram inspecionados. Não foi encontrado corte horizontal visual nessas telas.

O layout ganhou altura dinâmica para celular, nomes acessíveis em botões de menu/notificações e limite de largura do painel de notificações. Foco de teclado e redução de movimento receberam regras globais. Falhas de renderização agora têm uma tela recuperável.

Próxima rodada visual: reduzir títulos em caixa alta e textos de 9–10px nas telas de gestão; padronizar botões, filtros e tabelas; simplificar a navegação por papel; oferecer estado vazio com ação clara; revisar foco preso/restaurado e semântica de diálogo no Drawer. Kanban usa drag-and-drop: validar alternativas por teclado e toque. Testar tabelas, calendários, menus e modais com dados longos, zoom 200%, teclado virtual e diferentes dispositivos. Não considerar essas telas aprovadas visualmente sem uma conta fictícia e dados representativos.

## Fluxos que exigem validação integrada

| Fluxo | Revisão estática | Teste necessário |
|---|---|---|
| Login, refresh e logout | Sessão agora dirige a identidade; erros de carga são visíveis. | Login real, token expirado, troca de conta/aba, rede lenta e retry. |
| Convite e recuperação | Convites usam link recovery e flag SenhaProvisoria. Não há tela dedicada a PASSWORD_RECOVERY para usuário existente sem a flag. | Link expirado, conta antiga já logada, reset de conta existente, usuário sem perfil. |
| Troca de empresa | UI filtra conjuntos já baixados; papel de `user_empresas.papel` não é usado como autorização contextual pelos helpers. | Mesma pessoa Gestor em A e Colaborador em B; impedir uso do papel mais alto em B. |
| Tarefa pessoal | RPC usa `app_empresa()` (empresa de origem), não a seleção ativa do frontend. | Criar quando outra empresa estiver selecionada; confirmar destino e feedback. |
| Concluir/conferir/pontuar | SQL e `lib/scoreEngine.ts` coexistem; alterações de regras não devem divergir. | Aprovação repetida/concorrente, reentrega, prazo no limite do dia e mês fechado. |
| Anexos | Bucket privado, limite de 5 MB e tipos permitidos são pontos positivos. | Plano sem anexos, cota concorrente, arquivo de outra tarefa, remoção e ajuste de uso. |
| Bônus/fechamento | Regras configuráveis coexistem com multiplicadores fixos na RPC de auditoria. | Definir se regras afetam pontos ou só bônus; testar equivalência da prévia e resultado persistido. |
| Pagamento | Falhas e concorrência podem deixar provisionamento parcial. | Asaas sandbox, evento duplicado/fora de ordem, falha no convite e reconciliação. |

## Performance e manutenção

O build inicial tinha chunk principal de **1.541,00 kB** (gzip **446,84 kB**). Após dividir as telas com React.lazy/Suspense, o primeiro build modificado gerou **494,63 kB** (gzip **141,21 kB**): cerca de **68% menos JavaScript nesse arquivo de entrada**. Isso não significa 68% menos tempo de carregamento ou menos código total; gráficos e PDF passam a ser obtidos quando necessários. Não foram medidos Lighthouse, Core Web Vitals nem latência de produção.

Pontos restantes: store monolítico, normalizações duplicadas, abundância de `any`, APIs sem tipos gerados do Supabase, avisos de dependências dos hooks, contagem de métricas repetindo filtros de arrays e datas calculadas com misturas de date-only/local/UTC. Extrair dados por domínio, reutilizar normalizadores e testar regras de pontuação e datas com casos concretos. A tipagem real do React foi adicionada e revelou dois defeitos antes mascarados, corrigidos nesta branch.

O comando de lint exclui Edge Functions; o typecheck também. Os seis testes novos verificam o guard e sua integração com o handler do webhook, com cliente privilegiado simulado. Não equivalem à validação de todas as funções no Deno nem a testes SQL/RLS.

## Supabase: plano de segurança

Aplicar primeiro em projeto separado com duas empresas e contas Plataforma, Master, Gestor e Colaborador. Para cada tabela/RPC/storage, executar matriz de leitura e escrita própria, de colega, de outra empresa, sem sessão, usuário bloqueado e empresa suspensa. Verificar grants efetivos além do texto das policies. Usar `user_id/auth.uid()` como identidade estável, reduzir dependência de e-mail e separar campos editáveis de perfil de campos administrativos.

RLS está habilitada nas tabelas principais e no bucket privado, mas RLS não corrige uma função SECURITY DEFINER com autorização insuficiente. A chave anon versionada é pública por desenho do Supabase; sua presença no bundle não é o problema identificado. A chave service role é lida do ambiente nas funções e não deve ir para o frontend.

Não criei uma migration automática para corrigir a hierarquia: ela exige testes de compatibilidade com gestão multiempresa, convites e operações administrativas. Alterar só o frontend não resolve SEC-01/02/03.

## Cloudflare, operação e SEO

O workflow versionado publica o app Vite (`dist/`) em Cloudflare Pages; `_redirects` faz fallback da SPA e `_headers` dá cache longo aos assets com hash. Acrescentei `nosniff` e política de referrer; os cabeçalhos precisam ser verificados no domínio publicado após deploy autorizado. CSP deve ser desenhada após inventário de conexões, imagens e PDFs, de preferência começando com observação.

Não existe comprovação de DNS/WAF/TLS/regras ativas nesta auditoria. O `netlify.toml` e o site de vendas ainda têm configuração/link Netlify. Não substituí URLs por suposição. Confirmar o domínio canônico do aplicativo e do site comercial. O diretório `site/` é separado do build Vite e não é publicado por esse workflow.

SEO é secundário para a área autenticada; acrescentei descrição ao HTML do app. A landing page já tem título e descrição, mas precisa validar canonical, compartilhamento social, sitemap e indexação no domínio real. Contrato e dados de contato têm pontos de preenchimento documentados no README do site; revisão de conteúdo comercial fica pendente.

## Verificações e entrega

- Instalação pelo lockfile, Node 22.
- Baseline: typecheck passou na configuração original; lint 0 erros/43 avisos; build concluído com alerta de chunk grande.
- Branch: types React adicionados; typecheck e lint novamente executados; avisos preexistentes são registrados, não ocultados.
- Seis testes do webhook: token ausente, configuração vazia, token incorreto, token correto e rejeição antes de construir cliente privilegiado.
- Auditoria npm das dependências de produção encontrou um pacote com alerta moderado (DOMPurify transitivo); atualização pontual dentro da faixa permitida removeu os alertas nessa consulta. Isso não comprova ausência de vulnerabilidades no código.
- Inspeção local do login em desktop e celular, ajuda e erro; nenhuma autenticação real efetuada.
- Detalhes finais dos comandos e versões em `VALIDACAO-2026-09-18.md`.

Para revisar: comparar a branch com `main`. Para desfazer: reverter os commits locais desta rodada, sem qualquer rollback de banco, porque o banco não foi alterado. Não mesclar/publicar automaticamente: a proteção do webhook requer configuração do token e os outros P0 continuam pendentes.

## Referências técnicas consultadas

- [Supabase — RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): limites e uso de políticas com Auth.
- [Supabase — Database Functions](https://supabase.com/docs/guides/database/functions): privilégios e funções SECURITY DEFINER.
- [Supabase — Column Level Security](https://supabase.com/docs/guides/database/postgres/column-level-security): restrição de campos além da filtragem de linhas.
- [Cloudflare Pages — Headers](https://developers.cloudflare.com/pages/configuration/headers/): aplicação de `_headers` aos assets estáticos.
