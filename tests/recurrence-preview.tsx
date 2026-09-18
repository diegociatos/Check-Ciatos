// Isolated UI fixture, served by Vite only. No auth, API or production writes.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import CalendarioView from '../components/CalendarioView';
import TemplateManager from '../components/TemplateManager';
import { ToastViewport } from '../components/ui';
import { UserRole, UserStatus, RecurrenceType, TaskPriority, type TaskTemplate, type User } from '../types';
import '../index.css';

const user: User = { Email: 'teste@example.invalid', Nome: 'Equipe de teste', Role: UserRole.MASTER, Status: UserStatus.ATIVO };
const monday: TaskTemplate = { ID: 'weekly', Titulo: 'Conciliação semanal (teste)', Descricao: '', Responsavel: user.Email, PontosValor: 5, Prioridade: TaskPriority.MEDIA, Recorrencia: RecurrenceType.SEMANAL, DiasRecorrencia: ['Seg'], DataInicio: '2026-09-18', Ativa: true };
function Preview() {
  const [view, setView] = useState('calendar');
  const [templates, setTemplates] = useState<TaskTemplate[]>([monday, { ...monday, ID: 'daily', Titulo: 'Conferência diária (teste)', Recorrencia: RecurrenceType.DIARIA, PularFinalDeSemana: true }]);
  const [fail, setFail] = useState(false);
  const save = async () => { if (fail) throw new Error('Falha simulada'); };
  return <div className="bg-fundo min-h-dvh p-4 sm:p-8">
    <div className="flex flex-wrap gap-4 mb-6">
      <button onClick={() => setView('calendar')}>Calendário de teste</button>
      <button onClick={() => setView('templates')}>Cadastro de teste</button>
      <label><input type="checkbox" checked={fail} onChange={e => setFail(e.target.checked)} /> Simular falha ao salvar</label>
    </div>
    {view === 'calendar' ? <CalendarioView tasks={[]} templates={templates} currentUser={user} users={[user]} currentUserRole={user.Role} /> :
      <TemplateManager tasks={[]} templates={templates} users={[user]}
        onAdd={async data => { await save(); setTemplates(prev => [...prev, { ...data, ID: `test-${prev.length}` }]); }}
        onUpdate={async (id, data) => { await save(); setTemplates(prev => prev.map(t => t.ID === id ? { ...data, ID: id } : t)); }}
        onToggle={id => setTemplates(prev => prev.map(t => t.ID === id ? { ...t, Ativa: !t.Ativa } : t))}
        onDelete={id => setTemplates(prev => prev.filter(t => t.ID !== id))} onGenerateNow={async () => false} />}
    <ToastViewport />
  </div>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
