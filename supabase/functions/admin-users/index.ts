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

// Senha provisória FIXA, igual ao design original do app (a tela promete "123456"
// e o usuário deve trocá-la no primeiro acesso). SenhaProvisoria=true marca a troca.
const SENHA_PROVISORIA = '123456';

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
  const role = (caller as any)?.Role;
  const callerEmpresa = (caller as any)?.empresa_id ?? null;
  const isPlataforma = role === 'plataforma';
  const GESTAO = ['plataforma', 'master', 'Admin', 'Gestor'];
  if (!GESTAO.includes(role)) return json({ error: 'Sem permissão' }, 403);

  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: 'JSON inválido' }, 400); }
  const { action, email, user } = payload ?? {};

  // Fora a plataforma, ações sobre um usuário existente só valem dentro da própria empresa.
  if (!isPlataforma && ['update', 'reset-password', 'toggle-status', 'delete'].includes(action)) {
    const { data: alvo } = await admin.from('users').select('empresa_id').ilike('Email', email).maybeSingle();
    if (!alvo || (alvo as any).empresa_id !== callerEmpresa) {
      return json({ error: 'Usuário de outra empresa' }, 403);
    }
  }

  try {
    if (action === 'create') {
      const pass = SENHA_PROVISORIA;
      const { data: created, error: e1 } = await admin.auth.admin.createUser({
        email: user.Email, password: pass, email_confirm: true,
      });
      if (e1) throw e1;
      // A empresa do novo usuário: a plataforma pode indicar (criar master de outra
      // empresa); os demais criam sempre dentro da própria empresa.
      const empresaAlvo = isPlataforma ? (user.empresa_id ?? callerEmpresa) : callerEmpresa;
      const row = {
        Email: user.Email, Nome: user.Nome, Role: user.Role ?? 'Colaborador',
        Status: 'Ativo', Time: user.Time ?? null, Gestor: user.Gestor ?? null,
        SenhaProvisoria: true, user_id: created.user?.id, empresa_id: empresaAlvo,
      };
      const { data: inserted, error: e2 } = await admin.from('users').insert(row).select().single();
      if (e2) throw e2;
      return json({ user: inserted, tempPassword: pass });
    }

    if (action === 'update') {
      const { data: updated, error } = await admin.from('users').update(user).ilike('Email', email).select().single();
      if (error) throw error;
      return json({ user: updated });
    }

    if (action === 'reset-password') {
      const { data: row } = await admin.from('users').select('user_id').ilike('Email', email).maybeSingle();
      const pass = SENHA_PROVISORIA;
      if ((row as any)?.user_id) {
        const { error } = await admin.auth.admin.updateUserById((row as any).user_id, { password: pass });
        if (error) throw error;
      }
      await admin.from('users').update({ SenhaProvisoria: true, Status: 'Ativo', TentativasFalhadas: 0 })
        .ilike('Email', email);
      return json({ message: 'Senha resetada', tempPassword: pass });
    }

    if (action === 'toggle-status') {
      const { data: row } = await admin.from('users').select('"Status"').ilike('Email', email).maybeSingle();
      const novo = (row as any)?.Status === 'Ativo' ? 'Inativo' : 'Ativo';
      await admin.from('users').update({ Status: novo }).ilike('Email', email);
      return json({ message: `Status alterado para ${novo}`, status: novo });
    }

    if (action === 'delete') {
      const { data: row } = await admin.from('users').select('user_id').ilike('Email', email).maybeSingle();
      await admin.from('users').delete().ilike('Email', email);
      if ((row as any)?.user_id) await admin.auth.admin.deleteUser((row as any).user_id);
      return json({ message: 'Usuário excluído' });
    }

    return json({ error: 'Ação desconhecida' }, 400);
  } catch (err) {
    return json({ error: (err as Error).message || 'Erro ao processar' }, 400);
  }
});
