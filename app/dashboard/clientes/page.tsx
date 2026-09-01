"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Client = {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  totalVisits?: number;
  totalSpent?: number;
};

export default function ClientesPage() {
  const [clients, setClients] =
    useState<Client[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [notes, setNotes] =
    useState("");

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        "/api/dashboard/clients",
        {
          cache: "no-store",
        }
      );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao carregar clientes"
        );
        return;
      }

      setClients(
        data.clients || []
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar clientes"
      );
    } finally {
      setLoading(false);
    }
  }

  function openForm() {
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");

    setMessage("");
    setSuccess("");

    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
  }

  async function createClient() {
    if (!name.trim()) {
      setMessage(
        "Informe o nome do cliente."
      );
      return;
    }

    if (!phone.trim()) {
      setMessage(
        "Informe o WhatsApp do cliente."
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setSuccess("");

      const response = await fetch(
        "/api/dashboard/clients",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name,
            phone,
            email,
            notes,
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
            `Erro ao cadastrar cliente (${response.status})`
        );
        return;
      }

      setShowForm(false);

      setName("");
      setPhone("");
      setEmail("");
      setNotes("");

      setSuccess(
        "Cliente cadastrado com sucesso."
      );

      await loadClients();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao cadastrar cliente"
      );
    } finally {
      setSaving(false);
    }
  }

  const filtered =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return clients;
      }

      return clients.filter(
        (client) =>
          [
            client.name,
            client.phone,
            client.email,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(term)
      );
    }, [
      clients,
      search,
    ]);

  const totalRevenue =
    clients.reduce(
      (total, client) =>
        total +
        Number(
          client.totalSpent || 0
        ),
      0
    );

  const totalVisits =
    clients.reduce(
      (total, client) =>
        total +
        Number(
          client.totalVisits || 0
        ),
      0
    );

  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10 bg-[#09131d]/70 px-6 py-5 backdrop-blur-xl lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Painel da empresa
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              Clientes
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Cadastre e gerencie
              os clientes do seu negócio.
            </p>
          </div>

          <button
            type="button"
            onClick={openForm}
            className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400"
          >
            + Novo cliente
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Clientes"
            value={
              clients.length
            }
            detail="Total cadastrado"
          />

          <StatCard
            label="Atendimentos"
            value={
              totalVisits
            }
            detail="Histórico acumulado"
          />

          <StatCard
            label="Valor histórico"
            value={money(
              totalRevenue
            )}
            detail="Total gasto"
          />
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Buscar cliente
          </label>

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Nome, WhatsApp ou e-mail..."
            className="w-full rounded-xl border border-white/10 bg-[#0b1620] px-4 py-3 text-sm outline-none focus:border-emerald-500"
          />
        </section>

        {message ? (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {message}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300">
            {success}
          </div>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
          <div className="border-b border-white/10 p-5">
            <h2 className="font-bold">
              Base de clientes
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              {filtered.length} cliente
              {filtered.length === 1
                ? ""
                : "s"}
            </p>
          </div>

          {loading ? (
            <EmptyState
              title="Carregando clientes..."
              description="Aguarde."
            />
          ) : filtered.length ===
            0 ? (
            <EmptyState
              title="Nenhum cliente cadastrado"
              description="Clique em Novo cliente para cadastrar o primeiro."
            />
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(
                (client) => (
                  <div
                    key={
                      client._id
                    }
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 font-bold text-emerald-400">
                      {initials(
                        client.name
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        {
                          client.name
                        }
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        {
                          client.phone
                        }
                      </p>

                      {client.email ? (
                        <p className="mt-1 text-xs text-zinc-600">
                          {
                            client.email
                          }
                        </p>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:w-64">
                      <MiniInfo
                        label="Visitas"
                        value={String(
                          client.totalVisits ||
                            0
                        )}
                      />

                      <MiniInfo
                        label="Total gasto"
                        value={money(
                          Number(
                            client.totalSpent ||
                              0
                          )
                        )}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0a141d]">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Clientes
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Novo cliente
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                className="rounded-xl border border-white/10 px-4 py-2 text-zinc-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 p-5">
              <Field
                label="Nome"
                value={name}
                onChange={setName}
                placeholder="Nome do cliente"
              />

              <Field
                label="WhatsApp"
                value={phone}
                onChange={setPhone}
                placeholder="(21) 99999-9999"
              />

              <Field
                label="E-mail"
                value={email}
                onChange={setEmail}
                placeholder="Opcional"
                type="email"
              />

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Observações
                </label>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Opcional"
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              {message ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">
                  {message}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    createClient
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 disabled:opacity-40"
                >
                  {saving
                    ? "Cadastrando..."
                    : "Cadastrar cliente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

async function readJsonResponse(
  response: Response
) {
  const text =
    await response.text();

  if (!text) {
    throw new Error(
      `A API respondeu sem conteúdo. Status ${response.status}.`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    console.error(
      "Resposta da API:",
      text
    );

    throw new Error(
      `A API não retornou JSON válido. Status ${response.status}.`
    );
  }
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
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-sm outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value:
    | string
    | number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <p className="text-sm text-zinc-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-3 text-xs text-emerald-400">
        {detail}
      </p>
    </div>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/10 p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-12 text-center">
      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function money(
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

function initials(
  name: string
) {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (!parts.length) {
    return "?";
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[
      parts.length - 1
    ][0]
  }`.toUpperCase();
}