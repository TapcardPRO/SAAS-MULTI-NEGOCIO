export type Period = "monthly" | "semiannual" | "annual";
export type PaymentMethod = "pix" | "card";
export const PERIODS: Record<Period, { label: string; months: number; pixCents: number; cardRate: number; installments: number }> = {
  monthly: { label: "Mensal", months: 1, pixCents: 1999, cardRate: 0.0329, installments: 1 },
  semiannual: { label: "Semestral", months: 6, pixCents: 10795, cardRate: 0.0835, installments: 6 },
  annual: { label: "Anual", months: 12, pixCents: 19190, cardRate: 0.1288, installments: 12 },
};
export function isPeriod(value: unknown): value is Period { return typeof value === "string" && value in PERIODS; }
export function isMethod(value: unknown): value is PaymentMethod { return value === "pix" || value === "card"; }
export function amountCents(period: Period, method: PaymentMethod) {
  const offer = PERIODS[period];
  return method === "pix" ? offer.pixCents : Math.ceil(offer.pixCents / (1 - offer.cardRate));
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
