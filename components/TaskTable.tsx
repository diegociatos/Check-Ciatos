
import React from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck,
  XCircle
} from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  showStatusIcon?: boolean;
}

const TaskTable: React.FC<TaskTableProps> = ({ tasks, onComplete, showStatusIcon = true }) => {
  
  // Função auxiliar para obter a data de hoje no fuso de São Paulo
  const getTodaySaoPaulo = () => {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  };

  const todayStr = getTodaySaoPaulo();

  // Mapeamento de prioridade para ordenação (Urgente > Baixa)
  const priorityScore = React.useMemo(() => ({
    [TaskPriority.URGENTE]: 4,
    [TaskPriority.ALTA]: 3,
    [TaskPriority.MEDIA]: 2,
    [TaskPriority.BAIXA]: 1,
  }), []);

  // Agrupamento por Data com tipagem explícita
  const groupedTasks: Record<string, Task[]> = React.useMemo(() => {
    const groups = tasks.reduce((acc, task) => {
      // Ajuste para garantir que a data da tarefa também respeite o fuso ao ser exibida
      const dateObj = new Date(task.DataLimite);
      const dateLabel = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(dateObj);

      if (!acc[dateLabel]) acc[dateLabel] = [];
      acc[dateLabel].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    // Ordenação dentro dos grupos: Prioridade (Desc) e Data (Asc)
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => {
        const pDiff = priorityScore[b.Prioridade] - priorityScore[a.Prioridade];
        if (pDiff !== 0) return pDiff;
        return new Date(a.DataLimite).getTime() - new Date(b.DataLimite).getTime();
      });
    });

    // Ordenar as chaves (datas) para que as mais próximas venham primeiro
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const dateA = a.split('/').reverse().join('-');
      const dateB = b.split('/').reverse().join('-');
      return dateA.localeCompare(dateB);
    });

    const sortedGroups: Record<string, Task[]> = {};
    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }, [tasks, priorityScore]);

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENTE: return 'text-red-700 font-black';
      case TaskPriority.ALTA: return 'text-red-500 font-bold';
      case TaskPriority.MEDIA: return 'text-blue-600 font-bold';
      default: return 'text-gray-400 font-medium';
    }
  };

  const getRowBackground = (status: TaskStatus) => {
    if (status === TaskStatus.FEITA_ERRADA) return 'bg-yellow-50/70 hover:bg-yellow-100/80';
    if (status === TaskStatus.NAO_FEITA) return 'bg-red-50/70 hover:bg-red-100/80';
    return 'bg-white hover:bg-gray-50/80';
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch(status) {
      case TaskStatus.APROVADA: return <ShieldCheck size={18} className="text-green-600" />;
      case TaskStatus.AGUARDANDO_APROVACAO: return <Clock size={18} className="text-blue-500" />;
      case TaskStatus.FEITA_ERRADA: return <AlertTriangle size={18} className="text-yellow-600" />;
      case TaskStatus.NAO_FEITA: return <XCircle size={18} className="text-red-600" />;
      default: return <div className="h-4 w-4 rounded-full border-2 border-gray-200" />;
    }
  };

  return (
    <div className="space-y-8 font-ciatos">
      {Object.keys(groupedTasks).length > 0 ? (
        Object.entries(groupedTasks).map(([date, items]) => {
          const isToday = date === todayStr;
          
          return (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-3 px-4">
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isToday ? 'text-[#8B1B1F]' : 'text-gray-400'}`}>
                  {isToday ? `Hoje • ${date}` : date}
                </span>
                <div className={`h-px flex-1 ${isToday ? 'bg-[#8B1B1F]/20' : 'bg-gray-100'}`}></div>
              </div>
              
              <div className={`bg-white rounded-[24px] border ${isToday ? 'border-[#8B1B1F]/10 shadow-md' : 'border-gray-100 shadow-sm'} overflow-hidden`}>
                <table className="w-full text-left table-fixed">
                  <thead>
                    <tr className="bg-gray-50/30 border-b border-gray-100">
                      <th className="w-12 px-4 py-3 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="w-24 px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Prazo</th>
                      <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Título da Tarefa</th>
                      <th className="w-24 px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Prioridade</th>
                      <th className="w-20 px-4 py-3 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Pts</th>
                      <th className="w-32 px-4 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Ação Inline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((task) => (
                      <tr key={task.ID} className={`transition-colors duration-150 ${getRowBackground(task.Status)} group`}>
                        <td className="px-4 py-2.5 text-center">
                          <div className="flex justify-center">
                            {getStatusIcon(task.Status)}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[11px] font-bold text-gray-500">
                            {new Intl.DateTimeFormat('pt-BR', {
                              timeZone: 'America/Sao_Paulo',
                              hour: '2-digit',
                              minute: '2-digit'
                            }).format(new Date(task.DataLimite))}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-[#111111] line-clamp-1 group-hover:text-[#8B1B1F] transition-colors">
                              {task.Titulo}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] uppercase tracking-tighter ${getPriorityStyle(task.Prioridade)}`}>
                            {task.Prioridade}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="text-xs font-black text-[#8B1B1F]">
                            {task.PontosValor}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {(task.Status === TaskStatus.PENDENTE || task.Status === TaskStatus.FEITA_ERRADA || task.Status === TaskStatus.NAO_FEITA) ? (
                            <button 
                              onClick={() => onComplete(task.ID)}
                              className="bg-[#8B1B1F] hover:bg-[#6F0F14] text-white py-1.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2 ml-auto"
                            >
                              <CheckCircle2 size={12} /> Check
                            </button>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-gray-400 uppercase italic">
                              {task.Status === TaskStatus.APROVADA ? <ShieldCheck size={14} className="text-green-600"/> : <Clock size={14} className="text-blue-500"/>}
                              {task.Status}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      ) : (
        <div className="py-24 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
          <CheckCircle2 size={48} className="mx-auto text-gray-100 mb-4" />
          <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Fila de tarefas vazia.</p>
        </div>
      )}
    </div>
  );
};

export default TaskTable;
