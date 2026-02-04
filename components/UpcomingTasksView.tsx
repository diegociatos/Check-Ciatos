
import React, { useState } from 'react';
import { Task, TaskStatus, UserRole } from '../types';
import TaskTable from './TaskTable';
import { CalendarClock, ChevronLeft, FastForward, CheckSquare, X, Send } from 'lucide-react';

interface UpcomingTasksViewProps {
  tasks: Task[];
  allTasks: Task[];
  onComplete: (taskId: string, note: string, proof: string) => void;
  onBack: () => void;
  currentUserRole: UserRole;
}

const UpcomingTasksView: React.FC<UpcomingTasksViewProps> = ({ tasks, onComplete, onBack, currentUserRole }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [note, setNote] = useState('');

  const handleComplete = (taskId: string) => {
    const task = tasks.find(t => t.ID === taskId);
    if (task) setSelectedTask(task);
  };

  const submitCompletion = () => {
    if (selectedTask) {
      onComplete(selectedTask.ID, note, '');
      setSelectedTask(null);
      setNote('');
    }
  };

  return (
    <div className="flex flex-col gap-0 -m-4 lg:-m-8 animate-in fade-in duration-500 font-ciatos pb-20">
      <div className="bg-[#8B1B1F] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <button 
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> Voltar para Hoje
          </button>
          
          <div className="flex items-center gap-3 mb-4 opacity-70">
            <FastForward size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Planejamento e Antecipação</span>
          </div>
          <h3 className="text-4xl lg:text-5xl font-bold tracking-tight uppercase mb-2">Próximas Obrigações</h3>
          <p className="text-white/60 font-medium text-lg max-w-2xl">
            Adiantar tarefas demonstra proatividade e garante sua pontuação com antecedência.
          </p>
        </div>
        <CalendarClock size={120} className="absolute right-10 top-1/2 -translate-y-1/2 opacity-10" />
      </div>

      <div className="p-4 lg:p-8 space-y-8">
        <div className="flex items-center justify-between bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                 <CheckSquare size={24} />
              </div>
              <div>
                 <h4 className="text-lg font-bold text-[#111111] uppercase tracking-tighter">Tabela de Antecipação</h4>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Exibindo obrigações futuras por data</p>
              </div>
           </div>
        </div>
        
        <TaskTable tasks={tasks} onComplete={handleComplete} />
      </div>

      {/* Modal de Conclusão Inline */}
      {selectedTask && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50">
               <h3 className="text-xl font-black text-[#111111] uppercase tracking-tighter">Check Antecipado</h3>
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none min-h-[100px]"
                    placeholder="Descreva o que foi realizado antecipadamente..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
               </div>
               <button 
                  onClick={submitCompletion}
                  className="w-full bg-[#8B1B1F] text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#6F0F14] transition-all shadow-xl flex items-center justify-center gap-3"
               >
                  <Send size={20} /> Concluir e Adiantar
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingTasksView;
