import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { mercadoPagoRequest } from "@/lib/mercado-pago";
import { addMonths, amountCents, isMethod, isPeriod } from "@/lib/vellto-onboarding";

// A ativação só ocorre após consulta direta ao Mercado Pago. Não confiar no status da URL/webhook.
export async function reconcileOnboardingOrder(orderId: ObjectId) {
  const db = await getDb();
  const order = await db.collection("vellto_onboarding_orders").findOne({ _id: orderId });
  if (!order || order.activatedAt) return Boolean(order?.activatedAt);
  if (!isPeriod(order.period) || !isMethod(order.method)) return false;
  let payment: Record<string, unknown> | null = null;
  if (order.method === "pix" && order.paymentId) {
    payment = await mercadoPagoRequest(`/v1/payments/${encodeURIComponent(String(order.paymentId))}`);
  } else if (order.method === "card" && order.preferenceId) {
    // A preferência não prova pagamento. Buscar pagamento por referência e validar cada campo.
    const result = await mercadoPagoRequest(`/v1/payments/search?external_reference=${encodeURIComponent(String(order.reference))}&limit=20`);
    const results = Array.isArray(result?.results) ? result.results : [];
    const candidate = results.find((p: Record<string, unknown>) => String(p.external_reference) === String(order.reference) && p.status === "approved");
    if (candidate?.id) payment = await mercadoPagoRequest(`/v1/payments/${encodeURIComponent(String(candidate.id))}`);
  }
  if (!payment || payment.status !== "approved" || String(payment.external_reference) !== String(order.reference)) return false;
  if (Math.round(Number(payment.transaction_amount) * 100) !== amountCents(order.period, order.method)) return false;
  if (order.method === "pix" && payment.payment_method_id !== "pix") return false;
  if (order.method === "card" && payment.payment_type_id !== "credit_card") return false;
  if (!ObjectId.isValid(String(order.businessId))) return false;
  const businessId = new ObjectId(String(order.businessId));
  const business = await db.collection("businesses").findOne({ _id: businessId, signupSource: "public" });
  if (!business) return false;
  // Apenas a primeira ativação deste onboarding. Outras renovações terão fluxo próprio.
  if (business.activatedOrderId && String(business.activatedOrderId) !== String(order._id)) return false;
  const now = new Date();
  const endsAt = addMonths(now, { monthly: 1, semiannual: 6, annual: 12 }[order.period]);
  const claimed = await db.collection("businesses").updateOne(
    { _id: businessId, signupSource: "public", activatedOrderId: { $exists: false }, active: false },
    { $set: { active: true, billingStatus: "active", subscriptionEndsAt: endsAt, billingUpdatedAt: now, updatedAt: now, activatedOrderId: order._id, selectedPeriod: order.period } }
  );
  if (claimed.modifiedCount === 1 || String(business.activatedOrderId || "") === String(order._id)) {
    await db.collection("vellto_onboarding_orders").updateOne({ _id: order._id }, { $set: { status: "approved", paymentId: String(payment.id), activatedAt: now } });
    await db.collection("saas_billing_payments").updateOne(
      { externalId: `onboarding:${String(payment.id)}` },
      { $setOnInsert: { businessId, externalId: `onboarding:${String(payment.id)}`, status: "approved", amount: Number(payment.transaction_amount), paidAt: now, createdAt: now, method: order.method } },
      { upsert: true }
    );
    return true;
  }
  return false;
}
