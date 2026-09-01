"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  business: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    active: boolean;
  } | null;
};

export default function UsuariosPage() {
  const router = useRouter();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/users",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Erro ao carregar usuários."
        );
        return;
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error(error);
      setMessage("Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleUser(user: UserItem) {
    try {
      setSavingId(user.id);
      setMessage("");

      const response = await fetch(
        "/api/admin/users",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: user.id,
            active: !user.active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Erro ao alterar usuário."
        );
        return;
      }

      await loadUsers();
    } catch (error) {
      console.error(error);
      setMessage("Erro ao alterar usuário.");
    } finally {
      setSavingId("");
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return users;

    return users.filter((user) => {
      return [
        user.name,
        user.email,
        user.role,
        user.business?.name || "",
      ].some((value) =>
        value.toLowerCase().includes(term)
      );
    });
  }, [search, users]);

  const owners = users.filter(
    (user) => user.role === "owner"
  ).length;

  const active = users.filter(
    (user) => user.active
  ).length;

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
            Usuários
          </h1>

          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            Gerencie os usuários que possuem acesso ao sistema.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Stat
            label="Total"
            value={users.length}
          />

          <Stat
            label="Ativos"
            value={active}
          />

          <Stat
            label="Proprietários"
            value={owners}
          />
        </div>

        <div className="mt-6">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Buscar por nome, e-mail ou empresa..."
            className="min-h-12 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 text-base outline-none focus:border-emerald-500"
          />
        </div>

        {message ? (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {message}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {loading ? (
            <div className="p-6 text-zinc-400">
              Carregando usuários...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-zinc-400">
              Nenhum usuário encontrado.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filtered.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">
                        {user.name ||
                          "Usuário sem nome"}
                      </p>

                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-300">
                        {user.role ===
                        "superadmin"
                          ? "Super Admin"
                          : user.role === "owner"
                          ? "Proprietário"
                          : user.role}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          user.active
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {user.active
                          ? "Ativo"
                          : "Inativo"}
                      </span>
                    </div>

                    <p className="mt-1 break-all text-sm text-zinc-400">
                      {user.email}
                    </p>

                    {user.business ? (
                      <p className="mt-2 text-sm text-zinc-500">
                        Empresa:{" "}
                        <span className="text-zinc-300">
                          {user.business.name}
                        </span>{" "}
                        • Plano{" "}
                        {user.business.plan}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    disabled={savingId === user.id}
                    onClick={() =>
                      toggleUser(user)
                    }
                    className={`min-h-11 rounded-xl border px-4 text-sm font-semibold disabled:opacity-50 ${
                      user.active
                        ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                        : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    }`}
                  >
                    {savingId === user.id
                      ? "Salvando..."
                      : user.active
                      ? "Desativar"
                      : "Ativar"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <p className="text-xs text-zinc-500 sm:text-sm">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold sm:text-3xl">
        {value}
      </p>
    </div>
  );
}
