
import React from 'react';
import { 
  Home, 
  CheckCircle, 
  AlertTriangle, 
  CheckCheck, 
  Star, 
  Info, 
  PlusCircle, 
  ClipboardList, 
  Users, 
  BarChart3, 
  List, 
  UserCog, 
  Receipt, 
  Edit3,
  RotateCw,
  User as UserIcon,
  ShieldCheck,
  ClipboardCheck
} from 'lucide-react';
import { UserRole, ViewType } from './types';

export const COLORS = {
  primary: '#8B1B1F',
  accent: '#6F0F14',
  bg: '#FFFFFF',
  text: '#111111',
  secondaryBg: '#F3F3F3'
};

export type NavigationSection = 'INÍCIO' | 'COLABORADOR' | 'GESTOR' | 'ADMINISTRADOR';

export interface NavigationItem {
  label: string;
  view: ViewType;
  role: UserRole[];
  icon: React.ReactNode;
  section: NavigationSection;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  // SEÇÃO: INÍCIO
  { 
    label: 'Dashboard Principal', 
    view: 'DASHBOARD', 
    section: 'INÍCIO',
    role: [UserRole.COLABORADOR, UserRole.GESTOR, UserRole.ADMIN], 
    icon: <Home size={20} /> 
  },
  { 
    label: 'Meus Dados', 
    view: 'MY_PROFILE', 
    section: 'INÍCIO',
    role: [UserRole.COLABORADOR, UserRole.GESTOR, UserRole.ADMIN], 
    icon: <UserIcon size={20} /> 
  },

  // SEÇÃO: COLABORADOR
  { 
    label: 'Minhas Tarefas de Hoje', 
    view: 'MY_TASKS_TODAY', 
    section: 'COLABORADOR',
    role: [UserRole.COLABORADOR, UserRole.GESTOR, UserRole.ADMIN], 
    icon: <CheckCircle size={20} /> 
  },
  { 
    label: 'Tarefas Atrasadas', 
    view: 'OVERDUE_TASKS', 
    section: 'COLABORADOR',
    role: [UserRole.COLABORADOR, UserRole.GESTOR, UserRole.ADMIN], 
    icon: <AlertTriangle size={20} /> 
  },
  { 
    label: 'Tarefas Concluídas', 
    view: 'COMPLETED_TASKS', 
    section: 'COLABORADOR',
    role: [UserRole.COLABORADOR, UserRole.GESTOR, UserRole.ADMIN], 
    icon: <CheckCheck size={20} /> 
  },
  { 
    label: 'Minha Pontuação', 
    view: 'MY_SCORE', 
    section: 'COLABORADOR',
    role: [UserRole.COLABORADOR, UserRole.GESTOR, UserRole.ADMIN], 
    icon: <Star size={20} /> 
  },
  { 
    label: 'Regras de Pontuação', 
    view: 'RULES', 
    section: 'COLABORADOR',
    role: [UserRole.COLABORADOR, UserRole.GESTOR, UserRole.ADMIN], 
    icon: <Info size={20} /> 
  },
  
  // SEÇÃO: GESTOR
  { 
    label: 'Conferir Entregas', 
    view: 'CHECK_DELIVERIES', 
    section: 'GESTOR',
    role: [UserRole.GESTOR, UserRole.ADMIN], 
    icon: <ClipboardCheck size={20} /> 
  },
  { 
    label: 'Criar Obrigação', 
    view: 'CREATE_TASK', 
    section: 'GESTOR',
    role: [UserRole.GESTOR, UserRole.ADMIN], 
    icon: <PlusCircle size={20} /> 
  },
  { 
    label: 'Programar Recorrências', 
    view: 'MANAGE_TEMPLATES', 
    section: 'GESTOR',
    role: [UserRole.GESTOR, UserRole.ADMIN], 
    icon: <RotateCw size={20} /> 
  },
  { 
    label: 'Pendências que Criei', 
    view: 'CREATED_BY_ME', 
    section: 'GESTOR',
    role: [UserRole.GESTOR, UserRole.ADMIN], 
    icon: <ClipboardList size={20} /> 
  },
  { 
    label: 'Painel do Time', 
    view: 'TEAM_PANEL', 
    section: 'GESTOR',
    role: [UserRole.GESTOR, UserRole.ADMIN], 
    icon: <Users size={20} /> 
  },
  { 
    label: 'Ranking de Produtividade', 
    view: 'RANKING', 
    section: 'GESTOR',
    role: [UserRole.GESTOR, UserRole.ADMIN], 
    icon: <BarChart3 size={20} /> 
  },

  // SEÇÃO: ADMINISTRADOR
  { 
    label: 'Todas as Tarefas', 
    view: 'ALL_TASKS', 
    section: 'ADMINISTRADOR',
    role: [UserRole.ADMIN], 
    icon: <List size={20} /> 
  },
  { 
    label: 'Gerenciar Usuários', 
    view: 'MANAGE_USERS', 
    section: 'ADMINISTRADOR',
    role: [UserRole.ADMIN], 
    icon: <UserCog size={20} /> 
  },
  { 
    label: 'Gerenciar Acessos', 
    view: 'MANAGE_ACCESS', 
    section: 'ADMINISTRADOR',
    role: [UserRole.ADMIN], 
    icon: <ShieldCheck size={20} /> 
  },
  { 
    label: 'Extrato Geral de Pontos', 
    view: 'GENERAL_LEDGER', 
    section: 'ADMINISTRADOR',
    role: [UserRole.ADMIN], 
    icon: <Receipt size={20} /> 
  },
  { 
    label: 'Ajuste Manual de Pontos', 
    view: 'MANUAL_ADJUSTMENT', 
    section: 'ADMINISTRADOR',
    role: [UserRole.ADMIN], 
    icon: <Edit3 size={20} /> 
  },
];
