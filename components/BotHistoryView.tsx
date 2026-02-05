
import React, { useState } from 'react';
import { BotLog } from '../types';
import { useStore } from '../store';
import { 
  Zap, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Terminal, 
  Info, 
  AlertCircle,
  Clock,
  Database,
  Search,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface BotHistoryViewProps {
  logs: BotLog[];
}

const BotHistoryView: React.FC<BotHistoryViewProps> = ({ logs }) => {
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const { auditAndFixTasks } = useStore();
  const [auditResult, setAuditResult] = useState<{found: number, updated: number, manualFixes: string[]} | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      const result = auditAndFixTasks();
      setAuditResult(result);
      setIsAuditing(false);
    }, 1000);
  };

  const getRecommendation = (error?: string) => {
    if (!error) return null;
    if (error.includes('Duplicate')) return "O colaborador já possui esta tarefa hoje. Ajuste a frequência ou force a geração se necessário.";
    if (error.includes('Responsável')) return "Vá em 'Gerenciar Tarefas Recorrentes' e associe um colaborador válido ao modelo.";
    if (error.includes('Data limite')) return "Verifique as configurações de dia do mês ou dias da semana no modelo.";
    if (error.includes('Ref')) return "O campo 'Responsável' aponta para um e-mail não cadastrado. Verifique o cadastro do usuário.";
    return "Revise os campos obrigatórios no modelo (Template) e tente gerar novamente manualmente.";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-ciatos pb-20">
      <div className="bg-[#8B1B1F] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-3xl font-bold uppercase tracking-tight mb-2">Logs de Automação (Auditoria)</h3>
          <p className="text-white/60 font-medium italic">Histórico de execução técnica do motor de regras 'GC_Bot_Generator'.</p>
        </div>
        <Zap size={100} className="absolute right-10 top-1/2 -translate-y-1/2 opacity-10" />
      </div>

      {/* Seção de Auditoria de Integridade */}
      <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                 <ShieldCheck size={20} />
              </div>
              <div>
                 <h4 className="text-sm font-black uppercase tracking-widest text-[#111111]">Auditoria de Integridade (72h)</h4>
                 <p className="text-[10px] text-gray-400 font-bold uppercase">Verificação de inconsistências off-by-one em tarefas geradas por modelo.</p>
              </div>
           </div>
           <button 
             onClick={handleRunAudit}
             disabled={isAuditing}
             className="bg-[#8B1B1F] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#6F0F14] transition-all disabled:opacity-50"
           >
             {isAuditing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
             Executar Varredura Agora
           </button>
        </div>

        {auditResult && (
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
             <div className="text-center">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Encontradas (72h)</p>
                <p className="text-2xl font-black text-[#111111]">{auditResult.found}</p>
             </div>
             <div className="text-center border-x border-gray-200">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Atualizadas Automaticamente</p>
                <p className="text-2xl font-black text-green-600">{auditResult.updated}</p>
             </div>
             <div className="text-center">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Falhas (Correção Manual)</p>
                <p className={`text-2xl font-black ${auditResult.manualFixes.length > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                   {auditResult.manualFixes.length}
                </p>
             </div>
             
             {auditResult.manualFixes.length > 0 && (
                <div className="col-span-full pt-4 border-t border-gray-200">
                   <p className="text-[10px] font-black text-red-600 uppercase mb-2">Relatório de Correção Manual Necessária:</p>
                   <div className="bg-white p-4 rounded-xl border border-red-50 text-[9px] font-mono text-gray-600 space-y-1">
                      {auditResult.manualFixes.map((f, i) => <p key={i}>• {f}</p>)}
                   </div>
                </div>
             )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
           <div className="flex items-center gap-2">
              <Terminal size={18} className="text-[#8B1B1F]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">TaskGenerationLog - Últimos 20 Eventos</span>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead>
              <tr className="bg-gray-50/20 border-b border-gray-100">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-48">Timestamp</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Modelo / Resultado</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-32">Status Run</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-24">Task_ID</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right w-24">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length > 0 ? (
                logs.map(log => (
                  <React.Fragment key={log.ID}>
                    <tr className={`hover:bg-gray-50/50 transition-colors ${log.Status === 'FAILURE' ? 'bg-red-50/20' : ''}`}>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                          <Clock size={12} />
                          {new Date(log.Timestamp).toLocaleString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#111111]">{log.TemplateTitle}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${log.Status === 'SUCCESS' ? 'text-green-600' : 'text-red-400'}`}>
                            {log.Resultado}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 mx-auto w-fit border ${
                          log.Status === 'SUCCESS' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {log.Status === 'SUCCESS' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {log.Status}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className="text-[10px] font-mono font-bold text-gray-400">{log.TaskID}</span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button 
                          onClick={() => setExpandedLog(expandedLog === log.ID ? null : log.ID)}
                          className="p-2 text-gray-300 hover:text-[#8B1B1F] transition-colors"
                        >
                          {expandedLog === log.ID ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </td>
                    </tr>
                    
                    {expandedLog === log.ID && (
                      <tr>
                        <td colSpan={5} className="bg-gray-50/50 p-8 animate-in slide-in-from-top-2">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                 <h5 className="text-[10px] font-black uppercase text-[#8B1B1F] flex items-center gap-2">
                                    <Database size={12} /> Atribuições (Action: Add a new row)
                                 </h5>
                                 <div className="bg-white p-4 rounded-2xl border border-gray-100 font-mono text-[11px] space-y-2">
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                       <span className="text-gray-400">[ModeloID]:</span>
                                       <span className="text-[#111111] font-bold">{log.ModeloId}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                       <span className="text-gray-400">[Responsavel]:</span>
                                       <span className="text-[#111111] font-bold">{log.Responsavel}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                       <span className="text-gray-400">[DataLimite]:</span>
                                       <span className="text-[#111111] font-bold">{log.DataLimite}</span>
                                    </div>
                                    {log.ActionParams && Object.entries(log.ActionParams).map(([col, val]) => (
                                      <div key={col} className="flex justify-between border-b border-gray-50 pb-1">
                                         <span className="text-gray-400">[{col}]:</span>
                                         <span className="text-[#111111] font-bold truncate ml-4" title={String(val)}>{String(val)}</span>
                                      </div>
                                    ))}
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <h5 className="text-[10px] font-black uppercase text-red-600 flex items-center gap-2">
                                    <AlertCircle size={12} /> Mensagem de Aborto & Recomendação
                                 </h5>
                                 {log.Status === 'FAILURE' ? (
                                   <div className="space-y-4">
                                      <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                                         <p className="text-[11px] text-red-700 font-bold italic leading-relaxed">"{log.ErrorDetail}"</p>
                                      </div>
                                      <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex gap-3">
                                         <Info size={20} className="text-blue-500 shrink-0" />
                                         <div>
                                            <p className="text-[10px] font-black text-blue-800 uppercase mb-1">Recomendação de Ajuste:</p>
                                            <p className="text-xs text-blue-600 font-medium">{getRecommendation(log.ErrorDetail)}</p>
                                         </div>
                                      </div>
                                   </div>
                                 ) : (
                                   <div className="bg-green-50 p-6 rounded-3xl flex items-center justify-center border border-green-100">
                                      <p className="text-xs text-green-700 font-bold flex items-center gap-2">
                                         <CheckCircle2 size={16}/> Execução de Teste Manual: Sucesso. Linha visível na 'Mesa de Trabalho'.
                                      </p>
                                   </div>
                                 )}
                              </div>
                           </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Zap size={48} className="mx-auto text-gray-100 mb-4" />
                    <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Sem registros de auditoria na tabela 'TaskGenerationLog'.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BotHistoryView;
