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
    <main className="flex min-h-screen items-center justify-center bg-[#050b10] px-4 py-6 text-white sm:px-5 sm:py-10">
      <div className="w-full max-w-md">
        <div className="mb-5 flex items-center justify-center gap-3 sm:mb-7">
          {business.logoUrl ? (
            <img
              src={
                business.logoUrl
              }
              alt={
                business.name
              }
              className="h-11 w-11 shrink-0 rounded-xl object-cover sm:h-14 sm:w-14 sm:rounded-2xl"
            />
          ) : (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-black text-zinc-950 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-xl"
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
            <p className="hidden text-xs uppercase tracking-[0.18em] text-emerald-400 sm:block">
              Agendamento online
            </p>

            <h1 className="max-w-[220px] truncate text-lg font-bold sm:max-w-none sm:text-xl">
              {
                business.name
              }
            </h1>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a141d] p-4 shadow-2xl sm:rounded-3xl sm:p-8">
          <div className="text-center">
            {customer.photoUrl ? (
              <img
                src={
                  customer.photoUrl
                }
                alt={
                  customer.name
                }
                className="mx-auto mb-4 h-14 w-14 rounded-full object-cover sm:h-16 sm:w-16"
              />
            ) : null}

            <h2 className="text-xl font-bold sm:text-2xl">
              Só falta seu WhatsApp
            </h2>

            <p className="mt-2 text-xs leading-5 text-zinc-500 sm:text-sm sm:leading-6">
              Sua conta Google foi conectada com sucesso.
              Informe seu WhatsApp para concluir o cadastro.
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-[#071018] p-3 sm:mt-6 sm:p-4">
            <p className="font-semibold text-white">
              {
                customer.name
              }
            </p>

            {customer.email ? (
              <p className="mt-1 break-all text-xs text-zinc-500 sm:text-sm">
                {
                  customer.email
                }
              </p>
            ) : null}
          </div>

          <label className="mt-5 block sm:mt-6">
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
              className="min-h-[50px] w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-base outline-none transition placeholder:text-zinc-700 focus:border-emerald-500 sm:py-3.5"
            />
          </label>

          {message ? (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-amber-300 sm:mt-5 sm:p-4 sm:text-sm">
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
            className="mt-5 min-h-[52px] w-full rounded-xl bg-emerald-500 px-5 py-3.5 font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-40 sm:mt-6 sm:py-4"
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