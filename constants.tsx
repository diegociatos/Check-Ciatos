
import React from 'react';
import {
  Home,
  CheckCircle,
  CheckCheck,
  Star,
  UserCog,
  ClipboardCheck,
  Eye,
  FileText,
  Zap,
  CalendarDays,
  Activity
} from 'lucide-react';
import { UserRole, ViewType } from './types';

export const COLORS = {
  primary: '#8B1B1F',
  accent: '#6F0F14',
  bg: '#FFFFFF',
  text: '#111111',
  secondaryBg: '#F3F3F3'
};

export type NavigationSection = 'GERAL' | 'GESTÃO' | 'ADMINISTRAÇÃO';

export interface NavigationItem {
  label: string;
  view: ViewType;
  role: UserRole[];
  icon: React.ReactNode;
  section: NavigationSection;
}

const TODOS = [UserRole.COLABORADOR, UserRole.GESTOR, UserRole.ADMIN];
const GESTAO = [UserRole.GESTOR, UserRole.ADMIN];

export const NAVIGATION_ITEMS: NavigationItem[] = [
  // ===== GERAL (colaborador e acima) =====
  { label: 'Início', view: 'DASHBOARD', section: 'GERAL', role: TODOS, icon: <Home size={20} /> },
  { label: 'Minhas tarefas', view: 'MY_TASKS_TODAY', section: 'GERAL', role: TODOS, icon: <CheckCircle size={20} /> },
  { label: 'Planejamento futuro', view: 'UPCOMING_TASKS', section: 'GERAL', role: TODOS, icon: <CalendarDays size={20} /> },
  { label: 'Tarefas concluídas', view: 'COMPLETED_TASKS', section: 'GERAL', role: TODOS, icon: <CheckCheck size={20} /> },
  { label: 'Meus pontos', view: 'MY_SCORE', section: 'GERAL', role: TODOS, icon: <Star size={20} /> },

  // ===== GESTÃO (gestor e admin) =====
  { label: 'Conferir entregas', view: 'CHECK_DELIVERIES', section: 'GESTÃO', role: GESTAO, icon: <ClipboardCheck size={20} /> },
  { label: 'Gerar tarefas', view: 'MANAGE_TEMPLATES', section: 'GESTÃO', role: GESTAO, icon: <Zap size={20} /> },
  { label: 'Supervisão de tarefas', view: 'TASK_SUPERVISION', section: 'GESTÃO', role: GESTAO, icon: <Eye size={20} /> },
  { label: 'Supervisão de pontos', view: 'SCORE_SUPERVISION', section: 'GESTÃO', role: GESTAO, icon: <FileText size={20} /> },

  // ===== ADMINISTRAÇÃO (admin/master) =====
  { label: 'Gerenciar usuários', view: 'MANAGE_USERS', section: 'ADMINISTRAÇÃO', role: [UserRole.ADMIN], icon: <UserCog size={20} /> },
  { label: 'Automação', view: 'BOT_HISTORY', section: 'ADMINISTRAÇÃO', role: GESTAO, icon: <Activity size={20} /> },
];

