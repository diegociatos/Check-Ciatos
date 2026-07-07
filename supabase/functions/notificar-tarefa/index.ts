// Edge Function: notificar-tarefa
// Envia e-mail (via Resend) para o responsável quando uma nova obrigação é criada.
// Requer o segredo RESEND_API_KEY (e RESEND_FROM). Chamado pelo app após gerar a tarefa.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

const esc = (t: string) => String(t ?? '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));
const fmtData = (d?: string) => {
  if (!d) return '';
  const only = d.includes('T') ? d.split('T')[0] : d;
  const [a, m, dia] = only.split('-');
  return a && m && dia ? `${dia}/${m}/${a}` : only;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'Check-Ciatos <onboarding@resend.dev>';

  // Autoriza: precisa estar autenticado e ser gestão (quem cria tarefa).
  const asCaller = createClient(url, anon, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: me } = await asCaller.auth.getUser();
  if (!me?.user?.email) return json({ error: 'Não autenticado' }, 401);
  const admin = createClient(url, service);
  const { data: caller } = await admin.from('users').select('"Role"').ilike('Email', me.user.email).maybeSingle();
  const role = String((caller as any)?.Role ?? '').toLowerCase();
  if (!['plataforma', 'master', 'admin', 'gestor'].includes(role)) return json({ error: 'Sem permissão' }, 403);

  if (!RESEND_API_KEY) return json({ skipped: true, reason: 'RESEND_API_KEY não configurado' });

  let p: any;
  try { p = await req.json(); } catch { return json({ error: 'JSON inválido' }, 400); }
  const { to, nome, titulo, prazo, empresa } = p ?? {};
  if (!to || !titulo) return json({ error: 'Faltam dados (to, titulo)' }, 400);

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; color:#1c1917; max-width:520px; margin:0 auto;">
      <div style="background:#8B1B1F; color:#fff; padding:20px 24px; border-radius:12px 12px 0 0;">
        <h1 style="margin:0; font-size:20px;">Nova obrigação atribuída</h1>
      </div>
      <div style="border:1px solid #e7e5e4; border-top:0; border-radius:0 0 12px 12px; padding:24px;">
        <p style="margin:0 0 12px;">Olá${nome ? ', ' + esc(nome) : ''},</p>
        <p style="margin:0 0 16px;">Você recebeu uma nova obrigação${empresa ? ' em <strong>' + esc(empresa) + '</strong>' : ''}:</p>
        <div style="background:#faf9f8; border:1px solid #e7e5e4; border-radius:10px; padding:16px; margin-bottom:16px;">
          <p style="margin:0; font-size:16px; font-weight:600;">${esc(titulo)}</p>
          ${prazo ? `<p style="margin:8px 0 0; color:#78716c; font-size:14px;">Prazo: ${fmtData(prazo)}</p>` : ''}
        </div>
        <p style="margin:0; color:#78716c; font-size:14px;">Acesse o Checklist Diário para concluir e ganhar seus pontos.</p>
      </div>
    </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: RESEND_FROM, to: [to], subject: `Nova obrigação: ${titulo}`, html }),
  });
  if (!r.ok) {
    const err = await r.text();
    return json({ error: 'Falha no envio', detalhe: err }, 502);
  }
  return json({ ok: true });
});
