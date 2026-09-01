"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type BusinessData = {
  id: string;
  name: string;
  slug: string;
  category: string;
  whatsapp: string;
  plan: string;
  active: boolean;

  owner: {
    id: string;
    name: string;
    email: string;
    active: boolean;
  } | null;
};

export default function GerenciarEmpresaPage() {
  const router = useRouter();
  const params = useParams();

  const id = String(params.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [resettingPassword, setResettingPassword] =
    useState(false);

  const [business, setBusiness] =
    useState<BusinessData | null>(null);

  const [message, setMessage] = useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [passwordMessage, setPasswordMessage] =
    useState("");

  useEffect(() => {
    loadBusiness();
  }, [id]);

  async function loadBusiness() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `/api/admin/businesses/${id}`,
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
            "Erro ao carregar empresa"
        );
        return;
      }

      setBusiness(data.business);
    } catch (error) {
      console.error(error);

      setMessage(
        "Erro ao carregar empresa"
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveBusiness() {
    if (!business) return;

    try {
      setSaving(true);
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
            active: business.active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao salvar alterações"
        );
        return;
      }

      setBusiness(data.business);

      setMessage(
        "Alterações salvas com sucesso!"
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Erro ao salvar alterações"
      );
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword() {
    if (!business?.owner) {
      setPasswordMessage(
        "Esta empresa não possui responsável vinculado."
      );
      return;
    }

    setPasswordMessage("");

    if (newPassword.length < 6) {
      setPasswordMessage(
        "A nova senha precisa ter pelo menos 6 caracteres."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage(
        "As senhas não coincidem."
      );
      return;
    }

    const confirmed = window.confirm(
      `Redefinir a senha de ${business.owner.name}?`
    );

    if (!confirmed) return;

    try {
      setResettingPassword(true);

      const response = await fetch(
        `/api/admin/businesses/${business.id}/reset-password`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setPasswordMessage(
          data.message ||
            "Erro ao redefinir senha"
        );
        return;
      }

      setNewPassword("");
      setConfirmPassword("");

      setPasswordMessage(
        "Senha redefinida com sucesso!"
      );
    } catch (error) {
      console.error(error);

      setPasswordMessage(
        "Erro ao redefinir senha"
      );
    } finally {
      setResettingPassword(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 p-8 text-white">
        Carregando empresa...
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() =>
              router.push("/admin/empresas")
            }
            className="mb-5 text-sm text-zinc-400"
          >
            ← Voltar
          </button>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            {message ||
              "Empresa não encontrada."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <button
          type="button"
          onClick={() =>
            router.push("/admin/empresas")
          }
          className="mb-5 text-sm text-zinc-400 hover:text-white"
        >
          ← Voltar para empresas
        </button>

        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          Super Admin
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          {business.name}
        </h1>

        <p className="mt-2 text-zinc-400">
          /{business.slug}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">
              Empresa
            </h2>

            <div className="mt-6 space-y-4">
              <Info
                label="Nome"
                value={business.name}
              />

              <Info
                label="Categoria"
                value={
                  business.category || "-"
                }
              />

              <Info
                label="WhatsApp"
                value={
                  business.whatsapp || "-"
                }
              />

              <Info
                label="Página pública"
                value={`/${business.slug}`}
              />

              <a
                href={`/${business.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-xl border border-white/10 px-4 py-3 text-sm"
              >
                Ver página pública
              </a>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">
              Responsável
            </h2>

            {business.owner ? (
              <div className="mt-6 space-y-4">
                <Info
                  label="Nome"
                  value={
                    business.owner.name
                  }
                />

                <Info
                  label="E-mail de acesso"
                  value={
                    business.owner.email
                  }
                />

                <Info
                  label="Status do usuário"
                  value={
                    business.owner.active
                      ? "Ativo"
                      : "Bloqueado"
                  }
                />
              </div>
            ) : (
              <p className="mt-6 text-zinc-500">
                Nenhum responsável vinculado.
              </p>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">
            Plano e acesso
          </h2>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Plano
              </label>

              <select
                value={business.plan}
                onChange={(e) =>
                  setBusiness(
                    (current) =>
                      current
                        ? {
                            ...current,
                            plan:
                              e.target.value,
                          }
                        : current
                  )
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

            <label className="flex cursor-pointer items-center justify-between gap-5 rounded-xl border border-white/10 bg-zinc-900 p-4">
              <div>
                <p className="font-medium">
                  Empresa ativa
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Desative para bloquear o acesso da empresa.
                </p>
              </div>

              <input
                type="checkbox"
                checked={business.active}
                onChange={(e) =>
                  setBusiness(
                    (current) =>
                      current
                        ? {
                            ...current,
                            active:
                              e.target.checked,
                          }
                        : current
                  )
                }
                className="h-5 w-5"
              />
            </label>

            <div
              className={`rounded-xl border p-4 ${
                business.active
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-red-500/20 bg-red-500/5"
              }`}
            >
              <p
                className={
                  business.active
                    ? "font-bold text-emerald-400"
                    : "font-bold text-red-400"
                }
              >
                {business.active
                  ? "EMPRESA ATIVA"
                  : "EMPRESA BLOQUEADA"}
              </p>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={saveBusiness}
          disabled={saving}
          className="mt-8 w-full rounded-xl bg-emerald-500 px-6 py-4 text-lg font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving
            ? "Salvando..."
            : "Salvar alterações"}
        </button>

        {message ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            {message}
          </div>
        ) : null}

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">
              Acesso do cliente
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Redefinir senha
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              Defina uma nova senha para o responsável desta empresa.
            </p>
          </div>

          {business.owner ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  Usuário
                </p>

                <p className="mt-1 font-medium">
                  {business.owner.name}
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  {business.owner.email}
                </p>
              </div>

              <PasswordField
                label="Nova senha"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Mínimo 6 caracteres"
              />

              <PasswordField
                label="Confirmar nova senha"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Digite novamente"
              />

              <button
                type="button"
                onClick={resetPassword}
                disabled={resettingPassword}
                className="w-full rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 font-bold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50"
              >
                {resettingPassword
                  ? "Redefinindo..."
                  : "Redefinir senha"}
              </button>

              {passwordMessage ? (
                <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-4 text-sm">
                  {passwordMessage}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
              Não existe um responsável vinculado a esta empresa.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </p>

      <p className="mt-1">
        {value}
      </p>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-400">
        {label}
      </label>

      <input
        type="password"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        autoComplete="new-password"
        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 outline-none focus:border-amber-500"
      />
    </div>
  );
}