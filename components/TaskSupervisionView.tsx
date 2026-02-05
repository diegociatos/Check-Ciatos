
import React, { useState, useMemo } from 'react';
import { Task, User, TaskStatus, UserRole } from '../types';
import { Filter, CheckCircle2, Calendar, FileCode, AlertCircle, User as UserIcon, Clock, Target } from 'lucide-react';

interface TaskSupervisionViewProps {
  tasks: Task[];
  users: User[];
  onDeleteTask: (taskId: string) => void;
  currentUserRole?: UserRole;
}

const TaskSupervisionView: React.FC<TaskSupervisionViewProps> = ({ tasks, users, onDeleteTask, currentUserRole }) => {
  const [filterResponsavel, setFilterResponsavel] = useState<string>('TODOS');

  const collaborators = useMemo(() => {
    return users.filter(u => u.Role === UserRole.COLABORADOR);
  }, [users]);

  // Estrutura de Agrupamento: [Responsavel] -> [DataLimite_Date] -> Task[]
  const groupedData = useMemo(() => {
    let filtered = tasks.filter(t => t.Status !== TaskStatus.APROVADA);
    
    if (filterResponsavel !== 'TODOS') {
      filtered = filtered.filter(t => t.Responsavel === filterResponsavel);
    }

    const structure: Record<string, Record<string, Task[]>> = {};

    filtered.forEach(task => {
      const resp = task.Responsavel;
      const date = task.DataLimite_Date || 'Sem Data';

      if (!structure[resp]) structure[resp] = {};
      if (!structure[resp][date]) structure[resp][date] = [];
      
      structure[resp][date].push(task);
    });

    const sortedResp = Object.keys(structure).sort();
    const finalStructure: Record<string, Record<string, Task[]>> = {};

    sortedResp.forEach(resp => {
      const sortedDates = Object.keys(structure[resp]).sort();
      finalStructure[resp] = {};
      sortedDates.forEach(date => {
        finalStructure[resp][date] = structure[resp][date].sort((a, b) => a.Titulo.localeCompare(b.Titulo));
      });
    });

    return finalStructure;
  }, [tasks, filterResponsavel]);

  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.AGUARDANDO_APROVACAO: return 'bg-blue-100 text-blue-700 border-blue-200';
      case TaskStatus.FEITA_ERRADA: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case TaskStatus.NAO_FEITA: return 'bg-red-100 text-red-700 border-red-200';
      case TaskStatus.ATRASADA: return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-ciatos">
      {/* Header e Filtros */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-[#8B1B1F] uppercase tracking-tighter">Supervisão de Tarefas</h3>
          <p className="text-sm text-gray-400 font-medium italic">Visão total de obrigações por colaborador e fluxo de datas.</p>
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

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-1/3">Obrigação / Datas de Fluxo</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-32">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-24">Pontos</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right w-40">Modelo ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Object.keys(groupedData).length > 0 ? (
                Object.entries(groupedData).map(([email, dateGroups]) => {
                  const user = users.find(u => u.Email === email);
                  return (
                    <React.Fragment key={email}>
                      <tr className="bg-[#8B1B1F]/5">
                        <td colSpan={4} className="px-8 py-3">
                           <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-[#8B1B1F] rounded-xl flex items-center justify-center text-white text-xs font-black">
                                 {user?.Nome.charAt(0) || email.charAt(0)}
                              </div>
                              <span className="text-xs font-black text-[#8B1B1F] uppercase tracking-widest">
                                 {user?.Nome || email}
                              </span>
                              <div className="h-px flex-1 bg-[#8B1B1F]/10"></div>
                           </div>
                        </td>
                      </tr>
                      
                      {Object.entries(dateGroups).map(([date, items]) => (
                        <React.Fragment key={`${email}-${date}`}>
                           {items.map(task => (
                             <tr key={task.ID} className="hover:bg-gray-50/50 transition-colors group">
                               <td className="px-8 py-5">
                                 <div className="flex flex-col gap-2">
                                   <span className="text-sm font-bold text-[#111111] leading-tight">{task.Titulo}</span>
                                   <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                         <Clock size={10} className="opacity-50" />
                                         Solicitação: {task.DataGeracao ? new Date(task.DataGeracao).toLocaleDateString('pt-BR') : 'Manual'}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[9px] font-black text-[#8B1B1F] uppercase tracking-widest">
                                         <Target size={10} className="opacity-50" />
                                         Execução: {task.DataLimite_Date!.split('-').reverse().join('/')}
                                      </div>
                                   </div>
                                 </div>
                               </td>
                               <td className="px-8 py-5 text-center">
                                 <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(task.Status)}`}>
                                   {task.Status}
                                 </span>
                               </td>
                               <td className="px-8 py-5 text-center font-black text-[#8B1B1F] text-sm">
                                 {task.PontosValor}
                               </td>
                               <td className="px-8 py-5 text-right">
                                  <div className="flex items-center justify-end gap-1.5 text-[9px] font-mono text-gray-400 uppercase">
                                    <FileCode size={10} />
                                    {task.OrigemModelo || 'MANUAL'}
                                  </div>
                               </td>
                             </tr>
                           ))}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-32 text-center text-gray-300 uppercase font-black text-xs">Nenhuma tarefa ativa.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaskSupervisionView;
