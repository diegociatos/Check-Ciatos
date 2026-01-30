
import React, { useState, useMemo } from 'react';
import { useStore } from './store';
import { ViewType, TaskStatus, UserRole, TaskTemplate } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import { 
  PlusCircle, 
  Search, 
  Trophy, 
  History, 
  Settings, 
  Users, 
  Star, 
  TrendingUp, 
  AlertCircle, 
  Filter, 
  Info, 
  Edit3, 
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
  Save
} from 'lucide-react';

const App: React.FC = () => {
  const { 
    currentUser, 
    tasks, 
    templates,
    ledger, 
    notifications,
    completeTask, 
    reopenTask,
    deleteTask,
    addTask, 
    addTemplate,
    updateTemplate,
    deleteTemplate,
    users, 
    setCurrentUserEmail,
    updatePointsManually,
    getUserStats,
    getEnrichedTask
  } = useStore();

  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Filtering Logic
  const filteredTasks = useMemo(() => {
    let result = tasks;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (currentView) {
      case 'MY_TASKS_TODAY':
        result = result.filter(t => 
          t.AssigneeEmail === currentUser.Email && 
          t.Status === TaskStatus.PENDENTE && 
          new Date(t.DueDateTime) >= today
        );
        break;
      case 'OVERDUE_TASKS':
        result = result.filter(t => 
          t.AssigneeEmail === currentUser.Email && 
          t.Status === TaskStatus.ATRASADA
        );
        break;
      case 'COMPLETED_TASKS':
        result = result.filter(t => 
          t.AssigneeEmail === currentUser.Email && 
          t.Status === TaskStatus.CONCLUIDA
        );
        break;
      case 'CREATED_BY_ME':
        result = result.filter(t => t.CreatedByEmail === currentUser.Email);
        break;
      case 'ALL_TASKS':
        if (currentUser.Role !== UserRole.ADMIN) {
           result = result.filter(t => t.AssigneeEmail === currentUser.Email || t.CreatedByEmail === currentUser.Email);
        }
        break;
      default:
        if (currentUser.Role === UserRole.COLABORADOR) {
          result = result.filter(t => t.AssigneeEmail === currentUser.Email);
        } else if (currentUser.Role === UserRole.GESTOR) {
          result = result.filter(t => t.AssigneeEmail === currentUser.Email || t.CreatedByEmail === currentUser.Email);
        }
    }

    if (searchTerm) {
      result = result.filter(t => t.Titulo.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return result.map(t => getEnrichedTask(t));
  }, [tasks, currentUser, currentView, searchTerm, getEnrichedTask]);

  const userStats = getUserStats(currentUser.Email);
  const pendingTasksToday = tasks.filter(t => 
    t.AssigneeEmail === currentUser.Email && 
    t.Status === TaskStatus.PENDENTE && 
    new Date(t.DueDateTime).toDateString() === new Date().toDateString()
  );

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            score={userStats.pontuacaoTotal} 
            pendingTasksToday={pendingTasksToday} 
            recentLedger={ledger.filter(l => l.Email === currentUser.Email).reverse()}
            onNavigateToTasks={() => setCurrentView('MY_TASKS_TODAY')}
          />
        );

      case 'MANAGE_TEMPLATES':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-[#111111] uppercase tracking-tighter">Gestão de Recorrências</h3>
                <p className="text-sm text-gray-400 font-medium">Automação de tarefas diárias e semanais</p>
              </div>
              <button 
                onClick={() => setIsTemplateModalOpen(true)}
                className="bg-[#8B1B1F] text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#6F0F14] transition-all shadow-lg shadow-[#8B1B1F]/20"
              >
                 <PlusCircle size={16} /> Nova Recorrência
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.length > 0 ? (
                templates.map(template => (
                  <div key={template.TemplateID} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <RefreshCw size={16} className="text-[#8B1B1F]" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recorrente</span>
                      </div>
                      <button 
                        onClick={() => updateTemplate(template.TemplateID, { Ativo: !template.Ativo })}
                        className={`transition-colors ${template.Ativo ? 'text-green-600' : 'text-gray-300'}`}
                      >
                        {template.Ativo ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                    </div>

                    <div>
                      <h4 className="font-bold text-[#111111]">{template.Titulo}</h4>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1">{template.Descricao}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {template.DiasDaSemana.split(',').map(day => (
                        <span key={day} className="text-[9px] font-black px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 uppercase">
                          {day.trim()}
                        </span>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Responsável</span>
                        <span className="text-xs font-bold text-[#111111]">{template.AssigneeEmail.split('@')[0]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <button 
                          onClick={() => deleteTemplate(template.TemplateID)}
                          className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                         >
                           <Trash2 size={16} />
                         </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                   <RefreshCw size={48} className="mx-auto text-gray-200 mb-4" />
                   <h3 className="text-lg font-bold text-gray-400">Nenhum template ativo</h3>
                   <p className="text-gray-400 text-xs">Crie templates para automatizar a geração de tarefas.</p>
                </div>
              )}
            </div>

            {/* Template Modal */}
            {isTemplateModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-2xl font-black text-[#111111] uppercase tracking-tighter">Configurar Recorrência</h3>
                    <button onClick={() => setIsTemplateModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-2xl text-gray-400 transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    addTemplate({
                      Titulo: formData.get('titulo') as string,
                      Descricao: formData.get('descricao') as string,
                      Pontos: parseInt(formData.get('pontos') as string),
                      AssigneeEmail: formData.get('assignee') as string,
                      DiasDaSemana: formData.get('dias') as string,
                      Ativo: true,
                      CreatedByEmail: currentUser.Email
                    });
                    setIsTemplateModalOpen(false);
                  }} className="p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Título do Template</label>
                      <input required name="titulo" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none transition-all" placeholder="Ex: Conferência de Caixa" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</label>
                      <textarea required name="descricao" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none min-h-[80px]" placeholder="Instruções para a tarefa..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Pontuação</label>
                        <input required name="pontos" type="number" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none" placeholder="Ex: 50" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsável</label>
                        <select name="assignee" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none">
                          {users.filter(u => u.Role !== UserRole.ADMIN).map(u => (
                            <option key={u.Email} value={u.Email}>{u.Nome}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Dias da Semana (Separados por vírgula)</label>
                      <input required name="dias" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none" placeholder="Segunda, Quarta, Sexta ou Todos" />
                    </div>

                    <button type="submit" className="w-full bg-[#8B1B1F] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-[#8B1B1F]/30 hover:bg-[#6F0F14] transition-all flex items-center justify-center gap-2">
                      <Save size={18} /> Ativar Recorrência
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case 'RANKING':
        const ranking = users
          .filter(u => u.Role !== UserRole.ADMIN)
          .map(u => ({ ...u, ...getUserStats(u.Email) }))
          .sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);

        return (
          <div className="space-y-6 max-w-4xl mx-auto">
             <div className="bg-[#111111] p-10 rounded-3xl text-white flex flex-col items-center justify-center relative overflow-hidden">
                <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce" />
                <h2 className="text-3xl font-black uppercase tracking-tighter">Elite de Produtividade</h2>
                <p className="text-gray-400 text-sm font-medium">Os colaboradores mais eficientes do Grupo Ciatos</p>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Star size={120} />
                </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {ranking.map((u, idx) => (
                  <div key={u.Email} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6 transition-all hover:scale-[1.01]">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-black text-lg ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : idx === 1 ? 'bg-gray-100 text-gray-500' : idx === 2 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-300'}`}>
                      {idx + 1}º
                    </div>
                    <div className="flex-1">
                       <h4 className="font-bold text-[#111111]">{u.Nome}</h4>
                       <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">{u.Time}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xl font-black text-[#8B1B1F]">{u.pontuacaoTotal} pts</p>
                       <div className="flex gap-2 justify-end mt-1">
                          <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded-full font-bold">Semana: +{u.pontuacaoSemana}</span>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        );

      case 'MANAGE_USERS':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-[#111111] uppercase tracking-tighter">Gerenciar Usuários</h3>
              <button className="bg-[#111111] text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black">
                 <PlusCircle size={16} /> Novo Usuário
              </button>
            </div>
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                     <tr>
                       <th className="px-6 py-4">Colaborador</th>
                       <th className="px-6 py-4">Total</th>
                       <th className="px-6 py-4">Semana</th>
                       <th className="px-6 py-4">Mês</th>
                       <th className="px-6 py-4">Status Tarefas</th>
                       <th className="px-6 py-4 text-center">Ações</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {users.map(u => {
                       const stats = getUserStats(u.Email);
                       return (
                         <tr key={u.Email} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-500">
                                    {u.Nome.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-[#111111]">{u.Nome}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">{u.Email}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4 font-black text-[#8B1B1F] text-sm">{stats.pontuacaoTotal}</td>
                            <td className="px-6 py-4 text-sm font-bold text-[#2E7D32]">+{stats.pontuacaoSemana}</td>
                            <td className="px-6 py-4 text-sm font-bold text-blue-600">+{stats.pontuacaoMes}</td>
                            <td className="px-6 py-4">
                               <div className="flex gap-2">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">{stats.tarefasPendentes} Pend.</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]">{stats.tarefasAtrasadas} Atr.</span>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <button className="p-2 hover:bg-gray-200 rounded-lg text-gray-400 transition-colors">
                                 <Settings size={16} />
                               </button>
                            </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        );

      case 'TEAM_PANEL':
        const teamTasks = tasks.map(t => getEnrichedTask(t));
        const statsSummary = {
          total: teamTasks.length,
          concluidas: teamTasks.filter(t => t.Status === TaskStatus.CONCLUIDA).length,
          atrasadas: teamTasks.filter(t => t.Status === TaskStatus.ATRASADA).length,
          pendentes: teamTasks.filter(t => t.Status === TaskStatus.PENDENTE).length,
        };

        return (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total de Atividades</p>
                   <p className="text-3xl font-black text-[#111111]">{statsSummary.total}</p>
                </div>
                <div className="bg-[#E8F5E9] p-6 rounded-3xl border border-[#C8E6C9] shadow-sm">
                   <p className="text-[10px] font-black text-[#2E7D32] uppercase tracking-widest mb-1">Concluídas</p>
                   <p className="text-3xl font-black text-[#2E7D32]">{statsSummary.concluidas}</p>
                </div>
                <div className="bg-[#FFEBEE] p-6 rounded-3xl border border-[#FFCDD2] shadow-sm">
                   <p className="text-[10px] font-black text-[#C62828] uppercase tracking-widest mb-1">Atrasadas</p>
                   <p className="text-3xl font-black text-[#C62828]">{statsSummary.atrasadas}</p>
                </div>
                <div className="bg-[#FFF3E0] p-6 rounded-3xl border border-[#FFE0B2] shadow-sm">
                   <p className="text-[10px] font-black text-[#E65100] uppercase tracking-widest mb-1">Pendentes</p>
                   <p className="text-3xl font-black text-[#E65100]">{statsSummary.pendentes}</p>
                </div>
             </div>

             <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl font-black text-[#111111] uppercase tracking-tight">Fluxo de Trabalho do Time</h3>
                   <div className="flex gap-2">
                      <button className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-[#111111] transition-colors"><Filter size={18}/></button>
                   </div>
                </div>
                <TaskList 
                  tasks={teamTasks} 
                  onComplete={completeTask} 
                  onReopen={reopenTask}
                  onDelete={deleteTask}
                  currentUserRole={currentUser.Role}
                  currentUserEmail={currentUser.Email}
                />
             </div>
          </div>
        );

      case 'GENERAL_LEDGER':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-[#111111] uppercase tracking-tighter">Extrato Geral de Pontos</h3>
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                     <tr>
                       <th className="px-6 py-4">Data/Hora</th>
                       <th className="px-6 py-4">Colaborador</th>
                       <th className="px-6 py-4">Motivo</th>
                       <th className="px-6 py-4">Observação</th>
                       <th className="px-6 py-4 text-right">Valor</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {ledger.slice().reverse().map(l => (
                       <tr key={l.LedgerID} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-xs font-medium text-gray-400">{new Date(l.DataHora).toLocaleString()}</td>
                          <td className="px-6 py-4 font-bold text-sm text-[#111111]">{l.Email}</td>
                          <td className="px-6 py-4">
                             <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${l.DeltaPontos >= 0 ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' : 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'}`}>
                                {l.Motivo}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-600">{l.Observacao}</td>
                          <td className={`px-6 py-4 text-right font-black text-sm ${l.DeltaPontos > 0 ? 'text-[#2E7D32]' : 'text-[#C62828]'} ${l.DeltaPontos !== 0 ? 'font-bold' : ''}`}>
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

      case 'CREATE_TASK':
        return (
          <div className="max-w-2xl mx-auto bg-white p-10 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
            <div className="flex items-center gap-4 mb-8">
               <div className="h-14 w-14 bg-[#8B1B1F]/5 text-[#8B1B1F] rounded-2xl flex items-center justify-center">
                 <PlusCircle size={32} />
               </div>
               <div>
                 <h3 className="text-2xl font-black text-[#111111] uppercase tracking-tighter">Nova Pendência</h3>
                 <p className="text-sm text-gray-400 font-medium">Defina objetivos claros para sua equipe</p>
               </div>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              addTask({
                Titulo: formData.get('titulo') as string,
                Descricao: formData.get('descricao') as string,
                Pontos: parseInt(formData.get('pontos') as string),
                AssigneeEmail: formData.get('assignee') as string,
                CreatedByEmail: currentUser.Email,
                DueDateTime: new Date(formData.get('due') as string).toISOString(),
              });
              setCurrentView('CREATED_BY_ME');
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Título da Tarefa</label>
                <input required name="titulo" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none transition-all" placeholder="O que precisa ser feito?" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição Detalhada</label>
                <textarea required name="descricao" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none min-h-[120px] transition-all" placeholder="Detalhes técnicos, links ou referências..." />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor em Pontos</label>
                  <input required name="pontos" type="number" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none transition-all" placeholder="Ex: 50" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Data/Hora Limite</label>
                  <input required name="due" type="datetime-local" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Colaborador Responsável</label>
                <select name="assignee" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none transition-all appearance-none">
                  {users.filter(u => u.Role !== UserRole.ADMIN).map(u => (
                    <option key={u.Email} value={u.Email}>{u.Nome}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full bg-[#8B1B1F] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-[#8B1B1F]/30 hover:bg-[#6F0F14] transition-all active:scale-[0.98]">
                Lançar Pendência no Sistema
              </button>
            </form>
          </div>
        );

      case 'MY_SCORE':
        return (
          <div className="space-y-6">
             <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
               <div className="flex items-center gap-8">
                 <div className="h-28 w-28 bg-yellow-100 rounded-3xl flex items-center justify-center text-yellow-600 shadow-inner rotate-3 transition-transform hover:rotate-0">
                   <Trophy size={64} />
                 </div>
                 <div>
                   <h2 className="text-5xl font-black text-[#111111] tracking-tighter">{userStats.pontuacaoTotal} PONTOS</h2>
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Seu capital de reputação operacional</p>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                 <div className="bg-[#E8F5E9] px-6 py-4 rounded-2xl border border-[#C8E6C9] text-center">
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#2E7D32] block mb-1">Ganhos Mês</span>
                   <span className="text-2xl font-black text-[#2E7D32]">+{userStats.pontuacaoMes}</span>
                 </div>
                 <div className="bg-[#FFEBEE] px-6 py-4 rounded-2xl border border-[#FFCDD2] text-center">
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#C62828] block mb-1">Pendentes</span>
                   <span className="text-2xl font-black text-[#C62828]">{userStats.tarefasPendentes}</span>
                 </div>
               </div>
             </div>

             <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-black text-[#111111] text-xl uppercase tracking-tight flex items-center gap-3">
                    <History className="text-[#8B1B1F]" />
                    Extrato de Performance
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                      <tr>
                        <th className="px-8 py-4">Data</th>
                        <th className="px-8 py-4">Evento</th>
                        <th className="px-8 py-4">Referência</th>
                        <th className="px-8 py-4 text-right">Impacto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {ledger.filter(l => l.Email === currentUser.Email).reverse().map(entry => (
                        <tr key={entry.LedgerID} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-6 text-xs text-gray-400 font-medium">{new Date(entry.DataHora).toLocaleString()}</td>
                          <td className="px-8 py-6">
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${entry.DeltaPontos > 0 ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' : 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'}`}>
                              {entry.Motivo}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm font-bold text-[#111111]">{entry.Observacao}</td>
                          <td className={`px-8 py-6 text-right font-black text-lg ${entry.DeltaPontos > 0 ? 'text-[#2E7D32]' : 'text-[#C62828]'} font-bold`}>
                             {entry.DeltaPontos > 0 ? '+' : ''}{entry.DeltaPontos}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        );

      case 'RULES':
        return (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-12 rounded-[40px] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-6 mb-12">
                 <div className="h-16 w-16 bg-[#8B1B1F] rounded-3xl flex items-center justify-center text-white shadow-xl shadow-[#8B1B1F]/30">
                   <Info size={32} />
                 </div>
                 <div>
                    <h3 className="text-4xl font-black text-[#111111] uppercase tracking-tighter">Constituição de Pontos</h3>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">A transparência gera excelência operacional</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-[#E8F5E9]/50 p-8 rounded-3xl border border-[#C8E6C9] transition-transform hover:-translate-y-2">
                  <div className="h-12 w-12 bg-[#2E7D32] text-white rounded-2xl flex items-center justify-center font-black text-xl mb-6 shadow-lg shadow-[#2E7D32]/30">1</div>
                  <h4 className="font-black text-[#111111] text-lg mb-4 uppercase leading-tight">Sucesso no Prazo</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">Conclusão validada dentro da janela de tempo. Recompensa: <span className="font-bold text-[#2E7D32]">100% dos pontos</span>.</p>
                </div>
                
                <div className="bg-[#FFEBEE]/50 p-8 rounded-3xl border border-[#FFCDD2] transition-transform hover:-translate-y-2">
                  <div className="h-12 w-12 bg-[#C62828] text-white rounded-2xl flex items-center justify-center font-black text-xl mb-6 shadow-lg shadow-[#C62828]/30 text-white">2</div>
                  <h4 className="font-black text-[#111111] text-lg mb-4 uppercase leading-tight">Penalidade Máxima</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">Tarefa ignorada após o deadline. Impacto: <span className="font-bold text-[#C62828]">Perda de 200% (2x)</span> dos pontos originais.</p>
                </div>

                <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 transition-transform hover:-translate-y-2">
                  <div className="h-12 w-12 bg-[#111111] text-white rounded-2xl flex items-center justify-center font-black text-xl mb-6 shadow-lg shadow-black/30">3</div>
                  <h4 className="font-black text-[#111111] text-lg mb-4 uppercase leading-tight">Recuperação</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">Conclusão fora do prazo. <span className="font-bold text-gray-800">0 pontos ganhos</span>. Serve apenas para regularizar a pendência e evitar multas extras.</p>
                </div>
              </div>

              <div className="mt-16 p-8 bg-[#8B1B1F] rounded-3xl text-white relative overflow-hidden group">
                 <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <TrendingUp size={64} className="opacity-50" />
                    <div>
                      <h5 className="text-xl font-black uppercase tracking-tight mb-2">Visão Grupo Ciatos</h5>
                      <p className="text-white/80 font-medium italic">"Medimos o que valorizamos. Sua pontuação é o reflexo da sua organização, disciplina e comprometimento com as metas do grupo."</p>
                    </div>
                 </div>
                 <div className="absolute -right-20 -bottom-20 h-64 w-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
              </div>
            </div>
          </div>
        );

      case 'MANUAL_ADJUSTMENT':
        return (
          <div className="max-w-xl mx-auto bg-white p-12 rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-200/50">
            <div className="flex items-center gap-4 mb-10">
               <div className="h-16 w-16 bg-gray-100 text-gray-900 rounded-3xl flex items-center justify-center">
                 <Edit3 size={32} />
               </div>
               <div>
                 <h3 className="text-2xl font-black text-[#111111] uppercase tracking-tighter">Ajuste de Saldo</h3>
                 <p className="text-sm text-gray-400 font-medium">Intervenção direta no ScoreLedger</p>
               </div>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updatePointsManually(
                formData.get('user') as string,
                parseInt(formData.get('points') as string),
                formData.get('obs') as string
              );
              alert('Lançamento manual realizado com sucesso!');
              e.currentTarget.reset();
            }} className="space-y-6">
               <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuário de Destino</label>
                <select name="user" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-gray-100 outline-none transition-all appearance-none">
                  {users.map(u => (
                    <option key={u.Email} value={u.Email}>{u.Nome} ({u.Time})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Delta Pontos (Usar '-' para debitar)</label>
                <input required name="points" type="number" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-gray-100 outline-none transition-all" placeholder="Ex: -100" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Motivação / Justificativa</label>
                <textarea required name="obs" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-gray-100 outline-none min-h-[100px] transition-all" placeholder="Relate o motivo deste ajuste administrativo..." />
              </div>
              <button type="submit" className="w-full bg-[#111111] text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-black/20">
                Confirmar Lançamento
              </button>
            </form>
          </div>
        );

      default:
        return (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
               <div className="relative flex-1">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                 <input 
                  type="text" 
                  placeholder="Pesquisar pendência pelo título..." 
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-[#8B1B1F]/5 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
               <div className="flex items-center gap-3 shrink-0">
                  <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                    <button className="px-4 py-2 bg-white text-[#111111] text-[10px] font-black uppercase rounded-xl shadow-sm">Ativas</button>
                    <button className="px-4 py-2 text-gray-400 text-[10px] font-black uppercase hover:text-[#111111] transition-colors">Histórico</button>
                  </div>
               </div>
            </div>
            <TaskList 
              tasks={filteredTasks} 
              onComplete={completeTask} 
              onReopen={reopenTask}
              onDelete={deleteTask}
              currentUserRole={currentUser.Role}
              currentUserEmail={currentUser.Email}
            />
          </div>
        );
    }
  };

  return (
    <Layout 
      currentUser={currentUser} 
      currentView={currentView} 
      notifications={notifications}
      onNavigate={setCurrentView}
      onLogout={() => {
        const currentIndex = users.findIndex(u => u.Email === currentUser.Email);
        const nextUser = users[(currentIndex + 1) % users.length];
        setCurrentUserEmail(nextUser.Email);
        setCurrentView('DASHBOARD');
      }}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
