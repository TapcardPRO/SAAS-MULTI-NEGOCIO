"use client";

import { useEffect, useState } from "react";

export default function MinhasVagasPage() {
  const [name, setName] = useState("");
  const [bookingCapacity, setBookingCapacity] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/minhas-vagas", { cache: "no-store" })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw Error(d.message || "Erro ao carregar vagas."); return d; })
      .then(d => { setName(d.name); setBookingCapacity(String(d.bookingCapacity)); })
      .catch(e => setMessage(e instanceof Error ? e.message : "Erro ao carregar vagas."))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    const value = Number(bookingCapacity);
    if (!Number.isInteger(value) || value < 1 || value > 30) {
      setMessage("Informe um numero inteiro de 1 a 30 vagas."); return;
    }
    try {
      setSaving(true); setMessage("");
      const r = await fetch("/api/dashboard/minhas-vagas", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingCapacity: value }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.message || "Falha ao atualizar vagas.");
      setMessage("Capacidade salva! As proximas reservas respeitarao esse limite.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Falha ao atualizar vagas."); }
    finally { setSaving(false); }
  }

  return <main className="mx-auto max-w-2xl p-4 pb-24 text-white sm:p-8">
    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Minha agenda</p>
    <h1 className="mt-3 text-3xl font-black">Vagas simultâneas</h1>
    <p className="mt-3 text-sm leading-7 text-zinc-400">
      Defina quantos clientes você pode atender ao mesmo tempo no mesmo horário.
      Se trabalha com bronzeamento e recebe 6 clientes por sessão, configure 6.
      Sua agenda bloqueará novos agendamentos quando todas as vagas estiverem ocupadas.
    </p>
    <section className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="font-bold">{name || "Profissional"}</p>
      <label htmlFor="my-booking-capacity" className="mt-5 block text-sm font-semibold">Quantidade de vagas por horário</label>
      <input id="my-booking-capacity" type="number" min="1" max="30" step="1"
        disabled={loading || saving} value={bookingCapacity}
        onChange={e=>setBookingCapacity(e.target.value)}
        className="mt-2 w-full rounded-xl border border-white/15 bg-[#14232a] px-4 py-3 text-white outline-none focus:border-emerald-500" />
      <p className="mt-2 text-xs text-zinc-400">Padrão: 1 vaga. Valores entre 1 e 30.</p>
      <button type="button" disabled={loading || saving} onClick={save}
        className="mt-6 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-emerald-950 disabled:opacity-50">
        {saving ? "Salvando..." : "Salvar capacidade"}
      </button>
      {message && <p role="status" className="mt-4 rounded-xl border border-white/10 p-3 text-sm text-zinc-200">{message}</p>}
    </section>
  </main>;
}
