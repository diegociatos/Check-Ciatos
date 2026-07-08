import React, { useMemo, useState } from 'react';
import { User, Task, ScoreLedger, TaskStatus } from '../types';
import { getTodayStr } from '../store';
import { Users, Gauge, Star, AlertTriangle, ShieldCheck, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Card, Label, PageHeader, StatCard, EmptyState, Pill, Drawer } from './ui';

interface EquipeViewProps {
  users: User[];
  tasks: Task[];
  ledger: ScoreLedger[];
  collaboratorsList: User[];
}

interface Row {
  user: User;
  pontosMes: number;
  eficiencia: number;
  confiabilidade: number;
  total: number;
  aprovadas: number;
  pendentes: number;
  atrasadas: number;
  refazer: number;
}

type SortKey = 'nome' | 'pontosMes' | 'eficiencia' | 'confiabilidade' | 'atrasadas';

const efTone = (v: number) => (v >= 90 ? 'sucesso' : v >= 70 ? 'atraso' : 'erro');

const EquipeView: React.FC<EquipeViewProps> = ({ tasks, ledger, collaboratorsList }) => {
  const today = getTodayStr();
  const [sortKey, setSortKey] = useState<SortKey>('pontosMes');
  const [asc, setAsc] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);

  const rows: Row[] = useMemo(() => {
    return collaboratorsList.map((user) => {
      const ut = tasks.filter((t) => t.Responsavel === user.Email);
      const pendentes = ut.filter((t) => t.Status === TaskStatus.PENDENTE);
      const atrasadas = pendentes.filter((t) => (t.DataLimite_Date || '') < today).length;
      return {
        user,
        pontosMes: user.PontosRealizadosMes || 0,
        eficiencia: Math.round(user.EficienciaMes || 0),
        confiabilidade: user.ScoreConfiabilidade || 0,
        total: ut.length,
        aprovadas: ut.filter((t) => t.Status === TaskStatus.APROVADA).length,
        pendentes: pendentes.length,
        atrasadas,
        refazer: ut.filter((t) => t.Status === TaskStatus.FEITA_ERRADA).length,
      };
    });
  }, [collaboratorsList, tasks, today]);

  const sorted = useMemo(() => {
    const s = [...rows].sort((a, b) => {
      if (sortKey === 'nome') return a.user.Nome.localeCompare(b.user.Nome);
      return (b[sortKey] as number) - (a[sortKey] as number);
    });
    return asc ? s.reverse() : s;
  }, [rows, sortKey, asc]);

  const kpis = useMemo(() => {
    const n = rows.length;
    const efMedia = n ? Math.round(rows.reduce((s, r) => s + r.eficiencia, 0) / n) : 0;
    const pontosEquipe = rows.reduce((s, r) => s + r.pontosMes, 0);
    const pendentesHoje = tasks.filter((t) => t.Status === TaskStatus.PENDENTE && t.DataLimite_Date === today).length;
    const atrasadas = rows.reduce((s, r) => s + r.atrasadas, 0);
    return { n, efMedia, pontosEquipe, pendentesHoje, atrasadas };
  }, [rows, tasks, today]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setAsc((v) => !v);
    else { setSortKey(k); setAsc(false); }
  };

  const Th: React.FC<{ k: SortKey; children: React.ReactNode; className?: string }> = ({ k, children, className = '' }) => (
    <th className={`px-6 py-4 text-[10px] font-semibold text-stone-400 uppercase tracking-wider ${className}`}>
      <button onClick={() => toggleSort(k)} className={`inline-flex items-center gap-1 hover:text-tinta transition-colors ${sortKey === k ? 'text-marca' : ''}`}>
        {children}<ArrowUpDown size={11} />
      </button>
    </th>
  );

  if (collaboratorsList.length === 0) {
    return (
      <div className="space-y-8 pb-10">
        <PageHeader kicker="Gestão" title="Equipe" subtitle="Desempenho e confiabilidade de quem você gerencia." />
        <Card>
          <EmptyState
            icon={<Users size={26} />}
            title="Nenhum colaborador ainda"
            message="Assim que você cadastrar colaboradores e designar responsáveis, o desempenho de cada um aparece aqui."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader kicker="Gestão" title="Equipe" subtitle="Desempenho e confiabilidade de quem você gerencia." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Colaboradores" value={kpis.n} icon={<Users size={18} />} />
        <StatCard label="Eficiência média" value={`${kpis.efMedia}%`} icon={<Gauge size={18} />} hint="no mês" />
        <StatCard label="Pontos da equipe" value={kpis.pontosEquipe} icon={<Star size={18} />} hint="no mês" />
        <StatCard label="Atrasadas" value={kpis.atrasadas} icon={<AlertTriangle size={18} />} tone={kpis.atrasadas > 0 ? 'marca' : 'default'} hint="a resolver" />
      </div>

      {/* Tabela (desktop) */}
      <Card className="overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-stone-50/60 border-b border-stone-100">
              <tr>
                <Th k="nome">Colaborador</Th>
                <Th k="pontosMes" className="text-center">Pontos/mês</Th>
                <Th k="eficiencia" className="text-center">Eficiência</Th>
                <Th k="confiabilidade" className="text-center">Confiabilidade</Th>
                <Th k="atrasadas" className="text-center">Atrasadas</Th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sorted.map((r) => (
                <tr key={r.user.Email} className="hover:bg-stone-50/50 transition-colors cursor-pointer" onClick={() => setSelected(r.user)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-marca rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">{r.user.Nome.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-semibold text-tinta">{r.user.Nome}</p>
                        <p className="text-xs text-stone-400">{r.user.Time || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-titulo text-lg text-tinta">{r.pontosMes}</td>
                  <td className="px-6 py-4 text-center"><Pill tone={efTone(r.eficiencia)}>{r.eficiencia}%</Pill></td>
                  <td className="px-6 py-4 text-center"><Pill tone={efTone(r.confiabilidade)}>{r.confiabilidade.toFixed(0)}%</Pill></td>
                  <td className="px-6 py-4 text-center">
                    {r.atrasadas > 0 ? <Pill tone="erro">{r.atrasadas}</Pill> : <span className="text-stone-300">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right text-stone-300"><ChevronRight size={16} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cards (mobile) */}
      <div className="md:hidden space-y-3">
        {sorted.map((r) => (
          <Card key={r.user.Email} className="p-4" onClick={() => setSelected(r.user)}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-marca rounded-full flex items-center justify-center text-white font-semibold shrink-0">{r.user.Nome.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-tinta truncate">{r.user.Nome}</p>
                <p className="text-xs text-stone-400">{r.pontosMes} pts · {r.user.Time || '—'}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Pill tone={efTone(r.eficiencia)}>{r.eficiencia}%</Pill>
                {r.atrasadas > 0 && <Pill tone="erro">{r.atrasadas} atrasada{r.atrasadas > 1 ? 's' : ''}</Pill>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Drawer de detalhe individual */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.Nome}>
        {selected && <ColaboradorDetalhe user={selected} rows={rows} ledger={ledger} />}
      </Drawer>
    </div>
  );
};

const ColaboradorDetalhe: React.FC<{ user: User; rows: Row[]; ledger: ScoreLedger[] }> = ({ user, rows, ledger }) => {
  const r = rows.find((x) => x.user.Email === user.Email);
  const recentes = [...ledger.filter((l) => l.UserEmail === user.Email)]
    .sort((a, b) => new Date(b.Data).getTime() - new Date(a.Data).getTime())
    .slice(0, 8);
  if (!r) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 bg-marca rounded-2xl flex items-center justify-center text-white font-titulo text-2xl">{user.Nome.charAt(0)}</div>
        <div>
          <p className="text-sm font-semibold text-tinta">{user.Nome}</p>
          <p className="text-xs text-stone-400">{user.Time || '—'} · {user.Email}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-stone-50 p-3 text-center">
          <p className="font-titulo text-xl text-tinta">{r.pontosMes}</p>
          <Label>Pontos/mês</Label>
        </div>
        <div className="rounded-xl bg-stone-50 p-3 text-center">
          <p className="font-titulo text-xl text-tinta">{r.eficiencia}%</p>
          <Label>Eficiência</Label>
        </div>
        <div className="rounded-xl bg-stone-50 p-3 text-center">
          <p className="font-titulo text-xl text-tinta">{r.confiabilidade.toFixed(0)}%</p>
          <Label>Confiab.</Label>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2 text-stone-500"><ShieldCheck size={15} /><Label>Tarefas</Label></div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between rounded-lg bg-stone-50 px-3 py-2"><span className="text-stone-500">Aprovadas</span><span className="font-semibold text-tinta">{r.aprovadas}</span></div>
          <div className="flex justify-between rounded-lg bg-stone-50 px-3 py-2"><span className="text-stone-500">Pendentes</span><span className="font-semibold text-tinta">{r.pendentes}</span></div>
          <div className="flex justify-between rounded-lg bg-stone-50 px-3 py-2"><span className="text-stone-500">Atrasadas</span><span className="font-semibold text-erro">{r.atrasadas}</span></div>
          <div className="flex justify-between rounded-lg bg-stone-50 px-3 py-2"><span className="text-stone-500">Refazer</span><span className="font-semibold text-amber-600">{r.refazer}</span></div>
        </div>
      </div>

      <div>
        <Label>Movimentações recentes</Label>
        {recentes.length === 0 ? (
          <p className="text-sm text-stone-400 mt-2">Sem lançamentos ainda.</p>
        ) : (
          <div className="mt-2 divide-y divide-stone-100">
            {recentes.map((l) => (
              <div key={l.ID} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-tinta truncate">{l.Descricao}</p>
                  <p className="text-xs text-stone-400">{new Date(l.Data).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className={`text-sm font-semibold shrink-0 ml-3 ${l.Pontos >= 0 ? 'text-emerald-600' : 'text-erro'}`}>
                  {l.Pontos >= 0 ? '+' : ''}{l.Pontos}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipeView;
