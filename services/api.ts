// API Service para Check-Ciatos
const API_URL = import.meta.env.VITE_API_URL || 'https://app.planejarpatrimonio.com.br/check-ciatos/api';

// Helper para fazer requisições
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// ==================== AUTH ====================
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

  createUser: (userData: any) =>
    request<any>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  updateUser: (email: string, userData: any) =>
    request<any>(`/auth/users/${encodeURIComponent(email)}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  resetPassword: (email: string) =>
    request<{ message: string }>(`/auth/users/${encodeURIComponent(email)}/reset-password`, {
      method: 'POST',
    }),

  toggleStatus: (email: string) =>
    request<{ message: string }>(`/auth/users/${encodeURIComponent(email)}/toggle-status`, {
      method: 'POST',
    }),

  deleteUser: (email: string) =>
    request<{ message: string }>(`/auth/users/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    }),
};

// ==================== TASKS ====================
export const tasksApi = {
  getAll: () => request<any[]>('/tasks'),

  create: (taskData: any) =>
    request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),

  complete: (taskId: string, note?: string, proof?: string) =>
    request<{ message: string }>(`/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ note, proof }),
    }),

  audit: (taskId: string, status: string, observation: string) =>
    request<{ message: string; pontos: number }>(`/tasks/${taskId}/audit`, {
      method: 'POST',
      body: JSON.stringify({ status, observation }),
    }),

  delete: (taskId: string) =>
    request<{ message: string }>(`/tasks/${taskId}`, {
      method: 'DELETE',
    }),
};

// ==================== TEMPLATES ====================
export const templatesApi = {
  getAll: () => request<any[]>('/templates'),

  create: (templateData: any) =>
    request<any>('/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    }),

  toggle: (templateId: string) =>
    request<{ message: string; ativa: boolean }>(`/templates/${templateId}/toggle`, {
      method: 'POST',
    }),

  generate: (templateId: string, force?: boolean) =>
    request<any>(`/templates/${templateId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    }),

  delete: (templateId: string) =>
    request<{ message: string }>(`/templates/${templateId}`, {
      method: 'DELETE',
    }),
};

// ==================== LEDGER ====================
export const ledgerApi = {
  getAll: (userEmail?: string) => {
    const params = userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : '';
    return request<any[]>(`/ledger${params}`);
  },

  getSummary: () => request<any[]>('/ledger/summary'),
};

// Export all APIs
export default {
  auth: authApi,
  tasks: tasksApi,
  templates: templatesApi,
  ledger: ledgerApi,
};
