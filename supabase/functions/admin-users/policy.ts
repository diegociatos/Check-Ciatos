import { userUpdateFields } from '../_shared/user-fields.ts';

export const normalizeRole = (role: unknown): string => String(role ?? '').toLowerCase();

// Platform accounts remain reserved for platform administrators.
export function canManageRole(caller: string, target: unknown): boolean {
  const role = normalizeRole(target);
  if (caller === 'plataforma') return ['plataforma', 'master', 'admin', 'gestor', 'colaborador'].includes(role);
  if (caller === 'gestor') return role === 'colaborador';
  return ['admin', 'master'].includes(caller) && ['admin', 'master', 'gestor', 'colaborador'].includes(role);
}

export function validateUserUpdate(value: unknown, caller: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Cadastro inválido');
  const row = value as Record<string, unknown>;
  const keys = Object.keys(row);
  if (!keys.length || keys.some(key => !(userUpdateFields as readonly string[]).includes(key))) {
    throw new Error('Campos de cadastro não permitidos');
  }
  for (const key of keys) {
    if (typeof row[key] !== 'string' && !(row[key] === null && !['Nome', 'Role', 'Status'].includes(key))) {
      throw new Error('Valor de cadastro inválido');
    }
  }
  if (Object.hasOwn(row, 'Role') && !canManageRole(caller, row.Role)) throw new Error('Papel não permitido');
  if (Object.hasOwn(row, 'Status') && !['Ativo', 'Inativo', 'Bloqueado'].includes(row.Status as string)) {
    throw new Error('Status inválido');
  }
  return Object.fromEntries(keys.map(key => [key, row[key]]));
}

// Preserve case-insensitive email lookup without treating %, _ or backslash as patterns.
export const emailPattern = (value: string): string => value.replace(/[\\%_]/g, '\\$&');
