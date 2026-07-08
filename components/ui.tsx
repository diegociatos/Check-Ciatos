import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Inbox } from 'lucide-react';

/* =========================================================================
   Design system compartilhado — Check-Ciatos
   - Raio único: cards rounded-2xl, botões/inputs rounded-xl, pills rounded-full
   - Sombra tingida no grafite quente (nunca preto puro)
   - Títulos em font-titulo (serifa da marca); dados em Inter (padrão do body)
   ========================================================================= */

// ---- Card -----------------------------------------------------------------
export const Card: React.FC<{
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ className = '', children, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-superficie rounded-2xl border border-stone-200 shadow-[0_1px_2px_rgba(28,25,23,0.04)] ${onClick ? 'cursor-pointer hover:shadow-[0_8px_24px_rgba(28,25,23,0.08)] transition-shadow' : ''} ${className}`}
  >
    {children}
  </div>
);

// ---- Rótulo (kicker) ------------------------------------------------------
export const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-[10px] font-semibold text-stone-400 uppercase tracking-[0.14em] ${className}`}>{children}</p>
);

// ---- Cabeçalho de tela (título serifado + subtítulo) ----------------------
export const PageHeader: React.FC<{ kicker?: string; title: string; subtitle?: string; action?: React.ReactNode }> = ({
  kicker,
  title,
  subtitle,
  action,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
    <div>
      {kicker && <Label>{kicker}</Label>}
      <h1 className="font-titulo text-3xl md:text-4xl text-tinta mt-1 leading-tight">{title}</h1>
      {subtitle && <p className="text-stone-500 mt-1">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

// ---- Botão (com estado de loading; feedback <100ms) -----------------------
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
const BTN_VARIANTS: Record<BtnVariant, string> = {
  primary: 'bg-marca text-white hover:bg-marca-escuro shadow-sm',
  secondary: 'bg-superficie text-tinta border border-stone-200 hover:border-stone-300 hover:bg-stone-50',
  ghost: 'bg-transparent text-marca hover:bg-marca/5',
  danger: 'bg-erro text-white hover:brightness-95 shadow-sm',
};

export const Btn: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: BtnVariant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  full?: boolean;
}> = ({ children, onClick, type = 'button', variant = 'primary', loading = false, disabled = false, className = '', full = false }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none ${BTN_VARIANTS[variant]} ${full ? 'w-full' : ''} ${className}`}
  >
    {loading && <Loader2 size={16} className="animate-spin" />}
    {children}
  </button>
);

// ---- Pill / status --------------------------------------------------------
type PillTone = 'neutral' | 'sucesso' | 'atraso' | 'erro' | 'marca' | 'info';
const PILL_TONES: Record<PillTone, string> = {
  neutral: 'bg-stone-100 text-stone-600',
  sucesso: 'bg-emerald-50 text-emerald-700',
  atraso: 'bg-amber-50 text-amber-700',
  erro: 'bg-red-50 text-red-700',
  marca: 'bg-marca/10 text-marca',
  info: 'bg-sky-50 text-sky-700',
};
export const Pill: React.FC<{ children: React.ReactNode; tone?: PillTone; className?: string }> = ({ children, tone = 'neutral', className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${PILL_TONES[tone]} ${className}`}>{children}</span>
);

// ---- Card de KPI ----------------------------------------------------------
export const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'marca';
}> = ({ label, value, hint, icon, tone = 'default' }) => {
  const isMarca = tone === 'marca';
  return (
    <Card className={`p-6 ${isMarca ? 'bg-marca border-marca text-white' : ''}`}>
      <div className="flex items-center justify-between">
        <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${isMarca ? 'text-white/60' : 'text-stone-400'}`}>{label}</p>
        {icon && <span className={isMarca ? 'text-white/70' : 'text-stone-300'}>{icon}</span>}
      </div>
      <p className={`mt-3 font-titulo text-3xl font-semibold ${isMarca ? 'text-white' : 'text-tinta'}`}>{value}</p>
      {hint && <p className={`text-sm mt-1 ${isMarca ? 'text-white/60' : 'text-stone-400'}`}>{hint}</p>}
    </Card>
  );
};

// ---- Estado vazio acolhedor ----------------------------------------------
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}> = ({ icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    <div className="h-14 w-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mb-4">
      {icon || <Inbox size={26} />}
    </div>
    <h3 className="font-titulo text-xl text-tinta">{title}</h3>
    {message && <p className="text-stone-500 mt-1.5 max-w-sm">{message}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

// ---- Estado de erro (humano, com retry) -----------------------------------
export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    <div className="h-14 w-14 rounded-2xl bg-red-50 text-erro flex items-center justify-center mb-4 text-2xl">⚠️</div>
    <h3 className="font-titulo text-xl text-tinta">Algo não carregou</h3>
    <p className="text-stone-500 mt-1.5 max-w-sm">{message || 'Não conseguimos buscar essas informações agora.'}</p>
    {onRetry && <div className="mt-5"><Btn variant="secondary" onClick={onRetry}>Tentar de novo</Btn></div>}
  </div>
);

// ---- Skeletons (loading que mostra a forma do conteúdo) -------------------
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-stone-200/70 ${className}`} />
);
export const SkeletonCard: React.FC = () => (
  <Card className="p-6 space-y-3">
    <Skeleton className="h-3 w-20" />
    <Skeleton className="h-8 w-24" />
    <Skeleton className="h-3 w-32" />
  </Card>
);
export const SkeletonRows: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 py-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-4 flex-1 max-w-[240px]" />
        <Skeleton className="h-4 w-16 ml-auto" />
      </div>
    ))}
  </div>
);

