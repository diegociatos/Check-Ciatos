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

const WHATSAPP_NUMBER = '5531999999999'; // Substitua pelo numero comercial real.
const ASAAS_CONTROLE_URL = import.meta.env.VITE_ASAAS_CONTROLE_URL || '#planos';
const ASAAS_EVIDENCIAS_URL = import.meta.env.VITE_ASAAS_EVIDENCIAS_URL || '#planos';

const navLinks = [
  ['Como funciona', '#como-funciona'],
  ['Manual', '#manual'],
  ['Planos', '#planos'],
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
    text: 'A empresa escolhe entre operar sem anexos, pagando menos, ou usar evidencias com documentos e comprovantes nas tarefas.',
    icon: CreditCard,
  },
  {
    title: '2. Pague recorrente no Asaas',
    text: 'O botao do plano leva para a assinatura recorrente. A cobrança fica automatizada, sem depender de contato manual para renovar.',
    icon: ShieldCheck,
  },
  {
    title: '3. Acesse o sistema',
    text: 'Depois da assinatura, o cliente acessa a area interna, cadastra empresa, equipe, gestores e colaboradores.',
    icon: Users2,
  },
  {
    title: '4. Comece a usar',
    text: 'Crie tarefas, acompanhe entregas, aprove o que foi feito e use pontos, ranking e relatorios para reconhecer performance.',
    icon: PlayCircle,
  },
];

const manualSteps = [
  ['Criar empresa', 'Cadastre os dados da empresa, defina o responsavel principal e confirme se o plano contratado permite anexos.'],
  ['Cadastrar equipe', 'Inclua gestores e colaboradores. Cada pessoa acessa apenas o que faz sentido para o seu papel.'],
  ['Montar modelos', 'Crie tarefas recorrentes para rotinas diarias, semanais, mensais ou por data especifica.'],
  ['Executar tarefas', 'O colaborador visualiza sua lista, inicia a execucao, envia a entrega e anexa comprovantes se o plano permitir.'],
  ['Auditar entregas', 'O gestor confere evidencias, aprova, reprova ou solicita ajuste. Tudo fica registrado no historico.'],
  ['Acompanhar pontos', 'Use dashboard, ranking, extrato e relatorios para apoiar reconhecimento e bonificacao interna.'],
];

const plans = [
  {
    name: 'Plano Controle',
    price: 'R$ 297/mês',
    description: 'Mais barato, para empresas que querem organizar tarefas, cobrar entregas e pontuar colaboradores sem armazenar documentos.',
    note: 'Sem anexos: menor custo porque nao usa storage de evidencias.',
    href: ASAAS_CONTROLE_URL,
    items: ['Tarefas e modelos recorrentes', 'Aprovacao de entregas', 'Pontuacao e ranking', 'Dashboard e relatorios', 'Exportacao CSV', 'Sem upload de documentos'],
  },
  {
    name: 'Plano Evidencias',
    price: 'R$ 497/mês',
    description: 'Mais completo, para empresas que precisam anexar documentos, comprovantes, prints, recibos e evidencias nas entregas.',
    note: 'Com anexos: maior custo por banco de dados, storage privado e volume de arquivos.',
    href: ASAAS_EVIDENCIAS_URL,
    featured: true,
    items: ['Tudo do Plano Controle', 'Upload de documentos', 'Comprovantes por tarefa', 'Storage privado', 'Auditoria com evidencias', 'Historico documentado'],
  },
];

const faqs = [
  ['Preciso falar com alguem para contratar?', 'A proposta e nao depender de atendimento manual: o cliente escolhe o plano, paga a assinatura recorrente pelo Asaas e segue o manual do site para começar. A automacao completa exige configurar os links de assinatura e o webhook de provisionamento.'],
  ['Qual plano devo escolher?', 'Escolha o Plano Controle se sua empresa nao precisa anexar arquivos. Escolha o Plano Evidencias se precisa guardar comprovantes, documentos e evidencias nas tarefas.'],
  ['Por que o plano com anexos custa mais?', 'Porque documentos e comprovantes consomem storage privado, banco de dados, trafego e rotinas de seguranca. Esse custo operacional precisa estar refletido no plano.'],
  ['O sistema calcula folha de pagamento?', 'Nao. O Check-Ciatos fornece indicadores de produtividade e pontuacao para apoiar a gestao interna. A politica de pagamento ou bonificacao deve ser definida pela empresa com sua assessoria contabil/juridica.'],
];

function whatsappUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

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
      <div className="rounded-xl border border-stone-100 p-4"><CloudUpload className="text-blue-700" /><p className="mt-3 text-xs text-stone-500">Evidencias</p><p className="mt-1 text-3xl font-black text-tinta">18</p></div>
    </div>
    <div className="mt-3 rounded-xl bg-[#1C1917] p-4 text-white"><div className="flex items-center justify-between"><span className="text-sm font-bold">Pronto para reconhecer performance</span><span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-stone-900">BONUS</span></div><div className="mt-4 flex h-24 items-end gap-2" aria-hidden="true">{[45, 62, 58, 76, 70, 88, 82].map((height, index) => <span key={index} className="flex-1 rounded-t-md bg-white/80" style={{ height: `${height}%` }} />)}</div></div>
  </figure>
);

const HeroSection: React.FC = () => (
  <section id="topo" className="overflow-hidden bg-[#F7F5F2] pt-14 md:pt-20">
    <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 sm:px-6 md:pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-red-900/10 bg-white px-4 py-2 text-sm font-bold text-marca shadow-sm"><Sparkles size={16} /> Contrate, pague no Asaas e comece a usar</div>
        <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.04] text-tinta md:text-6xl">Gestao de tarefas, evidencias, pontos e bonificacao em um fluxo simples.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600 md:text-xl">O Check-Ciatos foi desenhado para o cliente entender sozinho, escolher o plano, pagar a assinatura recorrente e seguir um manual de uso direto no site, sem depender de apresentacao ou atendimento manual para começar.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><PrimaryButton href="#planos">Escolher plano</PrimaryButton><SecondaryButton href="#manual">Ver manual de uso</SecondaryButton></div>
      </div>
      <DashboardMockup />
    </div>
  </section>
);

const SelfServiceFlow: React.FC = () => (
  <section id="como-funciona" className="bg-white py-20 md:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading center eyebrow="Fluxo self-service" title="Da escolha do plano ao primeiro checklist sem depender de voce." description="O site precisa vender, explicar e orientar. O cliente entende o produto, paga a recorrencia pelo Asaas e segue o manual para configurar a primeira rotina." /><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">{flowSteps.map(({ title, text, icon: Icon }) => <article key={title} className="rounded-lg border border-stone-200 bg-[#F7F5F2] p-5 shadow-sm"><Icon className="text-marca" size={28} /><h3 className="mt-5 text-xl font-bold text-tinta">{title}</h3><p className="mt-3 leading-7 text-stone-600">{text}</p></article>)}</div></div></section>
);

const VisualGuide: React.FC = () => (
  <section className="bg-[#F7F5F2] py-20 md:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading center eyebrow="Imagens explicativas" title="O cliente ve o processo antes de entrar no app." description="Os quadros abaixo simulam as principais telas e reduzem duvida: criar rotina, executar, auditar, pontuar e acompanhar indicadores." /><div className="grid gap-6 lg:grid-cols-3"><figure className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"><ClipboardCheck className="text-marca" size={30} /><h3 className="mt-4 text-2xl font-bold">Rotina e modelos</h3><p className="mt-3 leading-7 text-stone-600">A empresa transforma processos recorrentes em modelos de tarefas com prazo, responsavel e pontuacao.</p><div className="mt-5 space-y-3">{['Enviar fechamento', 'Conferir documentos', 'Responder cliente'].map((item) => <div key={item} className="rounded-lg bg-[#F7F5F2] p-3 text-sm font-bold">{item}</div>)}</div></figure><figure className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"><FileCheck2 className="text-blue-700" size={30} /><h3 className="mt-4 text-2xl font-bold">Entrega e evidencia</h3><p className="mt-3 leading-7 text-stone-600">No plano com evidencias, o colaborador anexa comprovantes e o gestor audita com contexto.</p><div className="mt-5 rounded-lg border border-dashed border-blue-300 bg-blue-50 p-5 text-center text-sm font-bold text-blue-900">Arraste comprovantes aqui</div></figure><figure className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"><Trophy className="text-yellow-600" size={30} /><h3 className="mt-4 text-2xl font-bold">Pontos e bonus</h3><p className="mt-3 leading-7 text-stone-600">Aprovacoes, atrasos e retrabalho alimentam ranking, extrato e indicadores para reconhecimento.</p><div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm font-bold"><span className="rounded-lg bg-green-50 p-3 text-green-800">+50</span><span className="rounded-lg bg-red-50 p-3 text-red-800">-10</span><span className="rounded-lg bg-yellow-50 p-3 text-yellow-800">Bonus</span></div></figure></div></div></section>
);

