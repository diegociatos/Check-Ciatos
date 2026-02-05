
import React, { useState, useMemo } from 'react';
import { Task, ScoreLedger, User, TaskStatus, UserRole, ScoreType } from '../types.ts';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  Cell 
} from 'recharts';
import { 
  Trophy, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Calendar, 
  User as UserIcon,
  Search,
  Filter,
  BarChart3,
  ArrowUpCircle
} from 'lucide-react';

interface MonthlyPerformanceViewProps {
  tasks: Task[];
  ledger: ScoreLedger[];
  users: User[];
  currentUser: User;
  collaboratorsList: User[];
}

const MonthlyPerformanceView: React.FC<MonthlyPerformanceViewProps> = ({ tasks, ledger, users, currentUser, collaboratorsList }) => {
  const isManagerOrAdmin = currentUser.Role === UserRole.GESTOR || currentUser.Role === UserRole.ADMIN;
  
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filterEmail, setFilterEmail] = useState<string>(currentUser.Email);

  // Filtros de Segurança: Gestores só veem seus liderados ou a si mesmos
  const selectableUsers = useMemo(() => {
    if (currentUser.Role === UserRole.ADMIN) return users;
    if (currentUser.Role === UserRole.GESTOR) return [currentUser, ...collaboratorsList];
    return [currentUser];
  }, [users, currentUser, collaboratorsList]);

  // Garantir que o filtro inicial seja válido
  useMemo(() => {
     if (!selectableUsers.find(u => u.Email === filterEmail)) {
         setFilterEmail(currentUser.Email);
     }
  }, [selectableUsers]);

  const monthStr = useMemo(() => `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`, [selectedYear, selectedMonth]);

  // Cálculos de Métricas
  const metrics = useMemo(() => {
    const periodTasks = tasks.filter(t => t.Responsavel === filterEmail && t.DataLimite.startsWith(monthStr));
    const periodLedger = ledger.filter(l => l.UserEmail === filterEmail && l.Data.startsWith(monthStr));

    const possiveis = periodTasks.reduce((acc, t) => acc + t.PontosValor, 0);
    const conquistados = periodLedger.filter(l => l.Pontos > 0).reduce((acc, l) => acc + l.Pontos, 0);
    
    // Identificamos perdas pela descrição ou status da tarefa associada
    const perdidosErro = periodLedger.filter(l => l.Pontos < 0 && (l.Descricao.toLowerCase().includes('erro') || l.Descricao.toLowerCase().includes('feita errada')))
                          .reduce((acc, l) => acc + Math.abs(l.Pontos), 0);
    const perdidosFalta = periodLedger.filter(l => l.Pontos < 0 && (l.Descricao.toLowerCase().includes('falta') || l.Descricao.toLowerCase().includes('não feita')))
                           .reduce((acc, l) => acc + Math.abs(l.Pontos), 0);

    const taxa = possiveis > 0 ? (conquistados / possiveis) * 100 : 0;

    return { possiveis, conquistados, perdidosErro, perdidosFalta, taxa, tasks: periodTasks };
  }, [tasks, ledger, filterEmail, monthStr]);

  // Dados para o Gráfico de Evolução
  const evolutionData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const data = [];
    for (let i = 1; i <= daysInMonth; i++) {
        const dayStr = `${monthStr}-${String(i).padStart(2, '0')}`;
        const dailyPoints = ledger.filter(l => l.UserEmail === filterEmail && l.Data.startsWith(dayStr) && l.Pontos > 0)
                            .reduce((acc, l) => acc + l.Pontos, 0);
        data.push({ day: i, pontos: dailyPoints });
    }
    return data;
  }, [ledger, filterEmail, monthStr, selectedYear, selectedMonth]);

  // Ranking Mensal para Gestores
  const teamRanking = useMemo(() => {
    if (!isManagerOrAdmin) return [];
    
    return collaboratorsList.map(u => {
        const uTasks = tasks.filter(t => t.Responsavel === u.Email && t.DataLimite.startsWith(monthStr));
        const uLedger = ledger.filter(l => l.UserEmail === u.Email && l.Data.startsWith(monthStr));
        
        const poss = uTasks.reduce((acc, t) => acc + t.PontosValor, 0);
        const earned = uLedger.filter(l => l.Pontos > 0).reduce((acc, l) => acc + l.Pontos, 0);
        const taxa = poss > 0 ? (earned / poss) * 100 : 0;
        
        return { nome: u.Nome, email: u.Email, taxa, conquistados: earned };
    }).sort((a, b) => b.taxa - a.taxa);
  }, [collaboratorsList, tasks, ledger, monthStr, isManagerOrAdmin]);

  const StatCard = ({ title, value, subValue, icon: Icon, colorClass, borderClass }: any) => (
    <div className={`bg-white p-6 rounded-[32px] border ${borderClass || 'border-gray-100'} shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow font-ciatos`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</span>
        <div className={`p-2 rounded-xl bg-gray-50 ${colorClass}`}>
           <Icon size={18} />
        </div>
      </div>
      <div>
        <h4 className={`text-3xl font-black tracking-tighter ${colorClass.split(' ')[0]}`}>{value}</h4>
        <p className="text-[9px] font-bold text-gray-300 uppercase mt-1 tracking-wider">{subValue}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-ciatos pb-20">
      {/* Header com Filtros */}
      <div className="bg-[#8B1B1F] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <h3 className="text-3xl font-bold uppercase tracking-tight">Performance Mensal</h3>
            <p className="text-white/60 font-medium italic">Análise consolidada de produtividade e conformidade.</p>
          </div>
          
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Ano</label>
              <select 
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none appearance-none cursor-pointer"
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y} className="text-black">{y}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Mês</label>
              <select 
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none appearance-none cursor-pointer"
                value={selectedMonth}
                onChange={e => setSelectedMonth(parseInt(e.target.value))}
              >
                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m} className="text-black">{new Date(0, m-1).toLocaleString('pt-BR', {month: 'long'}).toUpperCase()}</option>
                ))}
              </select>
            </div>
            {isManagerOrAdmin && (
               <div className="space-y-1 min-w-[200px]">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Colaborador</label>
                  <select 
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none appearance-none cursor-pointer"
                    value={filterEmail}
                    onChange={e => setFilterEmail(e.target.value)}
                  >
                    {selectableUsers.map(u => <option key={u.Email} value={u.Email} className="text-black">{u.Nome}</option>)}
                  </select>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid de KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="PONTOS POSSÍVEIS" value={metrics.possiveis} subValue="Potencial Total" icon={BarChart3} colorClass="text-blue-600" />
        <StatCard title="CONQUISTADOS" value={metrics.conquistados} subValue="Mérito Validado" icon={Trophy} colorClass="text-green-600" />
        <StatCard title="PERDA POR ERRO" value={metrics.perdidosErro} subValue="Check Incorreto" icon={AlertTriangle} colorClass="text-yellow-600" />
        <StatCard title="PERDA POR FALTA" value={metrics.perdidosFalta} subValue="Não Cumprido" icon={XCircle} colorClass="text-red-600" />
        <div className={`p-6 rounded-[32px] border shadow-lg flex flex-col justify-between h-full text-white bg-[#8B1B1F]`}>
           <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">TAXA CUMPRIMENTO</span>
              <div className="p-2 rounded-xl bg-white/20">
                 <TrendingUp size={18} />
              </div>
           </div>
           <div>
              <h4 className="text-4xl font-black tracking-tighter">{metrics.taxa.toFixed(1)}%</h4>
              <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                 <div className="h-full bg-white transition-all duration-1000" style={{width: `${Math.min(metrics.taxa, 100)}%`}} />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Evolução */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
           <h4 className="text-lg font-bold text-[#111111] uppercase tracking-tighter mb-8 flex items-center gap-2">
              <TrendingUp size={20} className="text-[#8B1B1F]" /> Evolução Diária de Pontos
           </h4>
           <div className="flex-1 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <Tooltip cursor={{fill: '#F3F3F3'}} />
                    <Bar dataKey="pontos" fill="#8B1B1F" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Ranking ou Potencial Visual */}
        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
           {isManagerOrAdmin && teamRanking.length > 0 ? (
              <div className="space-y-6">
                 <h4 className="text-lg font-bold text-[#111111] uppercase tracking-tighter flex items-center gap-2">
                    <Trophy size={20} className="text-yellow-500" /> Ranking do Time
                 </h4>
                 <div className="space-y-4">
                    {teamRanking.slice(0, 5).map((u, i) => (
                       <div key={u.email} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                             <span className="text-xs font-black text-gray-300">{i + 1}º</span>
                             <div className="h-8 w-8 bg-gray-50 rounded-lg flex items-center justify-center text-[10px] font-black">
                                {u.nome.charAt(0)}
                             </div>
                             <span className="text-xs font-bold text-[#111111]">{u.nome.split(' ')[0]}</span>
                          </div>
                          <span className="text-xs font-black text-[#8B1B1F]">{u.taxa.toFixed(0)}%</span>
                       </div>
                    ))}
                 </div>
              </div>
           ) : (
              <div className="space-y-8 h-full flex flex-col justify-center">
                 <div className="text-center">
                    <div className="h-20 w-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100 shadow-inner">
                       <Target size={40} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Potencial Conquistado</h4>
                    <p className="text-4xl font-black text-[#8B1B1F] tracking-tighter mt-1">{metrics.taxa.toFixed(1)}%</p>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-gray-300 uppercase">
                       <span>Real: {metrics.conquistados}</span>
                       <span>Teto: {metrics.possiveis}</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-[#8B1B1F] shadow-sm transition-all duration-1000" style={{width: `${Math.min(metrics.taxa, 100)}%`}} />
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>

      {/* Tabela Detalhada */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
           <h4 className="text-lg font-bold text-[#111111] uppercase tracking-tighter">Extrato Mensal de Obrigações</h4>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Obrigação</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Prazo</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Pts Valor</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Dedução</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {metrics.tasks.length > 0 ? (
                    metrics.tasks.sort((a,b) => a.DataLimite.localeCompare(b.DataLimite)).map(t => {
                       const deduction = ledger.find(l => l.UserEmail === filterEmail && l.Data.startsWith(monthStr) && l.Descricao.includes(t.Titulo) && l.Pontos < 0);
                       return (
                          <tr key={t.ID} className="hover:bg-gray-50/30 transition-colors">
                             <td className="px-8 py-6">
                                <p className="text-sm font-bold text-[#111111]">{t.Titulo}</p>
                                <p className="text-[10px] text-gray-400 font-medium italic truncate max-w-xs">{t.Descricao}</p>
                             </td>
                             <td className="px-8 py-6 text-center text-[11px] font-bold text-gray-600">
                                {t.DataLimite.split('-').reverse().join('/')}
                             </td>
                             <td className="px-8 py-6 text-center">
                                <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                   t.Status === TaskStatus.APROVADA ? 'bg-green-50 text-green-700 border-green-100' :
                                   t.Status === TaskStatus.FEITA_ERRADA ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                   t.Status === TaskStatus.NAO_FEITA ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-100 text-gray-400 border-gray-200'
                                }`}>
                                   {t.Status}
                                </span>
                             </td>
                             <td className="px-8 py-6 text-right font-black text-[#111111] text-sm">
                                {t.PontosValor}
                             </td>
                             <td className={`px-8 py-6 text-right font-black text-sm ${deduction ? 'text-red-600' : 'text-gray-300'}`}>
                                {deduction ? `${deduction.Pontos}` : '--'}
                             </td>
                          </tr>
                       );
                    })
                 ) : (
                    <tr>
                       <td colSpan={5} className="py-20 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest">Nenhuma obrigação registrada para este mês.</td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyPerformanceView;
