import React, { useMemo, useState } from 'react';
import { Task, TaskStatus, User, UserRole } from '../types';
import { getTodayStr } from '../store';
import { pontosAprovacao } from '../lib/scoreEngine';
import { validarArquivo, uploadEvidencia, MAX_MB } from '../lib/storage';
import { PageHeader, showToast } from './ui';
import { Play, Check, RotateCcw, X, Send, Paperclip, FileText, Clock, AlertTriangle, GripVertical } from 'lucide-react';

interface Props {
  tasks: Task[];
  currentUser: User;
  users: User[];
  currentUserRole: UserRole;
  onDefinirAndamento: (taskId: string, andamento: string) => Promise<void>;
  onComplete: (taskId: string, note: string, proof: string) => void;
  permiteAnexos?: boolean;
}

type Col = 'afazer' | 'andamento' | 'atrasada' | 'concluida';

const COLS: { key: Col; label: string; dot: string; head: string; ring: string }[] = [
  { key: 'afazer',    label: 'A fazer',      dot: 'bg-sky-500',     head: 'text-sky-700',     ring: 'ring-sky-200' },
  { key: 'andamento', label: 'Em andamento', dot: 'bg-marca',       head: 'text-marca',       ring: 'ring-marca/30' },
  { key: 'atrasada',  label: 'Atrasadas',    dot: 'bg-red-500',     head: 'text-red-700',     ring: 'ring-red-200' },
  { key: 'concluida', label: 'Concluídas',   dot: 'bg-emerald-500', head: 'text-emerald-700', ring: 'ring-emerald-200' },
];

const CONCLUIDO = [TaskStatus.AGUARDANDO_APROVACAO, TaskStatus.APROVADA];

function colunaDaTarefa(t: Task, hoje: string): Col {
  if (CONCLUIDO.includes(t.Status)) return 'concluida';
  const overdue = !!t.DataLimite_Date && t.DataLimite_Date < hoje;
  const iniciada = (t.Andamento || 'Pendente') === 'Em andamento';
  if (iniciada) return 'andamento';
  if (overdue) return 'atrasada';
  return 'afazer';
}

