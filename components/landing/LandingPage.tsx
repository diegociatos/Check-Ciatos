import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Gauge,
  Layers3,
  LockKeyhole,
  Medal,
  Menu,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserCheck,
  Users2,
  X,
} from 'lucide-react';

const WHATSAPP_NUMBER = '5531999999999'; // Substitua pelo numero comercial real do Check-Ciatos.

const navLinks = [
  { label: 'Problema', href: '#problema' },
  { label: 'Solucao', href: '#solucao' },
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Planos', href: '#planos' },
  { label: 'FAQ', href: '#faq' },
];

const pains = [
  'Tarefas ficam espalhadas no WhatsApp.',
  'O gestor precisa cobrar tudo manualmente.',
  'Nao existe historico confiavel de entregas.',
  'Bonificacao vira percepcao, nao dado.',
  'Colaboradores bons nao sao reconhecidos.',
  'Atrasos e retrabalhos passam despercebidos.',
];

const solutions = [
  ['Tarefas recorrentes', 'Padronize rotinas diarias, semanais, mensais e entregas por data especifica.'],
  ['Entregas com evidencia', 'Centralize comprovantes, anexos e historico em um fluxo auditavel.'],
  ['Aprovacao pelo gestor', 'Revise, aprove, reprove ou solicite ajuste sem perder contexto.'],
  ['Pontuacao automatica', 'Transforme tarefas aprovadas em pontos e indicadores de desempenho.'],
  ['Ranking e relatorios', 'Acompanhe produtividade por pessoa, equipe e periodo.'],
  ['Bonificacao por desempenho', 'Use dados claros para apoiar sua politica interna de reconhecimento.'],
];

const features = [
  'Cadastro de tarefas e modelos recorrentes.',
  'Tarefas diarias, semanais, mensais e por data especifica.',
  'Acompanhamento por colaborador.',
  'Status: a fazer, em andamento, enviada, aprovada e reprovada.',
  'Anexo de evidencias.',
  'Auditoria de entregas.',
  'Pontuacao positiva e penalidades.',
  'Ranking da equipe.',
  'Tarefas pessoais reconhecidas pelo gestor.',
  'Relatorios por mes, trimestre, semestre e ano.',
  'Exportacao CSV.',
  'Multiempresa.',
  'Papeis: Plataforma, Master, Gestor e Colaborador.',
  'Isolamento por empresa com Supabase/RLS.',
  'Dashboard do colaborador e do gestor.',
  'Historico de pontuacao.',
];

const steps = [
  ['1', 'Cadastre sua empresa e equipe.', 'Defina usuarios, papeis e empresas atendidas.'],
  ['2', 'Crie tarefas e modelos recorrentes.', 'Monte a rotina padrao que precisa acontecer sem improviso.'],
  ['3', 'O colaborador executa e envia.', 'Cada entrega ganha status, prazo, evidencia e responsavel.'],
  ['4', 'O gestor confere e aprova.', 'Aprovacoes centralizadas reduzem retrabalho e ruido.'],
  ['5', 'O sistema gera pontos.', 'Indicadores atualizados ajudam a medir performance real.'],
  ['6', 'A empresa reconhece com justica.', 'Os dados apoiam a politica interna de bonificacao.'],
];

const benefits = [
  {
    title: 'Para o empresario',
    items: ['Clareza sobre produtividade.', 'Menos cobranca informal.', 'Dados para reconhecer os melhores.', 'Reducao de atrasos e falhas.', 'Padronizacao da rotina.'],
  },
  {
    title: 'Para o gestor',
    items: ['Visao das tarefas da equipe.', 'Aprovacao centralizada.', 'Evidencias em um so lugar.', 'Relatorios por periodo.', 'Menos cobranca manual.'],
  },
  {
    title: 'Para o colaborador',
    items: ['Clareza do que precisa ser feito.', 'Pontos por entrega.', 'Historico de evolucao.', 'Reconhecimento por tarefas extras.', 'Transparencia na bonificacao.'],
  },
];

