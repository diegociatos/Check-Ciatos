
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from './store';
import { ViewType, TaskStatus, UserRole, TaskTemplate, User, ConferenciaStatus } from './types';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { 
  PlusCircle, Search, Trophy, History, Settings, Users, Star, TrendingUp, AlertCircle, Filter, 
  Info, Edit3, RotateCw, ToggleLeft, ToggleRight, Trash2, X, Save, Zap, Check, Award, 
  ShieldCheck, Camera, User as UserIcon, Phone, Calendar, MapPin, Lock, ChevronRight, 
  Medal, AlertTriangle, BarChart3, Eye, EyeOff, RefreshCcw, Unlock, Mail, CheckCircle2,
  FileCheck, FileX, MessageSquare, ClipboardCheck, TrendingDown, Sparkles, AlertOctagon
} from 'lucide-react';

const App: React.FC = () => {
  const { 
    currentUser, tasks, ledger, notifications, login, logout, 
    completeTask, conferTask, users, getUserStats, getEnrichedTask 
  } = useStore();

  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');
  const [searchTerm, setSearchTerm] = useState('');
  const [isConferenciaModalOpen, setIsConferenciaModalOpen] = useState(false);
  const [selectedTaskToConfer, setSelectedTaskToConfer] = useState<any>(null);

  const userStats = currentUser ? getUserStats(currentUser.Email) : null;

  const renderProgressCard = (label: string, realizado: number, possivel: number, color: string) => {
    const perc = possivel > 0 ? Math.min(Math.round((realizado / possivel) * 100), 100) : 0;
    return (
      <div className="bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
          <span className={`text-xs font-black ${color}`}>{perc}%</span>
        </div>
        <div className="flex items-end gap-2">
          <h4 className="text-3xl font-black text-[#111111]">{realizado}</h4>
          <span className="text-gray-300 text-sm font-bold mb-1">/ {possivel} pts</span>
        </div>
        <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-1000 ease-out" 
            style={{ width: `${perc}%`, backgroundColor: '#8B1B1F' }} 
          />
        </div>
      </div>
    );
  };

  const weeklyComparisonData = useMemo(() => {
    if (!currentUser) return [];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);

    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    return days.map((day, index) => {
      const targetDate = new Date(startOfWeek);
      targetDate.setDate(startOfWeek.getDate() + index);
      const dayStr = targetDate.toDateString();

      const possible = tasks
        .filter(t => t.AssigneeEmail === currentUser.Email && new Date(t.DueDateTime).toDateString() === dayStr)
        .reduce((sum, t) => sum + t.Pontos, 0);

      const realized = ledger
        .filter(l => l.Email === currentUser.Email && new Date(l.DataHora).toDateString() === dayStr)
        .reduce((sum, l) => sum + l.DeltaPontos, 0);

      return {
        name: day,
        possivel: possible,
        realizado: Math.max(0, realized) // Avoid negative bars in simple comparison
      };
    });
  }, [currentUser, tasks, ledger]);

  const motivationalMessage = useMemo(() => {
    if (!userStats) return null;
    const perc = userStats.potencialMes > 0 ? (userStats.ganhoMes / userStats.potencialMes) * 100 : 100;
    
    if (perc < 70) {
      return {
        text: "Atenção: há pontos sendo perdidos!",
        color: "text-[#C62828]",
        bgColor: "bg-red-50",
        icon: <TrendingDown size={20} />
      };
    } else if (perc >= 90) {
      return {
        text: "Excelente desempenho!",
        color: "text-[#2E7D32]",
        bgColor: "bg-green-50",
        icon: <Sparkles size={20} />
      };
    }
    return null;
  }, [userStats]);

  if (!currentUser) return <Login onLogin={login} />;

  const renderContent = () => {
    if (!userStats) return null;

    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard score={userStats.ganhoMes} pendingTasksToday={[]} recentLedger={ledger.filter(l => l.Email === currentUser.Email).reverse()} onNavigateToTasks={() => setCurrentView('MY_TASKS_TODAY')} />;

      case 'MY_SCORE':
        return (
          <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Motivational Message */}
            {motivationalMessage && (
              <div className={`p-4 rounded-2xl ${motivationalMessage.bgColor} ${motivationalMessage.color} border border-current/10 flex items-center gap-3 animate-pulse`}>
                {motivationalMessage.icon}
                <span className="font-black uppercase text-xs tracking-widest">{motivationalMessage.text}</span>
              </div>
            )}

            {/* Indicator Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderProgressCard("Hoje", userStats.ganhoDia, userStats.potencialDia, "text-[#8B1B1F]")}
              {renderProgressCard("Semana", userStats.ganhoSemana, userStats.potencialSemana, "text-[#8B1B1F]")}
              {renderProgressCard("Mês", userStats.ganhoMes, userStats.potencialMes, "text-[#8B1B1F]")}
            </div>

            {/* Weekly Comparison Chart */}
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-[#111111] uppercase tracking-tighter">Comparativo Semanal</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Pontos Possíveis vs Realizados</p>
                  </div>
                  <BarChart3 className="text-gray-200" size={32} />
               </div>
               <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyComparisonData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 700}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 700}} />
                      <RechartsTooltip 
                        cursor={{fill: '#F9FAFB'}}
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                      <Bar name="Possível" dataKey="possivel" fill="#E5E7EB" radius={[6, 6, 0, 0]} />
                      <Bar name="Realizado" dataKey="realizado" fill="#8B1B1F" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Total Balance Card */}
            <div className="bg-[#111111] p-10 rounded-[40px] text-white relative overflow-hidden">
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 bg-[#8B1B1F] rounded-3xl flex items-center justify-center text-white shadow-2xl">
                      <Trophy size={40} />
                    </div>
                    <div>
                      <h2 className="text-4xl font-black tracking-tighter uppercase">{userStats.pontuacaoTotal} PONTOS</h2>
                      <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Saldo total de reputação conquistada</p>
                    </div>
                  </div>
                  <div className="bg-white/10 px-6 py-4 rounded-2xl border border-white/10 text-center">
                     <p className="text-[10px] font-black uppercase text-white/50 mb-1">Aguardando Auditoria</p>
                     <p className="text-2xl font-black text-yellow-400">{userStats.aguardandoConferencia} Tarefas</p>
                  </div>
               </div>
               <div className="absolute top-0 right-0 p-10 opacity-5"><Medal size={150} /></div>
            </div>

            {/* Performance History */}
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center gap-3">
                <History className="text-[#8B1B1F]" />
                <h3 className="font-black text-[#111111] text-xl uppercase tracking-tight">Histórico de Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                    <tr>
                      <th className="px-8 py-4">Data</th>
                      <th className="px-8 py-4">Evento</th>
                      <th className="px-8 py-4 text-right">Pontos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ledger.filter(l => l.Email === currentUser.Email).reverse().map(l => (
                      <tr key={l.LedgerID} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6 text-xs text-gray-400 font-bold">{new Date(l.DataHora).toLocaleDateString()}</td>
                        <td className="px-8 py-6">
                           <p className="text-sm font-bold text-[#111111]">{l.Observacao}</p>
                           <p className="text-[9px] text-gray-400 uppercase font-black">{l.Motivo}</p>
                        </td>
                        <td className={`px-8 py-6 text-right font-black text-lg ${l.DeltaPontos > 0 ? 'text-[#2E7D32]' : 'text-[#C62828]'}`}>
                          {l.DeltaPontos > 0 ? '+' : ''}{l.DeltaPontos}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'CHECK_DELIVERIES':
        const filteredTasks = tasks
          .filter(t => t.Status === TaskStatus.CONCLUIDA && t.ConferenciaStatus === ConferenciaStatus.AGUARDANDO_CONFERENCIA)
          .map(t => getEnrichedTask(t));
        
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="text-3xl font-black text-[#111111] uppercase tracking-tighter">Conferir Entregas</h3>
                  <p className="text-sm text-gray-400 font-medium">Audite as tarefas concluídas pelo time</p>
                </div>
                <div className="flex bg-[#8B1B1F]/5 px-6 py-3 rounded-2xl border border-[#8B1B1F]/10 items-center gap-4">
                  <div className="h-10 w-10 bg-[#8B1B1F] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#8B1B1F]/20"><ClipboardCheck size={20}/></div>
                  <div>
                    <p className="text-[10px] font-black text-[#8B1B1F] uppercase tracking-widest">Pendências de Auditoria</p>
                    <p className="text-xl font-black text-[#111111]">{filteredTasks.length} Tarefas</p>
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.map(task => (
                  <div key={task.TaskID} className="bg-white rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group">
                     <div className="p-8 flex-1 space-y-6">
                        <div className="flex justify-between items-start">
                           <span className="bg-blue-50 text-blue-700 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">
                             Aguardando Auditoria
                           </span>
                           <span className="text-2xl font-black text-[#8B1B1F]">{task.Pontos} pts</span>
                        </div>
                        <div>
                           <h4 className="text-xl font-bold text-[#111111] group-hover:text-[#8B1B1F] transition-colors">{task.Titulo}</h4>
                           <p className="text-xs text-gray-400 font-bold uppercase mt-1">Por: {task.NomeColaborador}</p>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-gray-50">
                           <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-300" />
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Concluído em:</span>
                              <span className="text-[10px] font-bold text-[#111111]">{new Date(task.CompletedAt!).toLocaleString()}</span>
                           </div>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-2xl space-y-2 border border-gray-100">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nota de Conclusão:</p>
                           <p className="text-xs text-gray-700 italic leading-relaxed">"{task.CompletionNote || 'Nenhuma nota informada'}"</p>
                        </div>
                     </div>
                     <div className="p-8 bg-gray-50/50 border-t border-gray-50">
                        <button 
                           onClick={() => { setSelectedTaskToConfer(task); setIsConferenciaModalOpen(true); }}
                           className="w-full bg-[#111111] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                           <FileCheck size={18} /> Iniciar Auditoria
                        </button>
                     </div>
                  </div>
                ))}
                {filteredTasks.length === 0 && (
                   <div className="col-span-full py-20 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                      <CheckCircle2 size={64} className="mx-auto text-green-200 mb-4" />
                      <h3 className="text-xl font-black text-gray-300 uppercase tracking-widest">Auditoria em Dia</h3>
                      <p className="text-gray-400 text-sm font-medium">Não há novas entregas pendentes de conferência.</p>
                   </div>
                )}
             </div>

             {isConferenciaModalOpen && selectedTaskToConfer && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                 <div className="bg-white w-full max-w-2xl rounded-[50px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                    <div className="p-10 border-b border-gray-100 flex items-center justify-between">
                       <div>
                          <h3 className="text-3xl font-black text-[#111111] uppercase tracking-tighter">Resultado da Auditoria</h3>
                          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">{selectedTaskToConfer.Titulo}</p>
                       </div>
                       <button onClick={() => setIsConferenciaModalOpen(false)} className="p-4 hover:bg-gray-100 rounded-3xl text-gray-300 transition-colors"><X size={32}/></button>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      conferTask(
                        selectedTaskToConfer.TaskID,
                        formData.get('status') as ConferenciaStatus,
                        formData.get('obs') as string,
                        currentUser.Email
                      );
                      setIsConferenciaModalOpen(false);
                      alert('Resultado da auditoria salvo com sucesso!');
                    }} className="p-10 space-y-8">
                       <div className="space-y-4">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Avaliação da Entrega</label>
                          <div className="grid grid-cols-1 gap-4">
                             <label className="relative flex items-center p-6 bg-green-50 border-2 border-green-100 rounded-3xl cursor-pointer hover:border-green-300 transition-all group has-[:checked]:ring-4 has-[:checked]:ring-green-400/20">
                                <input type="radio" name="status" value={ConferenciaStatus.APROVADO} defaultChecked className="hidden" />
                                <div className="flex items-center gap-4">
                                   <div className="h-10 w-10 bg-green-500 text-white rounded-xl flex items-center justify-center"><Check size={20}/></div>
                                   <div>
                                      <p className="font-black text-green-900 uppercase text-xs">Aprovar Entrega</p>
                                      <p className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">Entrega conforme esperado. Pontos ganhos mantidos.</p>
                                   </div>
                                </div>
                             </label>
                             <label className="relative flex items-center p-6 bg-yellow-50 border-2 border-yellow-100 rounded-3xl cursor-pointer hover:border-yellow-300 transition-all group has-[:checked]:ring-4 has-[:checked]:ring-yellow-400/20">
                                <input type="radio" name="status" value={ConferenciaStatus.CUMPRIU_ERRADO} className="hidden" />
                                <div className="flex items-center gap-4">
                                   <div className="h-10 w-10 bg-yellow-500 text-white rounded-xl flex items-center justify-center"><FileX size={20}/></div>
                                   <div>
                                      <p className="font-black text-yellow-900 uppercase text-xs">Cumpriu Errado (Penalidade 3x)</p>
                                      <p className="text-[10px] text-yellow-600 font-bold uppercase tracking-tighter">Entrega incorreta. Penalidade: perda de 3x os pontos.</p>
                                   </div>
                                </div>
                             </label>
                             <label className="relative flex items-center p-6 bg-red-50 border-2 border-red-100 rounded-3xl cursor-pointer hover:border-red-300 transition-all group has-[:checked]:ring-4 has-[:checked]:ring-red-400/20">
                                <input type="radio" name="status" value={ConferenciaStatus.NAO_CUMPRIU} className="hidden" />
                                <div className="flex items-center gap-4">
                                   <div className="h-10 w-10 bg-red-500 text-white rounded-xl flex items-center justify-center"><AlertOctagon size={20}/></div>
                                   <div>
                                      <p className="font-black text-red-900 uppercase text-xs">Não Cumpriu (Penalidade 5x)</p>
                                      <p className="text-[10px] text-red-600 font-bold uppercase tracking-tighter">Grave. Penalidade: perda de 5x os pontos da tarefa.</p>
                                   </div>
                                </div>
                             </label>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             <MessageSquare size={14}/> Motivação / Feedback (Obrigatório para penalidades)
                          </label>
                          <textarea name="obs" required className="w-full bg-gray-50 border border-gray-200 rounded-[30px] p-8 text-sm font-medium focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none min-h-[150px] transition-all shadow-inner" placeholder="Justifique o resultado da auditoria..." />
                       </div>

                       <button type="submit" className="w-full bg-[#8B1B1F] text-white py-6 rounded-[30px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#8B1B1F]/30 hover:bg-[#6F0F14] transition-all flex items-center justify-center gap-4">
                          <ClipboardCheck size={24} /> Registrar Auditoria
                       </button>
                    </form>
                 </div>
               </div>
             )}
          </div>
        );

      case 'TEAM_PANEL':
        const teamTasksStats = tasks.map(t => getEnrichedTask(t));
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <h3 className="text-3xl font-black text-[#111111] uppercase tracking-tighter">Desempenho Geral do Time</h3>
                <p className="text-sm text-gray-400 font-medium">Acompanhe a produtividade de todos os colaboradores</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {users.filter(u => u.Role === UserRole.COLABORADOR).map(u => {
                  const stats = getUserStats(u.Email);
                  return (
                    <div key={u.Email} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all space-y-4">
                       <div className="flex items-center gap-4 mb-4">
                          <div className="h-12 w-12 bg-[#8B1B1F] rounded-2xl flex items-center justify-center text-white font-black text-lg">
                             {u.Nome.charAt(0)}
                          </div>
                          <div>
                             <h4 className="font-bold text-[#111111]">{u.Nome}</h4>
                             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{u.Time}</p>
                          </div>
                       </div>
                       <div className="space-y-2">