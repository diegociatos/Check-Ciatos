
import React, { useState } from 'react';
import { Menu, X, LogOut, User as UserIcon, Bell } from 'lucide-react';
import { NAVIGATION_ITEMS, NavigationSection } from '../constants';
// Fixed: Notification interface is now imported from types.ts
import { User, ViewType, Notification } from '../types';

interface LayoutProps {
  currentUser: User;
  currentView: ViewType;
  notifications: Notification[];
  onNavigate: (view: ViewType) => void;
  children: React.ReactNode;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ currentUser, currentView, notifications, onNavigate, children, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const filteredNav = NAVIGATION_ITEMS.filter(item => item.role.includes(currentUser.Role));
  const myNotifications = notifications.filter(n => n.to === currentUser.Email);

  const sections: NavigationSection[] = ['INÍCIO', 'COLABORADOR', 'GESTOR', 'ADMINISTRADOR'];

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
            <div className="h-10 w-10 bg-[#8B1B1F] rounded-lg flex items-center justify-center font-bold text-xl text-white overflow-hidden">
               <span className="font-black">GC</span>
            </div>
            <div>
              <h1 className="font-bold leading-tight text-[#111111]">Grupo Ciatos</h1>
              <p className="text-xs text-gray-500 font-medium">Checklist Diário</p>
            </div>
          </div>

          <div className="px-6 py-4 flex items-center gap-3 bg-gray-200/30">
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-[#111111] overflow-hidden border-2 border-white shadow-sm">
              {currentUser.Foto ? (
                <img src={currentUser.Foto} className="w-full h-full object-cover" alt="User" />
              ) : (
                <UserIcon size={20} />
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-[#111111] truncate">{currentUser.Nome}</p>
              <p className="text-[10px] text-gray-500 truncate font-bold">{currentUser.Email}</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
            {sections.map(section => {
              const sectionItems = filteredNav.filter(item => item.section === section);
              if (sectionItems.length === 0) return null;

              return (
                <div key={section} className="space-y-1">
                  <h3 className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
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
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
                        ${currentView === item.view 
                          ? 'bg-[#8B1B1F] text-white shadow-md shadow-[#8B1B1F]/20' 
                          : 'text-gray-600 hover:bg-gray-200 hover:text-[#111111]'}
                      `}
                    >
                      <span className={currentView === item.view ? 'text-white' : 'text-gray-400 group-hover:text-[#111111]'}>
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-[#C62828] hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              Sair da Conta
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
              <h2 className="text-lg font-black text-[#111111] uppercase tracking-tighter">
                {NAVIGATION_ITEMS.find(i => i.view === currentView)?.label || 'Dashboard'}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative">
             <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg relative text-gray-500"
             >
               <Bell size={20} />
               {myNotifications.length > 0 && (
                 <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-[#C62828] text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
                   {myNotifications.length}
                 </span>
               )}
             </button>

             <span className="hidden sm:inline-block px-3 py-1 bg-[#8B1B1F] text-white rounded-full text-[10px] font-black uppercase tracking-tighter">
               {currentUser.Role}
             </span>

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

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#FFFFFF]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
