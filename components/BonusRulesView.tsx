import React, { useState, useEffect, useMemo } from 'react';
import { BonusRules, DEFAULT_BONUS_RULES, TaskPriority } from '../types';
import { PageHeader, Card, Btn, Pill, showToast } from './ui';
import { calcularBonus } from '../lib/scoreEngine';
import { Percent, Coins, Clock, UserCheck, CalendarClock, Save, RotateCw, Info } from 'lucide-react';

interface BonusRulesViewProps {
  rules: BonusRules;
  onSave: (rules: BonusRules) => Promise<any>;
  empresaNome?: string;
  activeEmpresa?: string | null;
}


const Section: React.FC<{ icon: React.ReactNode; title: string; hint?: string; children: React.ReactNode }> = ({ icon, title, hint, children }) => (
  <Card className="p-6">
    <div className="flex items-start gap-3 mb-4">
      <span className="h-9 w-9 rounded-xl bg-marca/10 text-marca flex items-center justify-center shrink-0">{icon}</span>
      <div>
        <h3 className="font-titulo text-lg text-tinta leading-tight">{title}</h3>
        {hint && <p className="text-xs text-stone-400 mt-0.5">{hint}</p>}
      </div>
    </div>
    {children}
  </Card>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">{children}</label>
);

const numCls = 'w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-marca/20';

const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void; label: string; desc?: string }> = ({ on, onChange, label, desc }) => (
  <button type="button" onClick={() => onChange(!on)} className="w-full flex items-center justify-between gap-4 text-left">
    <div>
      <p className="text-sm font-semibold text-tinta">{label}</p>
      {desc && <p className="text-xs text-stone-400 mt-0.5">{desc}</p>}
    </div>
    <span className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-marca' : 'bg-stone-300'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </span>
  </button>
);

