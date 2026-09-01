"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

type Appointment = {
  id: string;
  serviceName: string;
  professionalName: string;
  date: string;
  time: string;
  endTime: string;
  duration: number;
  price: number;
  status: string;
  notes: string;
  hasActiveMembership: boolean;
  membershipPlanName: string;
  membershipUsageConsumed: boolean;
  isUpcoming: boolean;
};

type Membership = {
  id: string;
  planName: string;
  price: number;
  totalUses: number;
  usedUses: number;
  remainingUses: number;
  validityDays: number;
  startDate: string;
  expiresAt: string;
  active: boolean;
  paymentMethod: string;
  paymentStatus: string;
  displayPaymentStatus: string;
  paymentAmount: number;
  paymentDueDate: string;
  paymentPaidAt: string | null;
  isExpired: boolean;
  isPaymentOverdue: boolean;
};

type Overview = {
  ok: boolean;

  business: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string;
    primaryColor: string;
    address: string;
  };

  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
    photoUrl: string;
  };

  client: {
    id: string;
    name: string;
    phone: string;
    email: string;
  } | null;

  appointments:
    Appointment[];

  upcomingAppointments:
    Appointment[];

  appointmentHistory:
    Appointment[];

  membership:
    Membership | null;

  memberships:
    Membership[];
};

type Tab =
  | "inicio"
  | "agendamentos"
  | "historico"
  | "plano";

