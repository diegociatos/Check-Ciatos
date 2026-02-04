
import React, { useState, useMemo } from 'react';
import { Task, User, TaskStatus, UserRole } from '../types';
import { User as UserIcon, Clock, Star, Filter, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface TaskSupervisionViewProps {
  tasks: Task[];
  users: User[];
  onDeleteTask: (taskId: string) => void;
  currentUserRole?: UserRole;
}

const TaskSupervisionView: React.FC<TaskSupervisionViewProps> = ({ tasks, users, onDeleteTask, currentUserRole }) => {
  const [filterResponsavel, setFilterResponsavel] = useState<string>('TODOS');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const collaborators = users.filter(u => u.Role === UserRole.COLABORADOR);

  const toggleGroup = (email: string) => {
    setExpandedGroups(prev => ({ ...prev, [email]: !prev[email] }));
  };

  // Fix: Explicitly typing groupedTasks as Record<string, Task[]> to avoid 'unknown' type errors on lines 92 and 110
  const groupedTasks: Record<string, Task[]> = useMemo(() => {
    let filtered = [...tasks];
    if (filterResponsavel !== 'TODOS') {
      filtered = filtered.filter(t => t.Responsavel === filterResponsavel);
    }

    const groups: Record<string, Task[]> = {};
    filtered.forEach(task => {
      if (!groups[task.Responsavel]) groups[task.Responsavel] = [];
      groups[task.Responsavel].push(task);
    });

    // Ordenar grupos por nome do colaborador e tarefas por data limite em um novo objeto tipado
    const sortedGroups: Record<string, Task[]> = {};
    Object.keys(groups).sort().forEach(key => {
      sortedGroups[key] = [...groups[key]].sort((a, b) => 
        new Date(a.DataLimite).getTime() - new Date(b.DataLimite).getTime()
      );
    });

    return sortedGroups;
  }, [tasks, filterResponsavel]);

  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.APROVADA: return 'bg-green-100 text-green-700 border-green-200';
      case TaskStatus.AGUARDANDO_APROVACAO: return 'bg-blue-100 text-blue-700 border-blue-200';
      case TaskStatus.FEITA_ERRADA: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case TaskStatus.NAO_FEITA: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-ciatos">
      {/* Filtro de Seleção */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-[#8B1B1F] uppercase tracking-tighter">Supervisão de Tarefas</h3>
          <p className="text-sm text-gray-400 font-medium">Acompanhamento de obrigações por colaborador.</p>
        </div>
        <div className="relative w-full md:w-72">
          <select 
            className="w-full bg-[#F3F3F3] border-none rounded-2xl p-4 text-sm font-bold outline-none appearance-none cursor-pointer text-[#111111]"
            value={filterResponsavel}
            onChange={e => setFilterResponsavel(e.target.value)}
          >
            <option value="TODOS">Todos os Colaboradores</option>
            {collaborators.map(u => <option key={u.Email} value={u.Email}>{u.Nome}</option>)}
          </select>
          <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Lista Agrupada */}
      <div className="space-y-4">
        {Object.keys(groupedTasks).length > 0 ? (
          Object.entries(groupedTasks).map(([email, userTasks]) => {
            const user = users.find(u => u.Email === email);
            const isExpanded = expandedGroups[email] !== false; // Default expanded

            return (
              <div key={email} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleGroup(email)}
                  className="w-full p-6 bg-gray-50/50 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-[#8B1B1F] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user?.Nome.charAt(0) || email.charAt(0)}
                    </div>
                    <div className="text-left">
                      <h4 className="text-lg font-bold text-[#111111] uppercase tracking-tighter">{user?.Nome || email}</h4>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{userTasks.length} Tarefas Atribuídas</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </button>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-white border-b border-gray-50">
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Título da Tarefa</th>
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Data Limite</th>
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {userTasks.map(task => (
                          <tr key={task.ID} className="hover:bg-gray-50/30 transition-colors">
                            <td className="px-8 py-5">
                              <p className="text-sm font-bold text-[#111111]">{task.Titulo}</p>
                              <p className="text-[10px] text-gray-400 line-clamp-1">{task.Descricao}</p>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-gray-600">{new Date(task.DataLimite).toLocaleDateString()}</span>
                                <span className="text-[9px] text-gray-400 font-bold uppercase">{new Date(task.DataLimite).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(task.Status)}`}>
                                {task.Status}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right font-black text-[#8B1B1F]">
                              {task.PontosValor} pts
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white py-20 rounded-[40px] border-2 border-dashed border-gray-100 text-center">
            <Clock size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhuma tarefa encontrada para os critérios selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskSupervisionView;
