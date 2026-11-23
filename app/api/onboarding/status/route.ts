import { NextResponse } from "next/server";
import { requireOnboardingOwner } from "@/lib/vellto-onboarding-auth";
import { reconcileOnboardingOrder } from "@/lib/vellto-onboarding-payments";
import { isPeriod, PERIODS } from "@/lib/vellto-onboarding";

// Não reapresentar QR Codes gerados antes da troca da conta recebedora.
const MP_ACCOUNT_CUTOVER_AT = new Date("2026-11-23T00:00:00.000Z");
export const dynamic = "force-dynamic";
export async function GET() {
  const auth = await requireOnboardingOwner();
  if (!auth) return NextResponse.json({ message: "Faça login para continuar." }, { status: 401 });
  // Reapresenta somente cobranças pendentes da conta atualmente configurada.
  const order = await auth.db.collection("vellto_onboarding_orders").findOne(
    { businessId: auth.businessId, status: "pending", providerAccount: "legacy", createdAt: { $gte: MP_ACCOUNT_CUTOVER_AT } },
    { sort: { createdAt: -1 } }
  );
  const privateLivePayment =
    process.env.NODE_ENV === "production" &&
    process.env.VELLTO_ONBOARDING_LIVE_ENABLED === "true" &&
    String(process.env.VELLTO_LIVE_TEST_CODE || "").length >= 32 &&
    auth.business.liveTestOnly === true;

  if (order && (
    process.env.VELLTO_ONBOARDING_PAYMENTS_ENABLED === "true" ||
    privateLivePayment
  )) {
    try { await reconcileOnboardingOrder(order._id); } catch (error) { console.error("VELLTO ONBOARDING SYNC", error); }
  }
  const [updated, latestOrder, pending] = await Promise.all([
    auth.db.collection("businesses").findOne({ _id: auth.businessId }),
    auth.db.collection("vellto_onboarding_orders").findOne(
      { businessId: auth.businessId }, { sort: { createdAt: -1 } }
    ),
    auth.db.collection("vellto_onboarding_orders").findOne(
      { businessId: auth.businessId, status: "pending", providerAccount: "legacy", createdAt: { $gte: MP_ACCOUNT_CUTOVER_AT } }, { sort: { createdAt: -1 } }
    ),
  ]);
  const period = updated?.selectedPeriod;
  return NextResponse.json({
    ok: true,
    active: updated?.active === true && updated?.billingStatus === "active" &&
      Boolean(updated?.subscriptionEndsAt) &&
      new Date(updated.subscriptionEndsAt).getTime() > Date.now(),
    period: isPeriod(period) ? period : "monthly",
    periodLabel: isPeriod(period) ? PERIODS[period].label : "Mensal",
    paymentStatus: latestOrder?.status || "none",
    latestOrderId: latestOrder ? String(latestOrder._id) : "",
    subscriptionEndsAt: updated?.subscriptionEndsAt
      ? new Date(updated.subscriptionEndsAt).toISOString() : null,
    payment: pending ? {
      orderId: String(pending._id),
      method: pending.method === "pix" ? "pix" : "card",
      checkoutUrl: String(pending.checkoutUrl || ""),
      qrCode: String(pending.qrCode || ""),
      qrCodeBase64: String(pending.qrCodeBase64 || ""),
    } : null,
  });
}
