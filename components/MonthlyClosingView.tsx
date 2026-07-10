import React, { useMemo, useState } from 'react';
import { Task, TaskStatus, ScoreLedger, ScoreType, User, UserRole, BonusRules, MonthlyClosing, ClosingStatus } from '../types';
import { calcularBonus } from '../lib/scoreEngine';
import { pdfConsolidado, LinhaPdf } from '../lib/bonusPdf';
import { PageHeader, Card, StatCard, EmptyState, Btn, Pill, showToast } from './ui';
import { Lock, LockOpen, FileText, CheckCircle2, ClipboardCheck, DollarSign, Coins } from 'lucide-react';

interface MonthlyClosingViewProps {
  tasks: Task[];
  ledger: ScoreLedger[];
  collaborators: User[];
  bonusRules: BonusRules;
  closings: MonthlyClosing[];
  empresaNome?: string;
  currentUserRole?: UserRole;
  onSalvar: (linhas: MonthlyClosing[], status: ClosingStatus) => Promise<any>;
  onSetStatus: (id: string, status: ClosingStatus) => Promise<any>;
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const pad = (n: number) => String(n).padStart(2, '0');

const STATUS_LABEL: Record<ClosingStatus, string> = { aberto: 'Aberto', em_revisao: 'Em revisão', fechado: 'Fechado', pago: 'Pago' };
const STATUS_TONE: Record<ClosingStatus, React.ComponentProps<typeof Pill>['tone']> = {
  aberto: 'neutral', em_revisao: 'info', fechado: 'marca', pago: 'sucesso',
};

interface Linha extends MonthlyClosing {
  nome: string;
  time?: string;
  aprovadas: number; erros: number; naoFeitas: number; refeitas: number; ganhos: number;
  existingId?: string;
}

const MonthlyClosingView: React.FC<MonthlyClosingViewProps> = ({
  tasks, ledger, collaborators, bonusRules, closings, empresaNome, currentUserRole, onSalvar, onSetStatus,
}) => {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState(new Date().getMonth()); // 0-11
  const [saving, setSaving] = useState(false);
  const isPlataforma = currentUserRole === UserRole.PLATAFORMA;

  const inicio = `${ano}-${pad(mes + 1)}-01`;
  const fim = `${ano}-${pad(mes + 1)}-31`;
  const noMes = (d?: string) => !!d && d.substring(0, 10) >= inicio && d.substring(0, 10) <= fim;

  const linhas: Linha[] = useMemo(() => {
    return collaborators.map(u => {
      const ut = tasks.filter(t => !t.Pessoal && t.Responsavel === u.Email && noMes(t.DataLimite_Date || t.DataLimite));
      const lg = ledger.filter(l => l.UserEmail === u.Email && noMes(l.Data));
      const ganhos = lg.filter(l => l.Tipo === ScoreType.GANHO).reduce((s, l) => s + l.Pontos, 0);
      const penalidades = lg.filter(l => l.Tipo === ScoreType.PENALIDADE).reduce((s, l) => s + l.Pontos, 0);
      const realizados = ganhos + penalidades;
      const possiveis = ut.reduce((s, t) => s + (t.PontosValor || 0), 0);
      const eficiencia = possiveis > 0 ? (realizados / possiveis) * 100 : 0;
      const temAtraso = ut.some(t => t.Status === TaskStatus.ATRASADA);
      const b = calcularBonus({ eficiencia, pontosRealizados: Math.max(0, realizados), temAtraso }, bonusRules);
      const existente = closings.find(c => c.ano === ano && c.mes === mes + 1 && c.colaborador === u.Email);
      return {
        nome: u.Nome, time: u.Time,
        ano, mes: mes + 1, colaborador: u.Email,
        pontos_possiveis: possiveis, pontos_realizados: realizados, eficiencia,
        penalidades, saldo_final: realizados,
        status_bonus: b.elegivel ? 'elegivel' : 'nao_elegivel',
        bonus_sugerido: b.valor,
        status_fechamento: existente?.status_fechamento || 'aberto',
        existingId: existente?.id,
        aprovadas: ut.filter(t => t.Status === TaskStatus.APROVADA).length,
        erros: ut.filter(t => t.Status === TaskStatus.FEITA_ERRADA).length,
        naoFeitas: ut.filter(t => t.Status === TaskStatus.NAO_FEITA).length,
        refeitas: ut.filter(t => (t.Tentativas || 0) > 0).length,
        ganhos,
      };
    });
  }, [collaborators, tasks, ledger, bonusRules, closings, ano, mes]);

  // Status agregado do período (todos iguais => aquele status; senão, o "menor" progresso).
  const periodoStatus: ClosingStatus = useMemo(() => {
    const sts = linhas.map(l => l.status_fechamento);
    if (sts.length && sts.every(s => s === 'pago')) return 'pago';
    if (sts.length && sts.every(s => s === 'fechado' || s === 'pago')) return 'fechado';
    if (sts.some(s => s === 'em_revisao' || s === 'fechado' || s === 'pago')) return 'em_revisao';
    return 'aberto';
  }, [linhas]);

  const fechado = periodoStatus === 'fechado' || periodoStatus === 'pago';
  const label = `${MESES[mes]} ${ano}`;
  const totais = useMemo(() => ({
    elegiveis: linhas.filter(l => l.status_bonus === 'elegivel').length,
    custo: linhas.reduce((s, l) => s + (l.status_bonus === 'elegivel' ? l.bonus_sugerido : 0), 0),
  }), [linhas]);

  const salvarComStatus = async (status: ClosingStatus) => {
    if (!linhas.length) return;
    setSaving(true);
    try {
      await onSalvar(linhas as MonthlyClosing[], status);
      showToast({ message: `Período ${STATUS_LABEL[status].toLowerCase()}.`, tone: 'sucesso' });
    } catch { /* toast já emitido pela store */ } finally { setSaving(false); }
  };

  const marcarPago = async () => {
    setSaving(true);
    try {
      const comId = linhas.filter(l => l.existingId);
      await Promise.all(comId.map(l => onSetStatus(l.existingId!, 'pago')));
      // fechamentos ainda não persistidos: salva direto como pago
      const semId = linhas.filter(l => !l.existingId);
      if (semId.length) await onSalvar(semId as MonthlyClosing[], 'pago');
      showToast({ message: 'Período marcado como pago.', tone: 'sucesso' });
    } catch { /* toast já emitido */ } finally { setSaving(false); }
  };

  const reabrir = async () => {
    if (!isPlataforma) return;
    setSaving(true);
    try {
      const comId = linhas.filter(l => l.existingId);
      await Promise.all(comId.map(l => onSetStatus(l.existingId!, 'aberto')));
      showToast({ message: 'Período reaberto.', tone: 'sucesso' });
    } catch { /* toast já emitido */ } finally { setSaving(false); }
  };

  const gerarPdf = () => {
    const pdfLinhas: LinhaPdf[] = linhas.map(l => ({
      nome: l.nome, time: l.time,
      aprovadas: l.aprovadas, erros: l.erros, naoFeitas: l.naoFeitas, refeitas: l.refeitas,
      ganhos: l.ganhos, penalidades: l.penalidades, saldo: l.saldo_final,
      eficiencia: l.eficiencia, bonus: l.bonus_sugerido, elegivel: l.status_bonus === 'elegivel',
    }));
    pdfConsolidado(empresaNome || 'Empresa', label, pdfLinhas);
  };

  const selectCls = 'bg-superficie border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-marca/20';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 lg:pb-10 font-ciatos">
      <PageHeader
        kicker="Administração"
        title="Fechamento mensal de pontuação"
        subtitle={empresaNome ? `Feche oficialmente a pontuação para bonificação — ${empresaNome}` : 'Feche oficialmente a pontuação para bonificação'}
        action={<Btn variant="secondary" onClick={gerarPdf}><FileText size={16} /> Extrato PDF</Btn>}
      />

      {/* Filtro + status + ações */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select className={selectCls} value={mes} onChange={e => setMes(Number(e.target.value))}>
            {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select className={selectCls} value={ano} onChange={e => setAno(Number(e.target.value))}>
            {[anoAtual, anoAtual - 1, anoAtual - 2].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <Pill tone={STATUS_TONE[periodoStatus]}>{fechado ? <Lock size={12} /> : <LockOpen size={12} />} {STATUS_LABEL[periodoStatus]}</Pill>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {!fechado && <Btn variant="secondary" onClick={() => salvarComStatus('em_revisao')} loading={saving}><ClipboardCheck size={16} /> Em revisão</Btn>}
            {!fechado && <Btn variant="primary" onClick={() => salvarComStatus('fechado')} loading={saving}><Lock size={16} /> Fechar período</Btn>}
            {periodoStatus === 'fechado' && <Btn variant="primary" onClick={marcarPago} loading={saving}><DollarSign size={16} /> Marcar como pago</Btn>}
            {fechado && isPlataforma && <Btn variant="secondary" onClick={reabrir} loading={saving}><LockOpen size={16} /> Reabrir (Plataforma)</Btn>}
          </div>
        </div>
        {fechado && (
          <p className="text-xs text-stone-500 mt-3 flex items-center gap-1.5">
            <Lock size={12} /> Período fechado — a pontuação retroativa fica travada; apenas a Plataforma pode reabrir/alterar.
          </p>
        )}
      </Card>

      {/* KPIs do fechamento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Colaboradores" value={linhas.length} icon={<CheckCircle2 size={18} />} />
        <StatCard label="Elegíveis ao bônus" value={totais.elegiveis} icon={<CheckCircle2 size={18} />} />
        <StatCard label="Bônus sugerido" value={`${totais.custo} pts`} icon={<Coins size={18} />} tone="marca" />
        <StatCard label="Período" value={label} />
      </div>

      {/* Revisão colaborador a colaborador */}
      {linhas.length === 0 ? (
        <Card><EmptyState title="Sem colaboradores" message="Cadastre a equipe para fechar o período." /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h3 className="font-titulo text-lg text-tinta">Revisão por colaborador</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50/60 border-b border-stone-100 text-[10px] uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">Colaborador</th>
                  <th className="px-6 py-3 font-semibold text-right">Possíveis</th>
                  <th className="px-6 py-3 font-semibold text-right">Realizados</th>
                  <th className="px-6 py-3 font-semibold text-right">Efic.</th>
                  <th className="px-6 py-3 font-semibold text-right">Penal.</th>
                  <th className="px-6 py-3 font-semibold text-right">Saldo</th>
                  <th className="px-6 py-3 font-semibold text-center">Bônus</th>
                  <th className="px-6 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {linhas.map(l => (
                  <tr key={l.colaborador} className="hover:bg-stone-50/50">
                    <td className="px-6 py-3">
                      <p className="font-semibold text-tinta">{l.nome}</p>
                      <p className="text-xs text-stone-400">{l.time || '—'}</p>
                    </td>
                    <td className="px-6 py-3 text-right text-stone-600">{l.pontos_possiveis}</td>
                    <td className="px-6 py-3 text-right text-stone-600">{l.pontos_realizados}</td>
                    <td className="px-6 py-3 text-right text-stone-600">{Math.round(l.eficiencia)}%</td>
                    <td className="px-6 py-3 text-right text-erro">{l.penalidades || '—'}</td>
                    <td className="px-6 py-3 text-right font-titulo text-base text-tinta">{l.saldo_final}</td>
                    <td className="px-6 py-3 text-center">
                      {l.status_bonus === 'elegivel'
                        ? <span className="font-semibold text-emerald-600">+{l.bonus_sugerido}</span>
                        : <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-6 py-3 text-center"><Pill tone={STATUS_TONE[l.status_fechamento]}>{STATUS_LABEL[l.status_fechamento]}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MonthlyClosingView;
