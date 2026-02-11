
import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, UserRole, TaskPriority } from '../types';
import { getTodayStr } from '../store';
import { CalendarClock, ChevronLeft, CheckCircle2, X, Send, Star, Clock, AlertCircle, MessageSquare, AlertTriangle } from 'lucide-react';

interface UpcomingTasksViewProps {
  tasks: Task[];
  onComplete: (taskId: string, note: string, proof: string) => void;
  onBack: () => void;
  currentUserRole: UserRole;
}

const UpcomingTasksView: React.FC<UpcomingTasksViewProps> = ({ tasks, onComplete, onBack, currentUserRole }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [note, setNote] = useState('');

  const priorityScore = useMemo(() => ({
    [TaskPriority.URGENTE]: 4,
    [TaskPriority.ALTA]: 3,
    [TaskPriority.MEDIA]: 2,
    [TaskPriority.BAIXA]: 1,
  }), []);

  // Ordenação: DataLimite_Date (ASC) e Prioridade (DESC)
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const dateA = a.DataLimite_Date!;
      const dateB = b.DataLimite_Date!;
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return priorityScore[b.Prioridade] - priorityScore[a.Prioridade];
    });
  }, [tasks, priorityScore]);

  // Agrupamento por Data usando a coluna virtual
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    sortedTasks.forEach(task => {
      const dateOnly = task.DataLimite_Date!;
      const [year, month, day] = dateOnly.split('-');
      const formattedDate = `${day}/${month}/${year}`;
      
      if (!groups[formattedDate]) groups[formattedDate] = [];
      groups[formattedDate].push(task);
    });
    return groups;
  }, [sortedTasks]);

  const submitCompletion = () => {
    if (selectedTask) {
      onComplete(selectedTask.ID, note, '');
      alert("Entrega antecipada enviada para aprovação do gestor.");
      setSelectedTask(null);
      setNote('');
    }
  };

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENTE: return 'text-red-700 font-black';
      case TaskPriority.ALTA: return 'text-red-500 font-bold';
      case TaskPriority.MEDIA: return 'text-blue-600 font-bold';
      default: return 'text-gray-400 font-medium';
    }
  };

  return (
    <div className="flex flex-col gap-0 -m-4 lg:-m-8 animate-in fade-in duration-500 font-ciatos pb-20">
      {/* Cabeçalho */}
      <div className="bg-[#8B1B1F] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <button 
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> Voltar para Minha Mesa
          </button>
          <h3 className="text-4xl lg:text-5xl font-bold tracking-tight uppercase mb-2">Planejamento</h3>
          <p className="text-white/60 font-medium text-lg max-w-2xl italic">
            Pendências atuais e próximas obrigações contratuais.
          </p>
        </div>
        <CalendarClock size={120} className="absolute right-10 top-1/2 -translate-y-1/2 opacity-10" />
      </div>

      <div className="p-4 lg:p-8 space-y-10">
        {Object.keys(groupedTasks).length > 0 ? (
          (Object.entries(groupedTasks) as [string, Task[]][]).map(([date, items]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-3 px-4">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8B1B1F]">
                  PRAZO: {date}
                </span>
                <div className="h-px flex-1 bg-[#8B1B1F]/20"></div>
              </div>
              
              <div className="space-y-4">
                {items.map((task) => {
                   const isRejected = task.Status === TaskStatus.FEITA_ERRADA || task.Status === TaskStatus.NAO_FEITA;
                   const todayStr = getTodayStr();
                   const isOverdue = task.DataLimite_Date! < todayStr;
                   return (
                     <div key={task.ID} className={`bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden p-6 hover:shadow-md transition-shadow ${isRejected ? 'border-l-4 border-l-red-500' : ''} ${isOverdue ? 'border-l-4 border-l-orange-500 bg-orange-50/30' : ''}`}>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                           <div className="flex flex-col gap-1">
                              <h4 className="text-sm font-bold text-[#111111] leading-tight flex items-center gap-2">
                                 {task.Titulo}
                                 {isRejected && <span className="bg-red-50 text-red-600 text-[8px] font-black px-2 py-0.5 rounded border border-red-100 uppercase">Ajuste Necessário</span>}
                                 {isOverdue && !isRejected && <span className="bg-orange-50 text-orange-600 text-[8px] font-black px-2 py-0.5 rounded border border-orange-100 uppercase flex items-center gap-1"><AlertTriangle size={8}/> Pendência Atrasada</span>}
                              </h4>
                              <div className="flex items-center gap-3">
                                 <span className={`text-[9px] uppercase tracking-tighter ${getPriorityStyle(task.Prioridade)}`}>{task.Prioridade}</span>
                                 <span className="text-[9px] font-black text-[#8B1B1F] flex items-center gap-1"><Star size={10} fill="currentColor"/> {task.PontosValor} pts</span>
                              </div>
                           </div>
                           <button 
                             onClick={() => setSelectedTask(task)}
                             className="bg-[#8B1B1F] hover:bg-[#6F0F14] text-white py-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2"
                           >
                             <CheckCircle2 size={14} /> {isRejected ? 'Refazer Antecipação' : 'Check_Antecipado'}
                           </button>
                        </div>

                        {/* Bloco de feedback do gestor para tarefas futuras reprovadas */}
                        {isRejected && task.JustificativaGestor && (
                          <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-dashed border-red-200 flex items-start gap-3 animate-in slide-in-from-top-2">
                             <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
                             <div>
                                <p className="text-[9px] font-black text-red-700 uppercase mb-1 flex items-center gap-1">
                                   <MessageSquare size={10} /> O Gestor não aprovou o seu Check Antecipado:
                                </p>
                                <p className="text-xs font-bold text-red-800 italic leading-relaxed">
                                   "{task.JustificativaGestor}"
                                </p>
                             </div>
                          </div>
                        )}
                     </div>
                   );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
            <CalendarClock size={48} className="mx-auto text-gray-100 mb-4" />
            <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Sem tarefas futuras planejadas.</p>
          </div>
        )}
      </div>

      {/* Modal de Conclusão */}
      {selectedTask && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50">
               <h3 className="text-xl font-black text-[#111111] uppercase tracking-tighter">Entrega Antecipada</h3>
               <button onClick={() => setSelectedTask(null)} className="text-gray-300 hover:text-gray-500 transition-colors"><X size={24}/></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="bg-[#8B1B1F] p-6 rounded-3xl text-white">
                  <p className="text-[10px] font-black uppercase text-white/50 mb-1">Título da Tarefa:</p>
                  <p className="text-lg font-bold leading-tight">{selectedTask.Titulo}</p>
                  <p className="text-[10px] mt-2 italic opacity-70">Prazo Original: {selectedTask.DataLimite_Date!.split('-').reverse().join('/')}</p>
               </div>
               <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Notas de Execução</label>
                  <textarea 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none min-h-[120px]"
                    placeholder="Descreva o que foi realizado antecipadamente..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
               </div>
               <button 
                  onClick={submitCompletion}
                  className="w-full bg-[#8B1B1F] text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#6F0F14] transition-all shadow-xl flex items-center justify-center gap-3"
               >
                  <Send size={20} /> Confirmar Antecipação
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingTasksView;
