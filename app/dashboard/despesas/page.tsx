"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Expense = {
  _id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  status: string;
  notes?: string;
};

type FormState = {
  description: string;
  category: string;
  amount: string;
  date: string;
  paymentMethod: string;
  status: string;
  notes: string;
};

const emptyForm: FormState = {
  description: "",
  category: "aluguel",
  amount: "",
  date: "",
  paymentMethod: "pix",
  status: "paid",
  notes: "",
};

export default function DespesasPage() {
  const [
    expenses,
    setExpenses,
  ] = useState<Expense[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    month,
    setMonth,
  ] = useState("");

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState<Expense | null>(
    null
  );

  const [
    form,
    setForm,
  ] = useState<FormState>(
    emptyForm
  );

  useEffect(() => {
    const current =
      currentMonth();

    setMonth(
      current
    );

    setForm(
      (old) => ({
        ...old,
        date:
          today(),
      })
    );
  }, []);

  useEffect(() => {
    if (!month) {
      return;
    }

    loadExpenses();
  }, [
    month,
  ]);

  async function loadExpenses() {
    try {
      setLoading(
        true
      );

      setMessage(
        ""
      );

      const response =
        await fetch(
          `/api/dashboard/expenses?month=${encodeURIComponent(
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
            "Erro ao carregar despesas."
        );

        return;
      }

      setExpenses(
        Array.isArray(
          data.expenses
        )
          ? data.expenses
          : []
      );
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "Erro ao carregar despesas."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  function openCreate() {
    setEditing(
      null
    );

    setForm({
      ...emptyForm,

      date:
        today(),
    });

    setMessage(
      ""
    );

    setSuccess(
      ""
    );

    setShowForm(
      true
    );
  }

  function openEdit(
    expense: Expense
  ) {
    setEditing(
      expense
    );

    setForm({
      description:
        expense.description,

      category:
        expense.category,

      amount:
        String(
          expense.amount
        ),

      date:
        expense.date,

      paymentMethod:
        expense.paymentMethod,

      status:
        expense.status,

      notes:
        expense.notes ||
        "",
    });

    setMessage(
      ""
    );

    setSuccess(
      ""
    );

    setShowForm(
      true
    );
  }

  function updateForm(
    field:
      keyof FormState,

    value:
      string
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  }

  async function saveExpense() {
    if (
      form.description.trim().length <
      2
    ) {
      setMessage(
        "Informe a descrição da despesa."
      );

      return;
    }

    if (
      !form.amount ||
      Number(
        form.amount
      ) <= 0
    ) {
      setMessage(
        "Informe um valor válido."
      );

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
          editing
            ? `/api/dashboard/expenses/${editing._id}`
            : "/api/dashboard/expenses",
          {
            method:
              editing
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                ...form,

                amount:
                  Number(
                    form.amount
                  ),
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
            "Erro ao salvar despesa."
        );

        return;
      }

      setSuccess(
        data.message ||
          "Despesa salva."
      );

      setShowForm(
        false
      );

      setEditing(
        null
      );

      await loadExpenses();
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "Erro ao salvar despesa."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function deleteExpense(
    expense: Expense
  ) {
    const confirmed =
      window.confirm(
        `Excluir a despesa "${expense.description}"?`
      );

    if (
      !confirmed
    ) {
      return;
    }

    try {
      setMessage(
        ""
      );

      setSuccess(
        ""
      );

      const response =
        await fetch(
          `/api/dashboard/expenses/${expense._id}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        setMessage(
          data.message ||
            "Erro ao excluir despesa."
        );

        return;
      }

      setSuccess(
        "Despesa excluída."
      );

      await loadExpenses();
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "Erro ao excluir despesa."
      );
    }
  }

  const stats =
    useMemo(() => {
      const paid =
        expenses.filter(
          (item) =>
            item.status ===
            "paid"
        );

      const pending =
        expenses.filter(
          (item) =>
            item.status ===
            "pending"
        );

      return {
        total:
          expenses.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.amount ||
                  0
              ),
            0
          ),

        paid:
          paid.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.amount ||
                  0
              ),
            0
          ),

        pending:
          pending.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.amount ||
                  0
              ),
            0
          ),

        count:
          expenses.length,
      };
    }, [
      expenses,
    ]);

  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10 bg-[#09131d]/70 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Gestão financeira
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Despesas
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Registre os custos da empresa para acompanhar o lucro real.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openCreate
            }
            className="min-h-[48px] rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400"
          >
            + Nova despesa
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total lançado"
            value={
              money(
                stats.total
              )
            }
          />

          <StatCard
            label="Pago"
            value={
              money(
                stats.paid
              )
            }
          />

          <StatCard
            label="Pendente"
            value={
              money(
                stats.pending
              )
            }
          />

          <StatCard
            label="Lançamentos"
            value={
              stats.count
            }
          />
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <div className="max-w-xs">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Mês
            </label>

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
              className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        </section>

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

        <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
          <div className="border-b border-white/10 p-4 sm:p-5">
            <h2 className="font-bold">
              Lançamentos
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Despesas do período selecionado.
            </p>
          </div>

          {loading ? (
            <EmptyState
              text="Carregando despesas..."
            />
          ) : expenses.length ===
            0 ? (
            <EmptyState
              text="Nenhuma despesa cadastrada neste mês."
            />
          ) : (
            <div className="divide-y divide-white/5">
              {expenses.map(
                (
                  expense
                ) => (
                  <div
                    key={
                      expense._id
                    }
                    className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_170px_150px_180px] lg:items-center"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          {
                            expense.description
                          }
                        </p>

                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-wider text-zinc-400">
                          {categoryLabel(
                            expense.category
                          )}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-zinc-500">
                        {expense.notes ||
                          paymentLabel(
                            expense.paymentMethod
                          )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-400">
                        {formatDate(
                          expense.date
                        )}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        {paymentLabel(
                          expense.paymentMethod
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-red-300">
                        {money(
                          expense.amount
                        )}
                      </p>

                      <span
                        className={`mt-1 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
                          expense.status ===
                          "paid"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {expense.status ===
                        "paid"
                          ? "Pago"
                          : "Pendente"}
                      </span>
                    </div>

                    <div className="flex gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          openEdit(
                            expense
                          )
                        }
                        className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteExpense(
                            expense
                          )
                        }
                        className="rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/80 p-0 backdrop-blur-sm sm:p-5">
          <div className="mx-auto min-h-screen w-full max-w-2xl bg-[#0a141d] shadow-2xl sm:my-8 sm:min-h-0 sm:rounded-3xl sm:border sm:border-white/10">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Financeiro
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  {editing
                    ? "Editar despesa"
                    : "Nova despesa"}
                </h2>
              </div>

              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() =>
                  setShowForm(
                    false
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <Field
                label="Descrição"
                value={
                  form.description
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "description",
                    value
                  )
                }
                placeholder="Ex.: Aluguel da loja"
              />

              <Select
                label="Categoria"
                value={
                  form.category
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "category",
                    value
                  )
                }
                options={[
                  [
                    "aluguel",
                    "Aluguel",
                  ],
                  [
                    "agua",
                    "Água",
                  ],
                  [
                    "energia",
                    "Energia",
                  ],
                  [
                    "internet",
                    "Internet",
                  ],
                  [
                    "produtos",
                    "Produtos / Insumos",
                  ],
                  [
                    "salarios",
                    "Salários",
                  ],
                  [
                    "marketing",
                    "Marketing",
                  ],
                  [
                    "manutencao",
                    "Manutenção",
                  ],
                  [
                    "impostos",
                    "Impostos",
                  ],
                  [
                    "outros",
                    "Outros",
                  ],
                ]}
              />

              <Field
                label="Valor"
                value={
                  form.amount
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "amount",
                    value
                  )
                }
                placeholder="0,00"
                type="number"
              />

              <Field
                label="Data"
                value={
                  form.date
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "date",
                    value
                  )
                }
                type="date"
              />

              <Select
                label="Forma de pagamento"
                value={
                  form.paymentMethod
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "paymentMethod",
                    value
                  )
                }
                options={[
                  [
                    "pix",
                    "PIX",
                  ],
                  [
                    "dinheiro",
                    "Dinheiro",
                  ],
                  [
                    "debito",
                    "Cartão de débito",
                  ],
                  [
                    "credito",
                    "Cartão de crédito",
                  ],
                  [
                    "boleto",
                    "Boleto",
                  ],
                  [
                    "transferencia",
                    "Transferência",
                  ],
                  [
                    "outro",
                    "Outro",
                  ],
                ]}
              />

              <Select
                label="Status"
                value={
                  form.status
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "status",
                    value
                  )
                }
                options={[
                  [
                    "paid",
                    "Pago",
                  ],
                  [
                    "pending",
                    "Pendente",
                  ],
                ]}
              />

              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Observações
                </label>

                <textarea
                  value={
                    form.notes
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "notes",
                      event.target.value
                    )
                  }
                  rows={
                    3
                  }
                  placeholder="Informações adicionais..."
                  className="w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              {message ? (
                <div className="sm:col-span-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                  {message}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:col-span-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    setShowForm(
                      false
                    )
                  }
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    saveExpense
                  }
                  className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-zinc-950 disabled:opacity-50"
                >
                  {saving
                    ? "Salvando..."
                    : editing
                    ? "Salvar alterações"
                    : "Cadastrar despesa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>

      <input
        type={
          type
        }
        step={
          type ===
          "number"
            ? "0.01"
            : undefined
        }
        min={
          type ===
          "number"
            ? "0"
            : undefined
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-sm outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options: string[][];
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>

      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-sm outline-none focus:border-emerald-500"
      >
        {options.map(
          (
            option
          ) => (
            <option
              key={
                option[0]
              }
              value={
                option[0]
              }
            >
              {option[1]}
            </option>
          )
        )}
      </select>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value:
    string |
    number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <p className="text-sm text-zinc-400">
        {label}
      </p>

      <p className="mt-3 text-2xl font-black">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="p-12 text-center text-sm text-zinc-500">
      {text}
    </div>
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

function today() {
  const now =
    new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() +
      1
  ).padStart(
    2,
    "0"
  )}-${String(
    now.getDate()
  ).padStart(
    2,
    "0"
  )}`;
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

function categoryLabel(
  value: string
) {
  const labels:
    Record<
      string,
      string
    > = {
      aluguel:
        "Aluguel",

      agua:
        "Água",

      energia:
        "Energia",

      internet:
        "Internet",

      produtos:
        "Produtos / Insumos",

      salarios:
        "Salários",

      marketing:
        "Marketing",

      manutencao:
        "Manutenção",

      impostos:
        "Impostos",

      outros:
        "Outros",
    };

  return (
    labels[value] ||
    value
  );
}

function paymentLabel(
  value: string
) {
  const labels:
    Record<
      string,
      string
    > = {
      pix:
        "PIX",

      dinheiro:
        "Dinheiro",

      debito:
        "Cartão de débito",

      credito:
        "Cartão de crédito",

      boleto:
        "Boleto",

      transferencia:
        "Transferência",

      outro:
        "Outro",
    };

  return (
    labels[value] ||
    value
  );
}
