
import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Task, ScoreLedger, UserRole, TaskStatus, ScoreReason, TaskTemplate, UserCredentials, ConferenciaStatus } from './types';

const INITIAL_USERS: User[] = [
  { Email: 'admin@ciatos.com.br', Nome: 'Admin Ciatos', Role: UserRole.ADMIN, Ativo: true, Time: 'Diretoria' },
  { Email: 'diego@ciatos.com.br', Nome: 'Diego Gestor', Role: UserRole.GESTOR, Ativo: true, Time: 'Vendas' },
  { Email: 'joao@ciatos.com.br', Nome: 'João Colaborador', Role: UserRole.COLABORADOR, Ativo: true, Time: 'Operacional' },
  { Email: 'maria@ciatos.com.br', Nome: 'Maria Colaboradora', Role: UserRole.COLABORADOR, Ativo: true, Time: 'Vendas' },
  { Email: 'ti@ciatos.com.br', Nome: 'Carlos TI', Role: UserRole.COLABORADOR, Ativo: true, Time: 'Tecnologia' },
];

const INITIAL_CREDENTIALS: UserCredentials[] = INITIAL_USERS.map(u => ({
  Email: u.Email,
  Senha: 'ciatos123',
  TentativasFalhadas: 0
}));

const INITIAL_TASKS: Task[] = [
  {
    TaskID: '1',
    Titulo: 'Relatório de Vendas Mensal',
    Descricao: 'Compilar todos os dados de vendas do mês passado.',
    Pontos: 50,
    AssigneeEmail: 'maria@ciatos.com.br',
    CreatedByEmail: 'diego@ciatos.com.br',
    DueDateTime: new Date(Date.now() + 86400000).toISOString(), 
    Status: TaskStatus.PENDENTE,
    RewardApplied: false,
    PenaltyApplied: false,
    EhRecorrente: false,
    ConferenciaStatus: ConferenciaStatus.AGUARDANDO_CONFERENCIA
  },
  {
    TaskID: '2',
    Titulo: 'Organização de Arquivos',
    Descricao: 'Limpar a pasta compartilhada do time.',
    Pontos: 20,
    AssigneeEmail: 'joao@ciatos.com.br',
    CreatedByEmail: 'diego@ciatos.com.br',
    DueDateTime: new Date(Date.now() - 3600000).toISOString(), 
    Status: TaskStatus.PENDENTE,
    RewardApplied: false,
    PenaltyApplied: false,
    EhRecorrente: false,
    ConferenciaStatus: ConferenciaStatus.AGUARDANDO_CONFERENCIA
  }
];

export interface Notification {
  id: string;
  to: string;
  subject: string;
  body: string;
  date: string;
}

