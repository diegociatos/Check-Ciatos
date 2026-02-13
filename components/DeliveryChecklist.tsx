
import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { getTodayStr } from '../store';
import { CheckCircle, XCircle, AlertCircle, Clock, User, Send, Calendar, ShieldCheck, History, MessageSquare, AlertTriangle, Eye, Info, Check } from 'lucide-react';

interface DeliveryChecklistProps {
  tasks: Task[];
  onAudit: (taskId: string, status: TaskStatus, justification: string, nextDeadline?: string) => void;
}

const DeliveryChecklist: React.FC<DeliveryChecklistProps> = ({ tasks, onAudit }) => {
  const [auditTask, setAuditTask] = useState<Task | null>(null);
  const [justification, setJustification] = useState('');
  const [nextDeadline, setNextDeadline] = useState('');
  const [actionType, setActionType] = useState<TaskStatus | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const todayStr = getTodayStr();
  const pendingAudit = tasks.filter(t => t.Status === TaskStatus.AGUARDANDO_APROVACAO);

  const handleAuditAction = () => {
    if (!auditTask || !actionType) return;
    
    if (actionType !== TaskStatus.APROVADA && !justification.trim()) {
      return alert("A justificativa técnica é obrigatória para reprovações.");
    }

    const isAnticipated = auditTask.DataLimite_Date! > todayStr;
    if (actionType !== TaskStatus.APROVADA && !isAnticipated && !nextDeadline) {
      return alert("É obrigatório definir um novo prazo para o cumprimento de tarefas vencidas.");
    }

    onAudit(auditTask.ID, actionType, justification, isAnticipated ? undefined : nextDeadline);
    setAuditTask(null);
    setJustification('');
    setNextDeadline('');
    setActionType(null);
  };

  const getActionColor = (type: TaskStatus | null) => {
    switch(type) {
      case TaskStatus.APROVADA: return 'bg-green-600';
      case TaskStatus.FEITA_ERRADA: return 'bg-yellow-500';
      case TaskStatus.NAO_FEITA: return 'bg-red-600';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-ciatos pb-20">
      <div className="flex flex-col gap-2">
         <h3 className="text-3xl font-bold text-[#8B1B1F] uppercase tracking-tighter">Conferir Entregas</h3>
         <p className="text-sm text-gray-400 font-medium italic">Auditoria técnica e feedback de performance.</p>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left table-fixed">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-1/4">Colaborador</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Obrigação Concluída</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-40">Data Entrega</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-24">Pts</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right w-64">Decisão Auditoria</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pendingAudit.length > 0 ? (
              pendingAudit.map(task => {
                const hasNote = task.CompletionNote && task.CompletionNote.trim().length > 0;
                const hasProof = task.ProofAttachment && task.ProofAttachment.trim().length > 0;
                const isExpanded = expandedTask === task.ID;
                return (
                  <React.Fragment key={task.ID}>
                  <tr className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => setExpandedTask(isExpanded ? null : task.ID)}>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-[#8B1B1F] rounded-lg flex items-center justify-center text-white text-[10px] font-black">
                          {task.Responsavel.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-[#111111] uppercase truncate">{task.Responsavel.split('@')[0]}</span>
                          <span className="text-[8px] text-gray-400 font-bold italic">Auditoria {task.Tentativas + 1}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-[#111111] truncate">{task.Titulo}</span>
                          {task.DataLimite_Date! > todayStr && (
                            <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit uppercase">Antecipada</span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setExpandedTask(isExpanded ? null : task.ID); }}
                          className={`p-1.5 rounded-lg shadow-sm transition-all ${isExpanded ? 'bg-[#8B1B1F] text-white' : hasNote ? 'bg-[#8B1B1F] text-white animate-pulse' : 'bg-gray-50 text-gray-400 hover:text-[#8B1B1F]'}`}
                          title="Ver detalhes da entrega"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-gray-600">{new Date(task.DataConclusao!).toLocaleDateString()}</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">
                          {new Date(task.DataConclusao!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center">
                      {(() => {
                        const isLate = task.DataConclusao && task.DataLimite_Date && task.DataConclusao.split('T')[0] > task.DataLimite_Date;
                        const isRetry = (task.Tentativas || 0) > 0;
                        if (isLate || isRetry) {
                          return (
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-black text-yellow-600">{Math.ceil(task.PontosValor * 0.5)}</span>
                              <span className="text-[8px] text-gray-400 line-through">{task.PontosValor} pts</span>
                              <span className="text-[7px] font-bold text-yellow-600 uppercase">{isLate ? 'Atraso' : 'Reentrega'}</span>
                            </div>
                          );
                        }
                        return <span className="text-sm font-black text-[#8B1B1F]">{task.PontosValor}</span>;
                      })()}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button 
                           onClick={(e) => { e.stopPropagation(); setAuditTask(task); setActionType(TaskStatus.APROVADA); }}
                           className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-green-100 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                         >
                           Aprovar
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); setAuditTask(task); setActionType(TaskStatus.FEITA_ERRADA); }}
                           className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-yellow-100 hover:bg-yellow-500 hover:text-white transition-all shadow-sm"
                         >
                           Erro
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); setAuditTask(task); setActionType(TaskStatus.NAO_FEITA); }}
                           className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                         >
                           Falta
                         </button>
                      </div>
                    </td>
                  </tr>
                  {/* Linha expandida com detalhes da entrega */}
                  {isExpanded && (
                    <tr className="bg-[#8B1B1F]/5">
                      <td colSpan={5} className="px-8 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-[#8B1B1F] uppercase tracking-widest">Descrição da Tarefa</p>
                            <p className="text-sm text-gray-700 leading-relaxed bg-white p-4 rounded-2xl border border-gray-100">
                              {task.Descricao || 'Sem descrição cadastrada.'}
                            </p>
                          </div>
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-[#8B1B1F] uppercase tracking-widest">Relato do Colaborador</p>
                            <p className="text-sm text-gray-700 leading-relaxed bg-white p-4 rounded-2xl border border-gray-100 italic">
                              {hasNote ? `"${task.CompletionNote}"` : 'Nenhum relato técnico enviado.'}
                            </p>
                            {hasProof && (
                              <div className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-2">
                                <Info size={14} className="text-blue-500" />
                                <span className="text-xs font-bold text-blue-600">Anexo: {task.ProofAttachment}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-24 text-center text-gray-300 uppercase font-black text-xs">Aguardando novas entregas para auditoria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE DECISÃO */}
      {auditTask && actionType && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className={`p-8 border-b border-white/10 flex items-center justify-between text-white ${getActionColor(actionType)}`}>
               <div className="flex items-center gap-3">
                  {actionType === TaskStatus.APROVADA ? <ShieldCheck size={24}/> : <AlertCircle size={24}/>}
                  <h3 className="text-xl font-bold uppercase tracking-tighter">
                    {actionType === TaskStatus.APROVADA ? 'Aprovar Entrega' : actionType === TaskStatus.FEITA_ERRADA ? 'Sinalizar Erro' : 'Sinalizar Falta'}
                  </h3>
               </div>
               <button onClick={() => setAuditTask(null)} className="text-white/70 hover:text-white">✕</button>
            </div>
            
            <div className="p-8 space-y-6">
               {actionType === TaskStatus.APROVADA ? (
                 <div className="text-center py-4 space-y-4">
                    <div className="h-16 w-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
                       <ShieldCheck size={32} />
                    </div>
                    {(() => {
                      const isLate = auditTask.DataConclusao && auditTask.DataLimite_Date && auditTask.DataConclusao.split('T')[0] > auditTask.DataLimite_Date;
                      const isRetry = (auditTask.Tentativas || 0) > 0;
                      const reducedPoints = Math.ceil(auditTask.PontosValor * 0.5);
                      if (isLate || isRetry) {
                        return (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-500 font-medium italic">
                              Confirmar conformidade técnica de <strong className="text-[#111111]">{auditTask.Titulo}</strong>?
                            </p>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 text-[11px] text-yellow-700 font-bold">
                              <AlertTriangle size={14} className="inline mr-1 -mt-0.5" />
                              Pontuação reduzida: <span className="line-through text-gray-400">{auditTask.PontosValor} pts</span> → <strong className="text-yellow-800">{reducedPoints} pts</strong>
                              {isLate ? ' (entrega com atraso)' : ' (reentrega após erro)'}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <p className="text-sm text-gray-500 font-medium italic">
                          Confirmar conformidade técnica de <strong className="text-[#111111]">{auditTask.Titulo}</strong> e creditar {auditTask.PontosValor} pts?
                        </p>
                      );
                    })()}
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Justificativa do Retorno (Obrigatório)</label>
                       <textarea 
                         className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none min-h-[100px]"
                         placeholder="O colaborador verá esta mensagem para corrigir a entrega..."
                         value={justification}
                         onChange={(e) => setJustification(e.target.value)}
                       />
                    </div>
                    
                    {auditTask.DataLimite_Date! <= todayStr ? (
                      <div className="space-y-2 animate-in slide-in-from-top-2">
                         <label className="block text-[10px] font-black text-[#8B1B1F] uppercase tracking-widest">Definir Novo Prazo para Correção</label>
                         <input 
                           type="date"
                           className="w-full bg-white border-2 border-[#8B1B1F]/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#8B1B1F]"
                           value={nextDeadline}
                           onChange={(e) => setNextDeadline(e.target.value)}
                         />
                      </div>
                    ) : (
                      <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4 animate-in slide-in-from-top-2">
                         <Info size={20} className="text-blue-500 shrink-0" />
                         <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
                            <strong>Antecipação Detectada:</strong> Como o prazo original ainda é futuro ({auditTask.DataLimite_Date!.split('-').reverse().join('/')}), a data não será alterada. O colaborador poderá refazer o check a qualquer momento até o prazo expirar.
                         </p>
                      </div>
                    )}
                 </div>
               )}

               <button 
                  onClick={handleAuditAction}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-white transition-all shadow-xl flex items-center justify-center gap-3 ${getActionColor(actionType)} hover:brightness-90 hover:scale-[1.01] active:scale-95`}
               >
                  <Send size={20} /> Confirmar Decisão
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryChecklist;
