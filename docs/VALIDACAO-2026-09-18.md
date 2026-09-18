# Validação — 18/09/2026

Base: `92c3fe4`. Branch: `codex/auditoria-melhorias-iniciais`. Node: 22.21.0. npm: 10.9.4.

| Verificação | Resultado |
|---|---|
| `npm run check` | Sucesso: TypeScript sem erros; ESLint sem erros, com 43 avisos preexistentes. |
| `npm test` | 6 testes aprovados, 0 falhas. Guard e handler do webhook com dependências simuladas, sem rede. |
| `npm run build` | Sucesso. Chunk principal final: 494,76 kB; gzip 141,20 kB. |
| Build original | Chunk principal: 1.541,00 kB; gzip 446,84 kB. Redução aproximada de 68% no arquivo principal. |
| `npm audit --omit=dev` | Antes: 1 pacote com alerta moderado. Depois: 0 alertas nessa consulta. DOMPurify atualizado para 3.4.15. |
| Revisão de diff | Sem erros de whitespace, considerando CRLF dos arquivos originais. |
| Navegador local | Login inspecionado em 1280×800, 390×844 e 320×740. Ajuda de recuperação abre dentro da página; login sem configuração apresenta erro explícito. |

O servidor local foi iniciado em `http://127.0.0.1:3000/`, sem `.env.local` e sem variáveis do banco real. A tentativa de login usou valores fictícios e foi bloqueada localmente por ausência de configuração.

Limitações: não houve teste de banco/RLS, autenticação real, entrega de e-mail, Asaas sandbox, deploy Cloudflare nem testes de telas autenticadas com dados representativos. Docker não estava disponível no caminho; as ferramentas Supabase e Deno foram localizadas, mas não foi iniciado um banco local. O typecheck do projeto exclui `supabase/`; não houve validação Deno completa. A auditoria npm registrada cobre dependências de produção.

Os avisos de lint restantes são imports não utilizados e dependências de hooks. A rodada não os converte em erros nem os suprime.

## Evidências

- [Checagem original](evidencias/check-antes.txt)
- [Checagem final](evidencias/check-depois.txt)
- [Testes](evidencias/testes.txt)
- [Build final](evidencias/build-depois.txt)
- [Auditoria npm antes](evidencias/npm-audit-antes.json)
- [Auditoria npm depois](evidencias/npm-audit-depois.json)
- [Captura desktop](capturas/login-desktop.png)
- [Captura celular](capturas/login-mobile.png)
- [Captura 320 px](capturas/login-320px.png)
- [Erro no login local](capturas/login-erro-mobile.png)

## Revisão e reversão

As alterações estão em commits locais e não foram enviadas ao GitHub. Nenhum workflow remoto foi disparado. Para comparar: `git diff main...codex/auditoria-melhorias-iniciais`. Para desfazer uma alteração, use `git revert` no commit correspondente. Não há alterações no banco a reverter.

Antes de qualquer publicação, resolver os P0 pendentes do relatório e testar em staging. A função de webhook modificada exige `ASAAS_WEBHOOK_TOKEN`; sem esse segredo ela recusa eventos. A regra de CI adicionada não altera sozinha a proteção da branch nem impede que o workflow de deploy existente rode em paralelo.
