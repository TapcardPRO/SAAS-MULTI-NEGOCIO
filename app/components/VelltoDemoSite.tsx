"use client";

import { useState, type CSSProperties } from "react";

export type DemoModel = "barbearia" | "salao" | "manicure" | "lash";

type DemoService = {
  name: string;
  description: string;
  duration: string;
  price: number;
};

type DemoBusiness = {
  tag: string;
  name: string;
  initials: string;
  description: string;
  headline: string;
  tagline: string;
  cover: string;
  coverAlt: string;
  accent: string;
  soft: string;
  onAccent: string;
  professionals: [string, string];
  services: DemoService[];
};

// Negócios, profissionais, serviços e valores inteiramente fictícios.
// A página demonstra a experiência; NÃO escreve no banco e NÃO cria reservas.
const demoBusinesses: Record<DemoModel, DemoBusiness> = {
  barbearia: {
    tag: "Barbearia & estilo",
    name: "Distrito Barber Club",
    initials: "DB",
    headline: "Seu estilo merece atenção aos detalhes.",
    tagline: "Cortes precisos, barba impecável e uma experiência feita para você.",
    description: "Um espaço dedicado a quem valoriza o próprio estilo. Escolha um serviço, conheça os profissionais e agende sem complicação.",
    cover: "https://images.unsplash.com/photo-1675599193990-33d71150902b?auto=format&fit=crop&w=1500&q=85",
    coverAlt: "Interior de barbearia com cadeiras e ambiente aconchegante",
    accent: "#c5a477", soft: "#f5f0e7", onAccent: "#20160e",
    professionals: ["Gabriel Souza", "Matheus Lima"],
    services: [
      { name: "Corte masculino", description: "Clássico, social ou degradê", duration: "40 min", price: 50 },
      { name: "Barba completa", description: "Desenho e acabamento com toalha quente", duration: "30 min", price: 35 },
      { name: "Corte + barba", description: "Visual completo em uma sessão", duration: "70 min", price: 75 },
      { name: "Sobrancelha", description: "Acabamento e alinhamento", duration: "15 min", price: 20 },
    ],
  },
  salao: {
    tag: "Beleza & cuidado",
    name: "Ateliê Bella Studio",
    initials: "AB",
    headline: "Um momento para cuidar de você.",
    tagline: "Beleza, autoestima e atendimento personalizado em cada detalhe.",
    description: "Do corte à finalização, cada atendimento é pensado para valorizar sua beleza. Descubra nossos serviços e escolha seu horário.",
    cover: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1500&q=85",
    coverAlt: "Salão de beleza com espelhos e cadeiras de atendimento",
    accent: "#c88787", soft: "#fdf3f1", onAccent: "#331f21",
    professionals: ["Camila Martins", "Fernanda Rocha"],
    services: [
      { name: "Corte feminino", description: "Corte e finalização", duration: "50 min", price: 85 },
      { name: "Escova modelada", description: "Brilho e movimento", duration: "45 min", price: 65 },
      { name: "Hidratação", description: "Tratamento e cuidado dos fios", duration: "60 min", price: 110 },
      { name: "Coloração", description: "Avaliação e aplicação", duration: "120 min", price: 190 },
    ],
  },
  manicure: {
    tag: "Nails & beauty",
    name: "Aura Nail Studio",
    initials: "AN",
    headline: "O cuidado está nos pequenos detalhes.",
    tagline: "Unhas impecáveis, ambiente acolhedor e tempo dedicado a você.",
    description: "Esmaltação, nail art e cuidado das mãos em um só lugar. Reserve seu momento de beleza com praticidade.",
    cover: "https://images.unsplash.com/photo-1737214475292-949c0bf920b0?auto=format&fit=crop&w=1500&q=85",
    coverAlt: "Atendimento de manicure com esmaltação e cuidado das unhas",
    accent: "#ad85b9", soft: "#faf2fc", onAccent: "#2c1638",
    professionals: ["Júlia Fernandes", "Larissa Almeida"],
    services: [
      { name: "Manicure", description: "Cuidado completo das mãos", duration: "45 min", price: 40 },
      { name: "Pedicure", description: "Cuidado e esmaltação dos pés", duration: "50 min", price: 45 },
      { name: "Banho de gel", description: "Resistência e acabamento natural", duration: "75 min", price: 95 },
      { name: "Nail art", description: "Detalhes exclusivos nas unhas", duration: "60 min", price: 70 },
    ],
  },
  lash: {
    tag: "Lash design & beleza",
    name: "Íris Lash Studio",
    initials: "IL",
    headline: "Um olhar que revela sua beleza.",
    tagline: "Extensão de cílios, manutenção e lash lifting com carinho em cada detalhe.",
    description: "Um espaço acolhedor para valorizar a beleza do seu olhar. Conheça nossas técnicas, escolha a profissional e reserve seu horário com praticidade.",
    cover: "https://images.unsplash.com/photo-1772235616130-b80e12f0ab7a?auto=format&fit=crop&w=1500&q=85",
    coverAlt: "Profissional aplicando extensão de cílios em um atendimento de beleza",
    accent: "#dcaac4", soft: "#fff1f7", onAccent: "#311e29",
    professionals: ["Marina Ribeiro", "Bianca Alves"],
    services: [
      { name: "Extensão fio a fio", description: "Aplicação clássica para um olhar natural", duration: "120 min", price: 130 },
      { name: "Volume brasileiro", description: "Mais volume e definição para os cílios", duration: "150 min", price: 160 },
      { name: "Manutenção de cílios", description: "Reposição e acabamento dos fios", duration: "75 min", price: 90 },
      { name: "Lash lifting", description: "Curvatura e valorização dos cílios naturais", duration: "60 min", price: 110 },
      { name: "Remoção de extensão", description: "Retirada cuidadosa dos fios aplicados", duration: "30 min", price: 45 },
    ],
  },
};

