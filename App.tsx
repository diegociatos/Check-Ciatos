
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from './store';
import { ViewType, UserRole, TaskStatus, TaskPriority, User, Task, UserStatus, ReportFilter } from './types';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TaskTable from './components/TaskTable';
import UpcomingTasksView from './components/UpcomingTasksView';
import PerformanceDashboard from './components/PerformanceDashboard';
import DeliveryChecklist from './components/DeliveryChecklist';
import ReliabilityPanel from './components/ReliabilityPanel';
import TeamPanel from './components/TeamPanel';
import RankingView from './components/RankingView';
import CompletedTasksView from './components/CompletedTasksView';
import MyScoreView from './components/MyScoreView';
import TemplateManager from './components/TemplateManager';
import TaskSupervisionView from './components/TaskSupervisionView';
import ScoreSupervisionView from './components/ScoreSupervisionView';
import IndividualPerformanceDashboard from './components/IndividualPerformanceDashboard';
import ManageUsersView from './components/ManageUsersView';
import ExecutiveView from './components/ExecutiveView';
import HRReportView from './components/HRReportView';
import HelpCenterView from './components/HelpCenterView';
import ReportFiltersView from './components/ReportFiltersView';
import CollaboratorReportDashboard from './components/CollaboratorReportDashboard';
import { 
  User as UserIcon, Camera, Phone, Calendar, Save, Shield, ListFilter, CheckCircle2, Lock, ShieldCheck, Key, ArrowRight, X, Send
} from 'lucide-react';

