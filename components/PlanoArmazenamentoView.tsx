import React, { useEffect, useState } from 'react';
import { Empresa, UserRole } from '../types';
import { getStoragePolicy, StoragePolicy, planoPermiteAnexos, PLANO_EVIDENCIAS_STORAGE_MB } from '../lib/storage';
import { comprarMemoriaExtra } from '../services/api';
import { PageHeader, Card, Btn, showToast } from './ui';
import { HardDrive, Plus, ShieldCheck, Lock, Loader2 } from 'lucide-react';

interface Props {
  empresa: Empresa | null;
  currentUserRole: UserRole;
}

const fmt = (mb: number) => {
  if (mb <= 0) return '0 MB';
  if (mb >= 1024) { const gb = mb / 1024; return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`; }
  return `${Math.round(mb)} MB`;
};

const nomePlano = (plano?: string) => {
  const p = String(plano || '').toLowerCase();
  if (p.includes('controle')) return 'Controle';
  if (p.includes('evid')) return 'Evidências';
  return plano || 'Padrão';
};

const PlanoArmazenamentoView: React.FC<Props> = ({ empresa }) => {
  const [policy, setPolicy] = useState<StoragePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [comprando, setComprando] = useState(false);

  useEffect(() => {
    let ativo = true;
    if (!empresa) { setLoading(false); return; }
    setLoading(true);
    getStoragePolicy(empresa.id)
      .then(p => { if (ativo) setPolicy(p); })
      .finally(() => { if (ativo) setLoading(false); });
    return () => { ativo = false; };
  }, [empresa?.id]);

  if (!empresa) {
    return <div className="p-10 text-center text-stone-400 font-ciatos">Selecione uma empresa para ver o plano.</div>;
  }

  const permite = policy ? policy.permiteAnexos : planoPermiteAnexos(empresa.Plano);
  const usado = policy?.usadoMb ?? 0;
  const extra = policy?.extraMb ?? 0;
  const base = permite ? PLANO_EVIDENCIAS_STORAGE_MB : 0;
  const limite = policy?.limiteMb ?? (base + extra);
  const pct = limite > 0 ? Math.min(100, Math.round((usado / limite) * 100)) : 0;
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

  const comprar = async () => {
    if (comprando) return;
    setComprando(true);
    try {
      const { url } = await comprarMemoriaExtra(empresa.id);
      if (url) { window.location.href = url; return; }
      showToast({ message: 'Não foi possível iniciar a contratação agora. Tente mais tarde.', tone: 'erro' });
    } catch (e: any) {
      showToast({ message: e?.message || 'Contratação de memória extra indisponível no momento.', tone: 'erro' });
    } finally {
      setComprando(false);
    }
  };

  return (
    <div className="space-y-8 font-ciatos pb-20 animate-in fade-in duration-500">
      <PageHeader
        kicker="Assinatura"
        title="Plano e armazenamento"
        subtitle="Acompanhe o plano da empresa, o uso de memória e contrate espaço extra quando precisar."
      />

      {/* Plano atual */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Plano atual</p>
            <h3 className="text-2xl text-stone-900 mt-1">{nomePlano(empresa.Plano)}</h3>
            <p className="text-sm text-stone-500 mt-1">
              {permite
                ? 'Inclui anexos de evidências nas obrigações, com armazenamento privado.'
                : 'Organiza tarefas, pontos e relatórios. Não inclui anexos de documentos.'}
            </p>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${permite ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
            {permite ? <ShieldCheck size={24} /> : <Lock size={24} />}
          </div>
        </div>
      </Card>

      {/* Armazenamento */}
      {permite ? (
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 text-stone-700">
            <HardDrive size={18} className="text-marca" />
            <h4 className="text-lg">Armazenamento de evidências</h4>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-stone-400 text-sm"><Loader2 size={16} className="animate-spin" /> Calculando uso…</div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-stone-500">{fmt(usado)} usados</span>
                  <span className="font-semibold text-stone-700">de {fmt(limite)}</span>
                </div>
                <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[11px] text-stone-400 mt-1.5">
                  Base do plano: {fmt(base)}{extra > 0 ? ` · Memória extra contratada: ${fmt(extra)}` : ''}
                </p>
              </div>

              {pct >= 90 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-[12px] text-red-700">
                  Você está perto do limite. Ao atingir 100%, novos anexos são bloqueados até liberar espaço ou contratar memória extra.
                </div>
              )}
            </>
          )}

          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-stone-700 font-semibold">Precisa de mais espaço?</p>
              <p className="text-[12px] text-stone-500">Cada pacote adiciona <strong>+500 MB</strong> por <strong>R$ 100/mês</strong> (recorrente, cancele quando quiser).</p>
            </div>
            <Btn onClick={comprar} loading={comprando}>
              <Plus size={16} /> Contratar +500 MB
            </Btn>
          </div>
        </Card>
      ) : (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-stone-700">
            <Lock size={18} className="text-stone-400" />
            <h4 className="text-lg">Anexos não incluídos neste plano</h4>
          </div>
          <p className="text-sm text-stone-500">
            O <strong>Plano Controle</strong> não permite anexar documentos nas obrigações. Para enviar evidências (imagens, PDFs, comprovantes) com 1 GB de armazenamento, faça upgrade para o <strong>Plano Evidências</strong>.
          </p>
          <p className="text-[12px] text-stone-400">
            Para trocar de plano, ajuste sua assinatura no Asaas ou fale com o suporte.
          </p>
        </Card>
      )}
    </div>
  );
};

export default PlanoArmazenamentoView;
