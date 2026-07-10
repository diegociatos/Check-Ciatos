import React, { useMemo, useState } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { Task, TaskStatus, ScoreLedger, ScoreType, User, BonusRules } from '../types';
import { getTodayStr } from '../store';
import { calcularBonus } from '../lib/scoreEngine';
import { PageHeader, Card, StatCard, EmptyState, Pill } from './ui';
import {
  Gauge, CheckCircle2, Clock, AlertTriangle, XCircle, FilePlus2, Coins, Users,
  Trophy, RotateCcw, TimerOff,
} from 'lucide-react';

interface ExecutiveDashboardViewProps {
  tasks: Task[];
  ledger: ScoreLedger[];
  collaborators: User[];
  bonusRules: BonusRules;
  empresaNome?: string;
}

const RED = '#8B1B1F';
const MUTED = '#78716C';
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const pad = (n: number) => String(n).padStart(2, '0');
const ym = (ano: number, mes0: number) => `${ano}-${pad(mes0 + 1)}`;

interface LinhaColab {
  user: User;
  criadas: number;
  aprovadas: number;
  erros: number;       // Feita Errada + Não Feita (reincidência de erro)
  possiveis: number;
  realizados: number;
  penalidades: number;
  saldo: number;
  eficiencia: number;
  temAtraso: boolean;
  bonusElegivel: boolean;
  bonusValor: number;
}

