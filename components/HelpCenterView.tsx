
import React, { useState, useEffect } from 'react';
import { 
  Book, 
  ShieldCheck, 
  Target, 
  AlertTriangle, 
  Users, 
  Key, 
  ChevronRight, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  FileText,
  CalendarClock,
  Zap,
  MessageSquare,
  UserPlus,
  BarChart3,
  Phone
} from 'lucide-react';
import { User, UserRole } from '../types';

interface HelpCenterViewProps {
  currentUser: User;
}

const HelpCenterView: React.FC<HelpCenterViewProps> = ({ currentUser }) => {
  type TabType = 'COLABORADOR' | 'GESTOR' | 'ADMIN';
  
  const getInitialTab = (): TabType => {
    if (currentUser.Role === UserRole.ADMIN) return 'ADMIN';
    if (currentUser.Role === UserRole.GESTOR) return 'GESTOR';
    return 'COLABORADOR';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());

  const cardStyle = "bg-[#F3F3F3] p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col";
  const iconBoxStyle = "h-14 w-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform text-[#8B1B1F]";
  const titleStyle = "text-lg font-ciatos font-bold text-[#8B1B1F] uppercase tracking-tighter mb-4";
  const textStyle = "text-sm text-gray-600 leading-relaxed font-medium";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-24">
      {/* Header Visual */}
      <div className="bg-[#8B1B1F] p-12 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-ciatos font-bold uppercase tracking-tight mb-2">Guia do Usuário</h2>
          <p className="text-white/70 font-medium text-lg">Sua jornada de alta performance no Grupo Ciatos começa aqui.</p>
        </div>
        <Book size={120} className="absolute right-10 top-1/2 -translate-y-1/2 opacity-10" />
      </div>

      {/* Navegação por Abas */}
      <div className="flex bg-white p-2 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('COLABORADOR')}
          className={`flex-1 min-w-[150px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            activeTab === 'COLABORADOR' ? 'bg-[#8B1B1F] text-white shadow-lg' : 'text-gray-400 hover:text-[#111111]'
          }`}
        >
          <CheckCircle size={14} /> Sou Colaborador
        </button>
        <button
          onClick={() => setActiveTab('GESTOR')}
          className={`flex-1 min-w-[150px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            activeTab === 'GESTOR' ? 'bg-[#8B1B1F] text-white shadow-lg' : 'text-gray-400 hover:text-[#111111]'
          }`}
        >
          <ShieldCheck size={14} /> Sou Gestor
        </button>
        <button
          onClick={() => setActiveTab('ADMIN')}
          className={`flex-1 min-w-[150px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            activeTab === 'ADMIN' ? 'bg-[#8B1B1F] text-white shadow-lg' : 'text-gray-400 hover:text-[#111111]'
          }`}
        >
          <Zap size={14} /> Sou Admin
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'COLABORADOR' && (
          <>
            <div className={cardStyle}>
              <div className={iconBoxStyle}><CalendarClock size={28} /></div>
              <h4 className={titleStyle}>Minha Rotina</h4>
              <p className={textStyle}>
                Acesse <strong>"Minhas Tarefas de Hoje"</strong>. Realize a obrigação e clique em <strong>CHECK</strong>. 
                Lembre-se: tarefas feitas no prazo valem 50 pontos ou mais! É o seu comprometimento diário.
              </p>
            </div>
            <div className={cardStyle}>
              <div className={iconBoxStyle}><TrendingUp size={28} /></div>
              <h4 className={titleStyle}>Meu Score</h4>
              <p className={textStyle}>
                Acompanhe seu termômetro em <strong>"Minha Pontuação"</strong>. 
                Mantenha-se acima de <strong>90%</strong> para garantir bônus semestrais e evitar advertências operacionais.
              </p>
            </div>
            <div className={cardStyle}>
              <div className={iconBoxStyle}><AlertTriangle size={28} /></div>
              <h4 className={titleStyle}>Penalidades</h4>
              <p className={textStyle}>
                Atrasos perdem o dobro de pontos. Não realizar perde <strong>5x o valor base</strong>. 
                Qualidade e pontualidade são os pilares fundamental do nosso grupo.
              </p>
            </div>
          </>
        )}

        {activeTab === 'GESTOR' && (
          <>
            <div className={cardStyle}>
              <div className={iconBoxStyle}><FileText size={28} /></div>
              <h4 className={titleStyle}>Auditoria de Entregas</h4>
              <p className={textStyle}>
                Em <strong>"Conferir Entregas"</strong>, valide o que seu time produziu. 
                Você tem o poder soberano de <strong>Aprovar, Reprovar ou dar Pontuação Parcial</strong> com feedback detalhado.
              </p>
            </div>
            <div className={cardStyle}>
              <div className={iconBoxStyle}><Users size={28} /></div>
              <h4 className={titleStyle}>Gestão de Equipe</h4>
              <p className={textStyle}>
                Use o <strong>"Painel de Confiabilidade"</strong> para identificar quem precisa de treinamento ou feedback imediato. 
                Seja o mentor que sua equipe precisa para bater as metas de RH.
              </p>
            </div>
            <div className={cardStyle}>
              <div className={iconBoxStyle}><MessageSquare size={28} /></div>
              <h4 className={titleStyle}>Cultura de Feedback</h4>
              <p className={textStyle}>
                Sempre que aplicar uma penalidade (3x ou 5x), descreva o motivo. Isso evita ruídos de comunicação 
                e educa o colaborador sobre o padrão de excelência Ciatos.
              </p>
            </div>
          </>
        )}

        {activeTab === 'ADMIN' && (
          <>
            <div className={cardStyle}>
              <div className={iconBoxStyle}><BarChart3 size={28} /></div>
              <h4 className={titleStyle}>Visão Executiva</h4>
              <p className={textStyle}>
                Acompanhe a saúde de <strong>todos os departamentos</strong> e a performance consolidada dos gestores em tempo real. 
                Tome decisões baseadas em dados reais de entrega.
              </p>
            </div>
            <div className={cardStyle}>
              <div className={iconBoxStyle}><UserPlus size={28} /></div>
              <h4 className={titleStyle}>Gestão de Acessos</h4>
              <p className={textStyle}>
                Cadastre novos usuários com a senha padrão <strong>123456</strong> e vincule-os obrigatoriamente 
                aos seus respectivos gestores para que o fluxo de auditoria funcione.
              </p>
            </div>
            <div className={cardStyle}>
              <div className={iconBoxStyle}><ShieldCheck size={28} /></div>
              <h4 className={titleStyle}>Governança Master</h4>
              <p className={textStyle}>
                Você é responsável por manter os <strong>Templates de Tarefas Recorrentes</strong> atualizados, 
                garantindo que o sistema gere as obrigações automaticamente todos os dias.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer / Suporte */}
      <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 bg-[#8B1B1F]/5 text-[#8B1B1F] rounded-full flex items-center justify-center">
            <HelpCircle size={32} />
          </div>
          <div>
            <h4 className="text-xl font-bold text-[#111111] uppercase tracking-tighter">Dúvidas ou Problemas Técnicos?</h4>
            <p className="text-sm text-gray-400 font-medium">Nossa equipe de Controladoria está pronta para ajudar você.</p>
          </div>
        </div>
        <a 
          href="mailto:controladoria@grupociatos.com.br?subject=Dúvida no Sistema de Checklist"
          className="bg-[#8B1B1F] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#6F0F14] transition-all flex items-center gap-3 shadow-xl shadow-[#8B1B1F]/20"
        >
          <Phone size={18} /> Falar com a Controladoria
        </a>
      </div>
    </div>
  );
};

export default HelpCenterView;