const KanbanView: React.FC<Props> = ({ tasks, currentUser, users, currentUserRole, onDefinirAndamento, onComplete, permiteAnexos = true }) => {
  const hoje = getTodayStr();
  const ehGestao = [UserRole.ADMIN, UserRole.PLATAFORMA, UserRole.MASTER, UserRole.GESTOR].includes(currentUserRole);
  const [escopo, setEscopo] = useState<'minhas' | 'equipe'>('minhas');
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [dropAlvo, setDropAlvo] = useState<Col | null>(null);

  // Conclusão (nota + evidência opcional)
  const [concluir, setConcluir] = useState<Task | null>(null);
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const nomePorEmail = useMemo(() => {
    const m = new Map<string, string>();
    users.forEach((u) => m.set(u.Email.toLowerCase(), u.Nome || u.Email.split('@')[0]));
    return m;
  }, [users]);

  const base = useMemo(() => {
    const naoPessoais = tasks.filter((t) => !t.Pessoal);
    return escopo === 'minhas' || !ehGestao
      ? naoPessoais.filter((t) => t.Responsavel === currentUser.Email)
      : naoPessoais;
  }, [tasks, escopo, ehGestao, currentUser.Email]);

  const colunas = useMemo(() => {
    const m: Record<Col, Task[]> = { afazer: [], andamento: [], atrasada: [], concluida: [] };
    base.forEach((t) => m[colunaDaTarefa(t, hoje)].push(t));
    const ordena = (a: Task, b: Task) => (a.DataLimite_Date || '').localeCompare(b.DataLimite_Date || '');
    (Object.keys(m) as Col[]).forEach((k) => m[k].sort(ordena));
    return m;
  }, [base, hoje]);

  const podeAgir = (t: Task) => t.Responsavel === currentUser.Email || ehGestao;

  const mover = async (t: Task, destino: Col) => {
    const atual = colunaDaTarefa(t, hoje);
    if (atual === destino) return;
    if (!podeAgir(t)) { showToast({ message: 'Você não pode mover esta obrigação.', tone: 'erro' }); return; }
    if (destino === 'andamento') await onDefinirAndamento(t.ID, 'Em andamento');
    else if (destino === 'afazer') await onDefinirAndamento(t.ID, 'Pendente');
    else if (destino === 'concluida') abrirConcluir(t);
    // 'atrasada' não é destino manual (é derivado da data).
  };

  const abrirConcluir = (t: Task) => { setConcluir(t); setNote(''); setFile(null); setUploadError(''); };

  const escolherArquivo = (f: File | null) => {
    setUploadError('');
    if (f) { const err = validarArquivo(f); if (err) { setUploadError(err); setFile(null); return; } }
    setFile(f);
  };

  const confirmarConclusao = async () => {
    if (!concluir || uploading) return;
    let proof = '';
    if (file) {
      setUploading(true); setUploadError('');
      try {
        proof = await uploadEvidencia(file, concluir.empresa_id || '', concluir.ID);
      } catch (e: any) {
        setUploadError(e?.message || 'Falha no upload da evidência.'); setUploading(false); return;
      }
      setUploading(false);
    }
    onComplete(concluir.ID, note, proof);
    setConcluir(null); setNote(''); setFile(null);
  };

  const prazoFmt = (t: Task) => {
    const d = t.DataLimite_Date || t.DataLimite?.split('T')[0] || '';
    return d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—';
  };

  const Card: React.FC<{ t: Task; col: Col }> = ({ t, col }) => {
    const overdue = !!t.DataLimite_Date && t.DataLimite_Date < hoje && !CONCLUIDO.includes(t.Status);
    const pts = pontosAprovacao({ pontosBase: t.PontosValor, prioridade: t.Prioridade, atrasada: overdue, reentrega: (t.Tentativas || 0) > 0 });
    const podeArrastar = col !== 'concluida' && podeAgir(t);
    return (
      <div
        draggable={podeArrastar}
        onDragStart={(e) => { setArrastando(t.ID); e.dataTransfer.setData('text/plain', t.ID); e.dataTransfer.effectAllowed = 'move'; }}
        onDragEnd={() => { setArrastando(null); setDropAlvo(null); }}
        className={`bg-white rounded-xl border border-stone-200 p-3 shadow-[0_1px_2px_rgba(28,25,23,0.04)] ${podeArrastar ? 'cursor-grab active:cursor-grabbing' : ''} ${arrastando === t.ID ? 'opacity-50' : ''}`}
      >
        <div className="flex items-start gap-1.5">
          {podeArrastar && <GripVertical size={14} className="text-stone-300 mt-0.5 shrink-0 hidden md:block" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-stone-900 leading-snug">{t.Titulo}</p>
            {(escopo === 'equipe' && ehGestao) && (
              <p className="text-[11px] text-stone-400 mt-0.5 truncate">{nomePorEmail.get(t.Responsavel.toLowerCase()) || t.Responsavel.split('@')[0]}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-[11px] inline-flex items-center gap-1 ${overdue ? 'text-red-600 font-semibold' : 'text-stone-400'}`}>
                {overdue ? <AlertTriangle size={12} /> : <Clock size={12} />} {prazoFmt(t)}
              </span>
              <span className="text-[11px] font-semibold text-marca">{pts} pts</span>
              {col === 'concluida' && t.Status === TaskStatus.AGUARDANDO_APROVACAO && (
                <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-full">aguardando aprovação</span>
              )}
            </div>

            {podeAgir(t) && col !== 'concluida' && (
              <div className="flex gap-1.5 mt-2.5">
                {col !== 'andamento' && (
                  <button onClick={() => mover(t, 'andamento')} className="flex-1 text-[11px] font-semibold py-1.5 rounded-lg bg-marca/10 text-marca hover:bg-marca/20 transition-colors flex items-center justify-center gap-1">
                    <Play size={12} /> Iniciar
                  </button>
                )}
                {col === 'andamento' && (
                  <button onClick={() => mover(t, 'afazer')} className="text-[11px] font-semibold py-1.5 px-2 rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors flex items-center justify-center gap-1">
                    <RotateCcw size={12} /> Voltar
                  </button>
                )}
                <button onClick={() => abrirConcluir(t)} className="flex-1 text-[11px] font-semibold py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1">
                  <Check size={12} /> Concluir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-ciatos pb-20 animate-in fade-in duration-500">
      <PageHeader
        kicker="Fluxo"
        title="Quadro (Kanban)"
        subtitle="Arraste os cards ou use os botões para dar andamento. Atrasadas ficam em destaque."
        action={ehGestao ? (
          <div className="inline-flex bg-stone-100 rounded-xl p-1">
            <button onClick={() => setEscopo('minhas')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${escopo === 'minhas' ? 'bg-white text-marca shadow-sm' : 'text-stone-500'}`}>Minhas</button>
            <button onClick={() => setEscopo('equipe')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${escopo === 'equipe' ? 'bg-white text-marca shadow-sm' : 'text-stone-500'}`}>Equipe</button>
          </div>
        ) : undefined}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLS.map((c) => (
          <div
            key={c.key}
            onDragOver={(e) => { if (c.key !== 'atrasada') { e.preventDefault(); setDropAlvo(c.key); } }}
            onDragLeave={() => setDropAlvo((d) => (d === c.key ? null : d))}
            onDrop={(e) => {
              e.preventDefault(); setDropAlvo(null);
              const id = e.dataTransfer.getData('text/plain');
              const t = base.find((x) => x.ID === id);
              if (t) mover(t, c.key);
            }}
            className={`bg-stone-50/70 rounded-2xl border border-stone-100 p-3 min-h-[140px] transition-shadow ${dropAlvo === c.key ? `ring-2 ${c.ring}` : ''}`}
          >
            <div className="flex items-center justify-between px-1 mb-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
                <h4 className={`text-sm font-bold ${c.head}`}>{c.label}</h4>
              </div>
              <span className="text-xs font-semibold text-stone-400 bg-white border border-stone-200 rounded-full px-2 py-0.5">{colunas[c.key].length}</span>
            </div>
            <div className="space-y-2.5">
              {colunas[c.key].length === 0 ? (
                <p className="text-[12px] text-stone-300 text-center py-6">Vazio</p>
              ) : (
                colunas[c.key].map((t) => <Card key={t.ID} t={t} col={c.key} />)
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de conclusão */}
      {concluir && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-xl text-stone-900">Concluir obrigação</h3>
              <button onClick={() => setConcluir(null)} className="text-stone-400 hover:text-stone-600"><X size={22} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-stone-50 border border-stone-100 p-4 rounded-xl">
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Obrigação</p>
                <p className="text-stone-900 mt-0.5">{concluir.Titulo}</p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Nota de conclusão <span className="text-stone-300 normal-case">(opcional)</span></label>
                <textarea className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-marca/20 outline-none min-h-[90px]" placeholder="O que foi realizado?" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              {permiteAnexos ? (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Evidência <span className="text-stone-300 normal-case">(opcional — imagem ou PDF, até {MAX_MB}MB)</span></label>
                  {file ? (
                    <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl p-3">
                      <FileText size={18} className="text-marca shrink-0" />
                      <span className="text-sm text-stone-700 truncate flex-1">{file.name}</span>
                      <button type="button" onClick={() => escolherArquivo(null)} className="text-stone-400 hover:text-stone-600"><X size={18} /></button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 justify-center bg-stone-50 border border-dashed border-stone-300 rounded-xl p-3.5 text-sm text-stone-500 cursor-pointer hover:border-marca/40 transition-colors">
                      <Paperclip size={16} /> Anexar arquivo
                      <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf" className="hidden" onChange={(e) => escolherArquivo(e.target.files?.[0] ?? null)} />
                    </label>
                  )}
                  {uploadError && <p className="text-[12px] text-[#C62828] mt-1.5">{uploadError}</p>}
                </div>
              ) : uploadError && <p className="text-[12px] text-[#C62828]">{uploadError}</p>}
              <button onClick={confirmarConclusao} disabled={uploading} className="w-full bg-marca text-white py-4 rounded-xl font-semibold hover:bg-marca-escuro transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {uploading ? (<><div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando…</>) : (<><Send size={18} /> Enviar para aprovação</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanView;
