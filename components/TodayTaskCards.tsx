
import React from 'react';
import { Task, TaskStatus, TaskPriority, UserRole } from '../types';
import { 
  CheckCircle, 
  Clock, 
  Star,
  ShieldCheck,
  Bell,
  User as UserIcon,
  Trash2,
  AlertTriangle,
  MessageSquare,
  History
} from 'lucide-react';

interface TodayTaskCardsProps {
  tasks: Task[];
  allTasks: Task[]; // Necessário para detecção de duplicatas globais
  onComplete: (taskId: string) => void;
  onNotify?: (taskTitle: string) => void;
  onDelete?: (taskId: string) => void;
  showUser?: boolean;
  currentUserRole?: UserRole;
}

const TodayTaskCards: React.FC<TodayTaskCardsProps> = ({ 
  tasks, 
  allTasks,
  onComplete, 
  onNotify, 
  onDelete,
  showUser, 
  currentUserRole 
}) => {
  
  const isManagerOrAdmin = currentUserRole === UserRole.GESTOR || currentUserRole === UserRole.ADMIN;

  const getPriorityBadge = (priority: TaskPriority) => {
    const styles = {
      [TaskPriority.URGENTE]: 'bg-red-50 text-red-700 border-red-100',
      [TaskPriority.ALTA]: 'bg-red-50 text-red-600 border-red-100',
      [TaskPriority.MEDIA]: 'bg-yellow-50 text-yellow-700 border-yellow-100',
      [TaskPriority.BAIXA]: 'bg-green-50 text-green-700 border-green-100',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[priority]}`}>
        {priority}
      </span>
    );
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch(status) {
      case TaskStatus.FEITA_ERRADA: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case TaskStatus.NAO_FEITA: return 'bg-red-100 text-red-800 border-red-200';
      case TaskStatus.PENDENTE: return 'bg-gray-100 text-gray-500 border-gray-200';
      case TaskStatus.AGUARDANDO_APROVACAO: return 'bg-blue-100 text-blue-700 border-blue-200';
      case TaskStatus.APROVADA: return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-400 border-gray-100';
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in duration-700 opacity-60">
        <div className="h-16 w-16 bg-[#F3F3F3] rounded-full flex items-center justify-center text-gray-300 mb-2">
          <CheckCircle size={32} strokeWidth={1} />
        </div>
        <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Nenhuma tarefa pendente para este grupo</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {tasks.map((task) => {
        const isOverdue = new Date(task.DataLimite) < new Date() && task.Status === TaskStatus.PENDENTE;
        const isReturn = task.Status === TaskStatus.FEITA_ERRADA || task.Status === TaskStatus.NAO_FEITA;

        return (
          <div 
            key={task.ID} 
            className={`bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col relative ${isReturn ? 'ring-2 ring-red-100' : ''}`}
          >
            {/* Botão Deletar (Apenas Admin/Gestor) */}
            {isManagerOrAdmin && onDelete && (
              <button 
                onClick={() => onDelete(task.ID)}
                className="absolute top-4 right-4 z-20 p-2 bg-white text-[#DC2626] rounded-xl border border-red-100 shadow-sm hover:bg-red-600 hover:text-white transition-all"
                title="Deletar Tarefa"
              >
                <Trash2 size={16} />
              </button>
            )}

            {/* Header do Card */}
            <div className="p-7 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(task.Prioridade)}
                    {task.Tentativas > 0 && (
                      <div className="flex items-center gap-1 text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-200 uppercase">
                        <History size={10} /> {task.Tentativas}ª Tentativa
                      </div>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(task.Status)}`}>
                    {task.Status}
                  </span>
                </div>
                <div className="flex flex-col items-end pr-8">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xl font-black tracking-tighter">{task.PontosValor}</span>
                  </div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PONTOS</span>
                </div>
              </div>

              <h4 className="text-xl font-ciatos font-bold text-[#111111] leading-tight mb-3 min-h-[3.5rem] line-clamp-2">
                {task.Titulo}
              </h4>
              
              <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-6 h-10">
                {task.Descricao}
              </p>

              {/* Justificativa do Gestor em caso de Reenvio */}
              {isReturn && task.JustificativaGestor && (
                 <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100">
                    <p className="text-[9px] font-black text-red-700 uppercase flex items-center gap-1 mb-1">
                       <MessageSquare size={10} /> Motivo do Retorno:
                    </p>
                    <p className="text-[11px] text-red-600 font-bold italic leading-relaxed">"{task.JustificativaGestor}"</p>
                 </div>
              )}

              <div className="flex flex-col gap-2 mt-auto">
                {showUser && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    <UserIcon size={12} /> {task.Responsavel}
                  </div>
                )}
                <div className={`flex items-center gap-2 text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-gray-400'}`}>
                  <Clock size={16} />
                  <span>Prazo: {new Date(task.DataLimite).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            {/* Footer / Ação */}
            <div className="px-7 pb-7 flex gap-2">
              {(task.Status === TaskStatus.PENDENTE || isReturn) ? (
                <>
                  <button 
                    onClick={() => onComplete(task.ID)}
                    className="flex-1 bg-[#8B1B1F] hover:bg-[#6F0F14] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-[#8B1B1F]/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <CheckCircle size={16} /> {isReturn ? 'Reenviar Entrega' : 'Check / Concluir'}
                  </button>
                  {onNotify && (
                    <button 
                      onClick={() => onNotify(task.Titulo)}
                      className="bg-gray-100 text-[#8B1B1F] p-4 rounded-2xl hover:bg-[#8B1B1F] hover:text-white transition-all shadow-md active:scale-90"
                      title="Notificar Responsável"
                    >
                      <Bell size={18} />
                    </button>
                  )}
                </>
              ) : (
                <div className="w-full bg-blue-50 text-blue-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-blue-100">
                  <ShieldCheck size={18} /> Aguardando Auditoria
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TodayTaskCards;
