
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from './store';
import { ViewType, UserRole, TaskStatus, TaskPriority, User, Task, UserStatus, ReportFilter } from './types';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TodayTaskCards from './components/TodayTaskCards';
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
  User as UserIcon, Camera, Phone, Calendar, Save, Shield, ListFilter, CheckCircle2, Lock, ShieldCheck, Key
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

  // FILTROS HIERÁRQUICOS CENTRAIS (USER REQUESTED)
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

  // FORÇA TROCA DE SENHA NO PRIMEIRO ACESSO
  if (currentUser.SenhaProvisoria) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#8B1B1F] font-ciatos">
        <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden p-10 space-y-8 animate-in zoom-in duration-300">
           <div className="text-center space-y-4">
              <div className="h-20 w-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                 <Lock size={40} />
              </div>
              <h2 className="text-2xl font-bold text-[#111111] uppercase tracking-tighter">Alterar Senha Obrigatória</h2>
              <p className="text-sm text-gray-500">Por segurança, você precisa criar uma nova senha personalizada.</p>
           </div>
           <div className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Key size={12}/> Senha Atual</label>
                 <input type="password" border-gray-200 rounded-2xl p-4 className="w-full bg-gray-50 border p-4 rounded-2xl outline-none" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={12}/> Nova Senha</label>
                 <input type="password" placeholder="Mínimo 8 caracteres" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} />
              </div>
           </div>
           <button onClick={() => changePassword(currentUser.Email, passwordForm.current, passwordForm.new)} className="w-full bg-[#8B1B1F] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-[#6F0F14] transition-colors">Salvar e Continuar</button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
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
        // USER REQUEST: [Responsavel] = USEREMAIL() e [Status] diferente de 'Aprovado'
        const myTasksToProcess = tasks.filter(t => t.Responsavel === currentUser.Email && t.Status !== TaskStatus.APROVADA);
        
        return (
          <div className="flex flex-col gap-0 -m-4 lg:-m-8 animate-in fade-in duration-500 font-ciatos">
            <div className="bg-[#8B1B1F] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4 opacity-70">
                    <ListFilter size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Fluxo de Excelência</span>
                  </div>
                  <h3 className="text-4xl lg:text-5xl font-bold tracking-tight uppercase mb-2">Minhas Tarefas</h3>
                  <p className="text-white/60 font-medium text-lg">Obrigações pendentes de conclusão ou aguardando auditoria.</p>
               </div>
            </div>
            <div className="p-4 lg:p-8 space-y-8">
              {myTasksToProcess.length > 0 ? (
                <TodayTaskCards 
                  tasks={myTasksToProcess} 
                  allTasks={tasks}
                  onComplete={completeTask} 
                  currentUserRole={currentUser.Role}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                  <CheckCircle2 size={64} className="text-gray-100 mb-4" />
                  <h3 className="text-xl font-bold text-gray-300 uppercase font-ciatos">Tudo em conformidade!</h3>
                  <p className="text-gray-300 text-sm mt-1">Nenhuma pendência para o seu perfil.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'TASK_SUPERVISION':
        return <TaskSupervisionView tasks={visibleTasks} users={users} onDeleteTask={deleteTask} currentUserRole={currentUser.Role} />;

      case 'CHECK_DELIVERIES':
        return <DeliveryChecklist tasks={visibleTasks} onAudit={auditTask} />;

      case 'MANAGE_USERS':
        return <ManageUsersView 
          users={users} 
          onAddUser={addUser} 
          onUpdateUser={updateUser}
          onResetPassword={resetUserPassword} 
          onToggleStatus={toggleUserStatus} 
          onDeleteUser={deleteUser} 
        />;

      case 'COMPLETED_TASKS':
        const approvedOnly = visibleTasks.filter(t => t.Status === TaskStatus.APROVADA);
        return (
          <div className="flex flex-col gap-0 -m-4 lg:-m-8 animate-in fade-in duration-500 font-ciatos">
            <div className="bg-[#8B1B1F] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
               <h3 className="text-4xl font-bold uppercase mb-2">Histórico de Aprovadas</h3>
               <p className="text-white/60 font-medium text-lg">Registro de excelência corporativa.</p>
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
    </Layout>
  );
};

export default App;
