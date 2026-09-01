import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type SaasPlan = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billingCycle: string;
  maxProfessionals: number;
  maxServices: number;
};

async function getPlans(): Promise<SaasPlan[]> {
  try {
    const db = await getDb();

    const plans = await db
      .collection("saas_plans")
      .find({
        active: { $ne: false },
      })
      .sort({
        price: 1,
        createdAt: 1,
      })
      .toArray();

    return plans.map((plan) => ({
      id: plan._id.toString(),
      name: String(plan.name || ""),
      slug: String(plan.slug || ""),
      description: String(plan.description || ""),
      price: Number(plan.price || 0),
      billingCycle: String(plan.billingCycle || "monthly"),
      maxProfessionals: Number(plan.maxProfessionals || 0),
      maxServices: Number(plan.maxServices || 0),
    }));
  } catch (error) {
    console.error("Erro ao carregar planos da landing:", error);
    return [];
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function Home() {
  const plans = await getPlans();

  return (
    <main className="min-h-screen overflow-hidden bg-[#060807] text-white">
      <Header />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[140px]" />
          <div className="absolute right-[-180px] top-[280px] h-[420px] w-[420px] rounded-full bg-emerald-400/5 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-sm font-medium text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Agenda & gestão para negócios que atendem com hora marcada
            </div>

            <h1 className="text-balance text-4xl font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Menos tempo organizando.
              <span className="block bg-gradient-to-r from-emerald-300 via-emerald-400 to-green-500 bg-clip-text text-transparent">
                Mais tempo atendendo e faturando.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-base leading-7 text-zinc-400 sm:text-xl sm:leading-8">
              A Vellto reúne agenda, clientes, profissionais, serviços,
              mensalistas e gestão do seu negócio em um único sistema.
              Simples para você. Profissional para seus clientes.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#planos"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-7 font-bold text-zinc-950 transition hover:-translate-y-0.5 hover:bg-emerald-300 sm:w-auto"
              >
                Conhecer os planos
                <ArrowRightIcon />
              </a>

              <a
                href="/login"
                className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-7 font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.06] sm:w-auto"
              >
                Já sou cliente
              </a>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-500">
              <CheckMini text="Sem planilhas" />
              <CheckMini text="Acesso online" />
              <CheckMini text="Funciona no celular e computador" />
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-6xl sm:mt-20">
            <DashboardMockup />
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-[0.24em] text-zinc-500">
            Feita para negócios que vivem de atendimento
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-zinc-300 sm:text-base">
            <span>Barbearias</span>
            <span className="hidden text-emerald-500/60 sm:inline">•</span>
            <span>Salões</span>
            <span className="hidden text-emerald-500/60 sm:inline">•</span>
            <span>Manicures</span>
            <span className="hidden text-emerald-500/60 sm:inline">•</span>
            <span>Clínicas</span>
            <span className="hidden text-emerald-500/60 sm:inline">•</span>
            <span>Academias</span>
            <span className="hidden text-emerald-500/60 sm:inline">•</span>
            <span>Pet shops</span>
          </div>
        </div>
      </section>

      <section id="recursos" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Tudo em um só lugar"
            title="Sua operação organizada de ponta a ponta."
            description="Da primeira reserva até o histórico do cliente, a Vellto ajuda você a manter o negócio organizado sem complicação."
          />

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<CalendarIcon />}
              title="Agenda inteligente"
              text="Visualize seus horários, profissionais e atendimentos de forma clara e rápida."
            />

            <FeatureCard
              icon={<UsersIcon />}
              title="Gestão de clientes"
              text="Centralize dados, histórico de atendimentos e informações importantes dos seus clientes."
            />

            <FeatureCard
              icon={<ScissorsIcon />}
              title="Serviços e profissionais"
              text="Cadastre serviços, duração, valores e organize os profissionais da sua equipe."
            />

            <FeatureCard
              icon={<RepeatIcon />}
              title="Planos e mensalistas"
              text="Acompanhe clientes mensais, utilização de serviços, vencimentos e saldo disponível."
            />

            <FeatureCard
              icon={<GlobeIcon />}
              title="Página pública"
              text="Tenha uma página profissional para apresentar seu negócio e receber agendamentos online."
            />

            <FeatureCard
              icon={<ChartIcon />}
              title="Visão da operação"
              text="Tenha informações importantes do negócio concentradas em um painel simples de acompanhar."
            />
          </div>
        </div>
      </section>

      <section id="como-funciona" className="py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-400">
              Seu dia mais simples
            </span>

            <h2 className="mt-4 max-w-xl text-3xl font-black tracking-tight sm:text-5xl">
              Abra o painel e saiba exatamente o que está acontecendo.
            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
              Chega de procurar informações em conversas, cadernos e
              planilhas. Com a Vellto, sua agenda e seus clientes ficam
              organizados em um único ambiente.
            </p>

            <div className="mt-8 space-y-5">
              <Benefit
                number="01"
                title="Configure seu negócio"
                text="Cadastre sua equipe, seus serviços e seus horários."
              />

              <Benefit
                number="02"
                title="Compartilhe sua página"
                text="Seus clientes acessam sua página e escolhem um horário disponível."
              />

              <Benefit
                number="03"
                title="Gerencie tudo pelo painel"
                text="Acompanhe atendimentos, clientes, mensalistas e sua rotina em um só lugar."
              />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-10 rounded-full bg-emerald-500/10 blur-[100px]" />

            <div className="relative rounded-[28px] border border-white/10 bg-[#0c100e] p-3 shadow-2xl shadow-black/40">
              <div className="rounded-[22px] border border-white/[0.07] bg-[#090c0a] p-5 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                      Agenda de hoje
                    </p>
                    <p className="mt-2 text-xl font-bold">
                      Seus próximos atendimentos
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <CalendarIcon />
                  </div>
                </div>

                <div className="mt-7 space-y-3">
                  <ScheduleItem
                    time="09:00"
                    customer="Carlos Henrique"
                    service="Corte"
                    professional="Igor"
                    status="Confirmado"
                  />

                  <ScheduleItem
                    time="10:30"
                    customer="Marcos Souza"
                    service="Corte + Barba"
                    professional="Igor"
                    status="Confirmado"
                  />

                  <ScheduleItem
                    time="13:00"
                    customer="Felipe Alves"
                    service="Corte"
                    professional="Igor"
                    status="Agendado"
                  />

                  <ScheduleItem
                    time="15:30"
                    customer="Rafael Lima"
                    service="Barba"
                    professional="Igor"
                    status="Agendado"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-white/[0.015] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-gradient-to-br from-emerald-500/[0.09] to-transparent p-6 sm:p-9">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-zinc-950">
                <GlobeIcon />
              </div>

              <h3 className="mt-8 text-2xl font-black sm:text-3xl">
                Uma página que valoriza o seu negócio.
              </h3>

              <p className="mt-4 max-w-lg leading-7 text-zinc-400">
                Apresente seus serviços, profissionais, galeria, informações
                e disponibilize o agendamento online em uma página preparada
                para celular, tablet e computador.
              </p>

              <div className="mt-8 rounded-[24px] border border-white/10 bg-[#080b09] p-4">
                <div className="h-36 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 p-5">
                  <div className="h-9 w-9 rounded-xl bg-emerald-400" />
                  <div className="mt-8 h-3 w-36 rounded bg-white/20" />
                  <div className="mt-2 h-2 w-52 max-w-full rounded bg-white/10" />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="h-14 rounded-xl bg-white/[0.04]" />
                  <div className="h-14 rounded-xl bg-white/[0.04]" />
                  <div className="h-14 rounded-xl bg-white/[0.04]" />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#0b0e0c] p-6 sm:p-9">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-emerald-400">
                <RepeatIcon />
              </div>

              <h3 className="mt-8 text-2xl font-black sm:text-3xl">
                Controle de mensalistas sem confusão.
              </h3>

              <p className="mt-4 max-w-lg leading-7 text-zinc-400">
                Saiba quem está ativo, quantos serviços ainda estão
                disponíveis no plano e acompanhe cada utilização pelo
                histórico do cliente.
              </p>

              <div className="mt-8 rounded-[24px] border border-white/10 bg-[#080b09] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">
                      Plano mensal
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Cliente ativo
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400">
                    ATIVO
                  </span>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">
                      Utilizações
                    </span>
                    <span className="font-semibold">
                      2 de 4
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full w-1/2 rounded-full bg-emerald-400" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <MiniInfo label="Restantes" value="2 cortes" />
                  <MiniInfo label="Status" value="Em dia" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Feita para crescer junto"
            title="Mais profissional para o cliente. Mais controle para você."
            description="A Vellto melhora a experiência de quem agenda e, ao mesmo tempo, simplifica a rotina de quem administra."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <AudienceCard
              title="Para o seu negócio"
              description="Tenha clareza da operação e centralize as informações que fazem parte da sua rotina."
              items={[
                "Agenda organizada por profissional",
                "Cadastro de clientes e histórico",
                "Serviços, preços e duração",
                "Planos e mensalistas",
                "Página personalizada",
                "Controle dos atendimentos",
              ]}
            />

            <AudienceCard
              title="Para o seu cliente"
              description="Uma experiência simples e profissional desde o agendamento até o acompanhamento dos seus serviços."
              items={[
                "Agendamento online",
                "Horários disponíveis em tempo real",
                "Área do cliente",
                "Histórico de agendamentos",
                "Visualização do plano mensal",
                "Acesso pelo celular",
              ]}
            />
          </div>
        </div>
      </section>

      <section
        id="planos"
        className="border-y border-white/[0.06] bg-white/[0.015] py-24 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Planos"
            title="Escolha o plano ideal para o momento do seu negócio."
            description="Comece com o que você precisa hoje e tenha uma estrutura preparada para acompanhar seu crescimento."
          />

          {plans.length > 0 ? (
            <div
              className={`mx-auto mt-14 grid max-w-6xl gap-5 ${
                plans.length === 1
                  ? "max-w-md"
                  : plans.length === 2
                    ? "md:grid-cols-2"
                    : "md:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {plans.map((plan, index) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  featured={plans.length > 1 && index === 1}
                />
              ))}
            </div>
          ) : (
            <div className="mx-auto mt-14 max-w-2xl rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-center">
              <h3 className="text-xl font-bold">
                Planos personalizados para o seu negócio
              </h3>

              <p className="mt-3 text-zinc-400">
                Entre em contato com a equipe Vellto para conhecer as opções
                disponíveis.
              </p>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-zinc-500">
            Os recursos e limites disponíveis podem variar de acordo com o
            plano contratado.
          </p>
        </div>
      </section>

      <section id="faq" className="py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Perguntas frequentes"
            title="Tudo o que você precisa saber antes de começar."
            description=""
          />

          <div className="mt-12 space-y-3">
            <Faq
              question="A Vellto funciona pelo celular?"
              answer="Sim. As páginas da Vellto foram preparadas para funcionar em celular, tablet e computador."
            />

            <Faq
              question="Meus clientes conseguem agendar sozinhos?"
              answer="Sim. Cada negócio pode ter sua própria página pública, onde o cliente escolhe serviço, profissional, data e um horário disponível."
            />

            <Faq
              question="Posso cadastrar mais de um profissional?"
              answer="Sim. A quantidade disponível pode depender dos limites definidos no plano contratado."
            />

            <Faq
              question="Consigo controlar clientes mensalistas?"
              answer="Sim. A Vellto permite acompanhar o plano do cliente, quantidade de utilizações e histórico de atendimentos."
            />

            <Faq
              question="Preciso instalar algum programa?"
              answer="Não. A Vellto funciona online e pode ser acessada diretamente pelo navegador."
            />
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 sm:pb-32 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[34px] border border-emerald-400/20 bg-emerald-400 p-7 text-zinc-950 sm:p-12 lg:p-16">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full border-[50px] border-zinc-950/[0.05]" />
          <div className="absolute -bottom-28 right-32 h-64 w-64 rounded-full border-[40px] border-zinc-950/[0.05]" />

          <div className="relative max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em]">
              Vellto Agenda
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Seu negócio merece mais do que uma agenda.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-900/70 sm:text-lg">
              Tenha uma estrutura profissional para organizar sua rotina,
              atender melhor seus clientes e preparar seu negócio para crescer.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#planos"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-7 font-bold text-white transition hover:bg-zinc-900"
              >
                Ver planos
                <ArrowRightIcon />
              </a>

              <a
                href="/login"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-zinc-950/15 px-7 font-bold transition hover:bg-zinc-950/5"
              >
                Entrar no painel
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#060807]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-3">
          <LogoMark />

          <div>
            <p className="text-lg font-black leading-none tracking-tight">
              VELLTO
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Agenda & Gestão
            </p>
          </div>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-400 lg:flex">
          <a
            href="#recursos"
            className="transition hover:text-white"
          >
            Recursos
          </a>

          <a
            href="#como-funciona"
            className="transition hover:text-white"
          >
            Como funciona
          </a>

          <a
            href="#planos"
            className="transition hover:text-white"
          >
            Planos
          </a>

          <a
            href="#faq"
            className="transition hover:text-white"
          >
            Dúvidas
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/login"
            className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.05] hover:text-white sm:block"
          >
            Entrar
          </a>

          <a
            href="#planos"
            className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-emerald-300 sm:px-5"
          >
            Começar agora
          </a>
        </div>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-lg font-black text-zinc-950 shadow-lg shadow-emerald-500/10">
      V
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="relative">
      <div className="absolute inset-x-[12%] bottom-[-10%] h-[30%] rounded-full bg-emerald-400/15 blur-[80px]" />

      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0b0e0c] p-2 shadow-2xl shadow-black/60 sm:rounded-[30px] sm:p-3">
        <div className="overflow-hidden rounded-[18px] border border-white/[0.07] bg-[#080a09] sm:rounded-[24px]">
          <div className="flex h-11 items-center border-b border-white/[0.06] px-4">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/50" />
            </div>

            <div className="mx-auto hidden w-60 rounded-md bg-white/[0.04] px-3 py-1 text-center text-[9px] text-zinc-600 sm:block">
              app.velltoagenda.com
            </div>
          </div>

          <div className="flex min-h-[360px] sm:min-h-[500px]">
            <aside className="hidden w-52 flex-none border-r border-white/[0.06] bg-[#090c0a] p-4 md:block">
              <div className="flex items-center gap-2">
                <LogoMark />
                <div>
                  <p className="text-xs font-black">
                    VELLTO
                  </p>
                  <p className="text-[8px] text-zinc-600">
                    Gestão inteligente
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-2">
                <MockMenu active label="Visão geral" />
                <MockMenu label="Agenda" />
                <MockMenu label="Clientes" />
                <MockMenu label="Mensalistas" />
                <MockMenu label="Serviços" />
                <MockMenu label="Profissionais" />
                <MockMenu label="Financeiro" />
              </div>
            </aside>

            <div className="min-w-0 flex-1 p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                    Visão geral
                  </p>

                  <p className="mt-1 text-lg font-bold sm:text-2xl">
                    Olá, seja bem-vindo
                  </p>

                  <p className="mt-1 text-[10px] text-zinc-600 sm:text-xs">
                    Acompanhe o movimento do seu negócio.
                  </p>
                </div>

                <div className="h-9 w-9 rounded-xl bg-white/[0.05]" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                <MockStat label="Hoje" value="8" />
                <MockStat label="Clientes" value="124" />
                <MockStat label="Ativos" value="18" />
                <MockStat label="Serviços" value="12" />
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">
                        Agenda do dia
                      </p>
                      <p className="mt-1 text-[9px] text-zinc-600">
                        Próximos atendimentos
                      </p>
                    </div>

                    <span className="rounded-lg bg-emerald-400/10 px-2 py-1 text-[8px] font-bold text-emerald-400">
                      HOJE
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <MockAppointment
                      time="09:00"
                      name="Carlos Henrique"
                      service="Corte"
                    />

                    <MockAppointment
                      time="10:30"
                      name="Marcos Souza"
                      service="Corte + Barba"
                    />

                    <MockAppointment
                      time="13:00"
                      name="Felipe Alves"
                      service="Corte"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <p className="text-xs font-semibold">
                    Resumo
                  </p>

                  <div className="mt-5 flex items-center justify-center">
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-[10px] border-emerald-400/20">
                      <div className="absolute inset-[-10px] rotate-45 rounded-full border-[10px] border-transparent border-r-emerald-400 border-t-emerald-400" />

                      <div className="text-center">
                        <p className="text-xl font-bold">
                          75%
                        </p>
                        <p className="text-[8px] text-zinc-600">
                          ocupação
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-white/[0.03] p-2">
                      <p className="text-[8px] text-zinc-600">
                        Concluídos
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        6
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/[0.03] p-2">
                      <p className="text-[8px] text-zinc-600">
                        Próximos
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        2
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockMenu({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-3 py-2 text-[10px] ${
        active
          ? "bg-emerald-400/10 font-semibold text-emerald-400"
          : "text-zinc-600"
      }`}
    >
      {label}
    </div>
  );
}

function MockStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
      <p className="text-[8px] text-zinc-600 sm:text-[9px]">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold sm:text-xl">
        {value}
      </p>
    </div>
  );
}

