import React from 'react';
import {
  ArrowRight,
  Award,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  CloudUpload,
  CreditCard,
  FileCheck2,
  Gauge,
  HardDrive,
  LockKeyhole,
  Medal,
  Menu,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserCheck,
  Users2,
  X,
} from 'lucide-react';

const ASAAS_CONTROLE_URL = import.meta.env.VITE_ASAAS_CONTROLE_URL || '#planos';
const ASAAS_EVIDENCIAS_URL = import.meta.env.VITE_ASAAS_EVIDENCIAS_URL || '#planos';
const ASAAS_MEMORIA_EXTRA_URL = import.meta.env.VITE_ASAAS_MEMORIA_EXTRA_URL || '#memoria';

const navLinks = [
  ['Como funciona', '#como-funciona'],
  ['Manual', '#manual'],
  ['Planos', '#planos'],
  ['Memoria', '#memoria'],
  ['FAQ', '#faq'],
];

const features = [
  'Cadastro de tarefas e modelos recorrentes.',
  'Tarefas diarias, semanais, mensais e por data especifica.',
  'Status: a fazer, em andamento, enviada, aprovada e reprovada.',
  'Pontuacao positiva, penalidades, ranking e historico.',
  'Relatorios por periodo e exportacao CSV.',
  'Papeis de acesso: Plataforma, Master, Gestor e Colaborador.',
  'Multiempresa com dados isolados por cliente.',
  'Dashboard do gestor e dashboard do colaborador.',
];

const flowSteps = [
  {
    title: '1. Escolha o plano',
    text: 'A empresa escolhe entre operar sem documentos, pagando menos, ou usar evidencias com anexos e limite de armazenamento.',
    icon: CreditCard,
  },
  {
    title: '2. Pague recorrente no Asaas',
    text: 'O botao do plano leva para a assinatura recorrente. Nao existe formulario para a equipe tratar manualmente a contratacao.',
    icon: ShieldCheck,
  },
  {
    title: '3. Receba o acesso',
    text: 'Com o webhook do Asaas, o pagamento confirmado cria a empresa, ativa o plano e libera o usuario Master automaticamente.',
    icon: Users2,
  },
  {
    title: '4. Comece a usar',
    text: 'O cliente segue o manual do site, cria equipe, modelos de tarefas, aprova entregas e acompanha pontos e indicadores.',
    icon: PlayCircle,
  },
];

const manualSteps = [
  ['Criar empresa', 'Depois do pagamento, acesse o sistema e confirme os dados da empresa criada automaticamente pelo plano contratado.'],
  ['Cadastrar equipe', 'Inclua gestores e colaboradores. Cada pessoa acessa apenas o que faz sentido para o seu papel.'],
  ['Montar modelos', 'Crie tarefas recorrentes para rotinas diarias, semanais, mensais ou por data especifica.'],
  ['Executar tarefas', 'O colaborador visualiza sua lista, inicia a execucao, envia a entrega e anexa comprovantes apenas se o plano permitir.'],
  ['Auditar entregas', 'O gestor confere a entrega, aprova, reprova ou solicita ajuste. Tudo fica registrado no historico.'],
  ['Acompanhar pontos', 'Use dashboard, ranking, extrato e relatorios para apoiar reconhecimento e bonificacao interna.'],
];

const plans = [
  {
    name: 'Plano Controle',
    price: 'R$ 39,90/mês',
    description: 'Para empresas que querem organizar tarefas, cobrar entregas e pontuar colaboradores sem anexar documentos.',
    note: 'Sem anexos: nao consome storage de documentos e mantem o custo baixo.',
    href: ASAAS_CONTROLE_URL,
    items: ['Tarefas e modelos recorrentes', 'Aprovacao de entregas', 'Pontuacao e ranking', 'Dashboard e relatorios', 'Exportacao CSV', 'Upload de documentos bloqueado'],
  },
  {
    name: 'Plano Evidencias',
    price: 'R$ 149,90/mês',
    description: 'Para empresas que precisam anexar documentos, comprovantes, prints, recibos e evidencias nas tarefas.',
    note: 'Inclui 1 GB de armazenamento. Ao atingir o limite, e necessario contratar memoria extra.',
    href: ASAAS_EVIDENCIAS_URL,
    featured: true,
    items: ['Tudo do Plano Controle', 'Upload de documentos', 'Comprovantes por tarefa', 'Storage privado de 1 GB', 'Auditoria com evidencias', 'Historico documentado'],
  },
];

