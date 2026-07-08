import React, { useState } from 'react';
import { Task, TaskStatus, UserRole, ConferenciaStatus } from '../types';
import { X, Send, CheckCircle2, Clock, RotateCcw, ShieldCheck, ShieldAlert, ShieldEllipsis, CheckSquare, PartyPopper, Paperclip, FileText } from 'lucide-react';
import { validarArquivo, uploadEvidencia, MAX_MB } from '../lib/storage';
import { statusInfo, STATUS_TONE_CLASS } from '../lib/labels';
import { getTodayStr } from '../store';

interface EnrichedTask extends Task {
  NomeColaborador: string;
  NomeGestor: string;
  DiasAteVencimento: number;
  StatusCor: string;
}

interface TaskListProps {
  tasks: EnrichedTask[];
  onComplete: (taskId: string, note: string, proof: string) => void;
  onReopen?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onDefinirAndamento?: (taskId: string, andamento: string) => Promise<void>;
  currentUserRole: UserRole;
  currentUserEmail: string;
}

const RED = '#8B1B1F';

const TaskList: React.FC<TaskListProps> = ({ tasks, onComplete, onDefinirAndamento, currentUserEmail }) => {
  const hoje = getTodayStr();
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [celebrar, setCelebrar] = useState<{ titulo: string; pontos: number } | null>(null);

  const abrirModal = (task: EnrichedTask) => {
    setSelectedTask(task); setNote(''); setFile(null); setUploadError('');
  };

  const escolherArquivo = (f: File | null) => {
    setUploadError('');
    if (f) {
      const err = validarArquivo(f);
      if (err) { setUploadError(err); setFile(null); return; }
    }
    setFile(f);
  };

  const confirmar = async () => {
    if (!selectedTask || uploading) return; // impede duplo clique
    const t = selectedTask;
    let proofPath = '';
    if (file) {
      setUploading(true); setUploadError('');
      try {
        proofPath = await uploadEvidencia(file, t.empresa_id || '', t.ID);
      } catch (e: any) {
        setUploadError(e?.message || 'Falha no upload da evidência.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    onComplete(t.ID, note, proofPath);
    setSelectedTask(null); setNote(''); setFile(null);
    setCelebrar({ titulo: t.Titulo, pontos: t.PontosValor });
    setTimeout(() => setCelebrar(null), 3000);
  };

  const conferBadge = (status?: ConferenciaStatus) => {
    if (status === ConferenciaStatus.APROVADO)
      return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full"><ShieldCheck size={12} /> Aprovada</span>;
    if (status === ConferenciaStatus.CUMPRIU_ERRADO || status === ConferenciaStatus.NAO_CUMPRIU)
      return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full"><ShieldAlert size={12} /> Com ressalva</span>;
    return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full"><ShieldEllipsis size={12} /> Em conferência</span>;
  };

  const statusPill = (task: EnrichedTask, isRejected: boolean) => {
    // Reprovada/retornada é sempre "Refazer" para o colaborador
    const info = isRejected && task.Status === TaskStatus.PENDENTE
      ? { label: 'Refazer', tone: 'erro' as const }
      : statusInfo(task.Status);
    return <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${STATUS_TONE_CLASS[info.tone]}`}>{info.label}</span>;
  };

  return (
    <div className="font-ciatos">
      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tasks.map((task) => {
            const isAssignee = task.Responsavel === currentUserEmail;
            const isRejected = (task.Tentativas > 0 && task.Status === TaskStatus.PENDENTE) || task.Status === TaskStatus.FEITA_ERRADA || task.Status === TaskStatus.NAO_FEITA;
            const acent = isRejected || task.Status === TaskStatus.ATRASADA ? '#C62828' : task.Status === TaskStatus.APROVADA ? '#2E7D32' : RED;
            const podeConcluir = isAssignee && task.Status !== TaskStatus.APROVADA && task.Status !== TaskStatus.AGUARDANDO_APROVACAO;
            const atrasada = podeConcluir && !!task.DataLimite_Date && task.DataLimite_Date < hoje;
            const emAndamento = (task.Andamento || 'Pendente') === 'Em andamento';
            return (
              <div key={task.ID} className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_1px_2px_rgba(28,25,23,0.04)] overflow-hidden flex flex-col" style={{ borderLeft: `4px solid ${acent}` }}>
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {statusPill(task, isRejected)}
                      {task.Status === TaskStatus.APROVADA && conferBadge(task.ConferenciaStatus)}
                      {atrasada && <span className="text-[11px] font-medium px-2.5 py-1 rounded-full text-amber-700 bg-amber-50">Atrasado</span>}
                      {!atrasada && emAndamento && task.Status === TaskStatus.PENDENTE && <span className="text-[11px] font-medium px-2.5 py-1 rounded-full text-sky-700 bg-sky-50">Em andamento</span>}
                    </div>
                    <span className="text-lg font-semibold text-marca shrink-0">{task.PontosValor} pts</span>
                  </div>

                  <h4 className="text-lg text-stone-900 leading-snug mt-4">{task.Titulo}</h4>
                  {task.Descricao && <p className="text-sm text-stone-500 mt-1.5 line-clamp-2">{task.Descricao}</p>}

                  <div className="mt-5 pt-4 border-t border-stone-100 flex items-center gap-2 text-sm text-stone-500">
                    <Clock size={15} className="text-stone-400" />
                    Prazo: {new Date(task.DataLimite).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </div>
                </div>

                {isRejected && (task.JustificativaGestor || task.ObservacaoGestor) && (
                  <div className="px-6 py-4 bg-amber-50 border-t border-amber-100 flex items-start gap-2.5">
                    <RotateCcw size={15} className="text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-amber-800">Retornada{task.Tentativas > 0 ? ` — ${task.Tentativas}ª tentativa` : ''}</p>
                      <p className="text-sm text-amber-800/90 italic mt-0.5">"{task.JustificativaGestor || task.ObservacaoGestor}"</p>
                    </div>
                  </div>
                )}

                {podeConcluir && (
                  <div className="px-6 pb-6 space-y-3">
                    {onDefinirAndamento && (
                      <div>
                        <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Situação</p>
                        <div className="grid grid-cols-2 gap-1 bg-stone-100 rounded-xl p-1">
                          <button
                            onClick={() => !emAndamento || onDefinirAndamento(task.ID, 'Pendente')}
                            className={`py-2 rounded-lg text-xs font-semibold transition-all ${!emAndamento ? 'bg-white text-marca shadow-sm' : 'text-stone-500 hover:text-tinta'}`}
                          >
                            A fazer
                          </button>
                          <button
                            onClick={() => emAndamento || onDefinirAndamento(task.ID, 'Em andamento')}
                            className={`py-2 rounded-lg text-xs font-semibold transition-all ${emAndamento ? 'bg-white text-sky-700 shadow-sm' : 'text-stone-500 hover:text-tinta'}`}
                          >
                            Em andamento
                          </button>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => abrirModal(task)}
                      className="w-full bg-marca text-white py-3.5 rounded-xl font-semibold hover:bg-marca-escuro transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <CheckSquare size={18} /> {isRejected ? 'Refazer' : 'Concluir'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-stone-200">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500/70" />
          <p className="text-stone-600 mt-3 text-lg">Tudo em dia por aqui.</p>
          <p className="text-stone-400 text-sm mt-1">Nenhuma obrigação pendente nesta lista.</p>
        </div>
      )}

      {/* Modal de conclusão */}
      {selectedTask && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-xl text-stone-900">Concluir obrigação</h3>
              <button onClick={() => setSelectedTask(null)} className="text-stone-400 hover:text-stone-600"><X size={22} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-stone-50 border border-stone-100 p-4 rounded-xl">
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Obrigação</p>
                <p className="text-stone-900 mt-0.5">{selectedTask.Titulo}</p>
                <p className="text-sm text-marca mt-1">Vale {selectedTask.PontosValor} pts</p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Nota de conclusão <span className="text-stone-300 normal-case">(opcional)</span></label>
                <textarea
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-marca/20 outline-none min-h-[110px]"
                  placeholder="O que foi realizado?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Evidência <span className="text-stone-300 normal-case">(opcional — imagem ou PDF, até {MAX_MB}MB)</span></label>
                {file ? (
                  <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl p-3">
                    <FileText size={18} className="text-marca shrink-0" />
                    <span className="text-sm text-stone-700 truncate flex-1">{file.name}</span>
                    <button type="button" onClick={() => escolherArquivo(null)} className="text-stone-400 hover:text-stone-600"><X size={18} /></button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 justify-center bg-stone-50 border border-dashed border-stone-300 rounded-xl p-3.5 text-sm text-stone-500 cursor-pointer hover:border-marca/40 hover:text-stone-700 transition-colors">
                    <Paperclip size={16} /> Anexar arquivo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf"
                      className="hidden"
                      onChange={(e) => escolherArquivo(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
                {uploadError && <p className="text-[12px] text-[#C62828] mt-1.5">{uploadError}</p>}
              </div>

              <button onClick={confirmar} disabled={uploading} className="w-full bg-marca text-white py-4 rounded-xl font-semibold hover:bg-marca-escuro transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {uploading ? (
                  <><div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando…</>
                ) : (
                  <><Send size={18} /> Enviar para aprovação</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comemoração ao concluir */}
      {celebrar && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl px-10 py-12 text-center max-w-sm animate-in zoom-in-95 duration-300">
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center animate-in zoom-in duration-500">
              <CheckCircle2 size={44} className="text-emerald-600" />
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 text-marca">
              <PartyPopper size={20} />
              <span className="text-3xl font-semibold">+{celebrar.pontos} pts</span>
            </div>
            <p className="text-lg text-stone-900 mt-3">Obrigação concluída!</p>
            <p className="text-sm text-stone-500 mt-1">Enviada para aprovação. Os pontos entram assim que for validada.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
