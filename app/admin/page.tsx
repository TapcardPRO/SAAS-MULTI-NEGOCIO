"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type Summary = {
  businesses: number;
  activeBusinesses: number;
  inactiveBusinesses: number;
  trialBusinesses: number;
  pastDueBusinesses: number;
  cancelledBusinesses: number;
  customers: number;
  memberships: number;
  owners: number;
  employees: number;
  appointments30: number;
  completed30: number;
  revenue30: number;
  mrr: number;
};

type RecentBusiness = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
  billingStatus:
    string;
  trialEndsAt: string;
};

export default function AdminPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    summary,
    setSummary,
  ] =
    useState<Summary | null>(
      null
    );

  const [
    businesses,
    setBusinesses,
  ] =
    useState<
      RecentBusiness[]
    >([]);

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

      setMessage("");

      const response =
        await fetch(
          "/api/admin/overview",
          {
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (
        response.status ===
          401 ||
        response.status ===
          403
      ) {
        router.replace(
          "/login"
        );
        return;
      }

      if (
        !response.ok
      ) {
        setMessage(
          data.message ||
            "Erro ao carregar painel."
        );
        return;
      }

      setSummary(
        data.summary
      );

      setBusinesses(
        Array.isArray(
          data.recentBusinesses
        )
          ? data.recentBusinesses
          : []
      );
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "Erro ao carregar painel."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  async function logout() {
    await fetch(
      "/api/auth/logout",
      {
        method:
          "POST",
      }
    );

    router.replace(
      "/login"
    );
  }

  if (
    loading
  ) {
    return (
      <main className="min-h-screen bg-zinc-950 p-8 text-white">
        Carregando Vellto...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
              Vellto Agenda
            </p>

            <h1 className="mt-1 text-2xl font-black">
              Central administrativa
            </h1>
          </div>

          <button
            type="button"
            onClick={
              logout
            }
            className="rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8">
        {message ? (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-red-300">
            {message}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Empresas"
            value={
              String(
                summary?.businesses ||
                  0
              )
            }
            detail={`${summary?.activeBusinesses || 0} ativas`}
          />

          <Metric
            label="MRR estimado"
            value={
              money(
                summary?.mrr ||
                  0
              )
            }
            detail="Receita mensal do SaaS"
          />

          <Metric
            label="Clientes"
            value={
              String(
                summary?.customers ||
                  0
              )
            }
            detail="Contas de clientes"
          />

          <Metric
            label="Agendamentos 30d"
            value={
              String(
                summary?.appointments30 ||
                  0
              )
            }
            detail={`${summary?.completed30 || 0} concluídos`}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Em teste"
            value={
              String(
                summary?.trialBusinesses ||
                  0
              )
            }
            detail="Trial"
          />

          <Metric
            label="Pagamento atrasado"
            value={
              String(
                summary?.pastDueBusinesses ||
                  0
              )
            }
            detail="Past due"
          />

          <Metric
            label="Mensalistas"
            value={
              String(
                summary?.memberships ||
                  0
              )
            }
            detail="Planos ativos"
          />

          <Metric
            label="Movimentado 30d"
            value={
              money(
                summary?.revenue30 ||
                  0
              )
            }
            detail="Atendimentos concluídos"
          />
        </div>

        <section className="mt-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AdminCard
              href="/admin/empresas"
              title="Empresas"
              text="Planos, situação e acesso."
            />

            <AdminCard
              href="/admin/nova-empresa"
              title="Nova empresa"
              text="Cadastrar um novo cliente Vellto."
            />

            <AdminCard
              href="/admin/usuarios"
              title="Usuários"
              text="Gerenciar acessos."
            />

            <AdminCard
              href="/admin/planos"
              title="Planos Vellto"
              text="Valores e planos do SaaS."
            />
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <div>
              <h2 className="font-black">
                Empresas recentes
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Visão rápida das contas cadastradas.
              </p>
            </div>

            <Link
              href="/admin/empresas"
              className="text-sm font-semibold text-emerald-400"
            >
              Ver todas →
            </Link>
          </div>

          {businesses.length ===
          0 ? (
            <div className="p-8 text-center text-zinc-500">
              Nenhuma empresa cadastrada.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {businesses.map(
                (
                  business
                ) => (
                  <Link
                    key={
                      business.id
                    }
                    href={`/admin/empresas/${business.id}`}
                    className="flex flex-col gap-3 p-5 transition hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-bold">
                        {
                          business.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        /{
                          business.slug
                        } • Plano{" "}
                        {
                          business.plan
                        }
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge
                        text={
                          business.active
                            ? "Ativa"
                            : "Bloqueada"
                        }
                        good={
                          business.active
                        }
                      />

                      <BillingBadge
                        status={
                          business.billingStatus
                        }
                      />
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <p className="text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black sm:text-3xl">
        {value}
      </p>

      <p className="mt-2 text-xs text-zinc-500">
        {detail}
      </p>
    </div>
  );
}

function AdminCard({
  href,
  title,
  text,
}: {
  href: string;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={
        href
      }
      className="rounded-2xl border border-white/10 bg-zinc-900 p-5 transition hover:border-emerald-500/30"
    >
      <h2 className="font-black">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        {text}
      </p>

      <p className="mt-4 text-sm font-bold text-emerald-400">
        Abrir →
      </p>
    </Link>
  );
}

function Badge({
  text,
  good,
}: {
  text: string;
  good: boolean;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        good
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400"
      }`}
    >
      {text}
    </span>
  );
}

function BillingBadge({
  status,
}: {
  status: string;
}) {
  const map:
    Record<
      string,
      string
    > = {
      trial:
        "Teste",
      active:
        "Em dia",
      past_due:
        "Atrasado",
      cancelled:
        "Cancelado",
    };

  return (
    <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-zinc-300">
      {map[status] ||
        status}
    </span>
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
