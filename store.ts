
import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Task, ScoreLedger, UserRole, TaskStatus, UserStatus, TaskPriority, ConferenciaStatus, ScoreType, TaskTemplate, RecurrenceType, BotLog } from './types';

// Helper crítico para fuso horário América/São_Paulo retornando YYYY-MM-DD (DATE puro)
export const getTodayStr = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

// Retorna o timestamp completo conforme NOW()
export const getNowStr = () => {
  return new Date().toISOString();
};

// Converte qualquer string de data para DATE puro YYYY-MM-DD garantindo integridade de fuso
export const toDateOnly = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    // Se já estiver no formato YYYY-MM-DD puro
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    // FORÇAMOS T12:00:00 para evitar que o fuso horário (UTC vs Local) subtraia um dia
    const normalizedStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
    const date = new Date(normalizedStr);
    
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  } catch (e) {
    return dateStr.split('T')[0];
  }
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
    Email: 'x@g.com', 
    Nome: 'Colaborador X', 
    Role: UserRole.COLABORADOR, 
    Status: UserStatus.ATIVO, 
    Time: 'Operação',
    Senha: '123456', 
    SenhaProvisoria: false,
    DataCriacao: '2026-02-04',
    TentativasFalhadas: 0
  }
];

export const useStore = () => {
  const [baseUsers, setBaseUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ciatos_users_v11');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [baseTasks, setBaseTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('ciatos_tasks_v7');
    return saved ? JSON.parse(saved) : [];
  });

  const [templates, setTemplates] = useState<TaskTemplate[]>(() => {
    const saved = localStorage.getItem('ciatos_templates_v5');
    return saved ? JSON.parse(saved) : [];
  });

  const [ledger, setLedger] = useState<ScoreLedger[]>(() => {
    const saved = localStorage.getItem('ciatos_ledger_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [botLog, setBotLog] = useState<BotLog[]>(() => {
    const saved = localStorage.getItem('ciatos_bot_log_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('ciatos_current_user');
  });

  const tasks = useMemo(() => {
    return baseTasks.map(t => ({
      ...t,
      DataLimite_Date: toDateOnly(t.DataLimite)
    }));
  }, [baseTasks]);

  const users = useMemo(() => {
    const today = getTodayStr();
    return baseUsers.map(u => {
      const userTasks = tasks.filter(t => t.Responsavel === u.Email);
      const userLedger = ledger.filter(l => l.UserEmail === u.Email);
      const pontosRealizadosMes = userLedger.reduce((sum, l) => sum + l.Pontos, 0);
      const pontosPossiveisMes = userTasks.reduce((sum, t) => sum + t.PontosValor, 0);
      const conferidas = userTasks.filter(t => t.Status === TaskStatus.APROVADA).length;
      const confiabilidade = userTasks.length > 0 ? (conferidas / userTasks.length) * 100 : 0;

      return {
        ...u,
        PontosRealizadosMes: pontosRealizadosMes,
        PontosPossiveisMes: pontosPossiveisMes,
        EficienciaMes: pontosPossiveisMes > 0 ? (pontosRealizadosMes / pontosPossiveisMes) * 100 : 0,
        ScoreConfiabilidade: confiabilidade,
        TemAtrasos: tasks.some(t => t.Responsavel === u.Email && t.Status === TaskStatus.PENDENTE && t.DataLimite_Date! < today)
      };
    });
  }, [baseUsers, tasks, ledger]);

  const currentUser = users.find(u => u.Email === currentUserEmail) || null;

  useEffect(() => localStorage.setItem('ciatos_users_v11', JSON.stringify(baseUsers)), [baseUsers]);
  useEffect(() => localStorage.setItem('ciatos_tasks_v7', JSON.stringify(baseTasks)), [baseTasks]);
  useEffect(() => localStorage.setItem('ciatos_templates_v5', JSON.stringify(templates)), [templates]);
  useEffect(() => localStorage.setItem('ciatos_ledger_v3', JSON.stringify(ledger)), [ledger]);
  useEffect(() => localStorage.setItem('ciatos_bot_log_v2', JSON.stringify(botLog)), [botLog]);
  useEffect(() => {
    if (currentUserEmail) localStorage.setItem('ciatos_current_user', currentUserEmail);
    else localStorage.removeItem('ciatos_current_user');
  }, [currentUserEmail]);

  const calculateNextDeadlineDateOnly = useCallback((tmpl: TaskTemplate): string | null => {
    const todayStr = getTodayStr();
    
    // CASO DATA ESPECÍFICA: Usa exatamente a data definida no modelo (DataInicio)
    if (tmpl.Recorrencia === RecurrenceType.DATA_ESPECIFICA) {
      return toDateOnly(tmpl.DataInicio);
    }

    const parts = todayStr.split('-');
    const spToday = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

    // CASO SEMANAL: Busca o próximo dia da semana disponível
    if (tmpl.Recorrencia === RecurrenceType.SEMANAL && tmpl.DiasRecorrencia && tmpl.DiasRecorrencia.length > 0) {
      const daysMap: Record<string, number> = { 'Dom': 0, 'Seg': 1, 'Ter': 2, 'Qua': 3, 'Qui': 4, 'Sex': 5, 'Sab': 6 };
      const selectedDays = tmpl.DiasRecorrencia.map(d => daysMap[d]);
      
      let nextDate = new Date(spToday);
      let found = false;
      for (let i = 0; i < 8; i++) {
        if (selectedDays.includes(nextDate.getDay())) {
          found = true;
          break;
        }
        nextDate.setDate(nextDate.getDate() + 1);
      }
      
      return toDateOnly(nextDate.toISOString());
    }

    // Lógica para POR_DATA_FIXA ou MENSAL (Repetição no dia X de cada mês)
    if (tmpl.DiaDoMes && (tmpl.Recorrencia === RecurrenceType.POR_DATA_FIXA || tmpl.Recorrencia === RecurrenceType.MENSAL)) {
      const targetDay = tmpl.DiaDoMes;
      let targetMonth = spToday.getMonth();
      let targetYear = spToday.getFullYear();

      if (spToday.getDate() > targetDay) {
        targetMonth++;
        if (targetMonth > 11) {
          targetMonth = 0;
          targetYear++;
        }
      }

      const y = targetYear;
      const m = String(targetMonth + 1).padStart(2, '0');
      const d = String(targetDay).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    if (tmpl.Recorrencia === RecurrenceType.DIARIA) {
      return todayStr;
    }

    return toDateOnly(tmpl.DataInicio || todayStr);
  }, []);

  const generateTaskFromTemplate = useCallback((templateId: string, force: boolean = false) => {
    const tmpl = templates.find(t => t.ID === templateId);
    if (!tmpl) return false;

    const deadlineStr = calculateNextDeadlineDateOnly(tmpl);
    if (!deadlineStr) return false;

    const timestamp = new Date().toISOString();
    
    try {
      const newID = Math.random().toString(36).substr(2, 9);
      const newTask: Task = {
        ID: newID,
        TemplateID: tmpl.ID,
        OrigemModelo: tmpl.ID,
        Titulo: tmpl.Titulo,
        Descricao: tmpl.Descricao,
        Responsavel: tmpl.Responsavel,
        DataGeracao: getNowStr(),
        DataLimite: deadlineStr,
        DataCriacao: timestamp,
        Prioridade: tmpl.Prioridade,
        PontosValor: tmpl.PontosValor,
        Status: TaskStatus.PENDENTE,
        Tentativas: 0
      };

      setBaseTasks(prev => [...prev, newTask]);
      
      const log: BotLog = {
        ID: Math.random().toString(36).substr(2, 9),
        ModeloId: tmpl.ID,
        TaskID: newID,
        Responsavel: tmpl.Responsavel,
        DataLimite: deadlineStr,
        Timestamp: timestamp,
        Status: 'SUCCESS',
        TemplateTitle: tmpl.Titulo,
        RowsAdded: 1,
        GeneratedIDs: [newID],
        Resultado: `Gerado para Execução em ${deadlineStr}`
      };
      setBotLog(prev => [log, ...prev].slice(0, 20));
      return true;
    } catch (err) {
      return false;
    }
  }, [templates, calculateNextDeadlineDateOnly]);

  const login = useCallback((email: string, senha?: string) => {
    const userIndex = baseUsers.findIndex(u => u.Email.toLowerCase() === email.toLowerCase());
    if (userIndex === -1) throw new Error("Usuário não encontrado.");
    const user = baseUsers[userIndex];
    if (user.Senha !== senha) throw new Error("Senha incorreta.");
    setCurrentUserEmail(user.Email);
    return user;
  }, [baseUsers]);

  const logout = useCallback(() => setCurrentUserEmail(null), []);

  // Update completeTask to accept optional proof parameter as required by TaskList and UpcomingTasksView
  const completeTask = useCallback((taskId: string, note: string, proof?: string) => {
    setBaseTasks(prev => prev.map(t => t.ID === taskId ? { 
      ...t, 
      Status: TaskStatus.AGUARDANDO_APROVACAO, 
      DataConclusao: new Date().toISOString(), 
      CompletionNote: note,
      ProofAttachment: proof
    } : t));
  }, []);

  const auditTask = useCallback((taskId: string, status: TaskStatus, justification: string, nextDeadline?: string) => {
    setBaseTasks(prev => prev.map(t => {
      if (t.ID === taskId) {
        let confStatus: ConferenciaStatus | undefined;
        if (status === TaskStatus.APROVADA) confStatus = ConferenciaStatus.APROVADO;
        else if (status === TaskStatus.FEITA_ERRADA) confStatus = ConferenciaStatus.CUMPRIU_ERRADO;
        else if (status === TaskStatus.NAO_FEITA) confStatus = ConferenciaStatus.NAO_CUMPRIU;

        let delta = status === TaskStatus.APROVADA ? t.PontosValor : (status === TaskStatus.FEITA_ERRADA ? -(t.PontosValor * 0.5) : -(t.PontosValor * 2));
        setLedger(prev => [...prev, { 
          ID: Math.random().toString(36).substr(2, 9), 
          UserEmail: t.Responsavel, 
          Data: new Date().toISOString(), 
          Pontos: delta, 
          Tipo: delta > 0 ? ScoreType.GANHO : ScoreType.PENALIDADE, 
          Descricao: `Auditoria: ${t.Titulo} (${status})` 
        }]);
        
        return { 
          ...t, 
          Status: status, 
          JustificativaGestor: justification,
          DataLimite: nextDeadline || t.DataLimite, // Mantém data original se não informada (ex: antecipação rejeitada)
          ConferenciaStatus: confStatus 
        };
      }
      return t;
    }));
  }, []);

  const auditAndFixTasks = useCallback(() => {
    const now = new Date();
    const seventyTwoHoursAgo = new Date(now.getTime() - (72 * 60 * 60 * 1000));
    let updatedCount = 0;
    const manualFixesList: string[] = [];
    const recentTasks = baseTasks.filter(t => {
      const date = new Date(t.DataGeracao || t.DataCriacao);
      return date >= seventyTwoHoursAgo;
    });

    setBaseTasks(prev => prev.map(t => {
      const taskDate = new Date(t.DataGeracao || t.DataCriacao);
      if (taskDate >= seventyTwoHoursAgo) {
        const normalized = toDateOnly(t.DataLimite);
        if (normalized !== t.DataLimite) {
          updatedCount++;
          return { ...t, DataLimite: normalized };
        }
      }
      return t;
    }));

    return { found: recentTasks.length, updated: updatedCount, manualFixes: manualFixesList };
  }, [baseTasks]);

  const deleteTask = (id: string) => setBaseTasks(prev => prev.filter(t => t.ID !== id));
  const addTemplate = (d: Omit<TaskTemplate, 'ID'>) => setTemplates(prev => [...prev, { ...d, ID: Math.random().toString(36).substr(2, 9) }]);
  const toggleTemplate = (id: string) => setTemplates(prev => prev.map(t => t.ID === id ? { ...t, Ativa: !t.Ativa } : t));
  const deleteTemplate = (id: string) => setTemplates(prev => prev.filter(t => t.ID !== id));
  const updateProfile = (d: Partial<User>) => setBaseUsers(prev => prev.map(u => u.Email === currentUserEmail ? { ...u, ...d } : u));
  const addUser = (d: Partial<User>) => setBaseUsers(prev => [...prev, { ...d, Senha: '123456', Status: UserStatus.ATIVO } as User]);
  const updateUser = (email: string, d: Partial<User>) => setBaseUsers(prev => prev.map(u => u.Email === email ? { ...u, ...d } : u));
  const resetUserPassword = (email: string) => setBaseUsers(prev => prev.map(u => u.Email === email ? { ...u, Senha: '123456' } : u));
  const toggleUserStatus = (email: string) => setBaseUsers(prev => prev.map(u => u.Email === email ? { ...u, Status: u.Status === UserStatus.ATIVO ? UserStatus.INATIVO : UserStatus.ATIVO } : u));
  const deleteUser = (email: string) => setBaseUsers(prev => prev.filter(u => u.Email !== email));

  return { 
    currentUser, users, tasks, templates, ledger, botLog,
    login, logout, completeTask, auditTask, deleteTask, addTemplate, toggleTemplate, deleteTemplate, 
    generateTaskFromTemplate, updateUser, resetUserPassword, toggleUserStatus, deleteUser, addUser, updateProfile,
    auditAndFixTasks
  };
};
