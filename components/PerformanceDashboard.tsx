
import React from 'react';
import { Task, TaskStatus, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, CheckCircle, AlertTriangle, TrendingUp, Users } from 'lucide-react';

interface PerformanceDashboardProps {
  tasks: Task[];
  users: User[];
  collaboratorsList: User[];
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ tasks, users, collaboratorsList }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.DataLimite.startsWith(today));
  const completedTasks = tasks.filter(t => t.Status === TaskStatus.CONCLUIDO || t.Status === TaskStatus.CONFERIDO);
  const overdueTasks = tasks.filter(t => t.Status === TaskStatus.PENDENTE && new Date(t.DataLimite) < new Date());
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  const topCollaborators = [...collaboratorsList]
    .sort((a, b) => (b.PontosRealizadosMes || 0) - (a.PontosRealizadosMes || 0))
    .slice(0, 5);

  const chartData = React.useMemo(() => {
    const days = [];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      
      const count = tasks.filter(t => 
        t.DataConclusao?.startsWith(dateStr) && 
        (t.Status === TaskStatus.CONCLUIDO || t.Status === TaskStatus.CONFERIDO)
      ).length;
      
      days.push({ name: dayName, val: count });
    }
    return days;
  }, [tasks]);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-6">
      <div className={`h-16 w-16 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg`}>
        <Icon size={32} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-ciatos font-bold text-[#111111]">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Tarefas Hoje" value={todayTasks.length} icon={Activity} color="bg-blue-500" />
        <StatCard title="Concluídas Total" value={completedTasks.length} icon={CheckCircle} color="bg-green-600" />
        <StatCard title="Pendências Atrasadas" value={overdueTasks.length} icon={AlertTriangle} color="bg-red-600" />
        <StatCard title="Taxa de Conclusão" value={`${completionRate.toFixed(1)}%`} icon={TrendingUp} color="bg-[#8B1B1F]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-ciatos font-bold text-[#111111] uppercase mb-8">Produtividade da Operação (Últimos 7 dias)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip cursor={{fill: '#F3F3F3'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="val" fill="#8B1B1F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-ciatos font-bold text-[#111111] uppercase mb-8 flex items-center gap-2">
            <Users size={20} className="text-[#8B1B1F]" /> Top Performance
          </h3>
          <div className="space-y-6">
            {topCollaborators.map((u, i) => (
              <div key={u.Email} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[#8B1B1F] group-hover:bg-[#8B1B1F] group-hover:text-white transition-colors">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111111]">{u.Nome}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{u.Time}</p>
                  </div>
                </div>
                <span className="text-sm font-black text-[#8B1B1F]">{u.PontosRealizadosMes} pts</span>
              </div>
            ))}
            {topCollaborators.length === 0 && <p className="text-xs text-gray-300 italic text-center py-10">Nenhum dado de performance disponível para sua equipe.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