const useCases = ['Escritorios de contabilidade', 'Escritorios de advocacia', 'Consultorias', 'Equipes administrativas', 'Equipes financeiras', 'Operacoes com rotinas recorrentes', 'Empresas que bonificam por produtividade'];

const faqs = [
  ['O Check-Ciatos e so um app de tarefas?', 'Nao. Ele conecta tarefas, auditoria, indicadores, pontuacao e reconhecimento por performance em um unico fluxo de gestao.'],
  ['Posso usar para bonificar colaboradores?', 'Sim. O sistema fornece indicadores para apoiar a politica interna de reconhecimento e bonificacao da empresa.'],
  ['O colaborador ve seus pontos?', 'Sim. O colaborador acompanha pontos, historico, evolucao e elegibilidade conforme as regras internas definidas pela empresa.'],
  ['O gestor aprova as entregas?', 'Sim. O gestor pode conferir entregas, aprovar, reprovar ou solicitar ajuste com historico organizado.'],
  ['Da para anexar comprovantes?', 'Sim. As entregas podem receber evidencias para facilitar auditoria e reduzir discussoes informais.'],
  ['Serve para contabilidade e advocacia?', 'Sim. O produto foi pensado para rotinas recorrentes de equipes administrativas, operacionais e de servicos profissionais.'],
  ['Cada empresa tem seus proprios dados?', 'Sim. O app trabalha com isolamento por empresa e controle por perfil de usuario.'],
  ['Posso criar tarefas recorrentes?', 'Sim. Voce pode criar modelos para tarefas diarias, semanais, mensais e por data especifica.'],
  ['O sistema calcula folha de pagamento?', 'Nao. O Check-Ciatos fornece indicadores de produtividade e pontuacao para apoiar a gestao interna. A politica de pagamento ou bonificacao deve ser definida pela empresa com sua assessoria contabil/juridica.'],
];

const pricing = [
  ['Essencial', 'Para empresas que querem organizar a rotina operacional.', ['Gestao de tarefas', 'Tarefas recorrentes', 'Dashboard do colaborador', 'Aprovacao de entregas']],
  ['Profissional', 'Para equipes que querem medir, auditar e reconhecer performance.', ['Tudo do Essencial', 'Pontuacao e ranking', 'Relatorios', 'Evidencias', 'Dashboard do gestor']],
  ['Enterprise', 'Para operacoes multiempresa com implantacao assistida.', ['Multiempresa', 'Personalizacao', 'Relatorios avancados', 'Suporte prioritario', 'Implantacao assistida']],
];

function createWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function scheduleMessage() {
  return createWhatsAppUrl('Ola! Quero agendar uma demonstracao do Check-Ciatos para entender como organizar tarefas, produtividade, pontuacao e bonificacao da minha equipe.');
}

const SectionHeading: React.FC<{ eyebrow: string; title: string; description?: string; center?: boolean }> = ({ eyebrow, title, description, center }) => (
  <div className={`mb-10 ${center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}`}>
    <p className="text-sm font-bold uppercase tracking-[0.18em] text-marca">{eyebrow}</p>
    <h2 className="mt-3 text-3xl font-bold leading-tight text-tinta md:text-5xl">{title}</h2>
    {description && <p className="mt-4 text-base leading-7 text-stone-600 md:text-lg">{description}</p>}
  </div>
);

const PrimaryButton: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-marca px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/15 transition hover:bg-marca-escuro focus:outline-none focus:ring-4 focus:ring-marca/25" href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined}>
    {children}
    <ArrowRight size={18} aria-hidden="true" />
  </a>
);

const SecondaryButton: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-tinta shadow-sm transition hover:border-marca hover:text-marca focus:outline-none focus:ring-4 focus:ring-marca/20" href={href}>
    {children}
  </a>
);

