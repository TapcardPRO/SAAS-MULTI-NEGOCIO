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
  serviceIds: string[];
  active: boolean;
};

type Service = {
  _id: string;
  name: string;
  price: number;
  duration: number;
  active?: boolean;
};

export default function PlanosPage() {
  const [
    plans,
    setPlans,
  ] =
    useState<Plan[]>(
      []
    );

  const [
    services,
    setServices,
  ] =
    useState<Service[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    showForm,
    setShowForm,
  ] =
    useState(false);

  const [
    editingId,
    setEditingId,
  ] =
    useState<
      string | null
    >(null);

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [
    price,
    setPrice,
  ] =
    useState("");

  const [
    totalUses,
    setTotalUses,
  ] =
    useState("4");

  const [
    validityDays,
    setValidityDays,
  ] =
    useState("30");

  const [
    serviceIds,
    setServiceIds,
  ] =
    useState<string[]>(
      []
    );

  const [
    active,
    setActive,
  ] =
    useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(
        true
      );

      setMessage("");

      const [
        plansResponse,
        servicesResponse,
      ] =
        await Promise.all([
          fetch(
            "/api/dashboard/plans",
            {
              cache:
                "no-store",
            }
          ),

          fetch(
            "/api/services",
            {
              cache:
                "no-store",
            }
          ),
        ]);

      const plansData =
        await plansResponse.json();

      const servicesData =
        await servicesResponse.json();

      if (
        !plansResponse.ok
      ) {
        setMessage(
          plansData.message ||
            "Erro ao carregar planos"
        );
        return;
      }

      if (
        !servicesResponse.ok
      ) {
        setMessage(
          servicesData.message ||
            "Erro ao carregar serviços"
        );
        return;
      }

      setPlans(
        Array.isArray(
          plansData.plans
        )
          ? plansData.plans
          : []
      );

      setServices(
        (
          Array.isArray(
            servicesData.services
          )
            ? servicesData.services
            : []
        ).filter(
          (
            service: Service
          ) =>
            service.active !==
            false
        )
      );
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "Erro ao carregar planos"
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  function openNewPlan() {
    setEditingId(
      null
    );

    setName("");
    setDescription("");
    setPrice("");
    setTotalUses("4");
    setValidityDays(
      "30"
    );

    /*
    Vazio = qualquer serviço.
    */
    setServiceIds([]);

    setActive(true);
    setMessage("");
    setSuccess("");
    setShowForm(
      true
    );
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
      plan.description ||
        ""
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

    setServiceIds(
      Array.isArray(
        plan.serviceIds
      )
        ? plan.serviceIds
        : []
    );

    setActive(
      plan.active !==
      false
    );

    setMessage("");
    setSuccess("");
    setShowForm(
      true
    );
  }

  function toggleService(
    id: string
  ) {
    setServiceIds(
      (current) =>
        current.includes(
          id
        )
          ? current.filter(
              (item) =>
                item !==
                id
            )
          : [
              ...current,
              id,
            ]
    );
  }

  async function savePlan() {
    const cleanName =
      name.trim();

    const parsedPrice =
      Number(
        price.replace(
          ",",
          "."
        )
      );

    const parsedUses =
      Number(
        totalUses
      );

    const parsedValidity =
      Number(
        validityDays
      );

    if (!cleanName) {
      setMessage(
        "Informe o nome do plano."
      );
      return;
    }

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

    if (
      !Number.isInteger(
        parsedValidity
      ) ||
      parsedValidity <=
        0
    ) {
      setMessage(
        "Informe uma validade válida."
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setSuccess("");

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
              JSON.stringify({
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

                serviceIds,

                active,
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
            "Erro ao salvar plano"
        );
        return;
      }

      setShowForm(
        false
      );

      setSuccess(
        editingId
          ? "Plano atualizado com sucesso."
          : "Plano cadastrado com sucesso."
      );

      await loadAll();
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "Erro ao salvar plano"
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePlan(
    plan: Plan
  ) {
    const response =
      await fetch(
        "/api/dashboard/plans",
        {
          method:
            "PUT",

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
      await response.json();

    if (
      !response.ok
    ) {
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

    await loadAll();
  }

  async function deletePlan(
    plan: Plan
  ) {
    if (
      !window.confirm(
        `Excluir o plano "${plan.name}"?`
      )
    ) {
      return;
    }

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
      await response.json();

    if (
      !response.ok
    ) {
      setMessage(
        data.message ||
          "Erro ao excluir plano"
      );
      return;
    }

    setSuccess(
      "Plano excluído com sucesso."
    );

    await loadAll();
  }

  const stats =
    useMemo(() => {
      const activePlans =
        plans.filter(
          (plan) =>
            plan.active !==
            false
        );

      return {
        total:
          plans.length,

        active:
          activePlans.length,

        average:
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
            : 0,
      };
    }, [
      plans,
    ]);

  function serviceNames(
    ids: string[]
  ) {
    if (
      !ids ||
      ids.length ===
        0
    ) {
      return "Todos os serviços";
    }

    return ids
      .map(
        (id) =>
          services.find(
            (service) =>
              service._id ===
              id
          )?.name
      )
      .filter(
        Boolean
      )
      .join(", ");
  }

  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10 bg-[#09131d]/70 px-4 py-5 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Mensalistas
            </p>

            <h1 className="mt-1 text-2xl font-black">
              Planos
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Configure valor, usos, validade e quais serviços cada plano cobre.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openNewPlan
            }
            className="min-h-[48px] rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-zinc-950"
          >
            + Novo plano
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            label="Planos"
            value={
              String(
                stats.total
              )
            }
          />

          <Stat
            label="Ativos"
            value={
              String(
                stats.active
              )
            }
          />

          <Stat
            label="Ticket médio"
            value={
              money(
                stats.average
              )
            }
          />
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
          <div className="mt-6 rounded-2xl border border-white/10 p-8 text-center text-zinc-500">
            Carregando planos...
          </div>
        ) : plans.length ===
          0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center text-zinc-500">
            Nenhum plano cadastrado.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {plans.map(
              (plan) => (
                <article
                  key={
                    plan._id
                  }
                  className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black">
                        {plan.name}
                      </h2>

                      <p className="mt-1 text-xs text-zinc-500">
                        {plan.active
                          ? "Ativo"
                          : "Inativo"}
                      </p>
                    </div>

                    <p className="text-xl font-black text-emerald-400">
                      {money(
                        plan.price
                      )}
                    </p>
                  </div>

                  {plan.description ? (
                    <p className="mt-4 text-sm leading-6 text-zinc-500">
                      {plan.description}
                    </p>
                  ) : null}

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Mini
                      label="Usos"
                      value={
                        String(
                          plan.totalUses
                        )
                      }
                    />

                    <Mini
                      label="Validade"
                      value={`${plan.validityDays} dias`}
                    />
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Serviços incluídos
                    </p>

                    <p className="mt-2 text-sm font-semibold">
                      {serviceNames(
                        plan.serviceIds
                      )}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openEditPlan(
                          plan
                        )
                      }
                      className="rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold"
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
                      className="rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold"
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
                      className="rounded-xl border border-red-500/20 px-3 py-2.5 text-sm font-semibold text-red-400"
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/75 p-0 backdrop-blur-sm sm:p-5">
          <div className="mx-auto min-h-screen w-full max-w-3xl bg-[#09131d] shadow-2xl sm:my-8 sm:min-h-0 sm:rounded-3xl sm:border sm:border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Plano mensal
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  {editingId
                    ? "Editar plano"
                    : "Novo plano"}
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
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <Field
                label="Nome"
                value={
                  name
                }
                setValue={
                  setName
                }
                placeholder="Ex.: Plano Corte Mensal"
              />

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Descrição
                </label>

                <textarea
                  value={
                    description
                  }
                  onChange={(
                    event
                  ) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label="Valor"
                  value={
                    price
                  }
                  setValue={
                    setPrice
                  }
                  placeholder="99,90"
                />

                <Field
                  label="Usos"
                  value={
                    totalUses
                  }
                  setValue={
                    setTotalUses
                  }
                  placeholder="4"
                />

                <Field
                  label="Validade em dias"
                  value={
                    validityDays
                  }
                  setValue={
                    setValidityDays
                  }
                  placeholder="30"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Serviços incluídos
                    </label>

                    <p className="mt-1 text-xs text-zinc-600">
                      Nenhum marcado = plano válido para todos os serviços.
                    </p>
                  </div>

                  {serviceIds.length >
                  0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setServiceIds(
                          []
                        )
                      }
                      className="text-xs font-semibold text-emerald-400"
                    >
                      Cobrir todos
                    </button>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {services.map(
                    (
                      service
                    ) => {
                      const selected =
                        serviceIds.includes(
                          service._id
                        );

                      return (
                        <button
                          key={
                            service._id
                          }
                          type="button"
                          onClick={() =>
                            toggleService(
                              service._id
                            )
                          }
                          className={`rounded-xl border p-4 text-left ${
                            selected
                              ? "border-emerald-500 bg-emerald-500/[0.08]"
                              : "border-white/10 bg-[#071018]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold">
                                {service.name}
                              </p>

                              <p className="mt-1 text-xs text-zinc-500">
                                {service.duration} min • {money(
                                  service.price
                                )}
                              </p>
                            </div>

                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                                selected
                                  ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                                  : "border-white/10"
                              }`}
                            >
                              {selected
                                ? "✓"
                                : ""}
                            </span>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-white/10 p-4">
                <input
                  type="checkbox"
                  checked={
                    active
                  }
                  onChange={(
                    event
                  ) =>
                    setActive(
                      event.target.checked
                    )
                  }
                />

                <span>
                  Plano ativo
                </span>
              </label>

              {message ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                  {message}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
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
                    savePlan
                  }
                  className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-zinc-950 disabled:opacity-40"
                >
                  {saving
                    ? "Salvando..."
                    : "Salvar plano"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <p className="text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black">
        {value}
      </p>
    </div>
  );
}

function Mini({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </p>

      <p className="mt-1 font-bold">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  setValue,
  placeholder,
}: {
  label: string;
  value: string;
  setValue:
    (value: string) =>
      void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>

      <input
        value={
          value
        }
        onChange={(
          event
        ) =>
          setValue(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 outline-none"
      />
    </label>
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
