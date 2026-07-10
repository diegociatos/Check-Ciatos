import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Task, ScoreLedger, UserRole, TaskStatus, UserStatus, TaskPriority, ConferenciaStatus, ScoreType, TaskTemplate, RecurrenceType, BotLog, Empresa, BonusRules, DEFAULT_BONUS_RULES, MonthlyClosing } from './types';
import { authApi, tasksApi, templatesApi, ledgerApi, empresasApi, bonusRulesApi, monthlyClosingsApi, emailApi } from './services/api';
import { supabase } from './lib/supabase';
import { gerarNotificacoes } from './lib/notifications';
import { showToast } from './components/ui';

// Padrão único de ação de backend: executa a chamada e, em falha, AVISA o usuário
// (toast) e relança o erro. NUNCA atualiza estado local aqui — o chamador só reflete
// na UI após o sucesso (ou faz update otimista com rollback próprio). Evita a antiga
// prática de "simular sucesso" no catch, que dessincronizava a tela do banco.
async function acaoBackend<T>(fn: () => Promise<T>, msgErro: string): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    showToast({ message: e?.message || msgErro, tone: 'erro' });
    throw e;
  }
}

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

// Normaliza uma linha de bonus_rules do backend, preenchendo com defaults o que faltar.
const normalizeBonusRules = (r: any): BonusRules => ({
  empresa_id: r.empresa_id,
  eficiencia_minima: r.eficiencia_minima ?? DEFAULT_BONUS_RULES.eficiencia_minima,
  bonus_tipo: r.bonus_tipo === 'FIXO' ? 'FIXO' : 'PERCENTUAL',
  bonus_valor: r.bonus_valor ?? DEFAULT_BONUS_RULES.bonus_valor,
  bonus_com_atraso: !!r.bonus_com_atraso,
  peso_prioridade: (r.peso_prioridade && typeof r.peso_prioridade === 'object')
    ? r.peso_prioridade : DEFAULT_BONUS_RULES.peso_prioridade,
  reentrega_fator: r.reentrega_fator ?? DEFAULT_BONUS_RULES.reentrega_fator,
  pessoal_valorada: r.pessoal_valorada ?? DEFAULT_BONUS_RULES.pessoal_valorada,
  fechamento_dia: r.fechamento_dia ?? DEFAULT_BONUS_RULES.fechamento_dia,
});

