
import React, { useState, useMemo } from 'react';
import { TaskTemplate, RecurrenceType, TaskPriority, User, UserRole, Task, TaskStatus } from '../types';
import { getTodayStr, toDateOnly } from '../store';
import { Plus, Trash2, RotateCw, FileText, User as UserIcon, X, Save, Calendar, CheckSquare, Clock, Zap, AlertTriangle, Info, ListChecks, CalendarDays, ArrowRightLeft, Pencil, ChevronDown } from 'lucide-react';
import { useUndoableDelete } from './ui';

interface TemplateManagerProps {
  templates: TaskTemplate[];
  tasks: Task[];
  users: User[];
  onAdd: (template: Omit<TaskTemplate, 'ID'>) => void;
  onUpdate: (id: string, template: Omit<TaskTemplate, 'ID'>) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onGenerateNow: (id: string, force?: boolean) => any;
}

// Situação exibida para um modelo, com base na tarefa gerada (quando houver).
interface SituacaoModelo { label: string; cls: string; gerou: boolean; concluida: boolean; }

const TemplateManager: React.FC<TemplateManagerProps> = ({ templates, tasks, users, onAdd, onUpdate, onToggle, onDelete, onGenerateNow }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{ templateId: string, title: string } | null>(null);
  const [filterColaborador, setFilterColaborador] = useState<string>('TODOS');
  const { pendentes: excluindo, remover: excluirModelo } = useUndoableDelete(onDelete, 'Modelo');
  
  const today = getTodayStr();
  // Qualquer pessoa da operação pode ser responsável por uma tarefa (colaborador, gestor ou admin)
  const collaborators = users.filter(u =>
    u.Role === UserRole.COLABORADOR || u.Role === UserRole.GESTOR ||
    u.Role === UserRole.ADMIN || u.Role === UserRole.MASTER || u.Role === UserRole.PLATAFORMA
  );
  const colaboradoresList = users.filter(u => u.Role === UserRole.COLABORADOR);
  const gestoresList = users.filter(u => u.Role === UserRole.GESTOR);
  const adminList = users.filter(u => u.Role === UserRole.ADMIN);
  // Master (dono da empresa) e plataforma também podem ser responsáveis por tarefas.
  const masterList = users.filter(u => u.Role === UserRole.MASTER || u.Role === UserRole.PLATAFORMA);
  const filteredTemplates = (filterColaborador === 'TODOS' ? templates : templates.filter(t => t.Responsavel === filterColaborador))
    .filter(t => !excluindo.has(t.ID));

  const [mostrarConcluidos, setMostrarConcluidos] = useState(false);
  const ehAvulsa = (tmpl: TaskTemplate) => tmpl.Recorrencia === RecurrenceType.DATA_ESPECIFICA;

  // Situação de um modelo a partir da tarefa mais recente gerada por ele.
  const situacaoDe = (tmpl: TaskTemplate): SituacaoModelo => {
    const t = tasks
      .filter(x => x.TemplateID === tmpl.ID)
      .sort((a, b) => (b.DataGeracao || '').localeCompare(a.DataGeracao || ''))[0];
    if (!t) {
      return ehAvulsa(tmpl)
        ? { label: 'A gerar', cls: 'text-stone-500 bg-stone-50 border-stone-200', gerou: false, concluida: false }
        : { label: tmpl.Ativa ? 'Ativo' : 'Pausado', cls: tmpl.Ativa ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-400 bg-gray-50 border-gray-200', gerou: false, concluida: false };
    }
    const atrasada = t.Status === TaskStatus.ATRASADA || (t.Status === TaskStatus.PENDENTE && (t.DataLimite_Date || '') < today);
    let label = 'A fazer', cls = 'text-stone-500 bg-stone-50 border-stone-200';
    if (t.Status === TaskStatus.APROVADA) { label = 'Concluída'; cls = 'text-green-700 bg-green-50 border-green-200'; }
    else if (t.Status === TaskStatus.AGUARDANDO_APROVACAO) { label = 'Aguardando aprovação'; cls = 'text-blue-700 bg-blue-50 border-blue-200'; }
    else if (atrasada) { label = 'Atrasada'; cls = 'text-red-700 bg-red-50 border-red-200'; }
    else if ((t.Andamento || 'Pendente') === 'Em andamento') { label = 'Em andamento'; cls = 'text-sky-700 bg-sky-50 border-sky-200'; }
    else if (t.Status === TaskStatus.FEITA_ERRADA || t.Status === TaskStatus.NAO_FEITA) { label = 'Refazer'; cls = 'text-amber-700 bg-amber-50 border-amber-200'; }
    return { label, cls, gerou: true, concluida: t.Status === TaskStatus.APROVADA };
  };

  const comSituacao = filteredTemplates.map(tmpl => ({ tmpl, sit: situacaoDe(tmpl) }));
  // Avulsa já concluída sai do fluxo ativo (vira histórico); o resto fica no topo.
  const ativos = comSituacao.filter(x => !(ehAvulsa(x.tmpl) && x.sit.concluida));
  const concluidos = comSituacao.filter(x => ehAvulsa(x.tmpl) && x.sit.concluida);

  const renderRow = (tmpl: TaskTemplate, sit: SituacaoModelo, index: number, total: number) => (
    <div
      key={tmpl.ID}
      className={`flex flex-col md:grid md:grid-cols-[1fr_160px_180px_120px_160px] gap-2 md:gap-4 items-start md:items-center px-6 py-4 transition-colors hover:bg-gray-50/50 ${index < total - 1 ? 'border-b border-gray-50' : ''} ${sit.concluida ? 'opacity-60' : !tmpl.Ativa ? 'opacity-40' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sit.concluida ? '#22c55e' : tmpl.Ativa ? '#22c55e' : '#d1d5db' }}></div>
        <span className="text-sm font-bold text-[#111111] truncate">{tmpl.Titulo}</span>
      </div>

      <div className="flex items-center gap-2 pl-5 md:pl-0">
        <UserIcon size={12} className="text-gray-300 flex-shrink-0" />
        <span className="text-[11px] font-semibold text-gray-500 truncate">
          {users.find(u => u.Email === tmpl.Responsavel)?.Nome || tmpl.Responsavel}
        </span>
      </div>

      <div className="flex items-center gap-2 pl-5 md:pl-0">
        {tmpl.Recorrencia === RecurrenceType.DATA_ESPECIFICA ? (
          <>
            <Calendar size={12} className="text-blue-400 flex-shrink-0" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">{toDateOnly(tmpl.DataInicio).split('-').reverse().join('/')}</span>
          </>
        ) : tmpl.Recorrencia === RecurrenceType.SEMANAL ? (
          <>
            <RotateCw size={12} className="text-marca/50 flex-shrink-0" />
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider truncate">{tmpl.DiasRecorrencia.join(', ')}</span>
          </>
        ) : (tmpl.Recorrencia === RecurrenceType.POR_DATA_FIXA || tmpl.Recorrencia === RecurrenceType.MENSAL) ? (
          <>
            <CalendarDays size={12} className="text-marca/50 flex-shrink-0" />
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider">Dia {tmpl.DiaDoMes}/mês</span>
          </>
        ) : (
          <>
            <Clock size={12} className="text-gray-400 flex-shrink-0" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{tmpl.Recorrencia}</span>
          </>
        )}
      </div>

      {/* Status da tarefa gerada (ou do modelo) */}
      <div className="pl-5 md:pl-0">
        <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${sit.cls}`}>{sit.label}</span>
      </div>

      <div className="flex items-center gap-1 justify-end w-full md:w-auto pl-5 md:pl-0">
        {(!ehAvulsa(tmpl) || !sit.gerou) && (
          <button
            onClick={() => handleGenerateClick(tmpl.ID)}
            className="flex items-center gap-1.5 bg-marca text-white px-3 py-2 rounded-xl font-black uppercase tracking-wider text-[8px] shadow-sm hover:bg-marca-escuro transition-all"
            title="Gerar tarefa agora"
          >
            <Zap size={11} className="fill-current" /> Gerar
          </button>
        )}
        <button onClick={() => abrirEdicao(tmpl)} className="p-2 text-stone-500 hover:bg-stone-100 rounded-xl transition-colors" title="Editar modelo">
          <Pencil size={14} />
        </button>
        <button onClick={() => onToggle(tmpl.ID)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title={tmpl.Ativa ? 'Pausar' : 'Ativar'}>
          <RotateCw size={14} />
        </button>
        <button onClick={() => excluirModelo(tmpl.ID)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Excluir modelo">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
  
  const [formData, setFormData] = useState<Omit<TaskTemplate, 'ID'>>({
    Titulo: '', Descricao: '', Responsavel: '', PontosValor: 50, Prioridade: TaskPriority.MEDIA,
    Recorrencia: RecurrenceType.DIARIA, DiasRecorrencia: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
    DiaDoMes: 1, DataInicio: today, PularFinalDeSemana: false, Ativa: true
  });

  const previewDataExecucao = useMemo(() => {
    // Se for DATA ESPECÍFICA, a data é exatamente o que estiver em DataInicio
    if (formData.Recorrencia === RecurrenceType.DATA_ESPECIFICA) {
      return toDateOnly(formData.DataInicio).split('-').reverse().join('/');
    }

    const parts = today.split('-');
    const spToday = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

    // Se é Semanal, busca o próximo dia habilitado
    if (formData.Recorrencia === RecurrenceType.SEMANAL) {
      const daysMap: Record<string, number> = { 'Dom': 0, 'Seg': 1, 'Ter': 2, 'Qua': 3, 'Qui': 4, 'Sex': 5, 'Sab': 6 };
      const selectedDays = formData.DiasRecorrencia.map(d => daysMap[d]);
      
      if (selectedDays.length === 0) return 'Selecione os dias';

      const nextDate = new Date(spToday);
      let found = false;
      for (let i = 0; i < 8; i++) {
        if (selectedDays.includes(nextDate.getDay())) {
          found = true;
          break;
        }
        nextDate.setDate(nextDate.getDate() + 1);
      }
      return nextDate.toLocaleDateString('pt-BR');
    }

    // Se é Data Fixa, o dia de execução é o DiaDoMes informado (Repetitivo mensal)
    if ((formData.Recorrencia === RecurrenceType.MENSAL || formData.Recorrencia === RecurrenceType.POR_DATA_FIXA) && formData.DiaDoMes) {
      const targetDay = formData.DiaDoMes;
      const nextDate = new Date(spToday.getFullYear(), spToday.getMonth(), targetDay);
      if (spToday.getDate() > targetDay) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      return nextDate.toLocaleDateString('pt-BR');
    }
    
    if (formData.Recorrencia === RecurrenceType.DIARIA) return spToday.toLocaleDateString('pt-BR');
    
    const startParts = formData.DataInicio.split('-');
    const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
    return startDate.toLocaleDateString('pt-BR');
  }, [formData.Recorrencia, formData.DiaDoMes, formData.DataInicio, formData.DiasRecorrencia, today]);

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      DiasRecorrencia: prev.DiasRecorrencia.includes(day)
        ? prev.DiasRecorrencia.filter(d => d !== day)
        : [...prev.DiasRecorrencia, day]
    }));
  };

  const handleGenerateClick = (id: string) => {
    const result = onGenerateNow(id);
    if (result && result.duplicate) {
      setDuplicateWarning({ templateId: id, title: result.template.Titulo });
    }
  };

  const formVazio = (): Omit<TaskTemplate, 'ID'> => ({
    Titulo: '', Descricao: '', Responsavel: '', PontosValor: 50, Prioridade: TaskPriority.MEDIA,
    Recorrencia: RecurrenceType.DIARIA, DiasRecorrencia: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
    DiaDoMes: 1, DataInicio: today, PularFinalDeSemana: false, Ativa: true,
  });

  const abrirNovo = () => { setEditingId(null); setFormData(formVazio()); setIsModalOpen(true); };

  const abrirEdicao = (t: TaskTemplate) => {
    setEditingId(t.ID);
    setFormData({
      Titulo: t.Titulo, Descricao: t.Descricao, Responsavel: t.Responsavel, PontosValor: t.PontosValor,
      Prioridade: t.Prioridade, Recorrencia: t.Recorrencia, DiasRecorrencia: t.DiasRecorrencia || [],
      DiaDoMes: t.DiaDoMes || 1, DataInicio: t.DataInicio || today,
      PularFinalDeSemana: t.PularFinalDeSemana || false, Ativa: t.Ativa,
    });
    setIsModalOpen(true);
  };

  const fecharModal = () => { setIsModalOpen(false); setEditingId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Titulo || !formData.Responsavel) return alert("Preencha os campos obrigatórios.");

    // Validações por tipo
    if (formData.Recorrencia === RecurrenceType.DATA_ESPECIFICA && !formData.DataInicio) {
        return alert("Por favor, selecione a data de execução específica.");
    }
    if (formData.Recorrencia === RecurrenceType.SEMANAL && formData.DiasRecorrencia.length === 0) {
        return alert("Selecione ao menos um dia da semana para recorrência semanal.");
    }

    if (editingId) onUpdate(editingId, formData);
    else onAdd(formData);
    fecharModal();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-ciatos pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.14em]">Tarefas</p>
          <h3 className="text-3xl md:text-4xl text-stone-900 mt-1">Gerar tarefas</h3>
          <p className="text-stone-500 mt-1">Crie e dispare as tarefas da equipe — recorrentes (diária, semanal, mensal) ou avulsas (data específica).</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none appearance-none cursor-pointer text-stone-700 focus:ring-2 focus:ring-marca/20"
            value={filterColaborador}
            onChange={e => setFilterColaborador(e.target.value)}
          >
            <option value="TODOS">Todas as pessoas</option>
            {collaborators.map(u => <option key={u.Email} value={u.Email}>{u.Nome}</option>)}
          </select>
          <button onClick={abrirNovo} className="inline-flex items-center gap-2 bg-marca text-white pl-5 pr-6 py-3 rounded-xl text-sm font-semibold hover:bg-marca-escuro transition-colors active:scale-[0.98]">
            <Plus size={18} /> Nova tarefa
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header da Lista */}
        <div className="hidden md:grid md:grid-cols-[1fr_160px_180px_120px_160px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Título</span>
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Responsável</span>
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Recorrência</span>
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Status</span>
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider text-right">Ações</span>
        </div>

        {ativos.length === 0 && concluidos.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="text-stone-600 text-lg">Nenhuma tarefa configurada ainda.</p>
            <p className="text-stone-400 text-sm mt-1">Crie a primeira — recorrente ou avulsa — para começar.</p>
          </div>
        )}
        {ativos.length === 0 && concluidos.length > 0 && (
          <div className="px-6 py-10 text-center text-stone-400 text-sm">Nenhum modelo ativo — veja as concluídas abaixo.</div>
        )}

        {ativos.map((x, index) => renderRow(x.tmpl, x.sit, index, ativos.length))}
      </div>

      {/* Avulsas já concluídas (histórico recolhível) */}
      {concluidos.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setMostrarConcluidos(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-semibold text-stone-600">
              Concluídas <span className="text-stone-400">({concluidos.length})</span>
            </span>
            <ChevronDown size={18} className={`text-stone-400 transition-transform ${mostrarConcluidos ? 'rotate-180' : ''}`} />
          </button>
          {mostrarConcluidos && (
            <div className="border-t border-gray-100">
              {concluidos.map((x, index) => renderRow(x.tmpl, x.sit, index, concluidos.length))}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
               <h3 className="font-titulo text-xl text-tinta">{editingId ? 'Editar modelo' : 'Novo modelo de tarefa'}</h3>
               <button onClick={fecharModal} className="text-gray-300 hover:text-gray-500 transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
               
               <div className="bg-marca/5 p-6 rounded-2xl border border-marca/10 space-y-4">
                  <div className="flex items-center gap-3 text-[10px] font-black text-marca uppercase tracking-[0.2em] mb-2">
                    <Calendar size={14} /> Fluxo de Datas Previsto
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Solicitação (Hoje)</p>
                      <p className="text-sm font-black text-[#111111]">{today.split('-').reverse().join('/')}</p>
                    </div>
                    <ArrowRightLeft size={16} className="text-marca opacity-30" />
                    <div className="flex-1 text-right">
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Execução (Prazo)</p>
                      <p className="text-sm font-black text-marca">{previewDataExecucao}</p>
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Título da Tarefa Corporativa</label>
                    <input required className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-marca/10" placeholder="Ex: Conciliação de Contas" value={formData.Titulo} onChange={e => setFormData({...formData, Titulo: e.target.value})} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Detalhes / Instruções <span className="text-stone-300 normal-case">(opcional)</span></label>
                    <textarea
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm outline-none focus:ring-4 focus:ring-marca/10 min-h-[96px]"
                      placeholder="Descreva o escopo do serviço: o que precisa ser feito, passos, o que entregar, links ou referências…"
                      value={formData.Descricao}
                      onChange={e => setFormData({...formData, Descricao: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Responsável pela Tarefa</label>
                      <select required className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.Responsavel} onChange={e => setFormData({...formData, Responsavel: e.target.value})}>
                        <option value="">Vincular responsável...</option>
                        {masterList.length > 0 && (
                          <optgroup label="Master / Direção">
                            {masterList.map(u => <option key={u.Email} value={u.Email}>{u.Nome}</option>)}
                          </optgroup>
                        )}
                        {colaboradoresList.length > 0 && (
                          <optgroup label="Colaboradores">
                            {colaboradoresList.map(u => <option key={u.Email} value={u.Email}>{u.Nome}</option>)}
                          </optgroup>
                        )}
                        {gestoresList.length > 0 && (
                          <optgroup label="Gestores">
                            {gestoresList.map(u => <option key={u.Email} value={u.Email}>{u.Nome}</option>)}
                          </optgroup>
                        )}
                        {adminList.length > 0 && (
                          <optgroup label="Administração">
                            {adminList.map(u => <option key={u.Email} value={u.Email}>{u.Nome}</option>)}
                          </optgroup>
                        )}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-marca uppercase tracking-widest">
                        {formData.Recorrencia === RecurrenceType.DATA_ESPECIFICA ? "Data de Execução" : "Data de Início"}
                      </label>
                      <input type="date" required className="w-full bg-white border-2 border-marca/20 rounded-2xl p-4 text-sm font-bold outline-none focus:border-marca" value={formData.DataInicio} onChange={e => setFormData({...formData, DataInicio: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Tipo de Recorrência</label>
                      <select className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-black uppercase outline-none" value={formData.Recorrencia} onChange={e => setFormData({...formData, Recorrencia: e.target.value as RecurrenceType})}>
                        <option value={RecurrenceType.DIARIA}>Diária</option>
                        <option value={RecurrenceType.SEMANAL}>Semanal</option>
                        <option value={RecurrenceType.POR_DATA_FIXA}>Por Data Fixa (Mensal)</option>
                        <option value={RecurrenceType.DATA_ESPECIFICA}>Data Específica (Única)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Pontuação (Mérito)</label>
                      <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.PontosValor} onChange={e => setFormData({...formData, PontosValor: parseInt(e.target.value)})} />
                    </div>
                  </div>

                  {/* Seletor de Dias da Semana para Semanal */}
                  {formData.Recorrencia === RecurrenceType.SEMANAL && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black text-marca uppercase tracking-widest">Escolha os Dias da Semana *</label>
                      <div className="flex flex-wrap gap-2">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`h-11 w-11 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                              formData.DiasRecorrencia.includes(day)
                                ? 'bg-marca border-marca text-white shadow-md'
                                : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-marca/30'
                            }`}
                          >
                            {day.charAt(0)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mostra Dia do Mês apenas se for Mensal ou Data Fixa Repetitiva */}
                  {(formData.Recorrencia === RecurrenceType.MENSAL || formData.Recorrencia === RecurrenceType.POR_DATA_FIXA) && (
                    <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black text-marca uppercase tracking-widest">Dia do Mês para Execução (1 a 31) *</label>
                      <input type="number" min="1" max="31" required className="w-full bg-white border-2 border-marca/20 rounded-2xl p-4 text-sm font-black outline-none" placeholder="Ex: 10" value={formData.DiaDoMes} onChange={e => setFormData({...formData, DiaDoMes: parseInt(e.target.value)})} />
                    </div>
                  )}

                  {/* Opção de Pular Final de Semana */}
                  {(formData.Recorrencia === RecurrenceType.POR_DATA_FIXA || formData.Recorrencia === RecurrenceType.MENSAL || formData.Recorrencia === RecurrenceType.DATA_ESPECIFICA) && (
                    <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100 animate-in slide-in-from-top-2 duration-300">
                      <input 
                        type="checkbox" 
                        id="pularFds"
                        checked={formData.PularFinalDeSemana || false} 
                        onChange={e => setFormData({...formData, PularFinalDeSemana: e.target.checked})}
                        className="h-5 w-5 rounded border-orange-300 text-marca focus:ring-marca"
                      />
                      <label htmlFor="pularFds" className="text-xs font-bold text-orange-800 cursor-pointer">
                        Se a data cair em sábado ou domingo, transferir automaticamente para o próximo dia útil (segunda-feira)
                      </label>
                    </div>
                  )}
               </div>

               <div className="pt-6 border-t border-gray-100">
                  <button type="submit" className="w-full bg-marca text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:bg-marca-escuro transition-all hover:scale-[1.01] active:scale-95">
                    <Save size={20} /> {editingId ? 'Salvar alterações' : 'Criar modelo'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
