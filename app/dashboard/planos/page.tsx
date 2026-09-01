"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Plan = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  totalUses: number;
  validityDays: number;
  active: boolean;
};

export default function PlanosPage() {
  const [plans, setPlans] =
    useState<Plan[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [totalUses, setTotalUses] =
    useState("4");

  const [validityDays, setValidityDays] =
    useState("30");

  const [active, setActive] =
    useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        "/api/dashboard/plans",
        {
          cache: "no-store",
        }
      );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao carregar planos"
        );
        return;
      }

      setPlans(
        data.plans || []
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar planos"
      );
    } finally {
      setLoading(false);
    }
  }

  function openNewPlan() {
    setEditingId(null);

    setName("");
    setDescription("");
    setPrice("");
    setTotalUses("4");
    setValidityDays("30");
    setActive(true);

    setMessage("");
    setSuccess("");

    setShowForm(true);
  }

  function openEditPlan(
    plan: Plan
  ) {
    setEditingId(
      plan._id
    );

    setName(
      plan.name
    );

    setDescription(
      plan.description || ""
    );

    setPrice(
      String(
        plan.price
      )
    );

    setTotalUses(
      String(
        plan.totalUses
      )
    );

    setValidityDays(
      String(
        plan.validityDays
      )
    );

    setActive(
      plan.active !== false
    );

    setMessage("");
    setSuccess("");

    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
  }

  async function savePlan() {
    setMessage("");
    setSuccess("");

    const cleanName =
      name.trim();

    if (!cleanName) {
      setMessage(
        "Informe o nome do plano."
      );
      return;
    }

    const parsedPrice =
      Number(
        price.replace(
          ",",
          "."
        )
      );

    if (
      !Number.isFinite(
        parsedPrice
      ) ||
      parsedPrice < 0
    ) {
      setMessage(
        "Informe um preço válido."
      );
      return;
    }

    const parsedUses =
      Number(
        totalUses
      );

    if (
      !Number.isInteger(
        parsedUses
      ) ||
      parsedUses <= 0
    ) {
      setMessage(
        "Informe uma quantidade de usos válida."
      );
      return;
    }

    const parsedValidity =
      Number(
        validityDays
      );

    if (
      !Number.isInteger(
        parsedValidity
      ) ||
      parsedValidity <= 0
    ) {
      setMessage(
        "Informe uma validade válida."
      );
      return;
    }

    try {
      setSaving(true);

      /*
        IMPORTANTE:

        Esta tela envia exatamente:

        name
        description
        price
        totalUses
        validityDays
        active

        São os mesmos campos
        esperados pela API.
      */

      const payload = {
        ...(editingId
          ? {
              id:
                editingId,
            }
          : {}),

        name:
          cleanName,

        description:
          description.trim(),

        price:
          parsedPrice,

        totalUses:
          parsedUses,

        validityDays:
          parsedValidity,

        active,
      };

      const response =
        await fetch(
          "/api/dashboard/plans",
          {
            method:
              editingId
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao salvar plano"
        );
        return;
      }

      setShowForm(false);

      setSuccess(
        editingId
          ? "Plano atualizado com sucesso."
          : "Plano cadastrado com sucesso."
      );

      await loadPlans();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao salvar plano"
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePlan(
    plan: Plan
  ) {
    try {
      setMessage("");
      setSuccess("");

      const response =
        await fetch(
          "/api/dashboard/plans",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  plan._id,

                active:
                  !plan.active,
              }),
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao alterar plano"
        );
        return;
      }

      setSuccess(
        plan.active
          ? "Plano desativado."
          : "Plano ativado."
      );

      await loadPlans();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao alterar plano"
      );
    }
  }

  async function deletePlan(
    plan: Plan
  ) {
    const confirmed =
      window.confirm(
        `Excluir o plano "${plan.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setSuccess("");

      const response =
        await fetch(
          `/api/dashboard/plans?id=${encodeURIComponent(
            plan._id
          )}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao excluir plano"
        );
        return;
      }

      setSuccess(
        "Plano excluído com sucesso."
      );

      await loadPlans();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao excluir plano"
      );
    }
  }

  const stats =
    useMemo(() => {
      const activePlans =
        plans.filter(
          (plan) =>
            plan.active !== false
        );

      const average =
        activePlans.length
          ? activePlans.reduce(
              (
                total,
                plan
              ) =>
                total +
                Number(
                  plan.price ||
                    0
                ),
              0
            ) /
            activePlans.length
          : 0;

      return {
        total:
          plans.length,

        active:
          activePlans.length,

        inactive:
          plans.length -
          activePlans.length,

        average,
      };
    }, [plans]);

  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10 bg-[#09131d]/70 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Painel da empresa
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Planos
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Configure os planos
              disponíveis para seus
              mensalistas.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openNewPlan
            }
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 sm:w-auto sm:px-5"
          >
            + Novo plano
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Planos"
            value={
              stats.total
            }
            detail="Total cadastrado"
          />

          <StatCard
            label="Ativos"
            value={
              stats.active
            }
            detail="Disponíveis"
          />

          <StatCard
            label="Inativos"
            value={
              stats.inactive
            }
            detail="Indisponíveis"
          />

          <StatCard
            label="Ticket médio"
            value={money(
              stats.average
            )}
            detail="Média dos ativos"
          />
        </div>

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
              Planos cadastrados
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Alterações no preço
              não modificam o valor
              já contratado pelos
              mensalistas existentes.
            </p>
          </div>

          {loading ? (
            <EmptyState
              title="Carregando planos..."
              description="Aguarde."
            />
          ) : plans.length ===
            0 ? (
            <EmptyState
              title="Nenhum plano cadastrado"
              description="Clique em Novo plano para criar o primeiro."
            />
          ) : (
            <div className="grid gap-4 p-5 lg:grid-cols-2 xl:grid-cols-3">
              {plans.map(
                (plan) => (
                  <article
                    key={
                      plan._id
                    }
                    className="rounded-2xl border border-white/10 bg-black/10 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold">
                            {
                              plan.name
                            }
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              plan.active
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-zinc-500/10 text-zinc-400"
                            }`}
                          >
                            {plan.active
                              ? "Ativo"
                              : "Inativo"}
                          </span>
                        </div>

                        {plan.description ? (
                          <p className="mt-2 text-sm leading-6 text-zinc-500">
                            {
                              plan.description
                            }
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs uppercase tracking-wider text-zinc-500">
                        Valor atual
                      </p>

                      <p className="mt-1 text-3xl font-black text-emerald-400">
                        {money(
                          plan.price
                        )}
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <MiniInfo
                        label="Usos"
                        value={String(
                          plan.totalUses
                        )}
                      />

                      <MiniInfo
                        label="Validade"
                        value={`${plan.validityDays} dias`}
                      />
                    </div>

                    <div className="mt-5 grid gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() =>
                          openEditPlan(
                            plan
                          )
                        }
                        className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          togglePlan(
                            plan
                          )
                        }
                        className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
                      >
                        {plan.active
                          ? "Desativar"
                          : "Ativar"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deletePlan(
                            plan
                          )
                        }
                        className="rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/5"
                      >
                        Excluir
                      </button>
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
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0a141d]">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4 sm:items-center sm:p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Planos
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  {editingId
                    ? "Editar plano"
                    : "Novo plano"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 p-0 text-zinc-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 p-5">
              <Field
                label="Nome do plano"
                value={name}
                onChange={setName}
                placeholder="Ex.: Plano Mensal"
              />

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Descrição
                </label>

                <textarea
                  value={
                    description
                  }
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Ex.: 4 cortes por mês"
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Preço"
                  value={price}
                  onChange={
                    setPrice
                  }
                  placeholder="120,00"
                  type="text"
                />

                <Field
                  label="Quantidade de usos"
                  value={
                    totalUses
                  }
                  onChange={
                    setTotalUses
                  }
                  placeholder="4"
                  type="number"
                />
              </div>

              <Field
                label="Validade em dias"
                value={
                  validityDays
                }
                onChange={
                  setValidityDays
                }
                placeholder="30"
                type="number"
              />

              <button
                type="button"
                onClick={() =>
                  setActive(
                    !active
                  )
                }
                className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div>
                  <p className="font-semibold">
                    Plano ativo
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Planos ativos
                    aparecem no cadastro
                    de mensalistas.
                  </p>
                </div>

                <div
                  className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
                    active
                      ? "justify-end bg-emerald-500"
                      : "justify-start bg-zinc-700"
                  }`}
                >
                  <div className="h-4 w-4 rounded-full bg-white" />
                </div>
              </button>

              {message ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                  {message}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    savePlan
                  }
                  disabled={
                    saving
                  }
                  className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-bold text-zinc-950 disabled:opacity-40 sm:w-auto sm:px-5"
                >
                  {saving
                    ? "Salvando..."
                    : editingId
                      ? "Salvar alterações"
                      : "Cadastrar plano"}
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
    return JSON.parse(
      text
    );
  } catch {
    console.error(
      "Resposta recebida:",
      text
    );

    throw new Error(
      `A API não retornou JSON válido. Status ${response.status}.`
    );
  }
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
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-base outline-none focus:border-emerald-500 sm:text-sm"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <p className="text-sm text-zinc-400">
        {label}
      </p>

      <p className="mt-2 break-words text-2xl font-bold sm:mt-3 sm:text-3xl">
        {value}
      </p>

      <p className="mt-3 text-xs text-emerald-400">
        {detail}
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
    <div className="rounded-xl border border-white/5 bg-black/10 p-3">
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
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-12 text-center">
      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm text-zinc-500">
        {description}
      </p>
    </div>
  );
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
  ).format(
    value || 0
  );
}