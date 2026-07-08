import React, { useMemo, useState } from 'react';
import { Task, TaskStatus, User, UserRole } from '../types';
import { getTodayStr } from '../store';
import { CalendarDays, CheckCheck, Sun, PartyPopper } from 'lucide-react';
import { PageHeader, EmptyState } from './ui';
import TaskList from './TaskList';
import CompletedTasksView from './CompletedTasksView';

interface MinhasTarefasViewProps {
  currentUser: User;
  tasks: Task[];
  users: User[];
  onComplete: (taskId: string, note: string, proof: string) => void;
  currentUserRole: UserRole;
}

type Aba = 'HOJE' | 'PROXIMAS' | 'CONCLUIDAS';

const PENDENTE_LIKE = [TaskStatus.PENDENTE, TaskStatus.FEITA_ERRADA, TaskStatus.NAO_FEITA];

const MinhasTarefasView: React.FC<MinhasTarefasViewProps> = ({ currentUser, tasks, users, onComplete, currentUserRole }) => {
  const today = getTodayStr();
  const [aba, setAba] = useState<Aba>('HOJE');

  const meusPendentes = useMemo(
    () => tasks.filter((t) => t.Responsavel === currentUser.Email && PENDENTE_LIKE.includes(t.Status)),
    [tasks, currentUser.Email]
  );

  // Hoje: vencidas ou vencendo hoje
  const hoje = useMemo(() => meusPendentes.filter((t) => (t.DataLimite_Date || '') <= today), [meusPendentes, today]);

  // Próximas: futuras ou atrasadas do mês corrente que não estão na aba Hoje
  const proximas = useMemo(() => {
    const mes = today.substring(0, 7);
    return meusPendentes.filter((t) => {
      const d = t.DataLimite_Date || '';
      return d > today || (d.startsWith(mes) && d <= today);
    });
  }, [meusPendentes, today]);

  const concluidas = useMemo(
    () => tasks.filter((t) => t.Responsavel === currentUser.Email && t.Status === TaskStatus.APROVADA),
    [tasks, currentUser.Email]
  );

  // Progresso do dia
  const doDia = useMemo(() => tasks.filter((t) => t.Responsavel === currentUser.Email && t.DataLimite_Date === today), [tasks, currentUser.Email, today]);
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
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader
        kicker="Minha rotina"
        title="Minhas tarefas"
        subtitle={totalHoje > 0 ? `${totalHoje} para hoje · ${feitasHoje} concluída${feitasHoje === 1 ? '' : 's'}` : 'Suas obrigações de hoje, as próximas e o histórico.'}
      />

      {/* Barra de progresso do dia — o pico de "zerei o dia" */}
      {totalHoje > 0 && (
        <div className="bg-superficie rounded-2xl border border-stone-200 shadow-[0_1px_2px_rgba(28,25,23,0.04)] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-tinta flex items-center gap-2">
              {zerou ? <><PartyPopper size={16} className="text-marca" /> Você zerou o dia!</> : `Progresso de hoje`}
            </span>
            <span className="font-titulo text-lg text-tinta">{feitasHoje}/{totalHoje}</span>
          </div>
          <div className="h-2.5 rounded-full bg-stone-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${zerou ? 'bg-emerald-500' : 'bg-marca'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-full sm:w-fit">
        {abas.map((a) => (
          <button
            key={a.key}
            onClick={() => setAba(a.key)}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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

      {/* Conteúdo da aba */}
      {aba === 'HOJE' && (
        hoje.length === 0 ? (
          <EmptyState
            icon={<PartyPopper size={26} />}
            title="Nenhuma tarefa para hoje 🎉"
            message="Você está em dia. Aproveite — ou adiante alguma das próximas."
            action={proximas.length > 0 ? <button onClick={() => setAba('PROXIMAS')} className="text-sm font-semibold text-marca hover:text-marca-escuro">Ver próximas ({proximas.length})</button> : undefined}
          />
        ) : (
          <TaskList tasks={enrich(hoje)} onComplete={onComplete} currentUserRole={currentUserRole} currentUserEmail={currentUser.Email} />
        )
      )}

      {aba === 'PROXIMAS' && (
        proximas.length === 0 ? (
          <EmptyState icon={<CalendarDays size={26} />} title="Sem próximas obrigações" message="Quando novas tarefas forem geradas para você, aparecem aqui com antecedência." />
        ) : (
          <TaskList tasks={enrich(proximas)} onComplete={onComplete} currentUserRole={currentUserRole} currentUserEmail={currentUser.Email} />
        )
      )}

      {aba === 'CONCLUIDAS' && (
        concluidas.length === 0 ? (
          <EmptyState icon={<CheckCheck size={26} />} title="Ainda nada concluído" message="Suas obrigações aprovadas ficam registradas aqui." />
        ) : (
          <CompletedTasksView tasks={concluidas} users={users} currentUserRole={currentUserRole} />
        )
      )}
    </div>
  );
};

export default MinhasTarefasView;
