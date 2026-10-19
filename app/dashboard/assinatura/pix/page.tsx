"use client";
import { useState } from "react";
import { amountCents, formatBRL } from "@/lib/vellto-onboarding";

type PixData = { paymentId: string; qrCode: string; qrCodeBase64: string; status: string };
export default function PixTestPage() {
  const [data, setData] = useState<PixData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function createPix() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/dashboard/subscription/pix", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: "monthly", method: "pix", autoRenew: false })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Erro ao gerar cobrança.");
      setData(json);
    } catch (e) { setError(e instanceof Error ? e.message : "Erro desconhecido"); }
    finally { setLoading(false); }
  }
  return <main className="mx-auto max-w-xl p-6 sm:p-10">
    <div className="rounded-3xl border border-emerald-200 bg-white p-6 text-zinc-900 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Vellto · Ambiente de teste</p>
      <h1 className="mt-3 text-2xl font-black">Teste de cobrança Pix</h1>
      <p className="mt-2 text-sm text-zinc-600">Mensal · {formatBRL(amountCents("monthly", "pix"))} · sem renovação automática.</p>
      <p className="mt-2 text-xs text-amber-700">Atenção: só use credenciais de TESTE do Mercado Pago. Este teste não libera assinatura.</p>
      {!data && <button disabled={loading} onClick={createPix} className="mt-6 rounded-xl bg-emerald-500 px-5 py-3 font-bold text-zinc-950 disabled:opacity-50">{loading ? "Gerando..." : "Gerar Pix de teste"}</button>}
      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
      {data && <section className="mt-6 space-y-4">
        <p className="text-sm">Cobrança #{data.paymentId} · {data.status}</p>
        {data.qrCodeBase64 && <img alt="QR Code Pix" className="mx-auto h-60 w-60" src={`data:image/png;base64,${data.qrCodeBase64}`} />}
        <label className="block text-sm font-semibold">Pix copia e cola<textarea readOnly value={data.qrCode} className="mt-2 h-24 w-full rounded-xl border p-3 text-xs" /></label>
        <button onClick={() => navigator.clipboard.writeText(data.qrCode)} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-zinc-950">Copiar código</button>
      </section>}
    </div>
  </main>;
}
