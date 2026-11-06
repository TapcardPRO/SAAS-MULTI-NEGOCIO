"use client";

import { useEffect, useMemo, useState } from "react";

type WaitlistItem = {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceNames: string[];
  professionalName: string;
  professionalId: string;
  preferredDate: string;
  availableDate: string;
  availableTime: string;
  status: "waiting" | "contacted" | "booked" | "cancelled";
  createdAt?: string | null;
};

const statusLabels: Record<WaitlistItem["status"], string> = {
  waiting: "Aguardando vaga",
  contacted: "Contato realizado",
  booked: "Agendamento realizado",
  cancelled: "Cancelado",
};

export default function ListaEsperaPage() {
  const [items, setItems] = useState<WaitlistItem[]>([]);
  const [professionals, setProfessionals] = useState<{ id: string; name: string }[]>([]);
  const [professionalFilter, setProfessionalFilter] = useState("all");
  const [vacancyDrafts, setVacancyDrafts] = useState<Record<string, { date: string; time: string }>>({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"active" | "all">("active");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/dashboard/waitlist", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Não foi possível carregar a lista.");
      setItems(Array.isArray(data.waitlist) ? data.waitlist : []);
      setProfessionals(Array.isArray(data.professionals) ? data.professionals : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar lista de espera.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(item: WaitlistItem, status: WaitlistItem["status"]) {
    setUpdatingId(item.id);
    setError("");
    try {
      const response = await fetch("/api/dashboard/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Não foi possível atualizar.");
      setItems(current => current.map(entry => entry.id === item.id ? { ...entry, status } : entry));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar registro.");
    } finally {
      setUpdatingId("");
    }
  }

  async function offerVacancy(item: WaitlistItem) {
    const draft = vacancyDrafts[item.id] || { date: item.availableDate || item.preferredDate || "", time: item.availableTime || "" };
    if (!draft.date || !draft.time) { setError("Informe a data e o horário da vaga."); return; }
    setUpdatingId(item.id); setError("");
    try {
      const response = await fetch("/api/dashboard/waitlist", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, availableDate: draft.date, availableTime: draft.time }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Não foi possível registrar a vaga.");
      const updated = { ...item, availableDate: draft.date, availableTime: draft.time, status: "contacted" as const };
      setItems(current => current.map(entry => entry.id === item.id ? updated : entry));
      const digits = item.clientPhone.replace(/\\D/g, "");
      if (digits) {
        const number = digits.startsWith("55") ? digits : `55${digits}`;
        const dateLabel = new Date(`${draft.date}T12:00:00`).toLocaleDateString("pt-BR");
        const message = `Olá, ${item.clientName}! Conseguimos uma vaga para você. 😊\\n\\nServiço: ${item.serviceNames.join(", ")}\\nProfissional: ${item.professionalName || "Nossa equipe"}\\nData: ${dateLabel}\\nHorário: ${draft.time}\\n\\nResponda para confirmarmos seu agendamento.`;
        window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao registrar vaga."); }
    finally { setUpdatingId(""); }
  }

  const visibleItems = useMemo(
    () => items.filter(item => (filter === "all" || item.status === "waiting" || item.status === "contacted") && (professionalFilter === "all" || item.professionalId === professionalFilter)),
    [items, filter, professionalFilter]
  );
  const waitingCount = items.filter(item => item.status === "waiting").length;

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-400">AGENDA INTELIGENTE</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Lista de espera</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Clientes que querem ser avisados quando surgir uma vaga nas datas escolhidas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-xs text-zinc-500">Aguardando</p>
              <p className="text-2xl font-black text-emerald-400">{waitingCount}</p>
            </div>
            <button type="button" onClick={load} disabled={loading} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/5 disabled:opacity-50">
              Atualizar
            </button>
          </div>
        </div>

        {error ? <div role="alert" className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">\n          <div className="flex gap-2">
          <button type="button" onClick={() => setFilter("active")} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === "active" ? "bg-emerald-500 text-black" : "border border-white/10 text-zinc-400"}`}>Em aberto</button>
          <button type="button" onClick={() => setFilter("all")} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === "all" ? "bg-emerald-500 text-black" : "border border-white/10 text-zinc-400"}`}>Todos</button>\n          </div>\n          {professionals.length > 1 ? <select value={professionalFilter} onChange={event => setProfessionalFilter(event.target.value)} aria-label="Filtrar por profissional" className="min-h-11 rounded-xl border border-white/10 bg-[#101820] px-4 text-sm text-white"><option value="all">Todos os profissionais</option>{professionals.map(professional => <option key={professional.id} value={professional.id}>{professional.name}</option>)}</select> : null}\n        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-10 text-center text-sm text-zinc-500">Carregando lista de espera...</div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <p className="text-base font-bold">Nenhum cliente nesta lista</p>
            <p className="mt-2 text-sm text-zinc-500">Quando um cliente solicitar uma vaga pela página pública, ele aparecerá aqui.</p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {visibleItems.map(item => {
              const phone = item.clientPhone.replace(/\D/g, "");
              const dateLabel = item.preferredDate ? new Date(`${item.preferredDate}T12:00:00`).toLocaleDateString("pt-BR") : "Data não informada";
              return (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold">{item.clientName}</h2>
                      <p className="mt-1 text-xs text-zinc-500">{item.clientPhone}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${item.status === "waiting" ? "bg-amber-400/10 text-amber-300" : item.status === "contacted" ? "bg-sky-400/10 text-sky-300" : item.status === "booked" ? "bg-emerald-400/10 text-emerald-300" : "bg-zinc-500/10 text-zinc-400"}`}>{statusLabels[item.status]}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-zinc-500">Serviço(s)</p><p className="mt-1 font-medium">{item.serviceNames.join(", ") || "Não informado"}</p></div>
                    <div><p className="text-xs text-zinc-500">Profissional</p><p className="mt-1 font-medium">{item.professionalName || "Não informado"}</p></div>
                    <div><p className="text-xs text-zinc-500">Data desejada</p><p className="mt-1 font-medium">{dateLabel}</p></div>
                    <div><p className="text-xs text-zinc-500">Solicitação</p><p className="mt-1 font-medium">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : "—"}</p></div>
                  </div>
                  <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-4">\n                    <p className="mb-3 text-sm font-bold">Informar horário disponível</p>\n                    <div className="grid gap-3 sm:grid-cols-2">\n                      <label className="text-xs text-zinc-400">Data da vaga<input type="date" value={(vacancyDrafts[item.id] || { date: item.availableDate || item.preferredDate || "", time: item.availableTime || "" }).date} onChange={event => setVacancyDrafts(current => ({ ...current, [item.id]: { ...(current[item.id] || { date: item.availableDate || item.preferredDate || "", time: item.availableTime || "" }), date: event.target.value } }))} className="mt-1 min-h-11 w-full rounded-lg border border-white/10 bg-[#101820] px-3 text-sm text-white" /></label>\n                      <label className="text-xs text-zinc-400">Horário<input type="time" value={(vacancyDrafts[item.id] || { date: item.availableDate || item.preferredDate || "", time: item.availableTime || "" }).time} onChange={event => setVacancyDrafts(current => ({ ...current, [item.id]: { ...(current[item.id] || { date: item.availableDate || item.preferredDate || "", time: item.availableTime || "" }), time: event.target.value } }))} className="mt-1 min-h-11 w-full rounded-lg border border-white/10 bg-[#101820] px-3 text-sm text-white" /></label>\n                    </div>\n                    <button type="button" disabled={updatingId === item.id} onClick={() => offerVacancy(item)} className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-black disabled:opacity-50">{updatingId === item.id ? "Salvando..." : "Salvar vaga e avisar no WhatsApp"}</button>\n                  </div>\n                  {item.availableDate && item.availableTime ? <p className="mt-3 rounded-lg bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">Vaga informada: {new Date(`${item.availableDate}T12:00:00`).toLocaleDateString("pt-BR")} às {item.availableTime}</p> : null}\n                  <div className="mt-5 flex flex-wrap gap-2">
                    {phone ? <a href={`https://wa.me/55${phone}`} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-black">Chamar no WhatsApp</a> : null}
                    {item.status !== "contacted" && item.status !== "booked" && item.status !== "cancelled" ? <button type="button" disabled={updatingId === item.id} onClick={() => updateStatus(item, "contacted")} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold disabled:opacity-50">Marcar contato</button> : null}
                    {item.status !== "booked" && item.status !== "cancelled" ? <button type="button" disabled={updatingId === item.id} onClick={() => updateStatus(item, "booked")} className="rounded-xl border border-emerald-500/30 px-4 py-2.5 text-xs font-semibold text-emerald-300 disabled:opacity-50">Marcar agendado</button> : null}
                    {item.status !== "cancelled" && item.status !== "booked" ? <button type="button" disabled={updatingId === item.id} onClick={() => updateStatus(item, "cancelled")} className="rounded-xl border border-red-500/20 px-4 py-2.5 text-xs font-semibold text-red-300 disabled:opacity-50">Encerrar</button> : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
