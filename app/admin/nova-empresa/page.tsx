"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NovaEmpresaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    businessName: "",
    slug: "",
    category: "",
    whatsapp: "",

    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",

    plan: "basico",
    active: true,
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const response = await fetch("/api/admin/me", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.authorized) {
        router.replace("/login");
        return;
      }
    } catch (error) {
      console.error(error);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  function changeField(
    field: keyof typeof form,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleBusinessName(value: string) {
    setForm((current) => ({
      ...current,
      businessName: value,

      slug:
        current.slug === "" ||
        current.slug === createSlug(current.businessName)
          ? createSlug(value)
          : current.slug,
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setMessage("");

    if (!form.businessName.trim()) {
      setMessage("Informe o nome da empresa.");
      return;
    }

    if (!form.slug.trim()) {
      setMessage("Informe o slug.");
      return;
    }

    if (!form.ownerName.trim()) {
      setMessage("Informe o nome do responsável.");
      return;
    }

    if (!form.ownerEmail.trim()) {
      setMessage("Informe o e-mail do cliente.");
      return;
    }

    if (form.ownerPassword.length < 6) {
      setMessage("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/admin/businesses",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Erro ao criar empresa."
        );
        return;
      }

      setMessage(
        "Empresa e acesso criados com sucesso!"
      );

      setForm({
        businessName: "",
        slug: "",
        category: "",
        whatsapp: "",

        ownerName: "",
        ownerEmail: "",
        ownerPassword: "",

        plan: "basico",
        active: true,
      });
    } catch (error) {
      console.error(error);
      setMessage("Erro ao criar empresa.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 p-8 text-white">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-10">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="mb-5 text-sm text-zinc-400 hover:text-white"
          >
            ← Voltar para o painel
          </button>

          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Super Admin
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Nova empresa
          </h1>

          <p className="mt-2 text-zinc-400">
            Cadastre a empresa e crie o acesso do proprietário.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">
              Dados da empresa
            </h2>

            <div className="mt-6 grid gap-5">
              <Field
                label="Nome da empresa"
                value={form.businessName}
                onChange={handleBusinessName}
                placeholder="Ex: Studio Bella"
              />

              <Field
                label="Slug"
                value={form.slug}
                onChange={(value) =>
                  changeField("slug", createSlug(value))
                }
                placeholder="studio-bella"
              />

              <p className="-mt-3 text-xs text-zinc-500">
                A página pública ficará em /{form.slug || "nome-da-empresa"}
              </p>

              <Field
                label="Categoria"
                value={form.category}
                onChange={(value) =>
                  changeField("category", value)
                }
                placeholder="Ex: Barbearia, Salão, Clínica"
              />

              <Field
                label="WhatsApp"
                value={form.whatsapp}
                onChange={(value) =>
                  changeField("whatsapp", value)
                }
                placeholder="(21) 99999-9999"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">
              Acesso do cliente
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              Esses dados serão usados pelo proprietário para entrar no sistema.
            </p>

            <div className="mt-6 grid gap-5">
              <Field
                label="Nome do responsável"
                value={form.ownerName}
                onChange={(value) =>
                  changeField("ownerName", value)
                }
                placeholder="Ex: João da Silva"
              />

              <Field
                label="E-mail"
                type="email"
                value={form.ownerEmail}
                onChange={(value) =>
                  changeField("ownerEmail", value)
                }
                placeholder="cliente@email.com"
              />

              <Field
                label="Senha inicial"
                type="password"
                value={form.ownerPassword}
                onChange={(value) =>
                  changeField("ownerPassword", value)
                }
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">
              Plano e acesso
            </h2>

            <div className="mt-6 grid gap-5">
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Plano
                </label>

                <select
                  value={form.plan}
                  onChange={(e) =>
                    changeField("plan", e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 outline-none focus:border-emerald-500"
                >
                  <option value="basico">
                    Básico
                  </option>

                  <option value="profissional">
                    Profissional
                  </option>

                  <option value="premium">
                    Premium
                  </option>
                </select>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-zinc-900 p-4">
                <div>
                  <p className="font-medium">
                    Empresa ativa
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Se desligar, o acesso poderá ser bloqueado.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    changeField(
                      "active",
                      e.target.checked
                    )
                  }
                  className="h-5 w-5"
                />
              </label>
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-emerald-500 px-6 py-4 text-lg font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {saving
              ? "Criando..."
              : "Criar empresa e acesso"}
          </button>

          {message ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              {message}
            </div>
          ) : null}
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-400">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}