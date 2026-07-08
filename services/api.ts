// API Service para Check-Ciatos — agora falando direto com o Supabase (Postgres + Auth + RLS).
// Mantém a mesma "cara" de antes (authApi/tasksApi/templatesApi/ledgerApi) para o store.ts
// continuar chamando igual. A lógica de servidor vive em RPCs (SECURITY DEFINER) e numa
// Edge Function de administração de usuários.
import { supabase } from '../lib/supabase';

function throwSb(error: { message: string } | null, fallback = 'Erro inesperado'): never {
  throw new Error(error?.message || fallback);
}

async function sessionEmail(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

// ==================== AUTH ====================
export const authApi = {
  login: async (email: string, senha: string) => {
    const { data: auth, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error || !auth.user) throw new Error('E-mail ou senha inválidos');

    const { data: row, error: e2 } = await supabase
      .from('users').select('*').ilike('Email', email).maybeSingle();
    if (e2) throwSb(e2);
    if (!row) {
      await supabase.auth.signOut();
      throw new Error('Usuário sem cadastro de perfil. Fale com o administrador.');
    }
    if (row.Status === 'Bloqueado' || row.Status === 'Inativo') {
      await supabase.auth.signOut();
      throw new Error('Acesso bloqueado. Fale com o administrador.');
    }
    // Empresa suspensa bloqueia o acesso (exceto a plataforma)
    if (String(row.Role || '').toLowerCase() !== 'plataforma') {
      const { data: emps } = await supabase.from('empresas').select('Status');
      const temAtiva = (emps ?? []).some((e: any) => (e.Status || 'Ativa') !== 'Suspensa');
      if ((emps?.length ?? 0) > 0 && !temAtiva) {
        await supabase.auth.signOut();
        throw new Error('Sua empresa está suspensa. Fale com o suporte.');
      }
    }
    // registra último acesso (permitido pela RLS self-update)
    await supabase.from('users').update({ UltimoAcesso: new Date().toISOString() }).eq('Email', row.Email);
    return row;
  },

  changePassword: async (email: string, senhaAtual: string, novaSenha: string) => {
    // confirma a senha atual re-autenticando
    const { error: e1 } = await supabase.auth.signInWithPassword({ email, password: senhaAtual });
    if (e1) throw new Error('Senha atual incorreta');
    const { error: e2 } = await supabase.auth.updateUser({ password: novaSenha });
    if (e2) throwSb(e2, 'Não foi possível alterar a senha');
    await supabase.rpc('clear_senha_provisoria');
    return { message: 'Senha alterada com sucesso' };
  },

  getUsers: async () => {
    const { data, error } = await supabase.from('users').select('*').order('Nome');
    if (error) throwSb(error);
    return data ?? [];
  },

  createUser: async (userData: any) => {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'create', user: userData },
    });
    if (error) throwSb(error, 'Erro ao criar usuário');
    return data.user;
  },

  updateUser: async (email: string, userData: any) => {
    const me = await sessionEmail();
    // edição do próprio perfil -> direto (RLS self-update); edição de terceiros -> Edge Function (admin)
    if (me && me.toLowerCase() === email.toLowerCase()) {
      const { error } = await supabase.from('users').update(userData).eq('Email', email);
      if (error) throwSb(error);
      return { Email: email, ...userData };
    }
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'update', email, user: userData },
    });
    if (error) throwSb(error, 'Erro ao atualizar usuário');
    return data.user;
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'reset-password', email },
    });
    if (error) throwSb(error, 'Erro ao resetar senha');
    return { message: data?.message || 'Senha resetada' };
  },

  toggleStatus: async (email: string) => {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'toggle-status', email },
    });
    if (error) throwSb(error, 'Erro ao alterar status');
    return { message: data?.message || 'Status alterado' };
  },

  deleteUser: async (email: string) => {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'delete', email },
    });
    if (error) throwSb(error, 'Erro ao excluir usuário');
    return { message: data?.message || 'Usuário excluído' };
  },

  // Define quais empresas (entre as que o chamador administra) um usuário acessa.
  setEmpresas: async (email: string, empresas: string[]) => {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'set-empresas', email, empresas },
    });
    if (error) throwSb(error, 'Erro ao atualizar acessos');
    return data;
  },

  // Empresas vinculadas a um usuário (para pré-marcar na tela)
  getEmpresasDoUsuario: async (email: string) => {
    const { data, error } = await supabase.from('user_empresas').select('empresa_id').ilike('email', email);
    if (error) throwSb(error);
    return (data ?? []).map((r: any) => r.empresa_id);
  },
};

