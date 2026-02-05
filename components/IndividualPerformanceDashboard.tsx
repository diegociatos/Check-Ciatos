
import React, { useState, useMemo } from 'react';
import { User, Task, ScoreLedger, TaskStatus, ScoreType } from '../types.ts';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend } from 'recharts';
import { getTodayStr } from '../store.ts';
// Added CheckCircle2 to imports from lucide-react
import { User as UserIcon, ShieldCheck, Trophy, Target, TrendingUp, Search, Star, AlertTriangle, XCircle, Info, ArrowDownCircle, CheckCircle2, CalendarClock, Clock } from 'lucide-react';

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
  const userLedger = useMemo(() => ledger.filter(l => l.UserEmail === selectedEmail), [ledger, selectedEmail]);
  
  const today = getTodayStr();

  const metrics = useMemo(() => {
    const total = userTasks.length;
    const aprovadas = userTasks.filter(t => t.Status === TaskStatus.APROVADA).length;
    const erros = userTasks.filter(t => t.Status === TaskStatus.FEITA_ERRADA).length;
    const faltas = userTasks.filter(t => t.Status === TaskStatus.NAO_FEITA).length;
    const pendentes = userTasks.filter(t => t.Status === TaskStatus.PENDENTE).length;

    const pontosPossiveis = userTasks.reduce((acc, t) => acc + t.PontosValor, 0);
    const pontosAlcancados = userLedger.reduce((acc, l) => acc + l.Pontos, 0);
    const pontosPerdidosErro = userLedger.filter(l => l.Tipo === ScoreType.PENALIDADE && l.Descricao.includes('FEITA_ERRADA')).reduce((acc, l) => acc + Math.abs(l.Pontos), 0);
    const pontosPerdidosFalta = userLedger.filter(l => l.Tipo === ScoreType.PENALIDADE && l.Descricao.includes('NAO_FEITA')).reduce((acc, l) => acc + Math.abs(l.Pontos), 0);

    return { total, aprovadas, erros, faltas, pendentes, pontosPossiveis, pontosAlcancados, pontosPerdidosErro, pontosPerdidosFalta };
  }, [userTasks, userLedger]);

  const ranking = useMemo(() => {
    const list = collaboratorsList
      .map(u => ({ email: u.Email, score: u.PontosRealizadosMes || 0 }))
      .sort((a, b) => b.score - a.score);
    const pos = list.findIndex(l => l.email === selectedEmail);
    return pos !== -1 ? pos + 1 : '--';
  }, [collaboratorsList, selectedEmail]);

  const futureTasks = useMemo(() => {
    return userTasks
      .filter(t => t.DataLimite_Date! > today && t.Status !== TaskStatus.APROVADA)
      .sort((a, b) => a.DataLimite_Date!.localeCompare(b.DataLimite_Date!));
  }, [userTasks, today]);

  const barData = [
    { name: 'Pontuação', Real: metrics.pontosAlcancados, Máximo: metrics.pontosPossiveis }
  ];

  const StatCard = ({ title, value, subValue, icon: Icon, colorClass, borderClass }: any) => (
    <div className={`bg-white p-6 rounded-[32px] border ${borderClass || 'border-gray-100'} shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{title}</span>
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
      {/* Header Seletor */}
      <div className="bg-[#8B1B1F] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <h3 className="text-3xl font-bold uppercase tracking-tight">Painel Individual de Feedback</h3>
            <p className="text-white/60 font-medium max-w-md italic">Análise cirúrgica de conformidade e aproveitamento de pontos.</p>
          </div>
          <div className="min-w-[300px] space-y-2">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-2">
              <Search size={12} /> Colaborador sob sua Gestão
            </label>
            <select 
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-sm font-bold outline-none text-white appearance-none cursor-pointer"
              value={selectedEmail}
              onChange={e => setSelectedEmail(e.target.value)}
            >
              {collaboratorsList.map(u => (
                <option key={u.Email} value={u.Email} className="text-black">{u.Nome.toUpperCase()} ({u.Time})</option>
              ))}
              {collaboratorsList.length === 0 && <option value="" className="text-black">Nenhum colaborador associado</option>}
            </select>
          </div>
        </div>
      </div>

      {selectedUser ? (
        <>
          {/* Métricas de Contagem */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard title="SOLICITAÇÕES" value={metrics.total} subValue="Tarefas no Período" icon={TrendingUp} colorClass="text-blue-600" />
            <StatCard title="APROVADAS" value={metrics.aprovadas} subValue="Sucesso Absoluto" icon={CheckCircle2} colorClass="text-green-600" />
            <StatCard title="ERROS TÉCNICOS" value={metrics.erros} subValue="Check Incorreto" icon={AlertTriangle} colorClass="text-yellow-500" />
            <StatCard title="FALTAS GRAVES" value={metrics.faltas} subValue="Não Realizado" icon={XCircle} colorClass="text-red-600" borderClass="border-red-100" />
            <StatCard title="RANKING" value={`${ranking}º`} subValue="Posição na Equipe" icon={Trophy} colorClass="text-amber-500" />
          </div>

          {/* Análise de Pontuação */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-[#111111] uppercase tracking-tighter">Comparativo de Pontuação Real</h4>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Eficiência de Ganho</p>
                  <p className="text-2xl font-black text-[#8B1B1F]">{((metrics.pontosAlcancados / (metrics.pontosPossiveis || 1)) * 100).toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={barData} margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" hide />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }} />
                    <Bar dataKey="Máximo" fill="#E5E7EB" radius={[0, 10, 10, 0]} barSize={40} />
                    <Bar dataKey="Real" fill="#8B1B1F" radius={[0, 10, 10, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-50">
                <div className="bg-green-50/50 p-6 rounded-3xl border border-green-100">
                  <p className="text-[10px] font-black text-green-700 uppercase mb-1">Pontos Alcançados</p>
                  <p className="text-2xl font-black text-green-700">{metrics.pontosAlcancados}</p>
                </div>
                <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100">
                  <p className="text-[10px] font-black text-red-700 uppercase mb-1">Potencial não Atingido</p>
                  <p className="text-2xl font-black text-red-700">{metrics.pontosPossiveis - metrics.pontosAlcancados}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <h4 className="text-lg font-bold text-[#111111] uppercase tracking-tighter mb-6 flex items-center gap-2">
                  <ArrowDownCircle size={20} className="text-red-600" /> Detalhe de Perdas
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Por Erros Técnicos</p>
                      <p className="text-sm font-bold text-yellow-600">Impacto de Qualidade</p>
                    </div>
                    <span className="text-lg font-black text-yellow-600">-{metrics.pontosPerdidosErro}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Por Faltas Graves</p>
                      <p className="text-sm font-bold text-red-600">Impacto de Entrega</p>
                    </div>
                    <span className="text-lg font-black text-red-600">-{metrics.pontosPerdidosFalta}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#8B1B1F] p-8 rounded-[40px] text-white shadow-xl flex flex-col justify-center">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Info size={24} className="opacity-50" />
                      <h4 className="text-sm font-bold uppercase tracking-widest">Resumo de Feedback</h4>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed italic">
                      {metrics.faltas > 0 
                        ? "O colaborador apresenta faltas graves de entrega, o que compromete severamente o score de confiabilidade do time."
                        : metrics.erros > 3 
                        ? "Necessário reforço técnico: o volume de erros ultrapassou a margem de segurança operacional."
                        : "Colaborador em conformidade. Foco em manter a consistência de prazos."}
                    </p>
                    <div className="pt-4">
                       <span className="text-[10px] font-black bg-white/10 px-3 py-1.5 rounded-full uppercase tracking-widest">
                         Status RH: {selectedUser.StatusRH || 'ANÁLISE PERIÓDICA'}
                       </span>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Agenda de Futuro */}
          <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h4 className="text-xl font-bold text-[#111111] uppercase tracking-tighter flex items-center gap-3">
                   <CalendarClock size={24} className="text-[#8B1B1F]" /> Agenda de Futuro (Planejamento)
                </h4>
                <div className="bg-[#8B1B1F]/5 px-4 py-2 rounded-2xl border border-[#8B1B1F]/10">
                   <span className="text-[10px] font-black text-[#8B1B1F] uppercase tracking-widest">
                     {futureTasks.reduce((acc, t) => acc + t.PontosValor, 0)} Pts em Planejamento
                   </span>
                </div>
             </div>

             <div className="space-y-4">
                {futureTasks.length > 0 ? (
                   futureTasks.map(task => (
                     <div key={task.ID} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-400 group-hover:text-[#8B1B1F] transition-colors">
                              <Clock size={20} />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-[#111111]">{task.Titulo}</p>
                              <p className="text-[10px] font-black text-[#8B1B1F] uppercase tracking-widest">
                                Prazo: {task.DataLimite_Date!.split('-').reverse().join('/')}
                              </p>
                           </div>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center gap-6">
                           <div className="text-right">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${
                                task.Status === TaskStatus.FEITA_ERRADA ? 'text-yellow-600' : 
                                task.Status === TaskStatus.NAO_FEITA ? 'text-red-600' : 'text-blue-600'
                              }`}>
                                {task.Status}
                              </span>
                           </div>
                           <div className="text-right border-l border-gray-200 pl-6">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Valor</p>
                              <span className="text-sm font-black text-[#111111]">{task.PontosValor} Pts</span>
                           </div>
                        </div>
                     </div>
                   ))
                ) : (
                   <div className="py-12 text-center bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-100">
                      <CalendarClock size={40} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma tarefa planejada para as próximas datas.</p>
                   </div>
                )}
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
