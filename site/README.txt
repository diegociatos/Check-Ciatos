Check-Ciatos — site de vendas (self-service com Asaas)

Arquivos:
- index.html      landing + modal de contratação/aceite
- contrato.html   Contrato de Assinatura (SaaS) + Termos de Uso + Política de Privacidade (LGPD)
- styles.css

PUBLICAÇÃO (Netlify — site estático separado do app):
1. Crie um site no Netlify apontando a "publish directory" para a pasta "site/".
   (ou arraste os 3 arquivos para um deploy manual em app.netlify.com/drop)

CONFIGURAÇÃO (no fim do index.html, objeto CONFIG):
   SUPABASE_URL       = URL do projeto Supabase, ex.: https://xxxx.supabase.co
   SUPABASE_ANON_KEY  = chave pública "anon" do projeto (pode ficar no front — é pública)
   APP_URL            = endereço de login do app Check-Ciatos (botão "contratar memória no app")

COMO FUNCIONA:
- Botões "Assinar" abrem o modal: dados da empresa + aceite do contrato.
- Ao enviar, o site chama a Edge Function `asaas-checkout` (Supabase), que grava o
  signup + o aceite e cria a assinatura no Asaas, devolvendo a URL de pagamento.
- O cliente paga; o webhook `asaas-webhook` confirma o pagamento e provisiona a
  empresa + usuário Master (e-mail de acesso automático).

PLANOS:
- Controle:   R$ 39,90/mês  — sem anexos.
- Evidências: R$ 149,90/mês — com anexos e 1 GB de armazenamento.
- Memória extra: 500 MB por R$ 100/mês (recorrente), contratada dentro do app.

IMPORTANTE:
- A memória extra é contratada DENTRO do app (tela "Plano e armazenamento"), pois
  depende de uma empresa já existente.
- Revise contrato.html com o jurídico e preencha os campos [ ] (razão social, CNPJ,
  foro, e-mail de contato/DPO) antes de ir para produção.
