"use client";

import { useState } from "react";
import { amountCents, formatBRL, PERIODS } from "@/lib/vellto-onboarding";

type Period = "monthly" | "semiannual" | "annual";

const offers: Record<Period, { label: string; months: number; price: string; note: string }> = {
  monthly: { label: "Mensal", months: 1, price: formatBRL(amountCents("monthly", "pix")), note: "Flexibilidade mensal" },
  semiannual: { label: "Semestral", months: 6, price: formatBRL(amountCents("semiannual", "pix")), note: "Economize 10%" },
  annual: { label: "Anual", months: 12, price: formatBRL(amountCents("annual", "pix")), note: "Economize 20%" },
};

export default function VelltoPricing() {
  const [period, setPeriod] = useState<Period>("annual");
  const selected = offers[period];

  function continueWithPlan() {
    // Guarda apenas a preferência de navegação, nunca um preço de cobrança.
    // O backend deve validar o plano e calcular o valor final.
    try { window.sessionStorage.setItem("vellto_selected_period", period); } catch { /* storage indisponível */ }
    window.location.assign(`/cadastro?plano=${encodeURIComponent(period)}`);
  }

  return (
    <div className="mx-auto mt-12 max-w-5xl">
      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(offers) as Period[]).map((key) => {
          const item = offers[key];
          const active = period === key;
          return (
            <button key={key} type="button" onClick={() => setPeriod(key)} aria-pressed={active}
              className={`relative rounded-[22px] border p-6 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008e6a] ${active ? "border-[#00b987] bg-[#ecfff6] shadow-lg shadow-[#008f6d]/10" : "border-[#e1eae4] bg-white hover:border-[#a2ddc5]"}`}>
              {key === "annual" && <span className="absolute right-3 top-3 rounded-full bg-[#00c896] px-2 py-1 text-[10px] font-black text-[#073b2d]">MAIS VANTAJOSO</span>}
              <p className="text-base font-black text-[#1b2c21]">{item.label}</p>
              <p className="mt-4 text-3xl font-black text-[#17271d]">{item.price}</p>
              <p className="mt-2 text-xs font-medium text-[#66796d]">{item.months === 1 ? "por mês" : `por ${item.months} meses`}</p>
              <p className="mt-3 text-sm font-semibold text-[#435c4c]">{formatBRL(amountCents(key, "card"))} no cartão (até {PERIODS[key].installments}x)</p>
              <p className="mt-5 text-sm font-bold text-[#008e69]">{item.note}</p>
              <span className={`mt-5 inline-flex rounded-lg px-3 py-2 text-xs font-bold ${active ? "bg-[#00c896] text-[#063f2c]" : "bg-[#f0f6f2] text-[#425749]"}`}>{active ? "✓ Selecionado" : "Selecionar plano"}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-5 rounded-[24px] border border-[#dce9e1] bg-white p-6 text-center shadow-lg shadow-[#143a28]/5 sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#008e69]">Seu plano escolhido</p>
        <h3 className="mt-2 text-2xl font-black text-[#192a20]">Plano {selected.label}</h3>
        <p className="mt-2 text-sm text-[#63766a]">{selected.price} no Pix ou {formatBRL(amountCents(period, "card"))} no cartão. Condições de parcelamento confirmadas no checkout.</p>
        <button type="button" onClick={continueWithPlan}
          className="mt-6 inline-flex min-h-13 w-full max-w-sm items-center justify-center rounded-xl bg-[#00c896] px-6 py-4 text-sm font-black text-[#063f2c] transition hover:bg-[#00b888]">Continuar com este plano ↗</button>
        <p className="mt-3 text-xs text-[#728477]">Nenhuma cobrança será realizada nesta etapa.</p>
      </div>
      <p className="mt-5 text-center text-xs leading-6 text-[#718176]">Os preços já incluem as taxas de processamento estimadas. Para manter o total do cartão sem juros adicionais, é necessário ativar Parcelado Vendedor na conta Mercado Pago.</p>
    </div>
  );
}
