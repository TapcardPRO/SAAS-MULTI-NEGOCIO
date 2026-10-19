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
  billingStatus: string;
  trialEndsAt: string;
  subscriptionEndsAt: string;
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState("");

  const selectedBusinesses = businesses.filter((business) =>
    selectedIds.includes(business.id)
  );
  const allSelected = businesses.length > 0 && selectedBusinesses.length === businesses.length;

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

      const nextBusinesses: Business[] = Array.isArray(data.businesses)
        ? data.businesses : [];
      setBusinesses(nextBusinesses);
      setSelectedIds((current) => current.filter((id) =>
        nextBusinesses.some((business) => business.id === id)
      ));
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

  function toggleSelection(id: string) {
    if (deletingSelected) return;
    setSelectedIds((current) => current.includes(id)
      ? current.filter((selectedId) => selectedId !== id)
      : [...current, id]
    );
  }

  function toggleAll() {
    if (deletingSelected) return;
    setSelectedIds(allSelected ? [] : businesses.map((business) => business.id));
  }

  async function deleteSelectedBusinesses() {
    const queue = businesses.filter((business) => selectedIds.includes(business.id));
    if (deletingSelected || savingId || queue.length === 0 ||
      deleteConfirmation.trim() !== `EXCLUIR ${queue.length}`) return;

    setDeletingSelected(true);
    setMessage("");
    const deletedIds: string[] = [];
    let failure = "";

    try {
      // Uma por vez para reutilizar as verificacoes da API e evitar sobrecarregar o MongoDB.
      for (let index = 0; index < queue.length; index += 1) {
        const business = queue[index];
        setDeleteProgress(`Excluindo ${index + 1} de ${queue.length}: ${business.name}`);
        try {
          const response = await fetch(`/api/admin/businesses/${encodeURIComponent(business.id)}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ confirmation: business.slug || business.name }),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            failure = `Nao foi possivel excluir ${business.name}: ${result.message || `HTTP ${response.status}`}`;
            break;
          }
          deletedIds.push(business.id);
        } catch {
          failure = `Erro de conexao ao excluir ${business.name}. Confira a lista antes de tentar novamente.`;
          break;
        }
      }
    } finally {
      // Uma falha interrompe o lote; as exclusoes anteriores nao podem ser desfeitas.
      setBusinesses((current) => current.filter((business) => !deletedIds.includes(business.id)));
      setSelectedIds((current) => current.filter((id) => !deletedIds.includes(id)));
      setShowDeleteDialog(false);
      setDeleteConfirmation("");
      setDeletingSelected(false);
      setDeleteProgress("");
      setMessage(failure
        ? `${deletedIds.length} de ${queue.length} empresa(s) excluida(s). ${failure}`
        : `${deletedIds.length} empresa(s) excluida(s) com sucesso.`
      );
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

        {businesses.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
                <input type="checkbox" checked={allSelected}
                  onChange={toggleAll} disabled={deletingSelected}
                  aria-label="Selecionar todas as empresas"
                  className="h-5 w-5 accent-emerald-500" />
                Selecionar todas
              </label>
              <span className="text-sm text-zinc-400">
                {selectedBusinesses.length} de {businesses.length} selecionada(s)
              </span>
              {selectedBusinesses.length > 0 && (
                <button type="button" onClick={() => setSelectedIds([])}
                  disabled={deletingSelected}
                  className="text-sm text-zinc-300 underline underline-offset-4 disabled:opacity-50">
                  Limpar selecao
                </button>
              )}
            </div>
            <button type="button"
              disabled={selectedBusinesses.length === 0 || deletingSelected || Boolean(savingId)}
              onClick={() => {
                setDeleteConfirmation("");
                setShowDeleteDialog(true);
              }}
              className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40">
              Excluir {selectedBusinesses.length} selecionada(s)
            </button>
          </div>
        )}

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
                    className={`rounded-2xl border bg-white/5 p-5 sm:p-6 ${
                      selectedIds.includes(business.id)
                        ? "border-red-500/50" : "border-white/10"
                    }`}
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300">
                            <input type="checkbox" checked={selectedIds.includes(business.id)}
                              onChange={() => toggleSelection(business.id)} disabled={deletingSelected}
                              aria-label={`Selecionar empresa ${business.name}`}
                              className="h-5 w-5 accent-emerald-500" />
                            Selecionar
                          </label>
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
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                          {business.billingStatus === "trial" ? (
                            <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sky-300">Teste grátis em andamento</span>
                          ) : business.billingStatus === "past_due" ? (
                            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-300">Assinatura vencida</span>
                          ) : business.billingStatus === "active" ? (
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300">Acesso liberado</span>
                          ) : null}
                          {business.trialEndsAt && (
                            <span className="text-zinc-400">Prazo do teste: {business.trialEndsAt.split("-").reverse().join("/")}</span>
                          )}
                        </div>

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

      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog" aria-modal="true" aria-labelledby="bulk-delete-title">
          <div className="w-full max-w-xl rounded-2xl border border-red-500/30 bg-zinc-950 p-6 text-white shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-red-400">Acao irreversivel</p>
            <h2 id="bulk-delete-title" className="mt-2 text-2xl font-black">
              Excluir {selectedBusinesses.length} empresa(s)?
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Os usuarios, clientes vinculados, agendamentos e demais dados dessas empresas
              serao removidos conforme a rotina atual. Esta operacao nao pode ser desfeita.
              Se houver cobranca recorrente no Mercado Pago, verifique o cancelamento no provedor antes de excluir.
            </p>
            <ul className="mt-4 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
              {selectedBusinesses.map((business) => (
                <li key={business.id}>• {business.name} <span className="text-zinc-500">/{business.slug}</span></li>
              ))}
            </ul>
            <label htmlFor="bulk-delete-confirm" className="mt-5 block text-sm font-semibold">
              Para confirmar, digite <strong className="text-red-400">EXCLUIR {selectedBusinesses.length}</strong>
            </label>
            <input id="bulk-delete-confirm" type="text" value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              disabled={deletingSelected} autoComplete="off"
              placeholder={`EXCLUIR ${selectedBusinesses.length}`}
              className="mt-2 w-full rounded-xl border border-white/20 bg-zinc-900 px-4 py-3 outline-none focus:border-red-500" />
            {deleteProgress && <p className="mt-3 text-sm text-amber-300" role="status">{deleteProgress}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" disabled={deletingSelected}
                onClick={() => { setShowDeleteDialog(false); setDeleteConfirmation(""); }}
                className="rounded-xl border border-white/20 px-5 py-3 font-semibold disabled:opacity-50">
                Cancelar
              </button>
              <button type="button" onClick={deleteSelectedBusinesses}
                disabled={deletingSelected || selectedBusinesses.length === 0 ||
                  deleteConfirmation.trim() !== `EXCLUIR ${selectedBusinesses.length}`}
                className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
                {deletingSelected ? "Excluindo..." : `Excluir definitivamente (${selectedBusinesses.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
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