function MockAppointment({
  time,
  name,
  service,
}: {
  time: string;
  name: string;
  service: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5">
      <div className="rounded-lg bg-emerald-400/10 px-2 py-1.5 text-[9px] font-bold text-emerald-400">
        {time}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold">
          {name}
        </p>
        <p className="mt-0.5 truncate text-[8px] text-zinc-600">
          {service}
        </p>
      </div>

      <span className="h-2 w-2 rounded-full bg-emerald-400" />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-400">
        {eyebrow}
      </p>

      <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
        {title}
      </h2>

      {description ? (
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="group rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/20 hover:bg-emerald-400/[0.025] sm:p-7">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-400 transition group-hover:bg-emerald-400 group-hover:text-zinc-950">
        {icon}
      </div>

      <h3 className="mt-6 text-lg font-bold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-zinc-500">
        {text}
      </p>
    </div>
  );
}

function Benefit({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] text-xs font-black text-emerald-400">
        {number}
      </div>

      <div>
        <h3 className="font-bold">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {text}
        </p>
      </div>
    </div>
  );
}

function ScheduleItem({
  time,
  customer,
  service,
  professional,
  status,
}: {
  time: string;
  customer: string;
  service: string;
  professional: string;
  status: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 sm:flex-row sm:items-center">
      <div className="w-fit rounded-xl bg-emerald-400/10 px-3 py-2 text-sm font-black text-emerald-400">
        {time}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {customer}
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          {service} • {professional}
        </p>
      </div>

      <span className="w-fit rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold text-zinc-400">
        {status}
      </span>
    </div>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold">
        {value}
      </p>
    </div>
  );
}

function AudienceCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-6 sm:p-9">
      <h3 className="text-2xl font-black">
        {title}
      </h3>

      <p className="mt-3 max-w-xl leading-7 text-zinc-500">
        {description}
      </p>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3"
          >
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
              <CheckIcon />
            </span>

            <span className="text-sm text-zinc-300">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  featured,
}: {
  plan: SaasPlan;
  featured: boolean;
}) {
  const professionalText =
    plan.maxProfessionals > 0
      ? `Até ${plan.maxProfessionals} ${
          plan.maxProfessionals === 1
            ? "profissional"
            : "profissionais"
        }`
      : "Profissionais ilimitados";

  const serviceText =
    plan.maxServices > 0
      ? `Até ${plan.maxServices} serviços`
      : "Serviços ilimitados";

  return (
    <div
      className={`relative flex flex-col rounded-[28px] p-6 sm:p-8 ${
        featured
          ? "border border-emerald-400/40 bg-emerald-400/[0.06] shadow-2xl shadow-emerald-500/5"
          : "border border-white/[0.08] bg-[#0a0d0b]"
      }`}
    >
      {featured ? (
        <span className="absolute right-5 top-5 rounded-full bg-emerald-400 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-950">
          Destaque
        </span>
      ) : null}

      <div>
        <p className="text-lg font-black">
          {plan.name}
        </p>

        <p className="mt-3 min-h-[48px] text-sm leading-6 text-zinc-500">
          {plan.description ||
            "Uma solução completa para organizar sua rotina de atendimentos."}
        </p>
      </div>

      <div className="mt-7">
        <div className="flex items-end gap-1.5">
          <span className="text-3xl font-black sm:text-4xl">
            {formatMoney(plan.price)}
          </span>

          <span className="pb-1 text-sm text-zinc-500">
            {plan.billingCycle === "yearly"
              ? "/ano"
              : "/mês"}
          </span>
        </div>
      </div>

      <div className="my-7 h-px bg-white/[0.07]" />

      <div className="flex-1 space-y-3">
        <PlanItem text="Agenda online" />
        <PlanItem text="Gestão de clientes" />
        <PlanItem text="Página pública personalizada" />
        <PlanItem text={professionalText} />
        <PlanItem text={serviceText} />
      </div>

      <a
        href="#contratar"
        className={`mt-8 inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-bold transition ${
          featured
            ? "bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
            : "border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
        }`}
      >
        Quero este plano
      </a>
    </div>
  );
}