const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({ tasks, ledger, collaborators, bonusRules, empresaNome }) => {
  const hoje = getTodayStr();
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();
  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState(mesAtual); // 0-11
  const [time, setTime] = useState<string>('TODOS');
  const [colab, setColab] = useState<string>('TODOS');

  const times = useMemo(
    () => Array.from(new Set(collaborators.map(c => c.Time).filter(Boolean))) as string[],
    [collaborators]
  );

  // Colaboradores após os filtros de time/colaborador.
  const colabsFiltrados = useMemo(
    () => collaborators.filter(c => (time === 'TODOS' || c.Time === time) && (colab === 'TODOS' || c.Email === colab)),
    [collaborators, time, colab]
  );
  const emailsFiltrados = useMemo(() => new Set(colabsFiltrados.map(c => c.Email)), [colabsFiltrados]);

  const inicio = `${ano}-${pad(mes + 1)}-01`;
  const fim = `${ano}-${pad(mes + 1)}-31`;
  const noMes = (d?: string) => !!d && d.substring(0, 10) >= inicio && d.substring(0, 10) <= fim;

  // Tarefas do período que pertencem aos colaboradores filtrados.
  const tarefasMes = useMemo(
    () => tasks.filter(t => !t.Pessoal && emailsFiltrados.has(t.Responsavel) && noMes(t.DataLimite_Date || t.DataLimite)),
    [tasks, emailsFiltrados, inicio, fim]
  );

  // Métricas por colaborador (base de ranking, reincidência, bônus).
  const linhas: LinhaColab[] = useMemo(() => {
    return colabsFiltrados.map(user => {
      const ut = tarefasMes.filter(t => t.Responsavel === user.Email);
      const lg = ledger.filter(l => l.UserEmail === user.Email && noMes(l.Data));
      const ganhos = lg.filter(l => l.Tipo === ScoreType.GANHO).reduce((s, l) => s + l.Pontos, 0);
      const penalidades = lg.filter(l => l.Tipo === ScoreType.PENALIDADE).reduce((s, l) => s + l.Pontos, 0);
      const realizados = ganhos + penalidades;
      const possiveis = ut.reduce((s, t) => s + (t.PontosValor || 0), 0);
      const eficiencia = possiveis > 0 ? (realizados / possiveis) * 100 : 0;
      const temAtraso = ut.some(t => t.Status === TaskStatus.ATRASADA);
      const b = calcularBonus({ eficiencia, pontosRealizados: Math.max(0, realizados), temAtraso }, bonusRules);
      return {
        user,
        criadas: ut.length,
        aprovadas: ut.filter(t => t.Status === TaskStatus.APROVADA).length,
        erros: ut.filter(t => t.Status === TaskStatus.FEITA_ERRADA || t.Status === TaskStatus.NAO_FEITA).length,
        possiveis,
        realizados,
        penalidades,
        saldo: realizados,
        eficiencia,
        temAtraso,
        bonusElegivel: b.elegivel,
        bonusValor: b.valor,
      };
    });
  }, [colabsFiltrados, tarefasMes, ledger, bonusRules, inicio, fim]);

  // KPIs consolidados da empresa no período.
  const kpis = useMemo(() => {
    const criadas = tarefasMes.length;
    const aprovadas = tarefasMes.filter(t => t.Status === TaskStatus.APROVADA).length;
    const reprovadas = tarefasMes.filter(t => t.Status === TaskStatus.FEITA_ERRADA || t.Status === TaskStatus.NAO_FEITA).length;
    const atrasadas = tarefasMes.filter(t =>
      t.Status === TaskStatus.ATRASADA ||
      (t.Status === TaskStatus.PENDENTE && (t.DataLimite_Date || '') < hoje)
    ).length;
    const pendentes = tarefasMes.filter(t => t.Status === TaskStatus.PENDENTE && (t.DataLimite_Date || '') >= hoje).length;
    const possiveis = linhas.reduce((s, r) => s + r.possiveis, 0);
    const realizados = linhas.reduce((s, r) => s + r.realizados, 0);
    const produtividade = possiveis > 0 ? Math.round((realizados / possiveis) * 100) : 0;
    const elegiveis = linhas.filter(r => r.bonusElegivel).length;
    const custoBonus = linhas.reduce((s, r) => s + (r.bonusElegivel ? r.bonusValor : 0), 0);
    return { criadas, aprovadas, reprovadas, atrasadas, pendentes, produtividade, elegiveis, custoBonus };
  }, [tarefasMes, linhas, hoje]);

  const ranking = useMemo(() => [...linhas].sort((a, b) => b.saldo - a.saldo).slice(0, 8), [linhas]);
  const reincidencia = useMemo(() => linhas.filter(r => r.erros > 0).sort((a, b) => b.erros - a.erros).slice(0, 6), [linhas]);

  // Tarefas mais atrasadas (abertas, vencidas): dias de atraso desc.
  const maisAtrasadas = useMemo(() => {
    const hojeD = new Date(hoje + 'T00:00:00');
    return tarefasMes
      .filter(t => (t.Status === TaskStatus.ATRASADA || t.Status === TaskStatus.PENDENTE) && (t.DataLimite_Date || '') < hoje)
      .map(t => {
        const d = new Date((t.DataLimite_Date || t.DataLimite) + 'T00:00:00');
        const dias = Math.max(0, Math.round((hojeD.getTime() - d.getTime()) / 86400000));
        return { t, dias };
      })
      .sort((a, b) => b.dias - a.dias)
      .slice(0, 8);
  }, [tarefasMes, hoje]);

  // Evolução dos últimos 6 meses (tarefas aprovadas + eficiência).
  const evolucao = useMemo(() => {
    const out: { label: string; aprovadas: number; eficiencia: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = mes - i, a = ano;
      while (m < 0) { m += 12; a -= 1; }
      const chave = ym(a, m);
      const tt = tasks.filter(t => !t.Pessoal && emailsFiltrados.has(t.Responsavel) && (t.DataLimite_Date || '').startsWith(chave));
      const lg = ledger.filter(l => emailsFiltrados.has(l.UserEmail) && (l.Data || '').startsWith(chave));
      const aprovadas = tt.filter(t => t.Status === TaskStatus.APROVADA).length;
      const possiveis = tt.reduce((s, t) => s + (t.PontosValor || 0), 0);
      const realizados = lg.reduce((s, l) => s + l.Pontos, 0);
      const eficiencia = possiveis > 0 ? Math.round((realizados / possiveis) * 100) : 0;
      out.push({ label: `${MES_CURTO[m]}/${String(a).slice(2)}`, aprovadas, eficiencia });
    }
    return out;
  }, [tasks, ledger, emailsFiltrados, mes, ano]);

  const selectCls = 'bg-superficie border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-marca/20';
  const tudoVazio = collaborators.length === 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 lg:pb-10 font-ciatos">
      <PageHeader
        kicker="Visão executiva"
        title="Dashboard executivo"
        subtitle={empresaNome ? `Produtividade, bônus e riscos — ${empresaNome}` : 'Produtividade, bônus e riscos da empresa'}
      />

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select className={selectCls} value={mes} onChange={e => setMes(Number(e.target.value))}>
            {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select className={selectCls} value={ano} onChange={e => setAno(Number(e.target.value))}>
            {[anoAtual, anoAtual - 1, anoAtual - 2].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className={selectCls} value={time} onChange={e => { setTime(e.target.value); setColab('TODOS'); }}>
            <option value="TODOS">Todos os times</option>
            {times.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className={selectCls} value={colab} onChange={e => setColab(e.target.value)}>
            <option value="TODOS">Todos os colaboradores</option>
            {colabsFiltrados.map(c => <option key={c.Email} value={c.Email}>{c.Nome}</option>)}
          </select>
          <Pill tone="marca" className="ml-auto">{MESES[mes]} {ano}</Pill>
        </div>
      </Card>

      {tudoVazio ? (
        <Card><EmptyState title="Sem colaboradores para analisar" message="Cadastre a equipe para ver a visão executiva." /></Card>
      ) : (
        <>
          {/* KPIs principais */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Produtividade" value={`${kpis.produtividade}%`} hint="pontos realizados / possíveis" icon={<Gauge size={18} />} tone="marca" />
            <StatCard label="Tarefas criadas" value={kpis.criadas} icon={<FilePlus2 size={18} />} />
            <StatCard label="Aprovadas" value={kpis.aprovadas} icon={<CheckCircle2 size={18} />} />
            <StatCard label="Pendentes" value={kpis.pendentes} icon={<Clock size={18} />} />
            <StatCard label="Atrasadas" value={kpis.atrasadas} icon={<AlertTriangle size={18} />} />
            <StatCard label="Reprovadas" value={kpis.reprovadas} icon={<XCircle size={18} />} />
          </div>

          {/* Bônus */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard label="Colaboradores elegíveis ao bônus" value={kpis.elegiveis} hint={`de ${linhas.length} no período`} icon={<Users size={18} />} />
            <StatCard label="Custo estimado de bonificação" value={`${kpis.custoBonus} pts`} hint="soma dos bônus dos elegíveis" icon={<Coins size={18} />} tone="marca" />
          </div>

          {/* Evolução 6 meses */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-titulo text-lg text-tinta">Evolução — últimos 6 meses</h3>
              <span className="text-[10px] font-semibold px-3 py-1 bg-stone-100 rounded-full text-stone-400 uppercase tracking-wider">Aprovadas × Eficiência</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucao}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EEEC" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: MUTED, fontSize: 12 }} />
                  <YAxis yAxisId="l" axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: MUTED, fontSize: 12 }} width={28} />
                  <YAxis yAxisId="r" orientation="right" axisLine={false} tickLine={false} tick={{ fill: MUTED, fontSize: 12 }} width={34} unit="%" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E7E5E4', fontSize: 13 }} />
                  <Line yAxisId="l" type="monotone" dataKey="aprovadas" name="Aprovadas" stroke={RED} strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line yAxisId="r" type="monotone" dataKey="eficiencia" name="Eficiência %" stroke="#0EA5E9" strokeWidth={2} strokeDasharray="4 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ranking */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2">
                <Trophy size={18} className="text-marca" />
                <h3 className="font-titulo text-lg text-tinta">Ranking de colaboradores</h3>
              </div>
              {ranking.length === 0 ? (
                <EmptyState title="Sem pontuação no período" message="Ajuste os filtros acima." />
              ) : (
                <div className="divide-y divide-stone-100">
                  {ranking.map((r, i) => (
                    <div key={r.user.Email} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-sm font-semibold w-5 shrink-0 ${i === 0 ? 'text-marca' : 'text-stone-300'}`}>{i + 1}º</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-tinta truncate">{r.user.Nome}</p>
                          <p className="text-xs text-stone-400">{Math.round(r.eficiencia)}% eficiência{r.bonusElegivel ? ` · bônus +${r.bonusValor}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.bonusElegivel && <Pill tone="sucesso">Bônus</Pill>}
                        <span className="font-titulo text-base text-tinta">{r.saldo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Reincidência de erro */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2">
                <RotateCcw size={18} className="text-amber-600" />
                <h3 className="font-titulo text-lg text-tinta">Maior reincidência de erro</h3>
              </div>
              {reincidencia.length === 0 ? (
                <EmptyState title="Nenhum erro no período" message="Nenhuma tarefa reprovada ou não feita." />
              ) : (
                <div className="divide-y divide-stone-100">
                  {reincidencia.map(r => (
                    <div key={r.user.Email} className="flex items-center justify-between px-6 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-tinta truncate">{r.user.Nome}</p>
                        <p className="text-xs text-stone-400">{r.user.Time || '—'}</p>
                      </div>
                      <Pill tone="atraso">{r.erros} erro{r.erros === 1 ? '' : 's'}</Pill>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Tarefas mais atrasadas */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2">
              <TimerOff size={18} className="text-erro" />
              <h3 className="font-titulo text-lg text-tinta">Tarefas mais atrasadas</h3>
            </div>
            {maisAtrasadas.length === 0 ? (
              <EmptyState title="Nada atrasado" message="Nenhuma tarefa vencida em aberto no período." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50/60 border-b border-stone-100 text-[10px] uppercase tracking-wider text-stone-400">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Tarefa</th>
                      <th className="px-6 py-3 font-semibold">Responsável</th>
                      <th className="px-6 py-3 font-semibold">Prazo</th>
                      <th className="px-6 py-3 font-semibold text-right">Atraso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {maisAtrasadas.map(({ t, dias }) => (
                      <tr key={t.ID} className="hover:bg-stone-50/50">
                        <td className="px-6 py-3 text-tinta">{t.Titulo}</td>
                        <td className="px-6 py-3 text-stone-500">{collaborators.find(c => c.Email === t.Responsavel)?.Nome || t.Responsavel}</td>
                        <td className="px-6 py-3 text-stone-500">{new Date((t.DataLimite_Date || t.DataLimite) + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-3 text-right"><Pill tone="erro">{dias} dia{dias === 1 ? '' : 's'}</Pill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default ExecutiveDashboardView;
