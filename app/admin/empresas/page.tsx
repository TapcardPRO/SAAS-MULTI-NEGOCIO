"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    try {
      const response = await fetch("/api/admin/businesses", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setMessage(
          data.message || "Erro ao carregar empresas"
        );
        return;
      }

      setBusinesses(data.businesses || []);
    } catch (error) {
      console.error(error);
      setMessage("Erro ao carregar empresas");
    } finally {
      setLoading(false);
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
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/admin")}
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
              Gerencie os clientes cadastrados no SaaS.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/admin/nova-empresa")
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
                (business) => business.active
              ).length
            }
          />

          <StatCard
            label="Bloqueadas"
            value={
              businesses.filter(
                (business) => !business.active
              ).length
            }
          />
        </div>

        {message ? (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-red-300">
            {message}
          </div>
        ) : null}

        {businesses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-zinc-500">
            Nenhuma empresa cadastrada.
          </div>
        ) : (
          <div className="space-y-4">
            {businesses.map((business) => (
              <div
                key={business.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
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
                          {business.category || "-"}
                        </span>
                      </p>

                      <p>
                        Plano:{" "}
                        <span className="text-white">
                          {formatPlan(business.plan)}
                        </span>
                      </p>

                      <p>
                        Responsável:{" "}
                        <span className="text-white">
                          {business.owner?.name || "-"}
                        </span>
                      </p>

                      <p>
                        E-mail:{" "}
                        <span className="text-white">
                          {business.owner?.email || "-"}
                        </span>
                      </p>
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
                      className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-zinc-950"
                    >
                      Gerenciar
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

function formatPlan(plan: string) {
  if (plan === "profissional") {
    return "Profissional";
  }

  if (plan === "premium") {
    return "Premium";
  }

  return "Básico";
}