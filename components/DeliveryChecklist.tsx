
import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { CheckCircle, XCircle, AlertCircle, Clock, User, Send, Calendar, ShieldCheck, History, MessageSquare } from 'lucide-react';

interface DeliveryChecklistProps {
  tasks: Task[];
  onAudit: (taskId: string, status: TaskStatus, justification: string, nextDeadline?: string) => void;
}

const DeliveryChecklist: React.FC<DeliveryChecklistProps> = ({ tasks, onAudit }) => {
  const [auditTask, setAuditTask] = useState<Task | null>(null);
  const [justification, setJustification] = useState('');
  const [nextDeadline, setNextDeadline] = useState('');
  const [actionType, setActionType] = useState<TaskStatus | null>(null);

  const pendingAudit = tasks.filter(t => t.Status === TaskStatus.AGUARDANDO_APROVACAO);

  const handleAuditAction = () => {
    if (!auditTask || !actionType) return;
    
    // Validação de Obrigatoriedade conforme solicitado pelo RH
    if (actionType !== TaskStatus.APROVADA) {
      if (!justification.trim()) return alert("A justificativa técnica é obrigatória para reprovações.");
      if (!nextDeadline) return alert("É obrigatório definir um novo prazo para o reenvio.");
    }

    onAudit(auditTask.ID, actionType, justification, nextDeadline);
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
         <p className="text-sm text-gray-400 font-medium">Validação técnica e controle de qualidade das obrigações da equipe.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pendingAudit.length > 0 ? (
          pendingAudit.map(task => (
            <div key={task.ID} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
               <div className="p-8 flex-1 space-y-6">
                  <div className="flex justify-between items-start">
                     <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                        Aguardando Auditoria
                     </div>
                     <span className="text-2xl font-black text-[#8B1B1F] tracking-tighter">{task.PontosValor} pts</span>
                  </div>
                  
                  <div>
                     <h4 className="text-xl font-bold text-[#111111] leading-tight mb-2">{task.Titulo}</h4>
                     <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                        <User size={12} /> {task.Responsavel}
                     </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Nota do Colaborador:</p>
                    <p className="text-xs text-gray-600 italic">"{task.CompletionNote || 'Sem comentários adicionais.'}"</p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-50">
                     <div className="flex items-center gap-3">
                        <Clock size={16} className="text-green-600" />
                        <div>
                           <p className="text-[9px] font-black text-gray-400 uppercase">Concluído em</p>
                           <p className="text-xs font-bold text-[#111111]">
                             {task.DataConclusao ? new Date(task.DataConclusao).toLocaleString() : 'Não registrado'}
                           </p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <History size={16} className="text-blue-500" />
                        <div>
                           <p className="text-[9px] font-black text-gray-400 uppercase">Histórico</p>
                           <p className="text-xs font-bold text-[#111111]">{task.Tentativas + 1}ª Tentativa de entrega</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-6 bg-gray-50 border-t border-gray-100 grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => { setAuditTask(task); setActionType(TaskStatus.APROVADA); }}
                    className="flex flex-col items-center gap-1 p-3 bg-white border border-green-100 rounded-2xl hover:bg-green-600 hover:text-white transition-all group"
                  >
                    <CheckCircle size={18} className="text-green-600 group-hover:text-white" />
                    <span className="text-[8px] font-black uppercase">Aprovar</span>
                  </button>
                  <button 
                    onClick={() => { setAuditTask(task); setActionType(TaskStatus.FEITA_ERRADA); }}
                    className="flex flex-col items-center gap-1 p-3 bg-white border border-yellow-100 rounded-2xl hover:bg-yellow-500 hover:text-white transition-all group"
                  >
                    <AlertCircle size={18} className="text-yellow-500 group-hover:text-white" />
                    <span className="text-[8px] font-black uppercase text-center">Feita Errada</span>
                  </button>
                  <button 
                    onClick={() => { setAuditTask(task); setActionType(TaskStatus.NAO_FEITA); }}
                    className="flex flex-col items-center gap-1 p-3 bg-white border border-red-100 rounded-2xl hover:bg-red-600 hover:text-white transition-all group"
                  >
                    <XCircle size={18} className="text-red-600 group-hover:text-white" />
                    <span className="text-[8px] font-black uppercase text-center">Não Feita</span>
                  </button>
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
             <ShieldCheck size={64} className="mx-auto text-gray-100 mb-4" />
             <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Nenhuma tarefa aguardando sua auditoria.</p>
          </div>
        )}
      </div>

      {/* Modal de Auditoria Corporativa */}
      {auditTask && actionType && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className={`p-8 border-b border-white/10 flex items-center justify-between text-white ${getActionColor(actionType)}`}>
               <div className="flex items-center gap-3">
                  {actionType === TaskStatus.APROVADA ? <CheckCircle size={24}/> : <AlertCircle size={24}/>}
                  <h3 className="text-xl font-bold uppercase tracking-tighter">Decisão de Auditoria</h3>
               </div>
               <button onClick={() => setAuditTask(null)} className="text-white/70 hover:text-white">✕</button>
            </div>
            
            <div className="p-8 space-y-6">
               <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Tarefa em análise:</p>
                  <p className="text-sm font-bold text-[#111111]">{auditTask.Titulo}</p>
               </div>

               {actionType === TaskStatus.APROVADA ? (
                 <div className="text-center py-4 space-y-4">
                    <p className="text-sm text-gray-500 font-medium">Ao aprovar, o colaborador receberá <strong className="text-green-600">+{auditTask.PontosValor} pontos</strong> integralmente.</p>
                    <div className="h-1 bg-green-100 rounded-full w-24 mx-auto" />
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <MessageSquare size={12} /> Justificativa da Gestão (Obrigatório)
                       </label>
                       <textarea 
                         className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none min-h-[100px]"
                         placeholder="Descreva o motivo técnico do retorno da tarefa..."
                         value={justification}
                         onChange={(e) => setJustification(e.target.value)}
                       />
                    </div>
                    
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <Calendar size={12} /> Novo Prazo para Entrega (Obrigatório)
                       </label>
                       <input 
                         type="datetime-local"
                         className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none border-2 border-[#8B1B1F]/10 focus:border-[#8B1B1F]"
                         value={nextDeadline}
                         onChange={(e) => setNextDeadline(e.target.value)}
                       />
                    </div>

                    <div className="bg-red-50 p-4 rounded-2xl flex items-start gap-3 border border-red-100">
                       <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                       <div>
                         <p className="text-[10px] font-black text-red-700 uppercase">Impacto no Score</p>
                         <p className="text-xs text-red-600 font-bold leading-tight">
                           {actionType === TaskStatus.FEITA_ERRADA 
                             ? `Pena -0.5x: O colaborador perderá ${auditTask.PontosValor * 0.5} pts.` 
                             : `Penalidade -2x: O colaborador perderá ${auditTask.PontosValor * 2} pts por inexecução.`}
                         </p>
                       </div>
                    </div>
                 </div>
               )}

               <button 
                  onClick={handleAuditAction}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-white transition-all shadow-xl flex items-center justify-center gap-3 ${getActionColor(actionType)} hover:brightness-90 hover:scale-[1.01] active:scale-95`}
               >
                  <Send size={20} /> Finalizar Decisão
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryChecklist;
