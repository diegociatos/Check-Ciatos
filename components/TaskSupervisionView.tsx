
import React, { useState, useMemo } from 'react';
import { Task, User, TaskStatus, UserRole } from '../types';
import { Search, Calendar, Star, User as UserIcon, CheckCircle, ChevronRight, LayoutDashboard, Filter, Trash2 } from 'lucide-react';

interface TaskSupervisionViewProps {
  tasks: Task[];
  users: User[];
  onDeleteTask: (taskId: string) => void;
  currentUserRole?: UserRole;
}

const TaskSupervisionView: React.FC<TaskSupervisionViewProps> = ({ tasks, users, onDeleteTask, currentUserRole }) => {
  const [filterResponsavel, setFilterResponsavel] = useState<string>('TODOS');
  const isManagerOrAdmin = currentUserRole === UserRole.GESTOR || currentUserRole === UserRole.ADMIN;

  const collaborators = users.filter(u => u.Role === UserRole.COLABORADOR);

  const displayedTasks = useMemo(() => {
    let list = [...tasks];
    if (filterResponsavel !== 'TODOS') {
      list = list.filter(t => t.Responsavel === filterResponsavel);
    }
    // Ordenação padrão: DataLimite crescente
    return list.sort((a, b) => new Date(a.DataLimite).getTime() - new Date(b.DataLimite).getTime());
  }, [tasks, filterResponsavel]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabeçalho e Filtro Interativo */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-ciatos font-bold text-[#6F0F14] uppercase tracking-tighter">Supervisão de Tarefas</h3>
            <p className="text-sm text-gray-400 font-medium italic">Acompanhamento executivo de obrigações em tempo real.</p>
          </div>
          
          {/* Dropdown de Filtro Interativo */}
          <div className="w-full md:w-80 space-y-2">
            <label className="text-[10px] font-black text-[#8B1B1F] uppercase tracking-widest flex items-center gap-2">
              <Filter size={12} /> Seleção do Colaborador:
            </label>
            <div className="relative">
              <select 
                className="w-full bg-[#8B1B1F] text-white border-none rounded-2xl py-3 pl-10 pr-4 text-xs font-bold outline-none cursor-pointer appearance-none shadow-lg shadow-[#8B1B1F]/20 font-sans"
                value={filterResponsavel}
                onChange={e => setFilterResponsavel(e.target.value)}
              >
                <option value="TODOS" className="bg-white text-[#111111]">Todos os Colaboradores</option>
                {collaborators.map(u => (
                  <option key={u.Email} value={u.Email} className="bg-white text-[#111111]">
                    {u.Nome}
                  </option>
                ))}
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/70">
                <UserIcon size={14} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Dados (Tipo: Tabela) */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 font-black text-gray-400 uppercase tracking-widest">Responsável</th>
                <th className="px-8 py-5 font-black text-gray-400 uppercase tracking-widest">Título da Tarefa</th>
                <th className="px-8 py-5 font-black text-gray-400 uppercase tracking-widest text-center">Prazo</th>
                <th className="px-8 py-5 font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayedTasks.length > 0 ? (
                displayedTasks.map(task => {
                  const user = users.find(u => u.Email === task.Responsavel);
                  return (
                    <tr key={task.ID} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-700">
                        {user?.Nome || task.Responsavel}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#111111]">{task.Titulo}</span>
                          <span className="text-[10px] text-gray-400 line-clamp-1">{task.Descricao}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center font-bold text-gray-500">
                        {new Date(task.DataLimite).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${
                          task.Status === TaskStatus.PENDENTE ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          task.Status === TaskStatus.CONCLUIDO ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                          task.Status === TaskStatus.CONFERIDO ? 'bg-green-50 text-green-600 border-green-100' :
                          'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {task.Status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right flex items-center justify-end gap-3">
                        <div className="flex flex-col items-end mr-4">
                           <span className="font-black text-[#8B1B1F]">{task.PontosValor} pts</span>
                        </div>
                        {isManagerOrAdmin && (
                          <button 
                            onClick={() => onDeleteTask(task.ID)}
                            className="p-2 text-[#DC2626] hover:bg-red-50 rounded-xl transition-all"
                            title="Deletar Tarefa"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Nenhuma tarefa encontrada.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Rodapé informativo */}
        <div className="p-4 px-8 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total de Obrigações: {displayedTasks.length}</span>
          <span className="text-[10px] font-black text-[#8B1B1F] uppercase tracking-widest flex items-center gap-2">
            <CheckCircle size={12} /> Sincronizado
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskSupervisionView;
