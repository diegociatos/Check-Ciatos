// Rótulos humanos para exibição (NÃO alteram os valores dos enums no banco).
import { TaskStatus } from '../types';

export type StatusTone = 'sucesso' | 'atraso' | 'erro' | 'aguardando' | 'pendente';

interface StatusInfo {
  label: string;
  tone: StatusTone;
}

// Traduz o status técnico para o que a pessoa reconhece.
export function statusInfo(status: TaskStatus): StatusInfo {
  switch (status) {
    case TaskStatus.APROVADA:
      return { label: 'Aprovada', tone: 'sucesso' };
    case TaskStatus.AGUARDANDO_APROVACAO:
      return { label: 'Em conferência', tone: 'aguardando' };
    case TaskStatus.FEITA_ERRADA:
      return { label: 'Refazer', tone: 'erro' };
    case TaskStatus.NAO_FEITA:
      return { label: 'Não feita', tone: 'erro' };
    case TaskStatus.ATRASADA:
      return { label: 'Atrasada', tone: 'atraso' };
    case TaskStatus.PENDENTE:
    default:
      return { label: 'Pendente', tone: 'pendente' };
  }
}

// Classes Tailwind para cada tom de status (superfície + texto).
export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  sucesso: 'text-emerald-700 bg-emerald-50',
  atraso: 'text-amber-700 bg-amber-50',
  erro: 'text-red-700 bg-red-50',
  aguardando: 'text-stone-500 bg-stone-100',
  pendente: 'text-marca bg-marca/10',
};
