"use client";

import {
  useEffect,
  useState,
} from "react";

type Subscription = {
  businessId: string;
  plan: string;
  planName: string;
  price: number;
  billingCycle: string;
  billingStatus: string;
  trialEndsAt: string;
  subscriptionEndsAt: string;
  mercadoPagoSubscriptionId: string;
};

type Payment = {
  id: string;
  externalId: string;
  status: string;
  amount: number;
  paidAt: string | null;
  createdAt: string | null;
};

export default function AssinaturaPage() {
  const [
    subscription,
    setSubscription,
  ] =
    useState<Subscription | null>(
      null
    );

  const [
    payments,
    setPayments,
  ] =
    useState<Payment[]>(
      []
    );

  const [
    configured,
    setConfigured,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    paying,
    setPaying,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(
        true
      );

      const response =
        await fetch(
          "/api/dashboard/subscription",
          {
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        setMessage(
          data.message ||
            "Erro ao carregar assinatura."
        );
        return;
      }

      setSubscription(
        data.subscription
      );

      setPayments(
        Array.isArray(
          data.payments
        )
          ? data.payments
          : []
      );

      setConfigured(
        data.configured ===
          true
      );
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "Erro ao carregar assinatura."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  async function subscribe() {
    try {
      setPaying(true);
      setMessage("");

      const response =
        await fetch(
          "/api/dashboard/subscription/checkout",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                plan:
                  subscription?.plan,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        setMessage(
          data.message ||
            "Erro ao iniciar pagamento."
        );
        return;
      }

      if (
        data.checkoutUrl
      ) {
        window.location.href =
          data.checkoutUrl;
      }
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "Erro ao iniciar pagamento."
      );
    } finally {
      setPaying(false);
    }
  }

  if (
    loading
  ) {
    return (
      <main className="p-6">
        Carregando assinatura...
      </main>
    );
  }

  if (
    !subscription
  ) {
    return (
      <main className="p-6">
        Não foi possível carregar sua assinatura.
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="border-b border-[var(--vellto-border)] bg-[var(--vellto-surface)] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1300px]">
          <p className="text-sm text-[var(--vellto-text-muted)]">
            Vellto Agenda
          </p>

          <h1 className="mt-1 text-2xl font-black">
            Minha assinatura
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-[var(--vellto-text-secondary)]">
            Consulte seu plano, situação da cobrança e histórico de pagamentos.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1300px] px-4 py-6 sm:px-6 lg:px-8">
        {message ? (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
            {message}
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-3">
          <section className="rounded-2xl border border-[var(--vellto-border)] bg-[var(--vellto-surface)] p-6 lg:col-span-2">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--vellto-text-muted)]">
                  Plano atual
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {
                    subscription.planName
                  }
                </h2>

                <p className="mt-2 text-[var(--vellto-text-secondary)]">
                  {money(
                    subscription.price
                  )}
                  {subscription.billingCycle ===
                  "yearly"
                    ? "/ano"
                    : "/mês"}
                </p>
              </div>

              <StatusBadge
                status={
                  subscription.billingStatus
                }
              />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Info
                label="Fim do período de teste"
                value={
                  subscription.trialEndsAt
                    ? formatDate(
                        subscription.trialEndsAt
                      )
                    : "—"
                }
              />

              <Info
                label="Assinatura válida até"
                value={
                  subscription.subscriptionEndsAt
                    ? formatDate(
                        subscription.subscriptionEndsAt
                      )
                    : "Gerenciada pelo Mercado Pago"
                }
              />
            </div>

            <div className="mt-6">
              {!configured ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400">
                  Mercado Pago ainda não está configurado no servidor.
                </div>
              ) : (
                <button
                  type="button"
                  disabled={
                    paying
                  }
                  onClick={
                    subscribe
                  }
                  className="rounded-xl bg-[var(--vellto-primary)] px-6 py-3 font-black text-[var(--vellto-on-primary)] disabled:opacity-50"
                >
                  {paying
                    ? "Abrindo pagamento..."
                    : subscription.billingStatus ===
                        "active"
                      ? "Gerar nova assinatura"
                      : "Regularizar assinatura"}
                </button>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--vellto-border)] bg-[var(--vellto-surface)] p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--vellto-text-muted)]">
              Situação
            </p>

            <div className="mt-5 space-y-4">
              <Info
                label="Plano"
                value={
                  subscription.plan
                }
              />

              <Info
                label="Cobrança"
                value={
                  statusLabel(
                    subscription.billingStatus
                  )
                }
              />

              <Info
                label="Recorrência"
                value={
                  subscription.billingCycle ===
                  "yearly"
                    ? "Anual"
                    : "Mensal"
                }
              />
            </div>
          </section>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--vellto-border)] bg-[var(--vellto-surface)]">
          <div className="border-b border-[var(--vellto-border)] p-5">
            <h2 className="font-black">
              Histórico de pagamentos
            </h2>
          </div>

          {payments.length ===
          0 ? (
            <div className="p-8 text-center text-[var(--vellto-text-muted)]">
              Nenhum pagamento registrado ainda.
            </div>
          ) : (
            <div className="divide-y divide-[var(--vellto-border)]">
              {payments.map(
                (
                  payment
                ) => (
                  <div
                    key={
                      payment.id
                    }
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-bold">
                        {money(
                          payment.amount
                        )}
                      </p>

                      <p className="mt-1 text-xs text-[var(--vellto-text-muted)]">
                        {payment.paidAt
                          ? new Date(
                              payment.paidAt
                            ).toLocaleString(
                              "pt-BR"
                            )
                          : "Pagamento ainda não confirmado"}
                      </p>
                    </div>

                    <span className="rounded-full border border-[var(--vellto-border)] px-3 py-1 text-xs font-bold">
                      {
                        payment.status
                      }
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span className="inline-flex w-fit rounded-full border border-[var(--vellto-border)] px-4 py-2 text-sm font-bold">
      {statusLabel(
        status
      )}
    </span>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--vellto-border)] bg-[var(--vellto-surface-2)] p-4">
      <p className="text-xs text-[var(--vellto-text-muted)]">
        {label}
      </p>

      <p className="mt-1 font-bold">
        {value}
      </p>
    </div>
  );
}

function statusLabel(
  value: string
) {
  const map:
    Record<
      string,
      string
    > = {
      trial:
        "Período de teste",

      active:
        "Em dia",

      past_due:
        "Pagamento pendente",

      cancelled:
        "Cancelada",
    };

  return map[value] ||
    value;
}

function money(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    }
  ).format(
    value ||
      0
  );
}

function formatDate(
  value: string
) {
  const [
    year,
    month,
    day,
  ] =
    value.split(
      "-"
    );

  return `${day}/${month}/${year}`;
}
