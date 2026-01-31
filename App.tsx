
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from './store';
import { ViewType, UserRole, TaskStatus, TaskPriority, User, Task } from './types';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import TodayTaskCards from './components/TodayTaskCards';
import PerformanceDashboard from './components/PerformanceDashboard';
import DeliveryChecklist from './components/DeliveryChecklist';
import ReliabilityPanel from './components/ReliabilityPanel';
import TeamPanel from './components/TeamPanel';
import RankingView from './components/RankingView';
import DecisionReport from './components/DecisionReport';
import CompletedTasksView from './components/CompletedTasksView';
import MyScoreView from './components/MyScoreView';
import TemplateManager from './components/TemplateManager';
import TaskSupervisionView from './components/TaskSupervisionView';
import ScoreSupervisionView from './components/ScoreSupervisionView';
import IndividualPerformanceDashboard from './components/IndividualPerformanceDashboard';
import { 
  User as UserIcon, Camera, Phone, Calendar, MapPin, AlignLeft, Save, Shield, Mail, CheckCircle, Clock, ListFilter, ArrowUpDown, Filter, Star, CalendarClock, Bell, CheckCircle2, Users
} from 'lucide-react';

const App: React.FC = () => {
  const { 
    currentUser, users, login, logout, updateProfile, minhasTarefas, tasks, templates, ledger, 
    completeTask, auditTask, addTemplate, toggleTemplate, deleteTemplate, generateTaskFromTemplate
  } = useStore();

  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');
  const [profileForm, setProfileForm] = useState<Partial<User>>({});
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'TODAS'>('TODAS');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        Nome: currentUser.Nome,
        Telefone: currentUser.Telefone,
        Endereco: currentUser.Endereco,
        Bio: currentUser.Bio,
        DataNascimento: currentUser.DataNascimento,
        Foto: currentUser.Foto
      });
    }
  }, [currentUser, currentView]);

  if (!currentUser) return <Login onLogin={login} />;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileForm);
    alert('Perfil atualizado com sucesso!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, Foto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuickComplete = (taskId: string) => {
    completeTask(taskId, "Entrega confirmada via checklist rápido");
  };

  const handleNotify = (userEmail: string, taskTitle: string) => {
    const user = users.find(u => u.Email === userEmail);
    alert(`Notificação enviada para ${user?.Nome || userEmail}: Lembrete da tarefa "${taskTitle}"`);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            score={currentUser.PontosRealizadosMes || 0} 
            pendingTasksToday={minhasTarefas.filter(t => t.Status === TaskStatus.PENDENTE)} 
            recentLedger={ledger.filter(l => l.UserEmail === currentUser.Email)} 
            onNavigateToTasks={() => setCurrentView('MY_TASKS_TODAY')}
            tasks={tasks}
          />
        );

      case 'MY_TASKS_TODAY':
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD Local
        const isManagerOrAdmin = currentUser.Role === UserRole.GESTOR || currentUser.Role === UserRole.ADMIN;
        
        // Regra Master: Somente DataLimite = Hoje e Status = Pendente
        let todayPendingTasks = tasks.filter(t => {
          const taskDateStr = new Date(t.DataLimite).toLocaleDateString('en-CA');
          const isToday = taskDateStr === today;
          const isPending = t.Status === TaskStatus.PENDENTE;
          const isOwner = t.Responsavel === currentUser.Email;
          const isAdmin = currentUser.Role === UserRole.ADMIN;
          
          if (isManagerOrAdmin || isAdmin) return isToday && isPending;
          return isOwner && isToday && isPending;
        });

        if (filterPriority !== 'TODAS') {
          todayPendingTasks = todayPendingTasks.filter(t => t.Prioridade === filterPriority);
        }

        const completedTodayCount = tasks.filter(t => {
           if (!t.DataConclusao) return false;
           const completionDateStr = new Date(t.DataConclusao).toLocaleDateString('en-CA');
           return completionDateStr === today && (t.Status === TaskStatus.CONCLUIDO || t.Status === TaskStatus.CONFERIDO);
        }).length;

        const groupedTasks = todayPendingTasks.reduce((acc, task) => {
          if (!acc[task.Responsavel]) acc[task.Responsavel] = [];
          acc[task.Responsavel].push(task);
          return acc;
        }, {} as Record<string, Task[]>);

        const owners = isManagerOrAdmin ? Object.keys(groupedTasks) : [currentUser.Email];

        return (
          <div className="flex flex-col gap-0 -m-4 lg:-m-8 animate-in fade-in duration-500">
            <div className="bg-[#8B1B1F] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4 opacity-70">
                    <ListFilter size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Obrigações Corporativas - {new Date().toLocaleDateString('pt-BR')}</span>
                  </div>
                  <h3 className="text-4xl lg:text-5xl font-bold tracking-tight uppercase mb-2 font-ciatos">
                    {isManagerOrAdmin ? 'Painel de Controle Master' : 'Minhas Tarefas de Hoje'}
                  </h3>
                  <p className="text-white/60 font-medium text-lg">
                    {isManagerOrAdmin 
                      ? 'Visão consolidada da operação de hoje. Atendimento total (Sáb/Dom inclusive).' 
                      : 'Suas obrigações pendentes para o dia de hoje.'}
                  </p>
               </div>
            </div>

            <div className="p-4 lg:p-8 space-y-8">
              <div className="flex items-center justify-between bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm overflow-hidden relative">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                       <CheckCircle2 size={24} />
                    </div>
                    <div>
                       <h4 className="text-lg font-bold text-[#111111] uppercase tracking-tighter">Entregas Realizadas</h4>
                       <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Time Grupo Ciatos (Hoje)</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <span className="text-4xl font-black text-green-600 tracking-tighter">{completedTodayCount}</span>
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Concluídas Hoje</p>
                 </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                       <Filter size={14} /> Prioridade:
                    </div>
                    <div className="flex gap-2">
                       {(['TODAS', TaskPriority.ALTA, TaskPriority.MEDIA, TaskPriority.BAIXA] as const).map(p => (
                         <button key={p} onClick={() => setFilterPriority(p)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filterPriority === p ? 'bg-[#111111] text-white border-[#111111]' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'}`}>
                           {p === 'TODAS' ? 'Todas' : p}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              {owners.length > 0 ? (
                <div className="space-y-12">
                  {owners.map(email => {
                    const userTasks = groupedTasks[email] || [];
                    const user = users.find(u => u.Email === email);
                    if (!isManagerOrAdmin && email !== currentUser.Email) return null;
                    if (isManagerOrAdmin && userTasks.length === 0) return null;

                    return (
                      <div key={email} className="space-y-6">
                        {isManagerOrAdmin && (
                          <div className="flex items-center gap-4 border-l-4 border-[#8B1B1F] pl-6 py-2">
                             <div className="h-10 w-10 bg-[#8B1B1F] rounded-full flex items-center justify-center text-white text-sm font-black">
                                {user?.Nome.charAt(0) || 'U'}
                             </div>
                             <div>
                                <h4 className="text-xl font-bold text-[#111111] uppercase tracking-tighter">
                                   👤 {user?.Nome || email}
                                </h4>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                   {userTasks.length} {userTasks.length === 1 ? 'Tarefa pendente' : 'Tarefas pendentes'}
                                </p>
                             </div>
                          </div>
                        )}
                        <TodayTaskCards 
                          tasks={userTasks} 
                          onComplete={handleQuickComplete} 
                          onNotify={isManagerOrAdmin ? (taskTitle) => handleNotify(email, taskTitle) : undefined}
                          showUser={isManagerOrAdmin}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                  <CheckCircle2 size={64} className="text-gray-100 mb-4" />
                  <h3 className="text-xl font-bold text-gray-300 uppercase">Tudo em ordem!</h3>
                  <p className="text-gray-300 text-sm mt-1">Nenhuma tarefa pendente para hoje ({new Date().toLocaleDateString('pt-BR')}).</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'COMPLETED_TASKS':
        const completed = minhasTarefas.filter(t => t.Status === TaskStatus.CONCLUIDO || t.Status === TaskStatus.CONFERIDO);
        completed.sort((a, b) => {
          const dateA = a.DataConclusao ? new Date(a.DataConclusao).getTime() : 0;
          const dateB = b.DataConclusao ? new Date(b.DataConclusao).getTime() : 0;
          return dateB - dateA;
        });
        return (
          <div className="flex flex-col gap-0 -m-4 lg:-m-8 animate-in fade-in duration-500">
            <div className="bg-[#8B1B1F] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4 opacity-70">
                    <CheckCircle size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Histórico Profissional</span>
                  </div>
                  <h3 className="text-4xl lg:text-5xl font-bold tracking-tight uppercase mb-2 font-ciatos">Tarefas Concluídas</h3>
                  <p className="text-white/60 font-medium text-lg">Registro de obrigações finalizadas sob sua responsabilidade.</p>
               </div>
            </div>
            <div className="p-4 lg:p-8 space-y-8">
              <CompletedTasksView tasks={completed} />
            </div>
          </div>
        );

      case 'MY_SCORE':
        const myLedger = ledger.filter(l => l.UserEmail === currentUser.Email);
        return (
          <div className="p-4 lg:p-8 space-y-8">
            < MyScoreView ledger={myLedger} user={currentUser} />
          </div>
        );

      case 'TASK_SUPERVISION':
        return <TaskSupervisionView tasks={tasks} users={users} />;

      case 'SCORE_SUPERVISION':
        return <ScoreSupervisionView ledger={ledger} users={users} />;

      case 'INDIVIDUAL_PERFORMANCE':
        return <IndividualPerformanceDashboard users={users} tasks={tasks} ledger={ledger} />;

      case 'PERFORMANCE_MANAGEMENT':
        return <PerformanceDashboard tasks={tasks} users={users} />;
      
      case 'CHECK_DELIVERIES':
        return <DeliveryChecklist tasks={tasks} onAudit={auditTask} />;
      
      case 'MANAGE_TEMPLATES':
        return <TemplateManager 
          templates={templates} 
          users={users} 
          onAdd={addTemplate} 
          onToggle={toggleTemplate} 
          onDelete={deleteTemplate} 
          onGenerateNow={generateTaskFromTemplate}
        />;

      case 'RELIABILITY_PANEL':
        return <ReliabilityPanel users={users} tasks={tasks} />;
      
      case 'TEAM_PANEL':
        return <TeamPanel users={users} tasks={tasks} />;
      
      case 'RANKING':
        return <RankingView users={users} tasks={tasks} />;

      case 'REPORTS':
        return <DecisionReport users={users} />;

      case 'MY_PROFILE':
        return (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-[#8B1B1F] p-12 text-white flex flex-col items-center">
                <div className="relative group">
                  <div className="h-32 w-32 bg-white rounded-[40px] flex items-center justify-center text-[#8B1B1F] text-5xl font-black overflow-hidden shadow-2xl">
                    {profileForm.Foto ? <img src={profileForm.Foto} className="w-full h-full object-cover" alt="Profile" /> : currentUser.Nome.charAt(0)}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-black text-white p-3 rounded-2xl shadow-lg hover:scale-110 transition-transform">
                    <Camera size={18} />
                  </button>
                </div>
                <h2 className="mt-6 text-3xl font-black tracking-tighter uppercase font-ciatos">{currentUser.Nome}</h2>
                <div className="mt-2 flex items-center gap-2 text-white/60 font-bold uppercase text-[10px] tracking-widest">
                  <Shield size={12} /> {currentUser.Role} • {currentUser.Time}
                </div>
              </div>
              <form onSubmit={handleSaveProfile} className="p-10 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><UserIcon size={12} /> Nome Completo</label>
                    <input className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#8B1B1F]/10" value={profileForm.Nome || ''} onChange={e => setProfileForm({...profileForm, Nome: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><Phone size={12} /> Telefone</label>
                      <input className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#8B1B1F]/10" value={profileForm.Telefone || ''} onChange={e => setProfileForm({...profileForm, Telefone: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><Calendar size={12} /> Data de Nascimento</label>
                      <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={profileForm.DataNascimento || ''} onChange={e => setProfileForm({...profileForm, DataNascimento: e.target.value})} />
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#8B1B1F] text-white py-6 rounded-[35px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-4">
                  <Save size={20} /> Salvar Alterações
                </button>
              </form>
            </div>
          </div>
        );

      default:
        return <div className="p-20 text-center"><p className="text-gray-300 font-black uppercase tracking-widest">Seção em desenvolvimento para {currentView}</p></div>;
    }
  };

  return (
    <Layout currentUser={currentUser} currentView={currentView} notifications={[]} onNavigate={setCurrentView} onLogout={logout}>
      {renderContent()}
    </Layout>
  );
};

export default App;
