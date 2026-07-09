import React, { useState, useMemo } from 'react';
import { Task, User, TaskStatus, UserRole, TaskPriority } from '../types';
import {
  Inbox, Clock, RotateCcw, Copy, ImageOff, Star, ListChecks,
  Trash2, Check, X, XCircle, Send, Paperclip, MessageSquare, ShieldCheck, CalendarClock,
} from 'lucide-react';
import { getTodayStr } from '../store';
import { PageHeader, Card, Pill, EmptyState, Btn, showToast, useUndoableDelete } from './ui';
import { urlEvidencia, pareceArquivo } from '../lib/storage';

interface TaskSupervisionViewProps {
  tasks: Task[];
  users: User[];
  onDeleteTask: (taskId: string) => void;
  onAuditTask?: (taskId: string, status: TaskStatus, justification: string, nextDeadline?: string) => void | Promise<any>;
  onValorar?: (taskId: string, pontos: number, obs?: string) => Promise<any>;
  currentUserRole?: UserRole;
}

type TabKey = 'AGUARDANDO' | 'ATRASADAS' | 'REPROVADAS' | 'DUPLICADAS' | 'SEM_EVIDENCIA' | 'PESSOAIS' | 'TODAS';
type AuditMode = 'REPROVAR' | 'NAO_FEITA' | 'AJUSTE';

const brDate = (d?: string) => d ? (d.substring(0, 10).split('-').reverse().join('/')) : '—';

const statusTone = (s: TaskStatus): React.ComponentProps<typeof Pill>['tone'] => {
  switch (s) {
    case TaskStatus.AGUARDANDO_APROVACAO: return 'info';
    case TaskStatus.APROVADA: return 'sucesso';
    case TaskStatus.FEITA_ERRADA: return 'atraso';
    case TaskStatus.NAO_FEITA: return 'erro';
    case TaskStatus.ATRASADA: return 'erro';
    default: return 'neutral';
  }
};

