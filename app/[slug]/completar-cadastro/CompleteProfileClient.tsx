"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type Props = {
  business: {
    name: string;
    slug: string;
    logoUrl: string;
    primaryColor: string;
  };

  customer: {
    name: string;
    email: string;
    photoUrl: string;
  };
};

export default function CompleteProfileClient({
  business,
  customer,
}: Props) {
  const router =
    useRouter();

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  async function submit() {
    const normalized =
      normalizePhone(
        phone
      );

    if (
      normalized.length < 10
    ) {
      setMessage(
        "Informe um WhatsApp válido."
      );

      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response =
        await fetch(
          "/api/customer/complete-profile",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                phone,
              }),
          }
        );

      const text =
        await response.text();

      let data:
        | {
            ok?: boolean;
            message?: string;
          }
        | null = null;

      try {
        data =
          text
            ? JSON.parse(
                text
              )
            : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        setMessage(
          data?.message ||
            "Não foi possível salvar seu WhatsApp."
        );

        return;
      }

      router.push(
        `/${business.slug}/agendar`
      );

      router.refresh();
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "Erro ao salvar seu cadastro."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050b10] px-5 py-10 text-white">
      <div className="w-full max-w-md">
        <div className="mb-7 flex items-center justify-center gap-3">
          {business.logoUrl ? (
            <img
              src={
                business.logoUrl
              }
              alt={
                business.name
              }
              className="h-14 w-14 rounded-2xl object-cover"
            />
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black text-zinc-950"
              style={{
                backgroundColor:
                  business.primaryColor ||
                  "#10b981",
              }}
            >
              {business.name
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">
              Agendamento online
            </p>

            <h1 className="text-xl font-bold">
              {
                business.name
              }
            </h1>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0a141d] p-6 shadow-2xl sm:p-8">
          <div className="text-center">
            {customer.photoUrl ? (
              <img
                src={
                  customer.photoUrl
                }
                alt={
                  customer.name
                }
                className="mx-auto mb-4 h-16 w-16 rounded-full object-cover"
              />
            ) : null}

            <h2 className="text-2xl font-bold">
              Só falta seu WhatsApp
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Sua conta Google foi conectada com sucesso.
              Informe seu WhatsApp para concluir o cadastro.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-[#071018] p-4">
            <p className="font-semibold text-white">
              {
                customer.name
              }
            </p>

            {customer.email ? (
              <p className="mt-1 text-sm text-zinc-500">
                {
                  customer.email
                }
              </p>
            ) : null}
          </div>

          <label className="mt-6 block">
            <span className="mb-2 block text-sm font-medium text-zinc-400">
              WhatsApp
            </span>

            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              placeholder="(21) 99999-9999"
              onChange={(
                event
              ) =>
                setPhone(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3.5 outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
            />
          </label>

          {message ? (
            <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300">
              {message}
            </div>
          ) : null}

          <button
            type="button"
            disabled={
              loading
            }
            onClick={
              submit
            }
            className="mt-6 w-full rounded-xl bg-emerald-500 px-5 py-4 font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-40"
          >
            {loading
              ? "Salvando..."
              : "Continuar para agendar"}
          </button>
        </div>
      </div>
    </main>
  );
}

function normalizePhone(
  value: string
) {
  return value.replace(
    /\D/g,
    ""
  );
}