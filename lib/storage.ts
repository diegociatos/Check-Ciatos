// Evidências de conclusão de tarefas — Supabase Storage (bucket privado 'evidencias').
import { supabase } from './supabase';

const BUCKET = 'evidencias';
export const MAX_MB = 5;
export const TIPOS_OK = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'application/pdf'];

// Retorna mensagem de erro (string) se inválido, ou null se ok.
export function validarArquivo(f: File): string | null {
  if (!TIPOS_OK.includes(f.type)) return 'Formato não permitido. Envie imagem (PNG, JPG, WEBP) ou PDF.';
  if (f.size > MAX_MB * 1024 * 1024) return `Arquivo muito grande (máximo ${MAX_MB} MB).`;
  return null;
}

// Faz upload e retorna o "path" salvo em ProofAttachment.
export async function uploadEvidencia(file: File, empresaId: string, taskId: string): Promise<string> {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${empresaId}/${taskId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(error.message || 'Falha no upload da evidência.');
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
