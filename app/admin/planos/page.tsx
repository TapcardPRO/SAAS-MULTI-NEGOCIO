"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type PlanItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billingCycle: string;
  maxProfessionals: number;
  maxServices: number;
  active: boolean;
  companies: number;
};

const emptyForm = {
  name: "",
  description: "",
  price: "",
  billingCycle: "monthly",
  maxProfessionals: "",
  maxServices: "",
  active: true,
};

export default function PlanosPage() {
  const router = useRouter();

  const [plans, setPlans] = useState<PlanItem[]>(
    []
  );

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/plans",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao carregar planos."
        );
        return;
      }

      setPlans(data.plans || []);
    } catch (error) {
      console.error(error);
      setMessage("Erro ao carregar planos.");
    } finally {
      setLoading(false);
    }
  }

  function editPlan(plan: PlanItem) {
    setEditingId(plan.id);

    setForm({
      name: plan.name,
      description: plan.description,
      price: String(plan.price),
      billingCycle: plan.billingCycle,
      maxProfessionals: String(
        plan.maxProfessionals
      ),
      maxServices: String(plan.maxServices),
      active: plan.active,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId("");
    setForm(emptyForm);
    setMessage("");
  }

  async function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      setMessage("Informe o nome do plano.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(
        "/api/admin/plans",
        {
          method: editingId
            ? "PATCH"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id: editingId || undefined,
            name: form.name,
            description: form.description,
            price: Number(
              form.price.replace(",", ".")
            ),
            billingCycle:
              form.billingCycle,
            maxProfessionals: Number(
              form.maxProfessionals || 0
            ),
            maxServices: Number(
              form.maxServices || 0
            ),
            active: form.active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Erro ao salvar plano."
        );
        return;
      }

      setEditingId("");
      setForm(emptyForm);
      setMessage(data.message || "Plano salvo.");

      await loadPlans();
    } catch (error) {
      console.error(error);
      setMessage("Erro ao salvar plano.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePlan(plan: PlanItem) {
    try {
      const response = await fetch(
        "/api/admin/plans",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...plan,
            id: plan.id,
            active: !plan.active,
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

      await loadPlans();
    } catch (error) {
      console.error(error);
      setMessage("Erro ao alterar plano.");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="text-sm text-zinc-400 hover:text-white"
        >
          ← Voltar para o painel
        </button>

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Super Admin
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Planos do SaaS
          </h1>

          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            Crie e configure os planos oferecidos para as empresas.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold">
              {editingId
                ? "Editar plano"
                : "Novo plano"}
            </h2>

            {editingId ? (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-sm text-zinc-400 hover:text-white"
              >
                Cancelar edição
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field
              label="Nome do plano"
              value={form.name}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
              placeholder="Ex: Profissional"
            />

            <Field
              label="Preço mensal/anual"
              value={form.price}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  price: value,
                }))
              }
              placeholder="59,90"
              type="number"
            />

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Cobrança
              </label>

              <select
                value={form.billingCycle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    billingCycle:
                      event.target.value,
                  }))
                }
                className="min-h-12 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 text-base outline-none focus:border-emerald-500"
              >
                <option value="monthly">
                  Mensal
                </option>

                <option value="yearly">
                  Anual
                </option>
              </select>
            </div>

            <Field
              label="Máximo de profissionais"
              value={form.maxProfessionals}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  maxProfessionals: value,
                }))
              }
              placeholder="0 = ilimitado"
              type="number"
            />

            <Field
              label="Máximo de serviços"
              value={form.maxServices}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  maxServices: value,
                }))
              }
              placeholder="0 = ilimitado"
              type="number"
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-zinc-400">
                Descrição
              </label>

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description:
                      event.target.value,
                  }))
                }
                rows={3}
                placeholder="Descreva o que este plano oferece..."
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-base outline-none focus:border-emerald-500"
              />
            </div>

            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900 p-4 md:col-span-2">
              <div>
                <p className="font-medium">
                  Plano ativo
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Planos inativos não devem ser oferecidos para novos clientes.
                </p>
              </div>

              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    active:
                      event.target.checked,
                  }))
                }
                className="h-5 w-5"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 min-h-12 w-full rounded-xl bg-emerald-500 px-5 font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 sm:w-auto"
          >
            {saving
              ? "Salvando..."
              : editingId
              ? "Salvar alterações"
              : "Criar plano"}
          </button>
        </form>

        {message ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            {message}
          </div>
        ) : null}

        <div className="mt-7">
          <h2 className="text-lg font-bold">
            Planos cadastrados
          </h2>

          {loading ? (
            <p className="mt-4 text-zinc-400">
              Carregando...
            </p>
          ) : plans.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-6 text-zinc-400">
              Nenhum plano cadastrado ainda.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold">
                        {plan.name}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {plan.slug}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        plan.active
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {plan.active
                        ? "Ativo"
                        : "Inativo"}
                    </span>
                  </div>

                  <p className="mt-5 text-3xl font-bold">
                    {new Intl.NumberFormat(
                      "pt-BR",
                      {
                        style: "currency",
                        currency: "BRL",
                      }
                    ).format(plan.price)}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    por{" "}
                    {plan.billingCycle ===
                    "yearly"
                      ? "ano"
                      : "mês"}
                  </p>

                  <p className="mt-4 text-sm text-zinc-400">
                    {plan.description ||
                      "Sem descrição."}
                  </p>

                  <div className="mt-5 space-y-2 text-sm text-zinc-400">
                    <p>
                      Profissionais:{" "}
                      <span className="text-white">
                        {plan.maxProfessionals ===
                        0
                          ? "Ilimitado"
                          : plan.maxProfessionals}
                      </span>
                    </p>

                    <p>
                      Serviços:{" "}
                      <span className="text-white">
                        {plan.maxServices === 0
                          ? "Ilimitado"
                          : plan.maxServices}
                      </span>
                    </p>

                    <p>
                      Empresas usando:{" "}
                      <span className="text-white">
                        {plan.companies}
                      </span>
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        editPlan(plan)
                      }
                      className="min-h-11 rounded-xl border border-white/10 text-sm hover:bg-white/5"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        togglePlan(plan)
                      }
                      className={`min-h-11 rounded-xl border text-sm ${
                        plan.active
                          ? "border-red-500/30 text-red-400"
                          : "border-emerald-500/30 text-emerald-400"
                      }`}
                    >
                      {plan.active
                        ? "Desativar"
                        : "Ativar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-400">
        {label}
      </label>

      <input
        type={type}
        min={type === "number" ? 0 : undefined}
        step={
          label.includes("Preço")
            ? "0.01"
            : undefined
        }
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="min-h-12 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 text-base outline-none focus:border-emerald-500"
      />
    </div>
  );
}
