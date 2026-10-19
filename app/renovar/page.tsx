"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { amountCents, formatBRL } from "@/lib/vellto-onboarding";

type Period = "monthly" | "semiannual" | "annual";
type Method = "pix" | "card";
type PendingPayment = {
  orderId: string;
  method: Method;
  checkoutUrl?: string;
  qrCode?: string;
  qrCodeBase64?: string;
};
type SubscriptionStatus = {
  ok: boolean;
  active: boolean;
  period: Period;
  periodLabel: string;
  paymentStatus: string;
  latestOrderId: string;
  subscriptionEndsAt: string | null;
  payment: PendingPayment | null;
};

const installmentLabels: Record<Period, string> = {
  monthly: "1x",
  semiannual: "até 6x",
  annual: "até 12x",
};
function price(period: Period, method: Method) {
  if (period === "annual" && method === "card") return "R$ 268,98 (total estimado)";
  return formatBRL(amountCents(period, method));
}

function Renovacao() {
  const params = useSearchParams();
  const pedidoNaUrl = params.get("pedido") || "";
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [method, setMethod] = useState<Method>("pix");
  const [payment, setPayment] = useState<PendingPayment | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState(pedidoNaUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/onboarding/status", { cache: "no-store" });
      if (response.status === 401) {
        setNeedsLogin(true);
        setError("Para continuar a renovacao, confirme o acesso como proprietario da empresa. Seus dados e pagamentos serao preservados.");
        return;
      }
      setNeedsLogin(false);
      const data = (await response.json()) as SubscriptionStatus & { message?: string };
      if (!response.ok) throw new Error(data.message || "Não foi possível consultar a assinatura.");
      setStatus(data);
      if (data.payment?.orderId) {
        setCurrentOrderId(data.payment.orderId);
        setPayment(data.payment);
        setMethod(data.payment.method);
      } else if (data.latestOrderId === (pedidoNaUrl || currentOrderId) && data.paymentStatus === "approved") {
        setPayment(null);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao consultar o pagamento.");
    }
  }, [pedidoNaUrl, currentOrderId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const paid = Boolean(currentOrderId) && status?.latestOrderId === currentOrderId && status?.paymentStatus === "approved";
  const failed = Boolean(currentOrderId) && status?.latestOrderId === currentOrderId &&
    ["error", "expired", "failed"].includes(status?.paymentStatus || "");
  useEffect(() => {
    if (!currentOrderId || paid || failed) return;
    const id = setInterval(() => { void refresh(); }, 8000);
    return () => clearInterval(id);
  }, [currentOrderId, paid, failed, refresh]);

  async function checkout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/onboarding/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, autoRenew: false }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Não foi possível gerar a cobrança.");
      const id = String(data.orderId || "");
      if (!id) throw new Error("Não foi possível identificar o pedido.");
      setCurrentOrderId(id);
      window.history.replaceState(null, "", `/renovar?pedido=${encodeURIComponent(id)}`);
      setPayment({ orderId: id, method, qrCode: data.qrCode, qrCodeBase64: data.qrCodeBase64, checkoutUrl: data.checkoutUrl });
      if (method === "card") {
        if (!data.checkoutUrl) throw new Error("Mercado Pago não retornou o link do cartão.");
        window.location.assign(data.checkoutUrl);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao iniciar pagamento.");
    } finally {
      setLoading(false);
    }
  }

  const expiry = status?.subscriptionEndsAt
    ? new Date(status.subscriptionEndsAt).toLocaleDateString("pt-BR")
    : "não informado";
  return <main className="min-h-screen bg-[#f4faf6] px-4 py-12 text-[#183227]">
    <div className="mx-auto max-w-xl rounded-3xl border border-[#dcebe2] bg-white p-7 shadow-lg sm:p-10">
      <a href="/dashboard/assinatura" className="text-sm font-bold text-emerald-700">← Minha assinatura</a>
      <h1 className="mt-5 text-3xl font-black">Renovar assinatura</h1>
      {!status ? <p className="mt-4 text-sm">Carregando seus dados...</p> : <>
        <p className="mt-3 text-sm text-zinc-600">Plano {status.periodLabel}. Vencimento atual: {expiry}.</p>
        <p className="mt-1 text-sm text-zinc-600">Ao pagar antes do vencimento, o novo período será acrescentado ao prazo restante.</p>
        {paid ? <div className="mt-6 space-y-4">
          <p className="rounded-xl bg-emerald-50 p-4 font-bold text-emerald-800">✓ Renovação confirmada! Novo vencimento: {expiry}.</p>
          <a href="/dashboard/assinatura" className="block rounded-xl bg-emerald-500 p-4 text-center font-bold">Voltar à assinatura →</a>
        </div> : <>
          {failed && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Essa cobrança não foi concluída. Você pode tentar novamente.</p>}
          <div className="mt-6 grid grid-cols-2 gap-3">{(["pix", "card"] as const).map(m =>
            <button key={m} type="button" disabled={Boolean(payment && !failed)} onClick={() => setMethod(m)}
              className={`rounded-2xl border p-4 text-left disabled:opacity-60 ${method === m ? "border-emerald-500 bg-emerald-50" : "border-zinc-200"}`}>
              <span className="block text-sm font-bold">{m === "pix" ? "Pix à vista" : "Cartão de crédito"}</span>
              <strong className="mt-2 block text-lg">{price(status.period, m)}</strong>
              <span className="text-xs text-zinc-500">{m === "pix" ? "Sem parcelamento" : installmentLabels[status.period]}</span>
            </button>)}</div>
          <p className="mt-3 text-xs text-zinc-500">Confira o valor final do cartão no Mercado Pago. Renovação automática não está habilitada.</p>
          {payment?.qrCode && !failed && <div className="mt-5 space-y-3 rounded-xl border p-4">
            <p className="font-bold">Pague com Pix</p>
            {payment.qrCodeBase64 && <img src={`data:image/png;base64,${payment.qrCodeBase64}`} alt="QR Code Pix" className="mx-auto h-52 w-52" />}
            <textarea readOnly value={payment.qrCode} className="h-24 w-full rounded-lg border p-3 text-xs" />
            <button type="button" onClick={() => navigator.clipboard.writeText(payment.qrCode || "")}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-bold">Copiar Pix</button>
            <p className="text-xs text-zinc-500">A confirmação será consultada automaticamente.</p>
          </div>}
          {payment?.method === "card" && payment.checkoutUrl && !failed &&
            <a href={payment.checkoutUrl} className="mt-5 block rounded-xl border px-4 py-3 text-center font-bold">Continuar no Mercado Pago →</a>}
          {!payment || failed ? <button type="button" onClick={checkout} disabled={loading}
            className="mt-6 w-full rounded-xl bg-emerald-500 px-5 py-4 font-black text-[#083a2c] disabled:opacity-50">
            {loading ? "Gerando cobrança..." : `Renovar com ${method === "pix" ? "Pix" : "cartão"} →`}
          </button> : null}
          {currentOrderId && !failed && <button type="button" onClick={() => void refresh()}
            className="mt-4 w-full rounded-xl border border-emerald-200 px-4 py-3 text-sm font-semibold">Já paguei · verificar confirmação</button>}
        </>}
      </>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {needsLogin && <a
        href={`/login?next=${encodeURIComponent(`/renovar${pedidoNaUrl ? `?pedido=${encodeURIComponent(pedidoNaUrl)}` : ""}`)}`}
        className="mt-4 block rounded-xl bg-emerald-500 px-5 py-4 text-center font-bold text-[#083a2c]">
        Entrar e continuar a renovacao →
      </a>}
    </div>
  </main>;
}

export default function RenovarPage() {
  return <Suspense fallback={<main className="p-8">Carregando renovação...</main>}><Renovacao /></Suspense>;
}
