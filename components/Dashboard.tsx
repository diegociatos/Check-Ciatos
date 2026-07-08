import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Task, TaskStatus, ScoreLedger, UserRole, User } from '../types';
import { getTodayStr } from '../store';
import { Flame, ChevronRight, Users, Star, ArrowUpRight, Award, Target } from 'lucide-react';

interface DashboardProps {
  currentUser: User;
  score: number;
  pendingTasksToday: Task[];
  recentLedger: ScoreLedger[];
  myLedger: ScoreLedger[];
  onNavigateToTasks: (view?: any) => void;
  tasks: Task[];
  currentUserRole: UserRole;
  collaborators: User[];
}

// ---- Paleta editorial (vermelho como único destaque) ----
const RED = '#8B1B1F';
const INK = '#1C1917';
const MUTED = '#78716C';

const DONE_STATUSES = [TaskStatus.AGUARDANDO_APROVACAO, TaskStatus.APROVADA];

// Níveis de progressão (por pontos acumulados)
const LEVELS = [
  { min: 0, nome: 'Base' },
  { min: 200, nome: 'Consistente' },
  { min: 500, nome: 'Referência' },
  { min: 1000, nome: 'Elite' },
  { min: 2000, nome: 'Mestre' },
];

function getLevel(total: number) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (total >= LEVELS[i].min) idx = i;
  const atual = LEVELS[idx];
  const proximo = LEVELS[idx + 1];
  const progresso = proximo
    ? Math.min(100, ((total - atual.min) / (proximo.min - atual.min)) * 100)
    : 100;
  return { idx, nome: atual.nome, proximo, progresso, faltam: proximo ? proximo.min - total : 0 };
}

