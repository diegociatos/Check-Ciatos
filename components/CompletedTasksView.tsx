
import React from 'react';
import { Task, ConferenciaStatus } from '../types';
import { CheckCircle, Calendar, ShieldCheck, ShieldAlert, ShieldEllipsis, Star, Clock } from 'lucide-react';

interface CompletedTasksViewProps {
  tasks: Task[];
}

const CompletedTasksView: React.FC<CompletedTasksViewProps> = ({ tasks }) => {
  const renderConferenciaBadge = (status?: ConferenciaStatus) => {
    if (!status) return (
      <span className="flex items-center justify-center gap-1 text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase">
        <ShieldEllipsis size={10} /> Pendente
      </span>
    );

    switch (status) {
      case ConferenciaStatus.APROVADO:
        return (
          <span className="flex items-center justify-center gap-1 text-[8px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase">
            <ShieldCheck size={10} /> Aprovado
          </span>
        );
      case ConferenciaStatus.CUMPRIU_ERRADO:
        return (
          <span className="flex items-center justify-center gap-1 text-[8px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 uppercase">
            <ShieldAlert size={10} /> Erro
          </span>
        );
      default:
        return (
          <span className="flex items-center justify-center gap-1 text-[8px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase">
            <ShieldAlert size={10} /> Falha
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-ciatos">
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-[#111111] uppercase tracking-tighter">Histórico em Tabela</h3>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total de {tasks.length} Entregas Aprovadas</p>
          </div>
          <CheckCircle className="text-green-600" size={24} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead>
              <tr className="bg-gray-50/20">
                <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Obrigação Concluída</th>
                <th className="w-32 px-6 py-3 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Concluído Em</th>
                <th className="w-24 px-6 py-3 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Auditado</th>
                <th className="w-20 px-6 py-3 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <tr key={task.ID} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#111111] truncate">{task.Titulo}</span>
                        <span className="text-[9px] text-gray-400 line-clamp-1">{task.Descricao}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-gray-600">
                          {task.DataConclusao ? new Date(task.DataConclusao).toLocaleDateString() : '--'}
                        </span>
                        <span className="text-[9px] text-gray-300 font-bold">
                          {task.DataConclusao ? new Date(task.DataConclusao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex justify-center">
                        {renderConferenciaBadge(task.ConferenciaStatus)}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-[#8B1B1F]">
                        <Star size={10} fill="currentColor" />
                        <span className="text-xs font-black">{task.PontosValor}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <CheckCircle size={32} className="mx-auto text-gray-100 mb-2" />
                    <p className="text-gray-300 font-black uppercase text-[10px] tracking-widest">Nenhuma entrega aprovada.</p>
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
