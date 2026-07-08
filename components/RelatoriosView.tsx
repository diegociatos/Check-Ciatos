import React, { useMemo, useState } from 'react';
import { Task, TaskStatus, ScoreLedger, ScoreType, User, UserRole } from '../types';
import { Download, TrendingUp, TrendingDown, Scale, Award } from 'lucide-react';
import { PageHeader, Card, StatCard, EmptyState, Btn, Pill } from './ui';

interface RelatoriosViewProps {
  tasks: Task[];
  ledger: ScoreLedger[];
  users: User[];
  collaboratorsList: User[];
}

type Periodo = 'MES' | 'TRIMESTRE' | 'SEMESTRE' | 'ANO';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const pad = (n: number) => String(n).padStart(2, '0');
const dataStr = (ano: number, mes: number, dia: number) => `${ano}-${pad(mes)}-${pad(dia)}`;

interface LinhaRel {
  user: User;
  aprovadas: number;
  erros: number;
  naoFeitas: number;
  ganhos: number;
  penalidades: number;
  saldo: number;
}

const RelatoriosView: React.FC<RelatoriosViewProps> = ({ tasks, ledger, users, collaboratorsList }) => {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth(); // 0-11
  const [periodo, setPeriodo] = useState<Periodo>('MES');
  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState(mesAtual); // 0-11
  const [tri, setTri] = useState(Math.floor(mesAtual / 3)); // 0-3
  const [sem, setSem] = useState(mesAtual < 6 ? 0 : 1); // 0-1

  const { inicio, fim, label } = useMemo(() => {
    if (periodo === 'ANO') return { inicio: dataStr(ano, 1, 1), fim: dataStr(ano, 12, 31), label: `${ano}` };
    if (periodo === 'SEMESTRE') {
      const m0 = sem === 0 ? 1 : 7;
      return { inicio: dataStr(ano, m0, 1), fim: dataStr(ano, m0 + 5, 30), label: `${sem + 1}º semestre ${ano}` };
    }
    if (periodo === 'TRIMESTRE') {
      const m0 = tri * 3 + 1;
      return { inicio: dataStr(ano, m0, 1), fim: dataStr(ano, m0 + 2, 31), label: `${tri + 1}º trimestre ${ano}` };
    }
    return { inicio: dataStr(ano, mes + 1, 1), fim: dataStr(ano, mes + 1, 31), label: `${MESES[mes]} ${ano}` };
  }, [periodo, ano, mes, tri, sem]);

  const noPeriodo = (d?: string) => !!d && d.substring(0, 10) >= inicio && d.substring(0, 10) <= fim;

  const linhas: LinhaRel[] = useMemo(() => {
    return collaboratorsList
      .map((user) => {
        const ut = tasks.filter((t) => t.Responsavel === user.Email && noPeriodo(t.DataLimite_Date || t.DataLimite));
        const lg = ledger.filter((l) => l.UserEmail === user.Email && noPeriodo(l.Data));
        const ganhos = lg.filter((l) => l.Tipo === ScoreType.GANHO).reduce((s, l) => s + l.Pontos, 0);
        const penalidades = lg.filter((l) => l.Tipo === ScoreType.PENALIDADE).reduce((s, l) => s + l.Pontos, 0);
        return {
          user,
          aprovadas: ut.filter((t) => t.Status === TaskStatus.APROVADA).length,
          erros: ut.filter((t) => t.Status === TaskStatus.FEITA_ERRADA).length,
          naoFeitas: ut.filter((t) => t.Status === TaskStatus.NAO_FEITA).length,
          ganhos,
          penalidades,
          saldo: ganhos + penalidades,
        };
      })
      .sort((a, b) => b.saldo - a.saldo);
  }, [collaboratorsList, tasks, ledger, inicio, fim]);

  const totais = useMemo(() => {
    const ganhos = linhas.reduce((s, r) => s + r.ganhos, 0);
    const penalidades = linhas.reduce((s, r) => s + r.penalidades, 0);
    const aprovadas = linhas.reduce((s, r) => s + r.aprovadas, 0);
    return { ganhos, penalidades, saldo: ganhos + penalidades, aprovadas };
  }, [linhas]);

  const extrato = useMemo(
    () =>
      ledger
        .filter((l) => noPeriodo(l.Data))
        .sort((a, b) => new Date(b.Data).getTime() - new Date(a.Data).getTime()),
    [ledger, inicio, fim]
  );

  const baixarCSV = () => {
    const cab = ['Colaborador', 'Time', 'Aprovadas', 'Erros', 'Não feitas', 'Pontos ganhos', 'Penalidades', 'Saldo'];
    const corpo = linhas.map((r) => [r.user.Nome, r.user.Time || '', r.aprovadas, r.erros, r.naoFeitas, r.ganhos, r.penalidades, r.saldo]);
    const csv = [cab, ...corpo]
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${label.replace(/\s+/g, '_').toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const selectCls = 'bg-superficie border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-marca/20';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        kicker="Gestão"
        title="Relatórios"
        subtitle="Desempenho e pontuação da equipe por período."
        action={<Btn variant="secondary" onClick={baixarCSV}><Download size={16} /> Exportar CSV</Btn>}
      />

      {/* Filtro de período */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select className={selectCls} value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
            <option value="MES">Mês</option>
            <option value="TRIMESTRE">Trimestre</option>
            <option value="SEMESTRE">Semestre</option>
            <option value="ANO">Ano</option>
          </select>

          {periodo === 'MES' && (
            <select className={selectCls} value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          )}
          {periodo === 'TRIMESTRE' && (
            <select className={selectCls} value={tri} onChange={(e) => setTri(Number(e.target.value))}>
              {[0, 1, 2, 3].map((t) => <option key={t} value={t}>{t + 1}º trimestre</option>)}
            </select>
          )}
          {periodo === 'SEMESTRE' && (
            <select className={selectCls} value={sem} onChange={(e) => setSem(Number(e.target.value))}>
              {[0, 1].map((s) => <option key={s} value={s}>{s + 1}º semestre</option>)}
            </select>
          )}

          <select className={selectCls} value={ano} onChange={(e) => setAno(Number(e.target.value))}>
            {[anoAtual, anoAtual - 1, anoAtual - 2].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <Pill tone="marca" className="ml-auto">{label}</Pill>
        </div>
      </Card>

      {/* Consolidado */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pontos ganhos" value={totais.ganhos} icon={<TrendingUp size={18} />} />
        <StatCard label="Penalidades" value={totais.penalidades} icon={<TrendingDown size={18} />} />
        <StatCard label="Saldo" value={totais.saldo} icon={<Scale size={18} />} tone="marca" />
        <StatCard label="Tarefas aprovadas" value={totais.aprovadas} icon={<Award size={18} />} />
      </div>

      {collaboratorsList.length === 0 ? (
        <Card><EmptyState title="Nenhum colaborador para relatar" message="Cadastre colaboradores para acompanhar o desempenho por período." /></Card>
      ) : (
        <>
          {/* Tabela por colaborador */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100">
              <h3 className="font-titulo text-lg text-tinta">Por colaborador</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50/60 border-b border-stone-100 text-[10px] uppercase tracking-wider text-stone-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Colaborador</th>
                    <th className="px-6 py-3 font-semibold text-center">Aprovadas</th>
                    <th className="px-6 py-3 font-semibold text-center">Erros</th>
                    <th className="px-6 py-3 font-semibold text-center">Não feitas</th>
                    <th className="px-6 py-3 font-semibold text-right">Ganhos</th>
                    <th className="px-6 py-3 font-semibold text-right">Penal.</th>
                    <th className="px-6 py-3 font-semibold text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {linhas.map((r) => (
                    <tr key={r.user.Email} className="hover:bg-stone-50/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-marca rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">{r.user.Nome.charAt(0)}</div>
                          <div>
                            <p className="font-semibold text-tinta">{r.user.Nome}</p>
                            <p className="text-xs text-stone-400">{r.user.Time || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center text-tinta">{r.aprovadas}</td>
                      <td className="px-6 py-3 text-center text-amber-600">{r.erros || '—'}</td>
                      <td className="px-6 py-3 text-center text-erro">{r.naoFeitas || '—'}</td>
                      <td className="px-6 py-3 text-right text-emerald-600 font-medium">+{r.ganhos}</td>
                      <td className="px-6 py-3 text-right text-erro font-medium">{r.penalidades}</td>
                      <td className="px-6 py-3 text-right font-titulo text-base text-tinta">{r.saldo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Extrato de movimentações (absorve Supervisão de pontos) */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100">
              <h3 className="font-titulo text-lg text-tinta">Movimentações no período</h3>
              <p className="text-xs text-stone-400 mt-0.5">{extrato.length} lançamento{extrato.length === 1 ? '' : 's'}</p>
            </div>
            {extrato.length === 0 ? (
              <EmptyState title="Sem lançamentos neste período" message="Ajuste o filtro acima para ver outro intervalo." />
            ) : (
              <div className="max-h-[420px] overflow-y-auto divide-y divide-stone-100">
                {extrato.map((l) => (
                  <div key={l.ID} className="flex items-center justify-between px-6 py-3">
                    <div className="min-w-0">
                      <p className="text-sm text-tinta truncate">{l.Descricao}</p>
                      <p className="text-xs text-stone-400">
                        {users.find((u) => u.Email === l.UserEmail)?.Nome || l.UserEmail} · {new Date(l.Data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ml-3 ${l.Pontos >= 0 ? 'text-emerald-600' : 'text-erro'}`}>
                      {l.Pontos >= 0 ? '+' : ''}{l.Pontos}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default RelatoriosView;
