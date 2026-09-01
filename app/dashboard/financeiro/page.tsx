"use client";

import { useEffect, useMemo, useState } from "react";

type Appointment = {
  _id: string;
  clientName?: string;
  serviceName?: string;
  professionalName?: string;
  date?: string;
  time?: string;
  price?: number;
  status?: string;
};

export default function FinanceiroPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    loadFinance();
  }, [period]);

  async function loadFinance() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `/api/dashboard/finance?days=${period}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Erro ao carregar financeiro"
        );
        return;
      }

      setAppointments(data.appointments || []);
    } catch (error) {
      console.error(error);

      setMessage("Erro ao carregar financeiro");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const completed = appointments.filter(
      (item) =>
        item.status === "concluido" ||
        item.status === "completed"
    );

    const cancelled = appointments.filter(
      (item) =>
        item.status === "cancelado" ||
        item.status === "cancelled"
    );

    const noShow = appointments.filter(
      (item) =>
        item.status === "faltou" ||
        item.status === "no_show"
    );

    const revenue = completed.reduce(
      (total, item) =>
        total + Number(item.price || 0),
      0
    );

    const ticket =
      completed.length > 0
        ? revenue / completed.length
        : 0;

    return {
      completed: completed.length,
      cancelled: cancelled.length,
      noShow: noShow.length,
      revenue,
      ticket,
    };
  }, [appointments]);

  const completedAppointments = useMemo(() => {
    return appointments
      .filter(
        (item) =>
          item.status === "concluido" ||
          item.status === "completed"
      )
      .sort((a, b) => {
        const dateA = `${a.date || ""} ${a.time || ""}`;
        const dateB = `${b.date || ""} ${b.time || ""}`;

        return dateB.localeCompare(dateA);
      });
  }, [appointments]);

  const professionalSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        appointments: number;
        revenue: number;
      }
    >();

    for (const item of completedAppointments) {
      const name =
        item.professionalName || "Sem profissional";

      const current = map.get(name) || {
        name,
        appointments: 0,
        revenue: 0,
      };

      current.appointments += 1;
      current.revenue += Number(item.price || 0);

      map.set(name, current);
    }

    return Array.from(map.values()).sort(
      (a, b) => b.revenue - a.revenue
    );
  }, [completedAppointments]);

  return (
    <main className="min-h-screen">
      {/* CABEÇALHO */}
      <div className="border-b border-white/10 bg-[#09131d]/70 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Painel da empresa
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Financeiro
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Acompanhe faturamento, ticket médio e desempenho dos atendimentos.
            </p>
          </div>

          <select
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value)
            }
            className="rounded-xl border border-white/10 bg-[#0b1620] px-4 py-3 text-sm outline-none focus:border-emerald-500"
          >
            <option value="7">
              Últimos 7 dias
            </option>

            <option value="30">
              Últimos 30 dias
            </option>

            <option value="90">
              Últimos 90 dias
            </option>

            <option value="365">
              Últimos 12 meses
            </option>
          </select>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        {/* MÉTRICAS */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Faturamento"
            value={money(stats.revenue)}
            detail="Somente concluídos"
          />

          <StatCard
            label="Atendimentos"
            value={stats.completed}
            detail="Concluídos no período"
          />

          <StatCard
            label="Ticket médio"
            value={money(stats.ticket)}
            detail="Média por atendimento"
          />

          <StatCard
            label="Cancelados"
            value={stats.cancelled}
            detail="Não entram no faturamento"
          />

          <StatCard
            label="Faltas"
            value={stats.noShow}
            detail="Clientes que não compareceram"
          />
        </div>

        {message ? (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {message}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
          {/* HISTÓRICO */}
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="border-b border-white/10 p-4 sm:p-5">
              <h2 className="font-bold">
                Receitas recentes
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Atendimentos concluídos no período selecionado.
              </p>
            </div>

            {loading ? (
              <EmptyState
                title="Carregando financeiro..."
                description="Aguarde enquanto buscamos os dados."
              />
            ) : completedAppointments.length === 0 ? (
              <EmptyState
                title="Nenhuma receita encontrada"
                description="Os atendimentos concluídos aparecerão aqui."
              />
            ) : (
              <div className="divide-y divide-white/5">
                {completedAppointments.map((item) => (
                  <div
                    key={item._id}
                    className="grid gap-4 p-5 transition hover:bg-white/[0.02] md:grid-cols-[1fr_1fr_120px] md:items-center"
                  >
                    <div>
                      <p className="font-semibold">
                        {item.clientName || "Cliente"}
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        {item.serviceName || "Serviço"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-300">
                        {item.professionalName || "Profissional"}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {formatDate(item.date)}{" "}
                        {item.time ? `• ${item.time}` : ""}
                      </p>
                    </div>

                    <div className="md:text-right">
                      <p className="font-bold text-emerald-400">
                        {money(Number(item.price || 0))}
                      </p>

                      <span className="mt-1 inline-block rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                        Concluído
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* PROFISSIONAIS */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="border-b border-white/10 p-4 sm:p-5">
              <h2 className="font-bold">
                Desempenho por profissional
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Produção no período.
              </p>
            </div>

            {professionalSummary.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                Nenhum dado disponível.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {professionalSummary.map(
                  (professional, index) => (
                    <div
                      key={professional.name}
                      className="p-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-bold text-emerald-400">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">
                            {professional.name}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            {professional.appointments} atendimento
                            {professional.appointments === 1
                              ? ""
                              : "s"}
                          </p>
                        </div>

                        <p className="font-bold text-emerald-400">
                          {money(professional.revenue)}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </div>

        {/* RESUMO */}
        <section className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Regra financeira
          </p>

          <h2 className="mt-2 text-lg font-bold">
            Apenas atendimentos concluídos entram no faturamento
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            Agendamentos pendentes, confirmados, cancelados ou marcados como
            falta não são contabilizados como receita.
          </p>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <p className="text-sm text-zinc-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold tracking-tight">
        {value}
      </p>

      {detail ? (
        <p className="mt-3 text-xs text-emerald-400">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-xl">
        $
      </div>

      <h3 className="mt-4 font-semibold">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const parts = value.split("-");

  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return value;
}