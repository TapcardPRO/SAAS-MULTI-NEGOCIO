import { NextResponse } from "next/server";
import { requireOnboardingOwner } from "@/lib/vellto-onboarding-auth";
import { reconcileOnboardingOrder } from "@/lib/vellto-onboarding-payments";
import { isPeriod, PERIODS } from "@/lib/vellto-onboarding";
export const dynamic = "force-dynamic";
export async function GET() {
  const auth = await requireOnboardingOwner();
  if (!auth) return NextResponse.json({ message: "Faça login para continuar." }, { status: 401 });
  const order = await auth.db.collection("vellto_onboarding_orders").findOne({ businessId: auth.businessId, status: "pending" }, { sort: { createdAt: -1 } });
  if (order && process.env.VELLTO_ONBOARDING_PAYMENTS_ENABLED === "true") {
    try { await reconcileOnboardingOrder(order._id); } catch (error) { console.error("VELLTO ONBOARDING SYNC", error); }
  }
  const updated = await auth.db.collection("businesses").findOne({ _id: auth.businessId });
  const latestOrder = await auth.db.collection("vellto_onboarding_orders").findOne(
    { businessId: auth.businessId }, { sort: { createdAt: -1 } }
  );
  const period = updated?.selectedPeriod;
  return NextResponse.json({ ok: true, active: updated?.active === true &&
    updated?.billingStatus === "active" &&
    Boolean(updated?.subscriptionEndsAt) &&
    new Date(updated.subscriptionEndsAt).getTime() > Date.now(), period: isPeriod(period) ? period : "monthly", periodLabel: isPeriod(period) ? PERIODS[period].label : "Mensal", paymentStatus: latestOrder?.status || "none" });
}
