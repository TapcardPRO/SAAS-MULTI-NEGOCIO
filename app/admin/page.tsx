"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);

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

      setUser(data.user);
    } catch (error) {
      console.error(error);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 p-8 text-white">
        Carregando painel administrativo...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Super Admin
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Painel administrativo
            </h1>

            <p className="mt-2 text-zinc-400">
              Olá, {user?.name || "Administrador"}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-red-500/30 px-5 py-3 text-sm text-red-400"
          >
            Sair
          </button>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <AdminCard
            title="Empresas"
            description="Visualizar empresas cadastradas"
            href="/admin/empresas"
          />

          <AdminCard
            title="Nova empresa"
            description="Criar empresa + acesso do cliente"
            href="/admin/nova-empresa"
          />

          <AdminCard
            title="Usuários"
            description="Gerenciar acessos"
            href="/admin/usuarios"
          />

          <AdminCard
            title="Planos"
            description="Gerenciar planos e status"
            href="/admin/planos"
          />
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">
            Super Admin funcionando ✅
          </h2>

          <p className="mt-3 text-zinc-400">
            Use os cards acima para administrar o SaaS.
          </p>
        </div>
      </div>
    </main>
  );
}

function AdminCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-emerald-500/40 hover:bg-white/10"
    >
      <h2 className="text-lg font-bold">
        {title}
      </h2>

      <p className="mt-2 text-sm text-zinc-400">
        {description}
      </p>

      <p className="mt-5 text-sm font-semibold text-emerald-400">
        Abrir →
      </p>
    </Link>
  );
}