const LandingHeader: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#F7F5F2]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a className="flex items-center gap-3 focus:outline-none focus:ring-4 focus:ring-marca/20 rounded-lg" href="#topo" aria-label="Check-Ciatos">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-marca text-sm font-black text-white shadow-md">CC</span>
          <span>
            <span className="block font-titulo text-xl font-bold leading-none text-tinta">Check-Ciatos</span>
            <span className="text-xs font-semibold text-stone-500">Produtividade com evidencia</span>
          </span>
        </a>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-stone-600 lg:flex" aria-label="Menu principal">
          {navLinks.map((link) => <a key={link.href} className="hover:text-marca focus:outline-none focus:ring-4 focus:ring-marca/20 rounded" href={link.href}>{link.label}</a>)}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <SecondaryButton href="/login">Entrar</SecondaryButton>
          <PrimaryButton href={scheduleMessage()}>Agendar demonstracao</PrimaryButton>
        </div>

        <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-stone-300 bg-white text-tinta lg:hidden focus:outline-none focus:ring-4 focus:ring-marca/20" onClick={() => setOpen(!open)} aria-label={open ? 'Fechar menu' : 'Abrir menu'}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-stone-200 bg-[#F7F5F2] px-4 py-4 lg:hidden">
          <nav className="grid gap-2 text-sm font-semibold text-stone-700" aria-label="Menu mobile">
            {navLinks.map((link) => <a key={link.href} className="rounded-lg px-3 py-2 hover:bg-white" href={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}
            <a className="rounded-lg px-3 py-2 hover:bg-white" href="/login">Entrar</a>
            <a className="rounded-lg bg-marca px-3 py-3 text-center text-white" href={scheduleMessage()} target="_blank" rel="noreferrer">Agendar demonstracao</a>
          </nav>
        </div>
      )}
    </header>
  );
};

const HeroMockup: React.FC = () => (
  <div className="relative mx-auto max-w-xl rounded-[24px] border border-stone-200 bg-white p-4 shadow-2xl shadow-stone-900/10 md:p-5" aria-label="Previa visual do dashboard Check-Ciatos">
    <div className="flex items-center justify-between border-b border-stone-100 pb-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-marca">Dashboard</p>
        <h3 className="text-xl font-bold text-tinta">Produtividade hoje</h3>
      </div>
      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">87% no prazo</span>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-[#F7F5F2] p-4"><p className="text-xs text-stone-500">Progresso do dia</p><p className="mt-2 text-3xl font-black text-tinta">34/42</p><div className="mt-3 h-2 rounded-full bg-stone-200"><div className="h-2 w-4/5 rounded-full bg-green-600" /></div></div>
      <div className="rounded-xl bg-red-50 p-4"><p className="text-xs text-stone-500">Pontos do mes</p><p className="mt-2 text-3xl font-black text-marca">1.248</p><p className="mt-3 text-xs font-semibold text-marca">+18% vs. mes anterior</p></div>
      <div className="rounded-xl border border-stone-100 p-4"><p className="text-xs text-stone-500">Ranking da equipe</p><div className="mt-3 space-y-2 text-sm"><p className="flex justify-between"><span>Ana</span><strong>410 pts</strong></p><p className="flex justify-between"><span>Bruno</span><strong>382 pts</strong></p><p className="flex justify-between"><span>Carla</span><strong>351 pts</strong></p></div></div>
      <div className="rounded-xl border border-stone-100 p-4"><p className="text-xs text-stone-500">Pendentes</p><p className="mt-2 text-3xl font-black text-tinta">8</p><p className="mt-3 text-xs font-semibold text-amber-700">3 aguardam aprovacao</p></div>
    </div>
    <div className="mt-3 rounded-xl bg-[#1C1917] p-4 text-white">
      <div className="flex items-center justify-between"><span className="text-sm font-bold">Elegivel para bonus</span><span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-stone-900">SIM</span></div>
      <div className="mt-4 flex h-24 items-end gap-2" aria-hidden="true">
        {[45, 62, 58, 76, 70, 88, 82].map((height, index) => <span key={index} className="flex-1 rounded-t-md bg-white/80" style={{ height: `${height}%` }} />)}
      </div>
    </div>
  </div>
);