const money = (value: number) => new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL", maximumFractionDigits: 0,
}).format(value);

export function VelltoDemoSite({ model }: { model: DemoModel }) {
  const business = demoBusinesses[model];
  const [bookingOpen, setBookingOpen] = useState(false);
  const [service, setService] = useState(0);
  const [professional, setProfessional] = useState(0);
  const [day, setDay] = useState("Amanhã");
  const [time, setTime] = useState("10:00");
  const [finished, setFinished] = useState(false);

  const theme = {
    "--demo-accent": business.accent,
    "--demo-soft": business.soft,
    "--demo-on-accent": business.onAccent,
  } as CSSProperties;

  function openBooking(serviceIndex = 0) {
    setService(serviceIndex);
    setProfessional(0);
    setDay("Amanhã");
    setTime("10:00");
    setFinished(false);
    setBookingOpen(true);
  }

  return (
    <div style={theme} className="min-h-screen bg-[#fbfaf8] font-sans text-[#241f1b]">
      <div className="border-b border-[#e8e2dd] bg-white px-4 py-2 text-center text-[11px] font-bold tracking-wide text-[#746f69]">
        DEMONSTRAÇÃO DA VELLTO · ESTABELECIMENTO FICTÍCIO
      </div>
      <header className="sticky top-0 z-20 border-b border-[#eae6e1] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-5xl items-center justify-between gap-3 px-5 sm:px-9">
          <a href="#inicio" className="flex min-w-0 items-center gap-3" aria-label={`${business.name} — início`}>
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[var(--demo-accent)] text-sm font-black text-[var(--demo-on-accent)]">{business.initials}</span>
            <span className="max-w-[180px] truncate text-sm font-black tracking-tight sm:max-w-none sm:text-base">{business.name}</span>
          </a>
          <nav aria-label="Seções da demonstração" className="hidden items-center gap-5 text-xs font-bold text-[#726961] md:flex">
            <a href="#servicos" className="hover:text-black">Serviços</a>
            <a href="#equipe" className="hover:text-black">Equipe</a>
            <a href="#sobre" className="hover:text-black">Sobre</a>
          </nav>
          <button type="button" onClick={() => openBooking()}
            className="shrink-0 rounded-xl bg-[var(--demo-accent)] px-4 py-3 text-xs font-black text-[var(--demo-on-accent)] transition hover:brightness-95 sm:px-5">
            Agendar horário ↗
          </button>
        </div>
      </header>

      <main id="inicio">
        <section className="relative isolate min-h-[330px] overflow-hidden bg-[#241e1a] sm:min-h-[430px]">
          <img src={business.cover} alt={business.coverAlt} className="absolute inset-0 h-full w-full object-cover opacity-80"
            onError={(event) => { event.currentTarget.style.display = "none"; }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#100e0d]/95 via-[#100e0d]/75 to-[#100e0d]/20" />
          <div className="relative mx-auto flex min-h-[330px] max-w-5xl flex-col justify-center px-6 py-12 text-white sm:min-h-[430px] sm:px-10">
            <span className="w-fit rounded-full border border-white/30 bg-white/10 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.18em]">{business.tag}</span>
            <h1 className="mt-6 max-w-[520px] text-balance text-3xl font-black leading-tight tracking-[-.04em] sm:text-5xl">{business.headline}</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/85 sm:text-base">{business.tagline}</p>
            <button type="button" onClick={() => openBooking()} className="mt-7 w-fit rounded-xl bg-[var(--demo-accent)] px-6 py-4 text-sm font-black text-[var(--demo-on-accent)] hover:brightness-95">
              Quero agendar <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>

        <div className="mx-auto -mt-5 grid max-w-5xl grid-cols-3 gap-2 px-4 text-center sm:gap-4 sm:px-10">
          {[["01", "Escolha seu serviço"], ["02", "Selecione o horário"], ["03", "Agende online"]].map(([number, title]) => (
            <div key={number} className="relative z-10 rounded-xl border border-[#ede9e3] bg-white px-2 py-4 shadow-sm sm:p-5">
              <p className="text-base font-black text-[#7e6c5a] sm:text-lg">{number}</p>
              <p className="mt-1 text-[10px] font-semibold text-[#5c554d] sm:text-xs">{title}</p>
            </div>
          ))}
        </div>

        <section id="servicos" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-14 sm:px-10 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#8d7865]">Nosso menu</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">Serviços e valores</h2>
              <p className="mt-3 text-sm text-[#77716a]">Escolha seu atendimento e reserve um horário.</p>
            </div>
            <span className="rounded-full bg-[var(--demo-soft)] px-4 py-2 text-[11px] font-bold text-[#746961]">Atendimento com horário marcado</span>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
            {business.services.map((item, index) => (
              <article key={item.name} className="rounded-2xl border border-[#e9e5df] bg-white p-5 shadow-[0_12px_25px_-24px_rgba(0,0,0,.3)] sm:p-6">
                <div className="flex items-start justify-between gap-4"><h3 className="font-extrabold text-[#2c2622]">{item.name}</h3><span className="shrink-0 text-base font-black text-[#332920]">{money(item.price)}</span></div>
                <p className="mt-2 text-xs leading-5 text-[#827b73]">{item.description}</p>
                <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#f1eee9] pt-4">
                  <span className="text-xs font-semibold text-[#7a7169]">◷ {item.duration}</span>
                  <button type="button" onClick={() => openBooking(index)} className="rounded-lg bg-[var(--demo-soft)] px-3 py-2 text-xs font-black text-[#493b30] hover:brightness-95">Escolher ↗</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="equipe" className="scroll-mt-24 bg-[#f4f1eb] px-5 py-14 sm:px-10 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#8d7865]">Quem cuida de você</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">Nossa equipe</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#766e65]">Profissionais preparados para oferecer uma ótima experiência.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {business.professionals.map((name, index) => (
                <div key={name} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--demo-soft)] text-xl font-black text-[#7b6452]">{name.split(" ").map((s) => s[0]).slice(0, 2).join("")}</span>
                  <div className="min-w-0 flex-1"><h3 className="font-extrabold">{name}</h3><p className="mt-1 text-xs text-[#897e73]">Profissional especialista</p></div>
                  <button type="button" aria-label={`Agendar com ${name}`} onClick={() => { openBooking(); setProfessional(index); }}
                    className="rounded-lg border border-[#e9e4da] px-3 py-2 text-xs font-bold hover:bg-[#faf8f5]">↗</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="sobre" className="mx-auto grid max-w-5xl scroll-mt-24 gap-6 px-5 py-14 sm:px-10 sm:py-20 md:grid-cols-[1fr_auto] md:items-center">
          <div><p className="text-xs font-black uppercase tracking-[.18em] text-[#8d7865]">Nosso espaço</p><h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Bem-vindo ao {business.name}</h2><p className="mt-4 max-w-xl text-sm leading-7 text-[#766e65]">{business.description}</p></div>
          <button type="button" onClick={() => openBooking()} className="rounded-xl bg-[var(--demo-accent)] px-6 py-4 text-sm font-black text-[var(--demo-on-accent)]">Simular agendamento ↗</button>
        </section>
      </main>
      <footer className="bg-[#211d1a] px-5 py-8 text-[#e9e2dc] sm:px-10"><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3"><p className="text-sm font-black">{business.name}</p><div className="flex flex-wrap items-center gap-4"><p className="text-xs text-[#b5ada4]">Página demonstrativa criada com Vellto · Nenhuma reserva real</p><a href="/#planos" target="_top" className="text-xs font-extrabold text-[#d7ffeb] underline underline-offset-4">Criar minha página na Vellto ↗</a></div></div></footer>

      {bookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17120f]/75 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="demo-booking-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-black uppercase tracking-widest text-[#93816e]">Agendamento demonstrativo</p><h2 id="demo-booking-title" className="mt-2 text-2xl font-black">{finished ? "É assim que funciona!" : "Escolha seu horário"}</h2></div>
              <button type="button" onClick={() => setBookingOpen(false)} aria-label="Fechar" className="rounded-full bg-[#f5f2ee] px-3 py-2 font-bold">✕</button>
            </div>
            {finished ? (
              <div className="mt-6 rounded-2xl bg-[#f3f8f1] p-6"><p className="text-3xl">✓</p><p className="mt-3 font-bold">Você experimentou o agendamento da Vellto.</p><p className="mt-2 text-sm leading-6 text-[#58685a]">Em uma página real, seu cliente confirma o pedido e o horário aparece na agenda do estabelecimento.</p><p className="mt-3 text-xs font-semibold text-[#657165]">Esta é apenas uma simulação. Nenhuma reserva foi criada.</p><a href="/#planos" target="_top" className="mt-5 flex w-full items-center justify-center rounded-xl bg-[var(--demo-accent)] px-4 py-4 text-center text-sm font-black text-[var(--demo-on-accent)]">Quero uma página assim para meu negócio ↗</a><button type="button" onClick={() => setBookingOpen(false)} className="mt-3 w-full rounded-xl border border-[#e2e8df] px-4 py-3 text-sm font-semibold">Voltar à demonstração</button></div>
            ) : (
              <div className="mt-6 space-y-5">
                <div><label htmlFor="demo-service" className="mb-2 block text-sm font-extrabold">1. Serviço</label><select id="demo-service" value={service} onChange={(e) => setService(Number(e.target.value))} className="w-full rounded-xl border border-[#e3ded8] bg-white px-4 py-3 text-sm">{business.services.map((item, index) => <option value={index} key={item.name}>{item.name} — {money(item.price)}</option>)}</select></div>
                <div><label htmlFor="demo-professional" className="mb-2 block text-sm font-extrabold">2. Profissional</label><select id="demo-professional" value={professional} onChange={(e) => setProfessional(Number(e.target.value))} className="w-full rounded-xl border border-[#e3ded8] bg-white px-4 py-3 text-sm">{business.professionals.map((name, index) => <option value={index} key={name}>{name}</option>)}</select></div>
                <div><p className="mb-2 text-sm font-extrabold">3. Dia</p><div className="grid grid-cols-3 gap-2">{["Amanhã", "Próximo dia", "Outro dia"].map((label) => <button type="button" key={label} onClick={() => setDay(label)} className={`rounded-xl border px-2 py-3 text-xs font-bold ${day === label ? "border-[#7b6251] bg-[var(--demo-soft)]" : "border-[#e9e4df]"}`}>{label}</button>)}</div></div>
                <div><p className="mb-2 text-sm font-extrabold">4. Horário</p><div className="grid grid-cols-4 gap-2">{["09:00", "10:00", "14:00", "16:30"].map((slot) => <button type="button" key={slot} onClick={() => setTime(slot)} className={`rounded-lg border px-2 py-3 text-xs font-bold ${time === slot ? "border-[#7b6251] bg-[var(--demo-soft)]" : "border-[#e9e4df]"}`}>{slot}</button>)}</div></div>
                <div className="rounded-xl bg-[#f8f6f2] p-4 text-sm"><div className="flex justify-between gap-3"><span>{business.services[service].name}</span><strong>{money(business.services[service].price)}</strong></div><p className="mt-2 text-xs text-[#837870]">{business.professionals[professional]} · {day} às {time}</p></div>
                <p className="text-xs leading-5 text-[#84786e]">Horários e valores ilustrativos. Esta simulação não cria agendamentos nem envia dados.</p>
                <button type="button" onClick={() => setFinished(true)} className="w-full rounded-xl bg-[var(--demo-accent)] px-5 py-4 text-sm font-black text-[var(--demo-on-accent)] hover:brightness-95">Concluir simulação ↗</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
