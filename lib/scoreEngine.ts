// Score Engine — regras de pontuação centralizadas (funções puras).
// Fonte única da verdade das REGRAS; o cálculo real que grava no score_ledger vive
// na RPC audit_task (Supabase) e segue EXATAMENTE estas mesmas fórmulas.
// Mantê-las aqui evita regras espalhadas pelos componentes (usado para prévia/exibição).

export type ResultadoAuditoria = 'APROVADO' | 'ERRO_EXECUCAO' | 'NAO_CUMPRIU';

// Prioridade influencia apenas o GANHO (aprovação). Penalidades não são multiplicadas.
const MULT_PRIORIDADE: Record<string, number> = {
  Urgente: 1.25,
  Alta: 1.10,
  Media: 1.0,
  Baixa: 1.0,
};

export function multiplicadorPrioridade(prioridade?: string): number {
  return MULT_PRIORIDADE[prioridade ?? 'Media'] ?? 1.0;
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
