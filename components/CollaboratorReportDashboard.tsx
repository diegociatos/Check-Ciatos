
import React, { useMemo } from 'react';
import { Task, ScoreLedger, User, ReportFilter, TaskStatus, ScoreType } from '../types.ts';
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
  Target,
  XCircle,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
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

  // Fatias de Dados
  const relatorioTasks = useMemo(() => {
    return tasks.filter(t => {
      const taskDate = new Date(t.DataLimite);
      return t.Responsavel === filter.ColaboradorEmail && taskDate >= dataInicio && taskDate <= dataFim;
    });
  }, [tasks, filter]);

  const relatorioLedger = useMemo(() => {
    return ledger.filter(l => {
      const ledgerDate = new Date(l.Data);
      return l.UserEmail === filter.ColaboradorEmail && ledgerDate >= dataInicio && ledgerDate <= dataFim;
    });
  }, [ledger, filter]);

  // KPIs Granulares para Feedback
  const total = relatorioTasks.length;
  const aprovadas = relatorioTasks.filter(t => t.Status === TaskStatus.APROVADA).length;
  const erros = relatorioTasks.filter(t => t.Status === TaskStatus.FEITA_ERRADA).length;
  const faltas = relatorioTasks.filter(t => t.Status === TaskStatus.NAO_FEITA).length;
  const pendentes = relatorioTasks.filter(t => t.Status === TaskStatus.PENDENTE).length;

  const pontosPossiveis = relatorioTasks.reduce((sum, t) => sum + t.PontosValor, 0);
  const pontosGanhos = relatorioLedger.filter(l => l.Pontos > 0).reduce((sum, l) => sum + l.Pontos, 0);
  const pontosPerdidos = relatorioLedger.filter(l => l.Pontos < 0).reduce((sum, l) => sum + Math.abs(l.Pontos), 0);
  const pontuacaoLiquida = pontosGanhos - pontosPerdidos;

  const handleExportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return alert("Sem dados para exportar.");
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

  const chartData = [
    { name: 'Métricas de Entrega', Aprovadas: aprovadas, Erros: erros, Faltas: faltas, Pendentes: pendentes }
  ];

  const StatCard = ({ title, value, icon: Icon, colorClass, subText }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3 h-full hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md ${colorClass}`}>
          <Icon size={18} />
        </div>
        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{title}</span>
      </div>
      <div>
        <h3 className="text-2xl font-black text-[#111111] tracking-tighter">{value}</h3>
        {subText && <p className="text-[9px] text-gray-400 font-bold uppercase">{subText}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 font-ciatos">
      {/* Header com Navegação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-all border border-gray-100">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-[#111111] uppercase tracking-tighter">Relatório Consolidado</h2>
            <p className="text-sm text-gray-400 font-medium">Histórico Analítico de <strong>{colaborador?.Nome.toUpperCase()}</strong></p>
          </div>
        </div>
        <div className="flex bg-white p-4 rounded-3xl border border-gray-100 text-[#8B1B1F] items-center gap-4 shadow-sm">
          <Calendar size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {dataInicio.toLocaleDateString()} — {dataFim.toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Grid de KPIs de Feedback */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <StatCard title="SOLICITADAS" value={total} icon={BarChart3} colorClass="bg-blue-600" subText="Carga de Trabalho" />
        <StatCard title="APROVADAS" value={aprovadas} icon={Target} colorClass="bg-green-600" subText="Entrega de Valor" />
        <StatCard title="ERROS" value={erros} icon={AlertTriangle} colorClass="bg-yellow-500" subText="Impacto Qualidade" />
        <StatCard title="FALTAS" value={faltas} icon={XCircle} colorClass="bg-red-600" subText="Quebra de Acordo" />
        <div className={`p-6 rounded-3xl border shadow-lg flex flex-col justify-center gap-1 h-full text-white ${pontuacaoLiquida >= 0 ? 'bg-[#8B1B1F]' : 'bg-red-800'}`}>
           <p className="text-[9px] font-black uppercase tracking-widest opacity-70">LÍQUIDO DO PERÍODO</p>
           <h3 className="text-2xl font-black tracking-tighter">{pontuacaoLiquida} pts</h3>
           <p className="text-[8px] font-bold opacity-50 uppercase">De {pontosPossiveis} Possíveis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Distribuição de Performance */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-lg font-bold text-[#111111] uppercase tracking-tighter flex items-center gap-2">
              <FileBarChart size={20} className="text-[#8B1B1F]" /> Distribuição de Resultados
            </h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-600"></div><span className="text-[9px] font-black uppercase">Aprov.</span></div>
               <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-yellow-500"></div><span className="text-[9px] font-black uppercase">Erros</span></div>
               <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-red-600"></div><span className="text-[9px] font-black uppercase">Faltas</span></div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" hide />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="Aprovadas" fill="#16a34a" radius={[10, 10, 0, 0]} />
                <Bar dataKey="Erros" fill="#eab308" radius={[10, 10, 0, 0]} />
                <Bar dataKey="Faltas" fill="#dc2626" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resumo de Aproveitamento */}
        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-between">
           <div className="space-y-6">
              <h4 className="text-xl font-bold text-[#111111] uppercase tracking-tighter">Índice de Aproveitamento</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase">
                   <span>Pontos do Colaborador</span>
                   <span className="text-[#8B1B1F]">{((pontosGanhos / (pontosPossiveis || 1)) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                   <div className="h-full bg-[#8B1B1F] shadow-sm transition-all duration-1000" style={{ width: `${(pontosGanhos / (pontosPossiveis || 1)) * 100}%` }} />
                </div>
              </div>
              <div className="space-y-4 pt-6 border-t border-gray-50">
                 <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                    <Star size={18} className="text-yellow-500" />
                    <span>Mérito: +{pontosGanhos} pts</span>
                 </div>
                 <div className="flex items-center gap-3 text-sm font-bold text-gray-400">
                    <ArrowDownCircle size={18} className="text-red-400" />
                    <span>Penalidades: -{pontosPerdidos} pts</span>
                 </div>
              </div>
           </div>
           <button 
             onClick={() => window.print()}
             className="w-full mt-8 bg-gray-50 text-[#8B1B1F] py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-gray-100 hover:bg-white transition-all shadow-sm flex items-center justify-center gap-2"
           >
             <Download size={14} /> Imprimir Relatório de Feedback
           </button>
        </div>
      </div>

      {/* Tabelas de Detalhe Auditoria */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
          <h3 className="text-lg font-bold text-[#111111] uppercase tracking-tighter">Extrato Analítico para Feedback</h3>
          <button 
            onClick={() => handleExportCSV(relatorioLedger, `extrato_feedback_${colaborador?.Nome}`)}
            className="p-3 bg-white rounded-xl text-gray-400 hover:text-[#8B1B1F] transition-all border border-gray-100 shadow-sm"
          >
            <Download size={18} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-40">Data Evento</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição da Auditoria</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-32">Tipo Impacto</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right w-32">Pontuação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {relatorioLedger.length > 0 ? (
                relatorioLedger.sort((a,b) => new Date(b.Data).getTime() - new Date(a.Data).getTime()).map(l => (
                  <tr key={l.ID} className={`hover:bg-gray-50/30 transition-colors ${l.Pontos >= 0 ? 'bg-green-50/5' : 'bg-red-50/5'}`}>
                    <td className="px-8 py-5 text-[11px] font-bold text-gray-400">{new Date(l.Data).toLocaleDateString()}</td>
                    <td className="px-8 py-5">
                       <p className="text-sm font-bold text-[#111111] leading-tight">{l.Descricao}</p>
                       {l.Pontos < 0 && <p className="text-[9px] text-red-400 font-black uppercase mt-1">Conformidade Violada</p>}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex justify-center">
                        {l.Pontos >= 0 ? (
                          <span className="flex items-center gap-1 text-[8px] font-black text-green-600 bg-white px-2 py-1 rounded-full border border-green-100 uppercase tracking-widest shadow-sm">
                            <ArrowUpCircle size={10} /> Ganho
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[8px] font-black text-red-600 bg-white px-2 py-1 rounded-full border border-red-100 uppercase tracking-widest shadow-sm">
                            <ArrowDownCircle size={10} /> Perda
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-8 py-5 text-right font-black ${l.Pontos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {l.Pontos >= 0 ? '+' : ''}{l.Pontos}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={4} className="px-8 py-20 text-center text-gray-300 font-bold italic uppercase text-xs tracking-widest">Sem movimentação financeira no período selecionado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorReportDashboard;
