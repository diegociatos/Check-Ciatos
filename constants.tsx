
import React from 'react';
import {
  Home,
  CheckCircle,
  Star,
  UserCog,
  ClipboardCheck,
  Eye,
  Users,
  Zap,
  FileBarChart,
  Activity,
  Coins,
  Gauge,
  CalendarCheck,
  CalendarDays,
  HardDrive
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
  { label: 'Minhas tarefas', view: 'MINHAS_TAREFAS', section: 'GERAL', role: TODOS, icon: <CheckCircle size={20} /> },
  { label: 'Calendário', view: 'CALENDARIO', section: 'GERAL', role: TODOS, icon: <CalendarDays size={20} /> },
  { label: 'Meus pontos', view: 'MY_SCORE', section: 'GERAL', role: TODOS, icon: <Star size={20} /> },

  // ===== GESTÃO (gestor e admin) =====
  // Visão executiva: só Master e Plataforma (mapeados p/ ADMIN).
  { label: 'Visão executiva', view: 'EXECUTIVE_DASHBOARD', section: 'GESTÃO', role: [UserRole.ADMIN], icon: <Gauge size={20} /> },
  { label: 'Conferir entregas', view: 'CHECK_DELIVERIES', section: 'GESTÃO', role: GESTAO, icon: <ClipboardCheck size={20} /> },
  { label: 'Equipe', view: 'EQUIPE', section: 'GESTÃO', role: GESTAO, icon: <Users size={20} /> },
  { label: 'Gerar tarefas', view: 'MANAGE_TEMPLATES', section: 'GESTÃO', role: GESTAO, icon: <Zap size={20} /> },
  { label: 'Central de auditoria', view: 'TASK_SUPERVISION', section: 'GESTÃO', role: GESTAO, icon: <Eye size={20} /> },
  { label: 'Relatórios', view: 'RELATORIOS', section: 'GESTÃO', role: GESTAO, icon: <FileBarChart size={20} /> },

  // ===== ADMINISTRAÇÃO (admin/master) =====
  { label: 'Fechamento mensal', view: 'MONTHLY_CLOSING', section: 'ADMINISTRAÇÃO', role: GESTAO, icon: <CalendarCheck size={20} /> },
  { label: 'Gerenciar usuários', view: 'MANAGE_USERS', section: 'ADMINISTRAÇÃO', role: GESTAO, icon: <UserCog size={20} /> },
  // Regras de bonificação: só Master e Plataforma (mapeados p/ ADMIN); Gestor não configura.
  { label: 'Regras de bonificação', view: 'BONUS_RULES', section: 'ADMINISTRAÇÃO', role: [UserRole.ADMIN], icon: <Coins size={20} /> },
  // Plano & armazenamento: só Master/Plataforma (mapeados p/ ADMIN) veem o plano e contratam memória extra.
  { label: 'Plano e armazenamento', view: 'PLANO', section: 'ADMINISTRAÇÃO', role: [UserRole.ADMIN], icon: <HardDrive size={20} /> },
  { label: 'Automação', view: 'BOT_HISTORY', section: 'ADMINISTRAÇÃO', role: GESTAO, icon: <Activity size={20} /> },
];

