
import React from 'react';
import { ScoreLedger, ScoreType, User } from '../types';
import { Trophy, Star, Calendar, ArrowUpCircle, ArrowDownCircle, TrendingUp, BarChart3, Activity } from 'lucide-react';

interface MyScoreViewProps {
  ledger: ScoreLedger[];
  user: User;
}

const MyScoreView: React.FC<MyScoreViewProps> = ({ ledger, user }) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  // Lógica de Datas para Filtros
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Cálculos dos Cards
  const totalScore = ledger.reduce((acc, curr) => acc + curr.Pontos, 0);
  
  const pointsToday = ledger
    .filter(entry => entry.Data.startsWith(todayStr))
    .reduce((acc, curr) => acc + curr.Pontos, 0);

  const pointsThisWeek = ledger
    .filter(entry => new Date(entry.Data) >= startOfWeek)
    .reduce((acc, curr) => acc + curr.Pontos, 0);

  const pointsThisMonth = user.PontosRealizadosMes || 0;

  // Lógica do Termômetro
  const realized = user.PontosRealizadosMes || 0;
  const possible = user.PontosPossiveisMes || 0;
  const performance = possible > 0 ? (realized / possible) * 100 : 0;
  
  const getPerformanceColor = (p: number) => {
    if (p > 80) return 'bg-green-500';
    if (p >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPerformanceTextColor = (p: number) => {
    if (p > 80) return 'text-green-600';
    if (p >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Últimos 10 lançamentos
  const recentLedger = [...ledger]
    .sort((a, b) => new Date(b.Data).getTime() - new Date(a.Data).getTime())
    .slice(0, 10);

  const StatCard = ({ title, value, icon: Icon, colorClass, isCurrency = false }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{title}</span>
        <div className={`p-2 rounded-xl bg-[#F3F3F3] ${colorClass.split(' ')[0].replace('text-', 'bg-').replace('600', '100')}`}>
          <Icon size={18} className={colorClass} />
        </div>
      </div>
      <div className="flex flex-col">
        <h3 className={`text-3xl font-black tracking-tighter ${colorClass}`}>
          {value >= 0 && title !== "PONTUAÇÃO TOTAL" ? `+${value}` : value}
        </h3>
        <p className="text-[9px] font-bold text-gray-300 uppercase mt-1">Pontos Acumulados</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header da View */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-ciatos font-bold text-[#6F0F14] uppercase tracking-tighter">Minha Pontuação</h2>
        <p className="text-sm text-gray-400 font-medium">Extrato de pontos ganhos e penalidades</p>
      </div>

      {/* Grid de Cards Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="PONTUAÇÃO TOTAL" 
          value={totalScore} 
          icon={Trophy} 
          colorClass="text-[#8B1B1F]" 
        />
        <StatCard 
          title="PONTOS HOJE" 
          value={pointsToday} 
          icon={Activity} 
          colorClass={pointsToday >= 0 ? 'text-green-600' : 'text-red-600'} 
        />
        <StatCard 
          title="PONTOS ESTA SEMANA" 
          value={pointsThisWeek} 
          icon={Calendar} 
          colorClass={pointsThisWeek >= 0 ? 'text-green-600' : 'text-red-600'} 
        />
        <StatCard 
          title="PONTOS ESTE MÊS" 
          value={pointsThisMonth} 
          icon={BarChart3} 
          colorClass={pointsThisMonth >= 0 ? 'text-green-600' : 'text-red-600'} 
        />
      </div>

      {/* Termômetro de Desempenho */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-[#8B1B1F]/5 rounded-2xl text-[#8B1B1F]">
                <TrendingUp size={24} />
             </div>
             <div>
                <h3 className="text-xl font-ciatos font-bold text-[#6F0F14] uppercase tracking-tighter">Desempenho do Mês</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aproveitamento de Pontos Disponíveis</p>
             </div>
          </div>
          <div className="text-right">
             <span className={`text-4xl font-black tracking-tighter ${getPerformanceTextColor(performance)}`}>
               {possible > 0 ? `${performance.toFixed(1)}%` : '---'}
             </span>
          </div>
        </div>

        {possible > 0 ? (
          <div className="space-y-4">
            <div className="h-6 w-full bg-[#F3F3F3] rounded-full overflow-hidden border border-gray-100 shadow-inner">
              <div 
                className={`h-full transition-all duration-1000 ease-out rounded-full shadow-lg ${getPerformanceColor(performance)}`}
                style={{ width: `${Math.min(performance, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
               <span>0%</span>
               <span>Meta: 80%+</span>
               <span>100%</span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-[#F3F3F3] rounded-3xl border-2 border-dashed border-gray-200">
             <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Sem tarefas atribuídas neste período</p>
          </div>
        )}
      </div>

      {/* Tabela de Extrato Recente */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
          <h3 className="text-xl font-ciatos font-bold text-[#6F0F14] uppercase tracking-tighter">Extrato Recente</h3>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Últimos 10 Lançamentos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data / Hora</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Tipo</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentLedger.length > 0 ? (
                recentLedger.map((entry) => (
                  <tr key={entry.ID} className={`hover:bg-gray-50/50 transition-colors ${entry.Tipo === ScoreType.GANHO ? 'bg-green-50/10' : 'bg-red-50/10'}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                        <Calendar size={14} className="text-gray-300" />
                        {new Date(entry.Data).toLocaleString('pt-BR', { 
                          day: '2-digit', month: '2-digit', year: '2-digit', 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-[#111111]">{entry.Descricao}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex justify-center">
                        {entry.Tipo === ScoreType.GANHO ? (
                          <span className="flex items-center gap-1 text-[9px] font-black text-green-600 bg-white px-3 py-1.5 rounded-full border border-green-100 uppercase tracking-widest shadow-sm">
                            <ArrowUpCircle size={12} /> Ganho
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-white px-3 py-1.5 rounded-full border border-red-100 uppercase tracking-widest shadow-sm">
                            <ArrowDownCircle size={12} /> Penalidade
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={`text-lg font-black ${entry.Tipo === ScoreType.GANHO ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.Tipo === ScoreType.GANHO ? '+' : ''}{entry.Pontos}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <Star size={48} className="mx-auto text-gray-100 mb-4" />
                    <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Nenhuma movimentação registrada</p>
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

export default MyScoreView;
