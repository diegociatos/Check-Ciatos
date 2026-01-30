
import React, { useState } from 'react';
import { Task, TaskStatus, UserRole } from '../types';
import { Calendar, User, CheckCircle, Image as ImageIcon, X, Send, CheckSquare, Clock, UserCheck, RotateCcw, Trash2 } from 'lucide-react';

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
  tasks, 
  onComplete, 
  onReopen, 
  onDelete, 
  currentUserRole,
  currentUserEmail
}) => {
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);
  const [note, setNote] = useState('');
  const [proof, setProof] = useState('');

  const handleComplete = () => {
    if (selectedTask) {
      onComplete(selectedTask.TaskID, note, proof);
      setSelectedTask(null);
      setNote('');
      setProof('');
    }
  };

  const handleDelete = (taskId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.")) {
      onDelete?.(taskId);
    }
  };

  // Format Rules Translation
  const getFormatClasses = (task: EnrichedTask) => {
    // Regra 1 - Tarefas Atrasadas
    if (task.Status === TaskStatus.ATRASADA) {
      return "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]";
    }
    // Regra 2 - Tarefas Concluídas
    if (task.Status === TaskStatus.CONCLUIDA) {
      return "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]";
    }
    // Regra 3 - Tarefas Urgentes
    if (task.Status === TaskStatus.PENDENTE && task.DiasAteVencimento <= 1) {
      return "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]";
    }
    // Default
    return "bg-gray-50 text-gray-700 border-gray-100";
  };

  const getBorderColor = (color: string) => {
    switch (color) {
      case 'Green': return 'border-l-4 border-l-[#2E7D32]';
      case 'Red': return 'border-l-4 border-l-[#C62828]';
      case 'Orange': return 'border-l-4 border-l-[#E65100]';
      default: return 'border-l-4 border-l-gray-300';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {tasks.length > 0 ? (
        tasks.map((task) => {
          const isAssignee = task.AssigneeEmail === currentUserEmail;
          const isManagerOrAdmin = currentUserRole === UserRole.GESTOR || currentUserRole === UserRole.ADMIN;
          const isAdmin = currentUserRole === UserRole.ADMIN;

          const showComplete = isAssignee && task.Status !== TaskStatus.CONCLUIDA;
          const showReopen = isManagerOrAdmin && task.Status === TaskStatus.CONCLUIDA;
          const showDelete = isAdmin;

          const formatClasses = getFormatClasses(task);

          return (
            <div key={task.TaskID} className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all ${getBorderColor(task.StatusCor)}`}>
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${formatClasses}`}>
                    {task.Status}
                  </span>
                  <div className="text-right">
                     <span className="text-lg font-black text-[#8B1B1F] block">{task.Pontos} pts</span>
                     <span className="text-[10px] text-gray-400 font-bold uppercase">
                       {task.Status === TaskStatus.PENDENTE && task.DiasAteVencimento >= 0 ? `Vence em ${task.DiasAteVencimento} dias` : ''}
                     </span>
                  </div>
                </div>
                
                <h4 className="text-lg font-bold text-[#111111] mb-2 leading-tight">{task.Titulo}</h4>
                <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed">{task.Descricao}</p>
                
                <div className="space-y-2 py-4 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-xs">
                    <User size={14} className="text-gray-400" />
                    <span className="text-gray-600 font-medium">Colaborador: <span className="text-[#111111] font-bold">{task.NomeColaborador}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <UserCheck size={14} className="text-gray-400" />
                    <span className="text-gray-600 font-medium">Gestor: <span className="text-[#111111] font-bold">{task.NomeGestor}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-gray-600 font-medium">Prazo: <span className="text-[#111111] font-bold">{new Date(task.DueDateTime).toLocaleString()}</span></span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-2">
                {task.Status === TaskStatus.CONCLUIDA && (
                  <div className="flex items-center gap-2 text-[#2E7D32] font-bold text-xs uppercase tracking-tight mb-2">
                    <CheckCircle size={16} />
                    Concluída em {new Date(task.CompletedAt!).toLocaleDateString()}
                  </div>
                )}
                
                <div className="flex gap-2">
                  {showComplete && (
                    <button 
                      onClick={() => setSelectedTask(task)}
                      className="flex-1 bg-[#8B1B1F] text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#6F0F14] transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Concluir
                    </button>
                  )}

                  {showReopen && (
                    <button 
                      onClick={() => onReopen?.(task.TaskID)}
                      className="flex-1 bg-[#111111] text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} />
                      Reabrir
                    </button>
                  )}

                  {showDelete && (
                    <button 
                      onClick={() => handleDelete(task.TaskID)}
                      className="bg-[#FFEBEE] text-[#C62828] p-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#FFCDD2] transition-all border border-[#FFCDD2] flex items-center justify-center"
                      title="Excluir Tarefa"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
          <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4">
             <CheckSquare size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-300">Nenhuma tarefa encontrada</h3>
          <p className="text-gray-400 text-sm">Tudo limpo por aqui!</p>
        </div>
      )}

      {/* Completion Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-[#111111]">CONCLUIR TAREFA</h3>
              <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tarefa Selecionada</p>
                <p className="font-bold text-[#111111]">{selectedTask.Titulo}</p>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nota de Conclusão (Opcional)</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#8B1B1F] focus:border-transparent outline-none min-h-[120px]"
                  placeholder="Relate o que foi desenvolvido..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Comprovante (Imagem - Opcional)</label>
                <div className="flex items-center gap-4">
                   <label className="flex-1 border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#8B1B1F] transition-all bg-gray-50 group">
                     <ImageIcon size={32} className="text-gray-300 group-hover:text-[#8B1B1F] transition-colors" />
                     <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight text-center">Tire uma foto ou selecione arquivo</span>
                     <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                           const reader = new FileReader();
                           reader.onloadend = () => setProof(reader.result as string);
                           reader.readAsDataURL(file);
                        }
                      }} 
                      accept="image/*"
                     />
                   </label>
                   {proof && (
                     <div className="h-28 w-28 rounded-2xl overflow-hidden relative shadow-lg border-2 border-white">
                        <img src={proof} className="h-full w-full object-cover" />
                        <button onClick={() => setProof('')} className="absolute top-1 right-1 bg-red-600 p-1.5 rounded-full text-white shadow-md">
                          <X size={10} />
                        </button>
                     </div>
                   )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-4">
              <button 
                onClick={() => setSelectedTask(null)}
                className="flex-1 py-4 text-xs font-black text-gray-500 hover:bg-gray-200 rounded-2xl transition-colors uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button 
                onClick={handleComplete}
                className="flex-1 py-4 bg-[#8B1B1F] text-white text-xs font-black rounded-2xl shadow-xl shadow-[#8B1B1F]/30 flex items-center justify-center gap-2 uppercase tracking-widest hover:bg-[#6F0F14] transition-all"
              >
                <Send size={16} />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