const faqs = [
  ['Preciso falar com alguem para contratar?', 'Nao. O cliente escolhe o plano e paga a assinatura recorrente pelo Asaas. A contratacao deve ser automatizada pelo webhook de pagamento, sem formulario para equipe comercial tratar manualmente.'],
  ['Qual plano devo escolher?', 'Escolha o Plano Controle se sua empresa nao precisa anexar arquivos. Escolha o Plano Evidencias se precisa guardar comprovantes, documentos e evidencias nas tarefas.'],
  ['Quanto de memoria esta incluido?', 'O Plano Controle nao permite anexos. O Plano Evidencias inclui 1 GB de armazenamento para documentos e comprovantes. Se a empresa consumir todo o limite, precisa contratar memoria extra.'],
  ['O que acontece ao atingir o limite de memoria?', 'O upload de novos anexos deve ser bloqueado ate a empresa apagar documentos antigos ou contratar memoria adicional recorrente pelo Asaas.'],
  ['O sistema calcula folha de pagamento?', 'Nao. O Check-Ciatos fornece indicadores de produtividade e pontuacao para apoiar a gestao interna. A politica de pagamento ou bonificacao deve ser definida pela empresa com sua assessoria contabil/juridica.'],
];

function isExternalPaymentLink(href: string) {
  return href.startsWith('http');
}

const PrimaryButton: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-marca px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/15 transition hover:bg-marca-escuro focus:outline-none focus:ring-4 focus:ring-marca/25" href={href} target={isExternalPaymentLink(href) ? '_blank' : undefined} rel={isExternalPaymentLink(href) ? 'noreferrer' : undefined}>
    {children}<ArrowRight size={18} />
  </a>
);

const SecondaryButton: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-tinta shadow-sm transition hover:border-marca hover:text-marca focus:outline-none focus:ring-4 focus:ring-marca/20" href={href}>{children}</a>
);

const SectionHeading: React.FC<{ eyebrow: string; title: string; description?: string; center?: boolean; dark?: boolean }> = ({ eyebrow, title, description, center, dark }) => (
  <div className={`mb-10 ${center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}`}>
    <p className={`text-sm font-bold uppercase tracking-[0.18em] ${dark ? 'text-red-200' : 'text-marca'}`}>{eyebrow}</p>
    <h2 className={`mt-3 text-3xl font-bold leading-tight md:text-5xl ${dark ? 'text-white' : 'text-tinta'}`}>{title}</h2>
    {description && <p className={`mt-4 text-base leading-7 md:text-lg ${dark ? 'text-stone-300' : 'text-stone-600'}`}>{description}</p>}
  </div>
);

const LandingHeader: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#F7F5F2]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a className="flex items-center gap-3 rounded-lg focus:outline-none focus:ring-4 focus:ring-marca/20" href="#topo">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-marca text-sm font-black text-white shadow-md">CC</span>
          <span><span className="block text-xl font-bold leading-none text-tinta">Check-Ciatos</span><span className="text-xs font-semibold text-stone-500">Produtividade com evidencia</span></span>
        </a>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-stone-600 lg:flex">
          {navLinks.map(([label, href]) => <a key={href} className="rounded hover:text-marca focus:outline-none focus:ring-4 focus:ring-marca/20" href={href}>{label}</a>)}
        </nav>
        <div className="hidden items-center gap-3 lg:flex"><SecondaryButton href="/login">Entrar</SecondaryButton><PrimaryButton href="#planos">Começar agora</PrimaryButton></div>
        <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-stone-300 bg-white text-tinta lg:hidden" onClick={() => setOpen(!open)} aria-label="Abrir menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      {open && <nav className="grid gap-2 border-t border-stone-200 bg-[#F7F5F2] px-4 py-4 text-sm font-semibold text-stone-700 lg:hidden">{navLinks.map(([label, href]) => <a key={href} className="rounded-lg px-3 py-2 hover:bg-white" href={href} onClick={() => setOpen(false)}>{label}</a>)}<a className="rounded-lg px-3 py-2 hover:bg-white" href="/login">Entrar</a><a className="rounded-lg bg-marca px-3 py-3 text-center text-white" href="#planos" onClick={() => setOpen(false)}>Começar agora</a></nav>}
    </header>
  );
};

