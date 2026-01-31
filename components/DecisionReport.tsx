
import React from 'react';
import { User } from '../types';
import { Download } from 'lucide-react';

interface DecisionReportProps {
  users: User[];
  collaboratorsList: User[];
}

const DecisionReport: React.FC<DecisionReportProps> = ({ users, collaboratorsList }) => {
  const getDeliveryStatus = (efficiency: number) => {
    if (efficiency > 95) return { label: 'Excelente', color: 'text-green-600 bg-green-50' };
    if (efficiency > 80) return { label: 'Bom', color: 'text-blue-600 bg-blue-50' };
    if (efficiency > 60) return { label: 'Alerta', color: 'text-orange-600 bg-orange-50' };
    return { label: 'Crítico', color: 'text-red-600 bg-red-50' };
  };

  const getSuggestedAction = (efficiency: number, reliability: number) => {
    if (efficiency > 95 && reliability > 90) return { label: 'Candidato a Bônus', style: 'bg-green-600 text-white' };
    if (efficiency < 60 || reliability < 70) return { label: 'Aplicar Advertência', style: 'bg-red-600 text-white' };
    return { label: 'Manter Monitoramento', style: 'bg-gray-100 text-gray-500' };
  };

  const handleGenerateReport = () => {
    alert("Relatório PDF Gerado para os colaboradores sob sua gestão.");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-ciatos font-bold text-[#111111] uppercase tracking-tighter">Relatório Estratégico</h3>
          <p className="text-sm text-gray-400 font-medium">Cruzamento de dados da sua equipe.</p>
        </div>
        <button onClick={handleGenerateReport} className="flex items-center gap-3 bg-[#8B1B1F] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#8B1B1F]/20">
          <Download size={18} /> Exportar Fechamento
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Colaborador</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status Entrega</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Ação Sugerida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {collaboratorsList.map(user => {
                const efficiency = user.EficienciaMes || 0;
                const reliability = user.ScoreConfiabilidade || 0;
                const status = getDeliveryStatus(efficiency);
                const action = getSuggestedAction(efficiency, reliability);

                return (
                  <tr key={user.Email} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-[#111111]">{user.Nome}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{user.Time}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border border-transparent ${status.color}`}>
                        {status.label} ({efficiency.toFixed(0)}%)
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${action.style}`}>
                        {action.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {collaboratorsList.length === 0 && (
                <tr>
                   <td colSpan={3} className="px-8 py-20 text-center text-gray-300 font-bold italic uppercase text-xs">Sem dados da equipe.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DecisionReport;
