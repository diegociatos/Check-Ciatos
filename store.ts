
import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Task, ScoreLedger, UserRole, TaskStatus, UserStatus, TaskPriority, ConferenciaStatus, ScoreType, UserCredentials, TaskTemplate, RecurrenceType } from './types';
import { api } from './services/api';

const getLocalTodayStr = () => {
  const now = new Date();
  return now.toLocaleDateString('en-CA');
};

export const useStore = () => {
  const [baseUsers, setBaseUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [ledger, setLedger] = useState<ScoreLedger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('ciatos_current_user');
  });

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setSyncError(null);
        
        const [usersData, tasksData, templatesData, ledgerData] = await Promise.all([
          api.auth.getUsers(),
          api.tasks.getAll(),
          api.templates.getAll(),
          api.ledger.getAll(),
        ]);

        setBaseUsers(usersData);
        setTasks(tasksData);
        setTemplates(templatesData);
        setLedger(ledgerData);
      } catch (error) {
        console.error('Erro ao carregar dados da API:', error);
        setSyncError('Não foi possível conectar ao servidor. Verifique sua conexão.');
      } finally {
        setIsLoading(false);
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

  // Persist current user to localStorage only
  useEffect(() => {
    if (currentUserEmail) localStorage.setItem('ciatos_current_user', currentUserEmail);
    else localStorage.removeItem('ciatos_current_user');
  }, [currentUserEmail]);

  // Auth Functions - using API
  const login = useCallback(async (email: string, senha?: string) => {
    try {
      const user = await api.auth.login(email, senha || '');
      setBaseUsers(prev => prev.map(u => 
        u.Email.toLowerCase() === email.toLowerCase() 
          ? { ...u, ...user, TentativasFalhadas: 0, UltimoAcesso: new Date().toISOString() } 
          : u
      ));
      setCurrentUserEmail(user.Email);
      return user;
    } catch (error: any) {
      // Reload users to get updated attempt counts
      const usersData = await api.auth.getUsers().catch(() => baseUsers);
      setBaseUsers(usersData);
      throw error;
    }
  }, [baseUsers]);

  const logout = useCallback(() => setCurrentUserEmail(null), []);

  const changePassword = useCallback(async (email: string, oldPass: string, newPass: string) => {
    await api.auth.changePassword(email, oldPass, newPass);
    setBaseUsers(prev => prev.map(u => 
      u.Email === email ? { ...u, SenhaProvisoria: false } : u
    ));
  }, []);

  const resetUserPassword = useCallback(async (email: string) => {
    const result = await api.auth.resetPassword(email);
    setBaseUsers(prev => prev.map(u => 
      u.Email === email 
        ? { ...u, SenhaProvisoria: true, Status: UserStatus.ATIVO, TentativasFalhadas: 0 } 
        : u
    ));
    alert(`Senha resetada para ${email}.\nNova senha provisória: ${result.senhaProvisoria}\nO usuário deverá alterá-la no primeiro acesso.`);
  }, []);

  const toggleUserStatus = useCallback(async (email: string) => {
    const result = await api.auth.toggleStatus(email);
    setBaseUsers(prev => prev.map(u => 
      u.Email === email ? { ...u, Status: result.newStatus as UserStatus } : u
    ));
  }, []);

  const deleteUser = useCallback(async (email: string) => {
    if (!window.confirm(`Deseja realmente deletar o usuário ${email}?`)) return;
    await api.auth.deleteUser(email);
    setBaseUsers(prev => prev.filter(u => u.Email !== email));
  }, []);

  const addUser = useCallback(async (userData: Partial<User>) => {
    const result = await api.auth.createUser({
      Email: userData.Email!,
      Nome: userData.Nome!,
      Role: userData.Role || 'COLABORADOR',
      Time: userData.Time!,
      Gestor: userData.Gestor,
    });
    
    const newUser: User = {
      ...result,
      Status: UserStatus.ATIVO,
      TentativasFalhadas: 0,
    };
    
    setBaseUsers(prev => [...prev, newUser]);
    alert(`Usuário criado com sucesso!\nE-mail: ${result.Email}\nSenha provisória: ${result.senhaProvisoria || '123456'}`);
  }, []);

  const updateUser = useCallback(async (email: string, updatedData: Partial<User>) => {
    await api.auth.updateUser(email, updatedData);
    setBaseUsers(prev => prev.map(u => u.Email === email ? { ...u, ...updatedData } : u));
  }, []);

  const updateProfile = useCallback(async (updatedData: Partial<User>) => {
    if (!currentUserEmail) return;
    await api.auth.updateUser(currentUserEmail, updatedData);
    setBaseUsers(prev => prev.map(u => u.Email === currentUserEmail ? { ...u, ...updatedData } : u));
  }, [currentUserEmail]);

  // Task Functions - using API
  const completeTask = useCallback(async (taskId: string, note: string, proof?: string) => {
    await api.tasks.complete(taskId, note, proof);
    setTasks(prev => prev.map(t => (t.ID === taskId ? { ...t, Status: TaskStatus.CONCLUIDO, DataConclusao: new Date().toISOString(), CompletionNote: note, ProofAttachment: proof } : t)));
  }, []);

  const auditTask = useCallback(async (taskId: string, status: ConferenciaStatus, observation: string) => {
    const result = await api.tasks.audit(taskId, status, observation);
    
    setTasks(prev => prev.map(t => {
      if (t.ID === taskId) {
        return { ...t, Status: TaskStatus.CONFERIDO, ConferenciaStatus: status, ObservacaoGestor: observation };
      }
      return t;
    }));
    
    // Reload ledger to get updated scores
    const ledgerData = await api.ledger.getAll();
    setLedger(ledgerData);
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.")) return;
    await api.tasks.delete(taskId);
    setTasks(prev => prev.filter(t => t.ID !== taskId));
    alert("Tarefa excluída com sucesso.");
  }, []);

  // Template Functions - using API
  const addTemplate = useCallback(async (templateData: Omit<TaskTemplate, 'ID'>) => {
    const result = await api.templates.create({
      Titulo: templateData.Titulo,
      Descricao: templateData.Descricao,
      Responsavel: templateData.Responsavel,
      PontosValor: templateData.PontosValor,
      Prioridade: templateData.Prioridade,
      Recorrencia: templateData.Recorrencia,
      DiasRecorrencia: templateData.DiasRecorrencia,
      TimeResponsavel: templateData.TimeResponsavel,
      DiaFixo: templateData.DiaFixo,
    });
    setTemplates(prev => [...prev, result]);
  }, []);

  const toggleTemplate = useCallback(async (id: string) => {
    const template = templates.find(t => t.ID === id);
    if (!template) return;
    await api.templates.update(id, { Ativo: !template.Ativa });
    setTemplates(prev => prev.map(t => t.ID === id ? { ...t, Ativa: !t.Ativa } : t));
  }, [templates]);

  const deleteTemplate = useCallback(async (id: string) => {
    await api.templates.delete(id);
    setTemplates(prev => prev.filter(t => t.ID !== id));
  }, []);

  const generateTaskFromTemplate = useCallback(async (templateId: string, force: boolean = false) => {
    const tmpl = templates.find(t => t.ID === templateId);
    if (!tmpl) return false;

    const todayStr = getLocalTodayStr();
    const alreadyExists = tasks.some(t => 
      t.Titulo === tmpl.Titulo && 
      t.Responsavel === tmpl.Responsavel &&
      new Date(t.DataLimite).toLocaleDateString('en-CA') === todayStr
    );

    if (alreadyExists && !force) {
      return { duplicate: true, template: tmpl };
    }

    try {
      const result = await api.templates.generate(templateId);
      setTasks(prev => [...prev, result]);
      setTemplates(prev => prev.map(t => t.ID === templateId ? { ...t, UltimaExecucao: new Date().toISOString() } : t));
      alert(`Tarefa "${tmpl.Titulo}" gerada com sucesso.`);
      return true;
    } catch (error) {
      console.error('Erro ao gerar tarefa:', error);
      return false;
    }
  }, [templates, tasks]);

  // Reload data function
  const reloadData = useCallback(async () => {
    try {
      const [usersData, tasksData, templatesData, ledgerData] = await Promise.all([
        api.auth.getUsers(),
        api.tasks.getAll(),
        api.templates.getAll(),
        api.ledger.getAll(),
      ]);

      setBaseUsers(usersData);
      setTasks(tasksData);
      setTemplates(templatesData);
      setLedger(ledgerData);
    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
    }
  }, []);

  return { 
    currentUser, users, tasks, templates, ledger, minhasTarefas, isLoading, syncError,
    login, logout, changePassword, resetUserPassword, toggleUserStatus, deleteUser, addUser, updateUser,
    updateProfile, completeTask, auditTask, deleteTask,
    addTemplate, toggleTemplate, deleteTemplate, generateTaskFromTemplate, reloadData
  };
};
