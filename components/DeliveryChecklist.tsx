
import React, { useState } from 'react';
import { Task, TaskStatus, ConferenciaStatus } from '../types';
import { CheckCircle, XCircle, AlertCircle, Clock, User, MessageSquare } from 'lucide-react';

interface DeliveryChecklistProps {
  tasks: Task[];
  onAudit: (taskId: string, status: ConferenciaStatus, observation: string) => void;
}

const DeliveryChecklist: React.FC<DeliveryChecklistProps> = ({ tasks, onAudit }) => {
  const [auditTask, setAuditTask] = useState<Task | null>(null);
  const [observation, setObservation] = useState('');
  const [actionType, setActionType] = useState<ConferenciaStatus | null>(null);

  const pendingAudit = tasks.filter(t => t.Status === TaskStatus.CONCLUIDO);

  const handleAuditAction = () => {
    if (!auditTask || !actionType) return;
    if (actionType !== ConferenciaStatus.APROVADO && !observation.trim()) {
      alert("Observação é obrigatória para penalidades.");
      return;
    }
    onAudit(auditTask.ID, actionType, observation);
    setAuditTask(null);
    setObservation('');
    setActionType(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/50">
          <h3 className="text-xl font-ciatos font-bold text-[#111111] uppercase tracking-tighter">Fila de Conferência</h3>
          <p className="text-sm text-gray-400 font-medium">Avalie as entregas realizadas pelos colaboradores para validação de pontos.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarefa / Responsável</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entrega</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações de Auditoria</th>
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
                        <span className="text-sm font-black text-[#8B1B1F]">{task.PontosValor} pts base</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setAuditTask(task); setActionType(ConferenciaStatus.APROVADO); }}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all"
                        >
                          Aprovar
                        </button>
                        <button 
                          onClick={() => { setAuditTask(task); setActionType(ConferenciaStatus.CUMPRIU_ERRADO); }}
                          className="px-4 py-2 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all"
                        >
                          Cumpriu Errado
                        </button>
                        <button 
                          onClick={() => { setAuditTask(task); setActionType(ConferenciaStatus.NAO_CUMPRIU); }}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all"
                        >
                          Não Cumpriu
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <CheckCircle size={48} className="mx-auto text-gray-100 mb-4" />
                    <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Tudo em ordem! Nenhuma conferência pendente.</p>
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
            <div className={`p-8 border-b border-gray-100 flex items-center justify-between ${
              actionType === ConferenciaStatus.APROVADO ? 'bg-green-50' : 
              actionType === ConferenciaStatus.NAO_CUMPRIU ? 'bg-red-50' : 'bg-orange-50'
            }`}>
               <h3 className="text-xl font-ciatos font-bold text-[#111111] uppercase tracking-tighter">Auditoria de Entrega</h3>
               <button onClick={() => setAuditTask(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-8 space-y-6">
               <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Colaborador:</p>
                  <p className="text-sm font-bold text-[#111111] mb-3">{auditTask.Responsavel}</p>
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Nota da Entrega:</p>
                  <p className="text-sm text-gray-600 italic">"{auditTask.CompletionNote || 'Sem comentários'}"</p>
               </div>

               <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Observação do Gestor {actionType !== ConferenciaStatus.APROVADO && <span className="text-red-600">*</span>}
                  </label>
                  <textarea 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none min-h-[120px]"
                    placeholder="Justifique a decisão da auditoria..."
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                  />
               </div>

               <div className="bg-red-50 p-4 rounded-2xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-red-700 uppercase">Impacto na Pontuação</p>
                    <p className="text-xs text-red-600 font-bold">
                      {actionType === ConferenciaStatus.APROVADO ? `+${auditTask.PontosValor} pontos creditados` :
                       actionType === ConferenciaStatus.NAO_CUMPRIU ? `-${5 * auditTask.PontosValor} pontos (Penalidade 5x)` :
                       `-${3 * auditTask.PontosValor} pontos (Penalidade 3x)`}
                    </p>
                  </div>
               </div>

               <button 
                  onClick={handleAuditAction}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-white transition-all shadow-xl flex items-center justify-center gap-3 ${
                    actionType === ConferenciaStatus.APROVADO ? 'bg-green-600 shadow-green-600/20' : 
                    actionType === ConferenciaStatus.NAO_CUMPRIU ? 'bg-red-600 shadow-red-600/20' : 'bg-orange-500 shadow-orange-500/20'
                  }`}
               >
                  Confirmar Decisão de Auditoria
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryChecklist;
