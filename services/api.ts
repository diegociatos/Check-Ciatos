// ===========================================
// Check-Ciatos - API Service
// ===========================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://195.35.16.198/check-ciatos/api';

// Helper para fazer requests
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(errorData.error || `Erro: ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (email: string, senha: string) => 
    request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    }),

  changePassword: (email: string, senhaAtual: string, novaSenha: string) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ email, senhaAtual, novaSenha }),
    }),

  getUsers: () => request<any[]>('/auth/users'),

  createUser: (userData: {
    Email: string;
    Nome: string;
    Role: string;
    Time: string;
    Gestor?: string;
  }) =>
    request<any>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  updateUser: (email: string, userData: Partial<{
    Nome: string;
    Role: string;
    Time: string;
    Gestor: string;
    Status: string;
  }>) =>
    request<{ message: string }>(`/auth/users/${encodeURIComponent(email)}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  resetPassword: (email: string) =>
    request<{ message: string; senhaProvisoria: string }>(`/auth/users/${encodeURIComponent(email)}/reset-password`, {
      method: 'POST',
    }),

  toggleStatus: (email: string) =>
    request<{ message: string; newStatus: string }>(`/auth/users/${encodeURIComponent(email)}/toggle-status`, {
      method: 'POST',
    }),

  deleteUser: (email: string) =>
    request<{ message: string }>(`/auth/users/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    }),
};

// Tasks API
export const tasksApi = {
  getAll: () => request<any[]>('/tasks'),

  create: (taskData: {
    Titulo: string;
    Descricao?: string;
    Responsavel: string;
    DataLimite: string;
    Prioridade?: string;
    PontosValor?: number;
    TemplateID?: string;
  }) =>
    request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),

  complete: (id: string, note?: string, proof?: string) =>
    request<{ message: string }>(`/tasks/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ note, proof }),
    }),

  audit: (id: string, status: string, observation?: string) =>
    request<{ message: string; pontos: number }>(`/tasks/${id}/audit`, {
      method: 'POST',
      body: JSON.stringify({ status, observation }),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),
};

// Templates API
export const templatesApi = {
  getAll: () => request<any[]>('/templates'),

  create: (templateData: {
    Titulo: string;
    Descricao?: string;
    Responsavel: string;
    PontosValor?: number;
    Prioridade?: string;
    Recorrencia?: string;
    DiasRecorrencia?: number[];
    TimeResponsavel?: string;
    DiaFixo?: number;
  }) =>
    request<any>('/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    }),

  update: (id: string, templateData: Partial<{
    Titulo: string;
    Descricao: string;
    Responsavel: string;
    PontosValor: number;
    Prioridade: string;
    Recorrencia: string;
    DiasRecorrencia: number[];
    TimeResponsavel: string;
    DiaFixo: number;
    Ativo: boolean;
  }>) =>
    request<{ message: string }>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/templates/${id}`, {
      method: 'DELETE',
    }),

  generate: (id: string) =>
    request<any>(`/templates/${id}/generate`, {
      method: 'POST',
    }),
};

// Ledger API
export const ledgerApi = {
  getAll: () => request<any[]>('/ledger'),

  getByUser: (email: string) =>
    request<any[]>(`/ledger/user/${encodeURIComponent(email)}`),

  add: (entry: {
    userEmail: string;
    pontos: number;
    tipo: string;
    descricao: string;
    taskId?: string;
  }) =>
    request<any>('/ledger', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),
};

// Export all
export const api = {
  auth: authApi,
  tasks: tasksApi,
  templates: templatesApi,
  ledger: ledgerApi,
};

export default api;
