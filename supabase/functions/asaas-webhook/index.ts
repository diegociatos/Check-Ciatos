// Edge Function: asaas-webhook
// Recebe eventos do Asaas e provisiona/ajusta o acesso:
//  - PAYMENT_CONFIRMED / PAYMENT_RECEIVED:
//      * assinatura de PLANO  -> cria empresa + usuário Master + e-mail de acesso.
//      * assinatura de MEMÓRIA -> ativa o pacote e soma +500 MB (uma única vez).
//  - SUBSCRIPTION_DELETED / SUBSCRIPTION_INACTIVATED:
//      * PLANO   -> suspende a empresa.
//      * MEMÓRIA -> cancela o pacote e devolve os 500 MB.
// Segurança: valida o header 'asaas-access-token' contra ASAAS_WEBHOOK_TOKEN (se definido).
// verify_jwt=false (o Asaas chama sem JWT do Supabase).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function senhaAleatoria(): string {
  const b = new Uint8Array(24);
  crypto.getRandomValues(b);
  const base = btoa(String.fromCharCode(...b)).replace(/[^a-zA-Z0-9]/g, '');
  return `${base}Aa1!`;
}

async function gerarLinkConvite(admin: any, email: string): Promise<string | null> {
  try {
    const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email });
    if (error) return null;
    return (data as any)?.properties?.action_link ?? null;
  } catch { return null; }
}

