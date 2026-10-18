import VelltoPricing from "./components/VelltoPricing";

const features = [
  { icon: "▦", title: "Agenda inteligente", text: "Organize horários, profissionais e atendimentos em uma visão simples e rápida." },
  { icon: "♙", title: "Gestão de clientes", text: "Centralize informações e acompanhe o histórico de cada cliente." },
  { icon: "✂", title: "Serviços e equipe", text: "Cadastre serviços, preços, duração e profissionais do seu negócio." },
  { icon: "◇", title: "Planos e mensalistas", text: "Acompanhe serviços utilizados, vencimentos e planos dos clientes." },
  { icon: "↗", title: "Seu link de agendamento", text: "Compartilhe uma página personalizada para receber reservas online." },
  { icon: "◉", title: "Controle financeiro", text: "Visualize resultados, receitas, despesas e relatórios da operação." },
];

const faqs = [
  ["A Vellto funciona pelo celular?", "Sim. Você acessa pelo navegador no celular, tablet ou computador."],
  ["Meus clientes conseguem agendar sozinhos?", "Sim. Sua página pública permite escolher serviço, profissional, data e horário disponível."],
  ["Posso cadastrar vários profissionais?", "Sim. A quantidade de profissionais depende dos limites do plano contratado."],
  ["Consigo acompanhar clientes mensalistas?", "Sim. Você acompanha os planos, as utilizações e o histórico de atendimentos."],
  ["Preciso instalar algum programa?", "Não. A Vellto funciona online, diretamente pelo navegador."],
];

function Logo({ dark = false }: { dark?: boolean }) {
  return <img src={dark ? "/vellto-logo-dark.png" : "/vellto-logo-light.png"}
    alt="Vellto — Agenda & Gestão" className="h-11 w-auto max-w-[190px] object-contain sm:h-12" />;
}

function Arrow() { return <span aria-hidden="true">↗</span>; }

