
export enum UserRole {
  GESTOR = 'Gestor',
  COLABORADOR = 'Colaborador',
  ADMIN = 'Admin'
}

export enum UserStatus {
  ATIVO = 'Ativo',
  INATIVO = 'Inativo',
  BLOQUEADO = 'BloqueADO'
}

export enum TaskPriority {
  BAIXA = 'Baixa',
  MEDIA = 'Media',
  ALTA = 'Alta',
  URGENTE = 'Urgente'
}

export enum TaskStatus {
  PENDENTE = 'Pendente',
  CONCLUIDO = 'Concluido',
  CONFERIDO = 'Conferido',
  ATRASADA = 'Atrasada'
}

export enum ConferenciaStatus {
  APROVADO = 'Aprovado',
  NAO_CUMPRIU = 'Nao Cumpriu',
  CUMPRIU_ERRADO = 'Cumpriu Errado'
}

export enum ScoreType {
  GANHO = 'Ganho',
  PENALIDADE = 'Penalidade'
}

export enum RecurrenceType {
  DIARIA = 'Diaria',
  SEMANAL = 'Semanal',
  MENSAL = 'Mensal',
  NENHUMA = 'Nenhuma'
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
  | 'INDIVIDUAL_PERFORMANCE';
