// Evidências de conclusão de tarefas — Supabase Storage (bucket privado 'evidencias').
// Regras de plano/cota: Plano Controle não anexa; Plano Evidências tem 1 GB (+ memória
// extra contratada). A cota é por empresa (empresas.StorageLimitMB/UsedMB/ExtraMB).
import { supabase } from './supabase';

const BUCKET = 'evidencias';
export const MAX_MB = 5; // limite por arquivo (também travado no bucket)
export const PLANO_EVIDENCIAS_STORAGE_MB = 1024;
export const TIPOS_OK = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'application/pdf'];

export type StoragePolicy = {
  plano: string;
  permiteAnexos: boolean;
  limiteMb: number; // base + extra (0 quando não permite anexos)
  usadoMb: number;
  extraMb: number;
};

function normalizarPlano(plano?: string | null) {
  return String(plano || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Regra central de "pode anexar": Controle não; Evidências sim; empresas legadas
// (sem plano ou 'Padrao') mantêm o comportamento antigo (podem anexar).
export function planoPermiteAnexos(plano?: string | null): boolean {
  const p = normalizarPlano(plano);
  if (p.includes('controle')) return false;
  return true;
}

function numeroSeguro(valor: unknown, fallback = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : fallback;
}

// Lê a política de storage da empresa. Tolerante a bases antigas (antes da migration
// de cota): nesse caso não bloqueia por cota, só aplica a regra de plano.
export async function getStoragePolicy(empresaId: string): Promise<StoragePolicy> {
  const { data, error } = await supabase
    .from('empresas')
    .select('Plano,StorageLimitMB,StorageUsedMB,StorageExtraMB')
    .eq('id', empresaId)
    .maybeSingle();

  if (error) {
    const { data: legacy } = await supabase.from('empresas').select('Plano').eq('id', empresaId).maybeSingle();
    const plano = (legacy as any)?.Plano || '';
    const permite = planoPermiteAnexos(plano);
    return { plano, permiteAnexos: permite, limiteMb: permite ? PLANO_EVIDENCIAS_STORAGE_MB : 0, usadoMb: 0, extraMb: 0 };
  }

  const plano = (data as any)?.Plano || '';
  const permiteAnexos = planoPermiteAnexos(plano);
  const limiteBase = numeroSeguro((data as any)?.StorageLimitMB, permiteAnexos ? PLANO_EVIDENCIAS_STORAGE_MB : 0);
  const extra = numeroSeguro((data as any)?.StorageExtraMB, 0);

  return {
    plano,
    permiteAnexos,
    limiteMb: permiteAnexos ? limiteBase + extra : 0,
    usadoMb: numeroSeguro((data as any)?.StorageUsedMB, 0),
    extraMb: extra,
  };
}

async function validarQuotaEmpresa(file: File, empresaId: string): Promise<void> {
  const policy = await getStoragePolicy(empresaId);
  if (!policy.permiteAnexos) {
    throw new Error('Seu plano atual (Controle) não permite anexar documentos. Para enviar evidências, assine o Plano Evidências.');
  }
  const novoUsoMb = policy.usadoMb + file.size / 1024 / 1024;
  if (policy.limiteMb > 0 && novoUsoMb > policy.limiteMb) {
    throw new Error(`Limite de armazenamento atingido (${policy.limiteMb} MB). Contrate memória extra ou remova evidências antigas para continuar anexando.`);
  }
}

// Ajuste atômico do uso (via RPC). deltaMb pode ser negativo (exclusão).
async function ajustarUso(empresaId: string, deltaMb: number): Promise<void> {
  if (!empresaId) return;
  await supabase.rpc('incrementar_uso_storage', { p_empresa: empresaId, p_delta_mb: Number(deltaMb.toFixed(4)) });
}

// Retorna mensagem de erro (string) se inválido, ou null se ok.
export function validarArquivo(f: File): string | null {
  if (!TIPOS_OK.includes(f.type)) return 'Formato não permitido. Envie imagem (PNG, JPG, WEBP) ou PDF.';
  if (f.size > MAX_MB * 1024 * 1024) return `Arquivo muito grande (máximo ${MAX_MB} MB).`;
  return null;
}

// Faz upload e retorna o "path" salvo em ProofAttachment. Valida plano + cota antes.
export async function uploadEvidencia(file: File, empresaId: string, taskId: string): Promise<string> {
  await validarQuotaEmpresa(file, empresaId);

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${empresaId}/${taskId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(error.message || 'Falha no upload da evidência.');

  await ajustarUso(empresaId, file.size / 1024 / 1024);
  return path;
}

// Remove uma evidência do bucket e devolve o espaço à cota da empresa.
export async function removerEvidencia(path: string, empresaId: string): Promise<void> {
  if (!pareceArquivo(path)) return;
  // Descobre o tamanho antes de apagar, para decrementar a cota com precisão.
  let tamanhoMb = 0;
  try {
    const barra = path.lastIndexOf('/');
    const pasta = path.slice(0, barra);
    const arquivo = path.slice(barra + 1);
    const { data: lista } = await supabase.storage.from(BUCKET).list(pasta, { search: arquivo });
    const meta = (lista ?? []).find((o: any) => o.name === arquivo);
    tamanhoMb = numeroSeguro((meta as any)?.metadata?.size, 0) / 1024 / 1024;
  } catch { /* segue mesmo sem o tamanho */ }

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message || 'Falha ao remover a evidência.');
  if (tamanhoMb > 0) await ajustarUso(empresaId, -tamanhoMb);
}

// Gera URL assinada temporária para abrir/baixar. Retorna null se o valor não for
// um arquivo do Storage (compatibilidade com anexos antigos em texto).
export async function urlEvidencia(path?: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

// Heurística: um path de evidência tem o formato empresa/task/arquivo (2+ barras).
export function pareceArquivo(path?: string | null): boolean {
  return !!path && path.split('/').length >= 3 && !path.startsWith('http');
}
