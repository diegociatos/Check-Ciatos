
import React from 'react';
import { User, Task } from '../types';
import { AlertTriangle, Info, CheckCircle2, LayoutDashboard, Target, Activity } from 'lucide-react';

interface TeamPanelProps {
  users: User[];
  tasks: Task[];
}

const TeamPanel: React.FC<TeamPanelProps> = ({ users, tasks }) => {
  const collaborators = users.filter(u => u.Role === 'Colaborador');
  
  const inRisk = collaborators.filter(u => (u.ScoreConfiabilidade || 0) < 70);
  const inAttention = collaborators.filter(u => (u.ScoreConfiabilidade || 0) >= 70 && (u.ScoreConfiabilidade || 0) <= 90);
  const healthy = collaborators.filter(u => (u.ScoreConfiabilidade || 0) > 90);

  const avgReliability = collaborators.reduce((sum, u) => sum + (u.ScoreConfiabilidade || 0), 0) / (collaborators.length || 1);
  const totalTasksToday = tasks.filter(t => t.DataLimite.startsWith(new Date().toISOString().split('T')[0])).length;

  const UserMiniCard = ({ user, color }: any) => (
    <div className={`p-4 rounded-2xl border bg-white shadow-sm flex items-center justify-between border-l-4 ${color} hover:shadow-md transition-shadow`}>
      <div className="flex flex-col">
        <p className={`text-sm font-black uppercase tracking-tighter ${user.TemAtrasos ? 'text-red-600' : 'text-green-600'}`}>
          {user.Nome}
        </p>
        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{user.Time}</p>
        <div className="mt-2">
           <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${user.TemAtrasos ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
             {user.TemAtrasos ? 'POSSUI ATRASOS' : 'TUDO EM DIA'}
           </span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-gray-800">{(user.ScoreConfiabilidade || 0).toFixed(0)}%</p>
        <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest">Confiabilidade</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#8B1B1F] p-6 rounded-[32px] text-white shadow-lg flex flex-col justify-between h-40">
           <LayoutDashboard size={24} className="opacity-50" />
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Confiabilidade Média</p>
              <h4 className="text-3xl font-ciatos font-bold">{avgReliability.toFixed(1)}%</h4>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between h-40">
           <Activity size={24} className="text-[#8B1B1F] opacity-50" />
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Tarefas Hoje</p>
              <h4 className="text-3xl font-ciatos font-bold text-[#111111]">{totalTasksToday}</h4>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between h-40">
           <Target size={24} className="text-green-600 opacity-50" />
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Taxa Sucesso Global</p>
              <h4 className="text-3xl font-ciatos font-bold text-[#111111]">92%</h4>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between h-40">
           <AlertTriangle size={24} className="text-red-600 opacity-50" />
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Atrasos Críticos</p>
              <h4 className="text-3xl font-ciatos font-bold text-red-600">{collaborators.filter(u => u.TemAtrasos).length}</h4>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-6">
           <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-2xl border border-red-100 w-fit">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Em Risco (&lt;70%)</span>
           </div>
           <div className="space-y-4">
              {inRisk.length > 0 ? inRisk.map(u => <UserMiniCard key={u.Email} user={u} color="border-l-red-600" />) : 
              <p className="text-xs text-gray-300 font-bold px-4 italic">Nenhum colaborador em risco crítico.</p>}
           </div>
        </div>

        <div className="space-y-6">
           <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-2xl border border-orange-100 w-fit">
              <Info size={16} className="text-orange-600" />
              <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Atenção (70-90%)</span>
           </div>
           <div className="space-y-4">
              {inAttention.length > 0 ? inAttention.map(u => <UserMiniCard key={u.Email} user={u} color="border-l-orange-500" />) : 
              <p className="text-xs text-gray-300 font-bold px-4 italic">Nenhum colaborador nesta categoria.</p>}
           </div>
        </div>

        <div className="space-y-6">
           <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-2xl border border-green-100 w-fit">
              <CheckCircle2 size={16} className="text-green-600" />
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Saudáveis (&gt;90%)</span>
           </div>
           <div className="space-y-4">
              {healthy.length > 0 ? healthy.map(u => <UserMiniCard key={u.Email} user={u} color="border-l-green-600" />) : 
              <p className="text-xs text-gray-300 font-bold px-4 italic">Equipe precisa de melhor engajamento.</p>}
           </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPanel;
