import React, { useMemo, useState } from 'react';
import { Task, TaskStatus, ScoreLedger, ScoreType, User, UserRole, BonusRules, MonthlyClosing } from '../types';
import { Download, TrendingUp, TrendingDown, Scale, Award, Coins, FileText } from 'lucide-react';
import { PageHeader, Card, StatCard, EmptyState, Btn, Pill } from './ui';
import { calcularBonus } from '../lib/scoreEngine';
import { pdfConsolidado, pdfColaborador, LinhaPdf } from '../lib/bonusPdf';
import { pareceArquivo } from '../lib/storage';

interface RelatoriosViewProps {
  tasks: Task[];
  ledger: ScoreLedger[];
  users: User[];
  collaboratorsList: User[];
  bonusRules: BonusRules;
  empresaNome?: string;
  closings?: MonthlyClosing[];
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
  refeitas: number;
  ganhos: number;
  penalidades: number;
  saldo: number;
  eficiencia: number;
  bonus: number;
  elegivel: boolean;
}

const RelatoriosView: React.FC<RelatoriosViewProps> = ({ tasks, ledger, users, collaboratorsList, bonusRules, empresaNome, closings = [] }) => {
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
        const saldo = ganhos + penalidades;
        // Eficiência e bônus no período, segundo as Regras de Bonificação da empresa.
        const possiveis = ut.reduce((s, t) => s + (t.PontosValor || 0), 0);
        const eficiencia = possiveis > 0 ? (saldo / possiveis) * 100 : 0;
        const temAtraso = ut.some((t) => t.Status === TaskStatus.ATRASADA);
        const b = calcularBonus({ eficiencia, pontosRealizados: Math.max(0, saldo), temAtraso }, bonusRules);
        return {
          user,
          aprovadas: ut.filter((t) => t.Status === TaskStatus.APROVADA).length,
          erros: ut.filter((t) => t.Status === TaskStatus.FEITA_ERRADA).length,
          naoFeitas: ut.filter((t) => t.Status === TaskStatus.NAO_FEITA).length,
          refeitas: ut.filter((t) => (t.Tentativas || 0) > 0).length,
          ganhos,
          penalidades,
          saldo,
          eficiencia,
          bonus: b.valor,
          elegivel: b.elegivel,
        };
      })
      .sort((a, b) => b.saldo - a.saldo);
  }, [collaboratorsList, tasks, ledger, inicio, fim, bonusRules]);

  const totais = useMemo(() => {
    const ganhos = linhas.reduce((s, r) => s + r.ganhos, 0);
    const penalidades = linhas.reduce((s, r) => s + r.penalidades, 0);
    const aprovadas = linhas.reduce((s, r) => s + r.aprovadas, 0);
    const bonus = linhas.reduce((s, r) => s + r.bonus, 0);
    const elegiveis = linhas.filter((r) => r.elegivel).length;
    return { ganhos, penalidades, saldo: ganhos + penalidades, aprovadas, bonus, elegiveis };
  }, [linhas]);

  const extrato = useMemo(
    () =>
      ledger
        .filter((l) => noPeriodo(l.Data))
        .sort((a, b) => new Date(b.Data).getTime() - new Date(a.Data).getTime()),
    [ledger, inicio, fim]
  );

  // Status de fechamento do mês selecionado (só faz sentido no período "Mês").
  const fechamento = useMemo(() => {
    if (periodo !== 'MES') return null;
    const cs = closings.filter(c => c.ano === ano && c.mes === mes + 1);
    if (!cs.length) return 'aberto';
    if (cs.every(c => c.status_fechamento === 'pago')) return 'pago';
    if (cs.every(c => c.status_fechamento === 'fechado' || c.status_fechamento === 'pago')) return 'fechado';
    if (cs.some(c => ['em_revisao', 'fechado', 'pago'].includes(c.status_fechamento))) return 'em_revisao';
    return 'aberto';
  }, [closings, ano, mes, periodo]);
  const fechamentoLabel: Record<string, string> = { aberto: 'Período aberto', em_revisao: 'Em revisão', fechado: 'Período fechado', pago: 'Pago' };

  const toLinhaPdf = (r: LinhaRel): LinhaPdf => ({
    nome: r.user.Nome, time: r.user.Time,
    aprovadas: r.aprovadas, erros: r.erros, naoFeitas: r.naoFeitas, refeitas: r.refeitas,
    ganhos: r.ganhos, penalidades: r.penalidades, saldo: r.saldo,
    eficiencia: r.eficiencia, bonus: r.bonus, elegivel: r.elegivel,
  });

  const gerarPdfEquipe = () => pdfConsolidado(empresaNome || 'Empresa', label, linhas.map(toLinhaPdf));

  const gerarPdfColab = (r: LinhaRel) => {
    const ut = tasks.filter((t) => t.Responsavel === r.user.Email && noPeriodo(t.DataLimite_Date || t.DataLimite));
    const tarefas = ut.map((t) => ({ titulo: t.Titulo, status: t.Status, evidencia: pareceArquivo(t.ProofAttachment) }));
    pdfColaborador(empresaNome || 'Empresa', label, toLinhaPdf(r), tarefas);
  };

  const baixarCSV = () => {
    const cab = ['Colaborador', 'Time', 'Aprovadas', 'Erros', 'Não feitas', 'Pontos ganhos', 'Penalidades', 'Saldo', 'Eficiência (%)', 'Bônus'];
    const corpo = linhas.map((r) => [r.user.Nome, r.user.Time || '', r.aprovadas, r.erros, r.naoFeitas, r.ganhos, r.penalidades, r.saldo, Math.round(r.eficiencia), r.elegivel ? r.bonus : 0]);
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
        action={
          <div className="flex items-center gap-2">
            <Btn variant="secondary" onClick={baixarCSV}><Download size={16} /> CSV</Btn>
            <Btn variant="primary" onClick={gerarPdfEquipe}><FileText size={16} /> Gerar PDF</Btn>
          </div>
        }
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

          <div className="ml-auto flex items-center gap-2">
            {fechamento && (
              <Pill tone={fechamento === 'fechado' ? 'marca' : fechamento === 'pago' ? 'sucesso' : fechamento === 'em_revisao' ? 'info' : 'neutral'}>
                {fechamentoLabel[fechamento]}
              </Pill>
            )}
            <Pill tone="marca">{label}</Pill>
          </div>
        </div>
      </Card>

      {/* Consolidado */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Pontos ganhos" value={totais.ganhos} icon={<TrendingUp size={18} />} />
        <StatCard label="Penalidades" value={totais.penalidades} icon={<TrendingDown size={18} />} />
        <StatCard label="Saldo" value={totais.saldo} icon={<Scale size={18} />} tone="marca" />
        <StatCard label="Tarefas aprovadas" value={totais.aprovadas} icon={<Award size={18} />} />
        <StatCard label="Bônus previsto" value={`+${totais.bonus}`} hint={`${totais.elegiveis} elegíve${totais.elegiveis === 1 ? 'l' : 'is'}`} icon={<Coins size={18} />} />
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
                    <th className="px-6 py-3 font-semibold text-right">Efic.</th>
                    <th className="px-6 py-3 font-semibold text-right">Bônus</th>
                    <th className="px-6 py-3 font-semibold text-center">PDF</th>
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
                      <td className="px-6 py-3 text-right text-stone-600">{Math.round(r.eficiencia)}%</td>
                      <td className="px-6 py-3 text-right">
                        {r.elegivel
                          ? <span className="font-semibold text-emerald-600">+{r.bonus}</span>
                          : <span className="text-stone-300">—</span>}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button onClick={() => gerarPdfColab(r)} title="Gerar PDF individual"
                          className="inline-flex items-center justify-center p-1.5 rounded-lg text-stone-400 hover:text-marca hover:bg-marca/10">
                          <FileText size={15} />
                        </button>
                      </td>
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
