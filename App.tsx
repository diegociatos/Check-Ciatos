
import React, { useState, useMemo } from 'react';
import { useStore, getTodayStr } from './store.ts';
import { ViewType, UserRole, TaskStatus } from './types.ts';
import Login from './components/Login.tsx';
import PrimeiroAcesso from './components/PrimeiroAcesso.tsx';
import Layout from './components/Layout.tsx';
import Dashboard from './components/Dashboard.tsx';
import MyScoreView from './components/MyScoreView.tsx';
import DeliveryChecklist from './components/DeliveryChecklist.tsx';
import ManageUsersView from './components/ManageUsersView.tsx';
import TemplateManager from './components/TemplateManager.tsx';
import TaskSupervisionView from './components/TaskSupervisionView.tsx';
import HelpCenterView from './components/HelpCenterView.tsx';
import BotHistoryView from './components/BotHistoryView.tsx';
import MyProfileView from './components/MyProfileView.tsx';
import PlatformClientsView from './components/PlatformClientsView.tsx';
import EquipeView from './components/EquipeView.tsx';
import MinhasTarefasView from './components/MinhasTarefasView.tsx';
import RelatoriosView from './components/RelatoriosView.tsx';
import BonusRulesView from './components/BonusRulesView.tsx';
import ExecutiveDashboardView from './components/ExecutiveDashboardView.tsx';

const App: React.FC = () => {
  const store = useStore();
  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');

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

  // Primeiro acesso: senha provisória (padrão 123456) precisa ser trocada antes de usar o app
  if (store.currentUser.SenhaProvisoria) {
    return <PrimeiroAcesso user={store.currentUser} onDefinir={store.definirNovaSenha} onLogout={store.logout} />;
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
            bonusRules={store.bonusRules}
          />
        );

      case 'MY_SCORE':
        return <MyScoreView ledger={ledger.filter(l => l.UserEmail === currentUser.Email)} user={currentUser} />;

      case 'MY_PROFILE':
        return <MyProfileView user={currentUser} onUpdate={store.updateProfile} />;

      case 'EQUIPE':
        return <EquipeView users={users} tasks={visibleTasks} ledger={ledger} collaboratorsList={collaboratorsList} onValorar={store.valorarTarefaPessoal} />;

      case 'MINHAS_TAREFAS':
        return (
          <MinhasTarefasView
            currentUser={currentUser}
            tasks={visibleTasks}
            users={users}
            onComplete={store.completeTask}
            currentUserRole={currentUser.Role}
            onCriarPessoal={store.criarTarefaPessoal}
            onConcluirPessoal={store.concluirTarefaPessoal}
            onReabrirPessoal={store.reabrirTarefaPessoal}
            onExcluirPessoal={store.excluirTarefaPessoal}
            onDefinirAndamento={store.definirAndamento}
          />
        );

      case 'RELATORIOS':
        return <RelatoriosView tasks={tasks} ledger={ledger} users={users} collaboratorsList={collaboratorsList} bonusRules={store.bonusRules} />;

      case 'BONUS_RULES':
        return (
          <BonusRulesView
            rules={store.bonusRules}
            onSave={store.saveBonusRules}
            empresaNome={store.empresaAtual?.Nome}
            activeEmpresa={store.activeEmpresa}
          />
        );

      case 'EXECUTIVE_DASHBOARD':
        return (
          <ExecutiveDashboardView
            tasks={tasks}
            ledger={ledger}
            collaborators={collaboratorsList}
            bonusRules={store.bonusRules}
            empresaNome={store.empresaAtual?.Nome}
          />
        );

      case 'CHECK_DELIVERIES':
        return <DeliveryChecklist tasks={visibleTasks} onAudit={store.auditTask} />;

      case 'MANAGE_USERS':
        return (
          <ManageUsersView
            users={users}
            currentUser={currentUser}
            onAddUser={store.addUser}
            onUpdateUser={store.updateUser}
            onResetPassword={store.resetUserPassword}
            onToggleStatus={store.toggleUserStatus}
            onDeleteUser={store.deleteUser}
            onChangeEmail={store.changeUserEmail}
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
            onUpdate={store.updateTemplate}
            onToggle={store.toggleTemplate}
            onDelete={store.deleteTemplate}
            onGenerateNow={store.generateTaskFromTemplate}
          />
        );

      case 'TASK_SUPERVISION':
        return <TaskSupervisionView tasks={visibleTasks} users={users} onDeleteTask={store.deleteTask} onAuditTask={store.auditTask} />;

      case 'HELP_CENTER':
        return <HelpCenterView currentUser={currentUser} />;

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
