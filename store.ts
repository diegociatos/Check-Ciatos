
import { useState, useEffect, useCallback } from 'react';
import { User, Task, ScoreLedger, UserRole, TaskStatus, ScoreReason, TaskTemplate } from './types';

// Initial Mock Data
const INITIAL_USERS: User[] = [
  { Email: 'admin@ciatos.com.br', Nome: 'Admin Ciatos', Role: UserRole.ADMIN, Ativo: true, Time: 'Diretoria' },
  { Email: 'gestor@ciatos.com.br', Nome: 'João Gestor', Role: UserRole.GESTOR, Ativo: true, Time: 'Vendas' },
  { Email: 'colaborador@ciatos.com.br', Nome: 'Maria Colaboradora', Role: UserRole.COLABORADOR, Ativo: true, Time: 'Vendas' },
  { Email: 'ti@ciatos.com.br', Nome: 'Carlos TI', Role: UserRole.COLABORADOR, Ativo: true, Time: 'Tecnologia' },
];

const INITIAL_TASKS: Task[] = [
  {
    TaskID: '1',
    Titulo: 'Relatório de Vendas Mensal',
    Descricao: 'Compilar todos os dados de vendas do mês passado.',
    Pontos: 50,
    AssigneeEmail: 'colaborador@ciatos.com.br',
    CreatedByEmail: 'gestor@ciatos.com.br',
    DueDateTime: new Date(Date.now() + 86400000).toISOString(), 
    Status: TaskStatus.PENDENTE,
    RewardApplied: false,
    PenaltyApplied: false
  },
  {
    TaskID: '2',
    Titulo: 'Organização de Arquivos',
    Descricao: 'Limpar a pasta compartilhada do time.',
    Pontos: 20,
    AssigneeEmail: 'colaborador@ciatos.com.br',
    CreatedByEmail: 'gestor@ciatos.com.br',
    DueDateTime: new Date(Date.now() - 3600000).toISOString(), 
    Status: TaskStatus.PENDENTE,
    RewardApplied: false,
    PenaltyApplied: false
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
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ciatos_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('ciatos_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [templates, setTemplates] = useState<TaskTemplate[]>(() => {
    const saved = localStorage.getItem('ciatos_templates');
    return saved ? JSON.parse(saved) : [];
  });

  const [ledger, setLedger] = useState<ScoreLedger[]>(() => {
    const saved = localStorage.getItem('ciatos_ledger');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('ciatos_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    return localStorage.getItem('ciatos_current_user') || 'admin@ciatos.com.br';
  });

  const currentUser = users.find(u => u.Email === currentUserEmail) || users[0];

  useEffect(() => {
    localStorage.setItem('ciatos_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('ciatos_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('ciatos_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('ciatos_ledger', JSON.stringify(ledger));
  }, [ledger]);

  useEffect(() => {
    localStorage.setItem('ciatos_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('ciatos_current_user', currentUserEmail);
  }, [currentUserEmail]);

  // RECURRING TASK GENERATOR BOT
  useEffect(() => {
    const generateRecurringTasks = () => {
      const now = new Date();
      const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const currentWeekday = weekdays[now.getDay()];
      const todayString = now.toDateString();

      setTasks(prevTasks => {
        let changed = false;
        const newGeneratedTasks: Task[] = [];

        templates.forEach(template => {
          if (!template.Ativo) return;

          const days = template.DiasDaSemana.split(',').map(d => d.trim());
          const isToday = days.includes(currentWeekday) || template.DiasDaSemana.toLowerCase() === 'todos';

          if (isToday) {
            // Check if task already generated for this template today
            const alreadyExists = prevTasks.some(t => 
              t.TemplateID === template.TemplateID && 
              new Date(t.DueDateTime).toDateString() === todayString
            );

            if (!alreadyExists) {
              changed = true;
              const due = new Date();
              due.setHours(23, 59, 0, 0); // End of today

              newGeneratedTasks.push({
                TaskID: Math.random().toString(36).substr(2, 9),
                Titulo: `[REC] ${template.Titulo}`,
                Descricao: template.Descricao,
                Pontos: template.Pontos,
                AssigneeEmail: template.AssigneeEmail,
                CreatedByEmail: template.CreatedByEmail,
                DueDateTime: due.toISOString(),
                Status: TaskStatus.PENDENTE,
                RewardApplied: false,
                PenaltyApplied: false,
                TemplateID: template.TemplateID
              });
            }
          }
        });

        return changed ? [...prevTasks, ...newGeneratedTasks] : prevTasks;
      });
    };

    generateRecurringTasks();
    const interval = setInterval(generateRecurringTasks, 60000 * 30); // Check every 30 mins
    return () => clearInterval(interval);
  }, [templates]);

  // BOT 2: Penalidade por Atraso (Automated simulation)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTasks(prevTasks => {
        let changed = false;
        const newTasks = prevTasks.map(task => {
          if (task.Status !== TaskStatus.CONCLUIDA && 
              new Date(task.DueDateTime) < now && 
              !task.PenaltyApplied) {
            changed = true;
            
            const newLedgerEntry: ScoreLedger = {
              LedgerID: Math.random().toString(36).substr(2, 9),
              Email: task.AssigneeEmail,
              TaskID: task.TaskID,
              DataHora: now.toISOString(),
              DeltaPontos: -(task.Pontos * 2),
              Motivo: ScoreReason.PENALIDADE_ATRASO,
              Observacao: `Tarefa '${task.Titulo}' não cumprida no prazo. Penalidade em dobro aplicada.`
            };
            setLedger(prev => [...prev, newLedgerEntry]);

            return { ...task, Status: TaskStatus.ATRASADA, PenaltyApplied: true };
          }
          return task;
        });
        return changed ? newTasks : prevTasks;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // BOT 3: Alerta Vencimento (Daily simulation)
  useEffect(() => {
    const checkAlertaVencimento = () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const alertingTasks = tasks.filter(task => 
        task.Status === TaskStatus.PENDENTE &&
        new Date(task.DueDateTime) >= now &&
        new Date(task.DueDateTime) <= tomorrow
      );

      setNotifications(prev => {
        const newAlerts: Notification[] = [];
        alertingTasks.forEach(task => {
          const alertId = `alert-${task.TaskID}-${now.toDateString()}`;
          if (!prev.find(a => a.id === alertId)) {
            const user = users.find(u => u.Email === task.AssigneeEmail);
            newAlerts.push({
              id: alertId,
              to: task.AssigneeEmail,
              subject: "⚠️ Tarefa vencendo hoje - Grupo Ciatos",
              body: `Olá ${user?.Nome || 'Colaborador'},\n\nA tarefa '${task.Titulo}' vence hoje às ${new Date(task.DueDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.\n\nPontos em jogo: ${task.Pontos}\nLembre-se: o não cumprimento gera perda de ${2*task.Pontos} pontos.\n\nAcesse o app e conclua sua tarefa!`,
              date: now.toISOString()
            });
          }
        });
        return [...newAlerts, ...prev].slice(0, 50);
      });
    };

    checkAlertaVencimento();
    const interval = setInterval(checkAlertaVencimento, 300000); 
    return () => clearInterval(interval);
  }, [tasks, users]);

  const getUserStats = useCallback((email: string) => {
    const userLedger = ledger.filter(l => l.Email === email);
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const pontuacaoTotal = userLedger.reduce((sum, l) => sum + l.DeltaPontos, 0);
    const pontuacaoSemana = userLedger
      .filter(l => new Date(l.DataHora) >= lastWeek)
      .reduce((sum, l) => sum + l.DeltaPontos, 0);
    const pontuacaoMes = userLedger
      .filter(l => {
        const d = new Date(l.DataHora);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, l) => sum + l.DeltaPontos, 0);

    const userTasks = tasks.filter(t => t.AssigneeEmail === email);
    const tarefasPendentes = userTasks.filter(t => t.Status === TaskStatus.PENDENTE).length;
    const tarefasAtrasadas = userTasks.filter(t => t.Status === TaskStatus.ATRASADA).length;

    return {
      pontuacaoTotal,
      pontuacaoSemana,
      pontuacaoMes,
      tarefasPendentes,
      tarefasAtrasadas
    };
  }, [ledger, tasks]);

  const getEnrichedTask = useCallback((task: Task) => {
    const collaborator = users.find(u => u.Email === task.AssigneeEmail);
    const gestor = users.find(u => u.Email === task.CreatedByEmail);
    const now = new Date();
    const due = new Date(task.DueDateTime);
    
    const diffTime = due.getTime() - now.getTime();
    const diasAteVencimento = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let statusCor = "Gray";
    if (task.Status === TaskStatus.CONCLUIDA) {
      statusCor = "Green";
    } else if (task.Status === TaskStatus.ATRASADA) {
      statusCor = "Red";
    } else if (diasAteVencimento <= 1) {
      statusCor = "Orange";
    }

    return {
      ...task,
      NomeColaborador: collaborator?.Nome || 'Desconhecido',
      NomeGestor: gestor?.Nome || 'Desconhecido',
      DiasAteVencimento: diasAteVencimento,
      StatusCor: statusCor
    };
  }, [users]);

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
          RewardApplied: rewardApplied
        };
      }
      return task;
    }));
  }, []);

  const reopenTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.TaskID === taskId) {
        return {
          ...task,
          Status: TaskStatus.PENDENTE,
          CompletedAt: undefined,
          RewardApplied: false,
          PenaltyApplied: false,
          CompletionNote: undefined,
          ProofAttachment: undefined
        };
      }
      return task;
    }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.TaskID !== taskId));
  }, []);

  const addTask = useCallback((taskData: Omit<Task, 'TaskID' | 'Status' | 'RewardApplied' | 'PenaltyApplied'>) => {
    const newTask: Task = {
      ...taskData,
      TaskID: Math.random().toString(36).substr(2, 9),
      Status: TaskStatus.PENDENTE,
      RewardApplied: false,
      PenaltyApplied: false
    };
    setTasks(prev => [...prev, newTask]);
  }, []);

  const addTemplate = useCallback((templateData: Omit<TaskTemplate, 'TemplateID'>) => {
    const newTemplate: TaskTemplate = {
      ...templateData,
      TemplateID: Math.random().toString(36).substr(2, 9),
    };
    setTemplates(prev => [...prev, newTemplate]);
  }, []);

  const updateTemplate = useCallback((templateId: string, updates: Partial<TaskTemplate>) => {
    setTemplates(prev => prev.map(t => t.TemplateID === templateId ? { ...t, ...updates } : t));
  }, []);

  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates(prev => prev.filter(t => t.TemplateID !== templateId));
  }, []);

  const updatePointsManually = useCallback((email: string, points: number, obs: string) => {
    const newLedgerEntry: ScoreLedger = {
      LedgerID: Math.random().toString(36).substr(2, 9),
      Email: email,
      TaskID: 'MANUAL',
      DataHora: new Date().toISOString(),
      DeltaPontos: points,
      Motivo: ScoreReason.AJUSTE_MANUAL,
      Observacao: obs
    };
    setLedger(prev => [...prev, newLedgerEntry]);
  }, []);

  return {
    users,
    tasks,
    templates,
    ledger,
    notifications,
    currentUser,
    setCurrentUserEmail,
    completeTask,
    reopenTask,
    deleteTask,
    addTask,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    updatePointsManually,
    getUserStats,
    getEnrichedTask,
    setUsers
  };
};