// ==================== TASKS ====================
export const tasksApi = {
  getAll: async () => {
    const { data, error } = await supabase.from('tasks').select('*').order('DataLimite', { ascending: true });
    if (error) throwSb(error);
    return data ?? [];
  },

  create: async (taskData: any) => {
    const { data, error } = await supabase.from('tasks').insert(taskData).select().single();
    if (error) throwSb(error, 'Erro ao criar tarefa');
    return data;
  },

  complete: async (taskId: string, note?: string, proof?: string) => {
    const { error } = await supabase.rpc('complete_task', {
      p_id: taskId, p_note: note ?? null, p_proof: proof ?? null,
    });
    if (error) throwSb(error, 'Erro ao concluir tarefa');
    return { message: 'Tarefa enviada para aprovação' };
  },

  audit: async (taskId: string, status: string, observation: string, novaDataLimite?: string | null) => {
    const { data, error } = await supabase.rpc('audit_task', {
      p_id: taskId, p_status: status, p_obs: observation ?? null,
      p_nova_data_limite: novaDataLimite ?? null,
    });
    if (error) throwSb(error, 'Erro ao auditar tarefa');
    return { message: 'Auditoria registrada', pontos: (data as any)?.pontos ?? 0, dataLimite: (data as any)?.dataLimite };
  },

  delete: async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('ID', taskId);
    if (error) throwSb(error, 'Erro ao excluir tarefa');
    return { message: 'Tarefa excluída' };
  },
};

// ==================== TEMPLATES ====================
export const templatesApi = {
  getAll: async () => {
    const { data, error } = await supabase.from('task_templates').select('*').order('Titulo');
    if (error) throwSb(error);
    return data ?? [];
  },

  create: async (templateData: any) => {
    const { data, error } = await supabase.from('task_templates').insert(templateData).select().single();
    if (error) throwSb(error, 'Erro ao criar modelo');
    return data;
  },

  update: async (templateId: string, templateData: any) => {
    const { data, error } = await supabase.from('task_templates').update(templateData).eq('ID', templateId).select().single();
    if (error) throwSb(error, 'Erro ao salvar modelo');
    return data;
  },

  toggle: async (templateId: string) => {
    const { data, error } = await supabase.rpc('toggle_template', { p_id: templateId });
    if (error) throwSb(error, 'Erro ao alternar modelo');
    return { message: 'Modelo atualizado', ativa: (data as any) as boolean };
  },

  generate: async (templateId: string, force?: boolean) => {
    const { data, error } = await supabase.rpc('generate_from_template', {
      p_template_id: templateId, p_force: !!force,
    });
    if (error) throwSb(error, 'Erro ao gerar tarefa');
    return data; // { task } | { duplicate: true }
  },

  delete: async (templateId: string) => {
    const { error } = await supabase.from('task_templates').delete().eq('ID', templateId);
    if (error) throwSb(error, 'Erro ao excluir modelo');
    return { message: 'Modelo excluído' };
  },
};

// ==================== LEDGER ====================
export const ledgerApi = {
  getAll: async (userEmail?: string) => {
    let q = supabase.from('score_ledger').select('*').order('Data', { ascending: false });
    if (userEmail) q = q.ilike('UserEmail', userEmail);
    const { data, error } = await q;
    if (error) throwSb(error);
    return data ?? [];
  },

  getSummary: async () => {
    const { data, error } = await supabase.from('score_ledger').select('UserEmail, Pontos');
    if (error) throwSb(error);
    const map = new Map<string, number>();
    for (const r of data ?? []) map.set(r.UserEmail, (map.get(r.UserEmail) ?? 0) + (r.Pontos ?? 0));
    return Array.from(map, ([UserEmail, Total]) => ({ UserEmail, Total }));
  },
};

// ==================== EMPRESAS (multi-tenant) ====================
export const empresasApi = {
  getAll: async () => {
    const { data, error } = await supabase.from('empresas').select('*').order('Nome');
    if (error) throwSb(error);
    return data ?? [];
  },

  // Cria a empresa (RPC restrita à plataforma) e retorna { id, Nome }
  create: async (nome: string, plano?: string) => {
    const { data, error } = await supabase.rpc('criar_empresa', { p_nome: nome, p_plano: plano ?? 'Padrao' });
    if (error) throwSb(error, 'Erro ao criar empresa');
    return data as { id: string; Nome: string };
  },

  // Suspender / reativar (plataforma) — bloqueia/desbloqueia o acesso dos usuários da empresa
  setStatus: async (id: string, status: 'Ativa' | 'Suspensa') => {
    const { error } = await supabase.from('empresas').update({ Status: status }).eq('id', id);
    if (error) throwSb(error, 'Erro ao alterar status da empresa');
    return { status };
  },

  // Excluir a empresa inteira (plataforma) — apaga equipe e dados; irreversível
  remove: async (id: string) => {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'delete-empresa', empresa_id: id },
    });
    if (error) throwSb(error, 'Erro ao excluir empresa');
    return data;
  },
};

// ==================== E-MAIL (Resend via Edge Function) ====================
export const emailApi = {
  // Notifica o responsável sobre uma nova obrigação. Nunca bloqueia a criação da tarefa.
  notificarNovaTarefa: async (payload: { to: string; nome?: string; titulo: string; prazo?: string; empresa?: string }) => {
    try {
      await supabase.functions.invoke('notificar-tarefa', { body: payload });
    } catch (e) {
      console.warn('Falha ao notificar por e-mail:', e);
    }
  },
};

export default { auth: authApi, tasks: tasksApi, templates: templatesApi, ledger: ledgerApi, empresas: empresasApi, email: emailApi };
