export type Period = "monthly" | "semiannual" | "annual";
export type PaymentMethod = "pix" | "card";
export const PERIODS: Record<Period, { label: string; months: number; baseCents: number; cardRate: number; installments: number }> = {
  monthly: { label: "Mensal", months: 1, baseCents: 1999, cardRate: 0.0498, installments: 1 },
  semiannual: { label: "Semestral", months: 6, baseCents: 10795, cardRate: 0.1494, installments: 6 },
  annual: { label: "Anual", months: 12, baseCents: 19190, cardRate: 0.2226, installments: 12 },
};
export function isPeriod(value: unknown): value is Period { return typeof value === "string" && value in PERIODS; }
export function isMethod(value: unknown): value is PaymentMethod { return value === "pix" || value === "card"; }
// Valores finais definidos para o cliente: as taxas ja estao consideradas.
const CARD_TOTAL_CENTS: Record<Period, number> = {
  monthly: 2068,
  semiannual: 11779,
  annual: 22028,
};
export function amountCents(period: Period, method: PaymentMethod) {
  return method === "pix" ? PERIODS[period].baseCents : CARD_TOTAL_CENTS[period];
}
export function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
export function addMonths(date: Date, months: number) {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}