const ManualSection: React.FC = () => (
  <section id="manual" className="bg-[#1C1917] py-20 text-white md:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading center dark eyebrow="Manual de uso" title="Comece com este passo a passo dentro do proprio site." description="A ideia e o cliente contratar e ja saber o que fazer. Este manual tambem pode ser replicado dentro da area logada depois." /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{manualSteps.map(([title, text], index) => <article key={title} className="rounded-lg border border-white/10 bg-white/5 p-6"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-black text-marca">{index + 1}</span><h3 className="mt-5 text-xl font-bold text-white">{title}</h3><p className="mt-3 leading-7 text-stone-300">{text}</p></article>)}</div></div></section>
);

const FeatureSection: React.FC = () => (
  <section className="bg-white py-20 md:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading center eyebrow="Funcionalidades" title="Tudo que o cliente precisa entender antes de pagar." description="A pagina mostra o que existe no produto e deixa claro que anexos/documentos pertencem ao plano mais completo por causa de storage e banco de dados." /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{features.map((feature) => <div key={feature} className="flex min-h-24 items-start gap-3 rounded-lg border border-stone-200 bg-[#F7F5F2] p-4"><CheckCircle2 className="mt-0.5 shrink-0 text-green-700" size={18} /><span className="text-sm font-semibold leading-6 text-stone-700">{feature}</span></div>)}</div></div></section>
);

const PricingSection: React.FC = () => (
  <section id="planos" className="bg-[#F7F5F2] py-20 md:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading center eyebrow="Planos recorrentes" title="Escolha: sem anexos ou com documentos." description="Dois planos simples de entender. O pagamento deve ser recorrente pelo Asaas; depois disso o cliente segue o manual e começa a usar." /><div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2">{plans.map((plan) => <article key={plan.name} className={`rounded-lg border p-6 shadow-sm ${plan.featured ? 'border-marca bg-red-50' : 'border-stone-200 bg-white'}`}><h3 className="text-2xl font-bold text-tinta">{plan.name}</h3><p className="mt-3 text-4xl font-black text-marca">{plan.price}</p><p className="mt-4 min-h-24 leading-7 text-stone-600">{plan.description}</p><p className="mt-5 rounded-lg border border-stone-200 bg-white p-3 text-sm font-bold leading-6 text-marca">{plan.note}</p><ul className="mt-6 space-y-3">{plan.items.map((item) => <li key={item} className="flex gap-3 text-stone-700"><CheckCircle2 className="mt-0.5 shrink-0 text-green-700" size={18} />{item}</li>)}</ul><div className="mt-8"><PrimaryButton href={plan.href}>Pagar recorrente no Asaas</PrimaryButton></div></article>)}</div><p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-6 text-stone-600">Os botoes usam as variaveis <strong>VITE_ASAAS_CONTROLE_URL</strong> e <strong>VITE_ASAAS_EVIDENCIAS_URL</strong>. Quando os links reais do Asaas forem configurados, o cliente sai do site direto para a assinatura recorrente.</p></div></section>
);

const DashboardPreview: React.FC = () => (
  <section className="bg-white py-20 md:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading center eyebrow="Indicadores" title="A decisao de bonificar deixa de ser subjetiva." /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[{ title: 'Produtividade', value: '87%', icon: BarChart3 }, { title: 'Pendentes', value: '12', icon: ClipboardCheck }, { title: 'Concluidas', value: '34', icon: CheckCircle2 }, { title: 'Sucesso', value: '91%', icon: Gauge }, { title: 'Destaques', value: '5', icon: Star }, { title: 'Pontos', value: '+248', icon: Medal }, { title: 'A aprovar', value: '7', icon: UserCheck }, { title: 'Empresas', value: '3', icon: Award }].map(({ title, value, icon: Icon }) => <div key={title} className="rounded-lg border border-stone-200 bg-[#F7F5F2] p-5"><Icon className="text-marca" size={24} /><p className="mt-5 text-sm font-semibold text-stone-500">{title}</p><p className="mt-2 text-3xl font-black text-tinta">{value}</p></div>)}</div></div></section>
);

const SecuritySection: React.FC = () => (
  <section className="bg-[#F7F5F2] py-20 md:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading center eyebrow="Seguranca" title="Controle empresarial desde o primeiro acesso." /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[{ title: 'Perfis de usuario', icon: Users2 }, { title: 'Dados isolados', icon: ShieldCheck }, { title: 'Supabase Auth', icon: LockKeyhole }, { title: 'Storage privado', icon: FileCheck2 }].map(({ title, icon: Icon }) => <div key={title} className="rounded-lg bg-white p-5 shadow-sm"><Icon className="text-marca" size={25} /><p className="mt-4 font-bold text-tinta">{title}</p></div>)}</div></div></section>
);

const FAQSection: React.FC = () => (
  <section id="faq" className="bg-white py-20 md:py-28"><div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"><SectionHeading center eyebrow="FAQ" title="Perguntas frequentes." /><div className="space-y-4">{faqs.map(([question, answer]) => <details key={question} className="rounded-lg border border-stone-200 bg-[#F7F5F2] p-5 shadow-sm"><summary className="cursor-pointer list-none text-lg font-bold text-tinta focus:outline-none focus:ring-4 focus:ring-marca/20">{question}</summary><p className="mt-4 leading-7 text-stone-600">{answer}</p></details>)}</div></div></section>
);

const CTASection: React.FC = () => (
  <section className="bg-[#1C1917] py-20 text-white md:py-28"><div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-red-200">Comece sozinho</p><h2 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">Escolha o plano, pague no Asaas e siga o manual.</h2><p className="mt-5 text-lg leading-8 text-stone-300">O objetivo comercial e reduzir atrito: nada de depender de apresentacao. A pagina explica o produto, compara os planos e orienta o primeiro uso.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><PrimaryButton href="#planos">Ver planos</PrimaryButton><SecondaryButton href="/login">Entrar no sistema</SecondaryButton></div></div><div className="rounded-lg bg-white p-6 text-tinta shadow-2xl"><h3 className="text-2xl font-bold">Automacao recomendada</h3><p className="mt-4 leading-7 text-stone-600">Para ficar 100% independente, configure no backend um webhook do Asaas: pagamento confirmado cria empresa, usuario master, plano contratado e envia e-mail de primeiro acesso. O site ja esta preparado para receber os links recorrentes do Asaas.</p><a className="mt-6 inline-flex font-bold text-marca" href={whatsappUrl('Quero configurar o fluxo automatico do Asaas para o Check-Ciatos.')} target="_blank" rel="noreferrer">Falar sobre automacao</a></div></div></section>
);

const LandingFooter: React.FC = () => <footer className="bg-[#F7F5F2] py-10"><div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8"><div><h2 className="text-2xl font-bold text-tinta">Check-Ciatos</h2><p className="mt-3 max-w-md leading-7 text-stone-600">Gestao de produtividade, tarefas, evidencias e bonificacao por performance.</p><p className="mt-6 text-sm text-stone-500">© 2026 Check-Ciatos. Grupo Ciatos.</p></div><div><h3 className="font-bold text-tinta">Links</h3><div className="mt-3 grid gap-2 text-sm font-semibold text-stone-600"><a href="#manual">Manual</a><a href="#planos">Planos</a><a href="#faq">FAQ</a><a href="/login">Entrar</a></div></div><div><h3 className="font-bold text-tinta">Contato</h3><p className="mt-3 text-sm leading-6 text-stone-600">Use o WhatsApp apenas para duvidas comerciais ou implantacao avancada.</p><a className="mt-4 inline-flex font-bold text-marca" href={whatsappUrl('Tenho uma duvida sobre o Check-Ciatos.')} target="_blank" rel="noreferrer">Falar no WhatsApp</a></div></div></footer>;

const LandingPage: React.FC = () => (
  <main className="min-h-screen scroll-smooth bg-[#F7F5F2] font-corpo text-tinta [&_li]:text-justify [&_p]:text-justify">
    <LandingHeader />
    <HeroSection />
    <SelfServiceFlow />
    <VisualGuide />
    <ManualSection />
    <FeatureSection />
    <PricingSection />
    <DashboardPreview />
    <SecuritySection />
    <FAQSection />
    <CTASection />
    <LandingFooter />
  </main>
);

export default LandingPage;