const HeroSection: React.FC = () => (
  <section id="topo" className="relative overflow-hidden bg-[#F7F5F2] pt-14 md:pt-20">
    <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 sm:px-6 md:pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-red-900/10 bg-white px-4 py-2 text-sm font-bold text-marca shadow-sm"><Sparkles size={16} /> SaaS B2B para rotina, performance e reconhecimento</div>
        <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.04] text-tinta md:text-6xl">Transforme tarefas em produtividade. E produtividade em bonificacao.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-650 md:text-xl">O Check-Ciatos organiza a rotina da equipe, acompanha entregas, pontua colaboradores e ajuda sua empresa a bonificar quem realmente entrega resultado.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><PrimaryButton href={scheduleMessage()}>Agendar demonstracao</PrimaryButton><SecondaryButton href="/login">Entrar no sistema</SecondaryButton></div>
        <div className="mt-10 grid gap-3 text-sm font-semibold text-stone-600 sm:grid-cols-3">
          {['Rotina auditavel', 'Pontuacao clara', 'Dados por empresa'].map((item) => <span key={item} className="flex items-center gap-2"><CheckCircle2 className="text-green-700" size={18} />{item}</span>)}
        </div>
      </div>
      <HeroMockup />
    </div>
  </section>
);

const ProblemSection: React.FC = () => (
  <section id="problema" className="bg-white py-20 md:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="O problema" title="Sua equipe trabalha muito. Mas voce sabe exatamente quem entrega o que?" description="Muitas empresas sofrem com tarefas esquecidas, cobrancas informais, falta de padrao, atrasos recorrentes e dificuldade para reconhecer os colaboradores mais produtivos." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{pains.map((pain) => <div key={pain} className="rounded-lg border border-stone-200 bg-[#F7F5F2] p-5 text-base font-semibold text-tinta"><Clock3 className="mb-4 text-marca" size={24} />{pain}</div>)}</div>
    </div>
  </section>
);

const SolutionSection: React.FC = () => (
  <section id="solucao" className="bg-[#F7F5F2] py-20 md:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="A solucao" title="Uma rotina clara, auditavel e pontuada." description="Com o Check-Ciatos, cada colaborador sabe o que precisa fazer, o gestor acompanha a execucao, aprova as entregas e o sistema transforma performance em pontuacao." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{solutions.map(([title, description]) => <article key={title} className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm"><FileCheck2 className="mb-5 text-marca" size={28} /><h3 className="text-xl font-bold text-tinta">{title}</h3><p className="mt-3 leading-7 text-stone-600">{description}</p></article>)}</div>
    </div>
  </section>
);

const FeaturesSection: React.FC = () => (
  <section id="funcionalidades" className="bg-white py-20 md:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading center eyebrow="Funcionalidades" title="Tudo que uma equipe recorrente precisa para sair do improviso." description="O Check-Ciatos conecta cadastro, execucao, auditoria, pontos, ranking e relatorios sem transformar a rotina em burocracia." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{features.map((feature) => <div key={feature} className="flex min-h-24 items-start gap-3 rounded-lg border border-stone-200 bg-[#F7F5F2] p-4"><CheckCircle2 className="mt-0.5 shrink-0 text-green-700" size={18} /><span className="text-sm font-semibold leading-6 text-stone-700">{feature}</span></div>)}</div>
    </div>
  </section>
);

const HowItWorksSection: React.FC = () => (
  <section id="como-funciona" className="bg-[#1C1917] py-20 text-white md:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading center eyebrow="Como funciona" title="Seis passos para transformar rotina em dado confiavel." description="Da criacao da tarefa ao reconhecimento por performance, tudo fica registrado em um fluxo simples para gestor e colaborador." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{steps.map(([number, title, description]) => <article key={number} className="rounded-lg border border-white/10 bg-white/5 p-6"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-black text-marca">{number}</span><h3 className="mt-5 text-xl font-bold text-white">{title}</h3><p className="mt-3 leading-7 text-stone-300">{description}</p></article>)}</div>
    </div>
  </section>
);