async function enviarEmailAcesso(email: string, nome: string | undefined, empresa: string, link: string): Promise<boolean> {
  const key = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('RESEND_FROM') || 'Check-Ciatos <onboarding@resend.dev>';
  if (!key || !link) return false;
  const nomeSeguro = String(nome ?? '').replace(/[<>&]/g, '');
  const empSeguro = String(empresa ?? '').replace(/[<>&]/g, '');
  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; color:#1c1917; max-width:520px; margin:0 auto;">
      <div style="background:#8B1B1F; color:#fff; padding:20px 24px; border-radius:12px 12px 0 0;">
        <h1 style="margin:0; font-size:20px;">Bem-vindo ao Check-Ciatos</h1>
      </div>
      <div style="border:1px solid #e7e5e4; border-top:0; border-radius:0 0 12px 12px; padding:24px;">
        <p style="margin:0 0 12px;">Olá${nomeSeguro ? ', ' + nomeSeguro : ''},</p>
        <p style="margin:0 0 16px;">Seu pagamento foi confirmado e a empresa <strong>${empSeguro}</strong> já está ativa. Clique abaixo para <strong>definir sua senha</strong> e acessar como responsável (Master).</p>
        <p style="margin:0 0 20px;"><a href="${link}" style="background:#8B1B1F; color:#fff; text-decoration:none; padding:12px 20px; border-radius:10px; font-weight:600; display:inline-block;">Definir minha senha e acessar</a></p>
        <p style="margin:0; color:#78716c; font-size:13px;">O link é pessoal e expira. Se você não reconhece esta contratação, ignore este e-mail.</p>
      </div>
    </div>`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [email], subject: 'Check-Ciatos — acesso liberado, defina sua senha', html }),
    });
    return r.ok;
  } catch { return false; }
}

// Cria empresa + Master + convite. Idempotente pelo status do signup.
async function provisionar(admin: any, signup: any): Promise<void> {
  if (signup.status === 'provisionado' && signup.empresa_id) return;

  const storageLimit = signup.Plano === 'Evidencias' ? 1024 : 0;
  const { data: emp, error: eEmp } = await admin.from('empresas').insert({
    Nome: signup.empresa_nome,
    Plano: signup.Plano,
    Status: 'Ativa',
    StorageLimitMB: storageLimit,
    StorageUsedMB: 0,
    StorageExtraMB: 0,
  }).select().single();
  if (eEmp) throw eEmp;

  const email = String(signup.responsavel_email).toLowerCase();
  const { data: existente } = await admin.from('users').select('*').ilike('Email', email).maybeSingle();

  if (!existente) {
    const { data: created, error: eAuth } = await admin.auth.admin.createUser({
      email, password: senhaAleatoria(), email_confirm: true,
    });
    if (eAuth) throw eAuth;
    const { error: eUser } = await admin.from('users').insert({
      Email: email, Nome: signup.responsavel_nome, Role: 'Master', Status: 'Ativo',
      SenhaProvisoria: true, user_id: created.user?.id, empresa_id: emp.id,
    });
    if (eUser) throw eUser;
  } else if (!(existente as any).empresa_id) {
    await admin.from('users').update({ empresa_id: emp.id }).ilike('Email', email);
  }

  await admin.from('user_empresas').upsert(
    { email, empresa_id: emp.id, papel: 'Master' }, { onConflict: 'email,empresa_id' },
  );

  const link = await gerarLinkConvite(admin, email);
  if (link) await enviarEmailAcesso(email, signup.responsavel_nome, signup.empresa_nome, link);

  await admin.from('signups').update({
    status: 'provisionado', empresa_id: emp.id, updated_at: new Date().toISOString(),
  }).eq('id', signup.id);
}

async function ativarMemoria(admin: any, mem: any): Promise<void> {
  if (mem.status === 'ativa') return; // idempotente: renovações não somam de novo
  await admin.rpc('incrementar_uso_storage', { p_empresa: mem.empresa_id, p_delta_mb: 0 }).catch(() => {});
  const { data: emp } = await admin.from('empresas').select('StorageExtraMB').eq('id', mem.empresa_id).maybeSingle();
  const atual = Number((emp as any)?.StorageExtraMB ?? 0);
  await admin.from('empresas').update({ StorageExtraMB: atual + Number(mem.mb || 500) }).eq('id', mem.empresa_id);
  await admin.from('memoria_extra').update({ status: 'ativa' }).eq('id', mem.id);
}

async function cancelarMemoria(admin: any, mem: any): Promise<void> {
  if (mem.status !== 'ativa') { await admin.from('memoria_extra').update({ status: 'cancelada' }).eq('id', mem.id); return; }
  const { data: emp } = await admin.from('empresas').select('StorageExtraMB').eq('id', mem.empresa_id).maybeSingle();
  const atual = Number((emp as any)?.StorageExtraMB ?? 0);
  await admin.from('empresas').update({ StorageExtraMB: Math.max(0, atual - Number(mem.mb || 500)) }).eq('id', mem.empresa_id);
  await admin.from('memoria_extra').update({ status: 'cancelada' }).eq('id', mem.id);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  // Autenticação do webhook (token configurado no painel do Asaas).
  const tokenEsperado = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
  if (tokenEsperado) {
    const recebido = req.headers.get('asaas-access-token') || '';
    if (recebido !== tokenEsperado) return json({ error: 'Token inválido' }, 401);
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, service);

  let evt: any;
  try { evt = await req.json(); } catch { return json({ error: 'JSON inválido' }, 400); }

  const event = String(evt?.event || '');
  const payment = evt?.payment || {};
  const subscriptionId = payment.subscription || evt?.subscription?.id || null;
  const externalRef = String(payment.externalReference || evt?.subscription?.externalReference || '');

  try {
    const confirmado = event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED';
    const cancelado = event === 'SUBSCRIPTION_DELETED' || event === 'SUBSCRIPTION_INACTIVATED';

    // Descobre a que assinatura este evento pertence (plano ou memória).
    const acharSignup = async () => {
      if (subscriptionId) {
        const { data } = await admin.from('signups').select('*').eq('asaas_subscription_id', subscriptionId).maybeSingle();
        if (data) return data;
      }
      if (externalRef && !externalRef.startsWith('memoria:')) {
        const { data } = await admin.from('signups').select('*').eq('id', externalRef).maybeSingle();
        return data;
      }
      return null;
    };
    const acharMemoria = async () => {
      if (subscriptionId) {
        const { data } = await admin.from('memoria_extra').select('*').eq('asaas_subscription_id', subscriptionId).maybeSingle();
        return data;
      }
      return null;
    };

    if (confirmado) {
      const mem = await acharMemoria();
      if (mem) { await ativarMemoria(admin, mem); return json({ ok: true, tipo: 'memoria' }); }
      const signup = await acharSignup();
      if (signup) { await provisionar(admin, signup); return json({ ok: true, tipo: 'plano' }); }
      return json({ ok: true, ignorado: 'assinatura não reconhecida' });
    }

    if (cancelado) {
      const mem = await acharMemoria();
      if (mem) { await cancelarMemoria(admin, mem); return json({ ok: true, tipo: 'memoria-cancelada' }); }
      const signup = await acharSignup();
      if (signup?.empresa_id) {
        await admin.from('empresas').update({ Status: 'Suspensa' }).eq('id', signup.empresa_id);
        return json({ ok: true, tipo: 'plano-suspenso' });
      }
      return json({ ok: true, ignorado: 'assinatura não reconhecida' });
    }

    return json({ ok: true, ignorado: event });
  } catch (err) {
    // Responde 200 mesmo em erro lógico para o Asaas não reenfileirar infinitamente,
    // mas registra o motivo para diagnóstico.
    console.error('webhook erro:', (err as Error).message, 'event:', event, 'sub:', subscriptionId);
    return json({ ok: false, erro: (err as Error).message }, 200);
  }
});
