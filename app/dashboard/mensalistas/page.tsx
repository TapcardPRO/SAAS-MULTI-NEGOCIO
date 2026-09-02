"use client";

import { useEffect, useMemo, useState } from "react";

type Membership = {
  _id: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;

  planId?: string;
  planName?: string;

  price?: number;

  totalUses?: number;
  usedUses?: number;
  remainingUses?: number;

  startDate?: string;
  expiresAt?: string;

  active?: boolean;

  paymentStatus?: string;
  paymentMethod?: string;
  paymentAmount?: number;
  paymentDueDate?: string;
};

type Client = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
};

type Plan = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  totalUses: number;
  validityDays: number;
  active: boolean;
};

type PaymentMethod =
  | "pix"
  | "cash"
  | "card"
  | "later";

type PaymentStatus =
  | "pending"
  | "paid";

export default function MensalistasPage() {
  const [memberships, setMemberships] =
    useState<Membership[]>([]);

  const [clients, setClients] =
    useState<Client[]>([]);

  const [plans, setPlans] =
    useState<Plan[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [openingForm, setOpeningForm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [
    viewerRole,
    setViewerRole,
  ] = useState<string | null>(
    null
  );

  const [clientId, setClientId] =
    useState("");

  const [planId, setPlanId] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("pix");

  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>("pending");

  const [paymentDueDate, setPaymentDueDate] =
    useState("");

  useEffect(() => {
    loadMemberships();
  }, []);

  async function loadMemberships() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        "/api/dashboard/memberships",
        {
          cache: "no-store",
        }
      );

      const data =
        await readJsonResponse(response);

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao carregar mensalistas"
        );
        return;
      }

      setMemberships(
        data.memberships || []
      );

      setViewerRole(
        data.viewer?.role ||
          "owner"
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar mensalistas"
      );
    } finally {
      setLoading(false);
    }
  }

  async function openNewMembership() {
    try {
      setOpeningForm(true);
      setMessage("");
      setSuccess("");

      const clientsResponse =
        await fetch(
          "/api/dashboard/clients",
          {
            cache: "no-store",
          }
        );

      const clientsData =
        await readJsonResponse(
          clientsResponse
        );

      if (!clientsResponse.ok) {
        setMessage(
          clientsData.message ||
            "Erro ao carregar clientes"
        );
        return;
      }

      const plansResponse =
        await fetch(
          "/api/dashboard/plans",
          {
            cache: "no-store",
          }
        );

      const plansData =
        await readJsonResponse(
          plansResponse
        );

      if (!plansResponse.ok) {
        setMessage(
          plansData.message ||
            "Erro ao carregar planos"
        );
        return;
      }

      const clientList =
        clientsData.clients || [];

      const planList: Plan[] =
        (plansData.plans || []).filter(
          (plan: Plan) =>
            plan.active !== false
        );

      setClients(clientList);
      setPlans(planList);

      const currentDate = today();

      setClientId("");
      setPlanId("");
      setStartDate(currentDate);

      setPaymentMethod("pix");
      setPaymentStatus("pending");
      setPaymentDueDate(currentDate);

      setShowForm(true);
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao abrir cadastro de mensalista"
      );
    } finally {
      setOpeningForm(false);
    }
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setClientId("");
    setPlanId("");
    setStartDate("");
    setPaymentDueDate("");
  }

  async function createMembership() {
    if (!clientId) {
      setMessage(
        "Selecione um cliente."
      );
      return;
    }

    if (!planId) {
      setMessage(
        "Selecione um plano."
      );
      return;
    }

    if (!startDate) {
      setMessage(
        "Informe a data de início."
      );
      return;
    }

    if (
      paymentStatus === "pending" &&
      !paymentDueDate
    ) {
      setMessage(
        "Informe o vencimento do pagamento."
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setSuccess("");

      const response = await fetch(
        "/api/dashboard/memberships",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            clientId,
            planId,
            startDate,
            paymentMethod,
            paymentStatus,
            paymentDueDate,
          }),
        }
      );

      const data =
        await readJsonResponse(response);

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao cadastrar mensalista"
        );
        return;
      }

      setShowForm(false);

      setSuccess(
        "Mensalista cadastrado com sucesso."
      );

      await loadMemberships();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao cadastrar mensalista"
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedPlan =
    useMemo(() => {
      return plans.find(
        (plan) =>
          plan._id === planId
      );
    }, [plans, planId]);

  const selectedClient =
    useMemo(() => {
      return clients.find(
        (client) =>
          client._id === clientId
      );
    }, [clients, clientId]);

  const expiresAt =
    useMemo(() => {
      if (
        !selectedPlan ||
        !startDate
      ) {
        return "";
      }

      return addDays(
        startDate,
        selectedPlan.validityDays
      );
    }, [
      selectedPlan,
      startDate,
    ]);

  const filtered =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return memberships;
      }

      return memberships.filter(
        (membership) => {
          return [
            membership.clientName,
            membership.clientPhone,
            membership.planName,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(term);
        }
      );
    }, [
      memberships,
      search,
    ]);

  const stats =
    useMemo(() => {
      const active =
        memberships.filter(
          (item) =>
            item.active !== false
        );

      return {
        total:
          memberships.length,

        active:
          active.length,

        pending:
          active.filter(
            (item) =>
              item.paymentStatus !==
              "paid"
          ).length,

        remaining:
          active.reduce(
            (total, item) =>
              total +
              Number(
                item.remainingUses ||
                  0
              ),
            0
          ),
      };
    }, [memberships]);

  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10 bg-[#09131d]/70 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Painel da empresa
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              {viewerRole ===
              "employee"
                ? "Meus mensalistas"
                : "Mensalistas"}
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              {viewerRole ===
              "employee"
                ? "Clientes mensalistas que já possuem ou possuíram agendamentos com você."
                : "Planos, usos e pagamentos dos clientes."}
            </p>
          </div>

          {viewerRole ===
          "owner" ? (
            <button
              type="button"
              onClick={
                openNewMembership
              }
              disabled={
                openingForm
              }
              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {openingForm
                ? "Carregando..."
                : "+ Novo mensalista"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Mensalistas"
            value={stats.total}
          />

          <StatCard
            label="Ativos"
            value={stats.active}
          />

          <StatCard
            label="Pagamentos pendentes"
            value={stats.pending}
          />

          <StatCard
            label="Usos restantes"
            value={stats.remaining}
          />
        </div>

        <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:mt-6 sm:p-5">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Buscar cliente ou plano..."
            className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-base outline-none focus:border-emerald-500 sm:text-sm"
          />
        </section>

        {message ? (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {message}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300">
            {success}
          </div>
        ) : null}

        <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] sm:mt-6">
          <div className="border-b border-white/10 p-4 sm:p-5">
            <h2 className="font-bold">
              Mensalistas cadastrados
            </h2>
          </div>

          {loading ? (
            <EmptyState
              title="Carregando..."
            />
          ) : filtered.length ===
            0 ? (
            <EmptyState
              title="Nenhum mensalista cadastrado"
            />
          ) : (
            <div className="grid gap-4 p-5 xl:grid-cols-2">
              {filtered.map(
                (membership) => (
                  <article
                    key={
                      membership._id
                    }
                    className="rounded-2xl border border-white/10 bg-black/10 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold">
                          {membership.clientName ||
                            "Cliente"}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-500">
                          {membership.planName ||
                            "Plano"}
                        </p>
                      </div>

                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                        {membership.active !==
                        false
                          ? "Ativo"
                          : "Inativo"}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <MiniInfo
                        label="Preço"
                        value={money(
                          Number(
                            membership.price ||
                              0
                          )
                        )}
                      />

                      <MiniInfo
                        label="Saldo"
                        value={`${membership.remainingUses ?? 0}/${membership.totalUses ?? 0}`}
                      />

                      <MiniInfo
                        label="Pagamento"
                        value={
                          membership.paymentStatus ===
                          "paid"
                            ? "Pago"
                            : "Pendente"
                        }
                      />

                      <MiniInfo
                        label="Forma"
                        value={paymentLabel(
                          membership.paymentMethod
                        )}
                      />
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0a141d]">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4 sm:items-center sm:p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Mensalistas
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Novo mensalista
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                className="rounded-xl border border-white/10 px-4 py-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Cliente
                </label>

                <select
                  value={clientId}
                  onChange={(event) =>
                    setClientId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3"
                >
                  <option value="">
                    Selecione um cliente
                  </option>

                  {clients.map(
                    (client) => (
                      <option
                        key={
                          client._id
                        }
                        value={
                          client._id
                        }
                      >
                        {client.name}
                        {client.phone
                          ? ` - ${client.phone}`
                          : ""}
                      </option>
                    )
                  )}
                </select>

                {clients.length ===
                0 ? (
                  <p className="mt-2 text-xs text-amber-400">
                    Nenhum cliente cadastrado.
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Plano
                </label>

                <select
                  value={planId}
                  onChange={(event) =>
                    setPlanId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3"
                >
                  <option value="">
                    Selecione um plano
                  </option>

                  {plans.map(
                    (plan) => (
                      <option
                        key={
                          plan._id
                        }
                        value={
                          plan._id
                        }
                      >
                        {plan.name} -{" "}
                        {money(
                          plan.price
                        )}
                      </option>
                    )
                  )}
                </select>

                {plans.length ===
                0 ? (
                  <p className="mt-2 text-xs text-amber-400">
                    Nenhum plano ativo cadastrado.
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Início do plano
                </label>

                <input
                  type="date"
                  value={
                    startDate
                  }
                  onChange={(event) =>
                    setStartDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3"
                />
              </div>

              {selectedClient ? (
                <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs text-zinc-500">
                    Cliente
                  </p>

                  <p className="mt-1 font-bold">
                    {
                      selectedClient.name
                    }
                  </p>
                </div>
              ) : null}

              {selectedPlan ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-emerald-400">
                        Plano
                      </p>

                      <h3 className="mt-1 text-lg font-bold">
                        {
                          selectedPlan.name
                        }
                      </h3>
                    </div>

                    <p className="text-xl font-black text-emerald-400">
                      {money(
                        selectedPlan.price
                      )}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MiniInfo
                      label="Usos"
                      value={String(
                        selectedPlan.totalUses
                      )}
                    />

                    <MiniInfo
                      label="Validade"
                      value={`${selectedPlan.validityDays} dias`}
                    />

                    <MiniInfo
                      label="Vence em"
                      value={formatDate(
                        expiresAt
                      )}
                    />
                  </div>
                </div>
              ) : null}

              {selectedPlan ? (
                <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Pagamento
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <PaymentButton
                      label="PIX"
                      active={
                        paymentMethod ===
                        "pix"
                      }
                      onClick={() =>
                        setPaymentMethod(
                          "pix"
                        )
                      }
                    />

                    <PaymentButton
                      label="Dinheiro"
                      active={
                        paymentMethod ===
                        "cash"
                      }
                      onClick={() =>
                        setPaymentMethod(
                          "cash"
                        )
                      }
                    />

                    <PaymentButton
                      label="Cartão"
                      active={
                        paymentMethod ===
                        "card"
                      }
                      onClick={() =>
                        setPaymentMethod(
                          "card"
                        )
                      }
                    />

                    <PaymentButton
                      label="Pagar depois"
                      active={
                        paymentMethod ===
                        "later"
                      }
                      onClick={() =>
                        setPaymentMethod(
                          "later"
                        )
                      }
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <PaymentButton
                      label="Pendente"
                      active={
                        paymentStatus ===
                        "pending"
                      }
                      onClick={() =>
                        setPaymentStatus(
                          "pending"
                        )
                      }
                    />

                    <PaymentButton
                      label="Pago"
                      active={
                        paymentStatus ===
                        "paid"
                      }
                      onClick={() =>
                        setPaymentStatus(
                          "paid"
                        )
                      }
                    />
                  </div>

                  {paymentStatus ===
                  "pending" ? (
                    <div className="mt-5">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Vencimento do pagamento
                      </label>

                      <input
                        type="date"
                        value={
                          paymentDueDate
                        }
                        onChange={(event) =>
                          setPaymentDueDate(
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {message ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                  {message}
                </div>
              ) : null}

              <div className="flex gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  className="flex-1 rounded-xl border border-white/10 px-5 py-3"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    createMembership
                  }
                  disabled={
                    saving ||
                    !clientId ||
                    !planId
                  }
                  className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-bold text-zinc-950 disabled:opacity-40"
                >
                  {saving
                    ? "Cadastrando..."
                    : "Cadastrar mensalista"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

async function readJsonResponse(
  response: Response
) {
  const text =
    await response.text();

  if (!text) {
    throw new Error(
      `A API respondeu sem conteúdo. Status ${response.status}.`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `A API não retornou JSON válido. Status ${response.status}.`
    );
  }
}

function PaymentButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left ${
        active
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
          : "border-white/10"
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <p className="text-sm text-zinc-400">
        {label}
      </p>

      <p className="mt-2 break-words text-2xl font-bold sm:mt-3 sm:text-3xl">
        {value}
      </p>
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
    <div className="rounded-xl border border-white/10 bg-black/10 p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">
        {label}
      </p>

      <p className="mt-1 font-bold">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  title,
}: {
  title: string;
}) {
  return (
    <div className="p-12 text-center text-zinc-500">
      {title}
    </div>
  );
}

function paymentLabel(
  value?: string
) {
  switch (value) {
    case "pix":
      return "PIX";
    case "cash":
      return "Dinheiro";
    case "card":
      return "Cartão";
    case "later":
      return "Pagar depois";
    default:
      return "-";
  }
}

function money(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(value || 0);
}

function today() {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function addDays(
  value: string,
  days: number
) {
  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      12
    )
  );

  date.setUTCDate(
    date.getUTCDate() +
      days
  );

  return `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
}

function formatDate(
  value?: string
) {
  if (!value) {
    return "-";
  }

  const [
    year,
    month,
    day,
  ] = value.split("-");

  return `${day}/${month}/${year}`;
}