const TaskSupervisionView: React.FC<TaskSupervisionViewProps> = ({ tasks, users, onDeleteTask, onAuditTask, onValorar }) => {
  const hoje = getTodayStr();
  const [tab, setTab] = useState<TabKey>('AGUARDANDO');
  const [fResp, setFResp] = useState('TODOS');
  const [fTime, setFTime] = useState('TODOS');
  const [fPrio, setFPrio] = useState('TODOS');
  const [fData, setFData] = useState('');
  const { pendentes: excluindo, remover: excluirTarefa } = useUndoableDelete(onDeleteTask, 'Tarefa');

  // Modal de auditoria (reprovar / não feita / pedir ajuste)
  const [auditTask, setAuditTask] = useState<Task | null>(null);
  const [auditMode, setAuditMode] = useState<AuditMode>('REPROVAR');
  const [auditObs, setAuditObs] = useState('');
  const [auditPrazo, setAuditPrazo] = useState('');
  // Modal de valoração de tarefa pessoal
  const [valorarTask, setValorarTask] = useState<Task | null>(null);
  const [valorPts, setValorPts] = useState<number>(10);
  const [valorObs, setValorObs] = useState('');

  const nome = (email: string) => users.find(u => u.Email === email)?.Nome || email;
  const collaborators = useMemo(() => users.filter(u => u.Role === UserRole.COLABORADOR), [users]);
  const times = useMemo(() => Array.from(new Set(users.map(u => u.Time).filter(Boolean))) as string[], [users]);

  const isAtrasada = (t: Task) => t.Status === TaskStatus.ATRASADA || (t.Status === TaskStatus.PENDENTE && (t.DataLimite_Date || '') < hoje);
  const semEvidencia = (t: Task) => t.Status === TaskStatus.AGUARDANDO_APROVACAO && !pareceArquivo(t.ProofAttachment);
  const pessoalAValorar = (t: Task) => !!t.Pessoal && (t.PontosValor || 0) === 0 && t.Status !== TaskStatus.PENDENTE;

  const duplicateIds = useMemo(() => {
    const ids = new Set<string>();
    const seen = new Map<string, string>();
    tasks.forEach(t => {
      const date = t.DataLimite_Date || (t.DataLimite ? t.DataLimite.split('T')[0] : '');
      const key = `${t.Titulo.trim().toLowerCase()}|${t.Responsavel}|${date}`;
      if (seen.has(key)) { ids.add(seen.get(key)!); ids.add(t.ID); } else { seen.set(key, t.ID); }
    });
    return ids;
  }, [tasks]);

  // Aplica os filtros de controle (responsável, time, prioridade, data).
  const passaFiltros = (t: Task) => {
    if (excluindo.has(t.ID)) return false;
    if (fResp !== 'TODOS' && t.Responsavel !== fResp) return false;
    if (fTime !== 'TODOS' && users.find(u => u.Email === t.Responsavel)?.Time !== fTime) return false;
    if (fPrio !== 'TODOS' && t.Prioridade !== fPrio) return false;
    if (fData && (t.DataLimite_Date || t.DataLimite?.split('T')[0] || '') !== fData) return false;
    return true;
  };

  const predicados: Record<TabKey, (t: Task) => boolean> = {
    AGUARDANDO: t => t.Status === TaskStatus.AGUARDANDO_APROVACAO && !t.Pessoal,
    ATRASADAS: t => isAtrasada(t) && !t.Pessoal,
    REPROVADAS: t => t.Status === TaskStatus.FEITA_ERRADA && !t.Pessoal,
    DUPLICADAS: t => duplicateIds.has(t.ID),
    SEM_EVIDENCIA: t => semEvidencia(t) && !t.Pessoal,
    PESSOAIS: t => pessoalAValorar(t),
    TODAS: () => true,
  };

  const base = useMemo(() => tasks.filter(passaFiltros), [tasks, fResp, fTime, fPrio, fData, excluindo]);
  const contagem = (k: TabKey) => base.filter(predicados[k]).length;
  const lista = useMemo(
    () => base.filter(predicados[tab]).sort((a, b) => (a.DataLimite_Date || '').localeCompare(b.DataLimite_Date || '')),
    [base, tab, duplicateIds]
  );

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'AGUARDANDO', label: 'Aguardando aprovação', icon: <Inbox size={15} /> },
    { key: 'ATRASADAS', label: 'Atrasadas', icon: <Clock size={15} /> },
    { key: 'REPROVADAS', label: 'Reprovadas / refazer', icon: <RotateCcw size={15} /> },
    { key: 'DUPLICADAS', label: 'Duplicadas', icon: <Copy size={15} /> },
    { key: 'SEM_EVIDENCIA', label: 'Sem evidência', icon: <ImageOff size={15} /> },
    { key: 'PESSOAIS', label: 'Pessoais a valorar', icon: <Star size={15} /> },
    { key: 'TODAS', label: 'Todas', icon: <ListChecks size={15} /> },
  ];

  const abrirAudit = (t: Task, mode: AuditMode) => {
    setAuditTask(t); setAuditMode(mode); setAuditObs('');
    setAuditPrazo(mode === 'AJUSTE' ? (t.DataLimite_Date || '') : '');
  };

  const confirmarAudit = () => {
    if (!auditTask || !onAuditTask) return;
    if (auditMode === 'AJUSTE' && !auditPrazo) { showToast({ message: 'Defina o novo prazo para o ajuste.', tone: 'erro' }); return; }
    const status = auditMode === 'NAO_FEITA' ? TaskStatus.NAO_FEITA : TaskStatus.FEITA_ERRADA;
    const obsPadrao = auditMode === 'NAO_FEITA' ? 'Tarefa não executada dentro do prazo.'
      : auditMode === 'AJUSTE' ? 'Ajuste solicitado pelo gestor.' : 'Reprovada — refazer.';
    onAuditTask(auditTask.ID, status, auditObs || obsPadrao, auditMode === 'REPROVAR' ? undefined : (auditPrazo || undefined));
    setAuditTask(null);
  };

  const aprovar = (t: Task) => { if (onAuditTask) onAuditTask(t.ID, TaskStatus.APROVADA, ''); };

  const confirmarValor = async () => {
    if (!valorarTask || !onValorar) return;
    if (valorPts < 0) { showToast({ message: 'A pontuação não pode ser negativa.', tone: 'erro' }); return; }
    try {
      await onValorar(valorarTask.ID, valorPts, valorObs || undefined);
      showToast({ message: 'Tarefa valorada.', tone: 'sucesso' });
      setValorarTask(null);
    } catch { /* toast já emitido pela store */ }
  };

  const abrirEvidencia = async (path?: string) => {
    const url = await urlEvidencia(path);
    if (url) window.open(url, '_blank'); else showToast({ message: 'Não foi possível abrir a evidência.', tone: 'erro' });
  };

  const selectCls = 'bg-superficie border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-marca/20';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 lg:pb-10 font-ciatos">
      <PageHeader kicker="Gestão" title="Central de auditoria" subtitle="Confira as entregas do dia e mantenha a pontuação correta." />

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select className={selectCls} value={fResp} onChange={e => setFResp(e.target.value)}>
            <option value="TODOS">Todos os colaboradores</option>
            {collaborators.map(u => <option key={u.Email} value={u.Email}>{u.Nome}</option>)}
          </select>
          <select className={selectCls} value={fTime} onChange={e => setFTime(e.target.value)}>
            <option value="TODOS">Todos os times</option>
            {times.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className={selectCls} value={fPrio} onChange={e => setFPrio(e.target.value)}>
            <option value="TODOS">Todas as prioridades</option>
            {[TaskPriority.URGENTE, TaskPriority.ALTA, TaskPriority.MEDIA, TaskPriority.BAIXA].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="date" className={selectCls} value={fData} onChange={e => setFData(e.target.value)} />
          {(fResp !== 'TODOS' || fTime !== 'TODOS' || fPrio !== 'TODOS' || fData) && (
            <button onClick={() => { setFResp('TODOS'); setFTime('TODOS'); setFPrio('TODOS'); setFData(''); }}
              className="text-xs font-semibold text-marca hover:underline ml-auto">Limpar filtros</button>
          )}
        </div>
      </Card>

      {/* Abas */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(tb => {
          const n = contagem(tb.key);
          const active = tab === tb.key;
          return (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${active ? 'bg-marca text-white shadow-md shadow-marca/20' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
              {tb.icon}{tb.label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-stone-100 text-stone-500'}`}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <Card><EmptyState title="Nada por aqui" message="Nenhuma tarefa nesta aba com os filtros atuais." /></Card>
      ) : (
        <div className="space-y-3">
          {lista.map(t => {
            const dup = duplicateIds.has(t.ID);
            const atras = isAtrasada(t);
            const temEvid = pareceArquivo(t.ProofAttachment);
            const podeAuditar = !!onAuditTask && !t.Pessoal;
            return (
              <Card key={t.ID} className={`p-5 ${dup ? 'border-l-4 border-l-amber-400' : ''}`}>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-tinta">{t.Titulo}</span>
                      <Pill tone={statusTone(t.Status)}>{t.Status}</Pill>
                      {atras && t.Status !== TaskStatus.ATRASADA && <Pill tone="erro">Atrasada</Pill>}
                      {dup && <Pill tone="atraso"><Copy size={11} /> Duplicada</Pill>}
                      {t.Pessoal && <Pill tone="marca">Pessoal</Pill>}
                    </div>
                    <div className="flex items-center gap-4 flex-wrap mt-2 text-xs text-stone-500">
                      <span>{nome(t.Responsavel)}</span>
                      <span className="inline-flex items-center gap-1"><CalendarClock size={12} /> Prazo {brDate(t.DataLimite_Date || t.DataLimite)}</span>
                      <span className="inline-flex items-center gap-1"><Star size={12} /> {t.PontosValor} pts</span>
                      <span>Tentativas: {t.Tentativas || 0}</span>
                      {temEvid
                        ? <button onClick={() => abrirEvidencia(t.ProofAttachment)} className="inline-flex items-center gap-1 text-marca font-semibold hover:underline"><Paperclip size={12} /> Ver evidência</button>
                        : <span className="inline-flex items-center gap-1 text-amber-600"><ImageOff size={12} /> Sem evidência</span>}
                    </div>
                    {t.CompletionNote && (
                      <p className="mt-2 text-xs text-stone-600 bg-stone-50 rounded-lg px-3 py-2 inline-flex items-start gap-1.5">
                        <MessageSquare size={12} className="mt-0.5 shrink-0 text-stone-400" /> <span><b>Colaborador:</b> {t.CompletionNote}</span>
                      </p>
                    )}
                    {(t.JustificativaGestor || t.ObservacaoGestor) && (
                      <p className="mt-2 text-xs text-stone-600 bg-amber-50 rounded-lg px-3 py-2 inline-flex items-start gap-1.5">
                        <ShieldCheck size={12} className="mt-0.5 shrink-0 text-amber-500" /> <span><b>Gestor:</b> {t.JustificativaGestor || t.ObservacaoGestor}</span>
                      </p>
                    )}
                  </div>

                  {/* Ações rápidas */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {t.Pessoal && pessoalAValorar(t) && onValorar && (
                      <Btn variant="primary" onClick={() => { setValorarTask(t); setValorPts(10); setValorObs(''); }}><Star size={15} /> Valorar</Btn>
                    )}
                    {podeAuditar && (
                      <>
                        <button onClick={() => aprovar(t)} title="Aprovar" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:brightness-95 active:scale-[0.98]"><Check size={15} /> Aprovar</button>
                        <button onClick={() => abrirAudit(t, 'REPROVAR')} title="Reprovar (refazer)" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 active:scale-[0.98]"><RotateCcw size={15} /> Reprovar</button>
                        <button onClick={() => abrirAudit(t, 'AJUSTE')} title="Pedir ajuste (novo prazo)" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-sky-100 text-sky-700 hover:bg-sky-200 active:scale-[0.98]"><Send size={15} /> Pedir ajuste</button>
                        <button onClick={() => abrirAudit(t, 'NAO_FEITA')} title="Marcar não feita (penaliza)" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 active:scale-[0.98]"><XCircle size={15} /> Não feita</button>
                      </>
                    )}
                    <button onClick={() => excluirTarefa(t.ID)} title="Excluir" className="p-2 rounded-xl text-stone-300 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal auditoria */}
      {auditTask && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50" onClick={() => setAuditTask(null)}>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-titulo text-lg text-tinta">
                {auditMode === 'NAO_FEITA' ? 'Marcar como não feita' : auditMode === 'AJUSTE' ? 'Pedir ajuste' : 'Reprovar (refazer)'}
              </h3>
              <button onClick={() => setAuditTask(null)} className="text-stone-400 hover:text-stone-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-tinta">{auditTask.Titulo}</p>
                <p className="text-xs text-stone-500 mt-0.5">{nome(auditTask.Responsavel)} · {auditTask.PontosValor} pts</p>
                {auditMode === 'NAO_FEITA' && <p className="text-xs font-semibold text-red-600 mt-1">Penalidade: -{auditTask.PontosValor} pts</p>}
                {auditMode === 'REPROVAR' && <p className="text-xs font-semibold text-amber-600 mt-1">Penalidade por erro: -{Math.ceil(auditTask.PontosValor * 0.5)} pts</p>}
              </div>
              {(auditMode === 'AJUSTE' || auditMode === 'REPROVAR') && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                    Novo prazo {auditMode === 'AJUSTE' ? '(obrigatório)' : '(opcional — reentrega)'}
                  </label>
                  <input type="date" value={auditPrazo} onChange={e => setAuditPrazo(e.target.value)} className={selectCls + ' w-full'} />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Observação do gestor</label>
                <textarea value={auditObs} onChange={e => setAuditObs(e.target.value)} placeholder="Motivo / orientação ao colaborador…"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-marca/20 min-h-[80px]" />
              </div>
              <Btn variant="primary" full onClick={confirmarAudit}><Send size={16} /> Confirmar</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Modal valoração */}
      {valorarTask && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50" onClick={() => setValorarTask(null)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-titulo text-lg text-tinta">Valorar tarefa pessoal</h3>
              <button onClick={() => setValorarTask(null)} className="text-stone-400 hover:text-stone-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-tinta">{valorarTask.Titulo}</p>
                <p className="text-xs text-stone-500 mt-0.5">{nome(valorarTask.Responsavel)}</p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Pontos a creditar</label>
                <input type="number" min={0} value={valorPts} onChange={e => setValorPts(Number(e.target.value))} className={selectCls + ' w-32'} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Observação (opcional)</label>
                <textarea value={valorObs} onChange={e => setValorObs(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-marca/20 min-h-[70px]" />
              </div>
              <Btn variant="primary" full onClick={confirmarValor}><Star size={16} /> Creditar pontos</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskSupervisionView;
