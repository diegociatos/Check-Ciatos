import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Task, ScoreLedger, UserRole, TaskStatus, UserStatus, TaskPriority, ConferenciaStatus, ScoreType, TaskTemplate, RecurrenceType } from './types';
import { authApi, tasksApi, templatesApi, ledgerApi } from './services/api';

const getLocalTodayStr = () => {
  const now = new Date();
  return now.toLocaleDateString('en-CA');
};

// Normaliza Role para o formato do frontend
const normalizeRole = (role: string): UserRole => {
  const upper = role?.toUpperCase();
  if (upper === 'ADMIN') return UserRole.ADMIN;
  if (upper === 'GESTOR') return UserRole.GESTOR;
  return UserRole.COLABORADOR;
};

// Normaliza Status para o formato do frontend
const normalizeUserStatus = (status: string): UserStatus => {
  const upper = status?.toUpperCase();
  if (upper === 'BLOQUEADO') return UserStatus.BLOQUEADO;
  if (upper === 'INATIVO') return UserStatus.INATIVO;
  return UserStatus.ATIVO;
};

// Normaliza TaskStatus
const normalizeTaskStatus = (status: string): TaskStatus => {
  const upper = status?.toUpperCase();
  if (upper === 'AGUARDANDO_APROVACAO' || upper === 'AGUARDANDO APROVAÇÃO') return TaskStatus.AGUARDANDO_APROVACAO;
  if (upper === 'APROVADA') return TaskStatus.APROVADA;
  if (upper === 'FEITA_ERRADA' || upper === 'FEITA ERRADA') return TaskStatus.FEITA_ERRADA;
  if (upper === 'NAO_FEITA' || upper === 'NÃO FEITA' || upper === 'NAO FEITA') return TaskStatus.NAO_FEITA;
  if (upper === 'ATRASADA') return TaskStatus.ATRASADA;
  if (upper === 'CONFERIDO') return TaskStatus.APROVADA; // Legacy
  if (upper === 'CONCLUIDO') return TaskStatus.AGUARDANDO_APROVACAO; // Legacy
  return TaskStatus.PENDENTE;
};

