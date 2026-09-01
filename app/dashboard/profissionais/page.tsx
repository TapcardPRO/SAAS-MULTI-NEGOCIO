"use client";

import { useEffect, useMemo, useState } from "react";

type Professional = {
  _id: string;
  name: string;
  role?: string;
  description?: string;
  photoUrl?: string;
  active?: boolean;
  order?: number;
};

export default function ProfissionaisPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProfessionals();
  }, []);

  async function loadProfessionals() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        "/api/dashboard/professionals",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Erro ao carregar profissionais"
        );
        return;
      }

      setProfessionals(data.professionals || []);
    } catch (error) {
      console.error(error);
      setMessage("Erro ao carregar profissionais");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return professionals;

    return professionals.filter((professional) => {
      const text = [
        professional.name,
        professional.role,
        professional.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [professionals, search]);

  const activeCount = professionals.filter(
    (professional) => professional.active !== false
  ).length;

  const inactiveCount =
    professionals.length - activeCount;

  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10 bg-[#09131d]/70 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Painel da empresa
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Profissionais
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Gerencie a equipe que atende seus clientes.
            </p>
          </div>

          <a
            href="/dashboard/minha-pagina"
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 sm:w-auto sm:px-5"
          >
            + Novo profissional
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total"
            value={professionals.length}
            detail="Profissionais cadastrados"
          />

          <StatCard
            label="Ativos"
            value={activeCount}
            detail="Disponíveis para atendimento"
          />

          <StatCard
            label="Inativos"
            value={inactiveCount}
            detail="Não aparecem no agendamento"
          />
        </div>

        <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:mt-6 sm:p-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Buscar profissional
          </label>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Nome, cargo ou descrição..."
            className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#0b1620] px-4 py-3 text-base outline-none focus:border-emerald-500 sm:text-sm"
          />
        </section>

        {message ? (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {message}
          </div>
        ) : null}

        <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] sm:mt-6">
          <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4 sm:items-center sm:p-5">
            <div>
              <h2 className="font-bold">
                Equipe
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                {filtered.length} profissional
                {filtered.length === 1 ? "" : "ais"}
              </p>
            </div>
          </div>

          {loading ? (
            <EmptyState
              title="Carregando profissionais..."
              description="Aguarde enquanto buscamos sua equipe."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Nenhum profissional encontrado"
              description="Cadastre profissionais em Minha Página."
            />
          ) : (
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((professional) => (
                <ProfessionalCard
                  key={professional._id}
                  professional={professional}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ProfessionalCard({
  professional,
}: {
  professional: Professional;
}) {
  const active = professional.active !== false;

  return (
    <article className="rounded-2xl border border-white/10 bg-black/10 p-5">
      <div className="flex items-start gap-4">
        {professional.photoUrl ? (
          <img
            src={professional.photoUrl}
            alt={professional.name}
            className="h-16 w-16 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl font-bold text-emerald-400">
            {professional.name
              .charAt(0)
              .toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-bold">
              {professional.name}
            </h3>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                active
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {active ? "Ativo" : "Inativo"}
            </span>
          </div>

          <p className="mt-1 text-sm text-zinc-400">
            {professional.role || "Profissional"}
          </p>
        </div>
      </div>

      {professional.description ? (
        <p className="mt-4 text-sm leading-6 text-zinc-500">
          {professional.description}
        </p>
      ) : null}

      <div className="mt-5 flex gap-2">
        <a
          href="/dashboard/minha-pagina"
          className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/5"
        >
          Editar
        </a>

        <a
          href="/dashboard/horarios"
          className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-center text-sm font-bold text-zinc-950 transition hover:bg-emerald-400"
        >
          Horários
        </a>
      </div>
    </article>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <p className="text-sm text-zinc-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold tracking-tight">
        {value}
      </p>

      {detail ? (
        <p className="mt-3 text-xs text-emerald-400">
          {detail}
        </p>
      ) : null}
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
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-xl">
        ♧
      </div>

      <h3 className="mt-4 font-semibold">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
        {description}
      </p>
    </div>
  );
}