import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Task, ScoreLedger, UserRole, TaskStatus, UserStatus, TaskPriority, ConferenciaStatus, ScoreType, TaskTemplate, RecurrenceType, BotLog, Empresa } from './types';
import { authApi, tasksApi, templatesApi, ledgerApi, empresasApi, emailApi } from './services/api';
import { supabase } from './lib/supabase';
import { gerarNotificacoes } from './lib/notifications';

// Funções utilitárias exportadas
export const getTodayStr = () => {
  const now = new Date();
  return now.toLocaleDateString('en-CA');
};

export const toDateOnly = (dateStr: string): string => {
  if (!dateStr) return '';
  // Se já é formato YYYY-MM-DD, retorna direto (evita bug de timezone)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // Para strings ISO com 'T', extrai apenas a parte da data
  if (dateStr.includes('T')) return dateStr.split('T')[0];
  // Fallback: usa meio-dia para evitar problemas de timezone
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-CA');
};

const getLocalTodayStr = () => {
  const now = new Date();
  return now.toLocaleDateString('en-CA');
};

// Normaliza Role para o formato do frontend
const normalizeRole = (role: string): UserRole => {
  const upper = role?.toUpperCase();
  if (upper === 'PLATAFORMA') return UserRole.PLATAFORMA;
  if (upper === 'MASTER') return UserRole.MASTER;
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
  const [botLog, setBotLog] = useState<BotLog[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [activeEmpresa, setActiveEmpresa] = useState<string | null>(null);
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
        const [usersData, tasksData, templatesData, ledgerData, empresasData] = await Promise.all([
          authApi.getUsers().catch(() => []),
          tasksApi.getAll().catch(() => []),
          templatesApi.getAll().catch(() => []),
          ledgerApi.getAll().catch(() => []),
          empresasApi.getAll().catch(() => []),
        ]);

        setEmpresas(empresasData as Empresa[]);

        // Normalizar usuários
        setBaseUsers(usersData.map((u: any) => ({
          Email: u.Email,
          Nome: u.Nome,
          Role: normalizeRole(u.Role),
          Status: normalizeUserStatus(u.Status),
          Time: u.Time,
          Gestor: u.Gestor,
          Foto: u.Foto,
          Telefone: u.Telefone,
          DataNascimento: u.DataNascimento,
          Endereco: u.Endereco,
          Bio: u.Bio,
          SenhaProvisoria: u.SenhaProvisoria,
          DataCriacao: u.DataCriacao,
          UltimoAcesso: u.UltimoAcesso,
          TentativasFalhadas: u.TentativasFalhadas || 0,
          empresa_id: u.empresa_id,
        })));

        // Normalizar tarefas
        setTasks(tasksData.map((t: any) => ({
          ID: t.ID,
          TemplateID: t.TemplateID,
          Titulo: t.Titulo,
          Descricao: t.Descricao,
          Responsavel: t.Responsavel,
          DataLimite: t.DataLimite,
          DataLimite_Date: t.DataLimite ? t.DataLimite.split('T')[0] : undefined,
          Prioridade: t.Prioridade || TaskPriority.MEDIA,
          PontosValor: t.PontosValor ?? 10,
          Status: normalizeTaskStatus(t.Status),
          DataConclusao: t.DataConclusao,
          CompletionNote: t.CompletionNote,
          ProofAttachment: t.ProofAttachment,
          ConferenciaStatus: t.ConferenciaStatus,
          ObservacaoGestor: t.ObservacaoGestor,
          JustificativaGestor: t.ObservacaoGestor,
          Tentativas: t.Tentativas || 0,
          DataGeracao: t.DataGeracao || '',
          DataCriacao: t.DataCriacao || '',
          empresa_id: t.empresa_id,
          Pessoal: !!t.Pessoal,
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
          PularFinalDeSemana: t.PularFinalDeSemana || false,
          Ativa: t.Ativa,
          UltimaExecucao: t.UltimaExecucao,
          empresa_id: t.empresa_id,
        })));

        // Normalizar ledger
        setLedger(ledgerData.map((l: any) => ({
          ID: l.ID,
          UserEmail: l.UserEmail,
          Data: l.Data,
          Pontos: l.Pontos,
          Tipo: l.Tipo === 'GANHO' ? ScoreType.GANHO : ScoreType.PENALIDADE,
          Descricao: l.Descricao,
          empresa_id: l.empresa_id,
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

  // ===== Contexto multi-empresa =====
  // A plataforma (dono do sistema) enxerga todas as empresas; ao "entrar" numa empresa,
  // os dados são filtrados por ela. Os demais papéis já vêm isolados pela RLS.
  const rawCurrentUser = useMemo(
    () => baseUsers.find(u => u.Email === currentUserEmail) || null,
    [baseUsers, currentUserEmail]
  );
  const isPlataforma = rawCurrentUser?.Role === UserRole.PLATAFORMA;

  // Define a empresa ativa automaticamente para quem não é plataforma (pula suspensas)
  useEffect(() => {
    if (rawCurrentUser && rawCurrentUser.Role !== UserRole.PLATAFORMA) {
      const ativas = empresas.filter(e => (e.Status || 'Ativa') !== 'Suspensa');
      const home = rawCurrentUser.empresa_id || null;
      const homeAtiva = ativas.some(e => e.id === home);
      setActiveEmpresa(homeAtiva ? home : (ativas[0]?.id ?? home));
    }
  }, [rawCurrentUser, empresas]);

  // Escopo por empresa ativa vale para todos (single-empresa é no-op; multi-empresa alterna).
  const emScopo = (empresaId?: string) => !activeEmpresa || empresaId === activeEmpresa;
  const scopedBaseUsers = useMemo(() => baseUsers.filter(u => emScopo(u.empresa_id)), [baseUsers, isPlataforma, activeEmpresa]);
  const scopedTasks = useMemo(() => tasks.filter(t => emScopo(t.empresa_id)), [tasks, isPlataforma, activeEmpresa]);
  const scopedTemplates = useMemo(() => templates.filter(t => emScopo(t.empresa_id)), [templates, isPlataforma, activeEmpresa]);
  const scopedLedger = useMemo(() => ledger.filter(l => emScopo(l.empresa_id)), [ledger, isPlataforma, activeEmpresa]);
  const empresaAtual = useMemo(() => empresas.find(e => e.id === activeEmpresa) || null, [empresas, activeEmpresa]);

  // Calcula usuários com métricas (dentro da empresa em escopo)
  const users = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return scopedBaseUsers.map(u => {
      const userTasks = scopedTasks.filter(t => {
        const d = new Date(t.DataLimite);
        return t.Responsavel === u.Email && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const userLedger = scopedLedger.filter(l => {
        const d = new Date(l.Data);
        return l.UserEmail === u.Email && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const pontosRealizadosMes = userLedger.reduce((sum, l) => sum + l.Pontos, 0);
      const pontosPossiveisMes = userTasks.reduce((sum, t) => sum + t.PontosValor, 0);
      const eficienciaMes = pontosPossiveisMes > 0 ? (pontosRealizadosMes / pontosPossiveisMes) * 100 : 0;
      
      const conferidas = userTasks.filter(t => t.Status === TaskStatus.APROVADA).length;
      const confiabilidade = userTasks.length > 0 ? (conferidas / userTasks.length) * 100 : 0;

      const hasOverdue = scopedTasks.some(t =>
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
  }, [scopedBaseUsers, scopedTasks, scopedLedger]);

  // currentUser vem da lista completa (a plataforma não pode ser filtrada pra fora ao entrar noutra empresa)
  const currentUser = useMemo(
    () => users.find(u => u.Email === currentUserEmail) || rawCurrentUser,
    [users, rawCurrentUser, currentUserEmail]
  );
  const minhasTarefas = useMemo(() => scopedTasks.filter(t => t.Responsavel === currentUserEmail), [scopedTasks, currentUserEmail]);

  // ==================== NOTIFICAÇÕES ====================
  const isManager = currentUser
    ? [UserRole.ADMIN, UserRole.PLATAFORMA, UserRole.MASTER, UserRole.GESTOR].includes(currentUser.Role)
    : false;
  const notifications = useMemo(
    () => gerarNotificacoes(currentUser, scopedTasks, isManager),
    [currentUser, scopedTasks, isManager]
  );
  const [notifLidas, setNotifLidas] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!currentUserEmail) { setNotifLidas(new Set()); return; }
    try {
      setNotifLidas(new Set(JSON.parse(localStorage.getItem('ciatos_notif_' + currentUserEmail) || '[]')));
    } catch { setNotifLidas(new Set()); }
  }, [currentUserEmail]);
  const notifNaoLidas = useMemo(() => notifications.filter(n => !notifLidas.has(n.id)).length, [notifications, notifLidas]);
  const marcarNotificacoesLidas = useCallback(() => {
    if (!currentUserEmail) return;
    setNotifLidas(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      try { localStorage.setItem('ciatos_notif_' + currentUserEmail, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, [notifications, currentUserEmail]);

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

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUserEmail(null);
  }, []);

  // Sincroniza a sessão do Supabase com o email atual (cobre refresh e logout em outra aba)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email;
      if (email) setCurrentUserEmail(prev => prev ?? email);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setCurrentUserEmail(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const changePassword = useCallback(async (email: string, oldPass: string, newPass: string) => {
    await authApi.changePassword(email, oldPass, newPass);
    setBaseUsers(prev => prev.map(u =>
      u.Email === email ? { ...u, SenhaProvisoria: false } : u
    ));
  }, []);

  // Primeiro acesso: usuário troca a senha provisória (usa a sessão já ativa).
  const definirNovaSenha = useCallback(async (novaSenha: string) => {
    await authApi.definirNovaSenha(novaSenha);
    setBaseUsers(prev => prev.map(u =>
      u.Email === currentUserEmail ? { ...u, SenhaProvisoria: false } : u
    ));
  }, [currentUserEmail]);

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
        empresa_id: userData.empresa_id || activeEmpresa, // cria na empresa aberta
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
  }, [activeEmpresa]);

  const updateUser = useCallback(async (email: string, updatedData: Partial<User>) => {
    try {
      await authApi.updateUser(email, updatedData);
      setBaseUsers(prev => prev.map(u => u.Email === email ? { ...u, ...updatedData } : u));
    } catch (err: any) {
      // Fallback local
      setBaseUsers(prev => prev.map(u => u.Email === email ? { ...u, ...updatedData } : u));
    }
  }, []);

  // Alterar e-mail (chave do usuário) — renomeia no Auth + todas as tabelas.
  // Se for o próprio usuário logado, desloga para relogar com o novo e-mail.
  const changeUserEmail = useCallback(async (email: string, novoEmail: string) => {
    await authApi.changeEmail(email, novoEmail);
    if (currentUserEmail?.toLowerCase() === email.toLowerCase()) {
      await logout();
      return { relogar: true };
    }
    setBaseUsers(prev => prev.map(u => {
      if (u.Email.toLowerCase() === email.toLowerCase()) return { ...u, Email: novoEmail };
      if (u.Gestor?.toLowerCase() === email.toLowerCase()) return { ...u, Gestor: novoEmail };
      return u;
    }));
    return { relogar: false };
  }, [currentUserEmail, logout]);

  const updateProfile = useCallback(async (updatedData: Partial<User>) => {
    if (currentUserEmail) {
      await updateUser(currentUserEmail, updatedData);
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
      // Em reprovações, envia o novo prazo para o backend persistir no DataLimite
      const novaDataLimite = status !== TaskStatus.APROVADA ? (nextDeadline || null) : null;
      const result = await tasksApi.audit(taskId, apiStatus, justification, novaDataLimite);

      // Atualiza local (usa o prazo confirmado pelo backend quando houver)
      setTasks(prev => prev.map(t => {
        if (t.ID === taskId) {
          const newDataLimite = (result as any)?.dataLimite || nextDeadline || t.DataLimite;
          return { 
            ...t, 
            Status: status, 
            JustificativaGestor: justification,
            DataLimite: newDataLimite,
            DataLimite_Date: newDataLimite ? newDataLimite.split('T')[0] : t.DataLimite_Date,
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
            delta = -Math.ceil(t.PontosValor * 0.5);
            motive = `Pena – Erro: ${t.Titulo}`;
            type = ScoreType.PENALIDADE;
          } else if (status === TaskStatus.NAO_FEITA) {
            delta = -(t.PontosValor);
            motive = `Penalidade – Não Concluída: ${t.Titulo}`;
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
            DataLimite_Date: nextDeadline ? nextDeadline.split('T')[0] : t.DataLimite_Date,
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
        PularFinalDeSemana: templateData.PularFinalDeSemana,
        CriadoPor: currentUserEmail,
        empresa_id: activeEmpresa, // cria o modelo na empresa que está aberta (não a "casa")
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
  }, [currentUserEmail, activeEmpresa]);

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

  const updateTemplate = useCallback(async (id: string, data: Omit<TaskTemplate, 'ID'>) => {
    // Edita o modelo (ex.: corrigir pontos/prazo). Não altera empresa_id nem tarefas já geradas.
    await templatesApi.update(id, {
      Titulo: data.Titulo,
      Descricao: data.Descricao,
      Responsavel: data.Responsavel,
      Prioridade: data.Prioridade,
      PontosValor: data.PontosValor,
      Recorrencia: data.Recorrencia,
      DiasRecorrencia: data.DiasRecorrencia,
      DiaDoMes: data.DiaDoMes,
      DataInicio: data.DataInicio,
      PularFinalDeSemana: data.PularFinalDeSemana,
      Ativa: data.Ativa,
    });
    setTemplates(prev => prev.map(t => (t.ID === id ? { ...t, ...data } : t)));
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
          DataLimite_Date: result.task.DataLimite ? result.task.DataLimite.split('T')[0] : undefined,
          Status: TaskStatus.PENDENTE,
          Tentativas: 0,
        }]);

        // Notifica o responsável por e-mail (não bloqueia)
        const resp = result.task.Responsavel;
        const nome = baseUsers.find(u => u.Email === resp)?.Nome;
        emailApi.notificarNovaTarefa({
          to: resp,
          nome,
          titulo: result.task.Titulo,
          prazo: result.task.DataLimite,
          empresa: empresas.find(e => e.id === result.task.empresa_id)?.Nome,
        });
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
      const nowIso = new Date().toISOString();
      
      const newTask: Task = {
        ID: Math.random().toString(36).substr(2, 9),
        TemplateID: tmpl.ID,
        Titulo: tmpl.Titulo,
        Descricao: tmpl.Descricao,
        Responsavel: tmpl.Responsavel,
        DataLimite: dueDateTime.toISOString(),
        DataLimite_Date: dueDateTime.toISOString().split('T')[0],
        DataGeracao: nowIso,
        DataCriacao: nowIso,
        Prioridade: tmpl.Prioridade,
        PontosValor: tmpl.PontosValor,
        Status: TaskStatus.PENDENTE,
        Tentativas: 0
      };
      
      setTasks(prev => [...prev, newTask]);
      return true;
    }
  }, [templates, tasks, baseUsers, empresas]);

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
        DataLimite_Date: t.DataLimite ? t.DataLimite.split('T')[0] : undefined,
        Prioridade: t.Prioridade || TaskPriority.MEDIA,
        PontosValor: t.PontosValor ?? 10,
        Status: normalizeTaskStatus(t.Status),
        DataConclusao: t.DataConclusao,
        CompletionNote: t.CompletionNote,
        ProofAttachment: t.ProofAttachment,
        ConferenciaStatus: t.ConferenciaStatus,
        ObservacaoGestor: t.ObservacaoGestor,
        Tentativas: t.Tentativas || 0,
        empresa_id: t.empresa_id,
        Pessoal: !!t.Pessoal,
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

  // ==================== TAREFAS PESSOAIS ====================
  // Colaborador cria/gerencia as próprias (0 pt); só o master valora.
  const criarTarefaPessoal = useCallback(async (titulo: string, descricao?: string, dataLimite?: string) => {
    const novo = await tasksApi.criarPessoal(titulo, descricao, dataLimite);
    if (novo) {
      setTasks(prev => [...prev, {
        ID: novo.ID,
        Titulo: novo.Titulo,
        Descricao: novo.Descricao,
        Responsavel: novo.Responsavel,
        DataLimite: novo.DataLimite,
        DataLimite_Date: novo.DataLimite ? novo.DataLimite.split('T')[0] : undefined,
        Prioridade: novo.Prioridade || TaskPriority.MEDIA,
        PontosValor: novo.PontosValor ?? 0,
        Status: normalizeTaskStatus(novo.Status),
        Tentativas: 0,
        DataGeracao: novo.DataGeracao || '',
        DataCriacao: novo.DataCriacao || '',
        empresa_id: novo.empresa_id,
        Pessoal: true,
      } as Task]);
    }
    return novo;
  }, []);

  const concluirTarefaPessoal = useCallback(async (taskId: string) => {
    await tasksApi.concluirPessoal(taskId);
    setTasks(prev => prev.map(t => t.ID === taskId
      ? { ...t, Status: TaskStatus.APROVADA, DataConclusao: new Date().toISOString() } : t));
  }, []);

  const reabrirTarefaPessoal = useCallback(async (taskId: string) => {
    await tasksApi.reabrirPessoal(taskId);
    setTasks(prev => prev.map(t => t.ID === taskId
      ? { ...t, Status: TaskStatus.PENDENTE, DataConclusao: undefined } : t));
  }, []);

  const excluirTarefaPessoal = useCallback(async (taskId: string) => {
    await tasksApi.excluirPessoal(taskId);
    setTasks(prev => prev.filter(t => t.ID !== taskId));
  }, []);

  const valorarTarefaPessoal = useCallback(async (taskId: string, pontos: number, obs?: string) => {
    await tasksApi.valorarPessoal(taskId, pontos, obs);
    setTasks(prev => prev.map(t => t.ID === taskId
      ? { ...t, PontosValor: pontos, Status: TaskStatus.APROVADA, ObservacaoGestor: obs } : t));
    await refreshData(); // reflete os pontos no extrato/relatórios/ranking
  }, [refreshData]);

  // Função para auditoria e correção de tarefas (para o BotHistoryView)
  const auditAndFixTasks = useCallback(async () => {
    console.log('🤖 Iniciando auditoria de tarefas...');
    const today = getTodayStr();
    let fixedCount = 0;
    
    // Verificar tarefas atrasadas
    const overdueTasks = tasks.filter(t => 
      t.Status === TaskStatus.PENDENTE && 
      t.DataLimite < today
    );
    
    for (const task of overdueTasks) {
      console.log(`⚠️ Tarefa atrasada encontrada: ${task.Titulo}`);
      fixedCount++;
    }
    
    // Adicionar log de auditoria
    const logEntry: BotLog = {
      ID: `log-${Date.now()}`,
      ModeloId: 'audit',
      TaskID: '',
      Responsavel: currentUserEmail || '',
      DataLimite: today,
      Timestamp: new Date().toISOString(),
      Status: 'SUCCESS',
      TemplateTitle: 'Auditoria Automática',
      RowsAdded: fixedCount,
      GeneratedIDs: [],
      Resultado: `Auditoria concluída. ${overdueTasks.length} tarefas atrasadas encontradas.`
    };
    
    setBotLog(prev => [logEntry, ...prev]);
    await refreshData();

    return { overdueTasks: overdueTasks.length, fixed: fixedCount };
  }, [tasks, currentUserEmail, refreshData]);

  // ==================== EMPRESAS (plataforma) ====================
  const createEmpresa = useCallback(async (
    nome: string,
    plano: string,
    master: { nome: string; email: string }
  ) => {
    const emp = await empresasApi.create(nome, plano);
    await authApi.createUser({
      Email: master.email, Nome: master.nome, Role: UserRole.MASTER, empresa_id: emp.id,
    });
    const list = await empresasApi.getAll().catch(() => []);
    setEmpresas(list as Empresa[]);
    return emp;
  }, []);

  // Master concede/ajusta a quais empresas (dele) um usuário tem acesso
  const setUserEmpresas = useCallback(async (email: string, empresasIds: string[]) => {
    await authApi.setEmpresas(email, empresasIds);
  }, []);
  const getUserEmpresas = useCallback((email: string) => authApi.getEmpresasDoUsuario(email), []);

  // Plataforma: suspender/reativar e excluir empresa
  const suspenderEmpresa = useCallback(async (id: string, suspender: boolean) => {
    await empresasApi.setStatus(id, suspender ? 'Suspensa' : 'Ativa');
    setEmpresas(prev => prev.map(e => e.id === id ? { ...e, Status: suspender ? 'Suspensa' : 'Ativa' } : e));
  }, []);
  const excluirEmpresa = useCallback(async (id: string) => {
    await empresasApi.remove(id);
    setEmpresas(prev => prev.filter(e => e.id !== id));
  }, []);

  return {
    currentUser, users,
    tasks: scopedTasks, templates: scopedTemplates, ledger: scopedLedger,
    minhasTarefas, botLog,
    empresas, activeEmpresa, setActiveEmpresa, empresaAtual, isPlataforma, createEmpresa,
    setUserEmpresas, getUserEmpresas, suspenderEmpresa, excluirEmpresa,
    notifications, notifNaoLidas, marcarNotificacoesLidas,
    loading, error, refreshData, auditAndFixTasks,
    login, logout, changePassword, definirNovaSenha, resetUserPassword, toggleUserStatus, deleteUser, addUser, updateUser, changeUserEmail,
    updateProfile, completeTask, auditTask, deleteTask,
    addTemplate, updateTemplate, toggleTemplate, deleteTemplate, generateTaskFromTemplate,
    criarTarefaPessoal, concluirTarefaPessoal, reabrirTarefaPessoal, excluirTarefaPessoal, valorarTarefaPessoal
  };
};
