
import React from 'react';
import { 
  Home, 
  CheckCircle, 
  CheckCheck, 
  Star, 
  Users, 
  BarChart3, 
  List, 
  UserCog, 
  User as UserIcon, 
  ShieldCheck, 
  ClipboardCheck, 
  CheckCircle2, 
  TrendingUp, 
  LayoutDashboard, 
  CalendarClock, 
  Eye, 
  FileText, 
  UserCheck, 
  HelpCircle,
  FileBarChart,
  Zap,
  LineChart,
  CalendarDays
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
    label: 'Performance Mensal', 
    view: 'MONTHLY_PERFORMANCE', 
    section: 'INÍCIO',
    role: [UserRole.COLABORADOR, UserRole.GESTOR, UserRole.ADMIN], 
    icon: <LineChart size={20} /> 
  },
  { 
    label: 'Meus Dados', 
    view: 'MY_PROFILE', 
    section: 'INÍCIO',
    role: [UserRole.COLABORADOR, UserRole.GESTOR, UserRole.ADMIN], 
    icon: <UserIcon size={20} /> 
  },
  { 
    label: 'Manual de Uso', 
    view: 'HELP_CENTER', 
    section: 'INÍCIO',
    role: [UserRole.COLABORADOR, UserRole.GESTOR, UserRole.ADMIN], 
    icon: <HelpCircle size={20} /> 
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
    label: 'Planejamento Futuro', 
    view: 'UPCOMING_TASKS', 
    section: 'COLABORADOR',
    role: [UserRole.COLABORADOR, UserRole.GESTOR, UserRole.ADMIN], 
    icon: <CalendarDays size={20} /> 
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
  
  // SEÇÃO: GESTOR
  { 
    label: 'Relatório por Colaborador', 
    view: 'PERIOD_REPORT_FILTERS', 
    section: 'GESTOR',
    role: [UserRole.GESTOR, UserRole.ADMIN], 
    icon: <FileBarChart size={20} /> 
  },
  { 
    label: 'Supervisão de Tarefas', 
    view: 'TASK_SUPERVISION', 
    section: 'GESTOR',
    role: [UserRole.GESTOR, UserRole.ADMIN], 
    icon: <Eye size={20} /> 
  },
  { 
    label: 'Supervisão de Pontos', 
    view: 'SCORE_SUPERVISION', 
    section: 'GESTOR',
    role: [UserRole.GESTOR, UserRole.ADMIN], 
    icon: <FileText size={20} /> 
  },
  { 
    label: 'Performance Individual', 
    view: 'INDIVIDUAL_PERFORMANCE', 
    section: 'GESTOR',
    role: [UserRole.GESTOR, UserRole.ADMIN], 
    icon: <UserCheck size={20} /> 
  },
  { 
    label: 'Gestão de Performance', 
    view: 'PERFORMANCE_MANAGEMENT', 
    section: 'GESTOR',
    role: [UserRole.GESTOR, UserRole.ADMIN], 
    icon: <TrendingUp size={20} /> 
  },
  { 
    label: 'Conferir Entregas', 
    view: 'CHECK_DELIVERIES', 
    section: 'GESTOR',
    role: [UserRole.GESTOR, UserRole.ADMIN], 
    icon: <ClipboardCheck size={20} /> 
  },
  { 
    label: 'Gerenciar Tarefas Recorrentes', 
    view: 'MANAGE_TEMPLATES', 
    section: 'GESTOR',
    role: [UserRole.GESTOR, UserRole.ADMIN], 
    icon: <CalendarClock size={20} /> 
  },
  { 
    label: 'Painel de Confiabilidade', 
    view: 'RELIABILITY_PANEL', 
    section: 'GESTOR',
    role: [UserRole.GESTOR, UserRole.ADMIN], 
    icon: <CheckCircle2 size={20} /> 
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
    label: 'Visão Executiva', 
    view: 'EXECUTIVE_VIEW', 
    section: 'ADMINISTRADOR',
    role: [UserRole.ADMIN], 
    icon: <LayoutDashboard size={20} /> 
  },
  { 
    label: 'Logs de Automação', 
    view: 'BOT_HISTORY', 
    section: 'ADMINISTRADOR',
    role: [UserRole.GESTOR, UserRole.ADMIN], 
    icon: <Zap size={20} /> 
  },
  { 
    label: 'Relatório Gerencial RH', 
    view: 'REPORTS', 
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
];
