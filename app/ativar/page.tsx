"use client";
import { useCallback, useEffect, useState } from "react";
type Period = "monthly" | "semiannual" | "annual";
type Status = { active: boolean; period: Period; periodLabel: string; paymentStatus: string };
type Payment = { method: "pix" | "card"; checkoutUrl?: string; qrCode?: string; qrCodeBase64?: string };
const prices: Record<Period, { pix: string; card: string; installments: string }> = {
  monthly: { pix: "R$ 19,99", card: "R$ 20,68", installments: "1x" },
  semiannual: { pix: "R$ 107,95", card: "R$ 117,79", installments: "até 6x" },
  annual: { pix: "R$ 191,90", card: "R$ 220,28", installments: "até 12x" },
};
export default function AtivarPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding/status", { cache: "no-store" });
      if (res.status === 401) { window.location.assign("/login"); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Não foi possível consultar sua assinatura.");
      setStatus(data);
    } catch (err) { setMessage(err instanceof Error ? err.message : "Erro ao consultar assinatura."); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  async function checkout() {
    setLoading(true); setMessage("");
    try {
      const res = await fetch("/api/onboarding/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method, autoRenew: false }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Não foi possível iniciar o pagamento.");
      setPayment(data);
      if (method === "card" && data.checkoutUrl) window.location.assign(data.checkoutUrl);
    } catch (err) { setMessage(err instanceof Error ? err.message : "Erro ao gerar pagamento."); }
    finally { setLoading(false); }
  }
  return <main className="min-h-screen bg-[#f4faf6] px-4 py-12 text-[#183227]"><div className="mx-auto max-w-xl rounded-3xl border border-[#dcebe2] bg-white p-7 shadow-lg sm:p-10">
    <p className="text-sm font-bold text-emerald-700">Vellto · Ativação</p><h1 className="mt-3 text-3xl font-black">Finalize sua assinatura</h1>
    {!status ? <p className="mt-6">Carregando seus dados...</p> : status.active ? <div className="mt-6 space-y-4"><p className="rounded-xl bg-emerald-50 p-4 font-bold text-emerald-800">✓ Pagamento confirmado. Sua conta está ativa!</p><a href="/dashboard/minha-pagina" className="block rounded-xl bg-emerald-500 p-4 text-center font-bold text-emerald-950">Entrar no painel →</a></div> : <>
      <p className="mt-3 text-sm text-zinc-600">Plano {status.periodLabel}. Sua conta será liberada após a confirmação do pagamento.</p>
      <div className="mt-6 grid grid-cols-2 gap-3">{(["pix", "card"] as const).map(m => <button key={m} onClick={() => { setMethod(m); setPayment(null); }} className={`rounded-2xl border p-4 text-left ${method === m ? "border-emerald-500 bg-emerald-50" : "border-zinc-200"}`}><span className="block text-sm font-bold">{m === "pix" ? "Pix à vista" : "Cartão de crédito"}</span><strong className="mt-2 block text-lg">{m === "pix" ? prices[status.period].pix : prices[status.period].card}</strong><span className="text-xs text-zinc-500">{m === "pix" ? "Sem parcelamento" : prices[status.period].installments}</span></button>)}</div>
      <p className="mt-4 text-xs text-zinc-500">Cartão: valor total estimado com acréscimo de taxas, sujeito à confirmação das condições do Mercado Pago. A quantidade de parcelas é escolhida no checkout.</p>
      <p className="mt-2 text-xs text-zinc-500">Renovação automática desativada. Ao vencer, será necessário renovar.</p>
      <button onClick={checkout} disabled={loading} className="mt-6 w-full rounded-xl bg-emerald-500 px-5 py-4 font-black text-emerald-950 disabled:opacity-60">{loading ? "Preparando pagamento..." : `Pagar com ${method === "pix" ? "Pix" : "cartão"} →`}</button>
      {payment?.qrCode && <div className="mt-6 space-y-3 rounded-xl border p-4"><p className="font-bold">Seu Pix foi gerado</p>{payment.qrCodeBase64 && <img alt="QR Code Pix" src={`data:image/png;base64,${payment.qrCodeBase64}`} className="mx-auto h-52 w-52" />}<textarea readOnly value={payment.qrCode} className="h-24 w-full rounded-lg border p-3 text-xs"/><button onClick={() => navigator.clipboard.writeText(payment.qrCode || "")} className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-bold">Copiar código Pix</button></div>}
      <button onClick={refresh} className="mt-5 w-full rounded-xl border border-emerald-200 px-5 py-3 text-sm font-bold text-emerald-800">Já paguei · verificar confirmação</button>
    </>}
    {message && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}
  </div></main>;
}
