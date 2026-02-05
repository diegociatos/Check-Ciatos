
import React, { useState, useMemo } from 'react';
import { Task, ConferenciaStatus, TaskStatus, User, UserRole } from '../types';
import { CheckCircle, Calendar, ShieldCheck, ShieldAlert, ShieldEllipsis, Star, Clock, User as UserIcon, Filter, Search } from 'lucide-react';

interface CompletedTasksViewProps {
  tasks: Task[];
  users: User[];
  currentUserRole: UserRole;
}

const CompletedTasksView: React.FC<CompletedTasksViewProps> = ({ tasks, users, currentUserRole }) => {
  const [filterColaborador, setFilterColaborador] = useState<string>('TODOS');
  
  const isManagerOrAdmin = currentUserRole === UserRole.GESTOR || currentUserRole === UserRole.ADMIN;

  const colaboradoresList = useMemo(() => {
    return users.filter(u => u.Role === UserRole.COLABORADOR);
  }, [users]);

  const filteredTasks = useMemo(() => {
    if (!isManagerOrAdmin || filterColaborador === 'TODOS') return tasks;
    return tasks.filter(t => t.Responsavel === filterColaborador);
  }, [tasks, filterColaborador, isManagerOrAdmin]);

  const renderConferenciaBadge = (task: Task) => {
    // Se está na lista de concluídas (Status Aprovada), exibe como Concluído
    if (task.Status === TaskStatus.APROVADA || task.ConferenciaStatus === ConferenciaStatus.APROVADO) {
      return (
        <span className="flex items-center justify-center gap-1 text-[8px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase tracking-widest">
          <ShieldCheck size={10} /> Concluído
        </span>
      );
    }

    switch (task.ConferenciaStatus) {
      case ConferenciaStatus.CUMPRIU_ERRADO:
        return (
          <span className="flex items-center justify-center gap-1 text-[8px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-widest">
            <ShieldAlert size={10} /> Erro
          </span>
        );
      case ConferenciaStatus.NAO_CUMPRIU:
        return (
          <span className="flex items-center justify-center gap-1 text-[8px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-widest">
            <ShieldAlert size={10} /> Falta
          </span>
        );
      default:
        return (
          <span className="flex items-center justify-center gap-1 text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-widest">
            <ShieldEllipsis size={10} /> Pendente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-ciatos pb-20">
      {/* Barra de Filtros para Gestão */}
      {isManagerOrAdmin && (
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 bg-[#8B1B1F]/5 text-[#8B1B1F] rounded-xl flex items-center justify-center">
                <Filter size={20} />
             </div>
             <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-[#111111]">Filtro de Equipe</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Visualize o histórico por colaborador específico.</p>
             </div>
          </div>
          <div className="relative w-full md:w-80">
             <select 
               className="w-full bg-[#F3F3F3] border-none rounded-2xl p-4 text-xs font-black uppercase tracking-widest outline-none appearance-none cursor-pointer text-[#111111] shadow-inner"
               value={filterColaborador}
               onChange={e => setFilterColaborador(e.target.value)}
             >
               <option value="TODOS">TODOS OS COLABORADORES</option>
               {colaboradoresList.map(u => <option key={u.Email} value={u.Email}>{u.Nome.toUpperCase()}</option>)}
             </select>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B1B1F] pointer-events-none">
                <Search size={16} />
             </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-[#111111] uppercase tracking-tighter">Histórico em Tabela</h3>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total de {filteredTasks.length} Registros Aprovados</p>
          </div>
          <ShieldCheck className="text-green-600" size={28} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead>
              <tr className="bg-gray-50/20">
                {isManagerOrAdmin && (
                  <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest w-48">Colaborador</th>
                )}
                <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Obrigação Concluída</th>
                <th className="w-32 px-8 py-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Finalizado em</th>
                <th className="w-24 px-8 py-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Auditado</th>
                <th className="w-20 px-8 py-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const resp = users.find(u => u.Email === task.Responsavel);
                  return (
                    <tr key={task.ID} className="hover:bg-gray-50/50 transition-colors">
                      {isManagerOrAdmin && (
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-7 bg-[#8B1B1F] rounded-lg flex items-center justify-center text-white text-[9px] font-black uppercase">
                              {resp?.Nome.charAt(0) || task.Responsavel.charAt(0)}
                            </div>
                            <span className="text-[10px] font-bold text-[#111111] uppercase truncate">
                              {resp?.Nome.split(' ')[0] || task.Responsavel.split('@')[0]}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#111111] truncate">{task.Titulo}</span>
                          <span className="text-[9px] text-gray-400 line-clamp-1 italic">{task.Descricao}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-gray-600 uppercase">
                            {task.DataConclusao ? new Date(task.DataConclusao).toLocaleDateString() : '--'}
                          </span>
                          <span className="text-[9px] text-gray-300 font-bold">
                            {task.DataConclusao ? new Date(task.DataConclusao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <div className="flex justify-center">
                          {renderConferenciaBadge(task)}
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-[#8B1B1F]">
                          <Star size={10} fill="currentColor" />
                          <span className="text-xs font-black">{task.PontosValor}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isManagerOrAdmin ? 5 : 4} className="px-8 py-20 text-center">
                    <ShieldEllipsis size={40} className="mx-auto text-gray-100 mb-3" />
                    <p className="text-gray-300 font-black uppercase text-[10px] tracking-widest">Nenhuma entrega encontrada para o filtro.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompletedTasksView;