export const useStore = () => {
  const [baseUsers, setBaseUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [ledger, setLedger] = useState<ScoreLedger[]>([]);
  const [botLog, setBotLog] = useState<BotLog[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [bonusRulesAll, setBonusRulesAll] = useState<BonusRules[]>([]);
  const [closingsAll, setClosingsAll] = useState<MonthlyClosing[]>([]);
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
        const [usersData, tasksData, templatesData, ledgerData, empresasData, bonusRulesData, closingsData] = await Promise.all([
          authApi.getUsers().catch(() => []),
          tasksApi.getAll().catch(() => []),
          templatesApi.getAll().catch(() => []),
          ledgerApi.getAll().catch(() => []),
          empresasApi.getAll().catch(() => []),
          bonusRulesApi.getAll().catch(() => []),
          monthlyClosingsApi.getAll().catch(() => []),
        ]);

        setEmpresas(empresasData as Empresa[]);
        setBonusRulesAll((bonusRulesData as any[]).map(normalizeBonusRules));
        setClosingsAll(closingsData as MonthlyClosing[]);

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
          Andamento: t.Andamento || 'Pendente',
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

  // Regras de bonificação da empresa ativa (ou defaults, se ainda não configurada).
  const bonusRules = useMemo<BonusRules>(
    () => bonusRulesAll.find(r => r.empresa_id === activeEmpresa) ?? DEFAULT_BONUS_RULES,
    [bonusRulesAll, activeEmpresa]
  );

  // Fechamentos mensais da empresa em escopo.
  const closings = useMemo(() => closingsAll.filter(c => emScopo(c.empresa_id)), [closingsAll, activeEmpresa]);

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
        StatusRH: eficienciaMes >= bonusRules.eficiencia_minima ? '💰 ELEGÍVEL PARA BÔNUS' : '✅ DESEMPENHO ADEQUADO'
      };
    });
  }, [scopedBaseUsers, scopedTasks, scopedLedger, bonusRules]);

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
    const res = await acaoBackend(() => authApi.resetPassword(email), 'Erro ao resetar senha');
    setBaseUsers(prev => prev.map(u =>
      u.Email === email ? { ...u, SenhaProvisoria: true, Status: UserStatus.ATIVO, TentativasFalhadas: 0 } : u
    ));
    return res; // { message, invited, inviteLink }
  }, []);

  const toggleUserStatus = useCallback(async (email: string) => {
    // Só reflete na UI após o backend confirmar (sem fallback que "simula" a troca).
    await acaoBackend(() => authApi.toggleStatus(email), 'Não foi possível alterar o status.');
    setBaseUsers(prev => prev.map(u =>
      u.Email === email ? { ...u, Status: u.Status === UserStatus.ATIVO ? UserStatus.INATIVO : UserStatus.ATIVO } : u
    ));
  }, []);

  const deleteUser = useCallback(async (email: string) => {
    if (!window.confirm(`Deletar ${email}?`)) return;
    // Ação crítica: remove da UI SOMENTE após o backend confirmar a exclusão.
    await acaoBackend(() => authApi.deleteUser(email), 'Não foi possível excluir o usuário.');
    setBaseUsers(prev => prev.filter(u => u.Email !== email));
  }, []);

  const addUser = useCallback(async (userData: Partial<User>) => {
    const res = await acaoBackend(() => authApi.createUser({
      Email: userData.Email,
      Nome: userData.Nome,
      Role: userData.Role,
      Time: userData.Time,
      Gestor: userData.Gestor,
      empresa_id: userData.empresa_id || activeEmpresa, // cria na empresa aberta
    }), 'Erro ao criar usuário');

    const novo = (res as any).user;
    if (novo) {
      setBaseUsers(prev => {
        const semDup = prev.filter(u => u.Email.toLowerCase() !== String(novo.Email).toLowerCase());
        return [...semDup, { ...novo, Role: normalizeRole(novo.Role), Status: normalizeUserStatus(novo.Status), TentativasFalhadas: 0 }];
      });
    }
    // { invited, inviteLink } chega ao componente para exibir o status do convite.
    return res;
  }, [activeEmpresa]);

  const updateUser = useCallback(async (email: string, updatedData: Partial<User>) => {
    await acaoBackend(() => authApi.updateUser(email, updatedData), 'Não foi possível salvar as alterações.');
    setBaseUsers(prev => prev.map(u => u.Email === email ? { ...u, ...updatedData } : u));
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
    await acaoBackend(() => tasksApi.complete(taskId, note, proof), 'Não foi possível enviar a tarefa para aprovação.');
    setTasks(prev => prev.map(t => (t.ID === taskId ? {
      ...t,
      Status: TaskStatus.AGUARDANDO_APROVACAO,
      DataConclusao: new Date().toISOString(),
      CompletionNote: note,
      ProofAttachment: proof,
      JustificativaGestor: undefined
    } : t)));
  }, []);

  // Situação de trabalho controlada pelo responsável (Pendente / Em andamento).
  const definirAndamento = useCallback(async (taskId: string, andamento: string) => {
    await tasksApi.definirAndamento(taskId, andamento);
    setTasks(prev => prev.map(t => (t.ID === taskId ? { ...t, Andamento: andamento } : t)));
  }, []);

  const auditTask = useCallback(async (taskId: string, status: TaskStatus, justification: string, nextDeadline?: string) => {
    // Mapeia TaskStatus para ConferenciaStatus do backend
    let apiStatus = 'APROVADO';
    if (status === TaskStatus.FEITA_ERRADA) apiStatus = 'ERRO_EXECUCAO';
    else if (status === TaskStatus.NAO_FEITA) apiStatus = 'NAO_CUMPRIU';

    // Em reprovações, envia o novo prazo para o backend persistir no DataLimite
    const novaDataLimite = status !== TaskStatus.APROVADA ? (nextDeadline || null) : null;
    // Ação crítica (mexe em pontuação): só reflete na UI após o backend confirmar.
    // NÃO há fallback local — pontos só existem quando o backend os grava (fonte da verdade).
    const result = await acaoBackend(
      () => tasksApi.audit(taskId, apiStatus, justification, novaDataLimite),
      'Não foi possível registrar a auditoria.'
    );

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

    // Recarrega o ledger do backend (fonte da verdade dos pontos). Falha aqui não desfaz
    // a auditoria já gravada — apenas registra e mantém o ledger anterior até o próximo refresh.
    try {
      const ledgerData = await ledgerApi.getAll();
      setLedger(ledgerData.map((l: any) => ({
        ID: l.ID,
        UserEmail: l.UserEmail,
        Data: l.Data,
        Pontos: l.Pontos,
        Tipo: l.Tipo === 'GANHO' ? ScoreType.GANHO : ScoreType.PENALIDADE,
        Descricao: l.Descricao,
        empresa_id: l.empresa_id,
      })));
    } catch (err) {
      console.warn('Auditoria gravada, mas falhou ao recarregar o extrato de pontos:', err);
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!window.confirm("Excluir tarefa?")) return;
    // Remove da UI SOMENTE após o backend confirmar (antes, apagava mesmo em erro).
    await acaoBackend(() => tasksApi.delete(taskId), 'Não foi possível excluir a tarefa.');
    setTasks(prev => prev.filter(t => t.ID !== taskId));
  }, []);

  // ==================== TEMPLATE FUNCTIONS ====================
  const addTemplate = useCallback(async (templateData: Omit<TaskTemplate, 'ID'>) => {
    // Sem fallback: o modelo só aparece na UI quando o backend o cria (com ID real).
    const newTemplate = await acaoBackend(() => templatesApi.create({
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
    }), 'Não foi possível criar o modelo.');

    setTemplates(prev => [...prev, { ...newTemplate, Ativa: true }]);
  }, [currentUserEmail, activeEmpresa]);

  const toggleTemplate = useCallback(async (id: string) => {
    // Update otimista com ROLLBACK: alterna na hora e desfaz se o backend falhar.
    const anterior = templates;
    setTemplates(prev => prev.map(t => t.ID === id ? { ...t, Ativa: !t.Ativa } : t));
    try {
      const result = await templatesApi.toggle(id);
      setTemplates(prev => prev.map(t => t.ID === id ? { ...t, Ativa: result.ativa } : t));
    } catch (e: any) {
      setTemplates(anterior); // rollback
      showToast({ message: e?.message || 'Não foi possível alterar o modelo.', tone: 'erro' });
      throw e;
    }
  }, [templates]);

  const deleteTemplate = useCallback(async (id: string) => {
    // Remove da UI SOMENTE após o backend confirmar (antes, apagava mesmo em erro).
    await acaoBackend(() => templatesApi.delete(id), 'Não foi possível excluir o modelo.');
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

    // Propaga a edição do modelo para as tarefas já geradas que ainda estão ABERTAS
    // (Pendente/Atrasada) — assim a alteração de pontos/título aparece na Supervisão.
    // Não toca em tarefas em aprovação ou concluídas (não altera o que já está sendo avaliado).
    const abertos = [TaskStatus.PENDENTE, TaskStatus.ATRASADA];
    const campos = {
      Titulo: data.Titulo,
      Descricao: data.Descricao,
      Responsavel: data.Responsavel,
      Prioridade: data.Prioridade,
      PontosValor: data.PontosValor,
    };
    const alvo = tasks.filter(t => t.TemplateID === id && abertos.includes(t.Status));
    if (alvo.length) {
      await Promise.all(alvo.map(t => tasksApi.update(t.ID, campos).catch(() => {})));
      setTasks(prev => prev.map(t =>
        (t.TemplateID === id && abertos.includes(t.Status)) ? { ...t, ...campos } : t
      ));
    }
  }, [tasks]);

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
      // 409 = anti-duplicata do backend: não é falha, é aviso de que já existe hoje.
      if (err.message?.includes('409')) {
        const tmpl = templates.find(t => t.ID === templateId);
        return { duplicate: true, template: tmpl };
      }
      // Sem fallback: não fabricamos a tarefa localmente. Avisa e não altera a UI.
      showToast({ message: err?.message || 'Não foi possível gerar a tarefa.', tone: 'erro' });
      return false;
    }
  }, [templates, baseUsers, empresas]);

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
    // Ação crítica (altera pontos): só reflete na UI após o backend confirmar.
    await acaoBackend(() => tasksApi.valorarPessoal(taskId, pontos, obs), 'Não foi possível valorar a tarefa.');
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
    await acaoBackend(() => empresasApi.setStatus(id, suspender ? 'Suspensa' : 'Ativa'), 'Não foi possível alterar o status da empresa.');
    setEmpresas(prev => prev.map(e => e.id === id ? { ...e, Status: suspender ? 'Suspensa' : 'Ativa' } : e));
  }, []);
  const excluirEmpresa = useCallback(async (id: string) => {
    // Ação crítica: remove da UI SOMENTE após o backend confirmar a exclusão.
    await acaoBackend(() => empresasApi.remove(id), 'Não foi possível excluir a empresa.');
    setEmpresas(prev => prev.filter(e => e.id !== id));
  }, []);

  // ==================== REGRAS DE BONIFICAÇÃO (Master/Plataforma) ====================
  const saveBonusRules = useCallback(async (rules: BonusRules) => {
    if (!activeEmpresa) throw new Error('Abra uma empresa para configurar as regras de bonificação.');
    const salvo = await bonusRulesApi.upsert(activeEmpresa, {
      eficiencia_minima: rules.eficiencia_minima,
      bonus_tipo: rules.bonus_tipo,
      bonus_valor: rules.bonus_valor,
      bonus_com_atraso: rules.bonus_com_atraso,
      peso_prioridade: rules.peso_prioridade,
      reentrega_fator: rules.reentrega_fator,
      pessoal_valorada: rules.pessoal_valorada,
      fechamento_dia: rules.fechamento_dia,
    });
    const norm = normalizeBonusRules(salvo);
    setBonusRulesAll(prev => {
      const outras = prev.filter(r => r.empresa_id !== activeEmpresa);
      return [...outras, norm];
    });
    return norm;
  }, [activeEmpresa]);

  // ==================== FECHAMENTO MENSAL ====================
  // Salva/atualiza os fechamentos do período com o status desejado. Só reflete
  // na UI após o backend confirmar (sem fallback).
  const salvarFechamento = useCallback(async (linhas: MonthlyClosing[], status: MonthlyClosing['status_fechamento']) => {
    if (!activeEmpresa) throw new Error('Abra uma empresa para fechar o período.');
    const fechando = status === 'fechado' || status === 'pago';
    const rows = linhas.map(l => ({
      empresa_id: activeEmpresa,
      ano: l.ano, mes: l.mes, colaborador: l.colaborador,
      pontos_possiveis: l.pontos_possiveis, pontos_realizados: l.pontos_realizados,
      eficiencia: l.eficiencia, penalidades: l.penalidades, saldo_final: l.saldo_final,
      status_bonus: l.status_bonus, bonus_sugerido: l.bonus_sugerido,
      status_fechamento: status,
      fechado_por: fechando ? currentUserEmail : null,
      fechado_em: fechando ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }));
    const salvos = await acaoBackend(() => monthlyClosingsApi.upsert(rows), 'Não foi possível salvar o fechamento.');
    setClosingsAll(prev => {
      const chaves = new Set((salvos as MonthlyClosing[]).map(s => `${s.empresa_id}|${s.ano}|${s.mes}|${s.colaborador}`));
      const outros = prev.filter(c => !chaves.has(`${c.empresa_id}|${c.ano}|${c.mes}|${c.colaborador}`));
      return [...outros, ...(salvos as MonthlyClosing[])];
    });
    return salvos;
  }, [activeEmpresa, currentUserEmail]);

  const setStatusFechamento = useCallback(async (id: string, status: MonthlyClosing['status_fechamento']) => {
    const fechando = status === 'fechado' || status === 'pago';
    const extra = fechando ? { fechado_por: currentUserEmail, fechado_em: new Date().toISOString() } : {};
    const salvo = await acaoBackend(() => monthlyClosingsApi.setStatus(id, status, extra), 'Não foi possível atualizar o status.');
    setClosingsAll(prev => prev.map(c => c.id === id ? (salvo as MonthlyClosing) : c));
    return salvo;
  }, [currentUserEmail]);

  return {
    currentUser, users,
    tasks: scopedTasks, templates: scopedTemplates, ledger: scopedLedger,
    minhasTarefas, botLog,
    empresas, activeEmpresa, setActiveEmpresa, empresaAtual, isPlataforma, createEmpresa,
    setUserEmpresas, getUserEmpresas, suspenderEmpresa, excluirEmpresa,
    bonusRules, saveBonusRules,
    closings, salvarFechamento, setStatusFechamento,
    notifications, notifNaoLidas, marcarNotificacoesLidas,
    loading, error, refreshData, auditAndFixTasks,
    login, logout, changePassword, definirNovaSenha, resetUserPassword, toggleUserStatus, deleteUser, addUser, updateUser, changeUserEmail,
    updateProfile, completeTask, definirAndamento, auditTask, deleteTask,
    addTemplate, updateTemplate, toggleTemplate, deleteTemplate, generateTaskFromTemplate,
    criarTarefaPessoal, concluirTarefaPessoal, reabrirTarefaPessoal, excluirTarefaPessoal, valorarTarefaPessoal
  };
};
