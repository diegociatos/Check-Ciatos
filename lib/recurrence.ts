import type { Task, TaskTemplate } from '../types';

type Schedule = Pick<TaskTemplate, 'Recorrencia' | 'DataInicio' | 'DiasRecorrencia' | 'DiaDoMes' | 'PularFinalDeSemana'>;
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const iso = (date: Date) => date.toISOString().slice(0, 10);
const dateOnly = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00Z`);
const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Date-only arithmetic in UTC prevents timezone/DST shifts in a recurring agenda.
export function recurrenceDates(schedule: Schedule, from: string, to: string): string[] {
  const start = schedule.DataInicio?.slice(0, 10) || from;
  const first = dateOnly(from), last = dateOnly(to), origin = dateOnly(start);
  if (![first, last, origin].every(d => Number.isFinite(d.getTime())) || first > last) return [];
  const kind = normalized(schedule.Recorrencia);
  const result = new Set<string>();
  // Include the preceding weekend for monthly dates shifted to Monday.
  const cursor = new Date(first);
  cursor.setUTCDate(cursor.getUTCDate() - 2);
  for (; cursor <= last; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const day = iso(cursor);
    if (day < start) continue;
    const dow = cursor.getUTCDay();
    let matches = false;
    if (kind === 'diaria') matches = !schedule.PularFinalDeSemana || (dow !== 0 && dow !== 6);
    else if (kind === 'semanal') matches = (schedule.DiasRecorrencia || []).includes(DAYS[dow]);
    else if (kind === 'mensal' || kind === 'por data fixa') {
      const requested = schedule.DiaDoMes ?? 1;
      if (!Number.isInteger(requested) || requested < 1 || requested > 31) continue;
      const monthEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)).getUTCDate();
      matches = cursor.getUTCDate() === Math.min(requested, monthEnd);
    } else if (kind === 'anual') {
      const monthEnd = new Date(Date.UTC(cursor.getUTCFullYear(), origin.getUTCMonth() + 1, 0)).getUTCDate();
      matches = cursor.getUTCMonth() === origin.getUTCMonth() && cursor.getUTCDate() === Math.min(origin.getUTCDate(), monthEnd);
    } else if (kind === 'data especifica' || kind === 'nenhuma') matches = day === start;
    if (!matches) continue;
    const due = new Date(cursor);
    if (schedule.PularFinalDeSemana && kind !== 'diaria' && kind !== 'semanal') {
      if (dow === 6) due.setUTCDate(due.getUTCDate() + 2);
      if (dow === 0) due.setUTCDate(due.getUTCDate() + 1);
    }
    const dueDay = iso(due);
    if (dueDay >= from && dueDay <= to) result.add(dueDay);
  }
  return [...result].sort();
}

export type CalendarTask = Task & { Prevista?: boolean };

// Projections belong only to the agenda, never to task actions, score or the store.
export function projectCalendarTasks(templates: TaskTemplate[], tasks: Task[], from: string, to: string): CalendarTask[] {
  const generated = new Set(tasks.map(t => `${t.TemplateID}|${(t.DataLimite_Date || t.DataLimite || '').slice(0, 10)}`));
  return templates.filter(t => t.Ativa).flatMap(template =>
    recurrenceDates(template, from, to)
      .filter(day => !generated.has(`${template.ID}|${day}`))
      .map(day => ({
        ID: `prevista:${template.ID}:${day}`, TemplateID: template.ID,
        Titulo: template.Titulo, Descricao: template.Descricao, Responsavel: template.Responsavel,
        DataLimite: day, DataLimite_Date: day, Prioridade: template.Prioridade,
        PontosValor: template.PontosValor, Status: 'Pendente' as Task['Status'], Tentativas: 0,
        DataGeracao: '', DataCriacao: '', empresa_id: template.empresa_id, Prevista: true,
      }))
  );
}