const DashboardMockup: React.FC = () => (
  <figure className="mx-auto max-w-xl rounded-[24px] border border-stone-200 bg-white p-4 shadow-2xl shadow-stone-900/10 md:p-5" aria-label="Imagem ilustrativa do dashboard Check-Ciatos">
    <div className="flex items-center justify-between border-b border-stone-100 pb-4"><div><p className="text-xs font-bold uppercase tracking-widest text-marca">Dashboard do gestor</p><h3 className="text-xl font-bold text-tinta">Rotina em tempo real</h3></div><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">87% no prazo</span></div>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-[#F7F5F2] p-4"><Gauge className="text-green-700" /><p className="mt-3 text-xs text-stone-500">Progresso do dia</p><p className="mt-1 text-3xl font-black text-tinta">34/42</p></div>
      <div className="rounded-xl bg-red-50 p-4"><Medal className="text-marca" /><p className="mt-3 text-xs text-stone-500">Pontos do mes</p><p className="mt-1 text-3xl font-black text-marca">1.248</p></div>
      <div className="rounded-xl border border-stone-100 p-4"><p className="text-xs text-stone-500">Ranking</p><div className="mt-3 space-y-2 text-sm"><p className="flex justify-between"><span>Ana</span><strong>410 pts</strong></p><p className="flex justify-between"><span>Bruno</span><strong>382 pts</strong></p><p className="flex justify-between"><span>Carla</span><strong>351 pts</strong></p></div></div>
      <div className="rounded-xl border border-stone-100 p-4"><CloudUpload className="text-blue-700" /><p className="mt-3 text-xs text-stone-500">Memoria usada</p><p className="mt-1 text-3xl font-black text-tinta">620 MB</p></div>
    </div>
    <div className="mt-3 rounded-xl bg-[#1C1917] p-4 text-white"><div className="flex items-center justify-between"><span className="text-sm font-bold">Limite de evidencias</span><span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-stone-900">1 GB</span></div><div className="mt-4 h-3 rounded-full bg-white/20"><div className="h-3 w-[62%] rounded-full bg-yellow-300" /></div></div>
  </figure>
);

const HeroSection: React.FC = () => (
  <section id="topo" className="overflow-hidden bg-[#F7F5F2] pt-14 md:pt-20">
    <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 sm:px-6 md:pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-red-900/10 bg-white px-4 py-2 text-sm font-bold text-marca shadow-sm"><Sparkles size={16} /> Contrate, pague no Asaas e comece a usar</div>
        <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.04] text-tinta md:text-6xl">Gestao de tarefas, memoria controlada, pontos e bonificacao.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600 md:text-xl">O Check-Ciatos foi desenhado para o cliente escolher o plano, pagar recorrente no Asaas e começar sozinho. O plano barato nao permite anexos; o plano com documentos tem limite de memoria e pode vender armazenamento extra quando necessario.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><PrimaryButton href="#planos">Escolher plano</PrimaryButton><SecondaryButton href="#manual">Ver manual de uso</SecondaryButton></div>
      </div>
      <DashboardMockup />
    </div>
  </section>
);

const SelfServiceFlow: React.FC = () => (
  <section id="como-funciona" className="bg-white py-20 md:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading center eyebrow="Fluxo self-service" title="Da escolha do plano ao primeiro checklist sem contato manual." description="O site vende, explica e orienta. O cliente entende, paga a recorrencia pelo Asaas e segue o manual para configurar a primeira rotina." /><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">{flowSteps.map(({ title, text, icon: Icon }) => <article key={title} className="rounded-lg border border-stone-200 bg-[#F7F5F2] p-5 shadow-sm"><Icon className="text-marca" size={28} /><h3 className="mt-5 text-xl font-bold text-tinta">{title}</h3><p className="mt-3 leading-7 text-stone-600">{text}</p></article>)}</div></div></section>
);

const VisualGuide: React.FC = () => (
  <section className="bg-[#F7F5F2] py-20 md:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading center eyebrow="Imagens explicativas" title="O cliente ve o processo antes de entrar no app." description="Os quadros abaixo simulam as principais telas e reduzem duvida: criar rotina, executar, auditar, pontuar e controlar memoria." /><div className="grid gap-6 lg:grid-cols-3"><figure className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"><ClipboardCheck className="text-marca" size={30} /><h3 className="mt-4 text-2xl font-bold">Rotina e modelos</h3><p className="mt-3 leading-7 text-stone-600">A empresa transforma processos recorrentes em modelos de tarefas com prazo, responsavel e pontuacao.</p><div className="mt-5 space-y-3">{['Enviar fechamento', 'Conferir documentos', 'Responder cliente'].map((item) => <div key={item} className="rounded-lg bg-[#F7F5F2] p-3 text-sm font-bold">{item}</div>)}</div></figure><figure className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"><FileCheck2 className="text-blue-700" size={30} /><h3 className="mt-4 text-2xl font-bold">Entrega e evidencia</h3><p className="mt-3 leading-7 text-stone-600">No plano com evidencias, o colaborador anexa comprovantes ate atingir o limite contratado.</p><div className="mt-5 rounded-lg border border-dashed border-blue-300 bg-blue-50 p-5 text-center text-sm font-bold text-blue-900">Upload permitido: plano com 1 GB</div></figure><figure className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"><HardDrive className="text-yellow-700" size={30} /><h3 className="mt-4 text-2xl font-bold">Memoria controlada</h3><p className="mt-3 leading-7 text-stone-600">Ao atingir o limite, novos anexos sao bloqueados ate contratar memoria extra ou remover arquivos antigos.</p><div className="mt-5 h-3 rounded-full bg-stone-200"><div className="h-3 w-4/5 rounded-full bg-yellow-500" /></div><p className="mt-3 text-sm font-bold text-stone-600">820 MB de 1 GB usados</p></figure></div></div></section>
);