export default function CustomerAreaClient({
  slug,
}: {
  slug: string;
}) {
  const [
    data,
    setData,
  ] =
    useState<Overview | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    tab,
    setTab,
  ] =
    useState<Tab>(
      "inicio"
    );

  useEffect(() => {
    load();
  }, [slug]);

  async function load() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `/api/customer/${slug}/overview`,
          {
            cache:
              "no-store",
          }
        );

      const body =
        await response.json();

      if (!response.ok) {
        throw new Error(
          body.message ||
            "Erro ao carregar sua conta"
        );
      }

      setData(body);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar sua conta"
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-emerald-400" />

            <p className="text-sm text-zinc-400">
              Carregando sua
              conta...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (
    error ||
    !data
  ) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-5">
          <div className="w-full rounded-3xl border border-red-500/20 bg-zinc-900 p-8 text-center">
            <div className="mb-4 text-4xl">
              ⚠️
            </div>

            <h1 className="text-xl font-semibold">
              Não foi possível
              carregar sua conta
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              {error}
            </p>

            <button
              type="button"
              onClick={load}
              className="mt-6 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-black transition hover:bg-emerald-400"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </main>
    );
  }

  const business =
    data.business;

  const customer =
    data.customer;

  const membership =
    data.membership;

  const nextAppointment =
    data
      .upcomingAppointments[0] ||
    null;

  const firstName =
    customer.name
      ?.trim()
      .split(" ")[0] ||
    "Cliente";

  return (
    <main className="min-h-screen bg-zinc-950 pb-28 text-white">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href={`/${slug}`}
            className="flex min-w-0 items-center gap-3"
          >
            {business.logoUrl ? (
              <img
                src={
                  business.logoUrl
                }
                alt={
                  business.name
                }
                className="h-10 w-10 rounded-xl border border-white/10 object-cover"
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-black"
                style={{
                  backgroundColor:
                    business.primaryColor ||
                    "#10b981",
                }}
              >
                {business.name
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate font-semibold">
                {business.name}
              </p>

              <p className="text-xs text-zinc-500">
                Área do cliente
              </p>
            </div>
          </Link>

          <Link
            href={`/${slug}/agendar`}
            className="hidden rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 sm:block"
          >
            + Agendar horário
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        <section className="mb-8">
          <p className="text-sm font-medium text-emerald-400">
            Minha conta
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Olá, {firstName} 👋
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            Acompanhe seus
            agendamentos e seu
            plano em um só lugar.
          </p>
        </section>

        <nav className="mb-8 flex gap-2 overflow-x-auto pb-2">
          <TabButton
            active={
              tab ===
              "inicio"
            }
            onClick={() =>
              setTab(
                "inicio"
              )
            }
          >
            Início
          </TabButton>

          <TabButton
            active={
              tab ===
              "agendamentos"
            }
            onClick={() =>
              setTab(
                "agendamentos"
              )
            }
          >
            Agendamentos
          </TabButton>

          <TabButton
            active={
              tab ===
              "historico"
            }
            onClick={() =>
              setTab(
                "historico"
              )
            }
          >
            Histórico
          </TabButton>

          <TabButton
            active={
              tab === "plano"
            }
            onClick={() =>
              setTab(
                "plano"
              )
            }
          >
            Meu plano
          </TabButton>
        </nav>

        {tab === "inicio" && (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6 lg:col-span-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Próximo
                      agendamento
                    </p>

                    {nextAppointment ? (
                      <>
                        <h2 className="mt-4 text-2xl font-semibold">
                          {
                            nextAppointment.serviceName
                          }
                        </h2>

                        <p className="mt-2 text-zinc-400">
                          com{" "}
                          {
                            nextAppointment.professionalName
                          }
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className="mt-4 text-2xl font-semibold">
                          Nenhum horário
                          marcado
                        </h2>

                        <p className="mt-2 text-zinc-400">
                          Quando você
                          agendar, seu
                          próximo horário
                          aparecerá aqui.
                        </p>
                      </>
                    )}
                  </div>

                  <div className="rounded-2xl bg-emerald-500/10 p-3 text-2xl">
                    📅
                  </div>
                </div>

                {nextAppointment && (
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <InfoBox
                      label="Data"
                      value={formatDate(
                        nextAppointment.date
                      )}
                    />

                    <InfoBox
                      label="Horário"
                      value={
                        nextAppointment.time ||
                        "--:--"
                      }
                    />

                    <InfoBox
                      label="Status"
                      value={statusLabel(
                        nextAppointment.status
                      )}
                    />
                  </div>
                )}

                <Link
                  href={`/${slug}/agendar`}
                  className="mt-6 inline-flex rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
                >
                  {nextAppointment
                    ? "Agendar outro horário"
                    : "Agendar agora"}
                </Link>
              </div>

              <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Meu plano
                </p>

                {membership ? (
                  <>
                    <h2 className="mt-4 text-xl font-semibold">
                      {
                        membership.planName
                      }
                    </h2>

                    <div className="mt-5">
                      <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold">
                          {
                            membership.remainingUses
                          }
                        </span>

                        <span className="pb-1 text-sm text-zinc-500">
                          de{" "}
                          {
                            membership.totalUses
                          }{" "}
                          restantes
                        </span>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-all"
                          style={{
                            width: `${usagePercentage(
                              membership
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <PaymentBadge
                        membership={
                          membership
                        }
                      />
                    </div>

                    {membership.expiresAt && (
                      <p className="mt-4 text-xs text-zinc-500">
                        Validade até{" "}
                        {formatDate(
                          membership.expiresAt
                        )}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="mt-4 text-xl font-semibold">
                      Sem plano ativo
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Você ainda não
                      possui uma
                      mensalidade
                      vinculada a este
                      estabelecimento.
                    </p>
                  </>
                )}
              </div>
            </div>

            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">
                    Próximos
                    agendamentos
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Seus horários
                    marcados.
                  </p>
                </div>

                {data
                  .upcomingAppointments
                  .length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setTab(
                        "agendamentos"
                      )
                    }
                    className="text-sm font-medium text-emerald-400"
                  >
                    Ver todos
                  </button>
                )}
              </div>

              {data
                .upcomingAppointments
                .length === 0 ? (
                <EmptyState
                  icon="✂️"
                  title="Nenhum agendamento futuro"
                  description="Escolha seu próximo horário quando quiser."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.upcomingAppointments
                    .slice(0, 2)
                    .map(
                      (
                        appointment
                      ) => (
                        <AppointmentCard
                          key={
                            appointment.id
                          }
                          appointment={
                            appointment
                          }
                        />
                      )
                    )}
                </div>
              )}
            </section>
          </div>
        )}

        {tab ===
          "agendamentos" && (
          <section>
            <SectionTitle
              title="Meus agendamentos"
              description="Confira todos os seus próximos horários."
            />

            {data
              .upcomingAppointments
              .length === 0 ? (
              <EmptyState
                icon="📅"
                title="Nenhum agendamento futuro"
                description="Você ainda não possui horários marcados."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.upcomingAppointments.map(
                  (
                    appointment
                  ) => (
                    <AppointmentCard
                      key={
                        appointment.id
                      }
                      appointment={
                        appointment
                      }
                    />
                  )
                )}
              </div>
            )}
          </section>
        )}

        {tab ===
          "historico" && (
          <section>
            <SectionTitle
              title="Histórico"
              description="Veja seus agendamentos anteriores."
            />

            {data
              .appointmentHistory
              .length === 0 ? (
              <EmptyState
                icon="🕒"
                title="Seu histórico está vazio"
                description="Seus atendimentos anteriores aparecerão aqui."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.appointmentHistory.map(
                  (
                    appointment
                  ) => (
                    <AppointmentCard
                      key={
                        appointment.id
                      }
                      appointment={
                        appointment
                      }
                    />
                  )
                )}
              </div>
            )}
          </section>
        )}

        {tab === "plano" && (
          <section>
            <SectionTitle
              title="Meu plano"
              description="Acompanhe sua mensalidade e seus usos."
            />

            {membership ? (
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-zinc-900 p-7 lg:col-span-2">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-emerald-400">
                        Plano atual
                      </p>

                      <h2 className="mt-2 text-3xl font-bold">
                        {
                          membership.planName
                        }
                      </h2>
                    </div>

                    <PaymentBadge
                      membership={
                        membership
                      }
                    />
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <StatBox
                      value={String(
                        membership.totalUses
                      )}
                      label="Cortes do plano"
                    />

                    <StatBox
                      value={String(
                        membership.usedUses
                      )}
                      label="Cortes utilizados"
                    />

                    <StatBox
                      value={String(
                        membership.remainingUses
                      )}
                      label="Cortes restantes"
                      highlight
                    />
                  </div>

                  <div className="mt-7">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-zinc-400">
                        Utilização
                      </span>

                      <span className="font-medium">
                        {
                          membership.usedUses
                        }
                        /
                        {
                          membership.totalUses
                        }
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{
                          width: `${usedPercentage(
                            membership
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
                  <p className="text-sm font-semibold">
                    Mensalidade
                  </p>

                  <div className="mt-5 space-y-4">
                    <DetailRow
                      label="Valor"
                      value={formatMoney(
                        membership.paymentAmount ||
                          membership.price
                      )}
                    />

                    <DetailRow
                      label="Vencimento"
                      value={
                        membership.paymentDueDate
                          ? formatDate(
                              membership.paymentDueDate
                            )
                          : "—"
                      }
                    />

                    <DetailRow
                      label="Validade do plano"
                      value={
                        membership.expiresAt
                          ? formatDate(
                              membership.expiresAt
                            )
                          : "—"
                      }
                    />

                    <DetailRow
                      label="Forma de pagamento"
                      value={paymentMethodLabel(
                        membership.paymentMethod
                      )}
                    />
                  </div>

                  {membership.displayPaymentStatus !==
                    "paid" && (
                    <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <p className="text-sm font-semibold text-amber-300">
                        Pagamento
                        pendente
                      </p>

                      <p className="mt-1 text-xs leading-5 text-zinc-400">
                        A confirmação
                        do pagamento
                        precisa ser
                        realizada pelo
                        estabelecimento
                        ou por uma
                        cobrança
                        integrada.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                icon="💳"
                title="Você não possui um plano ativo"
                description="Quando um plano mensal for contratado, seus cortes e pagamentos aparecerão aqui."
              />
            )}
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/95 p-3 backdrop-blur-xl sm:hidden">
        <Link
          href={`/${slug}/agendar`}
          className="flex w-full items-center justify-center rounded-xl bg-emerald-500 px-5 py-3.5 font-semibold text-black"
        >
          + Agendar horário
        </Link>
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-white text-black"
          : "border border-white/10 bg-zinc-900 text-zinc-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function AppointmentCard({
  appointment,
}: {
  appointment:
    Appointment;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-zinc-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">
            {
              appointment.serviceName
            }
          </h3>

          <p className="mt-1 text-sm text-zinc-400">
            {
              appointment.professionalName
            }
          </p>
        </div>

        <StatusBadge
          status={
            appointment.status
          }
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <InfoBox
          label="Data"
          value={formatDate(
            appointment.date
          )}
        />

        <InfoBox
          label="Horário"
          value={
            appointment.time ||
            "--:--"
          }
        />
      </div>

      {appointment.hasActiveMembership && (
        <div className="mt-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300">
          ✓ Vinculado ao plano{" "}
          {appointment.membershipPlanName
            ? `• ${appointment.membershipPlanName}`
            : ""}
        </div>
      )}
    </article>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-black/25 p-3">
      <p className="text-xs text-zinc-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function StatBox({
  value,
  label,
  highlight = false,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? "border-emerald-500/20 bg-emerald-500/10"
          : "border-white/10 bg-black/20"
      }`}
    >
      <p
        className={`text-3xl font-bold ${
          highlight
            ? "text-emerald-400"
            : ""
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-500">
        {label}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
      <span className="text-sm text-zinc-500">
        {label}
      </span>

      <span className="text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold">
        {title}
      </h2>

      <p className="mt-1 text-sm text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-900/60 p-10 text-center">
      <div className="text-4xl">
        {icon}
      </div>

      <h3 className="mt-4 text-lg font-semibold">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status
      .toLowerCase()
      .trim();

  let classes =
    "border-amber-500/20 bg-amber-500/10 text-amber-300";

  if (
    [
      "confirmado",
      "confirmed",
    ].includes(
      normalized
    )
  ) {
    classes =
      "border-blue-500/20 bg-blue-500/10 text-blue-300";
  }

  if (
    [
      "concluido",
      "concluído",
      "completed",
      "finalizado",
    ].includes(
      normalized
    )
  ) {
    classes =
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (
    [
      "cancelado",
      "cancelled",
      "faltou",
    ].includes(
      normalized
    )
  ) {
    classes =
      "border-red-500/20 bg-red-500/10 text-red-300";
  }

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}
    >
      {statusLabel(
        status
      )}
    </span>
  );
}

function PaymentBadge({
  membership,
}: {
  membership:
    Membership;
}) {
  if (
    membership.displayPaymentStatus ===
    "paid"
  ) {
    return (
      <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
        ✓ Mensalidade paga
      </span>
    );
  }

  if (
    membership.displayPaymentStatus ===
    "overdue"
  ) {
    return (
      <span className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
        Mensalidade vencida
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
      Pagamento pendente
    </span>
  );
}

function usagePercentage(
  membership:
    Membership
) {
  if (
    membership.totalUses <=
    0
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      (membership.remainingUses /
        membership.totalUses) *
        100
    )
  );
}

function usedPercentage(
  membership:
    Membership
) {
  if (
    membership.totalUses <=
    0
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      (membership.usedUses /
        membership.totalUses) *
        100
    )
  );
}

function formatDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  const parts =
    value.split("-");

  if (
    parts.length !== 3
  ) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatMoney(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(
    Number(value || 0)
  );
}

function statusLabel(
  status: string
) {
  const normalized =
    status
      .toLowerCase()
      .trim();

  const labels: Record<
    string,
    string
  > = {
    pendente:
      "Pendente",
    confirmado:
      "Confirmado",
    confirmed:
      "Confirmado",
    concluido:
      "Concluído",
    "concluído":
      "Concluído",
    completed:
      "Concluído",
    finalizado:
      "Concluído",
    cancelado:
      "Cancelado",
    cancelled:
      "Cancelado",
    faltou:
      "Não compareceu",
  };

  return (
    labels[normalized] ||
    status ||
    "Pendente"
  );
}

function paymentMethodLabel(
  method: string
) {
  const labels: Record<
    string,
    string
  > = {
    pix: "PIX",
    cash: "Dinheiro",
    card: "Cartão",
    later: "A combinar",
  };

  return (
    labels[method] ||
    method ||
    "—"
  );
}
