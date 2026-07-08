
import React from 'react';
import { User, UserRole } from '../types';
import { FileText, Download, UserCheck } from 'lucide-react';

interface HRReportViewProps {
  users: User[];
}

const HRReportView: React.FC<HRReportViewProps> = ({ users }) => {
  const collaborators = users.filter(u => u.Role === UserRole.COLABORADOR);

  const getStatusIndicator = (efficiency: number, reliability: number) => {
    const score = (efficiency + reliability) / 2;
    if (score >= 90) return { emoji: '🟢', label: 'Excelente', color: 'text-green-600' };
    if (score >= 70) return { emoji: '🟡', label: 'Atenção', color: 'text-yellow-600' };
    return { emoji: '🔴', label: 'Crítico', color: 'text-red-600' };
  };

  const handleExport = () => {
    alert("Exportando relatório completo do RH em formato estruturado...");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-ciatos font-bold text-[#111111] uppercase tracking-tighter">Relatório Gerencial RH</h3>
          <p className="text-sm text-gray-400 font-medium italic">Análise de capital humano e conformidade operacional.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-3 bg-marca text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-marca-escuro transition-all"
        >
          <Download size={18} /> Exportar Dados RH
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center gap-3">
          <div className="p-2 bg-gray-50 rounded-lg text-marca">
            <UserCheck size={20} />
          </div>
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Controle de Performance Mensal</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Colaborador</th>
                <th className="px-8 py-5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Role</th>
                <th className="px-8 py-5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Gestor Direto</th>
                <th className="px-8 py-5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider text-center">Eficiência (%)</th>
                <th className="px-8 py-5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider text-center">Confiabilidade (%)</th>
                <th className="px-8 py-5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider text-center">Status RH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {collaborators.map(u => {
                const gestor = users.find(g => g.Email === u.Gestor);
                const status = getStatusIndicator(u.EficienciaMes || 0, u.ScoreConfiabilidade || 0);

                return (
                  <tr key={u.Email} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#111111]">{u.Nome}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{u.Email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">{u.Role}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-600">{gestor?.Nome || '---'}</span>
                        <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">{u.Time}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`text-sm font-black ${u.EficienciaMes! >= 80 ? 'text-green-600' : 'text-marca'}`}>
                        {u.EficienciaMes?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center text-sm font-bold text-gray-600">
                      {u.ScoreConfiabilidade?.toFixed(1)}%
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xl">{status.emoji}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${status.color}`}>{status.label}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {collaborators.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <FileText size={48} className="mx-auto text-gray-100 mb-4" />
                    <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Nenhum dado de RH disponível para processamento.</p>
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

export default HRReportView;
