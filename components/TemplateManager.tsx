
import React, { useState } from 'react';
import { TaskTemplate, RecurrenceType, TaskPriority, User } from '../types';
import { Plus, Trash2, RotateCw, FileText, User as UserIcon, X, Save, Calendar, CheckSquare, Clock, Zap, AlertTriangle } from 'lucide-react';

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
  const [formData, setFormData] = useState<Omit<TaskTemplate, 'ID'>>({
    Titulo: '', Descricao: '', Responsavel: '', PontosValor: 50, Prioridade: TaskPriority.MEDIA,
    Recorrencia: RecurrenceType.DIARIA, DiasRecorrencia: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
    DiaDoMes: 1, DataInicio: new Date().toLocaleDateString('en-CA'), Ativa: true
  });

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

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

  const confirmGenerate = () => {
    if (duplicateWarning) {
      onGenerateNow(duplicateWarning.templateId, true);
      setDuplicateWarning(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Titulo || !formData.Responsavel) return alert("Preencha os campos obrigatórios.");
    onAdd(formData);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-ciatos font-bold text-[#6F0F14] uppercase">Modelos de Recorrência</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Status do Bot: <span className="text-green-600">ATIVADO (Execução Diária Sem Restrições)</span></p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[#8B1B1F] text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase shadow-xl hover:scale-105 transition-all">
          <Plus size={18} /> Novo Modelo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(tmpl => (
          <div key={tmpl.ID} className={`bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow ${!tmpl.Ativa ? 'opacity-50' : ''}`}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-[#8B1B1F] bg-[#8B1B1F]/5 px-3 py-1 rounded-full border border-[#8B1B1F]/10 uppercase">{tmpl.Recorrencia}</span>
                <div className="flex gap-1">
                  <button onClick={() => onToggle(tmpl.ID)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Pausar/Ativar"><RotateCw size={16} /></button>
                  <button onClick={() => onDelete(tmpl.ID)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={16} /></button>
                </div>
              </div>
              <h4 className="font-bold text-[#111111] mb-2">{tmpl.Titulo}</h4>
              <p className="text-xs text-gray-400 mb-4 line-clamp-2">{tmpl.Descricao}</p>
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest space-y-2">
                <div className="flex items-center gap-2"><UserIcon size={12}/> {users.find(u => u.Email === tmpl.Responsavel)?.Nome || tmpl.Responsavel}</div>
                <div className="flex items-center gap-2"><Calendar size={12}/> Início: {new Date(tmpl.DataInicio).toLocaleDateString('pt-BR')}</div>
                {(tmpl.Recorrencia === RecurrenceType.SEMANAL || tmpl.Recorrencia === RecurrenceType.DIARIA) && (
                   <div className="flex items-center gap-2"><CheckSquare size={12}/> {tmpl.DiasRecorrencia.join(', ')}</div>
                )}
                {tmpl.Recorrencia === RecurrenceType.MENSAL && <div className="flex items-center gap-2"><CheckSquare size={12}/> Dia {tmpl.DiaDoMes}</div>}
                
                {tmpl.UltimaExecucao && (
                   <div className="flex items-center gap-2 text-blue-600 pt-2 border-t border-gray-50">
                     <Clock size={12}/> 
                     <span>Última Geração: {new Date(tmpl.UltimaExecucao).toLocaleString()}</span>
                   </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-[#8B1B1F]">{tmpl.PontosValor} pts</span>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${tmpl.Ativa ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                  {tmpl.Ativa ? 'ATIVO' : 'PAUSADO'}
                </span>
              </div>
              
              <button 
                onClick={() => handleGenerateClick(tmpl.ID)}
                className="w-full bg-[#8B1B1F] text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-[#8B1B1F]/10 hover:bg-[#6F0F14] transition-all"
              >
                <Zap size={14} className="fill-current" /> Gerar Tarefa Agora (Hoje)
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Alerta Duplicata */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="p-8 text-center space-y-6">
                <div className="h-20 w-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                   <AlertTriangle size={40} />
                </div>
                <div>
                   <h3 className="text-xl font-ciatos font-bold text-[#111111] uppercase tracking-tighter">Atenção: Duplicata Identificada</h3>
                   <p className="text-sm text-gray-500 mt-2">Já existe uma tarefa com o título <strong>"{duplicateWarning.title}"</strong> para este colaborador hoje. Deseja criar mesmo assim?</p>
                </div>
                <div className="flex flex-col gap-3">
                   <button 
                     onClick={confirmGenerate}
                     className="w-full bg-[#8B1B1F] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#8B1B1F]/20 hover:scale-[1.02] transition-all"
                   >
                     Sim, criar novamente
                   </button>
                   <button 
                     onClick={() => setDuplicateWarning(null)}
                     className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                   >
                     Cancelar
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50">
               <h3 className="text-xl font-ciatos font-bold text-[#111111] uppercase">Novo Modelo de Tarefa</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-gray-500"><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
               <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Título da Tarefa</label>
                    <input required className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#8B1B1F]/10" value={formData.Titulo} onChange={e => setFormData({...formData, Titulo: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsável</label>
                      <select required className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.Responsavel} onChange={e => setFormData({...formData, Responsavel: e.target.value})}>
                        <option value="">Selecione...</option>
                        {users.filter(u => u.Role === 'Colaborador').map(u => <option key={u.Email} value={u.Email}>{u.Nome}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data de Início</label>
                      <input type="date" required className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.DataInicio} onChange={e => setFormData({...formData, DataInicio: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recorrência</label>
                      <select className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.Recorrencia} onChange={e => setFormData({...formData, Recorrencia: e.target.value as RecurrenceType})}>
                        <option value={RecurrenceType.DIARIA}>Diária (Seg-Dom)</option>
                        <option value={RecurrenceType.SEMANAL}>Semanal (Personalizado)</option>
                        <option value={RecurrenceType.MENSAL}>Mensal (Dia fixo)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pontuação</label>
                      <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.PontosValor} onChange={e => setFormData({...formData, PontosValor: parseInt(e.target.value)})} />
                    </div>
                  </div>

                  {(formData.Recorrencia === RecurrenceType.SEMANAL || formData.Recorrencia === RecurrenceType.DIARIA) && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dias da Semana (Todos Disponíveis)</label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {diasSemana.map(day => (
                          <button 
                            key={day} 
                            type="button" 
                            onClick={() => toggleDay(day)} 
                            className={`px-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all border flex items-center justify-center ${
                              formData.DiasRecorrencia.includes(day) 
                                ? 'bg-[#8B1B1F] text-white border-[#8B1B1F] shadow-lg shadow-[#8B1B1F]/20' 
                                : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] text-gray-400 italic">O Grupo Ciatos opera em regime total. Selecione inclusive Sáb e Dom se necessário.</p>
                    </div>
                  )}

                  {formData.Recorrencia === RecurrenceType.MENSAL && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dia do Mês (1-31)</label>
                      <input type="number" min="1" max="31" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.DiaDoMes} onChange={e => setFormData({...formData, DiaDoMes: parseInt(e.target.value)})} />
                    </div>
                  )}
               </div>
               <button type="submit" className="w-full bg-[#8B1B1F] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-[#6F0F14] transition-colors">
                  <Save size={20} /> Salvar Modelo de Entrega
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
