
import React, { useState, useEffect } from 'react';
import { PeriodType, User, UserRole, ReportFilter } from '../types';
import { Filter, Calendar, Users, ChevronRight, FileBarChart } from 'lucide-react';

interface ReportFiltersViewProps {
  currentUser: User;
  users: User[];
  onGenerate: (filter: ReportFilter) => void;
}

const ReportFiltersView: React.FC<ReportFiltersViewProps> = ({ currentUser, users, onGenerate }) => {
  const [colaboradorEmail, setColaboradorEmail] = useState('');
  const [periodo, setPeriodo] = useState<PeriodType>(PeriodType.MES);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [trimestre, setTrimestre] = useState<'T1' | 'T2' | 'T3' | 'T4'>('T1');
  const [semestre, setSemestre] = useState<'S1' | 'S2'>('S1');

  // Hierarquia de Segurança
  const colaboradoresDisponiveis = users.filter(u => {
    if (currentUser.Role === UserRole.ADMIN) return u.Role === UserRole.COLABORADOR;
    return u.Role === UserRole.COLABORADOR && u.Gestor === currentUser.Email;
  });

  const calculateDates = () => {
    let start = new Date(ano, 0, 1);
    let end = new Date(ano, 11, 31, 23, 59, 59);

    if (periodo === PeriodType.MES) {
      start = new Date(ano, mes - 1, 1);
      end = new Date(ano, mes, 0, 23, 59, 59);
    } else if (periodo === PeriodType.TRIMESTRE) {
      const qMap = { T1: 0, T2: 3, T3: 6, T4: 9 };
      start = new Date(ano, qMap[trimestre], 1);
      end = new Date(ano, qMap[trimestre] + 3, 0, 23, 59, 59);
    } else if (periodo === PeriodType.SEMESTRE) {
      if (semestre === 'S1') {
        start = new Date(ano, 0, 1);
        end = new Date(ano, 6, 0, 23, 59, 59);
      } else {
        start = new Date(ano, 6, 1);
        end = new Date(ano, 12, 0, 23, 59, 59);
      }
    }

    return { 
      DataInicio: start.toISOString(), 
      DataFim: end.toISOString() 
    };
  };

  const handleSumbit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colaboradorEmail) return alert("Selecione um colaborador.");

    const { DataInicio, DataFim } = calculateDates();
    const filter: ReportFilter = {
      ID: Math.random().toString(36).substr(2, 9),
      GestorEmail: currentUser.Email,
      ColaboradorEmail: colaboradorEmail,
      Periodo: periodo,
      Ano: ano,
      Mes: periodo === PeriodType.MES ? mes : undefined,
      Trimestre: periodo === PeriodType.TRIMESTRE ? trimestre : undefined,
      Semestre: periodo === PeriodType.SEMESTRE ? semestre : undefined,
      DataInicio,
      DataFim
    };

    onGenerate(filter);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-[#8B1B1F] p-12 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-ciatos font-bold uppercase tracking-tight mb-2">Relatórios Periódicos</h2>
          <p className="text-white/70 font-medium text-lg">Selecione os parâmetros para extração de dados analíticos.</p>
        </div>
        <FileBarChart size={120} className="absolute right-10 top-1/2 -translate-y-1/2 opacity-10" />
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSumbit} className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Colaborador */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <Users size={12} /> Selecionar Colaborador
              </label>
              <select 
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#8B1B1F]/10"
                value={colaboradorEmail}
                onChange={e => setColaboradorEmail(e.target.value)}
              >
                <option value="">Escolha um colaborador...</option>
                {colaboradoresDisponiveis.map(u => (
                  <option key={u.Email} value={u.Email}>{u.Nome} ({u.Time})</option>
                ))}
              </select>
            </div>

            {/* Período Tipo */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <Calendar size={12} /> Tipo de Período
              </label>
              <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-200">
                {([PeriodType.MES, PeriodType.TRIMESTRE, PeriodType.SEMESTRE, PeriodType.ANO] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriodo(p)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                      periodo === p ? 'bg-[#8B1B1F] text-white shadow-lg' : 'text-gray-400 hover:text-[#111111]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-50">
            {/* Ano */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ano de Referência</label>
              <input 
                type="number" 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none"
                value={ano}
                onChange={e => setAno(parseInt(e.target.value))}
              />
            </div>

            {/* Condicional Mes */}
            {periodo === PeriodType.MES && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mês</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none"
                  value={mes}
                  onChange={e => setMes(parseInt(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Condicional Trimestre */}
            {periodo === PeriodType.TRIMESTRE && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trimestre</label>
                <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-200">
                  {(['T1', 'T2', 'T3', 'T4'] as const).map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setTrimestre(q)}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                        trimestre === q ? 'bg-[#8B1B1F] text-white' : 'text-gray-400'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Condicional Semestre */}
            {periodo === PeriodType.SEMESTRE && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Semestre</label>
                <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-200">
                  {(['S1', 'S2'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSemestre(s)}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                        semestre === s ? 'bg-[#8B1B1F] text-white' : 'text-gray-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full bg-[#8B1B1F] text-white py-6 rounded-[35px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
          >
            Gerar Relatório de Performance <ChevronRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportFiltersView;
