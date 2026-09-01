export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <div className="max-w-3xl">
          <span className="mb-6 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
            Gestão para negócios de atendimento
          </span>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Seu negócio organizado.
            <span className="block text-emerald-400">
              Seus clientes mais perto.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            Agenda, clientes, profissionais, serviços, planos, pagamentos e
            página personalizada em um único sistema.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400">
              Começar agora
            </button>

            <button className="rounded-xl border border-white/15 px-6 py-3 font-semibold transition hover:bg-white/5">
              Já sou cliente
            </button>
          </div>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Agendamento online",
            "Gestão de clientes",
            "Profissionais e serviços",
            "Página personalizada",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="mb-4 h-10 w-10 rounded-xl bg-emerald-500/20" />
              <h2 className="font-semibold">{item}</h2>
            </div>
          ))}
        </div>

        <p className="mt-16 text-sm text-zinc-500">
          Barbearias • Salões • Manicures • Academias • Clínicas • Pet shops
        </p>
      </section>
    </main>
  );
}