const GamificationSection: React.FC = () => (
  <section className="bg-[#F7F5F2] py-20 md:py-28">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
      <div><SectionHeading eyebrow="Gamificacao e bonificacao" title="Reconheca quem entrega. Corrija quem atrasa." description="O Check-Ciatos cria uma cultura de produtividade baseada em dados. O colaborador acompanha seus pontos, sua evolucao e sua elegibilidade ao bonus." /><p className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-900">O sistema fornece indicadores para apoiar a politica interna de reconhecimento e bonificacao da empresa, sem prometer calculo trabalhista ou juridico de remuneracao variavel.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">{['Pontos por tarefa aprovada', 'Penalidades por nao execucao', 'Reducao por erro ou retrabalho', 'Niveis de performance', 'Sequencia de dias em dia', 'Ranking da equipe', 'Elegibilidade ao bonus', 'Historico individual'].map((item) => <div key={item} className="rounded-lg bg-white p-5 shadow-sm"><Trophy className="mb-4 text-yellow-600" size={26} /><h3 className="font-bold text-tinta">{item}</h3></div>)}</div>
    </div>
  </section>
);

const DashboardPreviewSection: React.FC = () => (
  <section className="bg-white py-20 md:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading center eyebrow="Dashboard preview" title="Indicadores que o gestor entende em segundos." description="Mockups em HTML/CSS representando a experiencia do produto, sem depender de prints externos." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[['Produtividade da equipe', '87%', BarChart3], ['Pendentes hoje', '12', ClipboardCheck], ['Concluidas hoje', '34', CheckCircle2], ['Taxa de sucesso', '91%', Gauge], ['Destaques do mes', '5', Star], ['Extrato de pontos', '+248', Medal], ['Aguardando aprovacao', '7', UserCheck], ['Empresas ativas', '3', Building2]].map(([title, value, Icon]) => <div key={String(title)} className="rounded-lg border border-stone-200 bg-[#F7F5F2] p-5"><Icon className="text-marca" size={24} /><p className="mt-5 text-sm font-semibold text-stone-500">{String(title)}</p><p className="mt-2 text-3xl font-black text-tinta">{String(value)}</p></div>)}
      </div>
    </div>
  </section>
);

const BenefitsSection: React.FC = () => (
  <section className="bg-[#F7F5F2] py-20 md:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading center eyebrow="Beneficios" title="Sua empresa ganha clareza. O gestor ganha controle. O colaborador ganha reconhecimento." />
      <div className="grid gap-5 lg:grid-cols-3">{benefits.map((group) => <article key={group.title} className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm"><h3 className="text-2xl font-bold text-tinta">{group.title}</h3><ul className="mt-6 space-y-3">{group.items.map((item) => <li key={item} className="flex gap-3 text-stone-700"><ChevronRight className="mt-0.5 shrink-0 text-marca" size={18} />{item}</li>)}</ul></article>)}</div>
    </div>
  </section>
);

const UseCasesSection: React.FC = () => (
  <section className="bg-white py-20 md:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="Casos de uso" title="Feito para operacoes que dependem de rotina bem executada." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{useCases.map((useCase) => <div key={useCase} className="rounded-lg border border-stone-200 p-5 font-bold text-tinta"><Layers3 className="mb-4 text-marca" size={24} />{useCase}</div>)}</div>
    </div>
  </section>
);

const SecuritySection: React.FC = () => (
  <section className="bg-[#F7F5F2] py-20 md:py-28">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <SectionHeading eyebrow="Seguranca e controle" title="Controle por perfil, dados isolados e gestao multiempresa." description="O Check-Ciatos foi construido para ambientes empresariais: cada papel acessa o que precisa, cada empresa opera com seus proprios dados e evidencias ficam em armazenamento privado." />
      <div className="grid gap-4 sm:grid-cols-2">{[['Controle por perfil de usuario', Users2], ['Empresas com dados isolados', ShieldCheck], ['Supabase Auth', LockKeyhole], ['RLS no banco', Target], ['Storage privado para evidencias', FileCheck2], ['Historico de pontuacao', Award]].map(([text, Icon]) => <div key={String(text)} className="rounded-lg bg-white p-5 shadow-sm"><Icon className="text-marca" size={25} /><p className="mt-4 font-bold text-tinta">{String(text)}</p></div>)}</div>
    </div>
  </section>
);

const PricingSection: React.FC = () => (
  <section id="planos" className="bg-white py-20 md:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading center eyebrow="Planos" title="Escolha o nivel certo para a maturidade da sua operacao." description="Valores sob consulta para adequar usuarios, empresas, implantacao e suporte ao seu cenario." />
      <div className="grid gap-5 lg:grid-cols-3">{pricing.map(([name, desc, items], index) => <article key={String(name)} className={`rounded-lg border p-6 shadow-sm ${index === 1 ? 'border-marca bg-red-50' : 'border-stone-200 bg-[#F7F5F2]'}`}><h3 className="text-2xl font-bold text-tinta">{String(name)}</h3><p className="mt-3 min-h-14 leading-7 text-stone-600">{String(desc)}</p><p className="mt-6 text-3xl font-black text-marca">Sob consulta</p><ul className="mt-6 space-y-3">{(items as string[]).map((item) => <li key={item} className="flex gap-3 text-stone-700"><CheckCircle2 className="mt-0.5 shrink-0 text-green-700" size={18} />{item}</li>)}</ul><div className="mt-8"><PrimaryButton href={scheduleMessage()}>Solicitar demonstracao</PrimaryButton></div></article>)}</div>
    </div>
  </section>
);

const FAQSection: React.FC = () => (
  <section id="faq" className="bg-[#F7F5F2] py-20 md:py-28">
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <SectionHeading center eyebrow="FAQ" title="Perguntas frequentes." />
      <div className="space-y-4">{faqs.map(([question, answer]) => <details key={question} className="group rounded-lg border border-stone-200 bg-white p-5 shadow-sm"><summary className="cursor-pointer list-none text-lg font-bold text-tinta focus:outline-none focus:ring-4 focus:ring-marca/20">{question}</summary><p className="mt-4 leading-7 text-stone-600">{answer}</p></details>)}</div>
    </div>
  </section>
);

const CTASection: React.FC = () => {
  const [form, setForm] = useState({ nome: '', empresa: '', email: '', whatsapp: '', colaboradores: '', mensagem: '' });
  const whatsUrl = useMemo(() => {
    const msg = `Ola! Quero uma demonstracao do Check-Ciatos.%0A%0ANome: ${form.nome}%0AEmpresa: ${form.empresa}%0AE-mail: ${form.email}%0AWhatsApp: ${form.whatsapp}%0AColaboradores: ${form.colaboradores}%0AMensagem: ${form.mensagem}`;
    return createWhatsAppUrl(msg);
  }, [form]);

  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((current) => ({ ...current, [field]: event.target.value }));

  return (
    <section id="contato" className="bg-[#1C1917] py-20 text-white md:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-red-200">Proximo passo</p><h2 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">Quer transformar a produtividade da sua equipe em dados claros?</h2><p className="mt-5 text-lg leading-8 text-stone-300">Agende uma demonstracao e veja como o Check-Ciatos pode organizar tarefas, medir entregas e apoiar uma politica de reconhecimento mais justa.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><PrimaryButton href={scheduleMessage()}>Agendar demonstracao</PrimaryButton><SecondaryButton href="/login">Entrar no sistema</SecondaryButton></div></div>
        <form className="rounded-lg bg-white p-5 text-tinta shadow-2xl md:p-6" onSubmit={(event) => { event.preventDefault(); window.open(whatsUrl, '_blank', 'noopener,noreferrer'); }}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-bold">Nome<input required className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-3 font-normal outline-none focus:border-marca focus:ring-4 focus:ring-marca/20" value={form.nome} onChange={update('nome')} /></label>
            <label className="text-sm font-bold">Empresa<input required className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-3 font-normal outline-none focus:border-marca focus:ring-4 focus:ring-marca/20" value={form.empresa} onChange={update('empresa')} /></label>
            <label className="text-sm font-bold">E-mail<input required type="email" className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-3 font-normal outline-none focus:border-marca focus:ring-4 focus:ring-marca/20" value={form.email} onChange={update('email')} /></label>
            <label className="text-sm font-bold">WhatsApp<input required className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-3 font-normal outline-none focus:border-marca focus:ring-4 focus:ring-marca/20" value={form.whatsapp} onChange={update('whatsapp')} /></label>
            <label className="text-sm font-bold md:col-span-2">Quantidade de colaboradores<select required className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-3 font-normal outline-none focus:border-marca focus:ring-4 focus:ring-marca/20" value={form.colaboradores} onChange={update('colaboradores')}><option value="">Selecione</option><option>1 a 10</option><option>11 a 30</option><option>31 a 100</option><option>Mais de 100</option></select></label>
            <label className="text-sm font-bold md:col-span-2">Mensagem<textarea className="mt-2 min-h-28 w-full rounded-lg border border-stone-300 px-3 py-3 font-normal outline-none focus:border-marca focus:ring-4 focus:ring-marca/20" value={form.mensagem} onChange={update('mensagem')} /></label>
          </div>
          <button type="submit" className="mt-5 inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-lg bg-marca px-5 py-3 text-sm font-bold text-white transition hover:bg-marca-escuro focus:outline-none focus:ring-4 focus:ring-marca/25">Enviar interesse pelo WhatsApp <ArrowRight size={18} /></button>
        </form>
      </div>
    </section>
  );
};

const LandingFooter: React.FC = () => (
  <footer className="bg-[#F7F5F2] py-10">
    <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
      <div><h2 className="text-2xl font-bold text-tinta">Check-Ciatos</h2><p className="mt-3 max-w-md leading-7 text-stone-600">Gestao de produtividade, tarefas e bonificacao por performance.</p><p className="mt-6 text-sm text-stone-500">© 2026 Check-Ciatos. Grupo Ciatos.</p></div>
      <div><h3 className="font-bold text-tinta">Links</h3><div className="mt-3 grid gap-2 text-sm font-semibold text-stone-600"><a href="#funcionalidades">Funcionalidades</a><a href="#planos">Planos</a><a href="#faq">FAQ</a><a href="/login">Entrar</a></div></div>
      <div><h3 className="font-bold text-tinta">Contato comercial</h3><p className="mt-3 text-sm leading-6 text-stone-600">Agende uma demonstracao para avaliar equipe, rotina, papeis e politica de reconhecimento.</p><a className="mt-4 inline-flex font-bold text-marca" href={scheduleMessage()} target="_blank" rel="noreferrer">Falar no WhatsApp</a></div>
    </div>
  </footer>
);

const LandingPage: React.FC = () => (
  <main className="min-h-screen scroll-smooth bg-[#F7F5F2] font-corpo text-tinta">
    <LandingHeader />
    <HeroSection />
    <ProblemSection />
    <SolutionSection />
    <FeaturesSection />
    <HowItWorksSection />
    <GamificationSection />
    <DashboardPreviewSection />
    <BenefitsSection />
    <UseCasesSection />
    <SecuritySection />
    <PricingSection />
    <FAQSection />
    <CTASection />
    <LandingFooter />
  </main>
);

export default LandingPage;
