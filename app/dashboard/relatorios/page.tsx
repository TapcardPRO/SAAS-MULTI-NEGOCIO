"use client";

import {
  useEffect,
  useState,
} from "react";

type Summary = {
  revenue: number;
  paidExpenses: number;
  pendingExpenses: number;
  profit: number;
  completed: number;
  cancelled: number;
  noShow: number;
  ticket: number;
};

type Ranking = {
  name: string;
  quantity: number;
  revenue: number;
};

type Daily = {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
};

export default function RelatoriosPage() {
  const [
    period,
    setPeriod,
  ] = useState(
    "30"
  );

  const [
    loading,
    setLoading,
  ] = useState(
    true
  );

  const [
    message,
    setMessage,
  ] = useState(
    ""
  );

  const [
    summary,
    setSummary,
  ] = useState<Summary>({
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
  });

  const [
    services,
    setServices,
  ] = useState<
    Ranking[]
  >([]);

  const [
    professionals,
    setProfessionals,
  ] = useState<
    Ranking[]
  >([]);

  const [
    daily,
    setDaily,
  ] = useState<
    Daily[]
  >([]);

  const [
    periodInfo,
    setPeriodInfo,
  ] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  useEffect(() => {
    loadReport();
  }, [
    period,
  ]);

  async function loadReport() {
    try {
      setLoading(
        true
      );

      setMessage(
        ""
      );

      const response =
        await fetch(
          `/api/dashboard/reports?days=${period}`,
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
            "Erro ao carregar relatório."
        );

        return;
      }

      setSummary(
        data.summary ||
          {}
      );

      setServices(
        data.services ||
          []
      );

      setProfessionals(
        data.professionals ||
          []
      );

      setDaily(
        data.daily ||
          []
      );

      setPeriodInfo(
        data.period ||
          {}
      );
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "Erro ao carregar relatório."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  function exportCsv() {
    const rows = [
      [
        "Data",
        "Faturamento",
        "Despesas",
        "Lucro",
      ],

      ...daily.map(
        (item) => [
          item.date,

          item.revenue.toFixed(
            2
          ),

          item.expenses.toFixed(
            2
          ),

          item.profit.toFixed(
            2
          ),
        ]
      ),
    ];

    const csv =
      rows
        .map(
          (row) =>
            row
              .map(
                (
                  value
                ) =>
                  `"${String(
                    value
                  ).replace(
                    /"/g,
                    '""'
                  )}"`
              )
              .join(
                ";"
              )
        )
        .join(
          "\n"
        );

    const blob =
      new Blob(
        [
          "\ufeff" +
            csv,
        ],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href =
      url;

    anchor.download =
      `relatorio-vellto-${periodInfo.startDate || "inicio"}-${periodInfo.endDate || "fim"}.csv`;

    document.body.appendChild(
      anchor
    );

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(
      url
    );
  }

  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10 bg-[#09131d]/70 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Gestão da empresa
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Relatórios
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Compare faturamento, despesas, lucro e desempenho da equipe.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={
                period
              }
              onChange={(
                event
              ) =>
                setPeriod(
                  event.target.value
                )
              }
              className="min-h-[46px] rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-sm outline-none focus:border-emerald-500"
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

            <button
              type="button"
              onClick={
                exportCsv
              }
              disabled={
                daily.length ===
                0
              }
              className="min-h-[46px] rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-40"
            >
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Faturamento"
            value={
              money(
                summary.revenue
              )
            }
            detail="Atendimentos concluídos"
          />

          <Metric
            label="Despesas pagas"
            value={
              money(
                summary.paidExpenses
              )
            }
            detail="Custos já pagos"
          />

          <Metric
            label="Lucro"
            value={
              money(
                summary.profit
              )
            }
            detail="Faturamento - despesas"
            accent
          />

          <Metric
            label="Despesas pendentes"
            value={
              money(
                summary.pendingExpenses
              )
            }
            detail="Ainda não entram no lucro"
          />

          <Metric
            label="Atendimentos"
            value={
              summary.completed
            }
            detail="Concluídos"
          />

          <Metric
            label="Ticket médio"
            value={
              money(
                summary.ticket
              )
            }
            detail="Média por atendimento"
          />

          <Metric
            label="Cancelamentos"
            value={
              summary.cancelled
            }
            detail="No período"
          />

          <Metric
            label="Faltas"
            value={
              summary.noShow
            }
            detail="Clientes que faltaram"
          />
        </div>

        {message ? (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-2xl border border-white/10 p-12 text-center text-zinc-500">
            Gerando relatório...
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <RankingCard
                title="Serviços"
                subtitle="Serviços com maior faturamento"
                items={
                  services
                }
              />

              <RankingCard
                title="Profissionais"
                subtitle="Produção por profissional"
                items={
                  professionals
                }
              />
            </div>

            <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
              <div className="border-b border-white/10 p-4 sm:p-5">
                <h2 className="font-bold">
                  Resultado por dia
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Faturamento, despesas pagas e lucro.
                </p>
              </div>

              {daily.length ===
              0 ? (
                <div className="p-12 text-center text-sm text-zinc-500">
                  Nenhum movimento no período.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                      <tr>
                        <th className="px-5 py-4">
                          Data
                        </th>

                        <th className="px-5 py-4">
                          Faturamento
                        </th>

                        <th className="px-5 py-4">
                          Despesas
                        </th>

                        <th className="px-5 py-4">
                          Lucro
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/5">
                      {daily.map(
                        (
                          item
                        ) => (
                          <tr
                            key={
                              item.date
                            }
                          >
                            <td className="px-5 py-4">
                              {formatDate(
                                item.date
                              )}
                            </td>

                            <td className="px-5 py-4 text-emerald-400">
                              {money(
                                item.revenue
                              )}
                            </td>

                            <td className="px-5 py-4 text-red-300">
                              {money(
                                item.expenses
                              )}
                            </td>

                            <td
                              className={`px-5 py-4 font-bold ${
                                item.profit >=
                                0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {money(
                                item.profit
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
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
  detail:
    string;
  accent?:
    boolean;
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

function RankingCard({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: Ranking[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
      <div className="border-b border-white/10 p-5">
        <h2 className="font-bold">
          {title}
        </h2>

        <p className="mt-1 text-xs text-zinc-500">
          {subtitle}
        </p>
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
                      {item.name}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {item.quantity} atendimento
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
    value ||
      0
  );
}

function formatDate(
  value: string
) {
  const parts =
    String(
      value ||
        ""
    ).split(
      "-"
    );

  if (
    parts.length !==
    3
  ) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
