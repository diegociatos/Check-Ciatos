
import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useStore, getTodayStr } from './store.ts';
import { ViewType, UserRole, TaskStatus } from './types.ts';
import Login from './components/Login.tsx';
import PrimeiroAcesso from './components/PrimeiroAcesso.tsx';
import Layout from './components/Layout.tsx';
const Dashboard = lazy(() => import('./components/Dashboard.tsx'));
const MyScoreView = lazy(() => import('./components/MyScoreView.tsx'));
const DeliveryChecklist = lazy(() => import('./components/DeliveryChecklist.tsx'));
const ManageUsersView = lazy(() => import('./components/ManageUsersView.tsx'));
const TemplateManager = lazy(() => import('./components/TemplateManager.tsx'));
const TaskSupervisionView = lazy(() => import('./components/TaskSupervisionView.tsx'));
const HelpCenterView = lazy(() => import('./components/HelpCenterView.tsx'));
const BotHistoryView = lazy(() => import('./components/BotHistoryView.tsx'));
const MyProfileView = lazy(() => import('./components/MyProfileView.tsx'));
const PlatformClientsView = lazy(() => import('./components/PlatformClientsView.tsx'));
const EquipeView = lazy(() => import('./components/EquipeView.tsx'));
const MinhasTarefasView = lazy(() => import('./components/MinhasTarefasView.tsx'));
const RelatoriosView = lazy(() => import('./components/RelatoriosView.tsx'));
const BonusRulesView = lazy(() => import('./components/BonusRulesView.tsx'));
const ExecutiveDashboardView = lazy(() => import('./components/ExecutiveDashboardView.tsx'));
const MonthlyClosingView = lazy(() => import('./components/MonthlyClosingView.tsx'));
const PlanoArmazenamentoView = lazy(() => import('./components/PlanoArmazenamentoView.tsx'));
const CalendarioView = lazy(() => import('./components/CalendarioView.tsx'));
const KanbanView = lazy(() => import('./components/KanbanView.tsx'));
import { planoPermiteAnexos } from './lib/storage.ts';

const App: React.FC = () => {
  const store = useStore();
  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');

  // Hooks must be called before any conditional returns
  const visibleTasks = useMemo(() => {
    if (!store.currentUser) return [];
    const { currentUser, tasks } = store;
    // Gestão (inclui Gestor) supervisiona a empresa inteira: vê todas as tarefas em escopo
    // (a RLS já isola por empresa), inclusive as que o Master cria para qualquer responsável.
    if ([UserRole.ADMIN, UserRole.PLATAFORMA, UserRole.MASTER, UserRole.GESTOR].includes(currentUser.Role)) return tasks;
    return tasks.filter(t => t.Responsavel === currentUser.Email);
  }, [store.tasks, store.currentUser]);

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
          <div className="h-12 w-12 rounded-2xl bg-marca text-white flex items-center justify-center mx-auto animate-pulse">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true"><path d="M11 12.5l3.5 3.5 7-8" strokeWidth={2.4} strokeOpacity={0.5} /><path d="M3 12.5l4 4 8.5-9.5" /></svg>
          </div>
          <p className="text-stone-400 mt-4 text-sm">Carregando…</p>
        </div>
      </div>
    );
  }

  // Early return for authentication
  if (store.error) {
    return <main className="min-h-dvh flex items-center justify-center bg-fundo p-6">
      <section role="alert" className="max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center">
        <h1 className="text-2xl text-tinta">Não foi possível carregar seus dados</h1>
        <p className="my-4 text-stone-600">{store.error}</p>
        <button onClick={store.retryLoad} className="rounded-xl bg-marca px-5 py-3 text-white">Tentar novamente</button>
        <button onClick={store.logout} className="block mx-auto mt-4 p-2 text-marca">Voltar ao login</button>
      </section>
    </main>;
  }
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
            onTransferir={store.transferirTarefa}
            permiteAnexos={planoPermiteAnexos(store.empresaAtual?.Plano)}
          />
        );

      case 'PLANO':
        return (
          <PlanoArmazenamentoView
            empresa={store.empresaAtual}
            currentUserRole={currentUser.Role}
          />
        );

      case 'CALENDARIO':
        return (
          <CalendarioView
            tasks={visibleTasks}
            currentUser={currentUser}
            users={users}
            currentUserRole={currentUser.Role}
          />
        );

      case 'KANBAN':
        return (
          <KanbanView
            tasks={visibleTasks}
            currentUser={currentUser}
            users={users}
            currentUserRole={currentUser.Role}
            onDefinirAndamento={store.definirAndamento}
            onComplete={store.completeTask}
            permiteAnexos={planoPermiteAnexos(store.empresaAtual?.Plano)}
          />
        );

      case 'RELATORIOS':
        return <RelatoriosView tasks={tasks} ledger={ledger} users={users} collaboratorsList={collaboratorsList} bonusRules={store.bonusRules} empresaNome={store.empresaAtual?.Nome} closings={store.closings} />;

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

      case 'MONTHLY_CLOSING':
        return (
          <MonthlyClosingView
            tasks={tasks}
            ledger={ledger}
            collaborators={collaboratorsList}
            bonusRules={store.bonusRules}
            closings={store.closings}
            empresaNome={store.empresaAtual?.Nome}
            currentUserRole={currentUser.Role}
            onSalvar={store.salvarFechamento}
            onSetStatus={store.setStatusFechamento}
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
            tasks={visibleTasks}
            users={users}
            onAdd={store.addTemplate}
            onUpdate={store.updateTemplate}
            onToggle={store.toggleTemplate}
            onDelete={store.deleteTemplate}
            onGenerateNow={store.generateTaskFromTemplate}
          />
        );

      case 'TASK_SUPERVISION':
        return <TaskSupervisionView tasks={visibleTasks} users={users} onDeleteTask={store.deleteTask} onAuditTask={store.auditTask} onValorar={store.valorarTarefaPessoal} />;

      case 'HELP_CENTER':
        return <HelpCenterView currentUser={currentUser} />;

      case 'BOT_HISTORY':
        return <BotHistoryView logs={botLog} onAudit={store.auditAndFixTasks} />;

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
      <Suspense fallback={<div role="status" className="p-8 text-center text-stone-600">Carregando tela…</div>}>
        {renderView()}
      </Suspense>
    </Layout>
  );
};

export default App;
