
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Task, TaskStatus, ScoreLedger, ScoreType } from '../types';
import { Trophy, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

interface DashboardProps {
  score: number;
  pendingTasksToday: Task[];
  recentLedger: ScoreLedger[];
  onNavigateToTasks: () => void;
  tasks: Task[];
}

const Dashboard: React.FC<DashboardProps> = ({ score, pendingTasksToday, recentLedger, onNavigateToTasks, tasks }) => {
  // Cálculo dinâmico da produtividade dos últimos 7 dias
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
      
      days.push({ name: dayName, tasks: count, fullDate: dateStr });
    }
    return days;
  }, [tasks]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
            <Trophy size={30} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Pontuação Total</p>
            <h3 className="text-3xl font-bold text-[#111111]">{score} pts</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <Clock size={30} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Pendentes Hoje</p>
            <h3 className="text-3xl font-bold text-[#111111]">{pendingTasksToday.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <CheckCircle2 size={30} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Última Conclusão</p>
            <h3 className="text-lg font-bold text-[#111111]">
              {tasks.filter(t => t.Status === TaskStatus.CONCLUIDO).length > 0 ? 'Registrada Hoje' : 'Sem registros'}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800 text-lg">Produtividade da Semana</h3>
            <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded-md text-gray-500">7 dias (Seg-Dom)</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fullDate === todayStr ? '#8B1B1F' : '#d1d5db'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Recent */}
        <div className="space-y-6">
          <div className="bg-[#8B1B1F] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Operação 24/7 Ativa</h3>
              <p className="text-white/80 mb-6 text-sm">Você tem {pendingTasksToday.length} tarefas para hoje. No Grupo Ciatos, cada entrega conta, independente do dia!</p>
              <button 
                onClick={onNavigateToTasks}
                className="bg-white text-[#8B1B1F] px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-sm"
              >
                Ver Minhas Tarefas de Hoje
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Extrato Recente</h3>
            <div className="space-y-4">
              {recentLedger.length > 0 ? (
                recentLedger.slice(0, 3).map((entry) => (
                  <div key={entry.ID} className="flex items-center justify-between py-2 border-b last:border-0 border-gray-50">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-800">{entry.Descricao}</span>
                      <span className="text-xs text-gray-400">{new Date(entry.Data).toLocaleDateString()}</span>
                    </div>
                    <span className={`font-bold ${entry.Tipo === ScoreType.GANHO ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.Tipo === ScoreType.GANHO ? '+' : '-'}{entry.Pontos}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Nenhuma movimentação recente.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