export const useStore = () => {
  const [baseUsers, setBaseUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [ledger, setLedger] = useState<ScoreLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('ciatos_current_user');
  });

  // Carrega dados do backend na inicialização
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Carregar dados em paralelo
        const [usersData, tasksData, templatesData, ledgerData] = await Promise.all([
          authApi.getUsers().catch(() => []),
          tasksApi.getAll().catch(() => []),
          templatesApi.getAll().catch(() => []),
          ledgerApi.getAll().catch(() => []),
        ]);

        // Normalizar usuários
        setBaseUsers(usersData.map((u: any) => ({
          Email: u.Email,
          Nome: u.Nome,
          Role: normalizeRole(u.Role),
          Status: normalizeUserStatus(u.Status),
          Time: u.Time,
          Gestor: u.Gestor,
          SenhaProvisoria: u.SenhaProvisoria,
          DataCriacao: u.DataCriacao,
          UltimoAcesso: u.UltimoAcesso,
          TentativasFalhadas: u.TentativasFalhadas || 0,
        })));

        // Normalizar tarefas
        setTasks(tasksData.map((t: any) => ({
          ID: t.ID,
          TemplateID: t.TemplateID,
          Titulo: t.Titulo,
          Descricao: t.Descricao,
          Responsavel: t.Responsavel,
          DataLimite: t.DataLimite,
          Prioridade: t.Prioridade || TaskPriority.MEDIA,
          PontosValor: t.PontosValor || 10,
          Status: normalizeTaskStatus(t.Status),
          DataConclusao: t.DataConclusao,
          CompletionNote: t.CompletionNote,
          ProofAttachment: t.ProofAttachment,
          ConferenciaStatus: t.ConferenciaStatus,
          ObservacaoGestor: t.ObservacaoGestor,
          Tentativas: t.Tentativas || 0,
        })));

        // Normalizar templates
        setTemplates(templatesData.map((t: any) => ({
          ID: t.ID,
          Titulo: t.Titulo,
          Descricao: t.Descricao,
          Responsavel: t.Responsavel,
          Prioridade: t.Prioridade || TaskPriority.MEDIA,
          PontosValor: t.PontosValor || 10,
          Recorrencia: t.Recorrencia || RecurrenceType.NENHUMA,
          DiasRecorrencia: t.DiasRecorrencia || [],
          DiaDoMes: t.DiaDoMes,
          DataInicio: t.DataInicio,
          Ativa: t.Ativa,
          UltimaExecucao: t.UltimaExecucao,
        })));

        // Normalizar ledger
        setLedger(ledgerData.map((l: any) => ({
          ID: l.ID,
          UserEmail: l.UserEmail,
          Data: l.Data,
          Pontos: l.Pontos,
          Tipo: l.Tipo === 'GANHO' ? ScoreType.GANHO : ScoreType.PENALIDADE,
          Descricao: l.Descricao,
        })));

        console.log('✅ Dados carregados do backend');
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Falha ao carregar dados do servidor');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calcula usuários com métricas
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
      
      const conferidas = userTasks.filter(t => t.Status === TaskStatus.APROVADA).length;
      const confiabilidade = userTasks.length > 0 ? (conferidas / userTasks.length) * 100 : 0;

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

  // Salva usuário atual no localStorage
  useEffect(() => {
    if (currentUserEmail) localStorage.setItem('ciatos_current_user', currentUserEmail);
    else localStorage.removeItem('ciatos_current_user');
  }, [currentUserEmail]);

  // ==================== AUTH FUNCTIONS ====================
  const login = useCallback(async (email: string, senha?: string) => {
    try {
      const userData = await authApi.login(email, senha || '');
      
      const user: User = {
        Email: userData.Email,
        Nome: userData.Nome,
        Role: normalizeRole(userData.Role),
        Status: normalizeUserStatus(userData.Status),
        Time: userData.Time,
        Gestor: userData.Gestor,
        SenhaProvisoria: userData.SenhaProvisoria,
        DataCriacao: userData.DataCriacao,
        UltimoAcesso: userData.UltimoAcesso,
        TentativasFalhadas: 0,
      };

      // Atualiza lista de usuários
      setBaseUsers(prev => {
        const idx = prev.findIndex(u => u.Email.toLowerCase() === email.toLowerCase());
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = user;
          return updated;
        }
        return [...prev, user];
      });

      setCurrentUserEmail(user.Email);
      return user;
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao fazer login');
    }
  }, []);

  const logout = useCallback(() => setCurrentUserEmail(null), []);

  const changePassword = useCallback(async (email: string, oldPass: string, newPass: string) => {
    await authApi.changePassword(email, oldPass, newPass);
    setBaseUsers(prev => prev.map(u => 
      u.Email === email ? { ...u, SenhaProvisoria: false } : u
    ));
  }, []);

  const resetUserPassword = useCallback(async (email: string) => {
    try {
      await authApi.resetPassword(email);
      setBaseUsers(prev => prev.map(u => 
        u.Email === email ? { ...u, SenhaProvisoria: true, Status: UserStatus.ATIVO, TentativasFalhadas: 0 } : u
      ));
    } catch (err: any) {
      console.error('Erro ao resetar senha:', err);
      throw new Error(err.message || 'Erro ao resetar senha');
    }
  }, []);

  const toggleUserStatus = useCallback(async (email: string) => {
    try {
      await authApi.toggleStatus(email);
      setBaseUsers(prev => prev.map(u => 
        u.Email === email ? { ...u, Status: u.Status === UserStatus.ATIVO ? UserStatus.INATIVO : UserStatus.ATIVO } : u
      ));
    } catch (err: any) {
      console.error('Erro ao alterar status:', err);
      // Fallback local
      setBaseUsers(prev => prev.map(u => 
        u.Email === email ? { ...u, Status: u.Status === UserStatus.ATIVO ? UserStatus.INATIVO : UserStatus.ATIVO } : u
      ));
    }
  }, []);

  const deleteUser = useCallback(async (email: string) => {
    if (window.confirm(`Deletar ${email}?`)) {
      try {
        await authApi.deleteUser(email);
        setBaseUsers(prev => prev.filter(u => u.Email !== email));
      } catch (err: any) {
        console.error('Erro ao deletar usuário:', err);
        // Fallback local
        setBaseUsers(prev => prev.filter(u => u.Email !== email));
      }
    }
  }, []);

  const addUser = useCallback(async (userData: Partial<User>) => {
    try {
      const newUser = await authApi.createUser({
        Email: userData.Email,
        Nome: userData.Nome,
        Role: userData.Role,
        Time: userData.Time,
        Gestor: userData.Gestor,
      });
      
      setBaseUsers(prev => [...prev, {
        ...newUser,
        Role: normalizeRole(newUser.Role),
        Status: normalizeUserStatus(newUser.Status),
        TentativasFalhadas: 0,
      }]);
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao criar usuário');
    }
  }, []);

  const updateUser = useCallback(async (email: string, updatedData: Partial<User>) => {
    try {
      await authApi.updateUser(email, updatedData);
      setBaseUsers(prev => prev.map(u => u.Email === email ? { ...u, ...updatedData } : u));
    } catch (err: any) {
      // Fallback local
      setBaseUsers(prev => prev.map(u => u.Email === email ? { ...u, ...updatedData } : u));
    }
  }, []);

  const updateProfile = useCallback((updatedData: Partial<User>) => {
    if (currentUserEmail) {
      updateUser(currentUserEmail, updatedData);
    }
  }, [currentUserEmail, updateUser]);

  // ==================== TASK FUNCTIONS ====================
  const completeTask = useCallback(async (taskId: string, note: string, proof?: string) => {
    try {
      await tasksApi.complete(taskId, note, proof);
      
      setTasks(prev => prev.map(t => (t.ID === taskId ? { 
        ...t, 
        Status: TaskStatus.AGUARDANDO_APROVACAO, 
        DataConclusao: new Date().toISOString(), 
        CompletionNote: note, 
        ProofAttachment: proof,
        JustificativaGestor: undefined
      } : t)));
    } catch (err: any) {
      console.error('Erro ao completar tarefa:', err);
      // Fallback local
      setTasks(prev => prev.map(t => (t.ID === taskId ? { 
        ...t, 
        Status: TaskStatus.AGUARDANDO_APROVACAO, 
        DataConclusao: new Date().toISOString(), 
        CompletionNote: note, 
        ProofAttachment: proof,
      } : t)));
    }
  }, []);

  const auditTask = useCallback(async (taskId: string, status: TaskStatus, justification: string, nextDeadline?: string) => {
    // Mapeia TaskStatus para ConferenciaStatus do backend
    let apiStatus = 'APROVADO';
    if (status === TaskStatus.FEITA_ERRADA) apiStatus = 'ERRO_EXECUCAO';
    else if (status === TaskStatus.NAO_FEITA) apiStatus = 'NAO_CUMPRIU';

    try {
      const result = await tasksApi.audit(taskId, apiStatus, justification);
      
      // Atualiza local
      setTasks(prev => prev.map(t => {
        if (t.ID === taskId) {
          return { 
            ...t, 
            Status: status, 
            JustificativaGestor: justification,
            DataLimite: nextDeadline || t.DataLimite,
            Tentativas: status !== TaskStatus.APROVADA ? (t.Tentativas || 0) + 1 : t.Tentativas,
            DataConclusao: status === TaskStatus.APROVADA ? t.DataConclusao : undefined 
          };
        }
        return t;
      }));

      // Recarrega ledger
      const ledgerData = await ledgerApi.getAll();
      setLedger(ledgerData.map((l: any) => ({
        ID: l.ID,
        UserEmail: l.UserEmail,
        Data: l.Data,
        Pontos: l.Pontos,
        Tipo: l.Tipo === 'GANHO' ? ScoreType.GANHO : ScoreType.PENALIDADE,
        Descricao: l.Descricao,
      })));

    } catch (err: any) {
      console.error('Erro ao auditar tarefa:', err);
      // Fallback local
      setTasks(prev => prev.map(t => {
        if (t.ID === taskId) {
          let delta = 0;
          let motive = "";
          let type = ScoreType.GANHO;

          if (status === TaskStatus.APROVADA) {
            delta = t.PontosValor;
            motive = `Aprovação: ${t.Titulo}`;
          } else if (status === TaskStatus.FEITA_ERRADA) {
            delta = -(t.PontosValor * 0.5);
            motive = `Pena – Erro: ${t.Titulo}`;
            type = ScoreType.PENALIDADE;
          } else if (status === TaskStatus.NAO_FEITA) {
            delta = -(t.PontosValor * 2);
            motive = `Penalidade – Não Fez: ${t.Titulo}`;
            type = ScoreType.PENALIDADE;
          }

          setLedger(prev => [...prev, { 
            ID: Math.random().toString(36).substr(2, 9), 
            UserEmail: t.Responsavel, 
            Data: new Date().toISOString(), 
            Pontos: delta, 
            Tipo: type, 
            Descricao: motive 
          }]);

          return { 
            ...t, 
            Status: status, 
            JustificativaGestor: justification,
            DataLimite: nextDeadline || t.DataLimite,
            Tentativas: status !== TaskStatus.APROVADA ? (t.Tentativas || 0) + 1 : t.Tentativas,
          };
        }
        return t;
      }));
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    if (window.confirm("Excluir tarefa?")) {
      try {
        await tasksApi.delete(taskId);
      } catch (err) {
        console.error('Erro ao deletar no backend:', err);
      }
      setTasks(prev => prev.filter(t => t.ID !== taskId));
    }
  }, []);

  // ==================== TEMPLATE FUNCTIONS ====================
  const addTemplate = useCallback(async (templateData: Omit<TaskTemplate, 'ID'>) => {
    try {
      const newTemplate = await templatesApi.create({
        Titulo: templateData.Titulo,
        Descricao: templateData.Descricao,
        Responsavel: templateData.Responsavel,
        Prioridade: templateData.Prioridade,
        PontosValor: templateData.PontosValor,
        Recorrencia: templateData.Recorrencia,
        DiasRecorrencia: templateData.DiasRecorrencia,
        DiaDoMes: templateData.DiaDoMes,
        DataInicio: templateData.DataInicio,
        CriadoPor: currentUserEmail,
      });
      
      setTemplates(prev => [...prev, {
        ...newTemplate,
        Ativa: true,
      }]);
    } catch (err: any) {
      console.error('Erro ao criar template:', err);
      // Fallback local
      setTemplates(prev => [...prev, { 
        ...templateData, 
        ID: Math.random().toString(36).substr(2, 9),
        Ativa: true,
      }]);
    }
  }, [currentUserEmail]);

  const toggleTemplate = useCallback(async (id: string) => {
    try {
      const result = await templatesApi.toggle(id);
      setTemplates(prev => prev.map(t => t.ID === id ? { ...t, Ativa: result.ativa } : t));
    } catch (err) {
      // Fallback local
      setTemplates(prev => prev.map(t => t.ID === id ? { ...t, Ativa: !t.Ativa } : t));
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      await templatesApi.delete(id);
    } catch (err) {
      console.error('Erro ao deletar template:', err);
    }
    setTemplates(prev => prev.filter(t => t.ID !== id));
  }, []);

  const generateTaskFromTemplate = useCallback(async (templateId: string, force: boolean = false) => {
    try {
      const result = await templatesApi.generate(templateId, force);
      
      if (result.duplicate) {
        return { duplicate: true, template: result.template };
      }

      // Adiciona a tarefa gerada
      if (result.task) {
        setTasks(prev => [...prev, {
          ...result.task,
          Status: TaskStatus.PENDENTE,
          Tentativas: 0,
        }]);
      }

      // Atualiza última execução do template
      setTemplates(prev => prev.map(t => 
        t.ID === templateId ? { ...t, UltimaExecucao: new Date().toISOString() } : t
      ));

      return true;
    } catch (err: any) {
      if (err.message?.includes('409')) {
        const tmpl = templates.find(t => t.ID === templateId);
        return { duplicate: true, template: tmpl };
      }
      console.error('Erro ao gerar tarefa:', err);
      
      // Fallback local
      const tmpl = templates.find(t => t.ID === templateId);
      if (!tmpl) return false;
      
      const todayStr = getLocalTodayStr();
      const alreadyExists = tasks.some(t => 
        t.Titulo === tmpl.Titulo && 
        t.Responsavel === tmpl.Responsavel && 
        new Date(t.DataLimite).toLocaleDateString('en-CA') === todayStr
      );
      
      if (alreadyExists && !force) return { duplicate: true, template: tmpl };
      
      const dueDateTime = new Date(); 
      dueDateTime.setHours(23, 59, 59, 999);
      
      const newTask: Task = {
        ID: Math.random().toString(36).substr(2, 9),
        TemplateID: tmpl.ID,
        Titulo: tmpl.Titulo,
        Descricao: tmpl.Descricao,
        Responsavel: tmpl.Responsavel,
        DataLimite: dueDateTime.toISOString(),
        Prioridade: tmpl.Prioridade,
        PontosValor: tmpl.PontosValor,
        Status: TaskStatus.PENDENTE,
        Tentativas: 0
      };
      
      setTasks(prev => [...prev, newTask]);
      return true;
    }
  }, [templates, tasks]);

  // Função para recarregar dados
  const refreshData = useCallback(async () => {
    try {
      const [tasksData, ledgerData] = await Promise.all([
        tasksApi.getAll(),
        ledgerApi.getAll(),
      ]);

      setTasks(tasksData.map((t: any) => ({
        ID: t.ID,
        TemplateID: t.TemplateID,
        Titulo: t.Titulo,
        Descricao: t.Descricao,
        Responsavel: t.Responsavel,
        DataLimite: t.DataLimite,
        Prioridade: t.Prioridade || TaskPriority.MEDIA,
        PontosValor: t.PontosValor || 10,
        Status: normalizeTaskStatus(t.Status),
        DataConclusao: t.DataConclusao,
        CompletionNote: t.CompletionNote,
        ProofAttachment: t.ProofAttachment,
        ConferenciaStatus: t.ConferenciaStatus,
        ObservacaoGestor: t.ObservacaoGestor,
        Tentativas: t.Tentativas || 0,
      })));

      setLedger(ledgerData.map((l: any) => ({
        ID: l.ID,
        UserEmail: l.UserEmail,
        Data: l.Data,
        Pontos: l.Pontos,
        Tipo: l.Tipo === 'GANHO' ? ScoreType.GANHO : ScoreType.PENALIDADE,
        Descricao: l.Descricao,
      })));
    } catch (err) {
      console.error('Erro ao atualizar dados:', err);
    }
  }, []);

  return { 
    currentUser, users, tasks, templates, ledger, minhasTarefas,
    loading, error, refreshData,
    login, logout, changePassword, resetUserPassword, toggleUserStatus, deleteUser, addUser, updateUser,
    updateProfile, completeTask, auditTask, deleteTask,
    addTemplate, toggleTemplate, deleteTemplate, generateTaskFromTemplate 
  };
};