function Heading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return <div className="mx-auto max-w-3xl text-center">
    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#008c6b]">{eyebrow}</p>
    <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.045em] text-[#141c1a] sm:text-5xl">{title}</h2>
    {text && <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#5d6b67] sm:text-lg">{text}</p>}
  </div>;
}

function Preview() {
  const slots = [
    { time: "09:00", name: "Mariana Costa", service: "Corte feminino", status: "Confirmado" },
    { time: "10:30", name: "Lucas Oliveira", service: "Corte + barba", status: "Em atendimento" },
    { time: "13:00", name: "Ana Souza", service: "Manicure", status: "Confirmado" },
  ];
  return <div className="relative mx-auto max-w-5xl rounded-[28px] border border-[#dce8e3] bg-white p-2 shadow-[0_35px_100px_-45px_rgba(9,58,43,0.35)] sm:p-3">
    <div className="overflow-hidden rounded-[20px] border border-[#e5ece8] bg-[#f7faf9]">
      <div className="flex h-11 items-center justify-between border-b border-[#e5ece8] bg-white px-4">
        <div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#e7ece9]"/><span className="h-2.5 w-2.5 rounded-full bg-[#e7ece9]"/><span className="h-2.5 w-2.5 rounded-full bg-[#00c896]"/></div>
        <span className="rounded-md bg-[#f5f7f6] px-4 py-1 text-[10px] text-[#89958f]">Painel Vellto · visual ilustrativo</span>
        <div className="w-10"/>
      </div>
      <div className="grid min-h-[300px] md:grid-cols-[190px_1fr]">
        <aside className="hidden border-r border-[#e7eeea] bg-white p-5 md:block">
          <p className="text-lg font-black tracking-tight text-[#141c1a]">Vellto<span className="text-[#00b887]">.</span></p>
          <div className="mt-8 space-y-2 text-xs font-semibold">
            <div className="rounded-xl bg-[#e4f9f1] px-3 py-3 text-[#008c6b]">▦ &nbsp; Agenda</div>
            <div className="rounded-xl px-3 py-3 text-[#81918a]">♙ &nbsp; Clientes</div>
            <div className="rounded-xl px-3 py-3 text-[#81918a]">◉ &nbsp; Financeiro</div>
            <div className="rounded-xl px-3 py-3 text-[#81918a]">↗ &nbsp; Meu link</div>
          </div>
        </aside>
        <div className="p-4 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-semibold text-[#00a47c]">Visão do negócio</p><h3 className="mt-1 text-xl font-black text-[#1c2823] sm:text-2xl">Sua agenda, sob controle.</h3></div>
            <span className="rounded-xl bg-[#00c896] px-3 py-2 text-xs font-bold text-[#073b2d]">+ Novo agendamento</span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            {[["Agendamentos", "18"], ["Confirmados", "12"], ["Profissionais", "04"]].map(([label, value]) =>
              <div key={label} className="rounded-xl border border-[#e5ede9] bg-white p-3 sm:p-4"><p className="text-[10px] text-[#809088] sm:text-xs">{label}</p><p className="mt-2 text-xl font-black text-[#1c2823] sm:text-2xl">{value}</p></div>)}
          </div>
          <div className="mt-5 rounded-2xl border border-[#e5ede9] bg-white p-3 sm:p-5">
            <div className="mb-4 flex items-center justify-between"><p className="text-sm font-bold text-[#1c2823]">Próximos atendimentos</p><span className="text-xs font-semibold text-[#009a74]">Ver agenda →</span></div>
            <div className="space-y-2">{slots.map((slot) => <div key={slot.time} className="flex items-center gap-3 rounded-xl bg-[#f7faf9] px-3 py-3">
              <span className="rounded-lg bg-[#e1f8ef] px-2 py-1 text-xs font-extrabold text-[#008c6b]">{slot.time}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#25342d] sm:text-sm">{slot.name}</p><p className="text-[11px] text-[#84928b]">{slot.service}</p></div>
              <span className="hidden rounded-full bg-[#e8f6ee] px-2 py-1 text-[10px] font-bold text-[#24815b] sm:block">{slot.status}</span>
            </div>)}</div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}

export default function Home() {
  return <main className="min-h-screen overflow-x-hidden bg-white text-[#17231e]">
    <header className="sticky top-0 z-50 border-b border-[#e8eeea] bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="/" aria-label="Vellto — início"><Logo /></a>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#53615a] lg:flex">
          <a className="transition hover:text-[#008f6d]" href="#recursos">Recursos</a>
          <a className="transition hover:text-[#008f6d]" href="#como-funciona">Como funciona</a>
          <a className="transition hover:text-[#008f6d]" href="#planos">Planos</a>
          <a className="transition hover:text-[#008f6d]" href="#faq">Dúvidas</a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <a href="/login" className="rounded-xl px-3 py-3 text-sm font-bold text-[#34453c] transition hover:bg-[#f2f7f4] sm:px-5">Entrar</a>
          <a href="#planos" className="rounded-xl bg-[#00c896] px-3 py-3 text-sm font-extrabold text-[#073b2d] transition hover:bg-[#00b888] sm:px-5">Conhecer planos <span className="hidden sm:inline">↗</span></a>
        </div>
      </div>
    </header>

    <section className="relative overflow-hidden bg-gradient-to-b from-[#f1fcf7] via-white to-white px-4 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28 lg:px-8">
      <div className="pointer-events-none absolute -right-48 top-0 h-[420px] w-[420px] rounded-full bg-[#00c896]/10 blur-[110px]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#bcebd8] bg-white px-4 py-2 text-xs font-bold text-[#008b68] shadow-sm sm:text-sm"><span className="h-2 w-2 rounded-full bg-[#00c896]" /> Agenda & gestão para o seu negócio</span>
          <h1 className="mt-8 text-balance text-4xl font-black leading-[1.12] tracking-[-0.055em] text-[#14221b] sm:text-6xl lg:text-[72px]">Mais organização para você. <span className="text-[#00a97d]">Mais praticidade para seus clientes.</span></h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-[#64736b] sm:text-xl">Agendamentos, clientes, profissionais e controle financeiro em um só lugar. Uma gestão mais simples, do primeiro agendamento ao fim do dia.</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#planos" className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#00c896] px-7 font-extrabold text-[#073b2d] shadow-[0_12px_28px_-12px_rgba(0,184,136,0.5)] transition hover:-translate-y-0.5 hover:bg-[#00b888] sm:w-auto">Conhecer os planos <Arrow /></a>
            <a href="#recursos" className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl border border-[#d7e5dd] bg-white px-7 font-bold text-[#26372d] transition hover:border-[#00b888] sm:w-auto">Explorar recursos</a>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-[#74847a] sm:text-sm"><span>✓ Acesso online</span><span>✓ Funciona no celular</span><span>✓ Agendamentos em um só lugar</span></div>
        </div>
        <div className="relative mt-16 sm:mt-20"><Preview /></div>
      </div>
    </section>

    <section className="border-y border-[#e9f0eb] bg-[#f7faf8] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl text-center"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#819087]">Feita para quem trabalha com atendimento</p>
        <div className="mt-6 flex flex-wrap justify-center gap-x-9 gap-y-4 text-sm font-bold text-[#43544a] sm:text-base"><span>Barbearias</span><span>Salões de beleza</span><span>Manicures</span><span>Clínicas</span><span>Estúdios</span><span>Outros serviços</span></div>
      </div>
    </section>

    <section id="recursos" className="scroll-mt-24 px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl"><Heading eyebrow="Tudo conectado" title="Uma plataforma. Mais controle para o seu negócio." text="Da agenda ao financeiro, tenha uma visão organizada da rotina sem depender de planilhas e mensagens espalhadas." />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{features.map((feature) => <article key={feature.title} className="rounded-[24px] border border-[#e2ebe5] bg-white p-7 shadow-[0_12px_36px_-26px_rgba(20,70,49,0.2)] transition hover:-translate-y-1 hover:border-[#a6e6cb]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f9f0] text-2xl font-black text-[#00946e]">{feature.icon}</div>
          <h3 className="mt-6 text-xl font-extrabold text-[#1c2a21]">{feature.title}</h3><p className="mt-3 text-sm leading-7 text-[#65736b]">{feature.text}</p>
        </article>)}</div>
      </div>
    </section>

    <section id="como-funciona" className="scroll-mt-24 bg-[#f6faf8] px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl"><Heading eyebrow="Simples do início ao fim" title="Seu negócio organizado em três passos." text="Você configura sua empresa, compartilha seu link e acompanha os atendimentos em um painel completo." />
        <div className="mt-14 grid gap-5 md:grid-cols-3">{[
          ["01", "Configure sua empresa", "Cadastre serviços, profissionais, horários e personalize sua página."],
          ["02", "Compartilhe seu link", "Seus clientes escolhem o serviço e reservam um horário disponível."],
          ["03", "Acompanhe a operação", "Gerencie agendamentos, clientes e resultados em um só painel."],
        ].map(([number, title, text]) => <div key={number} className="rounded-[26px] border border-[#e3ece6] bg-white p-8">
          <span className="text-4xl font-black tracking-tight text-[#00b78a]">{number}</span><h3 className="mt-5 text-xl font-extrabold text-[#192820]">{title}</h3><p className="mt-3 text-sm leading-7 text-[#64746a]">{text}</p>
        </div>)}</div>
      </div>
    </section>

    <section className="px-4 py-24 sm:px-6 sm:py-28 lg:px-8"><div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#009a74]">Sua presença online</p><h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.045em] text-[#15241b] sm:text-5xl">Uma página profissional com a cara do seu negócio.</h2><p className="mt-6 text-base leading-8 text-[#64736b]">Mostre seus serviços, apresente sua equipe e ofereça aos clientes uma maneira prática de agendar. Cada estabelecimento tem seu próprio link e identidade visual.</p>
      <div className="mt-8 grid grid-cols-2 gap-3 text-sm font-semibold text-[#405247]"><span>✓ Logo e capa</span><span>✓ Serviços e preços</span><span>✓ Profissionais</span><span>✓ Link e QR Code</span><span>✓ Agendamento online</span><span>✓ Área do cliente</span></div></div>
      <div className="rounded-[30px] border border-[#dcebe2] bg-[#eaf8f1] p-5 sm:p-9"><div className="overflow-hidden rounded-[22px] border border-[#dce9e0] bg-white shadow-xl shadow-[#1b6240]/10">
        <div className="h-32 bg-gradient-to-r from-[#173c30] via-[#12654d] to-[#00bc8c] sm:h-44" />
        <div className="p-6"><div className="-mt-12 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-[#dff6e9] text-2xl font-black text-[#007f5e]">B</div><h3 className="mt-3 text-xl font-black text-[#192a20]">Seu negócio aqui</h3><p className="mt-1 text-sm text-[#72847a]">Sua marca, seus serviços, sua agenda.</p>
          <div className="mt-5 space-y-2">{[["Serviço personalizado", "45 min"],["Atendimento especial", "60 min"]].map(([service, duration]) => <div key={service} className="flex justify-between rounded-xl border border-[#e6eee8] p-3 text-xs font-semibold text-[#35463a]"><span>{service}</span><span className="text-[#89968d]">{duration}</span></div>)}</div>
          <div className="mt-5 rounded-xl bg-[#00c896] px-4 py-3 text-center text-sm font-extrabold text-[#06432e]">Agendar horário</div>
        </div></div><p className="mt-4 text-center text-xs text-[#6a8878]">Exemplo ilustrativo de página pública</p></div>
    </div></section>

    <section id="planos" className="scroll-mt-24 bg-[#f6faf8] px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Heading eyebrow="Planos" title="Escolha como prefere investir no seu negócio." text="Pague menos no Pix ou parcele no cartão. Você escolhe o período e decide sobre a renovação." />
        <VelltoPricing />
      </div>
    </section>

    <section id="faq" className="scroll-mt-24 px-4 py-24 sm:px-6 sm:py-28 lg:px-8"><div className="mx-auto max-w-4xl"><Heading eyebrow="Dúvidas frequentes" title="Tudo o que você precisa saber." />
      <div className="mt-12 space-y-3">{faqs.map(([question, answer]) => <details key={question} className="group rounded-2xl border border-[#e1eae4] bg-white p-5 transition open:border-[#a5e6cb] sm:p-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-[#24362a]">{question}<span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#eef8f1] text-xl text-[#009a74] transition group-open:rotate-45">+</span></summary><p className="mt-4 max-w-2xl text-sm leading-7 text-[#65756a]">{answer}</p></details>)}</div>
    </div></section>

    <section id="contato" className="px-4 pb-24 sm:px-6 sm:pb-28 lg:px-8"><div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-[#12382c] p-8 text-white sm:p-12 lg:p-16"><div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#00c896]/20 blur-[90px]" />
      <div className="relative max-w-3xl"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#64e9bc]">Vellto Agenda & Gestão</p><h2 className="mt-5 text-balance text-3xl font-black tracking-tight sm:text-5xl">Seu negócio merece uma gestão mais simples.</h2><p className="mt-5 max-w-xl text-base leading-8 text-[#c0d8cb]">Conheça os planos e descubra como organizar sua agenda e atender melhor seus clientes.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#planos" className="inline-flex min-h-13 items-center justify-center rounded-xl bg-[#00c896] px-7 py-4 font-extrabold text-[#073b2d]">Ver planos ↗</a><a href="/login" className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/25 px-7 py-4 font-bold text-white">Já sou cliente</a></div></div>
    </div></section>

    <footer className="border-t border-[#e5ede7] bg-[#f8faf8] px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-9 md:grid-cols-3"><div><Logo /><p className="mt-4 max-w-sm text-sm leading-7 text-[#697a70]">Tecnologia para organizar atendimentos e profissionalizar a gestão do seu negócio.</p></div>
      <div><p className="text-sm font-black text-[#223328]">Produto</p><div className="mt-4 space-y-3 text-sm font-semibold text-[#708076]"><p><a href="#recursos">Recursos</a></p><p><a href="#como-funciona">Como funciona</a></p><p><a href="#planos">Planos</a></p></div></div>
      <div><p className="text-sm font-black text-[#223328]">Acesso</p><div className="mt-4 space-y-3 text-sm font-semibold text-[#708076]"><p><a href="/login">Entrar no painel</a></p><p><a href="#faq">Dúvidas frequentes</a></p></div></div>
    </div><div className="mx-auto mt-10 flex max-w-7xl flex-wrap justify-between gap-2 border-t border-[#e4ece6] pt-6 text-xs text-[#88978c]"><span>© {new Date().getFullYear()} Vellto Agenda. Todos os direitos reservados.</span><span>Agenda & Gestão</span></div></footer>
  </main>;
}
