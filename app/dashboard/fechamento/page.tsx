"use client";

import {
  useEffect,
  useState,
} from "react";

type Snapshot = {
  revenue: number;
  paidExpenses: number;
  pendingExpenses: number;
  profit: number;
  completed: number;
  cancelled: number;
  noShow: number;
  ticket: number;
  expenseCount: number;

  serviceRanking?: {
    name: string;
    quantity: number;
    revenue: number;
  }[];

  professionalRanking?: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
};

type Closing = {
  _id: string;
  month: string;
  status: string;
  snapshot: Snapshot;

  closedAt?: string;

  closedBy?: {
    name?: string;
    email?: string;
  };
};

const emptySnapshot:
  Snapshot = {
    revenue:
      0,

    paidExpenses:
      0,

    pendingExpenses:
      0,

    profit:
      0,

    completed:
      0,

    cancelled:
      0,

    noShow:
      0,

    ticket:
      0,

    expenseCount:
      0,

    serviceRanking:
      [],

    professionalRanking:
      [],
  };

export default function FechamentoPage() {
  const [
    month,
    setMonth,
  ] = useState(
    ""
  );

  const [
    loading,
    setLoading,
  ] = useState(
    true
  );

  const [
    saving,
    setSaving,
  ] = useState(
    false
  );

  const [
    message,
    setMessage,
  ] = useState(
    ""
  );

  const [
    success,
    setSuccess,
  ] = useState(
    ""
  );

  const [
    closed,
    setClosed,
  ] = useState(
    false
  );

  const [
    closing,
    setClosing,
  ] = useState<
    Closing | null
  >(
    null
  );

  const [
    preview,
    setPreview,
  ] = useState<Snapshot>(
    emptySnapshot
  );

  useEffect(() => {
    setMonth(
      currentMonth()
    );
  }, []);

  useEffect(() => {
    if (!month) {
      return;
    }

    loadClosing();
  }, [
    month,
  ]);

  async function loadClosing() {
    try {
      setLoading(
        true
      );

      setMessage(
        ""
      );

      const response =
        await fetch(
          `/api/dashboard/monthly-closing?month=${encodeURIComponent(
            month
          )}`,
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
            "Erro ao carregar fechamento."
        );

        return;
      }

      setClosed(
        data.closed ===
          true
      );

      setClosing(
        data.closing ||
          null
      );

      setPreview(
        data.preview ||
          emptySnapshot
      );
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "Erro ao carregar fechamento."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  async function closeMonth() {
    const confirmed =
      window.confirm(
        `Fechar ${monthLabel(
          month
        )}?\n\nDepois do fechamento, despesas e atendimentos desse mês ficarão bloqueados até o mês ser reaberto.`
      );

    if (
      !confirmed
    ) {
      return;
    }

    try {
      setSaving(
        true
      );

      setMessage(
        ""
      );

      setSuccess(
        ""
      );

      const response =
        await fetch(
          "/api/dashboard/monthly-closing",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                month,
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
            "Erro ao fechar mês."
        );

        return;
      }

      setSuccess(
        "Mês fechado com sucesso."
      );

      await loadClosing();
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "Erro ao fechar mês."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function reopenMonth() {
    const confirmed =
      window.confirm(
        `Reabrir ${monthLabel(
          month
        )}?\n\nOs lançamentos e atendimentos voltarão a poder ser alterados.`
      );

    if (
      !confirmed
    ) {
      return;
    }

    try {
      setSaving(
        true
      );

      setMessage(
        ""
      );

      setSuccess(
        ""
      );

      const response =
        await fetch(
          "/api/dashboard/monthly-closing",
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                month,
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
            "Erro ao reabrir mês."
        );

        return;
      }

      setSuccess(
        "Mês reaberto com sucesso."
      );

      await loadClosing();
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "Erro ao reabrir mês."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  const data =
    closed &&
    closing?.snapshot
      ? closing.snapshot
      : preview;

  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10 bg-[#09131d]/70 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Controle financeiro
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Fechamento mensal
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Feche o mês e preserve os números daquele período.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="month"
              value={
                month
              }
              onChange={(
                event
              ) =>
                setMonth(
                  event.target.value
                )
              }
              className="min-h-[48px] rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />

            {closed ? (
              <button
                type="button"
                disabled={
                  saving
                }
                onClick={
                  reopenMonth
                }
                className="min-h-[48px] rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-3 text-sm font-bold text-amber-400 transition hover:bg-amber-500/10 disabled:opacity-40"
              >
                {saving
                  ? "Processando..."
                  : "Reabrir mês"}
              </button>
            ) : (
              <button
                type="button"
                disabled={
                  saving ||
                  loading
                }
                onClick={
                  closeMonth
                }
                className="min-h-[48px] rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-40"
              >
                {saving
                  ? "Fechando..."
                  : "Fechar mês"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div
          className={`rounded-2xl border p-5 ${
            closed
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-amber-500/20 bg-amber-500/5"
          }`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p
                className={`text-xs font-black uppercase tracking-widest ${
                  closed
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {closed
                  ? "Mês fechado"
                  : "Mês aberto"}
              </p>

              <h2 className="mt-1 text-lg font-bold">
                {monthLabel(
                  month
                )}
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                {closed
                  ? "Os valores abaixo são o retrato salvo no momento do fechamento."
                  : "Os valores abaixo ainda podem mudar até o fechamento."}
              </p>
            </div>

            {closed &&
            closing?.closedAt ? (
              <div className="text-sm text-zinc-500 sm:text-right">
                <p>
                  Fechado em{" "}
                  {formatDateTime(
                    closing.closedAt
                  )}
                </p>

                {closing.closedBy?.name ? (
                  <p className="mt-1">
                    por{" "}
                    {
                      closing
                        .closedBy
                        .name
                    }
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {message ? (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {message}
          </div>
        ) : null}

        {success ? (
          <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300">
            {success}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-2xl border border-white/10 p-12 text-center text-sm text-zinc-500">
            Carregando fechamento...
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Faturamento"
                value={
                  money(
                    data.revenue
                  )
                }
                detail="Atendimentos concluídos"
              />

              <Metric
                label="Despesas pagas"
                value={
                  money(
                    data.paidExpenses
                  )
                }
                detail="Custos descontados"
              />

              <Metric
                label="Lucro"
                value={
                  money(
                    data.profit
                  )
                }
                detail="Faturamento - despesas"
                accent
              />

              <Metric
                label="Despesas pendentes"
                value={
                  money(
                    data.pendingExpenses
                  )
                }
                detail="Ainda não descontadas"
              />

              <Metric
                label="Atendimentos"
                value={
                  data.completed
                }
                detail="Concluídos no mês"
              />

              <Metric
                label="Ticket médio"
                value={
                  money(
                    data.ticket
                  )
                }
                detail="Valor médio"
              />

              <Metric
                label="Cancelamentos"
                value={
                  data.cancelled
                }
                detail="No mês"
              />

              <Metric
                label="Faltas"
                value={
                  data.noShow
                }
                detail="No mês"
              />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <Ranking
                title="Serviços do mês"
                items={
                  data.serviceRanking ||
                  []
                }
              />

              <Ranking
                title="Profissionais do mês"
                items={
                  data.professionalRanking ||
                  []
                }
              />
            </div>

            <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Regra do fechamento
              </p>

              <h2 className="mt-2 text-lg font-bold">
                O mês fechado vira um histórico imutável
              </h2>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-400">
                Enquanto o mês estiver fechado, despesas não podem ser criadas, editadas ou excluídas e os atendimentos daquele período não podem ter status, serviço, profissional, data ou horário alterados. Para corrigir alguma informação, basta reabrir o mês, fazer a alteração e fechar novamente.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value:
    string |
    number;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-white/10 bg-white/[0.025]"
      }`}
    >
      <p className="text-sm text-zinc-400">
        {label}
      </p>

      <p className="mt-3 text-2xl font-black">
        {value}
      </p>

      <p className="mt-2 text-xs text-zinc-500">
        {detail}
      </p>
    </div>
  );
}

function Ranking({
  title,
  items,
}: {
  title: string;

  items: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
      <div className="border-b border-white/10 p-5">
        <h2 className="font-bold">
          {title}
        </h2>
      </div>

      {items.length ===
      0 ? (
        <div className="p-10 text-center text-sm text-zinc-500">
          Nenhum dado disponível.
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {items
            .slice(
              0,
              10
            )
            .map(
              (
                item,
                index
              ) => (
                <div
                  key={
                    item.name
                  }
                  className="flex items-center gap-4 p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 font-bold text-emerald-400">
                    {index +
                      1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {
                        item.name
                      }
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {
                        item.quantity
                      }{" "}
                      atendimento
                      {item.quantity ===
                      1
                        ? ""
                        : "s"}
                    </p>
                  </div>

                  <p className="font-bold text-emerald-400">
                    {money(
                      item.revenue
                    )}
                  </p>
                </div>
              )
            )}
        </div>
      )}
    </section>
  );
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
    Number(
      value ||
        0
    )
  );
}

function currentMonth() {
  const now =
    new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() +
      1
  ).padStart(
    2,
    "0"
  )}`;
}

function monthLabel(
  value: string
) {
  if (
    !/^\d{4}-\d{2}$/.test(
      value
    )
  ) {
    return value;
  }

  const [
    year,
    month,
  ] = value.split(
    "-"
  );

  const names = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return `${names[
    Number(
      month
    ) - 1
  ]} de ${year}`;
}

function formatDateTime(
  value: string
) {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle:
        "short",

      timeStyle:
        "short",
    }
  ).format(
    date
  );
}
