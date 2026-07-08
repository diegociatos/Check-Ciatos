
import React, { useState, useMemo } from 'react';
import { useStore, getTodayStr } from './store.ts';
import { ViewType, UserRole, TaskStatus, ReportFilter } from './types.ts';
import Login from './components/Login.tsx';
import Layout from './components/Layout.tsx';
import Dashboard from './components/Dashboard.tsx';
import TaskList from './components/TaskList.tsx';
import CompletedTasksView from './components/CompletedTasksView.tsx';
import MyScoreView from './components/MyScoreView.tsx';
import PerformanceDashboard from './components/PerformanceDashboard.tsx';
import DeliveryChecklist from './components/DeliveryChecklist.tsx';
import RankingView from './components/RankingView.tsx';
import HRReportView from './components/HRReportView.tsx';
import ExecutiveView from './components/ExecutiveView.tsx';
import ManageUsersView from './components/ManageUsersView.tsx';
import TemplateManager from './components/TemplateManager.tsx';
import TaskSupervisionView from './components/TaskSupervisionView.tsx';
import ScoreSupervisionView from './components/ScoreSupervisionView.tsx';
import IndividualPerformanceDashboard from './components/IndividualPerformanceDashboard.tsx';
import HelpCenterView from './components/HelpCenterView.tsx';
import ReportFiltersView from './components/ReportFiltersView.tsx';
import CollaboratorReportDashboard from './components/CollaboratorReportDashboard.tsx';
import BotHistoryView from './components/BotHistoryView.tsx';
import UpcomingTasksView from './components/UpcomingTasksView.tsx';
import ReliabilityPanel from './components/ReliabilityPanel.tsx';
import TeamPanel from './components/TeamPanel.tsx';
import MyProfileView from './components/MyProfileView.tsx';
import MonthlyPerformanceView from './components/MonthlyPerformanceView.tsx';
import PlatformClientsView from './components/PlatformClientsView.tsx';
import PulsoOperacao from './components/PulsoOperacao.tsx';
import EquipeView from './components/EquipeView.tsx';
import MinhasTarefasView from './components/MinhasTarefasView.tsx';

