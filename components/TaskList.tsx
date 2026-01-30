
import React, { useState } from 'react';
import { Task, TaskStatus, UserRole, ConferenciaStatus } from '../types';
// Fix: Added MessageSquare and Send to the import list from lucide-react
import { Calendar, User, CheckCircle, Image as ImageIcon, X, Send, CheckSquare, Clock, UserCheck, RotateCcw, Trash2, ShieldCheck, ShieldAlert, ShieldEllipsis, MessageSquare } from 'lucide-react';

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

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, onComplete, onReopen, onDelete, currentUserRole, currentUserEmail
}) => {
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);
  const [note, setNote] = useState('');
  const [proof, setProof] = useState('');

  const renderConferenciaBadge = (status: ConferenciaStatus) => {
    switch (status) {
      case ConferenciaStatus.APROVADO:
        return (
          <div className="flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase">
            <ShieldCheck size={10} /> Auditado e Aprovado
          </div>
        );
      case ConferenciaStatus.CUMPRIU_ERRADO:
      case ConferenciaStatus.NAO_CUMPRIU:
        return (
          <div className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase">
            <ShieldAlert size={10} /> Erro Identificado
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase">
            <ShieldEllipsis size={10} /> Aguardando Auditoria
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {tasks.length > 0 ? (
        tasks.map((task) => {
          const isAssignee = task.AssigneeEmail === currentUserEmail;
          
          return (
            <div key={task.TaskID} className={`bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 border-l-[6px] ${
              task.StatusCor === 'Green' ? 'border-l-[#2E7D32]' : 
              task.StatusCor === 'Red' ? 'border-l-[#C62828]' : 
              task.StatusCor === 'Orange' ? 'border-l-[#E65100]' : 'border-l-gray-200'
            }`}>
              <div className="p-8 flex-1 space-y-6">
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                        task.Status === TaskStatus.CONCLUIDA ? 'bg-green-50 text-green-700 border-green-100' :
                        task.Status === TaskStatus.ATRASADA ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {task.Status}
                      </span>
                      {task.Status === TaskStatus.CONCLUIDA && renderConferenciaBadge(task.ConferenciaStatus)}
                   </div>
                   <div className="text-right">
                      <span className="text-2xl font-black text-[#8B1B1F] tracking-tighter">{task.Pontos} pts</span>
                   </div>
                </div>

                <div>
                   <h4 className="text-xl font-bold text-[#111111] leading-tight group-hover:text-[#8B1B1F] transition-colors">{task.Titulo}</h4>
                   <p className="text-sm text-gray-400 mt-2 line-clamp-2 font-medium">{task.Descricao}</p>
                </div>

                <div className="pt-6 border-t border-gray-50 grid grid-cols-1 gap-3">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400"><Clock size={14}/></div>
                      <div>
                         <p className="text-[9px] font-black text-gray-300 uppercase">Prazo de Entrega</p>
                         <p className="text-xs font-bold text-[#111111]">{new Date(task.DueDateTime).toLocaleString()}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400"><UserCheck size={14}/></div>
                      <div>
                         <p className="text-[9px] font-black text-gray-300 uppercase">Gestor Responsável</p>
                         <p className="text-xs font-bold text-[#111111]">{task.NomeGestor}</p>
                      </div>
                   </div>
                </div>
              </div>

              {isAssignee && task.Status !== TaskStatus.CONCLUIDA && (
                <div className="px-8 pb-8">
                  <button 
                    onClick={() => setSelectedTask(task)}
                    className="w-full bg-[#8B1B1F] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#6F0F14] transition-all shadow-xl shadow-[#8B1B1F]/20 flex items-center justify-center gap-3"
                  >
                    <CheckSquare size={20} /> Concluir Entrega
                  </button>
                </div>
              )}

              {task.ObservacaoGestor && (
                <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-50 italic">
                   <p className="text-[10px] font-black text-[#8B1B1F] uppercase mb-1 flex items-center gap-1">
                      <MessageSquare size={10}/> Feedback Auditoria:
                   </p>
                   <p className="text-[11px] text-gray-500 font-medium leading-relaxed">"{task.ObservacaoGestor}"</p>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
           <CheckSquare size={64} className="mx-auto text-gray-100 mb-4" />
           <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Sem tarefas nesta lista</p>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50">
               <h3 className="text-xl font-black text-[#111111] uppercase tracking-tighter">Confirmar Entrega</h3>
               <button onClick={() => setSelectedTask(null)} className="text-gray-300 hover:text-gray-500 transition-colors"><X size={24}/></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="bg-[#8B1B1F] p-6 rounded-3xl text-white">
                  <p className="text-[10px] font-black uppercase text-white/50 mb-1">Obrigação:</p>
                  <p className="text-lg font-bold leading-tight">{selectedTask.Titulo}</p>
               </div>
               <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Nota de Conclusão</label>
                  <textarea 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none min-h-[120px]"
                    placeholder="O que foi realizado?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
               </div>
               <button 
                  onClick={() => { onComplete(selectedTask.TaskID, note, proof); setSelectedTask(null); }}
                  className="w-full bg-[#8B1B1F] text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#6F0F14] transition-all shadow-xl shadow-[#8B1B1F]/20 flex items-center justify-center gap-3"
               >
                  <Send size={20} /> Enviar Comprovação
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
