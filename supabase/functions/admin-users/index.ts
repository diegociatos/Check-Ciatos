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
  if (!isPlataforma && ['update', 'reset-password', 'toggle-status', 'delete'].includes(action)) {
    const { data: alvo } = await admin.from('users').select('empresa_id').ilike('Email', email).maybeSingle();
    if (!alvo || (alvo as any).empresa_id !== callerEmpresa) {
      return json({ error: 'Usuário de outra empresa' }, 403);
    }
  }

  try {
    if (action === 'create') {
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

      const pass = SENHA_PROVISORIA;
      const { data: created, error: e1 } = await admin.auth.admin.createUser({
        email: user.Email, password: pass, email_confirm: true,
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
      return json({ user: inserted, tempPassword: pass });
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
