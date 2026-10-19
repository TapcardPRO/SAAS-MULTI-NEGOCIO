"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { amountCents, formatBRL, PERIODS, type Period } from "@/lib/vellto-onboarding";

function parsePeriod(input: string | null): Period {
  return input === "annual" || input === "semiannual" ? input : "monthly";
}

export default function VelltoSignupForm({ signupAvailable }: { signupAvailable: boolean }) {
  const params = useSearchParams();
  const privateTest = params.get("teste") === "1";
  const [period, setPeriod] = useState<Period>(() => parsePeriod(params.get("plano")));
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [values, setValues] = useState({
    businessName: "", ownerName: "", email: "", password: "", category: "barbearia", whatsapp: "",
  });
  const [liveTestCode, setLiveTestCode] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/onboarding/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, period, liveTestCode: privateTest ? liveTestCode : undefined }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Não foi possível criar a conta.");
      window.location.assign("/ativar");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao cadastrar. Tente novamente.");
      setLoading(false);
    }
  }

  if (!signupAvailable && !privateTest) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f4faf6] px-4 py-12 text-[#172c21]">
      <div className="w-full max-w-lg rounded-3xl border border-[#dce8df] bg-white p-8 shadow-xl sm:p-10">
        <a href="/" className="text-sm font-bold text-emerald-700">← Voltar à Vellto</a>
        <p className="mt-8 text-xs font-extrabold uppercase tracking-[.2em] text-[#008c6b]">Lançamento</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Cadastros públicos em preparação</h1>
        <p className="mt-4 text-sm leading-7 text-[#5c6d63]">Estamos finalizando a liberação do cadastro online. Enquanto isso, você pode conhecer o site que seu cliente terá e experimentar uma simulação de agendamento.</p>
        <a href="/demonstracao" className="mt-8 flex min-h-14 items-center justify-center rounded-xl bg-[#00c896] px-5 text-sm font-extrabold text-[#063c2b]">Explorar demonstração ↗</a>
        <a href="/#planos" className="mt-3 flex min-h-12 items-center justify-center rounded-xl border border-[#dce8df] text-sm font-bold">Consultar planos</a>
      </div>
    </main>;
  }

  return <main className="min-h-screen bg-[#f4faf6] px-4 py-10 text-[#172c21] sm:py-16">
    <div className="mx-auto max-w-4xl">
      <a href="/" className="text-sm font-bold text-emerald-700">← Vellto Agenda & Gestão</a>
      <div className="mt-7 grid gap-7 lg:grid-cols-[.82fr_1.18fr] lg:items-start">
        <div className="rounded-3xl bg-[#103b2b] p-7 text-white sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#79e9bb]">Seu negócio na Vellto</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight">Comece a organizar sua agenda.</h1>
          <p className="mt-4 text-sm leading-7 text-[#c6ddcf]">Crie sua conta, escolha como pagar e receba seu painel pronto para configurar serviços e profissionais.</p>
          <div className="mt-7 space-y-4 text-sm font-semibold text-[#e0f7e8]">
            {["Escolha o período de assinatura", "Informe os dados do seu negócio", "Finalize o pagamento com segurança"].map((step, index) =>
              <div key={step} className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00c896] text-xs font-black text-[#073d2c]">{index + 1}</span>{step}</div>)}
          </div>
          <p className="mt-8 border-t border-white/20 pt-5 text-xs leading-6 text-[#c6ddcf]">Nenhuma cobrança é realizada ao preencher este formulário. A assinatura será ativada somente após confirmação do pagamento.</p>
        </div>
        <form onSubmit={submit} className="rounded-3xl border border-[#dce8df] bg-white p-6 shadow-lg sm:p-8">
          <h2 className="text-xl font-black">Criar minha conta</h2>
          <p className="mt-2 text-sm text-[#718176]">Primeiro, escolha por quanto tempo deseja contratar.</p>
          <div className="mt-5 grid grid-cols-3 gap-2" role="group" aria-label="Período do plano">
            {(["monthly", "semiannual", "annual"] as const).map(item =>
              <button key={item} type="button" onClick={() => setPeriod(item)} aria-pressed={period === item}
                className={`rounded-xl border p-3 text-center text-xs font-extrabold transition ${period === item ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-zinc-200 text-zinc-600"}`}>
                {PERIODS[item].label}</button>)}
          </div>
          <div className="mt-3 rounded-xl bg-[#f3faf5] p-4 text-sm">
            <p className="font-extrabold">{formatBRL(amountCents(period, "pix"))} no Pix</p>
            <p className="mt-1 text-xs text-[#526959]">ou {formatBRL(amountCents(period, "card"))} no cartão, até {PERIODS[period].installments}x</p>
          </div>
          <div className="mt-6 space-y-4">
            {([
              { key: "businessName", label: "Nome do estabelecimento", placeholder: "Ex.: Barbearia Central", type: "text", autocomplete: "organization" },
              { key: "ownerName", label: "Seu nome", placeholder: "Nome completo", type: "text", autocomplete: "name" },
              { key: "email", label: "E-mail de acesso", placeholder: "voce@exemplo.com", type: "email", autocomplete: "email" },
              { key: "whatsapp", label: "WhatsApp", placeholder: "21999999999", type: "tel", autocomplete: "tel" },
            ] as const).map(field => <label key={field.key} className="block text-sm font-semibold">{field.label}{field.key === "whatsapp" && <span className="ml-1 text-xs font-normal text-zinc-500">(opcional)</span>}
              <input required={field.key !== "whatsapp"} type={field.type} autoComplete={field.autocomplete} value={values[field.key]}
                onChange={event => setValues(current => ({ ...current, [field.key]: event.target.value }))} placeholder={field.placeholder}
                className="mt-2 w-full rounded-xl border border-[#dfe7e2] bg-white px-4 py-3 font-normal outline-none focus:border-emerald-500" /></label>)}
            <label className="block text-sm font-semibold">Tipo de negócio
              <select value={values.category} onChange={event => setValues(current => ({ ...current, category: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-[#dfe7e2] bg-white px-4 py-3 font-normal">
                <option value="barbearia">Barbearia</option><option value="salao">Salão de beleza</option><option value="manicure">Manicure</option><option value="estetica">Estética</option><option value="clinica">Clínica</option><option value="outros">Outros serviços</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">Senha de acesso (mínimo de 10 caracteres)
              <div className="relative mt-2"><input required minLength={10} maxLength={128} type={showPassword ? "text" : "password"}
                autoComplete="new-password" value={values.password} placeholder="Crie uma senha segura"
                onChange={event => setValues(current => ({ ...current, password: event.target.value }))}
                className="w-full rounded-xl border border-[#dfe7e2] bg-white px-4 py-3 pr-20 font-normal outline-none focus:border-emerald-500" />
                <button type="button" onClick={() => setShowPassword(show => !show)}
                  className="absolute inset-y-0 right-2 px-2 text-xs font-bold text-emerald-800">{showPassword ? "Ocultar" : "Mostrar"}</button>
              </div>
            </label>
            {privateTest && <label className="block text-sm font-semibold">Código privado de homologação
              <input required type="password" autoComplete="off" value={liveTestCode} onChange={event => setLiveTestCode(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe7e2] bg-white px-4 py-3" />
            </label>}
          </div>
          {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
          <button disabled={loading} type="submit" className="mt-7 w-full rounded-xl bg-[#00c896] px-5 py-4 text-sm font-black text-[#063d2d] disabled:opacity-60">
            {loading ? "Criando sua conta..." : "Criar conta e escolher pagamento →"}
          </button>
          <p className="mt-4 text-center text-xs leading-6 text-[#718176]">O pagamento acontece na próxima etapa. Confira valores e condições antes de confirmar.</p>
          <p className="mt-3 text-center text-xs text-[#718176]">Já tem conta? <a href="/login" className="font-black text-emerald-700">Entrar</a></p>
        </form>
      </div>
    </div>
  </main>;
}
