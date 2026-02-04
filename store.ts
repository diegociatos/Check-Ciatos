
import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Task, ScoreLedger, UserRole, TaskStatus, UserStatus, TaskPriority, ConferenciaStatus, ScoreType, TaskTemplate, RecurrenceType } from './types';

const getLocalTodayStr = () => {
  const now = new Date();
  return now.toLocaleDateString('en-CA');
};

const INITIAL_USERS: User[] = [
  { 
    Email: 'diego.garcia@grupociatos.com.br', 
    Nome: 'Diego Garcia', 
    Role: UserRole.ADMIN, 
    Status: UserStatus.ATIVO, 
    Time: 'Gestão',
    Senha: '250500', 
    SenhaProvisoria: false,
    DataCriacao: '2024-01-01',
    TentativasFalhadas: 0
  },
  { 
    Email: 'gestor@grupociatos.com.br', 
    Nome: 'Gestor de Exemplo', 
    Role: UserRole.GESTOR, 
    Status: UserStatus.ATIVO, 
    Time: 'Operação',
    Senha: '123',
    SenhaProvisoria: true,
    DataCriacao: '2024-01-01',
    TentativasFalhadas: 0
  },
  { 
    Email: 'controladoria@grupociatos.com.br', 
    Nome: 'Controladoria Ciatos', 
    Role: UserRole.GESTOR, 
    Status: UserStatus.ATIVO, 
    Time: 'Controladoria',
    Gestor: 'diego.garcia@grupociatos.com.br',
    Senha: '123456',
    SenhaProvisoria: false,
    DataCriacao: '2024-01-01',
    TentativasFalhadas: 0
  },
  { 
    Email: 'financeiro@grupociatos.com.br', 
    Nome: 'Financeiro Ciatos', 
    Role: UserRole.COLABORADOR, 
    Status: UserStatus.ATIVO, 
    Time: 'Financeiro',
    Gestor: 'controladoria@grupociatos.com.br',
    Senha: '123456',
    SenhaProvisoria: false,
    DataCriacao: '2024-01-01',
    TentativasFalhadas: 0
  }
];

