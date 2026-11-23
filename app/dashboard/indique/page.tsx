"use client";

import { useEffect, useState } from "react";

type Referral = {
  id: string;
  businessName: string;
  status: string;
  createdAt: string | null;
  creditedAt: string | null;
};

type ReferralData = {
  referralCode: string;
  referralUrl: string;
  stats: { total: number; credited: number; pending: number; freeMonths: number };
  referrals: Referral[];
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

export default function IndiquePage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/referrals", { cache: "no-store" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || "Não foi possível carregar.");
        setData(json);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Erro ao carregar indicações."))
      .finally(() => setLoading(false));
  }, []);

  async function copyCode() {
    if (!data?.referralCode) return;
    try {
      await navigator.clipboard.writeText(data.referralCode);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2200);
    } catch {
      setError("Não foi possível copiar o código automaticamente.");
    }
  }

  async function copyLink() {
    if (!data?.referralUrl) return;
    try {
      await navigator.clipboard.writeText(data.referralUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione e copie o link.");
    }
  }

  const shareText = data
    ? `Estou usando a Vellto para organizar minha agenda e meu negócio. Conheça e crie sua conta por este link: ${data.referralUrl}`
    : "";
  const whatsappUrl = data ? `https://wa.me/?text=${encodeURIComponent(shareText)}` : "#";

  if (loading) return <main className="mx-auto max-w-6xl p-5 sm:p-8"><div className="h-8 w-52 animate-pulse rounded bg-white/10" /><div className="mt-6 h-64 animate-pulse rounded-3xl bg-white/5" /></main>;

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-8">
      <div className="mb-7">
        <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-400">VELLTO INDICA</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Indique e ganhe meses grátis</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Compartilhe seu link exclusivo. Quando uma nova empresa contratar e tiver o primeiro pagamento confirmado, você ganha mais 1 mês grátis na Vellto.</p>
      </div>

      {error && <div role="alert" className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      <section className="relative overflow-hidden rounded-3xl border-2 border-emerald-400/40 bg-gradient-to-br from-emerald-500/20 via-white/[0.045] to-transparent p-5 shadow-[0_0_40px_rgba(16,185,129,0.08)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-300">Seu benefício começa aqui</p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Seu código de indicação</h2>
          <p className="mt-2 text-sm text-zinc-300">Compartilhe com outros profissionais. Quando a primeira mensalidade deles for confirmada, você ganha 1 mês grátis.</p>
          <div className="mt-5 rounded-2xl border border-emerald-300/30 bg-black/35 p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Código exclusivo</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="min-w-0 flex-1 break-all text-3xl font-black tracking-[.12em] text-white sm:text-4xl">{data?.referralCode || "Carregando..."}</p>
              <button type="button" onClick={copyCode} disabled={!data?.referralCode} className="min-h-12 rounded-xl bg-emerald-400 px-6 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-50">{copiedCode ? "Código copiado!" : "Copiar código"}</button>
            </div>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Ou compartilhe seu link direto</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200">
                <span className="block break-all">{data?.referralUrl || "Seu link está sendo preparado..."}</span>
              </div>
              <button type="button" onClick={copyLink} disabled={!data} className="min-h-12 rounded-xl border border-emerald-400/40 px-5 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400/10 disabled:opacity-50">{copied ? "Link copiado!" : "Copiar link"}</button>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-zinc-950 hover:bg-emerald-400">Compartilhar no WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Empresas indicadas" value={data?.stats.total ?? 0} detail="Cadastros pelo seu link" />
        <Metric title="Indicações válidas" value={data?.stats.credited ?? 0} detail="Primeiro pagamento confirmado" />
        <Metric title="Aguardando pagamento" value={data?.stats.pending ?? 0} detail="Ainda não geraram bônus" />
        <Metric title="Meses grátis ganhos" value={data?.stats.freeMonths ?? 0} detail="1 mês por indicação válida" highlight />
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 p-5">
          <h2 className="font-bold">Histórico de indicações</h2>
          <p className="mt-1 text-xs text-zinc-500">Acompanhe quem entrou pelo seu link e o status da recompensa.</p>
        </div>
        {!data?.referrals.length ? (
          <div className="p-8 text-center">
            <div className="text-3xl">🎁</div>
            <h3 className="mt-3 font-bold">Sua primeira indicação começa aqui</h3>
            <p className="mt-2 text-sm text-zinc-500">Compartilhe seu link com outros profissionais e acompanhe os resultados nesta tela.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {data.referrals.map((referral) => (
              <div key={referral.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-semibold">{referral.businessName}</p><p className="mt-1 text-xs text-zinc-500">Cadastro: {formatDate(referral.createdAt)}</p></div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${referral.status === "credited" ? "bg-emerald-500/10 text-emerald-300" : referral.status === "pending" ? "bg-amber-500/10 text-amber-300" : "bg-zinc-500/10 text-zinc-400"}`}>{referral.status === "credited" ? "1 mês concedido" : referral.status === "pending" ? "Aguardando pagamento" : "Não elegível"}</span>
                  {referral.creditedAt && <span className="text-xs text-zinc-500">{formatDate(referral.creditedAt)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
        <h2 className="font-bold">Como funciona</h2>
        <ol className="mt-4 grid gap-4 text-sm text-zinc-400 sm:grid-cols-3">
          <li><span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 font-black text-emerald-300">1</span><strong className="block text-zinc-100">Compartilhe</strong>Envie seu link para outro profissional ou estabelecimento.</li>
          <li><span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 font-black text-emerald-300">2</span><strong className="block text-zinc-100">Ele contrata</strong>A nova empresa cria a conta e realiza o primeiro pagamento.</li>
          <li><span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 font-black text-emerald-300">3</span><strong className="block text-zinc-100">Você ganha</strong>Após a confirmação, 1 mês é acrescentado automaticamente à sua assinatura.</li>
        </ol>
        <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-zinc-500">Cada empresa nova pode gerar uma única recompensa. Autoindicação, cadastros duplicados e pagamentos não confirmados não geram mês grátis.</p>
      </section>
    </main>
  );
}

function Metric({ title, value, detail, highlight = false }: { title: string; value: number; detail: string; highlight?: boolean }) {
  return <article className={`rounded-2xl border p-4 ${highlight ? "border-emerald-500/25 bg-emerald-500/10" : "border-white/10 bg-white/[0.025]"}`}>
    <p className="text-xs font-medium text-zinc-400">{title}</p>
    <p className={`mt-3 text-3xl font-black ${highlight ? "text-emerald-300" : "text-white"}`}>{value}</p>
    <p className="mt-2 text-xs text-zinc-500">{detail}</p>
  </article>;
}
