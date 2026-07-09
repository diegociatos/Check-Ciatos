// Score Engine — regras de pontuação centralizadas (funções puras).
// Fonte única da verdade das REGRAS; o cálculo real que grava no score_ledger vive
// na RPC audit_task (Supabase) e segue EXATAMENTE estas mesmas fórmulas.
// Mantê-las aqui evita regras espalhadas pelos componentes (usado para prévia/exibição).

import type { BonusRules } from '../types';
import { DEFAULT_BONUS_RULES } from '../types';

export type ResultadoAuditoria = 'APROVADO' | 'ERRO_EXECUCAO' | 'NAO_CUMPRIU';

// Prioridade influencia apenas o GANHO (aprovação). Penalidades não são multiplicadas.
// Os pesos podem ser sobrescritos pela empresa (Regras de Bonificação); o default
// abaixo mantém o comportamento histórico caso a empresa não tenha configuração.
const MULT_PRIORIDADE: Record<string, number> = DEFAULT_BONUS_RULES.peso_prioridade;

export function multiplicadorPrioridade(prioridade?: string, pesos?: Record<string, number>): number {
  const tabela = pesos ?? MULT_PRIORIDADE;
  return tabela[prioridade ?? 'Media'] ?? 1.0;
}

export interface ContextoScore {
  pontosBase: number;      // task.PontosValor
  prioridade?: string;     // task.Prioridade
  atrasada?: boolean;      // entregue depois do prazo
  reentrega?: boolean;     // já houve tentativa anterior (Tentativas > 0)
}

export interface ResultadoScore {
  pontos: number;                    // >0 ganho, <0 penalidade
  tipo: 'GANHO' | 'PENALIDADE';
  descricao: string;
}

// Pontos de uma APROVAÇÃO: metade quando atrasada ou reentrega, e multiplicador de prioridade.
export function pontosAprovacao(ctx: ContextoScore): number {
  const base = ctx.atrasada || ctx.reentrega ? Math.ceil(ctx.pontosBase * 0.5) : ctx.pontosBase;
  return Math.ceil(base * multiplicadorPrioridade(ctx.prioridade));
}

// Penalidade por erro de execução (metade do valor base).
export function pontosErro(pontosBase: number): number {
  return -Math.ceil(pontosBase * 0.5);
}

// Penalidade por não execução (valor base inteiro).
export function pontosNaoCumpriu(pontosBase: number): number {
  return -pontosBase;
}

// Resultado completo de uma auditoria (ponto + tipo + descrição), usado para prévia.
export function calcularAuditoria(
  resultado: ResultadoAuditoria,
  ctx: ContextoScore,
  titulo: string
): ResultadoScore {
  switch (resultado) {
    case 'APROVADO':
      return { pontos: pontosAprovacao(ctx), tipo: 'GANHO', descricao: `Aprovação: ${titulo}` };
    case 'ERRO_EXECUCAO':
      return { pontos: pontosErro(ctx.pontosBase), tipo: 'PENALIDADE', descricao: `Pena – Erro: ${titulo}` };
    case 'NAO_CUMPRIU':
      return { pontos: pontosNaoCumpriu(ctx.pontosBase), tipo: 'PENALIDADE', descricao: `Penalidade – Não Concluída: ${titulo}` };
  }
}

// ---- Bonificação por eficiência (Regras de Bonificação) --------------------
export interface ContextoBonus {
  eficiencia: number;        // % de eficiência no período (0..100)
  pontosRealizados: number;  // pontos realizados no período (base do bônus percentual)
  temAtraso?: boolean;       // possui tarefas atrasadas no período
}

export interface ResultadoBonus {
  elegivel: boolean;
  valor: number;             // pontos de bônus (0 quando não elegível)
  motivo: string;            // explicação legível
}

// Calcula o bônus de um colaborador a partir das regras da empresa. Regras ausentes
// caem no DEFAULT_BONUS_RULES (comportamento atual: 90% de eficiência, sem bônus com atraso).
export function calcularBonus(ctx: ContextoBonus, regras?: BonusRules | null): ResultadoBonus {
  const r = regras ?? DEFAULT_BONUS_RULES;
  const ef = Math.round(ctx.eficiencia);

  if (ef < r.eficiencia_minima) {
    return { elegivel: false, valor: 0, motivo: `Eficiência ${ef}% abaixo do mínimo de ${r.eficiencia_minima}%.` };
  }
  if (ctx.temAtraso && !r.bonus_com_atraso) {
    return { elegivel: false, valor: 0, motivo: 'Possui tarefas atrasadas no período (bônus com atraso desabilitado).' };
  }

  const valor = r.bonus_tipo === 'FIXO'
    ? Math.round(r.bonus_valor)
    : Math.round((ctx.pontosRealizados * r.bonus_valor) / 100);

  const descrValor = r.bonus_tipo === 'FIXO' ? `${valor} pts (fixo)` : `${valor} pts (${r.bonus_valor}% de ${ctx.pontosRealizados})`;
  return { elegivel: true, valor, motivo: `Elegível — bônus de ${descrValor}.` };
}