export const useStore = () => {
  const [baseUsers, setBaseUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ciatos_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [credentials, setCredentials] = useState<UserCredentials[]>(() => {
    const saved = localStorage.getItem('ciatos_credentials');
    return saved ? JSON.parse(saved) : INITIAL_CREDENTIALS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('ciatos_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [ledger, setLedger] = useState<ScoreLedger[]>(() => {
    const saved = localStorage.getItem('ciatos_ledger');
    return saved ? JSON.parse(saved) : [];
  });

  const [templates, setTemplates] = useState<TaskTemplate[]>(() => {
    const saved = localStorage.getItem('ciatos_templates');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('ciatos_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('ciatos_current_user');
  });

  const dateHelpers = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth };
  }, []);

  const users = useMemo(() => {
    return baseUsers.map(u => {
      const creds = credentials.find(c => c.Email.toLowerCase() === u.Email.toLowerCase());
      const userTasks = tasks.filter(t => t.AssigneeEmail === u.Email);
      const userLedger = ledger.filter(l => l.Email === u.Email);

      const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = dateHelpers;

      const pontosPossiveisHoje = userTasks
        .filter(t => {
          const dt = new Date(t.DueDateTime);
          return dt >= startOfDay && dt <= endOfDay;
        })
        .reduce((sum, t) => sum + t.Pontos, 0);

      const pontosPossiveisSemana = userTasks
        .filter(t => {
          const dt = new Date(t.DueDateTime);
          return dt >= startOfWeek && dt <= endOfWeek;
        })
        .reduce((sum, t) => sum + t.Pontos, 0);

      const pontosPossiveisMes = userTasks
        .filter(t => {
          const dt = new Date(t.DueDateTime);
          return dt >= startOfMonth && dt <= endOfMonth;
        })
        .reduce((sum, t) => sum + t.Pontos, 0);

      const pontosRealizadosHoje = userLedger
        .filter(l => {
          const dt = new Date(l.DataHora);
          return dt >= startOfDay && dt <= endOfDay;
        })
        .reduce((sum, l) => sum + l.DeltaPontos, 0);

      const pontosRealizadosSemana = userLedger
        .filter(l => {
          const dt = new Date(l.DataHora);
          return dt >= startOfWeek && dt <= endOfWeek;
        })
        .reduce((sum, l) => sum + l.DeltaPontos, 0);

      const pontosRealizadosMes = userLedger
        .filter(l => {
          const dt = new Date(l.DataHora);
          return dt >= startOfMonth && dt <= endOfMonth;
        })
        .reduce((sum, l) => sum + l.DeltaPontos, 0);

      return {
        ...u,
        SenhaDefinida: !!creds,
        UltimoAcessoFormatado: creds?.UltimoAcesso 
          ? new Date(creds.UltimoAcesso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'Nunca',
        PontosPossiveisHoje: pontosPossiveisHoje,
        PontosPossiveisSemana: pontosPossiveisSemana,
        PontosPossiveisMes: pontosPossiveisMes,
        PontosRealizadosHoje: pontosRealizadosHoje,
        PontosRealizadosSemana: pontosRealizadosSemana,
        PontosRealizadosMes: pontosRealizadosMes
      };
    });
  }, [baseUsers, credentials, tasks, ledger, dateHelpers]);

  const currentUser = users.find(u => u.Email === currentUserEmail) || null;

  useEffect(() => { localStorage.setItem('ciatos_users', JSON.stringify(baseUsers)); }, [baseUsers]);
  useEffect(() => { localStorage.setItem('ciatos_credentials', JSON.stringify(credentials)); }, [credentials]);
  useEffect(() => { localStorage.setItem('ciatos_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('ciatos_templates', JSON.stringify(templates)); }, [templates]);
  useEffect(() => { localStorage.setItem('ciatos_ledger', JSON.stringify(ledger)); }, [ledger]);
  useEffect(() => { localStorage.setItem('ciatos_notifications', JSON.stringify(notifications)); }, [notifications]);

  useEffect(() => {
    if (currentUserEmail) {
      localStorage.setItem('ciatos_current_user', currentUserEmail);
    } else {
      localStorage.removeItem('ciatos_current_user');
    }
  }, [currentUserEmail]);

  const login = useCallback((email: string, senha?: string) => {
    const user = users.find(u => u.Email.toLowerCase() === email.toLowerCase());
    const userCreds = credentials.find(c => c.Email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error("Email não cadastrado.");
    if (!user.Ativo) throw new Error("Conta desativada.");
    if (senha && userCreds?.Senha !== senha) throw new Error("Senha incorreta.");
    setCurrentUserEmail(user.Email);
    return user;
  }, [users, credentials]);

  const logout = useCallback(() => setCurrentUserEmail(null), []);

  const updateUserProfile = useCallback((email: string, updates: Partial<User>) => {
    setBaseUsers(prev => prev.map(u => u.Email === email ? { ...u, ...updates } : u));
  }, []);

  const updatePassword = useCallback((email: string, oldPassword: string, newPassword: string) => {
    setCredentials(prev => prev.map(c => c.Email === email ? { ...c, Senha: newPassword } : c));
  }, []);

  const completeTask = useCallback((taskId: string, note: string, proof: string) => {
    setTasks(prev => prev.map(task => {
      if (task.TaskID === taskId) {
        const completedAt = new Date().toISOString();
        const isWithinDeadline = new Date(completedAt) <= new Date(task.DueDateTime);
        
        let rewardApplied = task.RewardApplied;
        if (isWithinDeadline && !task.RewardApplied) {
          const newLedgerEntry: ScoreLedger = {
            LedgerID: Math.random().toString(36).substr(2, 9),
            Email: task.AssigneeEmail,
            TaskID: task.TaskID,
            DataHora: completedAt,
            DeltaPontos: task.Pontos,
            Motivo: ScoreReason.CONCLUSAO_NO_PRAZO,
            Observacao: `Tarefa '${task.Titulo}' concluída no prazo`
          };
          setLedger(l => [...l, newLedgerEntry]);
          rewardApplied = true;
        }

        return {
          ...task,
          Status: TaskStatus.CONCLUIDA,
          CompletedAt: completedAt,
          CompletionNote: note,
          ProofAttachment: proof,
          RewardApplied: rewardApplied,
          ConferenciaStatus: ConferenciaStatus.AGUARDANDO_CONFERENCIA
        };
      }
      return task;
    }));
  }, []);

  const conferTask = useCallback((taskId: string, status: ConferenciaStatus, obs: string, managerEmail: string) => {
    setTasks(prev => prev.map(task => {
      if (task.TaskID === taskId) {
        const now = new Date().toISOString();
        
        // Aplicação de Penalidades Adicionais conforme novas regras
        if (status === ConferenciaStatus.NAO_CUMPRIU) {
          const newLedgerEntry: ScoreLedger = {
            LedgerID: Math.random().toString(36).substr(2, 9),
            Email: task.AssigneeEmail,
            TaskID: task.TaskID,
            DataHora: now,
            DeltaPontos: -(task.Pontos * 5),
            Motivo: ScoreReason.NAO_CUMPRIU_APOS_REVISAO,
            Observacao: `[PENALIDADE 5X] Entrega não cumprida: ${obs}`
          };
          setLedger(l => [...l, newLedgerEntry]);
        } else if (status === ConferenciaStatus.CUMPRIU_ERRADO) {
          const newLedgerEntry: ScoreLedger = {
            LedgerID: Math.random().toString(36).substr(2, 9),
            Email: task.AssigneeEmail,
            TaskID: task.TaskID,
            DataHora: now,
            DeltaPontos: -(task.Pontos * 3),
            Motivo: ScoreReason.CUMPRIU_ERRADO,
            Observacao: `[PENALIDADE 3X] Entrega incorreta: ${obs}`
          };
          setLedger(l => [...l, newLedgerEntry]);
        }

        return {
          ...task,
          ConferenciaStatus: status,
          ConferidoPor: managerEmail,
          ConferidoEm: now,
          ObservacaoGestor: obs
        };
      }
      return task;
    }));
  }, []);

  const addTask = useCallback((taskData: Omit<Task, 'TaskID' | 'Status' | 'RewardApplied' | 'PenaltyApplied' | 'ConferenciaStatus'>) => {
    const newTask: Task = {
      ...taskData,
      TaskID: Math.random().toString(36).substr(2, 9),
      Status: TaskStatus.PENDENTE,
      RewardApplied: false,
      PenaltyApplied: false,
      EhRecorrente: taskData.EhRecorrente ?? false,
      ConferenciaStatus: ConferenciaStatus.AGUARDANDO_CONFERENCIA
    };
    setTasks(prev => [...prev, newTask]);
  }, []);

  const getUserStats = useCallback((email: string) => {
    const user = users.find(u => u.Email === email);
    const userTasks = tasks.filter(t => t.AssigneeEmail === email);
    const userLedger = ledger.filter(l => l.Email === email);

    return {
      pontuacaoTotal: userLedger.reduce((sum, l) => sum + l.DeltaPontos, 0),
      potencialDia: user?.PontosPossiveisHoje || 0,
      ganhoDia: user?.PontosRealizadosHoje || 0,
      potencialSemana: user?.PontosPossiveisSemana || 0,
      ganhoSemana: user?.PontosRealizadosSemana || 0,
      potencialMes: user?.PontosPossiveisMes || 0,
      ganhoMes: user?.PontosRealizadosMes || 0,
      tarefasPendentes: userTasks.filter(t => t.Status === TaskStatus.PENDENTE).length,
      tarefasAtrasadas: userTasks.filter(t => t.Status === TaskStatus.ATRASADA).length,
      aguardandoConferencia: userTasks.filter(t => t.Status === TaskStatus.CONCLUIDA && t.ConferenciaStatus === ConferenciaStatus.AGUARDANDO_CONFERENCIA).length
    };
  }, [ledger, tasks, users]);

  const getEnrichedTask = useCallback((task: Task) => {
    const collaborator = users.find(u => u.Email === task.AssigneeEmail);
    const gestor = users.find(u => u.Email === task.CreatedByEmail);
    const due = new Date(task.DueDateTime);
    const diffTime = due.getTime() - Date.now();
    const diasAteVencimento = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let statusCor = "Gray";
    if (task.Status === TaskStatus.CONCLUIDA) statusCor = "Green";
    else if (task.Status === TaskStatus.ATRASADA) statusCor = "Red";
    else if (diasAteVencimento <= 1) statusCor = "Orange";

    return {
      ...task,
      NomeColaborador: collaborator?.Nome || 'Desconhecido',
      NomeGestor: gestor?.Nome || (task.CreatedByEmail === "SISTEMA@AUTOMACAO.COM" ? "🤖 Sistema" : 'Desconhecido'),
      DiasAteVencimento: diasAteVencimento,
      StatusCor: statusCor
    };
  }, [users]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTasks(prevTasks => {
        let changed = false;
        const newTasks = prevTasks.map(task => {
          if (task.Status !== TaskStatus.CONCLUIDA && new Date(task.DueDateTime) < now && !task.PenaltyApplied) {
            changed = true;
            const newLedgerEntry: ScoreLedger = {
              LedgerID: Math.random().toString(36).substr(2, 9),
              Email: task.AssigneeEmail,
              TaskID: task.TaskID,
              DataHora: now.toISOString(),
              DeltaPontos: -(task.Pontos * 2),
              Motivo: ScoreReason.PENALIDADE_ATRASO,
              Observacao: `Tarefa '${task.Titulo}' não cumprida no prazo.`
            };
            setLedger(prev => [...prev, newLedgerEntry]);
            return { ...task, Status: TaskStatus.ATRASADA, PenaltyApplied: true, ConferenciaStatus: ConferenciaStatus.NAO_CUMPRIU };
          }
          return task;
        });
        return changed ? newTasks : prevTasks;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    users, tasks, templates, ledger, notifications, currentUser,
    login, logout, updateUserProfile, updatePassword, completeTask, conferTask,
    addTask, getUserStats, getEnrichedTask, 
    addTemplate: (d: any) => {}, updateTemplate: (id: any, u: any) => {}, deleteTemplate: (id: any) => {},
    updatePointsManually: (e: any, p: any, o: any) => {}, resetPassword: (e: any) => {},
    unlockAccount: (e: any) => {}, sendWelcomeEmail: (e: any) => {}, deleteLevel: (id: any) => {}, deleteTask: (id: any) => {}, reopenTask: (id: any) => {}
  };
};