const ManualSection: React.FC = () => (
  <section id="manual" className="bg-[#1C1917] py-20 text-white md:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading center dark eyebrow="Manual de uso" title="Comece com este passo a passo dentro do proprio site." description="A ideia e o cliente contratar e ja saber o que fazer. Este manual tambem pode ser replicado dentro da area logada depois." /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{manualSteps.map(([title, text], index) => <article key={title} className="rounded-lg border border-white/10 bg-white/5 p-6"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-black text-marca">{index + 1}</span><h3 className="mt-5 text-xl font-bold text-white">{title}</h3><p className="mt-3 leading-7 text-stone-300">{text}</p></article>)}</div></div></section>
);

const FeatureSection: React.FC = () => (
  <section className="bg-white py-20 md:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading center eyebrow="Funcionalidades" title="Tudo que o cliente precisa entender antes de pagar." description="A pagina mostra o que existe no produto e deixa claro que anexos/documentos pertencem ao plano mais completo por causa de storage e banco de dados." /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{features.map((feature) => <div key={feature} className="flex min-h-24 items-start gap-3 rounded-lg border border-stone-200 bg-[#F7F5F2] p-4"><CheckCircle2 className="mt-0.5 shrink-0 text-green-700" size={18} /><span className="text-sm font-semibold leading-6 text-stone-700">{feature}</span></div>)}</div></div></section>
);

const PricingSection: React.FC = () => (
  <section id="planos" className="bg-[#F7F5F2] py-20 md:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading center eyebrow="Planos recorrentes" title="Escolha: sem anexos ou com documentos." description="Dois planos simples de entender. Sem formulario comercial: o cliente clica, paga recorrente no Asaas e comeca a usar." /><div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2">{plans.map((plan) => <article key={plan.name} className={`rounded-lg border p-6 shadow-sm ${plan.featured ? 'border-marca bg-red-50' : 'border-stone-200 bg-white'}`}><h3 className="text-2xl font-bold text-tinta">{plan.name}</h3><p className="mt-3 text-4xl font-black text-marca">{plan.price}</p><p className="mt-4 min-h-24 leading-7 text-stone-600">{plan.description}</p><p className="mt-5 rounded-lg border border-stone-200 bg-white p-3 text-sm font-bold leading-6 text-marca">{plan.note}</p><ul className="mt-6 space-y-3">{plan.items.map((item) => <li key={item} className="flex gap-3 text-stone-700"><CheckCircle2 className="mt-0.5 shrink-0 text-green-700" size={18} />{item}</li>)}</ul><div className="mt-8"><PrimaryButton href={plan.href}>Assinar no Asaas</PrimaryButton></div></article>)}</div><p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-6 text-stone-600">Os botoes usam <strong>VITE_ASAAS_CONTROLE_URL</strong> e <strong>VITE_ASAAS_EVIDENCIAS_URL</strong>. Com os links reais, o cliente vai direto para a assinatura recorrente.</p></div></section>
);

const MemorySection: React.FC = () => (
  <section id="memoria" className="bg-white py-20 md:py-28"><div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8"><SectionHeading eyebrow="Controle de memoria" title="Armazenamento limitado para proteger sua margem." description="O plano com documentos inclui 1 GB. Se a empresa consumir tudo, o sistema deve bloquear novos uploads e oferecer memoria extra recorrente pelo Asaas." /><div className="rounded-lg border border-stone-200 bg-[#F7F5F2] p-6 shadow-sm"><HardDrive className="text-marca" size={30} /><h3 className="mt-4 text-2xl font-bold text-tinta">Memoria extra</h3><p className="mt-4 leading-7 text-stone-600">Sugestao comercial: vender pacotes adicionais recorrentes de 1 GB. O cliente paga pelo Asaas e o webhook aumenta a quota da empresa automaticamente.</p><p className="mt-5 text-3xl font-black text-marca">+1 GB sob contratação</p><div className="mt-6"><PrimaryButton href={ASAAS_MEMORIA_EXTRA_URL}>Comprar memoria extra</PrimaryButton></div></div></div></section>
);

const DashboardPreview: React.FC = () => (
  <section className="bg-[#F7F5F2] py-20 md:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading center eyebrow="Indicadores" title="A decisao de bonificar deixa de ser subjetiva." /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[{ title: 'Produtividade', value: '87%', icon: BarChart3 }, { title: 'Pendentes', value: '12', icon: ClipboardCheck }, { title: 'Concluidas', value: '34', icon: CheckCircle2 }, { title: 'Sucesso', value: '91%', icon: Gauge }, { title: 'Destaques', value: '5', icon: Star }, { title: 'Pontos', value: '+248', icon: Medal }, { title: 'A aprovar', value: '7', icon: UserCheck }, { title: 'Empresas', value: '3', icon: Award }].map(({ title, value, icon: Icon }) => <div key={title} className="rounded-lg border border-stone-200 bg-white p-5"><Icon className="text-marca" size={24} /><p className="mt-5 text-sm font-semibold text-stone-500">{title}</p><p className="mt-2 text-3xl font-black text-tinta">{value}</p></div>)}</div></div></section>
);

const SecuritySection: React.FC = () => (
  <section className="bg-white py-20 md:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading center eyebrow="Seguranca" title="Controle empresarial desde o primeiro acesso." /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[{ title: 'Perfis de usuario', icon: Users2 }, { title: 'Dados isolados', icon: ShieldCheck }, { title: 'Supabase Auth', icon: LockKeyhole }, { title: 'Storage privado', icon: FileCheck2 }].map(({ title, icon: Icon }) => <div key={title} className="rounded-lg bg-[#F7F5F2] p-5 shadow-sm"><Icon className="text-marca" size={25} /><p className="mt-4 font-bold text-tinta">{title}</p></div>)}</div></div></section>
);

const FAQSection: React.FC = () => (
  <section id="faq" className="bg-[#F7F5F2] py-20 md:py-28"><div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"><SectionHeading center eyebrow="FAQ" title="Perguntas frequentes." /><div className="space-y-4">{faqs.map(([question, answer]) => <details key={question} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"><summary className="cursor-pointer list-none text-lg font-bold text-tinta focus:outline-none focus:ring-4 focus:ring-marca/20">{question}</summary><p className="mt-4 leading-7 text-stone-600">{answer}</p></details>)}</div></div></section>
);

const CTASection: React.FC = () => (
  <section className="bg-[#1C1917] py-20 text-white md:py-28"><div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8"><p className="text-sm font-bold uppercase tracking-[0.18em] text-red-200">Comece sozinho</p><h2 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">Escolha o plano e assine no Asaas.</h2><p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-stone-300">O site explica o produto, compara os planos e orienta o primeiro uso. Nao ha formulario para tratar contratacao manualmente.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><PrimaryButton href="#planos">Ver planos</PrimaryButton><SecondaryButton href="/login">Entrar no sistema</SecondaryButton></div></div></section>
);

const LandingFooter: React.FC = () => <footer className="bg-[#F7F5F2] py-10"><div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8"><div><h2 className="text-2xl font-bold text-tinta">Check-Ciatos</h2><p className="mt-3 max-w-md leading-7 text-stone-600">Gestao de produtividade, tarefas, evidencias e bonificacao por performance.</p><p className="mt-6 text-sm text-stone-500">© 2026 Check-Ciatos. Grupo Ciatos.</p></div><div><h3 className="font-bold text-tinta">Links</h3><div className="mt-3 grid gap-2 text-sm font-semibold text-stone-600"><a href="#manual">Manual</a><a href="#planos">Planos</a><a href="#memoria">Memoria</a><a href="/login">Entrar</a></div></div><div><h3 className="font-bold text-tinta">Pagamento</h3><p className="mt-3 text-sm leading-6 text-stone-600">Contratacao automatizada por assinatura recorrente no Asaas.</p></div></div></footer>;

const LandingPage: React.FC = () => (
  <main className="min-h-screen scroll-smooth bg-[#F7F5F2] font-corpo text-tinta [&_li]:text-justify [&_p]:text-justify">
    <LandingHeader />
    <HeroSection />
    <SelfServiceFlow />
    <VisualGuide />
    <ManualSection />
    <FeatureSection />
    <PricingSection />
    <MemorySection />
    <DashboardPreview />
    <SecuritySection />
    <FAQSection />
    <CTASection />
    <LandingFooter />
  </main>
);

export default LandingPage;
