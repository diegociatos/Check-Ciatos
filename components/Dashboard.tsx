
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Task, TaskStatus, ScoreLedger, ScoreType, UserRole, User } from '../types';
// Fixed: Added Star to imports from lucide-react to fix compilation error on line 142
import { Trophy, Clock, CheckCircle2, ChevronRight, Users, Target, Activity, Star } from 'lucide-react';

interface DashboardProps {
  score: number;
  pendingTasksToday: Task[];
  recentLedger: ScoreLedger[];
  onNavigateToTasks: () => void;
  tasks: Task[];
  currentUserRole: UserRole;
  collaborators: User[];
}

const Dashboard: React.FC<DashboardProps> = ({ score, pendingTasksToday, recentLedger, onNavigateToTasks, tasks, currentUserRole, collaborators }) => {
  const isManagerOrAdmin = currentUserRole === UserRole.GESTOR || currentUserRole === UserRole.ADMIN;
  const todayStr = new Date().toISOString().split('T')[0];

  // Estatísticas de Equipe (Show_If Gestor/Admin)
  const teamPendingToday = tasks.filter(t => t.DataLimite.startsWith(todayStr) && t.Status === TaskStatus.PENDENTE).length;
  const teamCompletedToday = tasks.filter(t => t.DataConclusao?.startsWith(todayStr)).length;
  const teamTotalToday = tasks.filter(t => t.DataLimite.startsWith(todayStr)).length;
  const teamCompletionRate = teamTotalToday > 0 ? (teamCompletedToday / teamTotalToday) * 100 : 0;
  
  const top3Performers = [...collaborators]
    .sort((a, b) => (b.PontosRealizadosMes || 0) - (a.PontosRealizadosMes || 0))
    .slice(0, 3);

  const chartData = React.useMemo(() => {
    const days = [];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      
      // Fix: Mapped CONCLUIDO/CONFERIDO to APROVADA as per types.ts
      const count = tasks.filter(t => 
        t.DataConclusao?.startsWith(dateStr) && 
        (t.Status === TaskStatus.APROVADA)
      ).length;
      
      days.push({ name: dayName, tasks: count, fullDate: dateStr });
    }
    return days;
  }, [tasks]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Stats - Adaptativo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentUserRole === UserRole.COLABORADOR ? (
          <>
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-yellow-100 text-yellow-600 flex items-center justify-center">
                <Trophy size={30} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Meus Pontos</p>
                <h3 className="text-2xl font-bold text-[#111111]">{score} pts</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Clock size={30} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendentes Hoje</p>
                <h3 className="text-2xl font-bold text-[#111111]">{pendingTasksToday.length}</h3>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-[#8B1B1F] p-6 rounded-[32px] text-white shadow-xl flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/20 text-white flex items-center justify-center">
                <Users size={30} />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Equipe</p>
                <h3 className="text-2xl font-bold">{collaborators.length} Membros</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Activity size={30} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendência Equipe</p>
                <h3 className="text-2xl font-bold text-[#111111]">{teamPendingToday} Hoje</h3>
              </div>
            </div>
          </>
        )}
        
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center">
            <Target size={30} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isManagerOrAdmin ? 'Sucesso Equipe' : 'Minha Taxa'}</p>
            <h3 className="text-2xl font-bold text-[#111111]">{teamCompletionRate.toFixed(0)}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-ciatos font-bold text-[#111111] uppercase">Produtividade {isManagerOrAdmin ? 'da Equipe' : 'Pessoal'}</h3>
            <span className="text-[10px] font-black px-3 py-1 bg-gray-100 rounded-full text-gray-400 uppercase tracking-widest">7 Dias</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11, fontWeight: 'bold'}} />
                <Tooltip 
                  cursor={{fill: '#F3F3F3'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="tasks" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fullDate === todayStr ? '#8B1B1F' : '#E5E7EB'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          {isManagerOrAdmin && (
             <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <h3 className="font-ciatos font-bold text-[#111111] uppercase mb-6 flex items-center gap-2">
                   <Star size={18} className="text-yellow-500" fill="currentColor" /> Top 3 Equipe
                </h3>
                <div className="space-y-4">
                   {top3Performers.map((p, i) => (
                      <div key={p.Email} className="flex items-center justify-between group">
                         <div className="flex items-center gap-3">
                            <span className={`text-xs font-black ${i === 0 ? 'text-yellow-500' : 'text-gray-300'}`}>{i + 1}º</span>
                            <span className="text-sm font-bold text-gray-700">{p.Nome}</span>
                         </div>
                         <span className="text-sm font-black text-[#8B1B1F]">{p.PontosRealizadosMes} pts</span>
                      </div>
                   ))}
                   {top3Performers.length === 0 && <p className="text-xs text-gray-300 italic">Sem dados de pontuação.</p>}
                </div>
             </div>
          )}

          <div className="bg-[#8B1B1F] p-8 rounded-[40px] text-white shadow-2xl group relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-3 uppercase tracking-tighter">Ações Corporativas</h3>
              <p className="text-white/60 mb-6 text-sm font-medium">No Grupo Ciatos, a excelência operacional é garantida pela auditoria rigorosa de cada obrigação.</p>
              <button 
                onClick={onNavigateToTasks}
                className="w-full bg-white text-[#8B1B1F] py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-gray-100 transition-all shadow-lg active:scale-95"
              >
                {isManagerOrAdmin ? 'Gerenciar Minha Equipe' : 'Ver Minhas Obrigações Hoje'}
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
