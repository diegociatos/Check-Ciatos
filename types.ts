

export enum UserRole {
  GESTOR = 'Gestor',
  COLABORADOR = 'Colaborador',
  ADMIN = 'Admin'
}

export enum UserStatus {
  ATIVO = 'Ativo',
  INATIVO = 'Inativo',
  BLOQUEADO = 'Bloqueado'
}

export enum TaskPriority {
  BAIXA = 'Baixa',
  MEDIA = 'Media',
  ALTA = 'Alta',
  URGENTE = 'Urgente'
}

export enum TaskStatus {
  PENDENTE = 'Pendente',
  AGUARDANDO_APROVACAO = 'Aguardando Aprovação',
  APROVADA = 'Aprovada',
  FEITA_ERRADA = 'Feita Errada',
  NAO_FEITA = 'Não Feita',
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
  NENHUMA = 'Nenhuma',
  DIARIA = 'Diaria',
  SEMANAL = 'Semanal',
  MENSAL = 'Mensal',
  ANUAL = 'Anual',
  POR_DATA_FIXA = 'Por Data Fixa',
  DATA_ESPECIFICA = 'Data Especifica'
}

export enum PeriodType {
  MES = 'Mes',
  TRIMESTRE = 'Trimestre',
  SEMESTRE = 'Semestre',
  ANO = 'Ano'
}

export interface BotLog {
  ID: string;
  ModeloId: string;
  TaskID: string;
  Responsavel: string;
  DataLimite: string;
  Timestamp: string;
  Status: 'SUCCESS' | 'FAILURE';
  TemplateTitle: string;
  RowsAdded: number;
  GeneratedIDs: string[];
  ErrorDetail?: string;
  ActionParams?: Record<string, any>;
  Resultado: string;
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
  OrigemModelo?: string; // ID ou Rownumber do modelo original
  Titulo: string;
  Descricao: string;
  Responsavel: string;
  DataGeracao: string; // DateTime (NOW())
  DataLimite: string; // Data (DATE puro)
  DataLimite_Date?: string; // Coluna Virtual: DATE([DataLimite])
  DataCriacao: string; // Mantido para compatibilidade legado
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

// Added DataInicio to TaskTemplate interface to support template generation logic
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
  DataInicio?: string;
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
  | 'UPCOMING_TASKS'
  | 'RELIABILITY_PANEL'
  | 'TEAM_PANEL'
  | 'MANAGE_USERS'
  | 'MANAGE_TEMPLATES'
  | 'TASK_SUPERVISION'
  | 'SCORE_SUPERVISION'
  | 'INDIVIDUAL_PERFORMANCE'
  | 'HELP_CENTER'
  | 'PERIOD_REPORT_FILTERS'
  | 'PERIOD_REPORT_DASHBOARD'
  | 'BOT_HISTORY'
  | 'MONTHLY_PERFORMANCE';
