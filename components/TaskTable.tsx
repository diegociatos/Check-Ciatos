
import React from 'react';
import { Task, TaskStatus, TaskPriority, ConferenciaStatus } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  MoreHorizontal,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
}

const TaskTable: React.FC<TaskTableProps> = ({ tasks, onComplete }) => {
  
  const getPriorityBadge = (priority: TaskPriority) => {
    const styles = {
      [TaskPriority.URGENTE]: 'bg-red-100 text-red-700 border-red-200',
      [TaskPriority.ALTA]: 'bg-orange-100 text-orange-700 border-orange-200',
      [TaskPriority.MEDIA]: 'bg-blue-100 text-blue-700 border-blue-200',
      [TaskPriority.BAIXA]: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return (
      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${styles[priority]}`}>
        {priority}
      </span>
    );
  };

  const getStatusBadge = (status: TaskStatus) => {
    // Fix: Updated styles mapping to use valid TaskStatus keys from types.ts
    const styles = {
      [TaskStatus.PENDENTE]: 'bg-yellow-50 text-yellow-700 border-yellow-100',
      [TaskStatus.AGUARDANDO_APROVACAO]: 'bg-blue-50 text-blue-700 border-blue-100',
      [TaskStatus.APROVADA]: 'bg-green-50 text-green-700 border-green-100',
      [TaskStatus.FEITA_ERRADA]: 'bg-orange-50 text-orange-700 border-orange-100',
      [TaskStatus.NAO_FEITA]: 'bg-red-100 text-red-800 border-red-200',
      [TaskStatus.ATRASADA]: 'bg-red-50 text-red-700 border-red-100',
    };
    return (
      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Título da Tarefa</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Limite</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Prioridade</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Pontos</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <tr key={task.ID} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#111111] group-hover:text-[#8B1B1F] transition-colors">
                        {task.Titulo}
                      </span>
                      <span className="text-xs text-gray-400 line-clamp-1 font-medium">{task.Descricao}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                      <Clock size={14} className="text-gray-300" />
                      {new Date(task.DataLimite).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {getPriorityBadge(task.Prioridade)}
                  </td>
                  <td className="px-6 py-5">
                    {getStatusBadge(task.Status)}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-sm font-black text-[#8B1B1F]">
                      {task.PontosValor}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {task.Status === TaskStatus.PENDENTE ? (
                      <button 
                        onClick={() => onComplete(task.ID)}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-xl shadow-lg shadow-green-600/20 transition-all hover:scale-110 active:scale-95 flex items-center justify-center ml-auto"
                        title="Concluir Tarefa"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    ) : (
                      <div className="flex items-center justify-end text-green-500 font-bold text-[10px] uppercase gap-1">
                        <ShieldCheck size={14} /> Entregue
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                      <CheckCircle2 size={32} />
                    </div>
                    <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Nenhuma tarefa pendente ou concluída</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskTable;
