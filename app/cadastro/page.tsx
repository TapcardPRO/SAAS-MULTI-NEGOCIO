"use client";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { amountCents, formatBRL } from "@/lib/vellto-onboarding";
type Period = "monthly" | "semiannual" | "annual";
const plans: Record<Period, string> = {
  monthly: `Mensal · ${formatBRL(amountCents("monthly", "pix"))}`,
  semiannual: `Semestral · ${formatBRL(amountCents("semiannual", "pix"))}`,
  annual: `Anual · ${formatBRL(amountCents("annual", "pix"))}`,
};
function Cadastro() {
  const params = useSearchParams();
  const raw = params.get("plano") || "monthly";
  const period: Period = raw === "annual" || raw === "semiannual" ? raw : "monthly";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const privateTest = params.get("teste") === "1";
  const [liveTestCode, setLiveTestCode] = useState("");
  const [values, setValues] = useState({ businessName: "", ownerName: "", email: "", password: "", category: "barbearia", whatsapp: "" });
  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/onboarding/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, period, liveTestCode: privateTest ? liveTestCode : undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Não foi possível criar a conta.");
      window.location.assign("/ativar");
    } catch (err) { setError(err instanceof Error ? err.message : "Erro no cadastro."); setLoading(false); }
  }
  return <main className="min-h-screen bg-[#f5faf7] px-4 py-12 text-[#172c21]"><div className="mx-auto max-w-xl rounded-3xl border border-[#dce8df] bg-white p-6 shadow-lg sm:p-10">
    <a href="/" className="text-sm font-bold text-emerald-700">← Vellto Agenda & Gestão</a><h1 className="mt-6 text-3xl font-black">Crie sua conta</h1>
    <p className="mt-2 text-sm text-zinc-600">Seu plano: <strong>{plans[period]}</strong> no Pix. Nenhuma cobrança será feita durante o cadastro.</p>
    <form onSubmit={submit} className="mt-7 space-y-4">
      {([{ key: "businessName", label: "Nome do estabelecimento", placeholder: "Ex.: Barbearia Central" }, { key: "ownerName", label: "Seu nome", placeholder: "Nome completo" }, { key: "email", label: "E-mail", placeholder: "seuemail@exemplo.com" }, { key: "whatsapp", label: "WhatsApp", placeholder: "21999999999" }, { key: "password", label: "Crie uma senha (mín. 10 caracteres)", placeholder: "Senha segura" }] as const).map(f => <label key={f.key} className="block text-sm font-semibold">{f.label}<input required={f.key !== "whatsapp"} type={f.key === "password" ? "password" : f.key === "email" ? "email" : "text"} minLength={f.key === "password" ? 10 : undefined} autoComplete={f.key === "password" ? "new-password" : undefined} value={values[f.key]} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} placeholder={f.placeholder} className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 font-normal outline-none focus:border-emerald-500" /></label>)}
      <label className="block text-sm font-semibold">Tipo de negócio<select value={values.category} onChange={e => setValues(v => ({ ...v, category: e.target.value }))} className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3"><option value="barbearia">Barbearia</option><option value="salao">Salão de beleza</option><option value="clinica">Clínica</option><option value="outros">Outros serviços</option></select></label>
      {privateTest && <label className="block text-sm font-semibold">Código de acesso ao teste real
        <input required type="password" autoComplete="off" value={liveTestCode}
          onChange={e => setLiveTestCode(e.target.value)}
          placeholder="Código privado" className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3" />
      </label>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={loading} className="w-full rounded-xl bg-emerald-500 px-5 py-4 font-black text-[#083a2c] disabled:opacity-60">{loading ? "Criando sua conta..." : "Criar conta e continuar para pagamento →"}</button>
    </form><p className="mt-5 text-center text-xs text-zinc-500">Já possui conta? <a href="/login" className="font-bold text-emerald-700">Entrar</a></p>
  </div></main>;
}
export default function CadastroPage() { return <Suspense fallback={<main className="p-8">Carregando cadastro...</main>}><Cadastro /></Suspense>; }
