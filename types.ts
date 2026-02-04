
export enum UserRole {
  GESTOR = 'GESTOR',
  COLABORADOR = 'COLABORADOR',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  BLOQUEADO = 'BLOQUEADO'
}

export enum TaskPriority {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE'
}

export enum TaskStatus {
  PENDENTE = 'PENDENTE',
  CONCLUIDO = 'CONCLUIDO',
  CONFERIDO = 'CONFERIDO',
  ATRASADA = 'ATRASADA'
}

export enum ConferenciaStatus {
  APROVADO = 'APROVADO',
  NAO_CUMPRIU = 'NAO_CUMPRIU',
  CUMPRIU_ERRADO = 'CUMPRIU_ERRADO'
}

export enum ScoreType {
  GANHO = 'GANHO',
  PENALIDADE = 'PENALIDADE'
}

export enum RecurrenceType {
  DIARIA = 'DIARIA',
  SEMANAL = 'SEMANAL',
  MENSAL = 'MENSAL',
  NENHUMA = 'NENHUMA'
}

export interface User {
  Email: string; // Key
  Nome: string;
  Foto?: string;
  Telefone?: string;
  DataNascimento?: string;
  Endereco?: string;
  Bio?: string;
  Role: UserRole;
  Status: UserStatus;
  Time: string;
  Gestor?: string; // Ref para Email do Gestor/Admin
  // Segurança e Gestão
  Senha?: string;
  SenhaProvisoria?: boolean;
  DataCriacao?: string;
  UltimoAcesso?: string;
  TentativasFalhadas?: number;
  // Campos virtuais/calculados
  PontosRealizadosMes?: number;
  PontosPossiveisMes?: number;
  EficienciaMes?: number;
  ScoreConfiabilidade?: number;
  StatusRH?: string;
  TemAtrasos?: boolean;
}

export interface Task {
  ID: string;
  TemplateID?: string;
  Titulo: string;
  Descricao: string;
  Responsavel: string;
  DataLimite: string;
  Prioridade: TaskPriority;
  Status: TaskStatus;
  PontosValor: number;
  DataConclusao?: string;
  ConferenciaStatus?: ConferenciaStatus;
  ObservacaoGestor?: string;
  ProofAttachment?: string;
  CompletionNote?: string;
}

export interface TaskTemplate {
  ID: string;
  Titulo: string;
  Descricao: string;
  Responsavel: string;
  PontosValor: number;
  Prioridade: TaskPriority;
  Recorrencia: RecurrenceType;
  DiasRecorrencia: string[]; // Lista de dias: ['Seg', 'Ter']
  DiaDoMes?: number;
  DataInicio: string; // Data inicial para começar a gerar
  Ativa: boolean;
  UltimaExecucao?: string; // Log da última vez que gerou tarefas
}

export interface ScoreLedger {
  ID: string;
  UserEmail: string;
  Data: string;
  Pontos: number;
  Tipo: ScoreType;
  Descricao: string;
}

export interface UserCredentials {
  Email: string;
  Senha: string;
  TentativasFalhadas: number;
}

/**
 * Added missing Notification interface to resolve compilation error in Layout.tsx
 */
export interface Notification {
  id: string;
  to: string;
  subject: string;
  body: string;
  date: string;
}

export type ViewType = 
  | 'DASHBOARD'
  | 'MY_TASKS'
  | 'COMPLETED_TASKS'
  | 'MY_SCORE'
  | 'CREATE_TASK'
  | 'PERFORMANCE_MANAGEMENT'
  | 'CHECK_DELIVERIES'
  | 'RANKING'
  | 'REPORTS'
  | 'EXECUTIVE_VIEW'
  | 'MY_PROFILE'
  | 'MY_TASKS_TODAY'
  | 'RELIABILITY_PANEL'
  | 'TEAM_PANEL'
  | 'MANAGE_USERS'
  | 'MANAGE_TEMPLATES'
  | 'TASK_SUPERVISION'
  | 'SCORE_SUPERVISION'
  | 'INDIVIDUAL_PERFORMANCE'
  | 'HELP_CENTER';
