// Edge Function: asaas-checkout
// Inicia a contratação self-service. Dois fluxos:
//  - action 'assinar'  (público, chamado pelo site): grava signup + aceite de contrato,
//    cria cliente + assinatura recorrente no Asaas e devolve a URL de pagamento.
//  - action 'memoria'  (autenticado, chamado pelo app): cria assinatura recorrente de
//    memória extra (+500 MB / R$100) para a empresa e devolve a URL de pagamento.
// Requer secret ASAAS_API_KEY. verify_jwt=false (o site é anônimo).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const PRECOS: Record<string, number> = { Controle: 39.90, Evidencias: 149.90 };
const MEMORIA_VALOR = 100.00;
const MEMORIA_MB = 500;

// Detecção tolerante: qualquer coisa que comece com "prod" (Production, produção…) = produção.
const ASAAS_ENV = (Deno.env.get('ASAAS_ENV') || 'sandbox').trim().toLowerCase();
const ASAAS_IS_PROD = ASAAS_ENV.startsWith('prod');
const ASAAS_BASE = (Deno.env.get('ASAAS_BASE_URL') || '').trim()
  || (ASAAS_IS_PROD ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3');
// Remove QUALQUER espaço/quebra de linha (Asaas keys não têm whitespace); evita
// "Invalid header value" quando a chave é colada quebrada em duas linhas.
const ASAAS_KEY = (Deno.env.get('ASAAS_API_KEY') || '').replace(/\s+/g, '');

async function asaas(path: string, method: string, body?: unknown) {
  const r = await fetch(ASAAS_BASE + path, {
    method,
    headers: { 'access_token': ASAAS_KEY!, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const detalhe = (data as any)?.errors?.[0]?.description || (data as any)?.message || `Asaas ${r.status}`;
    throw new Error(detalhe);
  }
  return data as any;
}

// Data de hoje (America/Sao_Paulo) em YYYY-MM-DD para a 1ª cobrança.
function hojeSP(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(new Date());
}

const soDigitos = (v?: string | null) => (v ? String(v).replace(/\D/g, '') : '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  if (!ASAAS_KEY) return json({ error: 'Pagamento indisponível: ASAAS_API_KEY não configurada.' }, 503);

  const url = Deno.env.get('SUPABASE_URL')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, service);

  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: 'JSON inválido' }, 400); }
  const action = payload?.action;

  try {
    // ---------------------------------------------------------------
    // 0) Ping de diagnóstico — valida a chave no Asaas (read-only, não cria nada).
    // ---------------------------------------------------------------
    if (action === 'ping') {
      // Diagnóstico de conectividade/autenticação — nunca expõe a chave.
      try {
        await asaas('/customers?limit=1', 'GET');
        return json({ ok: true, env: ASAAS_ENV, base: ASAAS_BASE, autenticado: true });
      } catch (e) {
        const msg = String((e as Error).message || '').replace(/\$aact_[A-Za-z0-9=\-_]+/g, '[REDACTED]').slice(0, 300);
        return json({ ok: false, env: ASAAS_ENV, base: ASAAS_BASE, autenticado: false, msg });
      }
    }

    // ---------------------------------------------------------------
    // 1) Assinatura de plano (site público)
    // ---------------------------------------------------------------
    if (action === 'assinar') {
      const plano = payload.plano === 'Evidencias' ? 'Evidencias' : payload.plano === 'Controle' ? 'Controle' : null;
      if (!plano) return json({ error: 'Plano inválido' }, 400);
      if (payload.aceite !== true) return json({ error: 'É necessário aceitar o contrato' }, 400);

      const empresaNome = String(payload.empresa_nome || '').trim();
      const respNome = String(payload.responsavel_nome || '').trim();
      const respEmail = String(payload.responsavel_email || '').trim().toLowerCase();
      if (!empresaNome || !respNome || !respEmail.includes('@')) {
        return json({ error: 'Preencha empresa, responsável e um e-mail válido.' }, 400);
      }

      // 1.1 Grava o signup (pendente) e o aceite (prova jurídica).
      const { data: signup, error: eSign } = await admin.from('signups').insert({
        Plano: plano,
        empresa_nome: empresaNome,
        cnpj: payload.cnpj || null,
        responsavel_nome: respNome,
        responsavel_email: respEmail,
        telefone: payload.telefone || null,
        status: 'pendente',
      }).select().single();
      if (eSign) throw eSign;

      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
      await admin.from('contrato_aceites').insert({
        signup_id: signup.id,
        documento: payload.documento || 'contrato-saas',
        versao: payload.versao || '2026-07-10',
        aceitante_nome: respNome,
        aceitante_email: respEmail,
        cnpj: payload.cnpj || null,
        ip,
        user_agent: String(payload.user_agent || '').slice(0, 500) || null,
      });

      // 1.2 Cliente + assinatura no Asaas.
      const customer = await asaas('/customers', 'POST', {
        name: empresaNome,
        email: respEmail,
        cpfCnpj: soDigitos(payload.cnpj) || undefined,
        mobilePhone: soDigitos(payload.telefone) || undefined,
        externalReference: signup.id,
      });

      const sub = await asaas('/subscriptions', 'POST', {
        customer: customer.id,
        billingType: 'UNDEFINED', // cliente escolhe boleto/Pix/cartão na fatura
        value: PRECOS[plano],
        nextDueDate: hojeSP(),
        cycle: 'MONTHLY',
        description: `Check-Ciatos — Plano ${plano === 'Evidencias' ? 'Evidências' : 'Controle'}`,
        externalReference: signup.id,
      });

      await admin.from('signups').update({
        asaas_customer_id: customer.id,
        asaas_subscription_id: sub.id,
        updated_at: new Date().toISOString(),
      }).eq('id', signup.id);

      // 1.3 URL de pagamento da 1ª cobrança.
      const pays = await asaas(`/subscriptions/${sub.id}/payments?limit=1`, 'GET');
      const invoiceUrl = pays?.data?.[0]?.invoiceUrl || null;
      if (!invoiceUrl) return json({ error: 'Assinatura criada, mas não retornou link de pagamento. Verifique no Asaas.' }, 502);

      return json({ url: invoiceUrl, signup_id: signup.id });
    }

    // ---------------------------------------------------------------
    // 2) Memória extra (chamado pelo app, autenticado)
    // ---------------------------------------------------------------
    if (action === 'memoria') {
      const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
      const authHeader = req.headers.get('Authorization') ?? '';
      const asCaller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
      const { data: me } = await asCaller.auth.getUser();
      if (!me?.user?.email) return json({ error: 'Não autenticado' }, 401);

      const empresaId = String(payload.empresa_id || '');
      if (!empresaId) return json({ error: 'Empresa não informada' }, 400);

      // Autorização: o chamador precisa pertencer/administrar a empresa (ou ser plataforma).
      const { data: caller } = await admin.from('users').select('"Role", empresa_id').ilike('Email', me.user.email).maybeSingle();
      const role = String((caller as any)?.Role ?? '').toLowerCase();
      const { data: vinc } = await admin.from('user_empresas').select('empresa_id').ilike('email', me.user.email);
      const acesso = new Set<string>([(caller as any)?.empresa_id, ...((vinc as any[]) ?? []).map(v => v.empresa_id)].filter(Boolean));
      if (role !== 'plataforma' && !acesso.has(empresaId)) return json({ error: 'Sem acesso a esta empresa' }, 403);
      if (!['plataforma', 'master', 'admin'].includes(role)) return json({ error: 'Apenas o Master pode contratar memória extra' }, 403);

      const { data: emp } = await admin.from('empresas').select('"Nome", "Plano"').eq('id', empresaId).maybeSingle();
      if (!emp) return json({ error: 'Empresa não encontrada' }, 404);

      const customer = await asaas('/customers', 'POST', {
        name: `${(emp as any).Nome} — Memória extra`,
        email: me.user.email,
        externalReference: `memoria:${empresaId}`,
      });
      const sub = await asaas('/subscriptions', 'POST', {
        customer: customer.id,
        billingType: 'UNDEFINED',
        value: MEMORIA_VALOR,
        nextDueDate: hojeSP(),
        cycle: 'MONTHLY',
        description: `Check-Ciatos — Memória extra +${MEMORIA_MB} MB`,
        externalReference: `memoria:${empresaId}`,
      });

      // Registra o pacote como PENDENTE; o webhook ativa e soma os 500 MB no 1º pagamento.
      await admin.from('memoria_extra').insert({
        empresa_id: empresaId,
        asaas_subscription_id: sub.id,
        mb: MEMORIA_MB,
        status: 'pendente',
      });

      const pays = await asaas(`/subscriptions/${sub.id}/payments?limit=1`, 'GET');
      const invoiceUrl = pays?.data?.[0]?.invoiceUrl || null;
      if (!invoiceUrl) return json({ error: 'Assinatura criada, mas sem link de pagamento. Verifique no Asaas.' }, 502);
      return json({ url: invoiceUrl });
    }

    return json({ error: 'Ação desconhecida' }, 400);
  } catch (err) {
    return json({ error: (err as Error).message || 'Erro ao processar a contratação' }, 400);
  }
});
