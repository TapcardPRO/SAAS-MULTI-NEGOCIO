// Regra unica de acesso comercial para dashboard, APIs e agenda publica.
// Contas antigas/manuais nao mudam de politica por esta funcionalidade.
type BillingBusiness = {
  [key: string]: unknown;
  signupSource?: unknown;
  active?: unknown;
  billingStatus?: unknown;
  subscriptionEndsAt?: unknown;
  trialEndsAt?: unknown;
};

function timestamp(value: unknown): number {
  if (!value) return NaN;
  const n = new Date(value as string | Date).getTime();
  return Number.isFinite(n) ? n : NaN;
}

export function hasSubscriptionAccess(business: BillingBusiness, now = Date.now()): boolean {
  if (business.active === false) return false;
  if (business.signupSource !== "public") return true;
  const subscriptionEnd = timestamp(business.subscriptionEndsAt);
  if (!Number.isFinite(subscriptionEnd) || subscriptionEnd <= now) return false;
  if (business.billingStatus === "active") return true;
  if (business.billingStatus === "trial") {
    const trialEnd = timestamp(business.trialEndsAt);
    return Number.isFinite(trialEnd) && trialEnd > now;
  }
  return false;
}

export function effectiveBillingStatus(business: BillingBusiness, now = Date.now()): string {
  const status = String(business.billingStatus || "active");
  if (business.signupSource === "public" &&
      (status === "trial" || status === "active") &&
      !hasSubscriptionAccess(business, now)) return "past_due";
  return status;
}