// ---- Drawer (slide-over para detalhe) -------------------------------------
export const Drawer: React.FC<{ open: boolean; onClose: () => void; title?: string; children: React.ReactNode }> = ({
  open,
  onClose,
  title,
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-tinta/30 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative w-full max-w-md bg-superficie h-full shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
        <div className="sticky top-0 bg-superficie/95 backdrop-blur border-b border-stone-100 px-6 py-4 flex items-center justify-between">
          {title && <h2 className="font-titulo text-xl text-tinta">{title}</h2>}
          <button onClick={onClose} className="text-stone-400 hover:text-tinta text-2xl leading-none px-1" aria-label="Fechar">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

/* =========================================================================
   Toasts — com ação "Desfazer" para operações destrutivas
   ========================================================================= */
export interface ToastOptions {
  message: string;
  tone?: 'neutral' | 'sucesso' | 'erro';
  actionLabel?: string;
  onAction?: () => void;
  duration?: number; // ms
}
interface ToastItem extends ToastOptions {
  id: number;
}

type Listener = (t: ToastItem) => void;
const listeners = new Set<Listener>();
let seq = 1;

export function showToast(opts: ToastOptions) {
  const item: ToastItem = { id: seq++, duration: 5000, tone: 'neutral', ...opts };
  listeners.forEach((l) => l(item));
}

/**
 * Exclusão com "Desfazer": esconde o item na hora (feedback <100ms) e só executa
 * a exclusão de verdade após alguns segundos. Se o usuário desfizer, a chamada
 * nunca acontece — sem tocar na lógica do banco.
 */
export function useUndoableDelete(commit: (id: string) => void, label: string, duration = 5000) {
  const [pendentes, setPendentes] = useState<Set<string>>(new Set());
  const timers = useRef<Map<string, number>>(new Map());

  const desfazer = (id: string) => {
    const t = timers.current.get(id);
    if (t) window.clearTimeout(t);
    timers.current.delete(id);
    setPendentes((p) => { const n = new Set(p); n.delete(id); return n; });
  };

  const remover = (id: string) => {
    setPendentes((p) => new Set(p).add(id));
    const t = window.setTimeout(() => {
      commit(id);
      timers.current.delete(id);
      setPendentes((p) => { const n = new Set(p); n.delete(id); return n; });
    }, duration);
    timers.current.set(id, t);
    showToast({ message: `${label} excluído.`, actionLabel: 'Desfazer', onAction: () => desfazer(id), duration });
  };

  return { pendentes, remover };
}

export const ToastViewport: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const l: Listener = (t) => {
      setItems((prev) => [...prev, t]);
      window.setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), t.duration);
    };
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const dismiss = (id: number) => setItems((prev) => prev.filter((x) => x.id !== id));

  const toneRing: Record<string, string> = {
    neutral: 'border-stone-200',
    sucesso: 'border-emerald-200',
    erro: 'border-red-200',
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-[92vw] max-w-md">
      {items.map((t) => (
        <div
          key={t.id}
          className={`bg-superficie border ${toneRing[t.tone || 'neutral']} rounded-xl shadow-[0_10px_30px_rgba(28,25,23,0.14)] px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200`}
        >
          <span className="text-sm text-tinta flex-1">{t.message}</span>
          {t.actionLabel && (
            <button
              onClick={() => { t.onAction?.(); dismiss(t.id); }}
              className="text-sm font-semibold text-marca hover:text-marca-escuro shrink-0"
            >
              {t.actionLabel}
            </button>
          )}
          <button onClick={() => dismiss(t.id)} className="text-stone-300 hover:text-stone-500 shrink-0" aria-label="Fechar">×</button>
        </div>
      ))}
    </div>
  );
};
