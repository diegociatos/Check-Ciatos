import test from 'node:test';
import assert from 'node:assert/strict';
import { recurrenceDates, projectCalendarTasks } from '../lib/recurrence.ts';

const weekly = { Recorrencia: 'Semanal', DataInicio: '2026-09-18', DiasRecorrencia: ['Seg', 'Qua'] };
const template = { ...weekly, ID: 'weekly', Titulo: 'Conciliação', Responsavel: 'equipe@example.invalid', PontosValor: 5, Prioridade: 'Media', Ativa: true, empresa_id: 'test' };

test('weekly tasks appear next week and subsequent weeks on selected days', () => {
  assert.deepEqual(recurrenceDates(weekly, '2026-09-18', '2026-10-01'), ['2026-09-21', '2026-09-23', '2026-09-28', '2026-09-30']);
});
test('weekly recurrence respects future start date and explicit weekend days', () => {
  assert.deepEqual(recurrenceDates({ ...weekly, DataInicio: '2026-09-25' }, '2026-09-18', '2026-09-30'), ['2026-09-28', '2026-09-30']);
  assert.deepEqual(recurrenceDates({ ...weekly, DiasRecorrencia: ['Sab', 'Dom'], PularFinalDeSemana: true }, '2026-09-18', '2026-09-21'), ['2026-09-19', '2026-09-20']);
  assert.deepEqual(recurrenceDates({ ...weekly, DiasRecorrencia: [] }, '2026-09-18', '2026-09-30'), []);
});
test('daily weekday-only recurrence skips weekends rather than accumulating on Monday', () => {
  assert.deepEqual(recurrenceDates({ Recorrencia: 'Diaria', DataInicio: '2026-09-19', PularFinalDeSemana: true }, '2026-09-18', '2026-09-25'), ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25']);
});
test('daily all-days recurrence preserves Saturday and Sunday', () => {
  assert.deepEqual(recurrenceDates({ Recorrencia: 'Diaria', DataInicio: '2026-09-18', PularFinalDeSemana: false }, '2026-09-18', '2026-09-21'), ['2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21']);
});
test('monthly fixed dates use month end and shift weekend dates across a month boundary', () => {
  assert.deepEqual(recurrenceDates({ Recorrencia: 'Por Data Fixa', DataInicio: '2026-01-01', DiaDoMes: 31 }, '2026-02-01', '2026-03-31'), ['2026-02-28', '2026-03-31']);
  assert.deepEqual(recurrenceDates({ Recorrencia: 'Mensal', DataInicio: '2026-01-01', DiaDoMes: 31, PularFinalDeSemana: true }, '2026-09-01', '2026-09-30'), ['2026-09-30']);
  assert.deepEqual(recurrenceDates({ Recorrencia: 'Mensal', DataInicio: '2026-01-01', DiaDoMes: 31, PularFinalDeSemana: true }, '2026-03-01', '2026-03-02'), ['2026-03-02']);
});
test('invalid dates and past-only ranges have no occurrences', () => {
  assert.deepEqual(recurrenceDates(weekly, '2026-10-01', '2026-09-30'), []);
  assert.deepEqual(recurrenceDates({ ...weekly, DataInicio: 'invalid' }, '2026-09-18', '2026-09-30'), []);
});
test('calendar projections exclude paused templates and already generated occurrences without mutating tasks', () => {
  const task = { ID: 'actual', TemplateID: 'weekly', DataLimite: '2026-09-21', Status: 'Aprovada' };
  const tasks = [task];
  const result = projectCalendarTasks([template, { ...template, ID: 'paused', Ativa: false }], tasks, '2026-09-18', '2026-09-25');
  assert.equal(result.length, 1);
  assert.equal(result[0].DataLimite, '2026-09-23');
  assert.equal(result[0].Prevista, true);
  assert.equal(result[0].empresa_id, 'test');
  assert.deepEqual(tasks, [task]);
});
test('projections keep distinct templates with the same title and keep stable IDs', () => {
  const inputs = [template, { ...template, ID: 'another' }];
  const result = projectCalendarTasks(inputs, [], '2026-09-21', '2026-09-21');
  assert.equal(new Set(result.map(t => t.ID)).size, 2);
  assert.deepEqual(result, projectCalendarTasks(inputs, [], '2026-09-21', '2026-09-21'));
});
