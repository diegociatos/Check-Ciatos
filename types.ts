
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
  ATRASADA = 'ATRASADA',
  AGUARDANDO_APROVACAO = 'AGUARDANDO_APROVACAO',
  APROVADA = 'APROVADA',
  FEITA_ERRADA = 'FEITA_ERRADA',
  NAO_FEITA = 'NAO_FEITA'
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

export enum PeriodType {
  MES = 'MES',
  TRIMESTRE = 'TRIMESTRE',
  SEMESTRE = 'Semestre',
  ANO = 'Ano'
}

export interface ReportFilter {
  ID: string;
  GestorEmail: string;
  ColaboradorEmail: string;
  Periodo: PeriodType;
  Ano: number;
  Mes?: number;
  Trimestre?: 'T1' | 'T2' | 'T3' | 'T4';
  Semestre?: 'S1' | 'S2';
  DataInicio: string;
  DataFim: string;
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
  Senha?: string;
  SenhaProvisoria?: boolean;
  DataCriacao?: string;
  UltimoAcesso?: string;
  TentativasFalhadas?: number;
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
  Tentativas: number;
  JustificativaGestor?: string;
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
  DiasRecorrencia: string[]; 
  DiaDoMes?: number;
  DataInicio: string;
  Ativa: boolean;
  UltimaExecucao?: string;
}

export interface ScoreLedger {
  ID: string;
  UserEmail: string;
  Data: string;
  Pontos: number;
  Tipo: ScoreType;
  Descricao: string;
}

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
  | 'HELP_CENTER'
  | 'PERIOD_REPORT_FILTERS'
  | 'PERIOD_REPORT_DASHBOARD';
