// Detecção de tarefas/modelos parecidos para evitar duplicidade na criação.
// Tudo client-side: normaliza o texto e compara por sobreposição de palavras (Jaccard)
// com bônus quando um título contém o outro. Sem dependências.

export function normalizar(s: string): string {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // tira acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')                      // pontuação vira espaço
    .replace(/\s+/g, ' ')
    .trim();
}

// Palavras muito comuns não devem puxar similaridade sozinhas.
const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os', 'para', 'com', 'em', 'no', 'na', 'nos', 'nas', 'the']);

function tokens(s: string): Set<string> {
  return new Set(normalizar(s).split(' ').filter((w) => w.length > 2 && !STOP.has(w)));
}

// Similaridade 0..1 entre dois títulos.
export function similaridade(a: string, b: string): number {
  const na = normalizar(a);
  const nb = normalizar(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;

  const ta = tokens(a);
  const tb = tokens(b);
  const contido = na.includes(nb) || nb.includes(na);

  if (ta.size === 0 || tb.size === 0) {
    return contido ? 0.85 : 0; // títulos curtos: só substring
  }

  let inter = 0;
  ta.forEach((w) => { if (tb.has(w)) inter++; });
  const jaccard = inter / (ta.size + tb.size - inter);
  return Math.min(1, jaccard + (contido ? 0.3 : 0));
}

export interface Similar<T> { item: T; score: number; }

// Retorna os itens parecidos com `titulo`, do mais parecido para o menos, acima do limiar.
export function acharSimilares<T>(
  titulo: string,
  itens: T[],
  getTitulo: (t: T) => string,
  limiar = 0.55,
): Similar<T>[] {
  if (normalizar(titulo).length < 3) return [];
  return itens
    .map((item) => ({ item, score: similaridade(titulo, getTitulo(item)) }))
    .filter((s) => s.score >= limiar)
    .sort((a, b) => b.score - a.score);
}
