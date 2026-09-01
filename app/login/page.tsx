"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setMessage("Informe e-mail e senha.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/auth/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Não foi possível entrar."
        );
        return;
      }

      if (data.user?.role === "superadmin") {
        router.push("/admin");
      } else {
        router.push("/dashboard/minha-pagina");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
            Área de acesso
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Entrar no sistema
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Acesse sua conta para gerenciar o sistema.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6"
        >
          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              E-mail
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 outline-none transition focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Senha
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              autoComplete="current-password"
              placeholder="Sua senha"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 outline-none transition focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          {message ? (
            <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-4 text-sm">
              {message}
            </div>
          ) : null}
        </form>
      </div>
    </main>
  );
}