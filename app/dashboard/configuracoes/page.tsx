"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

type SettingsData = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };

  business: {
    id: string;
    name: string;
    slug: string;
    category: string;
    description: string;
    whatsapp: string;
    instagram: string;
    address: string;
    plan: string;
    active: boolean;
  };

  plan: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    billingCycle: string;
    maxProfessionals: number;
    maxServices: number;
    active: boolean;
  } | null;
};

export default function ConfiguracoesPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [savingBusiness, setSavingBusiness] =
    useState(false);

  const [savingAccount, setSavingAccount] =
    useState(false);

  const [savingPassword, setSavingPassword] =
    useState(false);

  const [data, setData] =
    useState<SettingsData | null>(
      null
    );

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [businessForm, setBusinessForm] =
    useState({
      name: "",
      category: "",
      description: "",
      whatsapp: "",
      instagram: "",
      address: "",
    });

  const [accountForm, setAccountForm] =
    useState({
      name: "",
      email: "",
    });

  const [passwordForm, setPasswordForm] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/dashboard/settings",
          {
            cache: "no-store",
          }
        );

      const json =
        await response.json();

      if (!response.ok) {
        throw new Error(
          json.message ||
            "Erro ao carregar configurações"
        );
      }

      setData(json);

      setBusinessForm({
        name:
          json.business?.name ||
          "",
        category:
          json.business
            ?.category || "",
        description:
          json.business
            ?.description || "",
        whatsapp:
          json.business
            ?.whatsapp || "",
        instagram:
          json.business
            ?.instagram || "",
        address:
          json.business
            ?.address || "",
      });

      setAccountForm({
        name:
          json.user?.name || "",
        email:
          json.user?.email || "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar configurações"
      );
    } finally {
      setLoading(false);
    }
  }

  function clearMessages() {
    setMessage("");
    setError("");
  }

  async function saveBusiness(
    event: FormEvent
  ) {
    event.preventDefault();

    clearMessages();
    setSavingBusiness(true);

    try {
      const response =
        await fetch(
          "/api/dashboard/settings",
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              section:
                "business",
              ...businessForm,
            }),
          }
        );

      const json =
        await response.json();

      if (!response.ok) {
        throw new Error(
          json.message ||
            "Erro ao salvar"
        );
      }

      setMessage(json.message);

      await load();

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao salvar"
      );
    } finally {
      setSavingBusiness(false);
    }
  }

  async function saveAccount(
    event: FormEvent
  ) {
    event.preventDefault();

    clearMessages();
    setSavingAccount(true);

    try {
      const response =
        await fetch(
          "/api/dashboard/settings",
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              section:
                "account",
              ...accountForm,
            }),
          }
        );

      const json =
        await response.json();

      if (!response.ok) {
        throw new Error(
          json.message ||
            "Erro ao salvar"
        );
      }

      setMessage(json.message);

      await load();

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao salvar"
      );
    } finally {
      setSavingAccount(false);
    }
  }

  async function savePassword(
    event: FormEvent
  ) {
    event.preventDefault();

    clearMessages();
    setSavingPassword(true);

    try {
      const response =
        await fetch(
          "/api/dashboard/settings",
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              section:
                "password",
              ...passwordForm,
            }),
          }
        );

      const json =
        await response.json();

      if (!response.ok) {
        throw new Error(
          json.message ||
            "Erro ao alterar senha"
        );
      }

      setMessage(json.message);

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao alterar senha"
      );
    } finally {
      setSavingPassword(false);
    }
  }

  async function logout() {
    await fetch(
      "/api/auth/logout",
      {
        method: "POST",
      }
    );

    window.location.href =
      "/login";
  }

  if (loading) {
    return (
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-4">
            <div className="h-9 w-56 rounded-lg bg-white/10" />
            <div className="h-32 rounded-2xl bg-white/5" />
            <div className="h-80 rounded-2xl bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-emerald-400">
            VELLTO
          </p>

          <h1 className="text-2xl font-black sm:text-3xl">
            Configurações
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Gerencie os dados da empresa,
            sua conta, seu plano e a
            segurança do acesso.
          </p>
        </div>

        {(message || error) && (
          <div
            className={`mb-6 rounded-2xl border p-4 text-sm ${
              error
                ? "border-red-500/20 bg-red-500/10 text-red-300"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-6">

            <form
              onSubmit={saveBusiness}
              className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6"
            >
              <SectionTitle
                title="Dados da empresa"
                description="Informações principais do seu negócio."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field
                  label="Nome da empresa"
                  value={
                    businessForm.name
                  }
                  onChange={(value) =>
                    setBusinessForm(
                      (current) => ({
                        ...current,
                        name: value,
                      })
                    )
                  }
                />

                <Field
                  label="Categoria"
                  placeholder="Ex: Barbearia"
                  value={
                    businessForm.category
                  }
                  onChange={(value) =>
                    setBusinessForm(
                      (current) => ({
                        ...current,
                        category:
                          value,
                      })
                    )
                  }
                />

                <Field
                  label="WhatsApp"
                  placeholder="Ex: 21999999999"
                  value={
                    businessForm.whatsapp
                  }
                  onChange={(value) =>
                    setBusinessForm(
                      (current) => ({
                        ...current,
                        whatsapp:
                          value,
                      })
                    )
                  }
                />

                <Field
                  label="Instagram"
                  placeholder="@suaempresa"
                  value={
                    businessForm.instagram
                  }
                  onChange={(value) =>
                    setBusinessForm(
                      (current) => ({
                        ...current,
                        instagram:
                          value,
                      })
                    )
                  }
                />

                <div className="md:col-span-2">
                  <Field
                    label="Endereço"
                    placeholder="Endereço do estabelecimento"
                    value={
                      businessForm.address
                    }
                    onChange={(value) =>
                      setBusinessForm(
                        (current) => ({
                          ...current,
                          address:
                            value,
                        })
                      )
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Descrição
                  </label>

                  <textarea
                    rows={4}
                    value={
                      businessForm.description
                    }
                    onChange={(event) =>
                      setBusinessForm(
                        (current) => ({
                          ...current,
                          description:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Conte um pouco sobre seu negócio"
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/40"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <SaveButton
                  loading={
                    savingBusiness
                  }
                  text="Salvar empresa"
                />
              </div>
            </form>

            <form
              onSubmit={saveAccount}
              className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6"
            >
              <SectionTitle
                title="Minha conta"
                description="Dados utilizados para acessar o painel Vellto."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field
                  label="Nome"
                  value={
                    accountForm.name
                  }
                  onChange={(value) =>
                    setAccountForm(
                      (current) => ({
                        ...current,
                        name: value,
                      })
                    )
                  }
                />

                <Field
                  label="E-mail de acesso"
                  type="email"
                  value={
                    accountForm.email
                  }
                  onChange={(value) =>
                    setAccountForm(
                      (current) => ({
                        ...current,
                        email: value,
                      })
                    )
                  }
                />
              </div>

              <div className="mt-6 flex justify-end">
                <SaveButton
                  loading={
                    savingAccount
                  }
                  text="Salvar conta"
                />
              </div>
            </form>

            <form
              onSubmit={savePassword}
              className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6"
            >
              <SectionTitle
                title="Segurança"
                description="Altere a senha utilizada para entrar no painel."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Field
                  label="Senha atual"
                  type="password"
                  value={
                    passwordForm.currentPassword
                  }
                  onChange={(value) =>
                    setPasswordForm(
                      (current) => ({
                        ...current,
                        currentPassword:
                          value,
                      })
                    )
                  }
                />

                <Field
                  label="Nova senha"
                  type="password"
                  value={
                    passwordForm.newPassword
                  }
                  onChange={(value) =>
                    setPasswordForm(
                      (current) => ({
                        ...current,
                        newPassword:
                          value,
                      })
                    )
                  }
                />

                <Field
                  label="Confirmar nova senha"
                  type="password"
                  value={
                    passwordForm.confirmPassword
                  }
                  onChange={(value) =>
                    setPasswordForm(
                      (current) => ({
                        ...current,
                        confirmPassword:
                          value,
                      })
                    )
                  }
                />
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                A nova senha deve possuir pelo
                menos 8 caracteres.
              </p>

              <div className="mt-6 flex justify-end">
                <SaveButton
                  loading={
                    savingPassword
                  }
                  text="Alterar senha"
                />
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
                Seu plano
              </p>

              <h2 className="mt-3 text-2xl font-black">
                {data?.plan?.name ||
                  data?.business
                    ?.plan ||
                  "Plano"}
              </h2>

              {data?.plan?.description && (
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {
                    data.plan
                      .description
                  }
                </p>
              )}

              {data?.plan && (
                <>
                  <div className="mt-5 border-t border-white/10 pt-5">
                    <p className="text-3xl font-black">
                      {formatMoney(
                        data.plan
                          .price
                      )}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {data.plan
                        .billingCycle ===
                      "yearly"
                        ? "Cobrança anual"
                        : "Cobrança mensal"}
                    </p>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-zinc-300">
                    <PlanLine
                      label="Profissionais"
                      value={
                        data.plan
                          .maxProfessionals
                      }
                    />

                    <PlanLine
                      label="Serviços"
                      value={
                        data.plan
                          .maxServices
                      }
                    />
                  </div>
                </>
              )}

              <div className="mt-5 flex items-center gap-2 rounded-xl bg-black/20 p-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    data?.business
                      .active
                      ? "bg-emerald-400"
                      : "bg-red-400"
                  }`}
                />

                <span className="text-xs font-medium text-zinc-300">
                  {data?.business
                    .active
                    ? "Conta ativa"
                    : "Conta bloqueada"}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <p className="text-sm font-bold">
                Página pública
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Seu endereço público para
                clientes acessarem seu negócio
                e realizarem agendamentos.
              </p>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-400">
                /
                {data?.business.slug}
              </div>

              <a
                href={`/${data?.business.slug}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/5"
              >
                Ver página pública ↗
              </a>
            </div>

            <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-5">
              <p className="text-sm font-bold">
                Sessão
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Encerre sua sessão neste
                dispositivo.
              </p>

              <button
                type="button"
                onClick={logout}
                className="mt-4 w-full rounded-xl border border-red-500/20 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
              >
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold">
        {title}
      </h2>

      <p className="mt-1 text-sm text-zinc-500">
        {description}
      </p>
    </div>
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
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-300">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/40"
      />
    </div>
  );
}

function SaveButton({
  loading,
  text,
}: {
  loading: boolean;
  text: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading
        ? "Salvando..."
        : text}
    </button>
  );
}

function PlanLine({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>

      <span className="font-semibold text-white">
        {value === 0
          ? "Ilimitado"
          : value}
      </span>
    </div>
  );
}

function formatMoney(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(value || 0);
}
