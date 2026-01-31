
import React, { useState, useMemo } from 'react';
import { User, Task, ScoreLedger, TaskStatus } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { User as UserIcon, ShieldCheck, Trophy, Target, TrendingUp, Search, Star } from 'lucide-react';

interface IndividualPerformanceDashboardProps {
  users: User[];
  tasks: Task[];
  ledger: ScoreLedger[];
  collaboratorsList: User[];
}

const IndividualPerformanceDashboard: React.FC<IndividualPerformanceDashboardProps> = ({ users, tasks, ledger, collaboratorsList }) => {
  const [selectedEmail, setSelectedEmail] = useState<string>(collaboratorsList[0]?.Email || '');

  const selectedUser = useMemo(() => users.find(u => u.Email === selectedEmail), [users, selectedEmail]);

  const userTasks = useMemo(() => tasks.filter(t => t.Responsavel === selectedEmail), [tasks, selectedEmail]);
  
  const ranking = useMemo(() => {
    const list = collaboratorsList
      .map(u => ({ email: u.Email, score: u.PontosRealizadosMes || 0 }))
      .sort((a, b) => b.score - a.score);
    const pos = list.findIndex(l => l.email === selectedEmail);
    return pos !== -1 ? pos + 1 : '--';
  }, [collaboratorsList, selectedEmail]);

  const statusData = [
    { name: 'Pendentes', value: userTasks.filter(t => t.Status === TaskStatus.PENDENTE).length },
    { name: 'Concluídas', value: userTasks.filter(t => t.Status === TaskStatus.CONCLUIDO || t.Status === TaskStatus.CONFERIDO).length },
    { name: 'Atrasadas', value: userTasks.filter(t => t.Status === TaskStatus.ATRASADA).length },
  ];

  const StatCard = ({ title, value, subValue, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</span>
        <div className={`p-2.5 rounded-2xl bg-[#F3F3F3] ${colorClass.replace('text-', 'text-opacity-70 ')}`}>
           <Icon size={20} className={colorClass} />
        </div>
      </div>
      <div>
        <h4 className={`text-4xl font-black tracking-tighter ${colorClass}`}>{value}</h4>
        <p className="text-[10px] font-bold text-gray-300 uppercase mt-1 tracking-wider">{subValue}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-[#8B1B1F] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <h3 className="text-3xl font-ciatos font-bold uppercase tracking-tight">Painel Individual</h3>
            <p className="text-white/60 font-medium max-w-md">Análise profunda de desempenho dos colaboradores sob sua gestão.</p>
          </div>
          <div className="min-w-[300px] space-y-2">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-2">
              <Search size={12} /> Pesquisar na Minha Equipe
            </label>
            <select 
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-sm font-bold outline-none text-white appearance-none cursor-pointer"
              value={selectedEmail}
              onChange={e => setSelectedEmail(e.target.value)}
            >
              {collaboratorsList.map(u => (
                <option key={u.Email} value={u.Email} className="text-black">{u.Nome} ({u.Time})</option>
              ))}
              {collaboratorsList.length === 0 && <option value="" className="text-black">Nenhum colaborador associado</option>}
            </select>
          </div>
        </div>
      </div>

      {selectedUser ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Índice de Confiabilidade" 
              value={`${(selectedUser.ScoreConfiabilidade || 0).toFixed(1)}%`}
              subValue="Precisão nas Entregas"
              icon={ShieldCheck}
              colorClass={selectedUser.ScoreConfiabilidade! > 80 ? 'text-green-600' : 'text-[#8B1B1F]'}
            />
            <StatCard 
              title="Posição na Equipe" 
              value={`${ranking}º`}
              subValue="Performance de Grupo"
              icon={Trophy}
              colorClass="text-yellow-600"
            />
            <StatCard 
              title="Eficiência Mensal" 
              value={`${(selectedUser.EficienciaMes || 0).toFixed(1)}%`}
              subValue="Pontos Realizados vs Possíveis"
              icon={Target}
              colorClass="text-blue-600"
            />
            <StatCard 
              title="Pontos Acumulados" 
              value={selectedUser.PontosRealizadosMes || 0}
              subValue="Méritos no Período"
              icon={Star}
              colorClass="text-[#8B1B1F]"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
              <h4 className="text-xl font-ciatos font-bold text-[#111111] uppercase tracking-tighter mb-8">Status das Obrigações</h4>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip cursor={{fill: '#F3F3F3'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#8B1B1F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-center">
               <div className="space-y-6">
                  <h4 className="text-2xl font-ciatos font-bold text-[#111111] uppercase tracking-tighter">Análise Comportamental</h4>
                  <div className="p-6 bg-[#F3F3F3] rounded-[30px] border border-gray-100">
                     <p className="text-sm font-bold text-[#8B1B1F] mb-1">Status RH:</p>
                     <p className="text-lg font-black text-[#111111] uppercase tracking-tighter">{selectedUser.StatusRH || 'ANÁLISE PENDENTE'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                        <p className="text-[9px] font-black text-green-700 uppercase mb-1">Feedback Gestor</p>
                        <p className="text-[11px] font-bold text-green-600">Gestão Responsável: {users.find(u => u.Email === selectedUser.Gestor)?.Nome || 'Admin'}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </>
      ) : (
        <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
           <UserIcon size={48} className="mx-auto text-gray-100 mb-4" />
           <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Selecione um colaborador da sua equipe.</p>
        </div>
      )}
    </div>
  );
};

export default IndividualPerformanceDashboard;