const App: React.FC = () => {
  const { 
    currentUser, users, login, logout, changePassword, resetUserPassword, toggleUserStatus, deleteUser, addUser, updateUser,
    updateProfile, tasks, templates, ledger, 
    completeTask, auditTask, deleteTask, addTemplate, toggleTemplate, deleteTemplate, generateTaskFromTemplate
  } = useStore();

  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');
  const [profileForm, setProfileForm] = useState<Partial<User>>({});
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [activeReportFilter, setActiveReportFilter] = useState<ReportFilter | null>(null);
  const [selectedTaskToComplete, setSelectedTaskToComplete] = useState<Task | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  
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

  const visibleTasks = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.Role === UserRole.ADMIN) return tasks;
    if (currentUser.Role === UserRole.GESTOR) {
      return tasks.filter(t => {
         const targetUser = users.find(u => u.Email === t.Responsavel);
         return targetUser?.Gestor === currentUser.Email;
      });
    }
    return tasks.filter(t => t.Responsavel === currentUser.Email);
  }, [tasks, users, currentUser]);

  const visibleCollaborators = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.Role === UserRole.ADMIN) return users.filter(u => u.Role === UserRole.COLABORADOR);
    if (currentUser.Role === UserRole.GESTOR) return users.filter(u => u.Role === UserRole.COLABORADOR && u.Gestor === currentUser.Email);
    return [];
  }, [users, currentUser]);

  const visibleLedger = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.Role === UserRole.ADMIN) return ledger;
    if (currentUser.Role === UserRole.GESTOR) {
      return ledger.filter(l => {
         const targetUser = users.find(u => u.Email === l.UserEmail);
         return targetUser?.Gestor === currentUser.Email;
      });
    }
    return ledger.filter(l => l.UserEmail === currentUser.Email);
  }, [ledger, users, currentUser]);

  if (!currentUser) return <Login onLogin={login} />;

  const handleOpenCompleteModal = (taskId: string) => {
    const task = tasks.find(t => t.ID === taskId);
    if (task) {
      setSelectedTaskToComplete(task);
      setCompletionNote('');
    }
  };

  const handleConfirmCompletion = () => {
    if (selectedTaskToComplete) {
      completeTask(selectedTaskToComplete.ID, completionNote, '');
      setSelectedTaskToComplete(null);
    }
  };

  const renderContent = () => {
    // Definindo "Hoje" no fuso America/Sao_Paulo para comparação
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo'
    }).format(new Date());

    switch (currentView) {
      case 'DASHBOARD':
        const myPending = tasks.filter(t => t.Responsavel === currentUser.Email && t.Status !== TaskStatus.APROVADA);
        return (
          <Dashboard 
            score={currentUser.PontosRealizadosMes || 0} 
            pendingTasksToday={myPending} 
            recentLedger={ledger.filter(l => l.UserEmail === currentUser.Email)} 
            onNavigateToTasks={() => setCurrentView('MY_TASKS_TODAY')}
            tasks={visibleTasks}
            currentUserRole={currentUser.Role}
            collaborators={visibleCollaborators}
          />
        );

      case 'MY_TASKS_TODAY':
        const myConsolidatedMesa = tasks.filter(t => 
          t.Responsavel === currentUser.Email && 
          [TaskStatus.PENDENTE, TaskStatus.FEITA_ERRADA, TaskStatus.NAO_FEITA, TaskStatus.AGUARDANDO_APROVACAO].includes(t.Status) &&
          t.DataLimite.split('T')[0] >= todayStr
        );
        
        return (
          <div className="flex flex-col gap-0 -m-4 lg:-m-8 animate-in fade-in duration-500 font-ciatos pb-20">
            <div className="bg-[#8B1B1F] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-4 opacity-70">
                        <ListFilter size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Fluxo de Excelência Ciatos</span>
                      </div>
                      <h3 className="text-4xl lg:text-5xl font-bold tracking-tight uppercase mb-2">Minha Mesa</h3>
                      <p className="text-white/60 font-medium text-lg italic">Obrigações de hoje e próximas entregas.</p>
                    </div>
                  </div>
               </div>
            </div>
            <div className="p-4 lg:p-8 space-y-8">
              {myConsolidatedMesa.length > 0 ? (
                <TaskTable tasks={myConsolidatedMesa} onComplete={handleOpenCompleteModal} />
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                  <CheckCircle2 size={64} className="text-gray-100 mb-4" />
                  <h3 className="text-xl font-bold text-gray-300 uppercase">Toda a mesa em conformidade!</h3>
                  <p className="text-gray-300 text-sm mt-1">Sua produtividade está exemplar. Aguarde novos lançamentos.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'UPCOMING_TASKS':
        const tomorrowStr = new Date();
        tomorrowStr.setDate(tomorrowStr.getDate() + 1);
        const tomorrowISO = tomorrowStr.toISOString().split('T')[0];
        const myUpcomingTasks = tasks.filter(t => 
          t.Responsavel === currentUser.Email && 
          t.Status === TaskStatus.PENDENTE &&
          t.DataLimite.split('T')[0] >= tomorrowISO
        );
        return <UpcomingTasksView tasks={myUpcomingTasks} allTasks={tasks} onComplete={completeTask} onBack={() => setCurrentView('MY_TASKS_TODAY')} currentUserRole={currentUser.Role} />;

      case 'TASK_SUPERVISION':
        return <TaskSupervisionView tasks={visibleTasks} users={users} onDeleteTask={deleteTask} currentUserRole={currentUser.Role} />;

      case 'CHECK_DELIVERIES':
        return <DeliveryChecklist tasks={visibleTasks} onAudit={auditTask} />;

      case 'COMPLETED_TASKS':
        const approvedOnly = visibleTasks.filter(t => t.Status === TaskStatus.APROVADA);
        return (
          <div className="flex flex-col gap-0 -m-4 lg:-m-8 animate-in fade-in duration-500 font-ciatos pb-20">
            <div className="bg-[#8B1B1F] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
               <h3 className="text-4xl font-bold uppercase mb-2">Entregas Aprovadas</h3>
               <p className="text-white/60 font-medium text-lg">Histórico de conformidade operacional.</p>
            </div>
            <div className="p-4 lg:p-8">
              <CompletedTasksView tasks={approvedOnly} />
            </div>
          </div>
        );

      case 'MY_SCORE':
        return <div className="p-4 lg:p-8"><MyScoreView ledger={ledger.filter(l => l.UserEmail === currentUser.Email)} user={currentUser} /></div>;

      case 'SCORE_SUPERVISION':
        return <ScoreSupervisionView ledger={visibleLedger} users={users} />;

      case 'INDIVIDUAL_PERFORMANCE':
        return <IndividualPerformanceDashboard users={users} tasks={visibleTasks} ledger={visibleLedger} collaboratorsList={visibleCollaborators} />;

      case 'PERFORMANCE_MANAGEMENT':
        return <PerformanceDashboard tasks={visibleTasks} users={users} collaboratorsList={visibleCollaborators} />;
      
      case 'MANAGE_TEMPLATES':
        return <TemplateManager templates={templates} users={users} onAdd={addTemplate} onToggle={toggleTemplate} onDelete={deleteTemplate} onGenerateNow={generateTaskFromTemplate} />;

      case 'RELIABILITY_PANEL':
        return <ReliabilityPanel users={users} tasks={visibleTasks} collaboratorsList={visibleCollaborators} />;
      
      case 'TEAM_PANEL':
        return <TeamPanel users={users} tasks={visibleTasks} collaboratorsList={visibleCollaborators} />;
      
      case 'RANKING':
        return <RankingView users={users} tasks={visibleTasks} collaboratorsList={visibleCollaborators} />;

      case 'EXECUTIVE_VIEW':
        return <ExecutiveView tasks={tasks} users={users} />;

      case 'REPORTS':
        return <HRReportView users={users} />;

      case 'HELP_CENTER':
        return <HelpCenterView currentUser={currentUser} />;

      case 'PERIOD_REPORT_FILTERS':
        return <ReportFiltersView currentUser={currentUser} users={users} onGenerate={(f) => { setActiveReportFilter(f); setCurrentView('PERIOD_REPORT_DASHBOARD'); }} />;

      case 'PERIOD_REPORT_DASHBOARD':
        if (!activeReportFilter) return null;
        return <CollaboratorReportDashboard filter={activeReportFilter} tasks={tasks} ledger={ledger} users={users} onBack={() => setCurrentView('PERIOD_REPORT_FILTERS')} />;

      case 'MANAGE_USERS':
        // Regra de Segurança: Somente Admin acessa esta View
        if (currentUser.Role !== UserRole.ADMIN) {
           return (
             <div className="flex flex-col items-center justify-center py-20 text-center font-ciatos">
               <ShieldCheck size={64} className="text-red-100 mb-4" />
               <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest">Acesso Restrito</h3>
               <p className="text-sm text-gray-300">Esta seção é exclusiva para Administradores Master.</p>
             </div>
           );
        }
        return <ManageUsersView 
          users={users} 
          onAddUser={addUser} 
          onUpdateUser={updateUser}
          onResetPassword={resetUserPassword} 
          onToggleStatus={toggleUserStatus} 
          onDeleteUser={deleteUser} 
        />;

      case 'MY_PROFILE':
        return (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 font-ciatos">
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-[#8B1B1F] p-12 text-white flex flex-col items-center">
                <div className="relative group">
                  <div className="h-32 w-32 bg-white rounded-[40px] flex items-center justify-center text-[#8B1B1F] text-5xl font-black overflow-hidden shadow-2xl">
                    {profileForm.Foto ? <img src={profileForm.Foto} className="w-full h-full object-cover" alt="Profile" /> : currentUser.Nome.charAt(0)}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const reader = new FileReader();
                    if (e.target.files?.[0]) {
                      reader.onload = () => setProfileForm(p => ({ ...p, Foto: reader.result as string }));
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }} />
                  <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-black text-white p-3 rounded-2xl shadow-lg hover:scale-110 transition-transform"><Camera size={18} /></button>
                </div>
                <h2 className="mt-6 text-3xl font-black tracking-tighter uppercase">{currentUser.Nome}</h2>
                <div className="mt-2 flex items-center gap-2 text-white/60 font-bold uppercase text-[10px] tracking-widest"><Shield size={12} /> {currentUser.Role} • {currentUser.Time}</div>
              </div>
              <div className="p-10 space-y-12">
                <form onSubmit={(e) => { e.preventDefault(); updateProfile(profileForm); alert("Perfil Salvo!"); }} className="space-y-8">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><UserIcon size={12} /> Nome Completo</label>
                    <input className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={profileForm.Nome || ''} onChange={e => setProfileForm({...profileForm, Nome: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><Phone size={12} /> Telefone</label>
                      <input className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={profileForm.Telefone || ''} onChange={e => setProfileForm({...profileForm, Telefone: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><Calendar size={12} /> Nascimento</label>
                      <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={profileForm.DataNascimento || ''} onChange={e => setProfileForm({...profileForm, DataNascimento: e.target.value})} />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-[#8B1B1F] text-white py-6 rounded-[35px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-4"><Save size={20} /> Salvar Alterações</button>
                </form>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout currentUser={currentUser} currentView={currentView} notifications={[]} onNavigate={setCurrentView} onLogout={logout}>
      {renderContent()}

      {/* Modal Unificado de Conclusão para Table View */}
      {selectedTaskToComplete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50">
               <h3 className="text-xl font-black text-[#111111] uppercase tracking-tighter">Concluir Obrigação</h3>
               <button onClick={() => setSelectedTaskToComplete(null)} className="text-gray-300 hover:text-gray-500 transition-colors"><X size={24}/></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="bg-[#8B1B1F] p-6 rounded-3xl text-white">
                  <p className="text-[10px] font-black uppercase text-white/50 mb-1">Tarefa Selecionada:</p>
                  <p className="text-lg font-bold leading-tight">{selectedTaskToComplete.Titulo}</p>
               </div>
               <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Justificativa / Nota de Entrega</label>
                  <textarea 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-[#8B1B1F]/10 outline-none min-h-[120px]"
                    placeholder="Descreva brevemente o que foi realizado para auditoria..."
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                  />
               </div>
               <button 
                  onClick={handleConfirmCompletion}
                  className="w-full bg-[#8B1B1F] text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#6F0F14] transition-all shadow-xl flex items-center justify-center gap-3"
               >
                  <Send size={20} /> Finalizar Entrega
               </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
