
import React from 'react';
import { Task, TaskStatus, ConferenciaStatus } from '../types';
import { CheckCircle, Clock, Calendar, ShieldCheck, ShieldAlert, ShieldEllipsis, Star } from 'lucide-react';

interface CompletedTasksViewProps {
  tasks: Task[];
}

const CompletedTasksView: React.FC<CompletedTasksViewProps> = ({ tasks }) => {
  const renderConferenciaBadge = (status?: ConferenciaStatus) => {
    if (!status) return (
      <span className="flex items-center gap-1 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase">
        <ShieldEllipsis size={10} /> Aguardando Auditoria
      </span>
    );

    switch (status) {
      case ConferenciaStatus.APROVADO:
        return (
          <span className="flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase">
            <ShieldCheck size={10} /> Aprovado
          </span>
        );
      case ConferenciaStatus.CUMPRIU_ERRADO:
        return (
          <span className="flex items-center gap-1 text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 uppercase">
            <ShieldAlert size={10} /> Erro Identificado
          </span>
        );
      case ConferenciaStatus.NAO_CUMPRIU:
        return (
          <span className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase">
            <ShieldAlert size={10} /> Não Cumprida
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/50">
          <h3 className="text-xl font-ciatos font-bold text-[#111111] uppercase tracking-tighter">Histórico de Conclusão</h3>
          <p className="text-sm text-gray-400 font-medium">Registro completo das obrigações entregues e conferidas.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/30">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Título da Tarefa</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Prazo Original</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Entregue em</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Auditado</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <tr key={task.ID} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#111111]">{task.Titulo}</span>
                        <span className="text-[10px] text-gray-400 font-medium line-clamp-1">{task.Descricao}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                          <Calendar size={12} /> {new Date(task.DataLimite).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                          <Clock size={12} /> {new Date(task.DataLimite).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                          <CheckCircle size={12} /> {task.DataConclusao ? new Date(task.DataConclusao).toLocaleDateString() : '--'}
                        </div>
                        <div className="text-[10px] font-bold text-green-600">
                          {task.DataConclusao ? new Date(task.DataConclusao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        {renderConferenciaBadge(task.ConferenciaStatus)}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center gap-1 text-[#8B1B1F]">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-black">{task.PontosValor}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <CheckCircle size={48} className="mx-auto text-gray-100 mb-4" />
                    <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Nenhuma tarefa concluída encontrada.</p>
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
