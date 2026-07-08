import React from 'react';
import { ScoreLedger, ScoreType, User } from '../types';
import { getTodayStr } from '../store';
import { ArrowUpRight, ArrowDownRight, Target, Star } from 'lucide-react';

interface MyScoreViewProps {
  ledger: ScoreLedger[];
  user: User;
}

const MyScoreView: React.FC<MyScoreViewProps> = ({ ledger, user }) => {
  const todayStr = getTodayStr();

  const conquistados = user.PontosRealizadosMes || 0;
  const possiveis = user.PontosPossiveisMes || 0;
  const pct = possiveis > 0 ? (conquistados / possiveis) * 100 : 0;
  const total = ledger.reduce((a, c) => a + c.Pontos, 0);
  const hoje = ledger.filter(e => e.Data.startsWith(todayStr)).reduce((a, c) => a + c.Pontos, 0);

  const recente = [...ledger].sort((a, b) => new Date(b.Data).getTime() - new Date(a.Data).getTime()).slice(0, 10);

  const Tile: React.FC<{ label: string; value: React.ReactNode; hint?: string; accent?: string }> = ({ label, value, hint, accent = 'text-stone-900' }) => (
    <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_1px_2px_rgba(28,25,23,0.04)] p-6">
      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.14em]">{label}</p>
      <p className={`mt-3 font-titulo text-3xl font-semibold ${accent}`}>{value}</p>
      {hint && <p className="text-sm text-stone-400 mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-ciatos pb-10">
      <div>
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.14em]">Recompensa</p>
        <h2 className="text-3xl md:text-4xl text-stone-900 mt-1">Minha pontuação</h2>
        <p className="text-stone-500 mt-1">Seus pontos ganhos e o quanto falta para o bônus do mês.</p>
      </div>

      {/* Rumo ao bônus */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_1px_2px_rgba(28,25,23,0.04)] p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h3 className="text-lg text-stone-900 flex items-center gap-2"><Target size={18} className="text-[#8B1B1F]" /> Potencial do mês</h3>
            <p className="text-sm text-stone-500 mt-1">
              Você conquistou <span className="text-[#8B1B1F] font-semibold">{conquistados}</span> de <span className="text-stone-900 font-semibold">{possiveis}</span> pts possíveis.
            </p>
          </div>
          <div className="text-right">
            <span className="font-titulo text-4xl font-semibold text-[#8B1B1F]">{pct.toFixed(0)}%</span>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">{pct >= 90 ? 'Elegível ao bônus' : 'Meta: 90%'}</p>
          </div>
        </div>
        <div className="mt-5 h-2.5 w-full bg-stone-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${pct >= 90 ? 'bg-emerald-600' : 'bg-[#8B1B1F]'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Tile label="Acumulado total" value={total} hint="desde o início" accent="text-[#8B1B1F]" />
        <Tile label="Hoje" value={`${hoje >= 0 ? '+' : ''}${hoje}`} hint="pontos do dia" accent={hoje < 0 ? 'text-red-600' : 'text-stone-900'} />
        <Tile label="Conquistado no mês" value={conquistados} hint="pontos validados" />
      </div>

      {/* Extrato */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_1px_2px_rgba(28,25,23,0.04)] overflow-hidden">
        <div className="px-8 py-5 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-lg text-stone-900">Extrato recente</h3>
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Últimos 10</span>
        </div>
        {recente.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {recente.map(e => {
              const ganho = e.Tipo === ScoreType.GANHO;
              return (
                <div key={e.ID} className="px-8 py-4 flex items-center gap-4 hover:bg-stone-50/60 transition-colors">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${ganho ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {ganho ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-stone-900 truncate">{e.Descricao}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{new Date(e.Data).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className={`text-lg font-semibold shrink-0 ${ganho ? 'text-emerald-600' : 'text-red-600'}`}>{ganho ? '+' : ''}{e.Pontos}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Star size={40} className="mx-auto text-stone-200" />
            <p className="text-stone-500 mt-3">Nenhum ponto lançado ainda.</p>
            <p className="text-stone-400 text-sm mt-1">Conclua suas obrigações para começar a pontuar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyScoreView;
