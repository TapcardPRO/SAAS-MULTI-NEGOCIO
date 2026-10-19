"use client";

import { useState } from "react";
import { amountCents, formatBRL, PERIODS, type Period } from "@/lib/vellto-onboarding";

type Offer = { period: Period; label: string; benefit: string; badge?: string };
const offers: Offer[] = [
  { period: "monthly", label: "Mensal", benefit: "Para começar com flexibilidade" },
  { period: "semiannual", label: "Semestral", benefit: "10% de economia em relação ao mensal", badge: "ECONOMIZE 10%" },
  { period: "annual", label: "Anual", benefit: "20% de economia em relação ao mensal", badge: "MELHOR VALOR" },
];

export default function VelltoPricing({ signupAvailable }: { signupAvailable: boolean }) {
  // Um compromisso curto pode ser a melhor primeira compra de um novo cliente.
  const [period, setPeriod] = useState<Period>("monthly");
  const selected = offers.find(item => item.period === period) || offers[0];
  const pixCents = amountCents(period, "pix");
  const cardCents = amountCents(period, "card");
  const installments = PERIODS[period].installments;
  const url = signupAvailable ? `/cadastro?plano=${period}` : "/demonstracao";

  return <div className="mx-auto mt-12 max-w-5xl">
    <div role="group" aria-label="Escolha o período de assinatura" className="grid gap-4 sm:grid-cols-3">
      {offers.map(item => {
        const active = period === item.period;
        const pix = amountCents(item.period, "pix");
        const card = amountCents(item.period, "card");
        const months = PERIODS[item.period].months;
        const cardInstallments = PERIODS[item.period].installments;
        return <button key={item.period} type="button" onClick={() => setPeriod(item.period)} aria-pressed={active}
          className={`relative rounded-[24px] border p-6 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008e6a] ${active ? "border-[#00b987] bg-[#ecfff6] shadow-xl shadow-[#008f6d]/10" : "border-[#e1eae4] bg-white hover:-translate-y-1 hover:border-[#a2ddc5]"}`}>
          {item.badge && <span className="absolute right-4 top-4 rounded-full bg-[#daf8e9] px-2 py-1 text-[10px] font-black text-[#007b59]">{item.badge}</span>}
          <p className="text-base font-black text-[#1b2c21]">{item.label}</p>
          <p className="mt-4 text-3xl font-black tracking-tight text-[#17271d]">{formatBRL(pix)}</p>
          <p className="mt-1 text-xs font-medium text-[#66796d]">{months === 1 ? "total por 1 mês · Pix" : `total por ${months} meses · Pix`}</p>
          {months > 1 && <p className="mt-3 text-sm font-bold text-[#177b5b]">Equivale a {formatBRL(Math.round(pix / months))}/mês</p>}
          <div className="mt-5 border-t border-[#ddeae1] pt-4">
            <p className="text-xs font-semibold text-[#66796d]">No cartão: {formatBRL(card)} no total</p>
            <p className="mt-1 text-xs text-[#66796d]">Até {cardInstallments}x · consulte as condições no checkout</p>
          </div>
          <p className="mt-4 text-sm font-semibold text-[#425a4b]">{item.benefit}</p>
          <span className={`mt-5 inline-flex rounded-lg px-3 py-2 text-xs font-black ${active ? "bg-[#00c896] text-[#063f2c]" : "bg-[#f0f6f2] text-[#425749]"}`}>{active ? "✓ Período escolhido" : "Escolher este período"}</span>
        </button>;
      })}
    </div>
    <div className="mt-6 rounded-[26px] border border-[#dce9e1] bg-white p-6 shadow-lg shadow-[#143a28]/5 sm:p-8">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#008e69]">Sua escolha</p>
          <h3 className="mt-2 text-2xl font-black text-[#192a20]">Vellto {selected.label}</h3>
          <p className="mt-2 text-sm text-[#63766a]">{formatBRL(pixCents)} no Pix ou {formatBRL(cardCents)} no cartão (até {installments}x).</p>
          <p className="mt-1 text-xs text-[#718176]">Valores totais para o período selecionado. Renovação manual.</p>
        </div>
        <a href={url} className="inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-[#00c896] px-6 py-4 text-center text-sm font-black text-[#063f2c] transition hover:bg-[#00b888] sm:w-auto">
          {signupAvailable ? "Criar minha conta →" : "Explorar demonstração →"}
        </a>
      </div>
      {signupAvailable ?
        <p className="mt-5 rounded-xl bg-[#f3faf5] p-4 text-sm leading-6 text-[#516b59]">Cadastro em poucos passos. A cobrança só começa no checkout, depois de você escolher a forma de pagamento.</p> :
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">O cadastro público ainda não foi liberado. Você já pode conhecer a plataforma e simular o agendamento. Os planos ficarão disponíveis para contratação após a liberação.</p>}
    </div>
    <p className="mt-5 text-center text-xs leading-6 text-[#718176]">Os valores são calculados a partir da tabela atual de cobrança da Vellto. Confira o total no Mercado Pago antes de confirmar. Parcelamento sujeito às condições do checkout.</p>
  </div>;
}
