
import React, { useState } from 'react';
import { Menu, X, LogOut, User as UserIcon, Bell, ArrowLeft, HelpCircle, ChevronDown, Home, CheckCircle, ClipboardCheck, Zap, Star } from 'lucide-react';
import { NAVIGATION_ITEMS, NavigationSection } from '../constants';
// Fixed: Notification interface is now imported from types.ts
import { User, ViewType, Notification, UserRole } from '../types';

interface LayoutProps {
  currentUser: User;
  currentView: ViewType;
  notifications: Notification[];
  onNavigate: (view: ViewType) => void;
  children: React.ReactNode;
  onLogout: () => void;
  isPlataforma?: boolean;
  empresaNome?: string;
  onExitEmpresa?: () => void;
  empresas?: { id: string; Nome: string }[];
  activeEmpresa?: string | null;
  onSwitchEmpresa?: (id: string) => void;
  naoLidas?: number;
  onOpenNotifications?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ currentUser, currentView, notifications, onNavigate, children, onLogout, isPlataforma, empresaNome, onExitEmpresa, empresas = [], activeEmpresa, onSwitchEmpresa, naoLidas = 0, onOpenNotifications }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const viewTitles: Record<string, string> = { MY_PROFILE: 'Meus dados', HELP_CENTER: 'Manual de uso', CLIENTES: 'Clientes' };
  const headerTitle = viewTitles[currentView] || NAVIGATION_ITEMS.find(i => i.view === currentView)?.label || 'Painel';

  // Plataforma e Master enxergam o menu completo (equivalente ao Admin) dentro da empresa.
  const navRole = (currentUser.Role === UserRole.PLATAFORMA || currentUser.Role === UserRole.MASTER)
    ? UserRole.ADMIN : currentUser.Role;
  const naEmpresa = !isPlataforma || !!empresaNome; // plataforma fora de empresa = só painel de clientes
  const filteredNav = naEmpresa ? NAVIGATION_ITEMS.filter(item => item.role.includes(navRole)) : [];

  // Atalhos da barra inferior (mobile) — zona do polegar
  const ehGestao = [UserRole.ADMIN, UserRole.PLATAFORMA, UserRole.MASTER, UserRole.GESTOR].includes(currentUser.Role);
  const bottomItems: { view: ViewType; label: string; icon: React.ReactNode }[] = ehGestao
    ? [
        { view: 'DASHBOARD', label: 'Início', icon: <Home size={22} /> },
        { view: 'CHECK_DELIVERIES', label: 'Conferir', icon: <ClipboardCheck size={22} /> },
        { view: 'MANAGE_TEMPLATES', label: 'Gerar', icon: <Zap size={22} /> },
      ]
    : [
        { view: 'DASHBOARD', label: 'Início', icon: <Home size={22} /> },
        { view: 'MY_TASKS_TODAY', label: 'Tarefas', icon: <CheckCircle size={22} /> },
        { view: 'MY_SCORE', label: 'Pontos', icon: <Star size={22} /> },
      ];
  const myNotifications = notifications.filter(n => n.to === currentUser.Email);

  const sections: NavigationSection[] = ['GERAL', 'GESTÃO', 'ADMINISTRAÇÃO'];

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFFFFF]">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#F3F3F3] text-[#111111] border-r border-gray-200 transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 p-6 border-b border-gray-200">
            <div className="h-10 w-10 bg-[#8B1B1F] rounded-lg flex items-center justify-center font-bold text-xl text-white overflow-hidden shrink-0">
               <span className="font-black">GC</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold leading-tight text-[#111111] truncate">{empresaNome || (isPlataforma ? 'Plataforma' : 'Checklist Diário')}</h1>
              <p className="text-xs text-gray-500 font-medium">Checklist Diário</p>
            </div>
          </div>

          {!isPlataforma && empresas.length > 1 && (
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-100/40">
              <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Empresa que você atende</label>
              <select
                value={activeEmpresa || ''}
                onChange={e => onSwitchEmpresa?.(e.target.value)}
                className="mt-1 w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#8B1B1F]/20"
              >
                {empresas.map(e => <option key={e.id} value={e.id}>{e.Nome}</option>)}
              </select>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
            {sections.map(section => {
              const sectionItems = filteredNav.filter(item => item.section === section);
              if (sectionItems.length === 0) return null;

              return (
                <div key={section} className="space-y-1">
                  <h3 className="px-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
                    {section}
                  </h3>
                  {sectionItems.map((item) => (
                    <button
                      key={item.view}
                      onClick={() => {
                        onNavigate(item.view);
                        setIsSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold leading-tight text-left transition-all
                        ${currentView === item.view
                          ? 'bg-[#8B1B1F] text-white shadow-md shadow-[#8B1B1F]/20'
                          : 'text-gray-600 hover:bg-gray-200 hover:text-[#111111]'}
                      `}
                    >
                      <span className={`shrink-0 ${currentView === item.view ? 'text-white' : 'text-gray-400 group-hover:text-[#111111]'}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isPlataforma && empresaNome && (
          <div className="bg-[#8B1B1F] text-white px-4 lg:px-8 py-2 flex items-center justify-between text-sm shrink-0">
            <span>Você está gerenciando: <strong>{empresaNome}</strong></span>
            <button onClick={onExitEmpresa} className="inline-flex items-center gap-1.5 font-semibold hover:underline">
              <ArrowLeft size={15} /> Voltar aos clientes
            </button>
          </div>
        )}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-[#8B1B1F] rounded-md flex items-center justify-center text-white text-[10px] font-black lg:hidden">GC</div>
              <h2 className="text-xl text-stone-900">{headerTitle}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative">
             <button
                onClick={() => { const abrindo = !isNotificationsOpen; setIsNotificationsOpen(abrindo); setIsUserMenuOpen(false); if (abrindo) onOpenNotifications?.(); }}
                className="p-2 hover:bg-gray-100 rounded-lg relative text-gray-500"
             >
               <Bell size={20} />
               {naoLidas > 0 && (
                 <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-[#C62828] text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
                   {naoLidas > 9 ? '9+' : naoLidas}
                 </span>
               )}
             </button>

             {/* Menu do usuário (canto superior direito) */}
             <button
               onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNotificationsOpen(false); }}
               className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
             >
               <div className="h-9 w-9 rounded-full bg-[#8B1B1F] text-white flex items-center justify-center overflow-hidden text-sm font-semibold shrink-0">
                 {currentUser.Foto ? <img src={currentUser.Foto} className="w-full h-full object-cover" alt="" /> : currentUser.Nome.charAt(0).toUpperCase()}
               </div>
               <span className="hidden sm:block text-sm font-semibold text-stone-800 max-w-[130px] truncate">{currentUser.Nome.split(' ')[0]}</span>
               <ChevronDown size={16} className="hidden sm:block text-stone-400" />
             </button>

             {isUserMenuOpen && (
               <>
                 <div className="fixed inset-0 z-[60]" onClick={() => setIsUserMenuOpen(false)} />
                 <div className="absolute right-0 top-14 w-64 bg-white rounded-2xl border border-gray-200 shadow-2xl z-[70] overflow-hidden">
                   <div className="p-4 border-b border-gray-100">
                     <p className="text-sm font-semibold text-stone-900 truncate">{currentUser.Nome}</p>
                     <p className="text-xs text-stone-400 truncate">{currentUser.Email}</p>
                     <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#8B1B1F]/10 text-[#8B1B1F] uppercase tracking-wider">{currentUser.Role}</span>
                   </div>
                   <div className="py-1">
                     <button onClick={() => { onNavigate('MY_PROFILE'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-gray-50 transition-colors">
                       <UserIcon size={16} className="text-stone-400" /> Meus dados
                     </button>
                     <button onClick={() => { onNavigate('HELP_CENTER'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-gray-50 transition-colors">
                       <HelpCircle size={16} className="text-stone-400" /> Manual de uso
                     </button>
                   </div>
                   <div className="py-1 border-t border-gray-100">
                     <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#C62828] hover:bg-red-50 transition-colors">
                       <LogOut size={16} /> Sair da conta
                     </button>
                   </div>
                 </div>
               </>
             )}

             {isNotificationsOpen && (
               <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-gray-200 shadow-2xl z-[70] overflow-hidden">
                 <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                   <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Notificações</h4>
                   <button onClick={() => setIsNotificationsOpen(false)} className="text-gray-400"><X size={16}/></button>
                 </div>
                 <div className="max-h-96 overflow-y-auto">
                    {myNotifications.length > 0 ? (
                      myNotifications.map(n => (
                        <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <p className="text-[10px] font-black text-[#8B1B1F] uppercase mb-1">{n.subject}</p>
                          <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{n.body}</p>
                          <p className="text-[9px] text-gray-400 mt-2 font-medium">{new Date(n.date).toLocaleString()}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center">
                        <p className="text-sm text-gray-300 font-bold">Sem novos alertas</p>
                      </div>
                    )}
                 </div>
               </div>
             )}
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto p-4 lg:p-8 bg-[#FFFFFF] ${naEmpresa ? 'pb-24 lg:pb-8' : ''}`}>
          {children}
        </main>
      </div>

      {/* Barra inferior de atalhos (mobile) */}
      {naEmpresa && bottomItems.length > 0 && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
          {bottomItems.map(it => {
            const active = currentView === it.view;
            return (
              <button
                key={it.view}
                onClick={() => { onNavigate(it.view); setIsSidebarOpen(false); }}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${active ? 'text-[#8B1B1F]' : 'text-stone-400'}`}
              >
                {it.icon}
                <span className="text-[10px] font-semibold">{it.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};

export default Layout;