const BonusRulesView: React.FC<BonusRulesViewProps> = ({ rules, onSave, empresaNome, activeEmpresa }) => {
  const [form, setForm] = useState<BonusRules>(rules);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<string[]>([]);

  // Sincroniza quando a empresa ativa muda (regras diferentes por empresa).
  useEffect(() => { setForm(rules); }, [rules, activeEmpresa]);

  const set = <K extends keyof BonusRules>(k: K, v: BonusRules[K]) => setForm(f => ({ ...f, [k]: v }));

  const validar = (f: BonusRules): string[] => {
    const e: string[] = [];
    if (f.eficiencia_minima < 0 || f.eficiencia_minima > 100) e.push('A eficiência mínima deve estar entre 0% e 100%.');
    if (f.bonus_valor < 0) e.push('O valor do bônus não pode ser negativo.');
    if (f.bonus_tipo === 'PERCENTUAL' && f.bonus_valor > 100) e.push('Bônus percentual acima de 100% é incomum — confirme o valor.');
    if (f.fechamento_dia < 1 || f.fechamento_dia > 28) e.push('O dia de fechamento deve estar entre 1 e 28.');
    return e;
  };

  const salvar = async () => {
    const e = validar(form);
    setErros(e);
    if (e.length) { showToast({ message: 'Revise os campos destacados antes de salvar.', tone: 'erro' }); return; }
    if (!activeEmpresa) { showToast({ message: 'Abra uma empresa para configurar as regras.', tone: 'erro' }); return; }
    setSalvando(true);
    try {
      await onSave(form);
      showToast({ message: 'Regras de bonificação salvas.', tone: 'sucesso' });
    } catch (err: any) {
      showToast({ message: err?.message || 'Não foi possível salvar as regras.', tone: 'erro' });
    } finally {
      setSalvando(false);
    }
  };

  const restaurarPadrao = () => { setForm({ ...DEFAULT_BONUS_RULES }); setErros([]); };

  // Prévia do bônus com um cenário exemplo (100 pts realizados, eficiência = mínimo, sem atraso).
  const previa = useMemo(
    () => calcularBonus({ eficiencia: form.eficiencia_minima, pontosRealizados: 100, temAtraso: false }, form),
    [form]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 lg:pb-10 font-ciatos">
      <PageHeader
        kicker="Administração"
        title="Regras de bonificação"
        subtitle={empresaNome ? `Configuração de pontuação e bônus — ${empresaNome}` : 'Configuração de pontuação e bônus da empresa'}
        action={
          <div className="flex items-center gap-2">
            <Btn variant="secondary" onClick={restaurarPadrao}><RotateCw size={16} /> Padrão</Btn>
            <Btn variant="primary" onClick={salvar} loading={salvando}><Save size={16} /> Salvar</Btn>
          </div>
        }
      />

      <Card className="p-4 bg-sky-50/60 border-sky-100">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-sky-600 shrink-0 mt-0.5" />
          <p className="text-sm text-sky-900/80">
            Estas regras valem só para <strong>{empresaNome || 'esta empresa'}</strong>. Se nada for configurado, o app usa os
            valores padrão (equivalentes ao comportamento atual). As mudanças refletem no <strong>painel</strong> e nos <strong>relatórios</strong>.
          </p>
        </div>
      </Card>

      {erros.length > 0 && (
        <Card className="p-4 bg-red-50/70 border-red-100">
          <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
            {erros.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section icon={<Percent size={18} />} title="Elegibilidade ao bônus" hint="Eficiência mínima no período para receber bônus.">
          <Label>Eficiência mínima (%)</Label>
          <div className="flex items-center gap-4">
            <input type="range" min={0} max={100} step={1} value={form.eficiencia_minima}
              onChange={e => set('eficiencia_minima', Number(e.target.value))} className="flex-1 accent-[#8B1B1F]" />
            <input type="number" min={0} max={100} value={form.eficiencia_minima}
              onChange={e => set('eficiencia_minima', Number(e.target.value))} className={`${numCls} w-20`} />
          </div>
        </Section>

        <Section icon={<Coins size={18} />} title="Valor do bônus" hint="Quanto o colaborador elegível recebe.">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <select value={form.bonus_tipo} onChange={e => set('bonus_tipo', e.target.value as BonusRules['bonus_tipo'])} className={numCls}>
                <option value="PERCENTUAL">Percentual (%)</option>
                <option value="FIXO">Fixo (pontos)</option>
              </select>
            </div>
            <div>
              <Label>{form.bonus_tipo === 'FIXO' ? 'Pontos' : '% dos pontos'}</Label>
              <input type="number" min={0} value={form.bonus_valor}
                onChange={e => set('bonus_valor', Number(e.target.value))} className={numCls} />
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-3">
            {form.bonus_tipo === 'FIXO'
              ? `Bônus fixo de ${form.bonus_valor} pts para quem atingir a meta.`
              : `Bônus = ${form.bonus_valor}% dos pontos realizados no período.`}
          </p>
        </Section>

        <Section icon={<Clock size={18} />} title="Tarefas atrasadas" hint="Se o atraso derruba a elegibilidade ao bônus.">
          <Toggle on={form.bonus_com_atraso} onChange={v => set('bonus_com_atraso', v)}
            label="Permitir bônus com tarefas atrasadas" desc="Desligado: quem teve atraso no período não recebe bônus." />
        </Section>

        <Section icon={<UserCheck size={18} />} title="Tarefas pessoais" hint="Se tarefas pessoais valoradas entram na base do bônus.">
          <Toggle on={form.pessoal_valorada} onChange={v => set('pessoal_valorada', v)}
            label="Contar tarefas pessoais valoradas" desc="Quando ligado, os pontos de tarefas pessoais aprovadas somam na base." />
        </Section>

        <Section icon={<CalendarClock size={18} />} title="Fechamento mensal" hint="Dia em que o período de bonificação fecha.">
          <Label>Dia do fechamento (1 a 28)</Label>
          <input type="number" min={1} max={28} value={form.fechamento_dia}
            onChange={e => set('fechamento_dia', Number(e.target.value))} className={`${numCls} w-32`} />
        </Section>

        <Section icon={<Info size={18} />} title="Prévia" hint="Simulação com 100 pts realizados no exemplo.">
          <div className="flex items-center gap-3">
            <Pill tone={previa.elegivel ? 'sucesso' : 'neutral'}>{previa.elegivel ? 'Elegível' : 'Não elegível'}</Pill>
            {previa.elegivel && <span className="font-titulo text-2xl text-tinta">+{previa.valor} pts</span>}
          </div>
          <p className="text-xs text-stone-400 mt-2">{previa.motivo}</p>
        </Section>
      </div>
    </div>
  );
};

export default BonusRulesView;
