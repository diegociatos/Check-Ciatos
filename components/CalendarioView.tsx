import React, { useMemo, useState } from 'react';
import { Task, TaskStatus, User, UserRole } from '../types';
import { getTodayStr } from '../store';
import { statusInfo, STATUS_TONE_CLASS } from '../lib/labels';
import { PageHeader } from './ui';
import { ChevronLeft, ChevronRight, CalendarDays, CalendarClock } from 'lucide-react';

interface Props {
  tasks: Task[];
  currentUser: User;
  users: User[];
  currentUserRole: UserRole;
}

type Sev = 'overdue' | 'today' | 'upcoming' | 'awaiting' | 'done';

// Cores de aviso por severidade (pior primeiro).
const SEV: Record<Sev, { dot: string; cell: string; chip: string; label: string }> = {
  overdue:  { dot: 'bg-red-500',     cell: 'bg-red-50 border-red-200',        chip: 'text-red-700 bg-red-50',       label: 'Atrasada' },
  today:    { dot: 'bg-amber-500',   cell: 'bg-amber-50 border-amber-200',    chip: 'text-amber-700 bg-amber-50',   label: 'Vence hoje' },
  upcoming: { dot: 'bg-sky-500',     cell: 'bg-sky-50 border-sky-100',        chip: 'text-sky-700 bg-sky-50',       label: 'A vencer' },
  awaiting: { dot: 'bg-stone-400',   cell: 'bg-stone-50 border-stone-200',    chip: 'text-stone-500 bg-stone-100',  label: 'Em conferência' },
  done:     { dot: 'bg-emerald-500', cell: 'bg-emerald-50 border-emerald-100', chip: 'text-emerald-700 bg-emerald-50', label: 'Concluída' },
};
const ORDEM: Sev[] = ['overdue', 'today', 'upcoming', 'awaiting', 'done'];

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const OPEN = [TaskStatus.PENDENTE, TaskStatus.FEITA_ERRADA, TaskStatus.NAO_FEITA, TaskStatus.ATRASADA];
const pad = (n: number) => String(n).padStart(2, '0');
const dataDaTarefa = (t: Task) => (t.DataLimite_Date || t.DataLimite || '').slice(0, 10);

