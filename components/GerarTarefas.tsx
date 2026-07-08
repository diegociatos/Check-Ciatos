import React, { useState } from 'react';
import { TaskTemplate, User } from '../types';
import { Zap, Check, CalendarClock, User as UserIcon } from 'lucide-react';

interface Props {
  templates: TaskTemplate[];
  users: User[];
  onGenerate: (id: string, force?: boolean) => Promise<any>;
}

const GerarTarefas: React.FC<Props> = ({ templates, users, onGenerate }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [feito, setFeito] = useState<Record<string, number>>({}); // templateId -> timestamp p/ feedback

  const ativos = templates.filter(t => t.Ativa);
  const nomeDe = (email: string) => users.find(u => u.Email === email)?.Nome || email.split('@')[0];

  const gerar = async (t: TaskTemplate) => {
    if (busy) return;
    setBusy(t.ID);
    try {
      let r = await onGenerate(t.ID);
      if (r && r.duplicate) {
        if (window.confirm(`Já existe uma tarefa "${t.Titulo}" para hoje. Gerar mesmo assim?`)) {
          r = await onGenerate(t.ID, true);
        } else {
          setBusy(null);
          return;
        }
      }
      setFeito(prev => ({ ...prev, [t.ID]: (prev[t.ID] || 0) + 1 }));
    } catch (e: any) {
      alert(e?.message || 'Erro ao gerar a tarefa.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-ciatos pb-4">
      <div>
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.14em]">Atalho</p>
        <h2 className="text-3xl md:text-4xl text-stone-900 mt-1">Gerar tarefas</h2>
        <p className="text-stone-500 mt-1">Toque em um modelo para gerar a obrigação de hoje e avisar o responsável.</p>
      </div>

      {ativos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-200 p-12 text-center">
          <CalendarClock size={40} className="mx-auto text-stone-300" />
          <p className="text-stone-600 mt-3 text-lg">Nenhum modelo ativo.</p>
          <p className="text-stone-400 text-sm mt-1">Crie modelos em "Modelos de Tarefas" para gerar tarefas aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ativos.map(t => {
            const gerou = !!feito[t.ID];
            return (
              <div key={t.ID} className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_1px_2px_rgba(28,25,23,0.04)] p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-lg text-stone-900 leading-snug">{t.Titulo}</p>
                  <span className="text-sm font-semibold text-[#8B1B1F] shrink-0">{t.PontosValor} pts</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-stone-500">
                  <span className="inline-flex items-center gap-1.5"><UserIcon size={14} className="text-stone-400" /> {nomeDe(t.Responsavel)}</span>
                  <span className="inline-flex items-center gap-1.5"><CalendarClock size={14} className="text-stone-400" /> {t.Recorrencia}</span>
                </div>
                <button
                  onClick={() => gerar(t)}
                  disabled={busy === t.ID}
                  className={`mt-4 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-colors active:scale-[0.98] disabled:opacity-60 ${
                    gerou ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-[#8B1B1F] text-white hover:bg-[#6F0F14]'
                  }`}
                >
                  {busy === t.ID ? (
                    <><div className="h-4 w-4 border-2 border-current/40 border-t-current rounded-full animate-spin" /> Gerando…</>
                  ) : gerou ? (
                    <><Check size={18} /> Gerada{feito[t.ID] > 1 ? ` (${feito[t.ID]}×)` : ''} — gerar de novo</>
                  ) : (
                    <><Zap size={18} /> Gerar agora</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GerarTarefas;
