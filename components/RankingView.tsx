
import React from 'react';
import { User, Task } from '../types';
import { Medal, Trophy, User as UserIcon } from 'lucide-react';

interface RankingViewProps {
  users: User[];
  tasks: Task[];
  collaboratorsList: User[];
}

const RankingView: React.FC<RankingViewProps> = ({ users, tasks, collaboratorsList }) => {
  const collaborators = collaboratorsList
    .map(u => {
      const efficiency = u.EficienciaMes || 0;
      const taskCount = tasks.filter(t => t.Responsavel === u.Email).length;
      return { ...u, efficiency, taskCount };
    })
    .sort((a, b) => b.efficiency - a.efficiency);

  const getMedal = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="text-yellow-500" size={24} fill="currentColor" />;
      case 1: return <Medal className="text-gray-400" size={24} />;
      case 2: return <Medal className="text-amber-600" size={24} />;
      default: return <span className="text-gray-300 font-bold">{index + 1}º</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-[#8B1B1F] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <h3 className="text-4xl font-ciatos font-bold uppercase tracking-tight mb-2">Ranking Equipe</h3>
        <p className="text-white/60 font-medium">Reconhecimento baseado nos colaboradores sob sua gestão.</p>
        <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-10">
          <Trophy size={120} />
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Pos</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Colaborador</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Eficiência</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Auditado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {collaborators.map((user, index) => (
                <tr key={user.Email} className={`group hover:bg-gray-50/50 transition-colors ${index === 0 ? 'bg-yellow-50/10' : ''}`}>
                  <td className="px-8 py-6 text-center">
                    <div className="flex justify-center items-center h-10 w-10 mx-auto rounded-full bg-white shadow-sm border border-gray-100">
                      {getMedal(index)}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white bg-[#8B1B1F]">
                        {user.Foto ? <img src={user.Foto} className="w-full h-full object-cover" /> : <UserIcon size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#111111]">{user.Nome}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{user.Time}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-xl font-black text-[#111111]">{user.efficiency.toFixed(1)}%</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase">{user.ScoreConfiabilidade?.toFixed(0)}% Conf.</span>
                  </td>
                </tr>
              ))}
              {collaborators.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-8 py-20 text-center text-gray-300 font-bold italic uppercase text-xs">Sem ranking disponível.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RankingView;