export const useStore = () => {
  const [baseUsers, setBaseUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ciatos_users_v10');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('ciatos_tasks_v4');
    return saved ? JSON.parse(saved) : [];
  });

  const [templates, setTemplates] = useState<TaskTemplate[]>(() => {
    const saved = localStorage.getItem('ciatos_templates_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [ledger, setLedger] = useState<ScoreLedger[]>(() => {
    const saved = localStorage.getItem('ciatos_ledger_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('ciatos_current_user');
  });

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

  useEffect(() => localStorage.setItem('ciatos_users_v10', JSON.stringify(baseUsers)), [baseUsers]);
  useEffect(() => localStorage.setItem('ciatos_tasks_v4', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('ciatos_templates_v3', JSON.stringify(templates)), [templates]);
  useEffect(() => localStorage.setItem('ciatos_ledger_v3', JSON.stringify(ledger)), [ledger]);
  useEffect(() => {
    if (currentUserEmail) localStorage.setItem('ciatos_current_user', currentUserEmail);
    else localStorage.removeItem('ciatos_current_user');
  }, [currentUserEmail]);

  // Auth Functions
  const login = useCallback((email: string, senha?: string) => {
    const userIndex = baseUsers.findIndex(u => u.Email.toLowerCase() === email.toLowerCase());
    if (userIndex === -1) throw new Error("Usuário não encontrado.");
    const user = baseUsers[userIndex];
    if (user.Status === UserStatus.BLOQUEADO) throw new Error("Conta bloqueada por excesso de tentativas.");
    if (user.Status === UserStatus.INATIVO) throw new Error("Conta desativada.");
    if (user.Senha !== senha) {
      const newAttempts = (user.TentativasFalhadas || 0) + 1;
      const updatedUsers = [...baseUsers];
      updatedUsers[userIndex] = { ...user, TentativasFalhadas: newAttempts, Status: newAttempts >= 5 ? UserStatus.BLOQUEADO : user.Status };
      setBaseUsers(updatedUsers);
      throw new Error(`Senha incorreta. Tentativa ${newAttempts} de 5.`);
    }
    const updatedUsers = [...baseUsers];
    updatedUsers[userIndex] = { ...user, TentativasFalhadas: 0, UltimoAcesso: new Date().toISOString() };
    setBaseUsers(updatedUsers);
    setCurrentUserEmail(user.Email);
    return user;
  }, [baseUsers]);

  const logout = useCallback(() => setCurrentUserEmail(null), []);

  const changePassword = useCallback((email: string, oldPass: string, newPass: string) => {
    const userIndex = baseUsers.findIndex(u => u.Email === email);
    const user = baseUsers[userIndex];
    if (user.Senha !== oldPass) throw new Error("Senha atual incorreta.");
    if (newPass.length < 8 || !/\d/.test(newPass)) throw new Error("A nova senha deve ter no mínimo 8 caracteres e conter pelo menos um número.");
    const updatedUsers = [...baseUsers];
    updatedUsers[userIndex] = { ...user, Senha: newPass, SenhaProvisoria: false };
    setBaseUsers(updatedUsers);
  }, [baseUsers]);

  const resetUserPassword = useCallback((email: string) => {
    const userIndex = baseUsers.findIndex(u => u.Email === email);
    if (userIndex === -1) return;
    const updatedUsers = [...baseUsers];
    updatedUsers[userIndex] = { ...baseUsers[userIndex], Senha: '123456', SenhaProvisoria: true, Status: UserStatus.ATIVO, TentativasFalhadas: 0 };
    setBaseUsers(updatedUsers);
  }, [baseUsers]);

  const toggleUserStatus = useCallback((email: string) => {
    setBaseUsers(prev => prev.map(u => u.Email === email ? { ...u, Status: u.Status === UserStatus.ATIVO ? UserStatus.INATIVO : UserStatus.ATIVO } : u));
  }, []);

  const deleteUser = useCallback((email: string) => {
    if (window.confirm(`Deletar ${email}?`)) setBaseUsers(prev => prev.filter(u => u.Email !== email));
  }, []);

  const addUser = useCallback((userData: Partial<User>) => {
    if (baseUsers.some(u => u.Email === userData.Email)) throw new Error("E-mail já cadastrado.");
    
    const newUser: User = {
      ...userData as User,
      Senha: '123456',
      SenhaProvisoria: true,
      DataCriacao: new Date().toISOString().split('T')[0],
      Status: UserStatus.ATIVO,
      TentativasFalhadas: 0
    };
    
    setBaseUsers(prev => [...prev, newUser]);
  }, [baseUsers]);

  const updateUser = useCallback((email: string, updatedData: Partial<User>) => {
    setBaseUsers(prev => prev.map(u => u.Email === email ? { ...u, ...updatedData } : u));
  }, []);

  const updateProfile = useCallback((updatedData: Partial<User>) => {
    setBaseUsers(prev => prev.map(u => u.Email === currentUserEmail ? { ...u, ...updatedData } : u));
  }, [currentUserEmail]);

  // TASK WORKFLOW
  const completeTask = useCallback((taskId: string, note: string, proof?: string) => {
    setTasks(prev => prev.map(t => (t.ID === taskId ? { 
      ...t, 
      Status: TaskStatus.AGUARDANDO_APROVACAO, 
      DataConclusao: new Date().toISOString(), 
      CompletionNote: note, 
      ProofAttachment: proof,
      JustificativaGestor: undefined // Limpa feedback anterior se existir
    } : t)));
  }, []);

  const auditTask = useCallback((taskId: string, status: TaskStatus, justification: string, nextDeadline?: string) => {
    setTasks(prev => prev.map(t => {
      if (t.ID === taskId) {
        let delta = 0;
        let motive = "";
        let type = ScoreType.GANHO;

        if (status === TaskStatus.APROVADA) {
          delta = t.PontosValor;
          motive = `Aprovação: ${t.Titulo}`;
          type = ScoreType.GANHO;
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
          Tentativas: status !== TaskStatus.APROVADA ? t.Tentativas + 1 : t.Tentativas,
          DataConclusao: status === TaskStatus.APROVADA ? t.DataConclusao : undefined 
        };
      }
      return t;
    }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    if (window.confirm("Excluir tarefa?")) setTasks(prev => prev.filter(t => t.ID !== taskId));
  }, []);

  const addTemplate = useCallback((templateData: Omit<TaskTemplate, 'ID'>) => {
    setTemplates(prev => [...prev, { ...templateData, ID: Math.random().toString(36).substr(2, 9) }]);
  }, []);

  const toggleTemplate = useCallback((id: string) => setTemplates(prev => prev.map(t => t.ID === id ? { ...t, Ativa: !t.Ativa } : t)), []);
  const deleteTemplate = useCallback((id: string) => setTemplates(prev => prev.filter(t => t.ID !== id)), []);

  const generateTaskFromTemplate = useCallback((templateId: string, force: boolean = false) => {
    const tmpl = templates.find(t => t.ID === templateId);
    if (!tmpl) return false;
    const todayStr = getLocalTodayStr();
    const alreadyExists = tasks.some(t => t.Titulo === tmpl.Titulo && t.Responsavel === tmpl.Responsavel && new Date(t.DataLimite).toLocaleDateString('en-CA') === todayStr);
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
  }, [templates, tasks]);

  return { 
    currentUser, users, tasks, templates, ledger, minhasTarefas, 
    login, logout, changePassword, resetUserPassword, toggleUserStatus, deleteUser, addUser, updateUser,
    updateProfile, completeTask, auditTask, deleteTask,
    addTemplate, toggleTemplate, deleteTemplate, generateTaskFromTemplate 
  };
};
