"use client";

import { useMemo, useState } from "react";

type Business = { name: string; slug: string; logoUrl: string; primaryColor: string };
type Service = { id: string; name: string; description: string; price: number; duration: number; photoUrl: string };
type Professional = { id: string; name: string; role: string; photoUrl: string };

type Props = { business: Business; services: Service[]; professionals: Professional[] };

export default function BookingClient({ business, services, professionals }: Props) {
  const [serviceId, setServiceId] = useState("");
  const [professionalId, setProfessionalId] = useState("any");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [client, setClient] = useState({ name: "", phone: "", email: "", notes: "" });

  const service = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);
  const professional = useMemo(() => professionals.find((p) => p.id === professionalId), [professionals, professionalId]);

  async function loadSlots(nextDate = date, nextServiceId = serviceId, nextProfessionalId = professionalId) {
    setTime("");
    setSlots([]);
    if (!nextDate || !nextServiceId) return;
    try {
      setLoadingSlots(true);
      setMessage("");
      const q = new URLSearchParams({ date: nextDate, serviceId: nextServiceId, professionalId: nextProfessionalId || "any" });
      const response = await fetch(`/api/public/${business.slug}/availability?${q.toString()}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) return setMessage(data.message || "Erro ao buscar horários");
      setSlots(data.slots || []);
    } catch {
      setMessage("Erro ao buscar horários");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function submit() {
    if (!serviceId || !date || !time || !client.name.trim() || !client.phone.trim()) {
      setMessage("Preencha serviço, data, horário, nome e WhatsApp.");
      return;
    }
    try {
      setSubmitting(true);
      setMessage("");
      const response = await fetch(`/api/public/${business.slug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, professionalId, date, time, clientName: client.name, clientPhone: client.phone, clientEmail: client.email, notes: client.notes }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || "Não foi possível agendar");
        if (response.status === 409) await loadSlots();
        return;
      }
      setDone(true);
    } catch {
      setMessage("Erro ao realizar agendamento");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white"><div className="w-full max-w-lg rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-zinc-950">✓</div><h1 className="mt-5 text-2xl font-bold">Agendamento realizado!</h1><p className="mt-3 text-zinc-400">Seu horário foi enviado para {business.name}. O status inicial é pendente.</p><div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950/50 p-5 text-left text-sm"><p><span className="text-zinc-500">Serviço:</span> {service?.name}</p><p className="mt-2"><span className="text-zinc-500">Profissional:</span> {professional?.name || "Primeiro disponível"}</p><p className="mt-2"><span className="text-zinc-500">Quando:</span> {formatDate(date)} às {time}</p></div><a href={`/${business.slug}`} className="mt-6 inline-block rounded-xl bg-emerald-500 px-6 py-3 font-bold text-zinc-950">Voltar para a página</a></div></main>;
  }

  return <main className="min-h-screen bg-zinc-950 text-white"><div className="mx-auto max-w-5xl px-6 py-10"><a href={`/${business.slug}`} className="text-sm text-zinc-400">← Voltar</a><div className="mt-6 flex items-center gap-4">{business.logoUrl ? <img src={business.logoUrl} alt={business.name} className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl font-bold text-zinc-950" style={{ backgroundColor: business.primaryColor }}>{business.name.charAt(0)}</div>}<div><p className="text-sm font-bold uppercase tracking-widest" style={{ color: business.primaryColor }}>Agendamento online</p><h1 className="text-3xl font-bold">{business.name}</h1></div></div>

  <section className="mt-10"><Title n="1" text="Escolha o serviço" /><div className="mt-4 grid gap-4 sm:grid-cols-2">{services.map((s) => <button key={s.id} type="button" onClick={() => { setServiceId(s.id); loadSlots(date, s.id, professionalId); }} className={`rounded-2xl border p-5 text-left ${serviceId === s.id ? "border-emerald-500 bg-emerald-500/5" : "border-white/10 bg-white/5"}`}><div className="flex justify-between gap-4"><div><h3 className="font-bold">{s.name}</h3><p className="mt-1 text-sm text-zinc-500">{s.description}</p></div><span className="font-bold text-emerald-400">{money(s.price)}</span></div><p className="mt-3 text-xs text-zinc-500">{s.duration} minutos</p></button>)}</div></section>

  <section className="mt-10"><Title n="2" text="Escolha o profissional" /><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><button type="button" onClick={() => { setProfessionalId("any"); loadSlots(date, serviceId, "any"); }} className={`rounded-2xl border p-5 text-left ${professionalId === "any" ? "border-emerald-500 bg-emerald-500/5" : "border-white/10 bg-white/5"}`}><h3 className="font-bold">Qualquer profissional</h3><p className="mt-1 text-sm text-zinc-500">Primeiro disponível</p></button>{professionals.map((p) => <button key={p.id} type="button" onClick={() => { setProfessionalId(p.id); loadSlots(date, serviceId, p.id); }} className={`rounded-2xl border p-5 text-left ${professionalId === p.id ? "border-emerald-500 bg-emerald-500/5" : "border-white/10 bg-white/5"}`}>{p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="mb-3 h-14 w-14 rounded-full object-cover" /> : null}<h3 className="font-bold">{p.name}</h3><p className="mt-1 text-sm text-zinc-500">{p.role || "Profissional"}</p></button>)}</div></section>

  <section className="mt-10"><Title n="3" text="Data e horário" /><div className="mt-4 max-w-sm"><input type="date" min={today()} value={date} onChange={(e) => { setDate(e.target.value); loadSlots(e.target.value, serviceId, professionalId); }} className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3" /></div><div className="mt-5">{!serviceId ? <Empty text="Escolha um serviço primeiro." /> : !date ? <Empty text="Escolha uma data." /> : loadingSlots ? <Empty text="Buscando horários..." /> : slots.length === 0 ? <Empty text="Nenhum horário disponível nessa data." /> : <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">{slots.map((slot) => <button key={slot} type="button" onClick={() => setTime(slot)} className={`rounded-xl border px-3 py-3 font-semibold ${time === slot ? "border-emerald-500 bg-emerald-500 text-zinc-950" : "border-white/10 bg-white/5"}`}>{slot}</button>)}</div>}</div></section>

  <section className="mt-10"><Title n="4" text="Seus dados" /><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Nome completo" value={client.name} onChange={(v) => setClient({ ...client, name: v })} /><Field label="WhatsApp" value={client.phone} onChange={(v) => setClient({ ...client, phone: v })} /><Field label="E-mail (opcional)" value={client.email} onChange={(v) => setClient({ ...client, email: v })} /><Field label="Observação (opcional)" value={client.notes} onChange={(v) => setClient({ ...client, notes: v })} /></div></section>

  <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6"><h2 className="text-xl font-bold">Resumo</h2><div className="mt-4 space-y-2 text-sm"><Row label="Serviço" value={service?.name || "-"} /><Row label="Profissional" value={professional?.name || "Qualquer profissional"} /><Row label="Data" value={date ? formatDate(date) : "-"} /><Row label="Horário" value={time || "-"} />{service ? <Row label="Valor" value={money(service.price)} /> : null}</div><button type="button" onClick={submit} disabled={submitting || !serviceId || !date || !time} className="mt-6 w-full rounded-xl bg-emerald-500 px-6 py-4 font-bold text-zinc-950 disabled:opacity-40">{submitting ? "Confirmando..." : "Confirmar agendamento"}</button>{message ? <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{message}</p> : null}</section>
  </div></main>;
}

function Title({ n, text }: { n: string; text: string }) { return <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-zinc-950">{n}</span><h2 className="text-xl font-bold">{text}</h2></div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-zinc-500">{text}</div>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <label><span className="mb-2 block text-sm text-zinc-400">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 outline-none focus:border-emerald-500" /></label>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><span className="text-zinc-500">{label}</span><span className="font-medium">{value}</span></div>; }
function money(v: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0); }
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function formatDate(v: string) { const [y, m, d] = v.split("-"); return `${d}/${m}/${y}`; }