const App: React.FC = () => {
  const store = useStore();
  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');
  const [selectedReportFilter, setSelectedReportFilter] = useState<ReportFilter | null>(null);

  // Hooks must be called before any conditional returns
  const visibleTasks = useMemo(() => {
    if (!store.currentUser) return [];
    const { currentUser, tasks, users } = store;
    if ([UserRole.ADMIN, UserRole.PLATAFORMA, UserRole.MASTER].includes(currentUser.Role)) return tasks;
    if (currentUser.Role === UserRole.GESTOR) {
      const myCollaborators = users.filter(u => u.Gestor === currentUser.Email).map(u => u.Email);
      return tasks.filter(t => t.Responsavel === currentUser.Email || myCollaborators.includes(t.Responsavel));
    }
    return tasks.filter(t => t.Responsavel === currentUser.Email);
  }, [store.tasks, store.currentUser, store.users]);

  const collaboratorsList = useMemo(() => {
    if (!store.currentUser) return [];
    const { currentUser, users } = store;
    if ([UserRole.ADMIN, UserRole.PLATAFORMA, UserRole.MASTER].includes(currentUser.Role)) return users.filter(u => u.Role === UserRole.COLABORADOR);
    return users.filter(u => u.Role === UserRole.COLABORADOR && u.Gestor === currentUser.Email);
  }, [store.users, store.currentUser]);

  // Tela de carregamento (evita piscar o Login enquanto os dados chegam)
  if (store.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fundo font-ciatos">
        <div className="text-center animate-in fade-in duration-300">
          <div className="h-12 w-12 rounded-2xl bg-marca text-white flex items-center justify-center font-black text-lg mx-auto animate-pulse">GC</div>
          <p className="text-stone-400 mt-4 text-sm">Carregando…</p>
        </div>
      </div>
    );
  }

  // Early return for authentication
  if (!store.currentUser) {
    return <Login onLogin={store.login} />;
  }

  const { currentUser, tasks, users, ledger, templates, botLog } = store;
  const today = getTodayStr();

  // Plataforma sem empresa aberta cai direto no painel de Clientes
  const effectiveView: ViewType = store.isPlataforma && !store.activeEmpresa ? 'CLIENTES' : currentView;

  const enterEmpresa = (empresaId: string) => {
    store.setActiveEmpresa(empresaId);
    setCurrentView('DASHBOARD');
  };

  const renderView = () => {
    switch (effectiveView) {
      case 'CLIENTES':
        return (
          <PlatformClientsView
            empresas={store.empresas}
            users={users}
            onCreate={store.createEmpresa}
            onEnter={enterEmpresa}
            onSuspend={store.suspenderEmpresa}
            onDelete={store.excluirEmpresa}
          />
        );

      case 'DASHBOARD':
        return (
          <Dashboard
            currentUser={currentUser}
            score={currentUser.PontosRealizadosMes || 0}
            pendingTasksToday={visibleTasks.filter(t => t.Responsavel === currentUser.Email && t.Status === TaskStatus.PENDENTE && t.DataLimite_Date === today)}
            recentLedger={ledger.filter(l => l.UserEmail === currentUser.Email).slice(0, 5)}
            myLedger={ledger.filter(l => l.UserEmail === currentUser.Email)}
            onNavigateToTasks={(v?: any) => setCurrentView(v || 'MINHAS_TAREFAS')}
            tasks={visibleTasks}
            currentUserRole={currentUser.Role}
            collaborators={collaboratorsList}
          />
        );

      case 'MONTHLY_PERFORMANCE':
        return (
          <MonthlyPerformanceView 
            tasks={tasks}
            ledger={ledger}
            users={users}
            currentUser={currentUser}
            collaboratorsList={collaboratorsList}
          />
        );

      case 'MY_TASKS_TODAY':
        const myTodayTasks = visibleTasks.filter(t => 
          t.Responsavel === currentUser.Email && 
          t.DataLimite_Date! <= today &&
          (t.Status === TaskStatus.PENDENTE || t.Status === TaskStatus.FEITA_ERRADA || t.Status === TaskStatus.NAO_FEITA)
        );
        return (
          <div className="space-y-6 font-ciatos">
            <h3 className="text-3xl text-stone-900">Obrigações de hoje</h3>
            <TaskList 
              tasks={myTodayTasks.map(t => ({
                ...t,
                NomeColaborador: currentUser.Nome,
                NomeGestor: users.find(u => u.Email === currentUser.Gestor)?.Nome || 'Admin',
                DiasAteVencimento: 0,
                StatusCor: t.Status === TaskStatus.PENDENTE ? 'Orange' : 'Red'
              }))}
              onComplete={store.completeTask}
              currentUserRole={currentUser.Role}
              currentUserEmail={currentUser.Email}
            />
          </div>
        );

      case 'UPCOMING_TASKS':
        const currentMonth = today.substring(0, 7); // YYYY-MM
        const myUpcoming = visibleTasks.filter(t => {
          if (t.Responsavel !== currentUser.Email) return false;
          if (t.Status !== TaskStatus.PENDENTE && t.Status !== TaskStatus.FEITA_ERRADA && t.Status !== TaskStatus.NAO_FEITA) return false;
          // Include: future tasks OR current month overdue tasks
          return t.DataLimite_Date! > today || (t.DataLimite_Date!.startsWith(currentMonth) && t.DataLimite_Date! <= today);
        });
        return (
          <UpcomingTasksView 
            tasks={myUpcoming}
            onComplete={store.completeTask}
            onBack={() => setCurrentView('MY_TASKS_TODAY')}
            currentUserRole={currentUser.Role}
          />
        );

      case 'COMPLETED_TASKS':
        const approvedOnly = visibleTasks.filter(t => t.Status === TaskStatus.APROVADA);
        return (
          <div className="space-y-6">
            <CompletedTasksView tasks={approvedOnly} users={users} currentUserRole={currentUser.Role} />
          </div>
        );

      case 'MY_SCORE':
        return <MyScoreView ledger={ledger.filter(l => l.UserEmail === currentUser.Email)} user={currentUser} />;

      case 'MY_PROFILE':
        return <MyProfileView user={currentUser} onUpdate={store.updateProfile} />;

      case 'PULSO':
        return <PulsoOperacao tasks={visibleTasks} users={users} ledger={ledger} />;

      case 'EQUIPE':
        return <EquipeView users={users} tasks={visibleTasks} ledger={ledger} collaboratorsList={collaboratorsList} />;

      case 'MINHAS_TAREFAS':
        return (
          <MinhasTarefasView
            currentUser={currentUser}
            tasks={visibleTasks}
            users={users}
            onComplete={store.completeTask}
            currentUserRole={currentUser.Role}
          />
        );

      case 'PERFORMANCE_MANAGEMENT':
        return <PerformanceDashboard tasks={visibleTasks} users={users} collaboratorsList={collaboratorsList} />;

      case 'CHECK_DELIVERIES':
        return <DeliveryChecklist tasks={visibleTasks} onAudit={store.auditTask} />;

      case 'RELIABILITY_PANEL':
        return <ReliabilityPanel users={users} tasks={visibleTasks} collaboratorsList={collaboratorsList} />;

      case 'TEAM_PANEL':
        return <TeamPanel users={users} tasks={visibleTasks} collaboratorsList={collaboratorsList} />;

      case 'RANKING':
        return <RankingView users={users} tasks={visibleTasks} collaboratorsList={collaboratorsList} />;

      case 'REPORTS':
        return <HRReportView users={users} />;

      case 'EXECUTIVE_VIEW':
        return <ExecutiveView tasks={tasks} users={users} />;

      case 'MANAGE_USERS':
        return (
          <ManageUsersView
            users={users}
            onAddUser={store.addUser}
            onUpdateUser={store.updateUser}
            onResetPassword={store.resetUserPassword}
            onToggleStatus={store.toggleUserStatus}
            onDeleteUser={store.deleteUser}
            empresas={store.empresas}
            activeEmpresa={store.activeEmpresa}
            onSetEmpresas={store.setUserEmpresas}
            getUserEmpresas={store.getUserEmpresas}
          />
        );

      case 'MANAGE_TEMPLATES':
        return (
          <TemplateManager 
            templates={templates}
            users={users}
            onAdd={store.addTemplate}
            onToggle={store.toggleTemplate}
            onDelete={store.deleteTemplate}
            onGenerateNow={store.generateTaskFromTemplate}
          />
        );

      case 'TASK_SUPERVISION':
        return <TaskSupervisionView tasks={visibleTasks} users={users} onDeleteTask={store.deleteTask} onAuditTask={store.auditTask} />;

      case 'SCORE_SUPERVISION':
        return <ScoreSupervisionView ledger={ledger} users={users} />;

      case 'INDIVIDUAL_PERFORMANCE':
        return <IndividualPerformanceDashboard users={users} tasks={visibleTasks} ledger={ledger} collaboratorsList={collaboratorsList} />;

      case 'HELP_CENTER':
        return <HelpCenterView currentUser={currentUser} />;

      case 'PERIOD_REPORT_FILTERS':
        return <ReportFiltersView currentUser={currentUser} users={users} onGenerate={(f) => { setSelectedReportFilter(f); setCurrentView('PERIOD_REPORT_DASHBOARD'); }} />;

      case 'PERIOD_REPORT_DASHBOARD':
        if (!selectedReportFilter) return null;
        return (
          <CollaboratorReportDashboard 
            filter={selectedReportFilter}
            tasks={tasks}
            ledger={ledger}
            users={users}
            onBack={() => setCurrentView('PERIOD_REPORT_FILTERS')}
          />
        );

      case 'BOT_HISTORY':
        return <BotHistoryView logs={botLog} />;

      default:
        return <div className="p-8 text-center text-gray-400">Página em desenvolvimento</div>;
    }
  };

  return (
    <Layout
      currentUser={currentUser}
      currentView={effectiveView}
      notifications={store.notifications}
      naoLidas={store.notifNaoLidas}
      onOpenNotifications={store.marcarNotificacoesLidas}
      onNavigate={setCurrentView}
      onLogout={store.logout}
      isPlataforma={store.isPlataforma}
      empresaNome={store.empresaAtual?.Nome}
      onExitEmpresa={() => store.setActiveEmpresa(null)}
      empresas={store.isPlataforma ? store.empresas : store.empresas.filter(e => (e.Status || 'Ativa') !== 'Suspensa')}
      activeEmpresa={store.activeEmpresa}
      onSwitchEmpresa={store.setActiveEmpresa}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
