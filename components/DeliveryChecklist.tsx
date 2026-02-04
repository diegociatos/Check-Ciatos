
import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { CheckCircle, XCircle, AlertCircle, Clock, User, MessageSquare, Send, Calendar } from 'lucide-react';

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
    
    // Validação de Obrigatoriedade
    if (actionType !== TaskStatus.APROVADA) {
      if (!justification.trim()) return alert("A justificativa é obrigatória para reprovações.");
      if (!nextDeadline) return alert("Defina um novo prazo para o colaborador.");
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/50">
          <h3 className="text-xl font-ciatos font-bold text-[#111111] uppercase tracking-tighter">Conferir Entregas</h3>
          <p className="text-sm text-gray-400 font-medium">Validar a qualidade e integridade das obrigações cumpridas.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarefa / Colaborador</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Conclusão</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pendingAudit.length > 0 ? (
                pendingAudit.map(task => (
                  <tr key={task.ID} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-[#111111]">{task.Titulo}</span>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase">
                          <User size={10} /> {task.Responsavel}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                          <Clock size={12} /> {new Date(task.DataConclusao!).toLocaleString()}
                        </div>
                        <span className="text-[10px] font-black text-gray-300 uppercase">Tentativa {task.Tentativas + 1}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setAuditTask(task); setActionType(TaskStatus.APROVADA); }}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
                        >
                          <CheckCircle size={14} /> Aprovar
                        </button>
                        <button 
                          onClick={() => { setAuditTask(task); setActionType(TaskStatus.FEITA_ERRADA); }}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-600 shadow-lg shadow-yellow-500/20 transition-all flex items-center gap-2"
                        >
                          <AlertCircle size={14} /> Feita Errada
                        </button>
                        <button 
                          onClick={() => { setAuditTask(task); setActionType(TaskStatus.NAO_FEITA); }}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all flex items-center gap-2"
                        >
                          <XCircle size={14} /> Não Feita
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-gray-300 font-bold uppercase text-xs tracking-widest">
                    Nenhuma tarefa aguardando sua conferência.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {auditTask && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className={`p-8 border-b border-gray-100 flex items-center justify-between text-white ${getActionColor(actionType)}`}>
               <h3 className="text-xl font-ciatos font-bold uppercase tracking-tighter">Decisão de Auditoria</h3>
               <button onClick={() => setAuditTask(null)} className="text-white/70 hover:text-white">✕</button>
            </div>
            
            <div className="p-8 space-y-6">
               <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Evidência do Colaborador:</p>
                  <p className="text-sm text-gray-600 italic">"{auditTask.CompletionNote || 'Sem comentários'}"</p>
               </div>

               {actionType === TaskStatus.APROVADA ? (
                 <div className="p-6 bg-green-50 rounded-3xl border border-green-100 flex items-center gap-4">
                    <CheckCircle className="text-green-600" size={32} />
                    <div>
                       <p className="text-sm font-bold text-green-800">Confirmar Aprovação?</p>
                       <p className="text-xs text-green-600">O colaborador receberá +{auditTask.PontosValor} pontos.</p>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                         Justificativa da Gestão (Obrigatório)
                       </label>
                       <textarea 
                         className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none min-h-[100px]"
                         placeholder="Explique o motivo da reprovação para o colaborador..."
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
                         className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none"
                         value={nextDeadline}
                         onChange={(e) => setNextDeadline(e.target.value)}
                       />
                    </div>

                    <div className="bg-red-50 p-4 rounded-2xl flex items-start gap-3">
                       <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                       <div>
                         <p className="text-[10px] font-black text-red-700 uppercase">Impacto Financeiro</p>
                         <p className="text-xs text-red-600 font-bold">
                           {actionType === TaskStatus.FEITA_ERRADA ? `Pena -0.5x: Deduzir ${auditTask.PontosValor * 0.5} pts` : `Penalidade -2x: Deduzir ${auditTask.PontosValor * 2} pts`}
                         </p>
                       </div>
                    </div>
                 </div>
               )}

               <button 
                  onClick={handleAuditAction}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-white transition-all shadow-xl flex items-center justify-center gap-3 ${getActionColor(actionType)} hover:brightness-90`}
               >
                  <Send size={20} /> Finalizar Conferência
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryChecklist;
