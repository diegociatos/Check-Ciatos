import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Task, ScoreLedger, UserRole, TaskStatus, UserStatus, TaskPriority, ConferenciaStatus, ScoreType, TaskTemplate, RecurrenceType } from './types';
import { authApi, usersApi, tasksApi, templatesApi, ledgerApi } from './apiService';

const getLocalTodayStr = () => {
  const now = new Date();
  return now.toLocaleDateString('en-CA');
};

export const useStore = () => {
  const [baseUsers, setBaseUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [ledger, setLedger] = useState<ScoreLedger[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('ciatos_current_user');
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados da API ao iniciar
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [usersData, tasksData, templatesData, ledgerData] = await Promise.all([
          usersApi.getAll(),
          tasksApi.getAll(),
          templatesApi.getAll(),
          ledgerApi.getAll()
        ]);
        
        setBaseUsers(usersData);
        setTasks(tasksData);
        setTemplates(templatesData);
        setLedger(ledgerData);
        setError(null);
      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const users = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return baseUsers.map(u => {
      const userTasks = tasks.filter(t => {
        const d = new Date(t.DataLimite);
        return t.Responsavel === u.Email && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const userLedger = ledger.filter(l => {
        const d = new Date(l.Data);
        return l.UserEmail === u.Email && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const pontosRealizadosMes = userLedger.reduce((sum, l) => sum + l.Pontos, 0);
      const pontosPossiveisMes = userTasks.reduce((sum, t) => sum + t.PontosValor, 0);
      const eficienciaMes = pontosPossiveisMes > 0 ? (pontosRealizadosMes / pontosPossiveisMes) * 100 : 0;
      
      const conferidas = userTasks.filter(t => t.Status === TaskStatus.CONFERIDO).length;
      const aprovadas = userTasks.filter(t => t.ConferenciaStatus === ConferenciaStatus.APROVADO).length;
      const confiabilidade = conferidas > 0 ? (aprovadas / conferidas) * 100 : 0;

      const hasOverdue = tasks.some(t => 
        t.Responsavel === u.Email && 
        (t.Status === TaskStatus.ATRASADA || (t.Status === TaskStatus.PENDENTE && new Date(t.DataLimite) < now))
      );

      return {
        ...u,
        PontosRealizadosMes: pontosRealizadosMes,
        PontosPossiveisMes: pontosPossiveisMes,
        EficienciaMes: eficienciaMes,
        ScoreConfiabilidade: confiabilidade,
        TemAtrasos: hasOverdue,
        StatusRH: eficienciaMes >= 90 ? '💰 ELEGÍVEL PARA BÔNUS' : '✅ DESEMPENHO ADEQUADO'
      };
    });
  }, [baseUsers, tasks, ledger]);

  const currentUser = users.find(u => u.Email === currentUserEmail) || null;
  const minhasTarefas = useMemo(() => tasks.filter(t => t.Responsavel === currentUserEmail), [tasks, currentUserEmail]);

  useEffect(() => {
    if (currentUserEmail) localStorage.setItem('ciatos_current_user', currentUserEmail);
    else localStorage.removeItem('ciatos_current_user');
  }, [currentUserEmail]);

  // Auth Functions
  const login = useCallback(async (email: string, senha?: string) => {
    try {
      const user = await authApi.login(email, senha || '');
      setCurrentUserEmail(user.Email);
      
      // Recarregar usuários para pegar o último acesso atualizado
      const usersData = await usersApi.getAll();
      setBaseUsers(usersData);
      
      return user;
    } catch (err: any) {
      throw new Error(err.message);
    }
  }, []);

  const logout = useCallback(() => setCurrentUserEmail(null), []);

  const changePassword = useCallback(async (email: string, oldPass: string, newPass: string) => {
    await authApi.changePassword(email, oldPass, newPass);
    
    // Recarregar usuários
    const usersData = await usersApi.getAll();
    setBaseUsers(usersData);
  }, []);

  const resetUserPassword = useCallback(async (email: string) => {
    const result = await usersApi.resetPassword(email);
    alert(`Senha resetada para ${email}.\nNova senha provisória: ${result.senhaProvisoria}\nO usuário deverá alterá-la no primeiro acesso.`);
    
    // Recarregar usuários
    const usersData = await usersApi.getAll();
    setBaseUsers(usersData);
  }, []);

  const toggleUserStatus = useCallback(async (email: string) => {
    await usersApi.toggleStatus(email);
    
    // Recarregar usuários
    const usersData = await usersApi.getAll();
    setBaseUsers(usersData);
  }, []);

  const deleteUser = useCallback(async (email: string) => {
    if (!window.confirm(`Deseja realmente deletar o usuário ${email}?`)) return;
    
    await usersApi.delete(email);
    
    // Recarregar usuários
    const usersData = await usersApi.getAll();
    setBaseUsers(usersData);
  }, []);

  const addUser = useCallback(async (userData: Partial<User>) => {
    const result = await usersApi.create(userData);
    alert(`Boas vindas enviado para ${result.Email}.\nSenha Provisória: ${result.senhaProvisoria}`);
    
    // Recarregar usuários
    const usersData = await usersApi.getAll();
    setBaseUsers(usersData);
  }, []);

  const updateUser = useCallback(async (email: string, updatedData: Partial<User>) => {
    await usersApi.update(email, updatedData);
    
    // Recarregar usuários
    const usersData = await usersApi.getAll();
    setBaseUsers(usersData);
  }, []);

  const updateProfile = useCallback(async (updatedData: Partial<User>) => {
    if (!currentUserEmail) return;
    
    await usersApi.update(currentUserEmail, updatedData);
    
    // Recarregar usuários
    const usersData = await usersApi.getAll();
    setBaseUsers(usersData);
  }, [currentUserEmail]);

  const completeTask = useCallback(async (taskId: string, note: string, proof?: string) => {
    await tasksApi.complete(taskId, note, proof);
    
    // Recarregar tarefas
    const tasksData = await tasksApi.getAll();
    setTasks(tasksData);
  }, []);

  const auditTask = useCallback(async (taskId: string, status: ConferenciaStatus, observation: string) => {
    await tasksApi.audit(taskId, status, observation);
    
    // Recarregar tarefas e ledger
    const [tasksData, ledgerData] = await Promise.all([
      tasksApi.getAll(),
      ledgerApi.getAll()
    ]);
    setTasks(tasksData);
    setLedger(ledgerData);
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.")) return;
    
    await tasksApi.delete(taskId);
    alert("Tarefa excluída com sucesso.");
    
    // Recarregar tarefas
    const tasksData = await tasksApi.getAll();
    setTasks(tasksData);
  }, []);

  const addTemplate = useCallback(async (templateData: Omit<TaskTemplate, 'ID'>) => {
    await templatesApi.create(templateData);
    
    // Recarregar templates
    const templatesData = await templatesApi.getAll();
    setTemplates(templatesData);
  }, []);

  const toggleTemplate = useCallback(async (id: string) => {
    await templatesApi.toggle(id);
    
    // Recarregar templates
    const templatesData = await templatesApi.getAll();
    setTemplates(templatesData);
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    await templatesApi.delete(id);
    
    // Recarregar templates
    const templatesData = await templatesApi.getAll();
    setTemplates(templatesData);
  }, []);

  const generateTaskFromTemplate = useCallback(async (templateId: string, force: boolean = false) => {
    try {
      const result = await templatesApi.generate(templateId, force);
      
      if (result.duplicate) {
        return { duplicate: true, template: result.template };
      }
      
      alert(result.message);
      
      // Recarregar tarefas e templates
      const [tasksData, templatesData] = await Promise.all([
        tasksApi.getAll(),
        templatesApi.getAll()
      ]);
      setTasks(tasksData);
      setTemplates(templatesData);
      
      return true;
    } catch (err: any) {
      if (err.message.includes('duplicate')) {
        return { duplicate: true };
      }
      throw err;
    }
  }, []);

  return { 
    currentUser, users, tasks, templates, ledger, minhasTarefas, loading, error,
    login, logout, changePassword, resetUserPassword, toggleUserStatus, deleteUser, addUser, updateUser,
    updateProfile, completeTask, auditTask, deleteTask,
    addTemplate, toggleTemplate, deleteTemplate, generateTaskFromTemplate 
  };
};
