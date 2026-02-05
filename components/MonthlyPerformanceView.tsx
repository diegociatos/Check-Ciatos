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
  Cell,
  ComposedChart,
  Area
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
  ArrowUpCircle,
  FileText,
  Activity,
  History,
  TrendingDown,
  ArrowRight,
  // Fix: Added FileBarChart to lucide-react imports
  FileBarChart
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

  // Segurança: Seleção de usuário baseada na role
  const selectableUsers = useMemo(() => {
    if (currentUser.Role === UserRole.ADMIN) return users;
    if (currentUser.Role === UserRole.GESTOR) return [currentUser, ...collaboratorsList];
    return [currentUser];
  }, [users, currentUser, collaboratorsList]);

  // Filtro de Mês Selecionado (YYYY-MM)
  const monthStr = useMemo(() => `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`, [selectedYear, selectedMonth]);

  // 1. FATIA DE DADOS: Métricas do Mês Selecionado (Expressão de Cálculo)
  const metrics = useMemo(() => {
    const periodTasks = tasks.filter(t => t.Responsavel === filterEmail && t.DataLimite.startsWith(monthStr));
    const periodLedger = ledger.filter(l => l.UserEmail === filterEmail && l.Data.startsWith(monthStr));

    const totalObrigacoes = periodTasks.length;
    const aprovadas = periodTasks.filter(t => t.Status === TaskStatus.APROVADA).length;
    const feitasErradas = periodTasks.filter(t => t.Status === TaskStatus.FEITA_ERRADA).length;
    const naoFeitas = periodTasks.filter(t => t.Status === TaskStatus.NAO_FEITA).length;

    const pontuacaoMaxima = periodTasks.reduce((acc, t) => acc + t.PontosValor, 0);
    const conquistados = periodLedger.filter(l => l.Pontos > 0).reduce((acc, l) => acc + l.Pontos, 0);
    const perdidos = periodLedger.filter(l => l.Pontos < 0).reduce((acc, l) => acc + Math.abs(l.Pontos), 0);
    
    // Potencial Restante = Máximo - Conquistados - Perdidos (Conforme solicitado)
    const potencialRestante = Math.max(0, pontuacaoMaxima - conquistados - perdidos);

    return { 
      totalObrigacoes, aprovadas, feitasErradas, naoFeitas,
      pontuacaoMaxima, conquistados, perdidos, potencialRestante,
      tasks: periodTasks 
    };
  }, [tasks, ledger, filterEmail, monthStr]);

  // 2. EVOLUÇÃO MÊS A MÊS: Histórico dos últimos 12 meses
  const historyData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const mLabel = d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
      const periodKey = `${y}-${String(m).padStart(2, '0')}`;
      
      const periodTasks = tasks.filter(t => t.Responsavel === filterEmail && t.DataLimite.startsWith(periodKey));
      const periodLedger = ledger.filter(l => l.UserEmail === filterEmail && l.Data.startsWith(periodKey));
      
      const totalObr = periodTasks.length;
      const earned = periodLedger.filter(l => l.Pontos > 0).reduce((acc, l) => acc + l.Pontos, 0);
      const lost = periodLedger.filter(l => l.Pontos < 0).reduce((acc, l) => acc + Math.abs(l.Pontos), 0);
      
      data.push({
        month: `${mLabel}/${String(y).slice(2)}`,
        conquistados: earned,
        perdidos: lost,
        obrigacoes: totalObr
      });
    }
    return data;
  }, [tasks, ledger, filterEmail]);

  const StatCard = ({ title, value, subValue, icon: Icon, colorClass, borderClass, isHighImportance }: any) => (
    <div className={`bg-white p-6 rounded-[32px] border ${borderClass || 'border-gray-100'} shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow font-ciatos`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{title}</span>
        <div className={`p-2 rounded-xl ${colorClass.replace('text-', 'bg-').replace('600', '50').replace('700', '50')}`}>
           <Icon size={16} className={colorClass} />
        </div>
      </div>
      <div>
        <h4 className={`text-2xl font-black tracking-tighter ${isHighImportance ? 'text-[2.5rem] leading-none mb-1' : ''} ${colorClass}`}>
          {value}
        </h4>
        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">{subValue}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-ciatos pb-20">
      {/* Header com Filtros e Identidade */}
      <div className="bg-[#8B1B1F] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <h3 className="text-3xl font-bold uppercase tracking-tight font-ciatos">Análise de Performance</h3>
            <p className="text-white/60 font-medium italic">Evolução de produtividade do colaborador.</p>
          </div>
          
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Ano</label>
              <select 
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none cursor-pointer"
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y} className="text-black">{y}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Mês</label>
              <select 
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none cursor-pointer"
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
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none cursor-pointer"
                    value={filterEmail}
                    onChange={e => setFilterEmail(e.target.value)}
                  >
                    {selectableUsers.map(u => <option key={u.Email} value={u.Email} className="text-black">{u.Nome}</option>)}
                  </select>
               </div>
            )}
          </div>
        </div>
        <FileBarChart size={120} className="absolute -right-8 -bottom-8 opacity-10" />
      </div>

      {/* Grid de KPIs Principais (Mensal) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total de Obrigações" value={metrics.totalObrigacoes} subValue="Atribuídas no Mês" icon={Activity} colorClass="text-blue-600" />
        <StatCard title="Aprovadas" value={metrics.aprovadas} subValue="Em conformidade" icon={CheckCircle2} colorClass="text-green-600" />
        <StatCard title="Com Erros" value={metrics.feitasErradas} subValue="Reprovadas na Auditoria" icon={AlertTriangle} colorClass="text-yellow-600" />
        <StatCard title="Não Feitas" value={metrics.naoFeitas} subValue="Ausência de Entrega" icon={XCircle} colorClass="text-red-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Pontuação Máxima" value={metrics.pontuacaoMaxima} subValue="Potencial Teórico" icon={Target} colorClass="text-gray-400" />
        <StatCard title="Pontos Conquistados" value={metrics.conquistados} subValue="Mérito Validado" icon={Trophy} colorClass="text-green-700" isHighImportance={true} />
        <StatCard title="Pontos Perdidos" value={metrics.perdidos} subValue="Deduções por Falhas" icon={TrendingDown} colorClass="text-red-700" isHighImportance={true} />
        <div className="bg-[#8B1B1F] p-6 rounded-[32px] text-white shadow-xl flex flex-col justify-between font-ciatos">
           <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Potencial Restante</span>
              <div className="p-2 rounded-xl bg-white/20">
                 <ArrowUpCircle size={16} />
              </div>
           </div>
           <div>
              <h4 className="text-[2.5rem] font-black tracking-tighter leading-none mb-1">{metrics.potencialRestante}</h4>
              <p className="text-[9px] font-bold opacity-60 uppercase tracking-wider">A buscar no mês</p>
           </div>
        </div>
      </div>

      {/* Gráfico Comparativo Mês a Mês */}
      <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-xl font-bold text-[#111111] uppercase tracking-tighter flex items-center gap-2">
              <History size={20} className="text-[#8B1B1F]" /> Evolução de Tendência (12 Meses)
            </h4>
            <p className="text-xs text-gray-400 font-medium italic">Histórico consolidado de aproveitamento de pontos e conformidade.</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-600"></div><span className="text-[9px] font-black uppercase tracking-widest">Conquistados</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-red-600"></div><span className="text-[9px] font-black uppercase tracking-widest">Perdidos</span></div>
          </div>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#F3F3F3' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
              <Area type="monotone" dataKey="conquistados" fill="#8B1B1F" stroke="#8B1B1F" fillOpacity={0.05} />
              <Bar dataKey="perdidos" barSize={12} fill="#dc2626" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="conquistados" stroke="#8B1B1F" strokeWidth={3} dot={{ r: 4, fill: '#8B1B1F' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela Detalhada do Mês */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
           <h4 className="text-lg font-bold text-[#111111] uppercase tracking-tighter">Obrigações Detalhadas - {new Date(0, selectedMonth - 1).toLocaleString('pt-BR', { month: 'long' }).toUpperCase()}</h4>
           <Calendar size={20} className="text-[#8B1B1F]" />
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Obrigação</th>
                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Data Limite</th>
                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Valor</th>
                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Penalidades</th>
                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Observações Gestor</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {metrics.tasks.length > 0 ? (
                    metrics.tasks.sort((a,b) => a.DataLimite.localeCompare(b.DataLimite)).map(t => {
                       const penalty = ledger.find(l => l.UserEmail === filterEmail && l.Data.startsWith(monthStr) && l.Descricao.includes(t.Titulo) && l.Pontos < 0);
                       return (
                          <tr key={t.ID} className="hover:bg-gray-50/30 transition-colors">
                             <td className="px-8 py-6">
                                <p className="text-sm font-bold text-[#111111]">{t.Titulo}</p>
                                <p className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]">{t.Descricao}</p>
                             </td>
                             <td className="px-8 py-6 text-center text-xs font-bold text-gray-600">
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
                             <td className={`px-8 py-6 text-right font-black text-sm ${penalty ? 'text-red-600' : 'text-gray-200'}`}>
                                {penalty ? `${penalty.Pontos}` : '0'}
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-2 text-gray-400 italic text-[11px] font-medium">
                                   {t.JustificativaGestor ? (
                                      <>
                                         <Activity size={12} className="text-[#8B1B1F]" />
                                         <span className="truncate max-w-[150px]">{t.JustificativaGestor}</span>
                                      </>
                                   ) : '--'}
                                </div>
                             </td>
                          </tr>
                       );
                    })
                 ) : (
                    <tr>
                       <td colSpan={6} className="py-20 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest italic">Nenhuma obrigação registrada para este período.</td>
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