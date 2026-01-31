
import React from 'react';
import { User, Task, ConferenciaStatus } from '../types';
import { ShieldCheck, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface ReliabilityPanelProps {
  users: User[];
  tasks: Task[];
  collaboratorsList: User[];
}

const ReliabilityPanel: React.FC<ReliabilityPanelProps> = ({ users, tasks, collaboratorsList }) => {
  const getReliabilityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-100';
    if (score >= 70) return 'text-orange-500 bg-orange-50 border-orange-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  return (
    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-8 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-ciatos font-bold text-[#111111] uppercase tracking-tighter">Indicadores de Confiabilidade</h3>
          <p className="text-sm text-gray-400 font-medium">Monitoramento de precisão da sua equipe.</p>
        </div>
        <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#8B1B1F]">
           <ShieldCheck size={24} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Colaborador</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Conferidas</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Confiabilidade</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Tendência</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {collaboratorsList.sort((a,b) => (b.ScoreConfiabilidade || 0) - (a.ScoreConfiabilidade || 0)).map(user => {
              const userTasks = tasks.filter(t => t.Responsavel === user.Email);
              const conferidas = userTasks.filter(t => t.ConferenciaStatus).length;
              const score = user.ScoreConfiabilidade || 0;

              return (
                <tr key={user.Email} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-[#8B1B1F] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {user.Nome.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#111111]">{user.Nome}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{user.Time}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center font-bold text-gray-600">{conferidas}</td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getReliabilityColor(score)}`}>
                      {score.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex justify-center">
                      {score > 85 ? <ArrowUpRight className="text-green-600" size={18} /> : 
                       score > 60 ? <Minus className="text-gray-300" size={18} /> : 
                       <ArrowDownRight className="text-red-600" size={18} />}
                    </div>
                  </td>
                </tr>
              );
            })}
            {collaboratorsList.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-gray-300 font-bold italic uppercase text-xs">Sem membros na equipe.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReliabilityPanel;
