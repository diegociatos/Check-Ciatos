
import React from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { getTodayStr } from '../store';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck,
  XCircle,
  Trophy,
  Check,
  CalendarDays,
  ArrowRight,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  showStatusIcon?: boolean;
}

const TaskTable: React.FC<TaskTableProps> = ({ tasks, onComplete, showStatusIcon = true }) => {
  const todayStr = getTodayStr();

  const priorityScore = React.useMemo(() => ({
    [TaskPriority.URGENTE]: 4,
    [TaskPriority.ALTA]: 3,
    [TaskPriority.MEDIA]: 2,
    [TaskPriority.BAIXA]: 1,
  }), []);

  const groupedTasks: Record<string, Task[]> = React.useMemo(() => {
    const groups = tasks.reduce((acc, task) => {
      const dateOnly = task.DataLimite_Date!; 
      const [year, month, day] = dateOnly.split('-');
      const formattedDate = `${day}/${month}/${year}`;

      const label = dateOnly === todayStr ? `HOJE - ${formattedDate}` : `PRÓXIMOS DIAS - ${formattedDate}`;

      if (!acc[label]) acc[label] = [];
      acc[label].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    Object.keys(groups).forEach(label => {
      groups[label].sort((a, b) => {
        const pDiff = priorityScore[b.Prioridade] - priorityScore[a.Prioridade];
        if (pDiff !== 0) return pDiff;
        return a.ID.localeCompare(b.ID);
      });
    });

    return groups;
  }, [tasks, priorityScore, todayStr]);

  const getStatusIcon = (status: TaskStatus) => {
    switch(status) {
      case TaskStatus.APROVADA: return <ShieldCheck size={20} className="text-green-600" />;
      case TaskStatus.AGUARDANDO_APROVACAO: return <Clock size={20} className="text-blue-500" />;
      case TaskStatus.FEITA_ERRADA: return <AlertTriangle size={20} className="text-yellow-600" />;
      case TaskStatus.NAO_FEITA: return <XCircle size={20} className="text-red-600" />;
      default: return <div className="h-5 w-5 rounded-full border-2 border-gray-200" />;
    }
  };

  return (
    <div className="space-y-12 font-ciatos">
      {Object.entries(groupedTasks).map(([label, items]) => (
        <div key={label} className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#8B1B1F]">
              {label}
            </span>
            <div className="h-px flex-1 bg-[#8B1B1F]/20 shadow-sm"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-5">
            {items.map((task) => {
              const dataSolicitacao = task.DataGeracao ? new Date(task.DataGeracao).toLocaleDateString('pt-BR') : 'Manual';
              const dataExecucao = task.DataLimite_Date!.split('-').reverse().join('/');
              const isRejected = task.Status === TaskStatus.FEITA_ERRADA || task.Status === TaskStatus.NAO_FEITA;

              return (
                <div 
                  key={task.ID} 
                  className={`bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 p-6 lg:p-7 flex flex-col group ${isRejected ? 'border-l-4 border-l-red-500' : ''}`}
                >
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="shrink-0">
                      <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-[#8B1B1F]/5">
                        {getStatusIcon(task.Status)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-bold text-[#111111] leading-tight font-ciatos truncate group-hover:text-[#8B1B1F]">
                          {task.Titulo}
                        </h4>
                        {isRejected && (
                          <span className="bg-red-50 text-red-600 text-[8px] font-black px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-widest">
                            Retorno de Auditoria
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex flex-col">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Solicitada em</p>
                          <p className="text-xs font-bold text-gray-600">{dataSolicitacao}</p>
                        </div>
                        <ArrowRight size={12} className="text-gray-200" />
                        <div className="flex flex-col">
                          <p className="text-[8px] font-black text-[#8B1B1F] uppercase tracking-widest">Executar em (Prazo)</p>
                          <p className="text-sm font-black text-[#111111]">{dataExecucao}</p>
                        </div>
                        <div className="h-6 w-px bg-gray-100 hidden sm:block"></div>
                        <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded-lg">
                          <Trophy size={14} className="text-yellow-600" />
                          <span className="text-[10px] font-black text-yellow-700">{task.PontosValor} PTS</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 w-full md:w-auto">
                      {(task.Status === TaskStatus.PENDENTE || task.Status === TaskStatus.FEITA_ERRADA || task.Status === TaskStatus.NAO_FEITA) ? (
                        <button 
                          onClick={() => onComplete(task.ID)}
                          className="w-full md:w-auto bg-[#8B1B1F] hover:bg-[#6F0F14] text-white py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95"
                        >
                          <Check size={18} strokeWidth={3} /> {isRejected ? 'REFAZER E ENVIAR' : 'CONCLUIR'}
                        </button>
                      ) : (
                        <div className="px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          {task.Status === TaskStatus.APROVADA ? <ShieldCheck size={16} className="text-green-600"/> : <Clock size={16} className="text-blue-500"/>}
                          {task.Status}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BLOCO DE FEEDBACK DO GESTOR */}
                  {isRejected && task.JustificativaGestor && (
                    <div className="mt-6 p-5 bg-red-50/50 rounded-2xl border border-dashed border-red-200 flex items-start gap-4 animate-in slide-in-from-top-2">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm border border-red-100">
                        <AlertCircle size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-red-700 uppercase tracking-widest mb-1 flex items-center gap-2">
                          <MessageSquare size={12} /> Nota de Auditoria do Gestor:
                        </p>
                        <p className="text-sm font-bold text-red-800 italic leading-relaxed">
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
      ))}
    </div>
  );
};

export default TaskTable;
