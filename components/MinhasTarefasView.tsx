import React, { useMemo, useState } from 'react';
import { Task, TaskStatus, User, UserRole, UserStatus } from '../types';
import { getTodayStr } from '../store';
import { CalendarDays, CheckCheck, Sun, PartyPopper, Plus, Check, RotateCcw, Trash2, Star, X } from 'lucide-react';
import { PageHeader, EmptyState, Card, Btn, Pill, showToast, useUndoableDelete } from './ui';
import TaskList from './TaskList';
import CompletedTasksView from './CompletedTasksView';

interface MinhasTarefasViewProps {
  currentUser: User;
  tasks: Task[];
  users: User[];
  onComplete: (taskId: string, note: string, proof: string) => void;
  currentUserRole: UserRole;
  onCriarPessoal: (titulo: string, descricao?: string, dataLimite?: string) => Promise<any>;
  onConcluirPessoal: (taskId: string) => Promise<void>;
  onReabrirPessoal: (taskId: string) => Promise<void>;
  onExcluirPessoal: (taskId: string) => Promise<void>;
  onDefinirAndamento: (taskId: string, andamento: string) => Promise<void>;
  onTransferir?: (taskId: string, novoResponsavel: string) => Promise<void>;
  permiteAnexos?: boolean;
}

type Aba = 'HOJE' | 'PROXIMAS' | 'CONCLUIDAS' | 'PESSOAIS';

const PENDENTE_LIKE = [TaskStatus.PENDENTE, TaskStatus.FEITA_ERRADA, TaskStatus.NAO_FEITA];

