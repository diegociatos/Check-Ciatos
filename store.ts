
import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Task, ScoreLedger, UserRole, TaskStatus, UserStatus, TaskPriority, ConferenciaStatus, ScoreType, UserCredentials, TaskTemplate, RecurrenceType } from './types';

// Helper para obter a data local no formato YYYY-MM-DD
const getLocalTodayStr = () => {
  const now = new Date();
  return now.toLocaleDateString('en-CA'); // Retorna YYYY-MM-DD no fuso local
};

export interface Notification {
  id: string;
  to: string;
  subject: string;
  body: string;
  date: string;
}

const INITIAL_USERS: User[] = [
  { Email: 'diego.garcia@grupociatos.com.br', Nome: 'Diego Garcia', Role: UserRole.GESTOR, Status: UserStatus.ATIVO, Time: 'Gestão' },
  { Email: 'controladoria@grupociatos.com.br', Nome: 'Controladoria', Role: UserRole.GESTOR, Status: UserStatus.ATIVO, Time: 'Controladoria' },
  { Email: 'financeiro@grupociatos.com.br', Nome: 'Financeiro', Role: UserRole.COLABORADOR, Status: UserStatus.ATIVO, Time: 'Financeiro' }
];

const INITIAL_CREDENTIALS: UserCredentials[] = [
  { Email: 'diego.garcia@grupociatos.com.br', Senha: '250500', TentativasFalhadas: 0 },
  { Email: 'controladoria@grupociatos.com.br', Senha: '123456', TentativasFalhadas: 0 },
  { Email: 'financeiro@grupociatos.com.br', Senha: '123456', TentativasFalhadas: 0 }
];

const INITIAL_TEMPLATES: TaskTemplate[] = [
  {
    ID: 'tmpl-1',
    Titulo: 'Conciliação Bancária Diária',
    Descricao: 'Realizar a conferência dos extratos bancários.',
    Responsavel: 'financeiro@grupociatos.com.br',
    PontosValor: 50,
    Prioridade: TaskPriority.ALTA,
    Recorrencia: RecurrenceType.DIARIA,
    DiasRecorrencia: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
    DataInicio: getLocalTodayStr(),
    Ativa: true
  }
];

