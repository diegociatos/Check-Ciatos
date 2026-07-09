// Edge Function: admin-users
// Operações privilegiadas de usuários (criar/editar/reset/bloquear/excluir) com service role.
// Autoriza pelo JWT do chamador: precisa ser Admin ou Gestor.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Senha ALEATÓRIA e forte para a conta recém-criada. O usuário NUNCA a usa — ele
// define a própria senha pelo link de convite. Nada previsível/hardcoded (req. de segurança).
function senhaAleatoria(): string {
  const b = new Uint8Array(24);
  crypto.getRandomValues(b);
  const base = btoa(String.fromCharCode(...b)).replace(/[^a-zA-Z0-9]/g, '');
  return `${base}Aa1!`; // garante maiúscula, minúscula, número e símbolo
}

// Link seguro de convite/definição de senha. O Supabase gera um token com expiração
// nativa. Sem redirect_to explícito => usa a Site URL do projeto (já configurada).
async function gerarLinkConvite(admin: any, email: string): Promise<string | null> {
  try {
    const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email });
    if (error) return null;
    return (data as any)?.properties?.action_link ?? null;
  } catch { return null; }
}

// Envia o convite por e-mail (Resend). Retorna true se o Resend aceitou o envio.
async function enviarEmailConvite(email: string, nome: string | undefined, link: string): Promise<boolean> {
  const key = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('RESEND_FROM') || 'Check-Ciatos <onboarding@resend.dev>';
  if (!key || !link) return false;
  const nomeSeguro = String(nome ?? '').replace(/[<>&]/g, '');
  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; color:#1c1917; max-width:520px; margin:0 auto;">
      <div style="background:#8B1B1F; color:#fff; padding:20px 24px; border-radius:12px 12px 0 0;">
        <h1 style="margin:0; font-size:20px;">Bem-vindo ao Checklist Diário</h1>
      </div>
      <div style="border:1px solid #e7e5e4; border-top:0; border-radius:0 0 12px 12px; padding:24px;">
        <p style="margin:0 0 12px;">Olá${nomeSeguro ? ', ' + nomeSeguro : ''},</p>
        <p style="margin:0 0 16px;">Sua conta foi criada. Clique no botão abaixo para <strong>definir sua senha</strong> e acessar. O link é pessoal e expira.</p>
        <p style="margin:0 0 20px;"><a href="${link}" style="background:#8B1B1F; color:#fff; text-decoration:none; padding:12px 20px; border-radius:10px; font-weight:600; display:inline-block;">Definir minha senha</a></p>
        <p style="margin:0; color:#78716c; font-size:13px;">Se você não esperava este convite, ignore este e-mail.</p>
      </div>
    </div>`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [email], subject: 'Convite — defina sua senha no Checklist Diário', html }),
    });
    return r.ok;
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const authHeader = req.headers.get('Authorization') ?? '';

  // Cliente "como o chamador" para descobrir quem é e qual o papel
  const asCaller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: me } = await asCaller.auth.getUser();
  if (!me?.user?.email) return json({ error: 'Não autenticado' }, 401);

  const admin = createClient(url, service);
  const { data: caller } = await admin.from('users').select('"Role", empresa_id').ilike('Email', me.user.email).maybeSingle();
  const role = String((caller as any)?.Role ?? '').toLowerCase();
  const callerEmpresa = (caller as any)?.empresa_id ?? null;
  const isPlataforma = role === 'plataforma';
  if (!['plataforma', 'master', 'admin', 'gestor'].includes(role)) return json({ error: 'Sem permissão' }, 403);

  // Empresas que o chamador pode administrar (empresa-casa + vínculos)
  const { data: vinc } = await admin.from('user_empresas').select('empresa_id').ilike('email', me.user.email);
  const acessoSet = new Set<string>([callerEmpresa, ...((vinc as any[]) ?? []).map(v => v.empresa_id)].filter(Boolean));
  const podeEmpresa = (emp?: string | null) => isPlataforma || (!!emp && acessoSet.has(emp));

  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: 'JSON inválido' }, 400); }
  const { action, email, user } = payload ?? {};

  // Fora a plataforma, ações sobre um usuário existente só valem dentro da própria empresa.
  if (!isPlataforma && ['update', 'reset-password', 'toggle-status', 'delete', 'change-email'].includes(action)) {
    const { data: alvo } = await admin.from('users').select('empresa_id').ilike('Email', email).maybeSingle();
    if (!alvo || (alvo as any).empresa_id !== callerEmpresa) {
      return json({ error: 'Usuário de outra empresa' }, 403);
    }
  }

  try {
    if (action === 'create') {
      // Reforço no servidor: gestor só cadastra COLABORADOR (não pode criar admin/master).
      const papelSolicitado = String(user.Role ?? 'Colaborador').toLowerCase();
      if (role === 'gestor' && papelSolicitado !== 'colaborador') {
        return json({ error: 'Gestor só pode cadastrar colaboradores' }, 403);
      }

      // Usa a empresa indicada (empresa ativa) se o chamador tiver acesso; senão a empresa-casa.
      const empresaAlvo = (user.empresa_id && podeEmpresa(user.empresa_id)) ? user.empresa_id : callerEmpresa;
      if (!podeEmpresa(empresaAlvo)) return json({ error: 'Sem acesso a esta empresa' }, 403);

      // Idempotente: se o e-mail já existe (ex.: mesmo master em outro cliente),
      // não recria — apenas adiciona o vínculo com a nova empresa.
      const { data: existente } = await admin.from('users').select('*').ilike('Email', user.Email).maybeSingle();
      if (existente) {
        await admin.from('user_empresas').upsert(
          { email: user.Email, empresa_id: empresaAlvo, papel: (user.Role ?? (existente as any).Role) },
          { onConflict: 'email,empresa_id' }
        );
        return json({ user: existente, tempPassword: null, vinculado: true });
      }

      // Conta criada com senha ALEATÓRIA (o usuário definirá a dele pelo convite).
      const { data: created, error: e1 } = await admin.auth.admin.createUser({
        email: user.Email, password: senhaAleatoria(), email_confirm: true,
      });
      if (e1) throw e1;
      const row = {
        Email: user.Email, Nome: user.Nome, Role: user.Role ?? 'Colaborador',
        Status: 'Ativo', Time: user.Time ?? null, Gestor: user.Gestor ?? null,
        SenhaProvisoria: true, user_id: created.user?.id, empresa_id: empresaAlvo,
      };
      const { data: inserted, error: e2 } = await admin.from('users').insert(row).select().single();
      if (e2) throw e2;
      await admin.from('user_empresas').upsert(
        { email: user.Email, empresa_id: empresaAlvo, papel: user.Role ?? 'Colaborador' },
        { onConflict: 'email,empresa_id' }
      );
      // Convite seguro: link com expiração enviado por e-mail. Se o e-mail falhar,
      // devolve o link ao admin (fallback) para nenhum usuário ficar sem acesso.
      const link = await gerarLinkConvite(admin, user.Email);
      const enviado = link ? await enviarEmailConvite(user.Email, user.Nome, link) : false;
      return json({ user: inserted, invited: enviado, inviteLink: enviado ? null : link });
    }

    // Define exatamente quais empresas (entre as que o chamador administra) um usuário acessa.
    // Usado pelo Master para conceder ao gestor acesso às suas empresas.
    if (action === 'set-empresas') {
      const alvo: string[] = (payload.empresas ?? []).filter((e: string) => podeEmpresa(e));
      const administraveis = [...acessoSet];
      // remove vínculos do usuário só entre as empresas que o chamador administra
      if (administraveis.length) {
        await admin.from('user_empresas').delete().ilike('email', email).in('empresa_id', administraveis);
      }
      if (alvo.length) {
        await admin.from('user_empresas').upsert(
          alvo.map(e => ({ email, empresa_id: e, papel: 'gestor' })), { onConflict: 'email,empresa_id' }
        );
      }
      return json({ message: 'Acessos atualizados', empresas: alvo });
    }

    if (action === 'update') {
      const { data: updated, error } = await admin.from('users').update(user).ilike('Email', email).select().single();
      if (error) throw error;
      return json({ user: updated });
    }

    if (action === 'reset-password') {
      const { data: row } = await admin.from('users').select('user_id, "Nome"').ilike('Email', email).maybeSingle();
      // Invalida a senha atual com uma aleatória e envia um novo link de definição de senha.
      if ((row as any)?.user_id) {
        const { error } = await admin.auth.admin.updateUserById((row as any).user_id, { password: senhaAleatoria() });
        if (error) throw error;
      }
      await admin.from('users').update({ SenhaProvisoria: true, Status: 'Ativo', TentativasFalhadas: 0 })
        .ilike('Email', email);
      const link = await gerarLinkConvite(admin, email);
      const enviado = link ? await enviarEmailConvite(email, (row as any)?.Nome, link) : false;
      return json({ message: enviado ? 'Convite de nova senha enviado por e-mail' : 'Senha redefinida — envie o link ao usuário', invited: enviado, inviteLink: enviado ? null : link });
    }

    if (action === 'toggle-status') {
      const { data: row } = await admin.from('users').select('"Status"').ilike('Email', email).maybeSingle();
      const novo = (row as any)?.Status === 'Ativo' ? 'Inativo' : 'Ativo';
      await admin.from('users').update({ Status: novo }).ilike('Email', email);
      return json({ message: `Status alterado para ${novo}`, status: novo });
    }

    if (action === 'change-email') {
      const novoEmail = String(payload.novoEmail ?? '').trim().toLowerCase();
      if (!novoEmail || !novoEmail.includes('@')) return json({ error: 'E-mail inválido' }, 400);
      if (novoEmail === String(email).trim().toLowerCase()) return json({ error: 'O novo e-mail é igual ao atual' }, 400);

      const { data: alvo } = await admin.from('users').select('user_id').ilike('Email', email).maybeSingle();
      if (!alvo) return json({ error: 'Usuário não encontrado' }, 404);

      const { data: jaExiste } = await admin.from('users').select('Email').ilike('Email', novoEmail).maybeSingle();
      if (jaExiste) return json({ error: 'Este e-mail já está em uso' }, 400);

      const userId = (alvo as any).user_id;
      // 1) Auth (login). 2) Banco (transacional). Se o banco falhar, reverte o Auth.
      if (userId) {
        const { error: eAuth } = await admin.auth.admin.updateUserById(userId, { email: novoEmail, email_confirm: true });
        if (eAuth) throw eAuth;
      }
      const { error: eRpc } = await admin.rpc('renomear_email', { p_old: email, p_new: novoEmail });
      if (eRpc) {
        if (userId) await admin.auth.admin.updateUserById(userId, { email }).catch(() => {});
        throw eRpc;
      }
      return json({ message: 'E-mail alterado', email: novoEmail });
    }

    if (action === 'delete') {
      const { data: row } = await admin.from('users').select('user_id').ilike('Email', email).maybeSingle();
      await admin.from('users').delete().ilike('Email', email);
      if ((row as any)?.user_id) await admin.auth.admin.deleteUser((row as any).user_id);
      return json({ message: 'Usuário excluído' });
    }

    // Excluir uma empresa inteira (só plataforma): apaga dados, remove usuários
    // exclusivos dela e desvincula os multi-empresa. Nunca apaga a plataforma.
    if (action === 'delete-empresa') {
      if (!isPlataforma) return json({ error: 'Apenas a plataforma pode excluir empresas' }, 403);
      const empId = payload.empresa_id;
      if (!empId) return json({ error: 'Empresa não informada' }, 400);

      await admin.from('tasks').delete().eq('empresa_id', empId);
      await admin.from('task_templates').delete().eq('empresa_id', empId);
      await admin.from('score_ledger').delete().eq('empresa_id', empId);

      const { data: membros } = await admin.from('users').select('Email, user_id, "Role"').eq('empresa_id', empId);
      for (const u of (membros as any[]) ?? []) {
        if (String(u.Role).toLowerCase() === 'plataforma') {
          // Nunca apaga a plataforma; só solta o vínculo de empresa-casa.
          await admin.from('users').update({ empresa_id: null }).ilike('Email', u.Email);
          continue;
        }
        const { data: outros } = await admin.from('user_empresas')
          .select('empresa_id').ilike('email', u.Email).neq('empresa_id', empId);
        const outras = ((outros as any[]) ?? []).map(o => o.empresa_id);
        if (outras.length > 0) {
          await admin.from('users').update({ empresa_id: outras[0] }).ilike('Email', u.Email);
        } else {
          await admin.from('users').delete().ilike('Email', u.Email);
          if (u.user_id) await admin.auth.admin.deleteUser(u.user_id).catch(() => {});
        }
      }
      await admin.from('user_empresas').delete().eq('empresa_id', empId);
      const { error: de } = await admin.from('empresas').delete().eq('id', empId);
      if (de) throw de;
      return json({ message: 'Empresa excluída' });
    }

    return json({ error: 'Ação desconhecida' }, 400);
  } catch (err) {
    return json({ error: (err as Error).message || 'Erro ao processar' }, 400);
  }
});
