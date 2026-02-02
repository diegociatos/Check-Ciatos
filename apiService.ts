// API Service para Check-Ciatos
const API_URL = 'http://195.35.16.198/check-ciatos/api';

// Helper para fazer requests
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }
  
  return data;
}

// Auth API
export const authApi = {
  login: (email: string, senha: string) => 
    request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    }),
  
  changePassword: (email: string, senhaAtual: string, novaSenha: string) =>
    request<any>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ email, senhaAtual, novaSenha }),
    }),
};

// Users API
export const usersApi = {
  getAll: () => request<any[]>('/auth/users'),
  
  create: (userData: any) =>
    request<any>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  update: (email: string, data: any) =>
    request<any>(`/auth/users/${encodeURIComponent(email)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (email: string) =>
    request<any>(`/auth/users/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    }),
  
  resetPassword: (email: string) =>
    request<any>(`/auth/users/${encodeURIComponent(email)}/reset-password`, {
      method: 'POST',
    }),
  
  toggleStatus: (email: string) =>
    request<any>(`/auth/users/${encodeURIComponent(email)}/toggle-status`, {
      method: 'POST',
    }),
};

// Tasks API
export const tasksApi = {
  getAll: () => request<any[]>('/tasks'),
  
  create: (taskData: any) =>
    request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),
  
  complete: (id: string, note: string, proof?: string) =>
    request<any>(`/tasks/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ note, proof }),
    }),
  
  audit: (id: string, status: string, observation: string) =>
    request<any>(`/tasks/${id}/audit`, {
      method: 'POST',
      body: JSON.stringify({ status, observation }),
    }),
  
  delete: (id: string) =>
    request<any>(`/tasks/${id}`, {
      method: 'DELETE',
    }),
};

// Templates API
export const templatesApi = {
  getAll: () => request<any[]>('/templates'),
  
  create: (templateData: any) =>
    request<any>('/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    }),
  
  toggle: (id: string) =>
    request<any>(`/templates/${id}/toggle`, {
      method: 'POST',
    }),
  
  generate: (id: string, force: boolean = false) =>
    request<any>(`/templates/${id}/generate`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    }),
  
  delete: (id: string) =>
    request<any>(`/templates/${id}`, {
      method: 'DELETE',
    }),
};

// Ledger API
export const ledgerApi = {
  getAll: (userEmail?: string) => 
    request<any[]>(`/ledger${userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : ''}`),
  
  getSummary: () => request<any[]>('/ledger/summary'),
};
