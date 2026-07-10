// Evidências de conclusão de tarefas — Supabase Storage (bucket privado 'evidencias').
import { supabase } from './supabase';

const BUCKET = 'evidencias';
export const MAX_MB = 5;
export const PLANO_EVIDENCIAS_STORAGE_MB = 1024;
export const TIPOS_OK = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'application/pdf'];

type StoragePolicy = {
  plano: string;
  permiteAnexos: boolean;
  limiteMb: number;
  usadoMb: number;
};

function normalizarPlano(plano?: string | null) {
  return String(plano || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function planoPermiteAnexos(plano?: string | null) {
  const normalized = normalizarPlano(plano);
  if (normalized.includes('controle')) return false;
  if (normalized.includes('evidencia')) return true;
  return true; // Mantem compatibilidade com empresas antigas sem plano definido.
}

function numeroSeguro(valor: unknown, fallback = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : fallback;
}

async function getStoragePolicy(empresaId: string): Promise<StoragePolicy> {
  const { data, error } = await supabase
    .from('empresas')
    .select('Plano,StorageLimitMB,StorageUsedMB,StorageExtraMB')
    .eq('id', empresaId)
    .maybeSingle();

  // Antes da migration de quota ser aplicada, algumas colunas podem não existir.
  // Nesse caso, mantemos o comportamento antigo para não bloquear operações legadas.
  if (error) {
    const { data: legacy } = await supabase.from('empresas').select('Plano').eq('id', empresaId).maybeSingle();
    const plano = (legacy as any)?.Plano || '';
    return {
      plano,
      permiteAnexos: planoPermiteAnexos(plano),
      limiteMb: planoPermiteAnexos(plano) ? PLANO_EVIDENCIAS_STORAGE_MB : 0,
      usadoMb: 0,
    };
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
  };
}

async function validarQuotaEmpresa(file: File, empresaId: string): Promise<void> {
  const policy = await getStoragePolicy(empresaId);
  if (!policy.permiteAnexos) {
    throw new Error('Seu plano atual não permite anexar documentos. Para enviar evidências, assine o Plano Evidências.');
  }

  const novoUsoMb = policy.usadoMb + file.size / 1024 / 1024;
  if (policy.limiteMb > 0 && novoUsoMb > policy.limiteMb) {
    throw new Error(`Limite de armazenamento atingido (${policy.limiteMb} MB). Contrate memória extra ou remova evidências antigas para continuar anexando documentos.`);
  }
}

async function incrementarUsoEmpresa(file: File, empresaId: string) {
  const incrementoMb = file.size / 1024 / 1024;
  const policy = await getStoragePolicy(empresaId);

  await supabase
    .from('empresas')
    .update({ StorageUsedMB: Number((policy.usadoMb + incrementoMb).toFixed(2)) })
    .eq('id', empresaId);
}

// Retorna mensagem de erro (string) se inválido, ou null se ok.
export function validarArquivo(f: File): string | null {
  if (!TIPOS_OK.includes(f.type)) return 'Formato não permitido. Envie imagem (PNG, JPG, WEBP) ou PDF.';
  if (f.size > MAX_MB * 1024 * 1024) return `Arquivo muito grande (máximo ${MAX_MB} MB).`;
  return null;
}

// Faz upload e retorna o "path" salvo em ProofAttachment.
export async function uploadEvidencia(file: File, empresaId: string, taskId: string): Promise<string> {
  await validarQuotaEmpresa(file, empresaId);

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${empresaId}/${taskId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(error.message || 'Falha no upload da evidência.');

  await incrementarUsoEmpresa(file, empresaId);
  return path;
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
