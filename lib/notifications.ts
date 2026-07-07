// Notificações derivadas do estado das tarefas (sem tabela extra).
// Cada notificação tem um id estável para poder ser marcada como lida.
import { Task, TaskStatus, User, Notification } from '../types';

const hoje = () => new Date().toLocaleDateString('en-CA');
const soData = (s?: string) => (s ? (s.includes('T') ? s.split('T')[0] : s) : '');
const br = (d: string) => (d ? d.split('-').reverse().join('/') : '');

export function gerarNotificacoes(currentUser: User | null, tasks: Task[], isManager: boolean): Notification[] {
  if (!currentUser) return [];
  const me = currentUser.Email;
  const today = hoje();
  const out: Notification[] = [];
  const add = (id: string, subject: string, body: string, date?: string) =>
    out.push({ id, to: me, subject, body, date: date || new Date().toISOString() });

  const minhas = tasks.filter(t => t.Responsavel === me);
  for (const t of minhas) {
    const dl = t.DataLimite_Date || soData(t.DataLimite);
    const pendente = t.Status === TaskStatus.PENDENTE || t.Status === TaskStatus.FEITA_ERRADA || t.Status === TaskStatus.NAO_FEITA;

    if (pendente && dl && dl < today) {
      add(`atraso-${t.ID}`, 'Tarefa atrasada', `"${t.Titulo}" venceu em ${br(dl)}.`, t.DataLimite);
    } else if (pendente && dl === today) {
      add(`venc-${t.ID}`, 'Vence hoje', `"${t.Titulo}" precisa ser concluída hoje.`, t.DataLimite);
    }

    if (t.Status === TaskStatus.AGUARDANDO_APROVACAO) {
      add(`enviada-${t.ID}`, 'Enviada para aprovação', `"${t.Titulo}" aguarda a conferência do gestor.`, t.DataConclusao || t.DataLimite);
    }
    if (t.Status === TaskStatus.APROVADA) {
      add(`aprov-${t.ID}`, 'Tarefa aprovada', `"${t.Titulo}" foi aprovada e os pontos foram creditados.`, t.DataConclusao || t.DataLimite);
    }
    if ((t.Status === TaskStatus.FEITA_ERRADA || t.Status === TaskStatus.NAO_FEITA) && (t.JustificativaGestor || t.ObservacaoGestor)) {
      const just = t.JustificativaGestor || t.ObservacaoGestor;
      const prazo = dl ? ` Novo prazo: ${br(dl)}.` : '';
      add(`reprov-${t.ID}`, 'Tarefa reprovada', `"${t.Titulo}": ${just}.${prazo}`, t.DataLimite);
    }
  }

  if (isManager) {
    const pendentes = tasks.filter(t => t.Status === TaskStatus.AGUARDANDO_APROVACAO).length;
    if (pendentes > 0) {
      add(`pend-gestor-${pendentes}`, 'Entregas para conferir', `${pendentes} entrega${pendentes > 1 ? 's' : ''} aguardando sua aprovação.`);
    }
  }

  return out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