// Sequência de dias "em dia": dias consecutivos (voltando de hoje) em que todas as
// obrigações do dia foram cumpridas. Dias sem tarefas são neutros (não quebram).
function computeStreak(userTasks: Task[]): number {
  const byDay = new Map<string, Task[]>();
  for (const t of userTasks) {
    const d = t.DataLimite_Date;
    if (!d) continue;
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(t);
  }
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 90; i++) {
    const key = cursor.toLocaleDateString('en-CA');
    const dayTasks = byDay.get(key);
    if (dayTasks && dayTasks.length > 0) {
      const todasFeitas = dayTasks.every(t => DONE_STATUSES.includes(t.Status));
      if (todasFeitas) {
        streak++;
      } else if (i === 0) {
        // hoje ainda em andamento: não conta, mas não quebra
      } else {
        break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Anel de progresso (SVG puro)
const ProgressRing: React.FC<{ pct: number; size?: number; stroke?: number; children?: React.ReactNode }> = ({
  pct, size = 132, stroke = 10, children,
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EFEBE7" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={RED} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
};

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_1px_2px_rgba(28,25,23,0.04)] ${className}`}>
    {children}
  </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.14em]">{children}</p>
);

const Dashboard: React.FC<DashboardProps> = ({
  currentUser, score, myLedger, onNavigateToTasks, tasks, currentUserRole, collaborators,
}) => {
  const isManager = currentUserRole === UserRole.GESTOR || currentUserRole === UserRole.ADMIN;
  const todayStr = getTodayStr();
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const primeiroNome = (currentUser.Nome || '').split(' ')[0];

  // 7 dias de produtividade (tarefas aprovadas por dia)
  const chartData = React.useMemo(() => {
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const days: { name: string; tasks: number; fullDate: string }[] = [];
    const d = new Date();
    d.setDate(d.getDate() - 6);
    for (let i = 0; i < 7; i++) {
      const dateStr = d.toLocaleDateString('en-CA');
      const count = tasks.filter(t => t.DataConclusao?.startsWith(dateStr) && t.Status === TaskStatus.APROVADA).length;
      days.push({ name: dayNames[d.getDay()], tasks: count, fullDate: dateStr });
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [tasks]);

  // ============ COLABORADOR ============
  if (!isManager) {
    const minhas = tasks.filter(t => t.Responsavel === currentUser.Email);
    const hojeTotal = minhas.filter(t => t.DataLimite_Date === todayStr);
    const hojeFeitas = hojeTotal.filter(t => DONE_STATUSES.includes(t.Status)).length;
    const hojePendentes = hojeTotal.filter(t => !DONE_STATUSES.includes(t.Status)).length;
    const pct = hojeTotal.length > 0 ? (hojeFeitas / hojeTotal.length) * 100 : 0;
    const tudoFeito = hojeTotal.length > 0 && hojePendentes === 0;

    const streak = computeStreak(minhas);
    const totalPts = Math.max(0, myLedger.reduce((s, l) => s + (l.Pontos || 0), 0));
    const nivel = getLevel(totalPts);

    const eficiencia = Math.round(currentUser.EficienciaMes || 0);
    const possiveis = currentUser.PontosPossiveisMes || 0;
    const bonusPct = Math.min(100, (eficiencia / 90) * 100);
    const elegivel = eficiencia >= 90;
    const ptsParaBonus = Math.max(0, Math.ceil(0.9 * possiveis - (currentUser.PontosRealizadosMes || 0)));

    return (
      <div className="space-y-8 animate-in fade-in duration-500 font-ciatos pb-10">
        {/* Herói: Hoje */}
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-[1fr_auto] gap-8 p-8 md:p-10 items-center">
            <div>
              <Label>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Label>
              <h1 className="text-4xl md:text-[2.6rem] leading-tight text-stone-900 mt-2">
                {saudacao}, {primeiroNome}.
              </h1>
              <p className="text-lg text-stone-500 mt-3 max-w-md">
                {hojeTotal.length === 0
                  ? 'Você não tem obrigações para hoje. Aproveite para adiantar o que vem.'
                  : tudoFeito
                    ? 'Tudo em dia por hoje. Excelente constância.'
                    : <>Você tem <span className="text-marca font-semibold">{hojePendentes} {hojePendentes === 1 ? 'obrigação' : 'obrigações'}</span> para concluir hoje.</>}
              </p>
              {hojeTotal.length > 0 && (
                <button
                  onClick={() => onNavigateToTasks('MINHAS_TAREFAS')}
                  className="mt-6 inline-flex items-center gap-2 bg-marca text-white pl-6 pr-5 py-3.5 rounded-xl text-sm font-semibold hover:bg-marca-escuro transition-colors active:scale-[0.98]"
                >
                  {tudoFeito ? 'Ver minhas obrigações' : 'Começar agora'}
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
            <div className="flex justify-center md:pr-6">
              <ProgressRing pct={pct}>
                <span className="font-titulo text-3xl font-semibold text-stone-900">{Math.round(pct)}%</span>
                <span className="text-[11px] text-stone-400 mt-0.5">{hojeFeitas} de {hojeTotal.length}</span>
              </ProgressRing>
            </div>
          </div>
        </Card>

        {/* Três medidores: sequência, nível, bônus */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sequência */}
          <Card className="p-7">
            <div className="flex items-center justify-between">
              <Label>Sequência</Label>
              <Flame size={18} className={streak > 0 ? 'text-marca' : 'text-stone-300'} />
            </div>
            <p className="mt-4 font-titulo text-4xl font-semibold text-stone-900">{streak}</p>
            <p className="text-sm text-stone-500 mt-1">
              {streak === 0 ? 'Comece uma sequência hoje' : streak === 1 ? 'dia em dia' : 'dias seguidos em dia'}
            </p>
          </Card>

          {/* Nível */}
          <Card className="p-7">
            <div className="flex items-center justify-between">
              <Label>Nível</Label>
              <Award size={18} className="text-marca" />
            </div>
            <p className="mt-4 font-titulo text-2xl font-semibold text-stone-900">{nivel.nome}</p>
            <div className="mt-3 h-1.5 rounded-full bg-stone-100 overflow-hidden">
              <div className="h-full bg-marca rounded-full transition-all duration-700" style={{ width: `${nivel.progresso}%` }} />
            </div>
            <p className="text-xs text-stone-400 mt-2">
              {nivel.proximo ? `${nivel.faltam} pts para ${nivel.proximo.nome}` : 'Nível máximo alcançado'}
            </p>
          </Card>

          {/* Rumo ao bônus */}
          <Card className="p-7">
            <div className="flex items-center justify-between">
              <Label>Rumo ao bônus</Label>
              <Target size={18} className={elegivel ? 'text-emerald-600' : 'text-marca'} />
            </div>
            <p className="mt-4 font-titulo text-4xl font-semibold text-stone-900">{eficiencia}%</p>
            <div className="mt-3 h-1.5 rounded-full bg-stone-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${elegivel ? 'bg-emerald-600' : 'bg-marca'}`} style={{ width: `${bonusPct}%` }} />
            </div>
            <p className="text-xs mt-2 text-stone-400">
              {elegivel ? '✓ Elegível ao bônus deste mês' : possiveis > 0 ? `Faltam ${ptsParaBonus} pts para 90%` : 'Sem obrigações no mês ainda'}
            </p>
          </Card>
        </div>

        {/* Produtividade + pontos do mês */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-stone-900">Sua produtividade</h3>
              <span className="text-[10px] font-semibold px-3 py-1 bg-stone-100 rounded-full text-stone-400 uppercase tracking-wider">7 dias</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EEEC" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: MUTED, fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: MUTED, fontSize: 12 }} width={24} />
                  <Tooltip cursor={{ fill: '#F7F5F3' }} contentStyle={{ borderRadius: 12, border: '1px solid #E7E5E4', boxShadow: '0 8px 20px rgba(28,25,23,0.08)', fontSize: 13 }} labelStyle={{ color: INK }} />
                  <Bar dataKey="tasks" radius={[6, 6, 0, 0]} name="Aprovadas">
                    {chartData.map((e, i) => <Cell key={i} fill={e.fullDate === todayStr ? RED : '#E7E5E4'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-8 flex flex-col">
            <Label>Pontos no mês</Label>
            <p className="mt-3 font-titulo text-5xl font-semibold text-stone-900">{score}</p>
            <p className="text-sm text-stone-500">pontos conquistados</p>
            <div className="mt-6 pt-6 border-t border-stone-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Acumulado total</span>
                <span className="font-semibold text-stone-900">{totalPts} pts</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Eficiência</span>
                <span className="font-semibold text-stone-900">{eficiencia}%</span>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTasks('MY_SCORE')}
              className="mt-6 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-marca hover:gap-2.5 transition-all"
            >
              Ver meu extrato de pontos <ArrowUpRight size={16} />
            </button>
          </Card>
        </div>
      </div>
    );
  }

  // ============ GESTOR / ADMIN ============
  const teamPendingToday = tasks.filter(t => t.DataLimite_Date === todayStr && t.Status === TaskStatus.PENDENTE).length;
  const teamCompletedToday = tasks.filter(t => t.DataConclusao?.startsWith(todayStr)).length;
  const teamTotalToday = tasks.filter(t => t.DataLimite_Date === todayStr).length;
  const teamRate = teamTotalToday > 0 ? (teamCompletedToday / teamTotalToday) * 100 : 0;
  const top3 = [...collaborators].sort((a, b) => (b.PontosRealizadosMes || 0) - (a.PontosRealizadosMes || 0)).slice(0, 3);

  const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
    <Card className="p-7">
      <Label>{label}</Label>
      <p className="mt-3 font-titulo text-3xl font-semibold text-stone-900">{value}</p>
      {hint && <p className="text-sm text-stone-400 mt-1">{hint}</p>}
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-ciatos pb-10">
      <div>
        <Label>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Label>
        <h1 className="text-3xl md:text-4xl text-stone-900 mt-1">{saudacao}, {primeiroNome}.</h1>
        <p className="text-stone-500 mt-1">Panorama da sua equipe hoje.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-7 bg-marca border-marca text-white">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.14em]">Equipe</p>
            <Users size={18} className="text-white/70" />
          </div>
          <p className="mt-3 font-titulo text-3xl font-semibold">{collaborators.length}</p>
          <p className="text-sm text-white/60 mt-1">{collaborators.length === 1 ? 'membro' : 'membros'}</p>
        </Card>
        <Stat label="Pendentes hoje" value={teamPendingToday} hint="obrigações a cumprir" />
        <Stat label="Concluídas hoje" value={teamCompletedToday} hint="entregues pela equipe" />
        <Stat label="Taxa de sucesso" value={`${teamRate.toFixed(0)}%`} hint="do que vencia hoje" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg text-stone-900">Produtividade da equipe</h3>
            <span className="text-[10px] font-semibold px-3 py-1 bg-stone-100 rounded-full text-stone-400 uppercase tracking-wider">7 dias</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EEEC" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: MUTED, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: MUTED, fontSize: 12 }} width={24} />
                <Tooltip cursor={{ fill: '#F7F5F3' }} contentStyle={{ borderRadius: 12, border: '1px solid #E7E5E4', boxShadow: '0 8px 20px rgba(28,25,23,0.08)', fontSize: 13 }} />
                <Bar dataKey="tasks" radius={[6, 6, 0, 0]} name="Aprovadas">
                  {chartData.map((e, i) => <Cell key={i} fill={e.fullDate === todayStr ? RED : '#E7E5E4'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-8">
            <h3 className="text-lg text-stone-900 flex items-center gap-2 mb-5">
              <Star size={18} className="text-marca" fill="currentColor" /> Destaques do mês
            </h3>
            <div className="space-y-4">
              {top3.map((p, i) => (
                <div key={p.Email} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold w-5 ${i === 0 ? 'text-marca' : 'text-stone-300'}`}>{i + 1}º</span>
                    <span className="text-sm text-stone-700">{p.Nome}</span>
                  </div>
                  <span className="text-sm font-semibold text-stone-900">{p.PontosRealizadosMes || 0} pts</span>
                </div>
              ))}
              {top3.length === 0 && <p className="text-sm text-stone-300 italic">Sem pontuação registrada ainda.</p>}
            </div>
          </Card>

          <button
            onClick={() => onNavigateToTasks('TASK_SUPERVISION')}
            className="w-full text-left bg-stone-900 text-white p-8 rounded-2xl hover:bg-stone-800 transition-colors group"
          >
            <h3 className="text-lg mb-1">Conferir entregas</h3>
            <p className="text-stone-400 text-sm mb-5">A excelência do Grupo Ciatos vem da auditoria de cada obrigação.</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all">
              Gerenciar equipe <ChevronRight size={16} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