const MinhasTarefasView: React.FC<MinhasTarefasViewProps> = ({
  currentUser, tasks, users, onComplete, currentUserRole,
  onCriarPessoal, onConcluirPessoal, onReabrirPessoal, onExcluirPessoal, onDefinirAndamento,
  onTransferir, permiteAnexos = true,
}) => {
  const today = getTodayStr();
  const [aba, setAba] = useState<Aba>('HOJE');

  // Só a gestão pode transferir; candidatos = pessoas ativas da empresa (menos ela mesma e a plataforma).
  const podeTransferir = [UserRole.GESTOR, UserRole.MASTER, UserRole.ADMIN, UserRole.PLATAFORMA].includes(currentUserRole);
  const transferCandidates = useMemo(
    () => users
      .filter((u) => u.Status === UserStatus.ATIVO && u.Email !== currentUser.Email && u.Role !== UserRole.PLATAFORMA)
      .map((u) => ({ Email: u.Email, Nome: u.Nome }))
      .sort((a, b) => (a.Nome || a.Email).localeCompare(b.Nome || b.Email)),
    [users, currentUser.Email],
  );

  const meus = useMemo(() => tasks.filter((t) => t.Responsavel === currentUser.Email), [tasks, currentUser.Email]);
  // Obrigações pontuadas (não pessoais)
  const meusPendentes = useMemo(() => meus.filter((t) => !t.Pessoal && PENDENTE_LIKE.includes(t.Status)), [meus]);
  const hoje = useMemo(() => meusPendentes.filter((t) => (t.DataLimite_Date || '') <= today), [meusPendentes, today]);
  const proximas = useMemo(() => {
    const mes = today.substring(0, 7);
    return meusPendentes.filter((t) => {
      const d = t.DataLimite_Date || '';
      return d > today || (d.startsWith(mes) && d <= today);
    });
  }, [meusPendentes, today]);
  const concluidas = useMemo(() => meus.filter((t) => !t.Pessoal && t.Status === TaskStatus.APROVADA), [meus]);

  // Tarefas pessoais (0 pt até o master valorar)
  const pessoais = useMemo(
    () => [...meus.filter((t) => t.Pessoal)].sort((a, b) => (a.DataLimite_Date || '').localeCompare(b.DataLimite_Date || '')),
    [meus]
  );

  // Progresso do dia — só obrigações pontuadas
  const doDia = useMemo(() => meus.filter((t) => !t.Pessoal && t.DataLimite_Date === today), [meus, today]);
  const feitasHoje = doDia.filter((t) => t.Status === TaskStatus.AGUARDANDO_APROVACAO || t.Status === TaskStatus.APROVADA).length;
  const totalHoje = doDia.length;
  const pct = totalHoje > 0 ? Math.round((feitasHoje / totalHoje) * 100) : 0;
  const zerou = totalHoje > 0 && feitasHoje === totalHoje;

  const enrich = (list: Task[]) =>
    list.map((t) => ({
      ...t,
      NomeColaborador: currentUser.Nome,
      NomeGestor: users.find((u) => u.Email === currentUser.Gestor)?.Nome || 'Admin',
      DiasAteVencimento: 0,
      StatusCor: t.Status === TaskStatus.PENDENTE ? 'Orange' : 'Red',
    }));

  const abas: { key: Aba; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'HOJE', label: 'Hoje', count: hoje.length, icon: <Sun size={16} /> },
    { key: 'PROXIMAS', label: 'Próximas', count: proximas.length, icon: <CalendarDays size={16} /> },
    { key: 'CONCLUIDAS', label: 'Concluídas', count: concluidas.length, icon: <CheckCheck size={16} /> },
    { key: 'PESSOAIS', label: 'Pessoais', count: pessoais.length, icon: <Star size={16} /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader
        kicker="Minha rotina"
        title="Minhas tarefas"
        subtitle={totalHoje > 0 ? `${totalHoje} para hoje · ${feitasHoje} concluída${feitasHoje === 1 ? '' : 's'}` : 'Suas obrigações, as próximas e seus serviços pessoais.'}
      />

      {totalHoje > 0 && aba !== 'PESSOAIS' && (
        <div className="bg-superficie rounded-2xl border border-stone-200 shadow-[0_1px_2px_rgba(28,25,23,0.04)] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-tinta flex items-center gap-2">
              {zerou ? <><PartyPopper size={16} className="text-marca" /> Você zerou o dia!</> : `Progresso de hoje`}
            </span>
            <span className="font-titulo text-lg text-tinta">{feitasHoje}/{totalHoje}</span>
          </div>
          <div className="h-2.5 rounded-full bg-stone-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${zerou ? 'bg-emerald-500' : 'bg-marca'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
        {abas.map((a) => (
          <button
            key={a.key}
            onClick={() => setAba(a.key)}
            className={`flex-1 sm:flex-none whitespace-nowrap inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              aba === a.key ? 'bg-superficie text-marca shadow-sm' : 'text-stone-500 hover:text-tinta'
            }`}
          >
            {a.icon}
            {a.label}
            {a.count > 0 && (
              <span className={`text-[11px] rounded-full px-1.5 py-0.5 ${aba === a.key ? 'bg-marca/10 text-marca' : 'bg-stone-200 text-stone-500'}`}>{a.count}</span>
            )}
          </button>
        ))}
      </div>

      {aba === 'HOJE' && (
        hoje.length === 0 ? (
          <EmptyState
            icon={<PartyPopper size={26} />}
            title="Nenhuma obrigação para hoje 🎉"
            message="Você está em dia. Aproveite — ou adiante alguma das próximas."
            action={proximas.length > 0 ? <button onClick={() => setAba('PROXIMAS')} className="text-sm font-semibold text-marca hover:text-marca-escuro">Ver próximas ({proximas.length})</button> : undefined}
          />
        ) : (
          <TaskList tasks={enrich(hoje)} onComplete={onComplete} onDefinirAndamento={onDefinirAndamento} currentUserRole={currentUserRole} currentUserEmail={currentUser.Email} permiteAnexos={permiteAnexos} onTransferir={onTransferir} transferCandidates={transferCandidates} podeTransferir={podeTransferir} />
        )
      )}

      {aba === 'PROXIMAS' && (
        proximas.length === 0 ? (
          <EmptyState icon={<CalendarDays size={26} />} title="Sem próximas obrigações" message="Quando novas tarefas forem geradas para você, aparecem aqui com antecedência." />
        ) : (
          <TaskList tasks={enrich(proximas)} onComplete={onComplete} onDefinirAndamento={onDefinirAndamento} currentUserRole={currentUserRole} currentUserEmail={currentUser.Email} permiteAnexos={permiteAnexos} onTransferir={onTransferir} transferCandidates={transferCandidates} podeTransferir={podeTransferir} />
        )
      )}

      {aba === 'CONCLUIDAS' && (
        concluidas.length === 0 ? (
          <EmptyState icon={<CheckCheck size={26} />} title="Ainda nada concluído" message="Suas obrigações aprovadas ficam registradas aqui." />
        ) : (
          <CompletedTasksView tasks={concluidas} users={users} currentUserRole={currentUserRole} />
        )
      )}

      {aba === 'PESSOAIS' && (
        <PessoaisPanel
          pessoais={pessoais}
          onCriar={onCriarPessoal}
          onConcluir={onConcluirPessoal}
          onReabrir={onReabrirPessoal}
          onExcluir={onExcluirPessoal}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Painel de tarefas pessoais: o colaborador cria e gerencia seus serviços.
// ---------------------------------------------------------------------------
const PessoaisPanel: React.FC<{
  pessoais: Task[];
  onCriar: (titulo: string, descricao?: string, dataLimite?: string) => Promise<any>;
  onConcluir: (taskId: string) => Promise<void>;
  onReabrir: (taskId: string) => Promise<void>;
  onExcluir: (taskId: string) => Promise<void>;
}> = ({ pessoais, onCriar, onConcluir, onReabrir, onExcluir }) => {
  const [criando, setCriando] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prazo, setPrazo] = useState(getTodayStr());
  const [salvando, setSalvando] = useState(false);
  const { pendentes: excluindo, remover: excluir } = useUndoableDelete((id) => { void onExcluir(id); }, 'Tarefa');

  const salvar = async () => {
    if (!titulo.trim()) { showToast({ message: 'Dê um nome à tarefa.', tone: 'erro' }); return; }
    setSalvando(true);
    try {
      await onCriar(titulo.trim(), descricao.trim() || undefined, prazo || undefined);
      setTitulo(''); setDescricao(''); setPrazo(getTodayStr()); setCriando(false);
      showToast({ message: 'Tarefa pessoal criada.', tone: 'sucesso' });
    } catch (e: any) {
      showToast({ message: e?.message || 'Não foi possível criar.', tone: 'erro' });
    } finally {
      setSalvando(false);
    }
  };

  const visiveis = pessoais.filter((t) => !excluindo.has(t.ID));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-sm text-stone-500 max-w-lg">
          Anote aqui os serviços que você mesmo organiza. Eles <strong>não valem pontos</strong> — servem para sua gestão e para o seu gestor enxergar seu trabalho. Se ele quiser reconhecer, ele atribui os pontos.
        </p>
        <Btn onClick={() => setCriando(true)}><Plus size={16} /> Nova tarefa</Btn>
      </div>

      {visiveis.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Star size={26} />}
            title="Organize seus serviços aqui"
            message="Crie tarefas para você mesmo — controle o seu dia e deixe seu gestor por dentro do que você entrega."
            action={<Btn onClick={() => setCriando(true)}><Plus size={16} /> Criar a primeira</Btn>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {visiveis.map((t) => {
            const feita = t.Status === TaskStatus.APROVADA;
            const valorada = (t.PontosValor || 0) > 0;
            return (
              <Card key={t.ID} className="p-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => (feita ? onReabrir(t.ID) : onConcluir(t.ID))}
                    disabled={valorada}
                    title={valorada ? 'Já valorada pelo gestor' : feita ? 'Reabrir' : 'Marcar como feita'}
                    className={`mt-0.5 h-6 w-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      feita ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-stone-300 text-transparent hover:border-marca'
                    } ${valorada ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <Check size={14} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${feita ? 'text-stone-400 line-through' : 'text-tinta'}`}>{t.Titulo}</p>
                    {t.Descricao && <p className="text-xs text-stone-400 mt-0.5">{t.Descricao}</p>}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Pill tone="neutral">Pessoal</Pill>
                      {t.DataLimite_Date && <span className="text-xs text-stone-400">{t.DataLimite_Date.split('-').reverse().join('/')}</span>}
                      {valorada && <Pill tone="sucesso"><Star size={11} /> Reconhecida · +{t.PontosValor} pts</Pill>}
                    </div>
                  </div>
                  {!valorada && (
                    <div className="flex items-center gap-1 shrink-0">
                      {feita && (
                        <button onClick={() => onReabrir(t.ID)} title="Reabrir" className="p-2 text-stone-400 hover:text-tinta hover:bg-stone-50 rounded-lg">
                          <RotateCcw size={15} />
                        </button>
                      )}
                      <button onClick={() => excluir(t.ID)} title="Excluir" className="p-2 text-stone-400 hover:text-erro hover:bg-red-50 rounded-lg">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de criação */}
      {criando && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-tinta/40 backdrop-blur-sm">
          <div className="bg-superficie w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-titulo text-xl text-tinta">Nova tarefa pessoal</h3>
              <button onClick={() => setCriando(false)} className="text-stone-400 hover:text-tinta"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">O que você vai fazer?</label>
                <input
                  autoFocus
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex.: Revisar contrato do cliente X"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-marca/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Detalhes <span className="text-stone-300 normal-case">(opcional)</span></label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Contexto, links, o que precisa entregar…"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-marca/20 min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Prazo</label>
                <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-marca/20" />
              </div>
              <div className="flex gap-2 pt-1">
                <Btn variant="secondary" onClick={() => setCriando(false)} full>Cancelar</Btn>
                <Btn onClick={salvar} loading={salvando} full>Criar tarefa</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinhasTarefasView;
