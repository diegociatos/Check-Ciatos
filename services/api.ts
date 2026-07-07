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

  audit: async (taskId: string, status: string, observation: string) => {
    const { data, error } = await supabase.rpc('audit_task', {
      p_id: taskId, p_status: status, p_obs: observation ?? null,
    });
    if (error) throwSb(error, 'Erro ao auditar tarefa');
    return { message: 'Auditoria registrada', pontos: (data as any)?.pontos ?? 0 };
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

export default { auth: authApi, tasks: tasksApi, templates: templatesApi, ledger: ledgerApi };
