
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

export enum ConferenciaStatus {
  AGUARDANDO_CONFERENCIA = 'AGUARDANDO_CONFERENCIA',
  APROVADO = 'APROVADO',
  NAO_CUMPRIU = 'NAO_CUMPRIU',
  CUMPRIU_ERRADO = 'CUMPRIU_ERRADO'
}

export enum ScoreReason {
  CONCLUSAO_NO_PRAZO = 'CONCLUSAO_NO_PRAZO',
  PENALIDADE_ATRASO = 'PENALIDADE_ATRASO',
  AJUSTE_MANUAL = 'AJUSTE_MANUAL',
  SENHA_ALTERADA = 'SENHA_ALTERADA',
  NAO_CUMPRIU_APOS_REVISAO = 'NAO_CUMPRIU_APOS_REVISAO',
  CUMPRIU_ERRADO = 'CUMPRIU_ERRADO'
}

export interface User {
  Email: string;
  Nome: string;
  Role: UserRole;
  Ativo: boolean;
  Time: string;
  Foto?: string;
  Telefone?: string;
  DataNascimento?: string;
  Endereco?: string;
  Biografia?: string;
  SenhaDefinida?: boolean;
  UltimoAcessoFormatado?: string;
  // Colunas Virtuais de Pontuação (Virtual Columns)
  PontosPossiveisHoje?: number;
  PontosPossiveisSemana?: number;
  PontosPossiveisMes?: number;
  PontosRealizadosHoje?: number;
  PontosRealizadosSemana?: number;
  PontosRealizadosMes?: number;
}

export interface UserCredentials {
  Email: string;
  Senha: string;
  UltimoAcesso?: string;
  TentativasFalhadas: number;
  UltimaFalha?: string;
}

export interface ScoreLedger {
  LedgerID: string;
  Email: string;
  TaskID: string;
  DataHora: string;
  DeltaPontos: number;
  Motivo: ScoreReason;
  Observacao: string;
}

export interface Task {
  TaskID: string;
  Titulo: string;
  Descricao: string;
  Pontos: number;
  AssigneeEmail: string;
  CreatedByEmail: string;
  DueDateTime: string;
  Status: TaskStatus;
  CompletedAt?: string;
  CompletionNote?: string;
  ProofAttachment?: string;
  RewardApplied: boolean;
  PenaltyApplied: boolean;
  TemplateID?: string;
  EhRecorrente?: boolean;
  DiasDaSemanaRecorrencia?: string;
  ConferenciaStatus: ConferenciaStatus;
  ConferidoPor?: string;
  ConferidoEm?: string;
  ObservacaoGestor?: string;
}

export interface TaskTemplate {
  TemplateID: string;
  Titulo: string;
  Descricao: string;
  Pontos: number;
  AssigneeEmail: string;
  DiasDaSemanaRecorrencia: string;
  Ativo: boolean;
  CreatedByEmail: string;
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
  | 'CHECK_DELIVERIES'
  | 'RANKING'
  | 'LATENCY_REPORT'
  | 'ALL_TASKS'
  | 'MANAGE_USERS'
  | 'MANAGE_ACCESS'
  | 'MANAGE_TEMPLATES'
  | 'GENERAL_LEDGER'
  | 'MANUAL_ADJUSTMENT'
  | 'REPORTS'
  | 'MY_PROFILE';
