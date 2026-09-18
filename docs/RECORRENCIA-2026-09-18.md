# Recorrência semanal e diária — 18/09/2026

Solicitação: tarefas fixas semanais precisam aparecer projetadas para a próxima semana; tarefas diárias precisam permitir excluir sábados e domingos.

## Causa

O calendário recebia somente `tasks`, com ocorrências que já haviam sido criadas. Modelos em `task_templates` não eram projetados. Salvar um modelo semanal não criava todas as tarefas futuras, e não foi encontrada uma rotina automática de recorrência no código versionado.

O campo `PularFinalDeSemana` já existe no modelo, é salvo pela API e é considerado pela função SQL de geração vigente para diárias. A interface, porém, exibia a opção apenas para modelos mensais e avulsos.

## Comportamento implementado

- Calendário recebe modelos da empresa selecionada e projeta suas próximas ocorrências no mês exibido, a partir de hoje e da data de início. Na visão “Minhas”, filtra pelo responsável; gestão pode selecionar “Equipe”.
- Semanal respeita todos os dias escolhidos, incluindo a próxima semana e semanas seguintes. Um botão “Próxima semana” seleciona a segunda-feira da semana seguinte, mesmo na virada de mês.
- Diário oferece “Somente de segunda a sexta-feira”. Marcado: sábado e domingo ficam sem previsão; desmarcado: todos os dias permanecem incluídos. Feriados não são excluídos. Modelos existentes mantêm sua configuração até serem editados.
- O cadastro mostra as próximas cinco datas. Os botões de dia exibem Seg/Ter/Qua etc., com nome acessível e estado de seleção.
- Projeções recebem rótulo “Prevista”. Não são inseridas no banco, não recebem ações de conclusão e não entram no store, na pontuação, nas entregas, nas contagens de atraso nem na contagem “Vencem hoje”. A contagem de previsões fica separada das tarefas geradas.
- Uma ocorrência já gerada do mesmo modelo e data não aparece também como previsão. Modelos pausados não geram novas projeções; tarefas reais já criadas continuam visíveis.
- O formulário aguarda confirmação do salvamento, bloqueia submissão duplicada e mantém os dados digitados se o salvamento falhar. A geração manual também aguarda o resultado e mostra aviso quando a ocorrência já existe.

Não há migrations nem mudança da geração automática nesta rodada. O botão “Gerar” continua criando uma tarefa real pela função já existente. As projeções resolvem a visualização do planejamento; não substituem uma rotina que crie tarefas automaticamente a cada dia. Essa rotina exige implementação e validação próprias no backend, com idempotência e compatibilidade com as policies. A geração SQL de modelos mensais tem divergências documentadas na auditoria anterior e não foi alterada aqui.

## Validação

- Oito testes novos das datas: próxima semana, início futuro, dias explicitamente escolhidos, ausência de dias, diária com/sem fim de semana, virada de mês, datas inválidas, modelos pausados, deduplicação e estabilidade das previsões. Os seis testes anteriores do webhook continuam incluídos.
- Inspeção no navegador com dados fictícios em `tests/recurrence-preview.html`, sem autenticação e sem chamadas à API. A página de teste não é uma entrada do build de produção.
- Confirmado: dia 21/09 mostra a semanal e a diária; sábado e domingo ficam sem previsão para a diária de segunda a sexta. O atalho seleciona 21/09. O cadastro exibe 18/09, 21/09, 22/09, 23/09 e 24/09 como próximas datas.
- Confirmado: falha simulada mantém o formulário aberto com mensagem; salvamento local da opção desmarcada altera o resumo para “Todos os dias”.
- Cadastro inspecionado em desktop e celular (390×844). Capturas com dados fictícios em `docs/capturas/recorrencia-*.png`.
- Validação de tipos, lint, testes e build executada localmente. Não houve alteração de dados reais, push ou publicação. O salvamento real no Supabase deverá ser validado em ambiente de teste antes de publicar.

## Uso após publicação autorizada

Para a Gabriela: editar a tarefa fixa, escolher “Semanal”, selecionar os dias desejados e salvar. No Calendário, escolher “Equipe” e usar “Próxima semana”. Para a diária sem fim de semana: editar o modelo diário, marcar “Somente de segunda a sexta-feira” e salvar. Tarefas que já foram geradas para um fim de semana não são excluídas automaticamente.
