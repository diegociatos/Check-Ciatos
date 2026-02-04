
import React, { useMemo } from 'react';
import { Task, ScoreLedger, User, ReportFilter, TaskStatus, ScoreType } from '../types';
import { 
  Trophy, 
  Clock, 
  AlertTriangle, 
  Star, 
  Download, 
  Calendar, 
  ChevronLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  FileBarChart,
  Target
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface CollaboratorReportDashboardProps {
  filter: ReportFilter;
  tasks: Task[];
  ledger: ScoreLedger[];
  users: User[];
  onBack: () => void;
}

const CollaboratorReportDashboard: React.FC<CollaboratorReportDashboardProps> = ({ filter, tasks, ledger, users, onBack }) => {
  const colaborador = users.find(u => u.Email === filter.ColaboradorEmail);
  const dataInicio = new Date(filter.DataInicio);
  const dataFim = new Date(filter.DataFim);

  // Fatias de Dados (Slices)
  const relatorioTasks = useMemo(() => {
    return tasks.filter(t => {
      const taskDate = new Date(t.DataConclusao || t.DataLimite);
      return t.Responsavel === filter.ColaboradorEmail && taskDate >= dataInicio && taskDate <= dataFim;
    });
  }, [tasks, filter]);

  const relatorioLedger = useMemo(() => {
    return ledger.filter(l => {
      const ledgerDate = new Date(l.Data);
      return l.UserEmail === filter.ColaboradorEmail && ledgerDate >= dataInicio && ledgerDate <= dataFim;
    });
  }, [ledger, filter]);

  // KPIs
  // Fix: Mapped CONCLUIDO/CONFERIDO to APROVADA
  const concluidas = relatorioTasks.filter(t => t.Status === TaskStatus.APROVADA).length;
  const atrasadas = relatorioTasks.filter(t => t.Status === TaskStatus.ATRASADA || (t.Status === TaskStatus.PENDENTE && new Date(t.DataLimite) < new Date())).length;
  const pendentes = relatorioTasks.filter(t => t.Status === TaskStatus.PENDENTE).length;

  const pontosGanhos = relatorioLedger.filter(l => l.Pontos > 0).reduce((sum, l) => sum + l.Pontos, 0);
  const pontosPerdidos = relatorioLedger.filter(l => l.Pontos < 0).reduce((sum, l) => sum + Math.abs(l.Pontos), 0);
  const pontuacaoLiquida = pontosGanhos - pontosPerdidos;

  const handleExportCSV = (data: any[], filename: string) => {
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
  };

  const chartData = useMemo(() => {
    const map = new Map();
    // Fix: Mapped CONCLUIDO/CONFERIDO to APROVADA
    relatorioTasks.filter(t => t.Status === TaskStatus.APROVADA).forEach(t => {
      const day = new Date(t.DataConclusao!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      map.set(day, (map.get(day) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).slice(-10);
  }, [relatorioTasks]);

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 h-full">
      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-xl font-bold text-[#111111]">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Header com Navegação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-all border border-gray-100">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-ciatos font-bold text-[#111111] uppercase tracking-tighter">Relatório do Colaborador</h2>
            <p className="text-sm text-gray-400 font-medium">Extração de performance de <strong>{colaborador?.Nome}</strong></p>
          </div>
        </div>
        <div className="flex bg-[#F3F3F3] p-4 rounded-3xl border border-gray-200 text-[#8B1B1F] items-center gap-3">
          <Calendar size={18} />
          <span className="text-xs font-black uppercase tracking-widest">
            {dataInicio.toLocaleDateString()} a {dataFim.toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="ENTREGUES" value={concluidas} icon={Target} colorClass="bg-green-600" />
        <StatCard title="PENDENTES" value={pendentes} icon={Clock} colorClass="bg-blue-600" />
        <StatCard title="ATRASADAS" value={atrasadas} icon={AlertTriangle} colorClass="bg-red-600" />
        <StatCard title="PONTOS GANHOS" value={`+${pontosGanhos}`} icon={Star} colorClass="bg-yellow-500" />
        <StatCard title="PONTOS PERDIDOS" value={`-${pontosPerdidos}`} icon={ArrowDownCircle} colorClass="bg-red-800" />
        <div className={`p-6 rounded-3xl border shadow-lg flex items-center gap-4 h-full text-white ${pontuacaoLiquida >= 0 ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'}`}>
          <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">LÍQUIDO PERÍODO</p>
            <h3 className="text-xl font-bold">{pontuacaoLiquida} pts</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Tendência */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-ciatos font-bold text-[#111111] uppercase tracking-tighter mb-8 flex items-center gap-2">
            <FileBarChart size={20} className="text-[#8B1B1F]" /> Conclusões por Dia (Amostra)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                <Tooltip cursor={{fill: '#F3F3F3'}} />
                <Bar dataKey="value" fill="#8B1B1F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Info Colaborador */}
        <div className="bg-[#8B1B1F] p-8 rounded-[40px] text-white shadow-xl flex flex-col justify-between">
           <div>
              <div className="h-20 w-20 bg-white rounded-3xl mb-6 flex items-center justify-center text-[#8B1B1F] text-3xl font-black shadow-inner">
                 {colaborador?.Nome.charAt(0)}
              </div>
              <h4 className="text-2xl font-bold tracking-tighter">{colaborador?.Nome}</h4>
              <p className="text-white/60 font-medium">{colaborador?.Time}</p>
           </div>
           <div className="pt-8 border-t border-white/10 space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                 <span>Eficiência</span>
                 <span>{colaborador?.EficienciaMes?.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-white" style={{ width: `${colaborador?.EficienciaMes}%` }} />
              </div>
           </div>
        </div>
      </div>

      {/* Tabelas de Detalhe */}
      <div className="space-y-8">
        {/* Tabela de Tarefas */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="text-lg font-ciatos font-bold text-[#111111] uppercase tracking-tighter">Entregas no Período</h3>
            <button 
              onClick={() => handleExportCSV(relatorioTasks, `tarefas_${colaborador?.Nome}`)}
              className="p-2 text-gray-400 hover:text-[#8B1B1F] transition-all"
            >
              <Download size={20} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarefa</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Prazo</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {relatorioTasks.map(t => (
                  <tr key={t.ID} className="hover:bg-gray-50/30">
                    <td className="px-8 py-5 text-sm font-bold text-[#111111]">{t.Titulo}</td>
                    <td className="px-8 py-5 text-center text-xs text-gray-500">{new Date(t.DataLimite).toLocaleDateString()}</td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                        t.Status === TaskStatus.APROVADA ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {t.Status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-[#8B1B1F]">{t.PontosValor} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Extrato de Pontos */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="text-lg font-ciatos font-bold text-[#111111] uppercase tracking-tighter">Extrato Analítico de Pontos</h3>
            <button 
              onClick={() => handleExportCSV(relatorioLedger, `extrato_${colaborador?.Nome}`)}
              className="p-2 text-gray-400 hover:text-[#8B1B1F] transition-all"
            >
              <Download size={20} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Tipo</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {relatorioLedger.map(l => (
                  <tr key={l.ID} className={`hover:bg-gray-50/30 ${l.Pontos >= 0 ? 'bg-green-50/10' : 'bg-red-50/10'}`}>
                    <td className="px-8 py-5 text-xs text-gray-500">{new Date(l.Data).toLocaleDateString()}</td>
                    <td className="px-8 py-5 text-sm font-bold text-[#111111]">{l.Descricao}</td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex justify-center">
                        {l.Pontos >= 0 ? <ArrowUpCircle size={18} className="text-green-600" /> : <ArrowDownCircle size={18} className="text-red-600" />}
                      </div>
                    </td>
                    <td className={`px-8 py-5 text-right font-black ${l.Pontos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {l.Pontos >= 0 ? '+' : ''}{l.Pontos} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorReportDashboard;
