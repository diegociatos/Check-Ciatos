
import React, { useState, useMemo } from 'react';
import { TaskTemplate, RecurrenceType, TaskPriority, User, UserRole } from '../types';
import { getTodayStr, toDateOnly } from '../store';
import { Plus, Trash2, RotateCw, FileText, User as UserIcon, X, Save, Calendar, CheckSquare, Clock, Zap, AlertTriangle, Info, ListChecks, CalendarDays, ArrowRightLeft } from 'lucide-react';

interface TemplateManagerProps {
  templates: TaskTemplate[];
  users: User[];
  onAdd: (template: Omit<TaskTemplate, 'ID'>) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onGenerateNow: (id: string, force?: boolean) => any;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ templates, users, onAdd, onToggle, onDelete, onGenerateNow }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{ templateId: string, title: string } | null>(null);
  const [filterColaborador, setFilterColaborador] = useState<string>('TODOS');
  
  const today = getTodayStr();
  const collaborators = users.filter(u => u.Role === UserRole.COLABORADOR);
  const filteredTemplates = filterColaborador === 'TODOS' ? templates : templates.filter(t => t.Responsavel === filterColaborador);
  
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

      let nextDate = new Date(spToday);
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
      let nextDate = new Date(spToday.getFullYear(), spToday.getMonth(), targetDay);
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

    onAdd(formData);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-ciatos pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-[#8B1B1F] uppercase tracking-tighter">Modelos de Recorrência</h3>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Gestão de Automação de Obrigações</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="bg-[#F3F3F3] border-none rounded-2xl px-4 py-3 text-sm font-bold outline-none appearance-none cursor-pointer text-[#111111]"
            value={filterColaborador}
            onChange={e => setFilterColaborador(e.target.value)}
          >
            <option value="TODOS">Todos os Colaboradores</option>
            {collaborators.map(u => <option key={u.Email} value={u.Email}>{u.Nome}</option>)}
          </select>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[#8B1B1F] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-all">
            <Plus size={18} /> Novo Modelo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header da Lista */}
        <div className="hidden md:grid md:grid-cols-[1fr_160px_180px_100px_160px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Título</span>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Responsável</span>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Recorrência</span>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</span>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</span>
        </div>

        {filteredTemplates.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Nenhum modelo de recorrência encontrado.
          </div>
        )}

        {filteredTemplates.map((tmpl, index) => (
          <div 
            key={tmpl.ID} 
            className={`flex flex-col md:grid md:grid-cols-[1fr_160px_180px_100px_160px] gap-2 md:gap-4 items-start md:items-center px-6 py-4 transition-colors hover:bg-gray-50/50 ${index < filteredTemplates.length - 1 ? 'border-b border-gray-50' : ''} ${!tmpl.Ativa ? 'opacity-40' : ''}`}
          >
            {/* Título */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tmpl.Ativa ? '#22c55e' : '#d1d5db' }}></div>
              <span className="text-sm font-bold text-[#111111] truncate">{tmpl.Titulo}</span>
            </div>

            {/* Responsável */}
            <div className="flex items-center gap-2 pl-5 md:pl-0">
              <UserIcon size={12} className="text-gray-300 flex-shrink-0" />
              <span className="text-[11px] font-semibold text-gray-500 truncate">
                {users.find(u => u.Email === tmpl.Responsavel)?.Nome || tmpl.Responsavel}
              </span>
            </div>

            {/* Recorrência / Detalhe */}
            <div className="flex items-center gap-2 pl-5 md:pl-0">
              {tmpl.Recorrencia === RecurrenceType.DATA_ESPECIFICA ? (
                <>
                  <Calendar size={12} className="text-blue-400 flex-shrink-0" />
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">
                    {toDateOnly(tmpl.DataInicio).split('-').reverse().join('/')}
                  </span>
                </>
              ) : tmpl.Recorrencia === RecurrenceType.SEMANAL ? (
                <>
                  <RotateCw size={12} className="text-[#8B1B1F]/50 flex-shrink-0" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider truncate">
                    {tmpl.DiasRecorrencia.join(', ')}
                  </span>
                </>
              ) : (tmpl.Recorrencia === RecurrenceType.POR_DATA_FIXA || tmpl.Recorrencia === RecurrenceType.MENSAL) ? (
                <>
                  <CalendarDays size={12} className="text-[#8B1B1F]/50 flex-shrink-0" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider">
                    Dia {tmpl.DiaDoMes}/mês
                  </span>
                </>
              ) : (
                <>
                  <Clock size={12} className="text-gray-400 flex-shrink-0" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                    {tmpl.Recorrencia}
                  </span>
                </>
              )}
            </div>

            {/* Status Badge */}
            <div className="pl-5 md:pl-0">
              <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                tmpl.Ativa 
                  ? 'text-green-700 bg-green-50 border-green-200' 
                  : 'text-gray-400 bg-gray-50 border-gray-200'
              }`}>
                {tmpl.Ativa ? 'Ativo' : 'Pausado'}
              </span>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1 justify-end w-full md:w-auto pl-5 md:pl-0">
              <button 
                onClick={() => handleGenerateClick(tmpl.ID)}
                className="flex items-center gap-1.5 bg-[#8B1B1F] text-white px-3 py-2 rounded-xl font-black uppercase tracking-wider text-[8px] shadow-sm hover:bg-[#6F0F14] transition-all"
                title="Gerar tarefa agora"
              >
                <Zap size={11} className="fill-current" /> Gerar
              </button>
              <button onClick={() => onToggle(tmpl.ID)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title={tmpl.Ativa ? 'Pausar' : 'Ativar'}>
                <RotateCw size={14} />
              </button>
              <button onClick={() => onDelete(tmpl.ID)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Excluir">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
               <h3 className="text-xl font-bold text-[#111111] uppercase tracking-tighter">Configurar Novo Modelo</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-gray-500 transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
               
               <div className="bg-[#8B1B1F]/5 p-6 rounded-3xl border border-[#8B1B1F]/10 space-y-4">
                  <div className="flex items-center gap-3 text-[10px] font-black text-[#8B1B1F] uppercase tracking-[0.2em] mb-2">
                    <Calendar size={14} /> Fluxo de Datas Previsto
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Solicitação (Hoje)</p>
                      <p className="text-sm font-black text-[#111111]">{today.split('-').reverse().join('/')}</p>
                    </div>
                    <ArrowRightLeft size={16} className="text-[#8B1B1F] opacity-30" />
                    <div className="flex-1 text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Execução (Prazo)</p>
                      <p className="text-sm font-black text-[#8B1B1F]">{previewDataExecucao}</p>
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Título da Tarefa Corporativa</label>
                    <input required className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#8B1B1F]/10" placeholder="Ex: Conciliação de Contas" value={formData.Titulo} onChange={e => setFormData({...formData, Titulo: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsável Operacional</label>
                      <select required className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.Responsavel} onChange={e => setFormData({...formData, Responsavel: e.target.value})}>
                        <option value="">Vincular Colaborador...</option>
                        {users.filter(u => u.Role === UserRole.COLABORADOR).map(u => <option key={u.Email} value={u.Email}>{u.Nome}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#8B1B1F] uppercase tracking-widest">
                        {formData.Recorrencia === RecurrenceType.DATA_ESPECIFICA ? "Data de Execução" : "Data de Início"}
                      </label>
                      <input type="date" required className="w-full bg-white border-2 border-[#8B1B1F]/20 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#8B1B1F]" value={formData.DataInicio} onChange={e => setFormData({...formData, DataInicio: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Recorrência</label>
                      <select className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-black uppercase outline-none" value={formData.Recorrencia} onChange={e => setFormData({...formData, Recorrencia: e.target.value as RecurrenceType})}>
                        <option value={RecurrenceType.DIARIA}>Diária</option>
                        <option value={RecurrenceType.SEMANAL}>Semanal</option>
                        <option value={RecurrenceType.POR_DATA_FIXA}>Por Data Fixa (Mensal)</option>
                        <option value={RecurrenceType.DATA_ESPECIFICA}>Data Específica (Única)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pontuação (Mérito)</label>
                      <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.PontosValor} onChange={e => setFormData({...formData, PontosValor: parseInt(e.target.value)})} />
                    </div>
                  </div>

                  {/* Seletor de Dias da Semana para Semanal */}
                  {formData.Recorrencia === RecurrenceType.SEMANAL && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black text-[#8B1B1F] uppercase tracking-widest">Escolha os Dias da Semana *</label>
                      <div className="flex flex-wrap gap-2">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`h-11 w-11 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                              formData.DiasRecorrencia.includes(day)
                                ? 'bg-[#8B1B1F] border-[#8B1B1F] text-white shadow-md'
                                : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-[#8B1B1F]/30'
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
                      <label className="text-[10px] font-black text-[#8B1B1F] uppercase tracking-widest">Dia do Mês para Execução (1 a 31) *</label>
                      <input type="number" min="1" max="31" required className="w-full bg-white border-2 border-[#8B1B1F]/20 rounded-2xl p-4 text-sm font-black outline-none" placeholder="Ex: 10" value={formData.DiaDoMes} onChange={e => setFormData({...formData, DiaDoMes: parseInt(e.target.value)})} />
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
                        className="h-5 w-5 rounded border-orange-300 text-[#8B1B1F] focus:ring-[#8B1B1F]"
                      />
                      <label htmlFor="pularFds" className="text-xs font-bold text-orange-800 cursor-pointer">
                        Se a data cair em sábado ou domingo, transferir automaticamente para o próximo dia útil (segunda-feira)
                      </label>
                    </div>
                  )}
               </div>

               <div className="pt-6 border-t border-gray-100">
                  <button type="submit" className="w-full bg-[#8B1B1F] text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:bg-[#6F0F14] transition-all hover:scale-[1.01] active:scale-95">
                    <Save size={20} /> Salvar Modelo de Recorrência
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