const CalendarioView: React.FC<Props> = ({ tasks, currentUser, users, currentUserRole }) => {
  const hoje = getTodayStr();
  const ehGestao = [UserRole.ADMIN, UserRole.PLATAFORMA, UserRole.MASTER, UserRole.GESTOR].includes(currentUserRole);
  const [escopo, setEscopo] = useState<'minhas' | 'equipe'>('minhas');
  const [ano, setAno] = useState(() => Number(hoje.slice(0, 4)));
  const [mes, setMes] = useState(() => Number(hoje.slice(5, 7)) - 1); // 0-based
  const [selecionado, setSelecionado] = useState<string>(hoje);

  const nomePorEmail = useMemo(() => {
    const m = new Map<string, string>();
    users.forEach((u) => m.set(u.Email.toLowerCase(), u.Nome || u.Email.split('@')[0]));
    return m;
  }, [users]);

  // Base: tarefas com data. "Minhas" = do próprio; "Equipe" = todas em escopo.
  const base = useMemo(() => {
    const comData = tasks.filter((t) => dataDaTarefa(t));
    return escopo === 'minhas' || !ehGestao
      ? comData.filter((t) => t.Responsavel === currentUser.Email)
      : comData;
  }, [tasks, escopo, ehGestao, currentUser.Email]);

  const porDia = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of base) {
      const d = dataDaTarefa(t);
      if (!m.has(d)) m.set(d, []);
      m.get(d)!.push(t);
    }
    return m;
  }, [base]);

  const sevTarefa = (t: Task): Sev => {
    if (t.Status === TaskStatus.APROVADA) return 'done';
    if (t.Status === TaskStatus.AGUARDANDO_APROVACAO) return 'awaiting';
    const d = dataDaTarefa(t);
    return d < hoje ? 'overdue' : d === hoje ? 'today' : 'upcoming';
  };

  const sevDia = (ts?: Task[]): Sev | null => {
    if (!ts || ts.length === 0) return null;
    const set = new Set(ts.map(sevTarefa));
    return ORDEM.find((s) => set.has(s)) ?? null;
  };

  // Grade do mês (semana começando no domingo).
  const celulas = useMemo(() => {
    const offset = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const arr: (string | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= diasNoMes; d++) arr.push(`${ano}-${pad(mes + 1)}-${pad(d)}`);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [ano, mes]);

  // KPIs do mês visível.
  const kpis = useMemo(() => {
    const prefixo = `${ano}-${pad(mes + 1)}`;
    let total = 0, atrasadas = 0, vencemHoje = 0;
    for (const [d, ts] of porDia) {
      if (!d.startsWith(prefixo)) continue;
      total += ts.length;
      for (const t of ts) {
        if (OPEN.includes(t.Status) && d < hoje) atrasadas++;
        else if (OPEN.includes(t.Status) && d === hoje) vencemHoje++;
      }
    }
    return { total, atrasadas, vencemHoje };
  }, [porDia, ano, mes, hoje]);

  const irMes = (delta: number) => {
    const nova = new Date(ano, mes + delta, 1);
    setAno(nova.getFullYear());
    setMes(nova.getMonth());
  };
  const irHoje = () => {
    setAno(Number(hoje.slice(0, 4)));
    setMes(Number(hoje.slice(5, 7)) - 1);
    setSelecionado(hoje);
  };

  const tarefasDoDia = (porDia.get(selecionado) || []).slice().sort((a, b) => {
    const oa = ORDEM.indexOf(sevTarefa(a)), ob = ORDEM.indexOf(sevTarefa(b));
    return oa - ob;
  });

  const fmtDiaLongo = (d: string) => {
    const [y, m, dd] = d.split('-').map(Number);
    return `${dd} de ${MESES[m - 1]} de ${y}`;
  };

  return (
    <div className="space-y-8 font-ciatos pb-20 animate-in fade-in duration-500">
      <PageHeader
        kicker="Agenda"
        title="Calendário de tarefas"
        subtitle="Veja em quais dias você tem obrigações e o que está atrasado, vence hoje ou a vencer."
        action={ehGestao ? (
          <div className="inline-flex bg-stone-100 rounded-xl p-1">
            <button onClick={() => setEscopo('minhas')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${escopo === 'minhas' ? 'bg-white text-marca shadow-sm' : 'text-stone-500'}`}>Minhas</button>
            <button onClick={() => setEscopo('equipe')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${escopo === 'equipe' ? 'bg-white text-marca shadow-sm' : 'text-stone-500'}`}>Equipe</button>
          </div>
        ) : undefined}
      />

      {/* KPIs do mês */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'No mês', valor: kpis.total, tom: 'text-stone-900' },
          { label: 'Atrasadas', valor: kpis.atrasadas, tom: 'text-red-600' },
          { label: 'Vencem hoje', valor: kpis.vencemHoje, tom: 'text-amber-600' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-[#E7E5E4] p-4 text-center">
            <p className={`text-3xl font-semibold ${k.tom}`}>{k.valor}</p>
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_1px_2px_rgba(28,25,23,0.04)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl text-stone-900 capitalize">{MESES[mes]} <span className="text-stone-400">{ano}</span></h3>
            <div className="flex items-center gap-1">
              <button onClick={irHoje} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-marca hover:bg-marca/5 transition-colors">Hoje</button>
              <button onClick={() => irMes(-1)} className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors" aria-label="Mês anterior"><ChevronLeft size={18} /></button>
              <button onClick={() => irMes(1)} className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors" aria-label="Próximo mês"><ChevronRight size={18} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {SEMANA.map((s) => (
              <div key={s} className="text-center text-[10px] font-semibold text-stone-400 uppercase tracking-wider py-1">{s}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {celulas.map((d, i) => {
              if (!d) return <div key={`e${i}`} />;
              const ts = porDia.get(d);
              const sev = sevDia(ts);
              const dia = Number(d.slice(8, 10));
              const ehHoje = d === hoje;
              const ativo = d === selecionado;
              const cor = sev ? SEV[sev] : null;
              return (
                <button
                  key={d}
                  onClick={() => setSelecionado(d)}
                  className={`relative aspect-square rounded-xl border text-left p-1.5 transition-all
                    ${cor ? cor.cell : 'bg-white border-stone-100 hover:border-stone-200'}
                    ${ativo ? 'ring-2 ring-marca ring-offset-1' : ''}`}
                >
                  <span className={`text-xs font-semibold ${ehHoje ? 'text-marca' : 'text-stone-600'}`}>
                    {dia}{ehHoje && <span className="ml-0.5 inline-block w-1 h-1 rounded-full bg-marca align-middle" />}
                  </span>
                  {ts && ts.length > 0 && (
                    <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1">
                      <span className={`text-[10px] font-bold ${cor?.chip.split(' ')[0]}`}>{ts.length}</span>
                      <span className={`w-2 h-2 rounded-full ${cor?.dot}`} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-5 pt-4 border-t border-stone-100">
            {ORDEM.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 text-[11px] text-stone-500">
                <span className={`w-2.5 h-2.5 rounded-full ${SEV[s].dot}`} /> {SEV[s].label}
              </span>
            ))}
          </div>
        </div>

        {/* Painel do dia selecionado */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_1px_2px_rgba(28,25,23,0.04)] p-5">
          <div className="flex items-center gap-2 text-stone-700 mb-1">
            <CalendarClock size={18} className="text-marca" />
            <h3 className="text-lg">{fmtDiaLongo(selecionado)}</h3>
          </div>
          <p className="text-xs text-stone-400 mb-4">{tarefasDoDia.length} {tarefasDoDia.length === 1 ? 'tarefa' : 'tarefas'} neste dia</p>

          {tarefasDoDia.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays size={40} className="mx-auto text-stone-300" />
              <p className="text-stone-400 text-sm mt-3">Nenhuma tarefa neste dia.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tarefasDoDia.map((t) => {
                const info = statusInfo(t.Status);
                const sev = sevTarefa(t);
                return (
                  <div key={t.ID} className="flex items-start gap-3 p-3 rounded-xl border border-stone-100 bg-stone-50/50">
                    <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${SEV[sev].dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-stone-900 leading-snug">{t.Titulo}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_TONE_CLASS[info.tone]}`}>{info.label}</span>
                        {escopo === 'equipe' && ehGestao && (
                          <span className="text-[11px] text-stone-400">{nomePorEmail.get(t.Responsavel.toLowerCase()) || t.Responsavel.split('@')[0]}</span>
                        )}
                        {!t.Pessoal && <span className="text-[11px] text-marca font-semibold">{t.PontosValor} pts</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarioView;
