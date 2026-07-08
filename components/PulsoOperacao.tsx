import React, { useMemo } from 'react';
import { Task, TaskStatus, TaskPriority, ScoreLedger, ScoreType, User } from '../types';
import { getTodayStr } from '../store';
import { Clock, AlertTriangle, RotateCcw, CheckCircle2, Users, Flame, TrendingUp } from 'lucide-react';

interface Props {
  tasks: Task[];
  users: User[];
  ledger: ScoreLedger[];
}

const RED = '#8B1B1F';
const pendente = (t: Task) => t.Status === TaskStatus.PENDENTE || t.Status === TaskStatus.FEITA_ERRADA || t.Status === TaskStatus.NAO_FEITA;

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_1px_2px_rgba(28,25,23,0.04)] ${className}`}>{children}</div>
);

const PulsoOperacao: React.FC<Props> = ({ tasks, users, ledger }) => {
  const today = getTodayStr();

  const m = useMemo(() => {
    const now = new Date();
    const mes = now.getMonth(), ano = now.getFullYear();
    const noMes = (d?: string) => { if (!d) return false; const x = new Date(d); return x.getMonth() === mes && x.getFullYear() === ano; };
    const nomeDe = (email: string) => users.find(u => u.Email === email)?.Nome || email.split('@')[0];
    const timeDe = (email: string) => users.find(u => u.Email === email)?.Time || 'Sem time';

    const aguardando = tasks.filter(t => t.Status === TaskStatus.AGUARDANDO_APROVACAO);
    const atrasadas = tasks.filter(t => pendente(t) && !!t.DataLimite_Date && t.DataLimite_Date < today);
    const reprovadasMes = ledger.filter(l => l.Tipo === ScoreType.PENALIDADE && noMes(l.Data)).length;

    const atrasoPorPessoa: Record<string, number> = {};
    atrasadas.forEach(t => { atrasoPorPessoa[t.Responsavel] = (atrasoPorPessoa[t.Responsavel] || 0) + 1; });
    const topAtrasos = Object.entries(atrasoPorPessoa).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([email, qtd]) => ({ nome: nomeDe(email), qtd }));

    const tasksMes = tasks.filter(t => noMes(t.DataLimite));
    const totalMes = tasksMes.length;
    const aprovadasMes = tasksMes.filter(t => t.Status === TaskStatus.APROVADA).length;
    const taxaConclusao = totalMes ? Math.round((aprovadasMes / totalMes) * 100) : 0;
    const retrabalho = tasksMes.filter(t => (t.Tentativas || 0) > 0).length;
    const taxaRetrabalho = totalMes ? Math.round((retrabalho / totalMes) * 100) : 0;

    const timesMap: Record<string, { total: number; ap: number }> = {};
    tasksMes.forEach(t => {
      const tm = timeDe(t.Responsavel);
      timesMap[tm] = timesMap[tm] || { total: 0, ap: 0 };
      timesMap[tm].total++;
      if (t.Status === TaskStatus.APROVADA) timesMap[tm].ap++;
    });
    const taxaPorTime = Object.entries(timesMap)
      .map(([time, v]) => ({ time, taxa: v.total ? Math.round((v.ap / v.total) * 100) : 0, total: v.total }))
      .sort((a, b) => b.taxa - a.taxa);

    const criticas = tasks.filter(t => pendente(t) && t.DataLimite_Date === today &&
      (t.Prioridade === TaskPriority.URGENTE || t.Prioridade === TaskPriority.ALTA))
      .map(t => ({ ...t, nome: nomeDe(t.Responsavel) }));

    return { aguardando: aguardando.length, atrasadas: atrasadas.length, reprovadasMes, topAtrasos, taxaConclusao, taxaRetrabalho, taxaPorTime, criticas };
  }, [tasks, users, ledger, today]);

  const Kpi: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; hint?: string; alerta?: boolean }> = ({ icon, label, value, hint, alerta }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.14em]">{label}</p>
        <span className={alerta ? 'text-marca' : 'text-stone-400'}>{icon}</span>
      </div>
      <p className={`mt-3 text-3xl font-semibold ${alerta ? 'text-marca' : 'text-stone-900'}`}>{value}</p>
      {hint && <p className="text-sm text-stone-400 mt-1">{hint}</p>}
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-ciatos pb-10">
      <div>
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.14em]">Gestão</p>
        <h2 className="text-3xl md:text-4xl text-stone-900 mt-1">Pulso da operação</h2>
        <p className="text-stone-500 mt-1">O estado da sua equipe agora, em uma olhada.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        <Kpi icon={<Clock size={18} />} label="Aguardando aprovação" value={m.aguardando} hint="entregas a conferir" alerta={m.aguardando > 0} />
        <Kpi icon={<AlertTriangle size={18} />} label="Atrasadas" value={m.atrasadas} hint="obrigações vencidas" alerta={m.atrasadas > 0} />
        <Kpi icon={<RotateCcw size={18} />} label="Reprovadas no mês" value={m.reprovadasMes} hint="devolvidas" />
        <Kpi icon={<CheckCircle2 size={18} />} label="Conclusão (mês)" value={`${m.taxaConclusao}%`} hint="aprovadas / total" />
        <Kpi icon={<TrendingUp size={18} />} label="Retrabalho" value={`${m.taxaRetrabalho}%`} hint="precisaram refazer" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Críticas do dia */}
        <Card className="lg:col-span-2 p-8">
          <h3 className="text-lg text-stone-900 flex items-center gap-2 mb-5"><Flame size={18} className="text-marca" /> Tarefas críticas de hoje</h3>
          {m.criticas.length === 0 ? (
            <p className="text-stone-400 text-sm">Nenhuma tarefa de prioridade alta/urgente vencendo hoje. 🎯</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {m.criticas.map(t => (
                <div key={t.ID} className="py-3 flex items-center gap-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.Prioridade === TaskPriority.URGENTE ? 'bg-marca/10 text-marca' : 'bg-amber-50 text-amber-700'}`}>{t.Prioridade}</span>
                  <span className="text-sm text-stone-800 truncate flex-1">{t.Titulo}</span>
                  <span className="text-xs text-stone-400 shrink-0">{t.nome}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Colaboradores com mais atrasos */}
        <Card className="p-8">
          <h3 className="text-lg text-stone-900 flex items-center gap-2 mb-5"><Users size={18} className="text-marca" /> Mais atrasos</h3>
          {m.topAtrasos.length === 0 ? (
            <p className="text-stone-400 text-sm">Ninguém com atrasos. Excelente. ✅</p>
          ) : (
            <div className="space-y-4">
              {m.topAtrasos.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-stone-700 truncate">{p.nome}</span>
                  <span className="text-sm font-semibold text-marca shrink-0">{p.qtd} {p.qtd === 1 ? 'atraso' : 'atrasos'}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Taxa por time */}
      <Card className="p-8">
        <h3 className="text-lg text-stone-900 mb-5">Taxa de conclusão por time (mês)</h3>
        {m.taxaPorTime.length === 0 ? (
          <p className="text-stone-400 text-sm">Sem obrigações no mês ainda.</p>
        ) : (
          <div className="space-y-4">
            {m.taxaPorTime.map(t => (
              <div key={t.time}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-stone-700">{t.time} <span className="text-stone-400">· {t.total} tarefas</span></span>
                  <span className="font-semibold text-stone-900">{t.taxa}%</span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${t.taxa}%`, backgroundColor: t.taxa >= 90 ? '#059669' : RED }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PulsoOperacao;
