"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type Business = {
  name: string;
  slug: string;
  logoUrl: string;
  primaryColor: string;
};

type Props = {
  business: Business;
};

type Mode =
  | "login"
  | "register";

export default function CustomerAuthClient({
  business,
}: Props) {
  const router =
    useRouter();

  const [mode, setMode] =
    useState<Mode>(
      "login"
    );

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  async function submitLogin() {
    if (
      normalizePhone(
        phone
      ).length < 10
    ) {
      setMessage(
        "Informe um WhatsApp válido."
      );

      return;
    }

    if (!password) {
      setMessage(
        "Informe sua senha."
      );

      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response =
        await fetch(
          "/api/customer/login",
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
                password,
              }),
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        setMessage(
          data.message ||
            "Não foi possível entrar."
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
        "Erro ao realizar login."
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister() {
    if (!name.trim()) {
      setMessage(
        "Informe seu nome."
      );

      return;
    }

    if (
      normalizePhone(
        phone
      ).length < 10
    ) {
      setMessage(
        "Informe um WhatsApp válido."
      );

      return;
    }

    if (
      password.length < 8
    ) {
      setMessage(
        "Sua senha precisa ter pelo menos 8 caracteres."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setMessage(
        "As senhas não coincidem."
      );

      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response =
        await fetch(
          "/api/customer/register",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name,
                phone,
                email,
                password,
              }),
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        setMessage(
          data.message ||
            "Não foi possível criar sua conta."
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
        "Erro ao criar conta."
      );
    } finally {
      setLoading(false);
    }
  }

  function googleLogin() {
    setMessage("");

    window.location.href =
      `/api/customer/google/start?slug=${encodeURIComponent(
        business.slug
      )}`;
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
              {business.name}
            </h1>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0a141d] p-6 shadow-2xl sm:p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {mode ===
              "login"
                ? "Entre para agendar"
                : "Crie sua conta"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {mode ===
              "login"
                ? "Acesse sua conta para escolher seu horário."
                : "Faça seu cadastro para continuar com o agendamento."}
            </p>
          </div>

          <button
            type="button"
            onClick={
              googleLogin
            }
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3.5 font-semibold text-zinc-900 transition hover:bg-zinc-100"
          >
            <GoogleIcon />

            Continuar com Google
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />

            <span className="text-xs uppercase tracking-wider text-zinc-600">
              ou
            </span>

            <div className="h-px flex-1 bg-white/10" />
          </div>

          {mode ===
          "register" ? (
            <Field
              label="Nome completo"
              value={name}
              placeholder="Seu nome"
              onChange={
                setName
              }
            />
          ) : null}

          <div
            className={
              mode ===
              "register"
                ? "mt-4"
                : ""
            }
          >
            <Field
              label="WhatsApp"
              value={phone}
              placeholder="(21) 99999-9999"
              inputMode="tel"
              onChange={
                setPhone
              }
            />
          </div>

          {mode ===
          "register" ? (
            <div className="mt-4">
              <Field
                label="E-mail (opcional)"
                value={email}
                placeholder="seuemail@gmail.com"
                inputMode="email"
                onChange={
                  setEmail
                }
              />
            </div>
          ) : null}

          <div className="mt-4">
            <Field
              label="Senha"
              value={
                password
              }
              placeholder="Sua senha"
              type="password"
              onChange={
                setPassword
              }
            />
          </div>

          {mode ===
          "register" ? (
            <div className="mt-4">
              <Field
                label="Confirmar senha"
                value={
                  confirmPassword
                }
                placeholder="Digite novamente"
                type="password"
                onChange={
                  setConfirmPassword
                }
              />
            </div>
          ) : null}

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
              mode ===
              "login"
                ? submitLogin
                : submitRegister
            }
            className="mt-6 w-full rounded-xl bg-emerald-500 px-5 py-4 font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-40"
          >
            {loading
              ? "Aguarde..."
              : mode ===
                  "login"
                ? "Entrar"
                : "Criar minha conta"}
          </button>

          <div className="mt-6 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-zinc-500">
              {mode ===
              "login"
                ? "Ainda não tem uma conta?"
                : "Já possui uma conta?"}
            </p>

            <button
              type="button"
              onClick={() => {
                setMode(
                  mode ===
                    "login"
                    ? "register"
                    : "login"
                );

                setMessage(
                  ""
                );

                setPassword(
                  ""
                );

                setConfirmPassword(
                  ""
                );
              }}
              className="mt-2 font-semibold text-emerald-400 transition hover:text-emerald-300"
            >
              {mode ===
              "login"
                ? "Criar minha conta"
                : "Entrar na minha conta"}
            </button>
          </div>
        </div>

        <a
          href={`/${business.slug}`}
          className="mt-6 block text-center text-sm text-zinc-600 transition hover:text-zinc-400"
        >
          ← Voltar para {business.name}
        </a>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  placeholder,
  type = "text",
  inputMode = "text",
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;

  type?:
    | "text"
    | "password";

  inputMode?:
    | "text"
    | "tel"
    | "email";

  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-400">
        {label}
      </span>

      <input
        type={type}
        inputMode={
          inputMode
        }
        value={value}
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3.5 outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z"
      />

      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.62-2.38l-3.24-2.53c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z"
      />

      <path
        fill="#FBBC05"
        d="M6.39 13.92A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.47H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.53l3.35-2.61Z"
      />

      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.5 3.82 1.5l2.87-2.87C16.96 2.97 14.7 2 12 2a10 10 0 0 0-8.96 5.47l3.35 2.61C7.18 7.71 9.39 5.95 12 5.95Z"
      />
    </svg>
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

async function readJsonResponse(
  response: Response
): Promise<any> {
  const text =
    await response.text();

  if (!text.trim()) {
    throw new Error(
      `A API respondeu sem conteúdo. Status ${response.status}.`
    );
  }

  return JSON.parse(
    text
  );
}