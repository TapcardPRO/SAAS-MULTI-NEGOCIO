"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Props = {
  businessName: string;
  hasServices: boolean;
  hasProfessionals: boolean;
  hasSchedule: boolean;
  hasPublicPage: boolean;
};

const steps = [
  {
    title: "Cadastre seus serviços",
    description: "Adicione o que você oferece, com preço e duração. Assim seus clientes poderão escolher exatamente o que desejam agendar.",
    href: "/dashboard/servicos",
    action: "Cadastrar serviços",
    icon: "✂",
  },
  {
    title: "Adicione os profissionais",
    description: "Cadastre você e as pessoas que atendem no estabelecimento. Cada profissional poderá ter sua própria agenda.",
    href: "/dashboard/profissionais",
    action: "Cadastrar profissionais",
    icon: "♙",
  },
  {
    title: "Configure os horários",
    description: "Defina os dias e horários em que cada profissional atende. Isso evita que clientes marquem fora do expediente.",
    href: "/dashboard/horarios",
    action: "Configurar horários",
    icon: "◷",
  },
  {
    title: "Compartilhe sua página",
    description: "Sua página pública é onde os clientes conhecem seus serviços e fazem agendamentos. Copie o link e divulgue no WhatsApp e Instagram.",
    href: "/dashboard/meu-link",
    action: "Acessar meu link",
    icon: "↗",
  },
];

export default function GettingStartedGuide({
  businessName,
  hasServices,
  hasProfessionals,
  hasSchedule,
  hasPublicPage,
}: Props) {
  const [showTour, setShowTour] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const checklist = useMemo(
    () => [
      { ...steps[0], done: hasServices },
      { ...steps[1], done: hasProfessionals },
      { ...steps[2], done: hasSchedule },
      { ...steps[3], done: hasPublicPage },
    ],
    [hasServices, hasProfessionals, hasSchedule, hasPublicPage]
  );

  const completed = checklist.filter((item) => item.done).length;
  const progress = Math.round((completed / checklist.length) * 100);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem("vellto-first-access-tour-v1")) {
        setShowTour(true);
      }
    } catch {
      // O guia continua disponível pelo botão mesmo se o navegador bloquear o armazenamento.
    }
  }, []);

  function closeTour() {
    setShowTour(false);
    try {
      window.localStorage.setItem("vellto-first-access-tour-v1", "seen");
    } catch {
      // Não impede o uso do painel.
    }
  }

  function openTour() {
    setActiveStep(0);
    setShowTour(true);
  }

  const currentStep = checklist[activeStep];

  return (
    <>
      <section className="mt-5 overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.10] via-white/[0.025] to-transparent p-4 shadow-lg sm:mt-6 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">Primeiros passos</span>
              <span className="text-xs text-zinc-400">{completed} de {checklist.length} etapas concluídas</span>
            </div>
            <h2 className="mt-2 text-lg font-black sm:text-xl">Vamos deixar {businessName || "seu negócio"} pronto para receber agendamentos</h2>
            <p className="mt-1 text-sm text-zinc-400">Complete estas etapas para começar a aproveitar o Vellto.</p>
          </div>
          <button type="button" onClick={openTour} className="min-h-11 shrink-0 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400">
            Ver passo a passo
          </button>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Progresso da configuração">
          <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: progress + "%" }} />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {checklist.map((item, index) => (
            <Link key={item.href} href={item.href} className="flex min-h-[66px] items-center gap-3 rounded-xl border border-white/10 bg-black/10 p-3 transition hover:border-emerald-400/30 hover:bg-white/[0.04]">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${item.done ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-zinc-300"}`}>
                {item.done ? "✓" : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${item.done ? "text-zinc-400 line-through" : "text-zinc-100"}`}>{item.title}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{item.done ? "Concluído" : "Clique para configurar"}</span>
              </span>
              <span className="text-zinc-500" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
        {completed === checklist.length && (
          <p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300">
            Tudo pronto! Seu negócio já concluiu a configuração inicial. Você pode rever este guia quando quiser.
          </p>
        )}
      </section>

      {showTour && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-labelledby="vellto-tour-title">
          <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0b1620] p-5 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-[.18em] text-emerald-400">Bem-vindo ao Vellto</span>
              <button type="button" onClick={closeTour} className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">Pular guia ×</button>
            </div>
            <div className="mt-5 flex gap-1.5" aria-label={`Etapa ${activeStep + 1} de ${steps.length}`}>
              {steps.map((step, index) => (
                <span key={step.href} className={`h-1.5 flex-1 rounded-full ${index <= activeStep ? "bg-emerald-400" : "bg-white/10"}`} />
              ))}
            </div>
            <div className="mt-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-2xl text-emerald-300">{currentStep.icon}</div>
            <p className="mt-6 text-xs font-bold uppercase tracking-wider text-emerald-400">Etapa {activeStep + 1} de {steps.length}</p>
            <h2 id="vellto-tour-title" className="mt-2 text-2xl font-black tracking-tight text-white">{currentStep.title}</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-300">{currentStep.description}</p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Seu progresso</p>
              <p className="mt-2 text-sm text-zinc-200">{checklist.filter((item) => item.done).length} de 4 etapas já concluídas no seu estabelecimento.</p>
            </div>
            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => activeStep > 0 ? setActiveStep(activeStep - 1) : closeTour()} className="min-h-11 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/5">{activeStep === 0 ? "Fechar" : "Voltar"}</button>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link href={currentStep.href} onClick={closeTour} className="min-h-11 rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-bold text-zinc-950 hover:bg-emerald-400">{currentStep.action}</Link>
                <button type="button" onClick={() => activeStep < steps.length - 1 ? setActiveStep(activeStep + 1) : closeTour()} className="min-h-11 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/5">{activeStep === steps.length - 1 ? "Concluir" : "Próxima etapa"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
