import React, { useState } from 'react';
import { Task, TaskStatus, UserRole, ConferenciaStatus } from '../types';
import { X, Send, CheckCircle2, Clock, RotateCcw, ShieldCheck, ShieldAlert, ShieldEllipsis, CheckSquare, PartyPopper } from 'lucide-react';

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
  currentUserRole: UserRole;
  currentUserEmail: string;
}

const RED = '#8B1B1F';

const TaskList: React.FC<TaskListProps> = ({ tasks, onComplete, currentUserEmail }) => {
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);
  const [note, setNote] = useState('');
  const [celebrar, setCelebrar] = useState<{ titulo: string; pontos: number } | null>(null);

  const confirmar = () => {
    if (!selectedTask) return;
    const t = selectedTask;
    onComplete(t.ID, note, '');
    setSelectedTask(null);
    setNote('');
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
    const map: Record<string, string> = {
      aprovada: 'text-emerald-700 bg-emerald-50',
      rejeitada: 'text-red-700 bg-red-50',
      atrasada: 'text-amber-700 bg-amber-50',
      aguardando: 'text-stone-500 bg-stone-100',
      pendente: 'text-[#8B1B1F] bg-[#8B1B1F]/8',
    };
    const key = task.Status === TaskStatus.APROVADA ? 'aprovada'
      : isRejected ? 'rejeitada'
      : task.Status === TaskStatus.ATRASADA ? 'atrasada'
      : task.Status === TaskStatus.AGUARDANDO_APROVACAO ? 'aguardando' : 'pendente';
    return <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${map[key]}`}>{task.Status}</span>;
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
            return (
              <div key={task.ID} className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_1px_2px_rgba(28,25,23,0.04)] overflow-hidden flex flex-col" style={{ borderLeft: `4px solid ${acent}` }}>
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {statusPill(task, isRejected)}
                      {task.Status === TaskStatus.APROVADA && conferBadge(task.ConferenciaStatus)}
                    </div>
                    <span className="text-lg font-semibold text-[#8B1B1F] shrink-0">{task.PontosValor} pts</span>
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
                  <div className="px-6 pb-6">
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="w-full bg-[#8B1B1F] text-white py-3.5 rounded-xl font-semibold hover:bg-[#6F0F14] transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
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
                <p className="text-sm text-[#8B1B1F] mt-1">Vale {selectedTask.PontosValor} pts</p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Nota de conclusão <span className="text-stone-300 normal-case">(opcional)</span></label>
                <textarea
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-[#8B1B1F]/20 outline-none min-h-[110px]"
                  placeholder="O que foi realizado?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <button onClick={confirmar} className="w-full bg-[#8B1B1F] text-white py-4 rounded-xl font-semibold hover:bg-[#6F0F14] transition-colors flex items-center justify-center gap-2">
                <Send size={18} /> Enviar para aprovação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comemoração ao concluir */}
      {celebrar && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl px-10 py-12 text-center max-w-sm animate-in zoom-in-95 duration-300">
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center animate-in zoom-in duration-500">
              <CheckCircle2 size={44} className="text-emerald-600" />
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 text-[#8B1B1F]">
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