export const useStore = () => {
  const [baseUsers, setBaseUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ciatos_users_v3');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('ciatos_tasks_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [templates, setTemplates] = useState<TaskTemplate[]>(() => {
    const saved = localStorage.getItem('ciatos_templates_v3');
    return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
  });

  const [ledger, setLedger] = useState<ScoreLedger[]>(() => {
    const saved = localStorage.getItem('ciatos_ledger_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [credentials, setCredentials] = useState<UserCredentials[]>(() => {
    const saved = localStorage.getItem('ciatos_credentials_v3');
    return saved ? JSON.parse(saved) : INITIAL_CREDENTIALS;
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

  useEffect(() => localStorage.setItem('ciatos_users_v3', JSON.stringify(baseUsers)), [baseUsers]);
  useEffect(() => localStorage.setItem('ciatos_tasks_v3', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('ciatos_templates_v3', JSON.stringify(templates)), [templates]);
  useEffect(() => localStorage.setItem('ciatos_ledger_v3', JSON.stringify(ledger)), [ledger]);
  useEffect(() => localStorage.setItem('ciatos_credentials_v3', JSON.stringify(credentials)), [credentials]);
  useEffect(() => {
    if (currentUserEmail) localStorage.setItem('ciatos_current_user', currentUserEmail);
    else localStorage.removeItem('ciatos_current_user');
  }, [currentUserEmail]);

  // Automação "Bot": Gerar Tarefas Recorrentes (Sem restrições de finais de semana)
  useEffect(() => {
    const runRecurrenceAutomationBot = () => {
      const now = new Date();
      const todayStr = getLocalTodayStr();
      const dayOfWeekNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
      const todayDayName = dayOfWeekNames[now.getDay()];
      const todayDayOfMonth = now.getDate();

      let templatesUpdated = false;
      const updatedTemplates = [...templates];
      const newTasks: Task[] = [];

      updatedTemplates.forEach((tmpl, index) => {
        if (!tmpl.Ativa || todayStr < tmpl.DataInicio) return;

        let shouldCreateToday = false;
        if (tmpl.Recorrencia === RecurrenceType.DIARIA) {
          shouldCreateToday = true; // Gera TODOS os dias, inclusive sáb/dom
        } else if (tmpl.Recorrencia === RecurrenceType.SEMANAL) {
          if (tmpl.DiasRecorrencia.includes(todayDayName)) shouldCreateToday = true;
        } else if (tmpl.Recorrencia === RecurrenceType.MENSAL) {
          if (tmpl.DiaDoMes === todayDayOfMonth) shouldCreateToday = true;
        }

        if (shouldCreateToday) {
          const alreadyExists = tasks.some(t => 
            t.Titulo === tmpl.Titulo && 
            t.Responsavel === tmpl.Responsavel &&
            new Date(t.DataLimite).toLocaleDateString('en-CA') === todayStr
          );

          if (!alreadyExists) {
            const dueDateTime = new Date();
            dueDateTime.setHours(23, 59, 59, 999);
            
            newTasks.push({
              ID: Math.random().toString(36).substr(2, 9),
              TemplateID: tmpl.ID,
              Titulo: tmpl.Titulo,
              Descricao: tmpl.Descricao,
              Responsavel: tmpl.Responsavel,
              DataLimite: dueDateTime.toISOString(),
              Prioridade: tmpl.Prioridade,
              PontosValor: tmpl.PontosValor,
              Status: TaskStatus.PENDENTE
            });

            updatedTemplates[index] = { ...tmpl, UltimaExecucao: now.toISOString() };
            templatesUpdated = true;
          }
        }
      });

      if (newTasks.length > 0) {
        setTasks(prev => [...prev, ...newTasks]);
      }
      
      if (templatesUpdated) {
        setTemplates(updatedTemplates);
      }
    };

    runRecurrenceAutomationBot();
  }, [templates.length]);

  const login = useCallback((email: string, senha?: string) => {
    const user = users.find(u => u.Email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error("Usuário não encontrado.");
    setCurrentUserEmail(user.Email);
    return user;
  }, [users]);

  const logout = useCallback(() => setCurrentUserEmail(null), []);
  const updateProfile = useCallback((updatedData: Partial<User>) => {
    setBaseUsers(prev => prev.map(u => u.Email === currentUserEmail ? { ...u, ...updatedData } : u));
  }, [currentUserEmail]);

  const completeTask = useCallback((taskId: string, note: string, proof?: string) => {
    setTasks(prev => prev.map(t => (t.ID === taskId ? { ...t, Status: TaskStatus.CONCLUIDO, DataConclusao: new Date().toISOString(), CompletionNote: note, ProofAttachment: proof } : t)));
  }, []);

  const auditTask = useCallback((taskId: string, status: ConferenciaStatus, observation: string) => {
    setTasks(prev => prev.map(t => {
      if (t.ID === taskId) {
        let delta = 0;
        let motive = "";
        if (status === ConferenciaStatus.APROVADO) { delta = t.PontosValor; motive = `Aprovação: ${t.Titulo}`; }
        else if (status === ConferenciaStatus.NAO_CUMPRIU) { delta = -5 * t.PontosValor; motive = `Não Cumpre: ${t.Titulo}`; }
        else { delta = -3 * t.PontosValor; motive = `Erro Execução: ${t.Titulo}`; }

        setLedger(prev => [...prev, { ID: Math.random().toString(36).substr(2, 9), UserEmail: t.Responsavel, Data: new Date().toISOString(), Pontos: delta, Tipo: delta >= 0 ? ScoreType.GANHO : ScoreType.PENALIDADE, Descricao: motive }]);
        return { ...t, Status: TaskStatus.CONFERIDO, ConferenciaStatus: status, ObservacaoGestor: observation };
      }
      return t;
    }));
  }, []);

  const addTemplate = useCallback((templateData: Omit<TaskTemplate, 'ID'>) => {
    setTemplates(prev => [...prev, { ...templateData, ID: Math.random().toString(36).substr(2, 9) }]);
  }, []);

  const toggleTemplate = useCallback((id: string) => setTemplates(prev => prev.map(t => t.ID === id ? { ...t, Ativa: !t.Ativa } : t)), []);
  const deleteTemplate = useCallback((id: string) => setTemplates(prev => prev.filter(t => t.ID !== id)), []);

  const generateTaskFromTemplate = useCallback((templateId: string) => {
    const tmpl = templates.find(t => t.ID === templateId);
    if (!tmpl) return;

    const now = new Date();
    const dueDateTime = new Date(); // Hoje (Local)
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
      Status: TaskStatus.PENDENTE
    };

    setTasks(prev => [...prev, newTask]);
    setTemplates(prev => prev.map(t => t.ID === templateId ? { ...t, UltimaExecucao: now.toISOString() } : t));
    alert(`Tarefa "${tmpl.Titulo}" gerada manualmente para HOJE (${dueDateTime.toLocaleDateString('pt-BR')}).`);
  }, [templates]);

  return { 
    currentUser, users, tasks, templates, ledger, minhasTarefas, 
    login, logout, updateProfile, completeTask, auditTask, 
    addTemplate, toggleTemplate, deleteTemplate, generateTaskFromTemplate 
  };
};
