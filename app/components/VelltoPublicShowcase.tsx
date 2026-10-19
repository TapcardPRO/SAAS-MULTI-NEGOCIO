"use client";

import { useState } from "react";
import type { DemoModel } from "./VelltoDemoSite";

const models: { id: DemoModel; label: string; title: string }[] = [
  { id: "barbearia", label: "Barbearia", title: "Distrito Barber Club" },
  { id: "salao", label: "Salão de beleza", title: "Ateliê Bella Studio" },
  { id: "manicure", label: "Manicure", title: "Aura Nail Studio" },
];

export default function VelltoPublicShowcase() {
  const [model, setModel] = useState<DemoModel>("barbearia");
  const selected = models.find((m) => m.id === model) || models[0];
  const url = `/demonstracao?modelo=${model}`;

  return (
    <section id="pagina-publica" aria-labelledby="titulo-pagina-publica" className="scroll-mt-24 overflow-hidden bg-white px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.82fr_1.18fr] lg:gap-16 xl:gap-20">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#009a74]">Sua presença online, de verdade</p>
          <h2 id="titulo-pagina-publica" className="mt-5 text-balance text-4xl font-black leading-[1.08] tracking-[-.055em] text-[#15241b] sm:text-5xl">
            Não é só um link. <span className="text-[#00a67e]">É a vitrine do seu negócio.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#64736b] sm:text-lg">
            Seu cliente encontra uma página profissional, vê seus serviços, conhece sua equipe e escolhe como agendar — tudo com a identidade da sua marca.
          </p>
          <div className="mt-8 grid gap-3 text-sm font-semibold text-[#405247] sm:grid-cols-2">
            {["Capa e identidade visual", "Serviços com preços e duração", "Profissionais em destaque", "Agendamento pelo celular", "Seu endereço personalizado", "Experiência de ponta a ponta"].map(item => (
              <div className="flex items-start gap-2" key={item}><span className="font-black text-[#00a980]">✓</span><span>{item}</span></div>
            ))}
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#00c896] px-6 text-sm font-extrabold text-[#063b2c] transition hover:bg-[#00b88a]">
              Explorar página de demonstração <span aria-hidden="true">↗</span>
            </a>
            <a href="#planos" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-[#d9e5dd] px-6 text-sm font-bold text-[#33463b] transition hover:border-[#00c896]">
              Conhecer os planos
            </a>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#89968d]">A demonstração usa empresas e valores fictícios e não realiza agendamentos reais.</p>
        </div>

        <div className="min-w-0 rounded-[30px] border border-[#dcece3] bg-gradient-to-b from-[#edf9f2] to-[#f7fbf8] p-3 shadow-[0_30px_85px_-45px_rgba(5,80,53,.22)] sm:p-6">
          <div className="mb-5 px-1 pt-2 sm:px-2">
            <p className="mb-3 text-xs font-black uppercase tracking-[.16em] text-[#527564]">Escolha um segmento e veja o resultado</p>
            <div role="group" aria-label="Segmento da demonstração" className="flex flex-wrap gap-2">
              {models.map((item) => (
                <button type="button" key={item.id} onClick={() => setModel(item.id)} aria-pressed={model === item.id}
                  className={`rounded-xl px-3 py-2.5 text-xs font-extrabold transition sm:px-4 ${model === item.id ? "bg-[#133b2d] text-white shadow-sm" : "border border-[#d7e5dc] bg-white text-[#4a6958] hover:border-[#78cbae]"}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-[20px] border border-[#dbe6df] bg-white shadow-[0_20px_45px_-30px_rgba(22,57,42,.42)]">
            <div className="flex h-12 items-center justify-between gap-3 border-b border-[#e9efeb] bg-[#fbfdfb] px-4">
              <div className="flex flex-none gap-1.5" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-[#e9b1b1]"/><span className="h-2.5 w-2.5 rounded-full bg-[#ead59b]"/><span className="h-2.5 w-2.5 rounded-full bg-[#a5dab8]"/></div>
              <span className="min-w-0 truncate rounded-lg bg-[#eff5f0] px-3 py-1.5 text-[10px] font-semibold text-[#779282]">velltoagenda.vercel.app/demonstracao</span>
              <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${selected.title} em nova aba`} className="flex-none text-sm font-bold text-[#426655] hover:text-[#008e6a]">↗</a>
            </div>
            <iframe key={model} title={`Prévia do site ${selected.title}`} src={url} loading="lazy" className="block h-[610px] w-full border-0 bg-white sm:h-[700px]" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-1 pt-4 text-xs text-[#5f8570] sm:px-2">
            <span>↕ Role dentro da prévia para explorar a página</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="font-extrabold text-[#008f6b] hover:underline">Ver em tela cheia ↗</a>
          </div>
        </div>
      </div>
    </section>
  );
}