function PlanItem({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
        <CheckIcon />
      </span>

      <span className="text-sm text-zinc-300">
        {text}
      </span>
    </div>
  );
}

function Faq({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-bold">
        {question}

        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500 transition group-open:rotate-45 group-open:text-emerald-400">
          +
        </span>
      </summary>

      <p className="mt-4 max-w-3xl pr-10 text-sm leading-6 text-zinc-500">
        {answer}
      </p>
    </details>
  );
}

function Footer() {
  return (
    <footer
      id="contratar"
      className="border-t border-white/[0.06]"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <LogoMark />

              <div>
                <p className="font-black">
                  VELLTO
                </p>

                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
                  Agenda & Gestão
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-md text-sm leading-6 text-zinc-500">
              Tecnologia para organizar atendimentos, melhorar a experiência
              dos seus clientes e profissionalizar a gestão do seu negócio.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold">
              Produto
            </p>

            <div className="mt-4 space-y-3 text-sm text-zinc-500">
              <a
                href="#recursos"
                className="block transition hover:text-white"
              >
                Recursos
              </a>

              <a
                href="#como-funciona"
                className="block transition hover:text-white"
              >
                Como funciona
              </a>

              <a
                href="#planos"
                className="block transition hover:text-white"
              >
                Planos
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold">
              Acesso
            </p>

            <div className="mt-4 space-y-3 text-sm text-zinc-500">
              <a
                href="/login"
                className="block transition hover:text-white"
              >
                Entrar no painel
              </a>

              <a
                href="#faq"
                className="block transition hover:text-white"
              >
                Dúvidas frequentes
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.06] pt-7 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Vellto Agenda. Todos os direitos reservados.
          </p>

          <p>
            Gestão inteligente para negócios de atendimento.
          </p>
        </div>
      </div>
    </footer>
  );
}

function CheckMini({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-emerald-400">
        <CheckIcon />
      </span>

      <span>{text}</span>
    </div>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4M16 2v4M3 10h18" />
      <rect x="3" y="4" width="18" height="18" rx="3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ScissorsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="7" r="3" />
      <circle cx="6" cy="17" r="3" />
      <path d="m8.7 8.3 12.3 6.2M8.7 15.7 21 9.5" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m17 1 4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="m7 23-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="m7 16 4-5 4 3 5-7" />
    </svg>
  );
}
