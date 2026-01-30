
export enum UserRole {
  COLABORADOR = 'COLABORADOR',
  GESTOR = 'GESTOR',
  ADMIN = 'ADMIN'
}

export enum TaskStatus {
  PENDENTE = 'PENDENTE',
  CONCLUIDA = 'CONCLUIDA',
  ATRASADA = 'ATRASADA'
}

export enum ScoreReason {
  CONCLUSAO_NO_PRAZO = 'CONCLUSAO_NO_PRAZO',
  PENALIDADE_ATRASO = 'PENALIDADE_ATRASO',
  AJUSTE_MANUAL = 'AJUSTE_MANUAL'
}

export interface User {
  Email: string;
  Nome: string;
  Role: UserRole;
  Ativo: boolean;
  Time: string;
}

export interface Task {
  TaskID: string;
  Titulo: string;
  Descricao: string;
  Pontos: number;
  AssigneeEmail: string;
  CreatedByEmail: string;
  DueDateTime: string; // ISO string
  Status: TaskStatus;
  CompletedAt?: string; // ISO string
  CompletionNote?: string;
  ProofAttachment?: string; // Base64 or URL
  RewardApplied: boolean;
  PenaltyApplied: boolean;
  TemplateID?: string; // Link to template if recurring
}

export interface TaskTemplate {
  TemplateID: string;
  Titulo: string;
  Descricao: string;
  Pontos: number;
  AssigneeEmail: string;
  DiasDaSemana: string; // e.g. "Segunda, Terça" or "Todos"
  Ativo: boolean;
  CreatedByEmail: string;
}

export interface ScoreLedger {
  LedgerID: string;
  Email: string;
  TaskID: string;
  DataHora: string; // ISO string
  DeltaPontos: number;
  Motivo: ScoreReason;
  Observacao: string;
}

export type ViewType = 
  | 'DASHBOARD'
  | 'MY_TASKS_TODAY'
  | 'OVERDUE_TASKS'
  | 'COMPLETED_TASKS'
  | 'MY_SCORE'
  | 'RULES'
  | 'CREATE_TASK'
  | 'CREATED_BY_ME'
  | 'TEAM_PANEL'
  | 'RANKING'
  | 'LATENCY_REPORT'
  | 'ALL_TASKS'
  | 'MANAGE_USERS'
  | 'MANAGE_TEMPLATES'
  | 'GENERAL_LEDGER'
  | 'MANUAL_ADJUSTMENT'
  | 'REPORTS';
