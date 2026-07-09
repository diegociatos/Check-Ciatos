

export enum UserRole {
  PLATAFORMA = 'Plataforma',
  MASTER = 'Master',
  GESTOR = 'Gestor',
  COLABORADOR = 'Colaborador',
  ADMIN = 'Admin'
}

export interface Empresa {
  id: string;
  Nome: string;
  Status?: string;
  Plano?: string;
  DataCriacao?: string;
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
  empresa_id?: string;
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
  empresa_id?: string;
  Pessoal?: boolean; // tarefa criada pelo próprio colaborador (0 pt até o master valorar)
  Andamento?: string; // situação de trabalho controlada pelo responsável: 'Pendente' | 'Em andamento'
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
  PularFinalDeSemana?: boolean;
  Ativa: boolean;
  UltimaExecucao?: string;
  empresa_id?: string;
}

export interface ScoreLedger {
  ID: string;
  UserEmail: string;
  Data: string;
  Pontos: number;
  Tipo: ScoreType;
  Descricao: string;
  empresa_id?: string;
}

export interface Notification {
  id: string;
  to: string;
  subject: string;
  body: string;
  date: string;
}

// ---- Regras de Bonificação (configuração de pontuação por empresa) ----
export type BonusTipo = 'FIXO' | 'PERCENTUAL';

export interface BonusRules {
  empresa_id?: string;
  eficiencia_minima: number;               // % mínimo de eficiência para o bônus
  bonus_tipo: BonusTipo;                    // 'FIXO' (pontos) ou 'PERCENTUAL' (% dos pontos realizados)
  bonus_valor: number;                      // valor do bônus (pontos fixos ou %)
  bonus_com_atraso: boolean;               // permitir bônus com tarefas atrasadas
  peso_prioridade: Record<string, number>; // multiplicador por prioridade (ganho)
  reentrega_fator: number;                  // fator dos pontos em reentrega/atraso (0..1)
  pessoal_valorada: boolean;               // tarefas pessoais valoradas entram na base
  fechamento_dia: number;                   // dia do fechamento mensal (1..28)
}

// Defaults = comportamento atual do app (compatibilidade quando a empresa não configurou).
export const DEFAULT_BONUS_RULES: BonusRules = {
  eficiencia_minima: 90,
  bonus_tipo: 'PERCENTUAL',
  bonus_valor: 10,
  bonus_com_atraso: false,
  peso_prioridade: { Urgente: 1.25, Alta: 1.10, Media: 1.0, Baixa: 1.0 },
  reentrega_fator: 0.5,
  pessoal_valorada: true,
  fechamento_dia: 1,
};

export type ViewType =
  | 'DASHBOARD'
  | 'MY_SCORE'
  | 'CHECK_DELIVERIES'
  | 'MY_PROFILE'
  | 'MANAGE_USERS'
  | 'MANAGE_TEMPLATES'
  | 'TASK_SUPERVISION'
  | 'HELP_CENTER'
  | 'BOT_HISTORY'
  | 'CLIENTES'
  | 'EQUIPE'
  | 'RELATORIOS'
  | 'MINHAS_TAREFAS'
  | 'BONUS_RULES';
