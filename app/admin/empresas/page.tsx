"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SaasPlan = {
  id: string;
  name: string;
  slug: string;
  active?: boolean;
};

type Business = {
  id: string;
  name: string;
  slug: string;
  category: string;
  plan: string;
  active: boolean;
  owner?: {
    name: string;
    email: string;
  } | null;
};

export default function EmpresasPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    loadBusinesses();
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const response = await fetch(
        "/api/admin/plans",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function planName(slug: string) {
    return (
      plans.find(
        (plan) => plan.slug === slug
      )?.name || slug || "Sem plano"
    );
  }

  async function loadBusinesses() {
    try {
      const response = await fetch(
        "/api/admin/businesses",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao carregar empresas"
        );
        return;
      }

      setBusinesses(
        data.businesses || []
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Erro ao carregar empresas"
      );
    } finally {
      setLoading(false);
    }
  }

  function changeBusinessPlan(
    businessId: string,
    plan: string
  ) {
    setBusinesses((current) =>
      current.map((business) =>
        business.id === businessId
          ? {
              ...business,
              plan,
            }
          : business
      )
    );
  }

  async function savePlan(
    business: Business
  ) {
    if (!business.plan) {
      setMessage(
        "Selecione um plano para esta empresa."
      );
      return;
    }

    try {
      setSavingId(business.id);
      setMessage("");

      const response = await fetch(
        `/api/admin/businesses/${business.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            plan: business.plan,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao alterar plano."
        );
        return;
      }

      setMessage(
        `Plano de ${business.name} atualizado com sucesso.`
      );

      await loadBusinesses();
    } catch (error) {
      console.error(error);

      setMessage(
        "Erro ao alterar plano."
      );
    } finally {
      setSavingId("");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 p-8 text-white">
        Carregando empresas...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                router.push("/admin")
              }
              className="mb-4 text-sm text-zinc-400 hover:text-white"
            >
              ← Voltar
            </button>

            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Super Admin
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Empresas
            </h1>

            <p className="mt-2 text-zinc-400">
              Gerencie os clientes e planos cadastrados no SaaS.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/nova-empresa"
              )
            }
            className="rounded-xl bg-emerald-500 px-5 py-3 font-bold text-zinc-950"
          >
            + Nova empresa
          </button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total"
            value={businesses.length}
          />

          <StatCard
            label="Ativas"
            value={
              businesses.filter(
                (business) =>
                  business.active
              ).length
            }
          />

          <StatCard
            label="Bloqueadas"
            value={
              businesses.filter(
                (business) =>
                  !business.active
              ).length
            }
          />
        </div>

        {message ? (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            {message}
          </div>
        ) : null}

        {businesses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-zinc-500">
            Nenhuma empresa cadastrada.
          </div>
        ) : (
          <div className="space-y-4">
            {businesses.map(
              (business) => {
                const currentExists =
                  plans.some(
                    (plan) =>
                      plan.slug ===
                      business.plan
                  );

                return (
                  <div
                    key={business.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-bold">
                            {business.name}
                          </h2>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              business.active
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {business.active
                              ? "ATIVA"
                              : "BLOQUEADA"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-zinc-400">
                          /{business.slug}
                        </p>

                        <div className="mt-4 grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
                          <p>
                            Categoria:{" "}
                            <span className="text-white">
                              {business.category ||
                                "-"}
                            </span>
                          </p>

                          <p>
                            Plano atual:{" "}
                            <span className="text-white">
                              {planName(
                                business.plan
                              )}
                            </span>
                          </p>

                          <p>
                            Responsável:{" "}
                            <span className="text-white">
                              {business.owner
                                ?.name || "-"}
                            </span>
                          </p>

                          <p>
                            E-mail:{" "}
                            <span className="break-all text-white">
                              {business.owner
                                ?.email || "-"}
                            </span>
                          </p>
                        </div>

                        <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/50 p-4">
                          <p className="text-sm font-semibold">
                            Alterar plano da empresa
                          </p>

                          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                            <select
                              value={
                                business.plan
                              }
                              onChange={(
                                event
                              ) =>
                                changeBusinessPlan(
                                  business.id,
                                  event.target
                                    .value
                                )
                              }
                              className="min-h-11 flex-1 rounded-xl border border-white/10 bg-zinc-900 px-4 outline-none focus:border-emerald-500"
                            >
                              {!currentExists &&
                              business.plan ? (
                                <option
                                  value={
                                    business.plan
                                  }
                                >
                                  Plano antigo:{" "}
                                  {
                                    business.plan
                                  }
                                </option>
                              ) : null}

                              {plans.map(
                                (plan) => (
                                  <option
                                    key={
                                      plan.id
                                    }
                                    value={
                                      plan.slug
                                    }
                                  >
                                    {
                                      plan.name
                                    }
                                    {plan.active ===
                                    false
                                      ? " (inativo)"
                                      : ""}
                                  </option>
                                )
                              )}
                            </select>

                            <button
                              type="button"
                              disabled={
                                savingId ===
                                business.id
                              }
                              onClick={() =>
                                savePlan(
                                  business
                                )
                              }
                              className="min-h-11 rounded-xl bg-emerald-500 px-5 font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
                            >
                              {savingId ===
                              business.id
                                ? "Salvando..."
                                : "Salvar plano"}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <a
                          href={`/${business.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-white/10 px-4 py-3 text-sm"
                        >
                          Ver página
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/admin/empresas/${business.id}`
                            )
                          }
                          className="rounded-xl border border-emerald-500/30 px-4 py-3 text-sm font-semibold text-emerald-400"
                        >
                          Gerenciar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-zinc-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}
