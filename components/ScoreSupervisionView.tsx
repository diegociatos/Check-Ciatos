
import React, { useState, useMemo } from 'react';
import { ScoreLedger, User, ScoreType, UserRole } from '../types';
import { Calendar, User as UserIcon, ArrowUpCircle, ArrowDownCircle, Search, Star, ChevronRight, LayoutDashboard } from 'lucide-react';

interface ScoreSupervisionViewProps {
  ledger: ScoreLedger[];
  users: User[];
}

const ScoreSupervisionView: React.FC<ScoreSupervisionViewProps> = ({ ledger, users }) => {
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const collaborators = users.filter(u => u.Role === UserRole.COLABORADOR || u.Role === UserRole.GESTOR);

  const filteredCollaborators = useMemo(() => {
    return collaborators.filter(c => 
      c.Nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.Time.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [collaborators, searchTerm]);

  const displayedLedger = useMemo(() => {
    if (!selectedUserEmail) return ledger;
    return ledger.filter(l => l.UserEmail === selectedUserEmail);
  }, [ledger, selectedUserEmail]);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-ciatos font-bold text-[#6F0F14] uppercase tracking-tighter">Supervisão de Pontos</h3>
          <p className="text-sm text-gray-400 font-medium">Dashboard mestre-detalhe para histórico financeiro de pontuação.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Coluna Esquerda: Lista de Colaboradores */}
        <div className="w-full lg:w-[320px] bg-white rounded-[30px] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                placeholder="Filtrar equipe..."
                className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-[#8B1B1F]/10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <button 
              onClick={() => setSelectedUserEmail(null)}
              className={`w-full p-4 rounded-2xl flex items-center justify-between group transition-all ${!selectedUserEmail ? 'bg-[#8B1B1F] text-white' : 'hover:bg-gray-50 text-gray-500'}`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard size={16} />
                <span className="text-xs font-black uppercase tracking-widest">Todos Lançamentos</span>
              </div>
              <ChevronRight size={14} className={!selectedUserEmail ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
            </button>
            {filteredCollaborators.map(user => (
              <button 
                key={user.Email}
                onClick={() => setSelectedUserEmail(user.Email)}
                className={`w-full p-4 rounded-2xl flex items-center justify-between group transition-all ${selectedUserEmail === user.Email ? 'bg-[#8B1B1F] text-white shadow-lg' : 'hover:bg-gray-50 text-gray-500'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${selectedUserEmail === user.Email ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#8B1B1F]'}`}>
                    {user.Nome.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className={`text-xs font-black uppercase tracking-tighter truncate ${selectedUserEmail === user.Email ? 'text-white' : 'text-[#111111]'}`}>{user.Nome}</p>
                    <p className={`text-[9px] font-bold uppercase ${selectedUserEmail === user.Email ? 'text-white/60' : 'text-gray-400'}`}>{user.Time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-black ${selectedUserEmail === user.Email ? 'text-white' : 'text-[#8B1B1F]'}`}>{user.PontosRealizadosMes} pts</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Coluna Direita: Extrato Detalhado */}
        <div className="flex-1 bg-white rounded-[30px] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-[#111111] uppercase tracking-widest">
                {selectedUserEmail ? `Extrato de ${users.find(u => u.Email === selectedUserEmail)?.Nome}` : 'Histórico Geral de Pontos'}
              </h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em]">{displayedLedger.length} Lançamentos Encontrados</p>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto min-h-0">
            <table className="w-full text-left font-sans text-xs">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="border-b border-gray-50">
                  <th className="px-6 py-4 font-black text-gray-400 uppercase tracking-widest">Data</th>
                  <th className="px-6 py-4 font-black text-gray-400 uppercase tracking-widest">Colaborador</th>
                  <th className="px-6 py-4 font-black text-gray-400 uppercase tracking-widest">Descrição do Lançamento</th>
                  <th className="px-6 py-4 font-black text-gray-400 uppercase tracking-widest text-center">Tipo</th>
                  <th className="px-6 py-4 font-black text-gray-400 uppercase tracking-widest text-right">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayedLedger.sort((a,b) => new Date(b.Data).getTime() - new Date(a.Data).getTime()).map(entry => (
                  <tr key={entry.ID} className={`hover:bg-gray-50/50 transition-colors ${entry.Tipo === ScoreType.GANHO ? 'bg-green-50/5' : 'bg-red-50/5'}`}>
                    <td className="px-6 py-4 font-bold text-gray-400">
                      {new Date(entry.Data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-600">
                      {users.find(u => u.Email === entry.UserEmail)?.Nome || entry.UserEmail}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#111111]">
                      {entry.Descricao}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex justify-center">
                        {entry.Tipo === ScoreType.GANHO ? (
                          <span className="flex items-center gap-1 text-[8px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100 uppercase tracking-widest">
                            <ArrowUpCircle size={10} /> Ganho
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[8px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100 uppercase tracking-widest">
                            <ArrowDownCircle size={10} /> Penalidade
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className={`text-sm font-black ${entry.Tipo === ScoreType.GANHO ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.Tipo === ScoreType.GANHO ? '+' : ''}{entry.Pontos}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreSupervisionView;
