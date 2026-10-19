import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { mercadoPagoRequest } from "@/lib/mercado-pago";
import { addMonths, amountCents, isMethod, isPeriod } from "@/lib/vellto-onboarding";

// A ativação só ocorre após consulta direta ao Mercado Pago. Não confiar no status da URL/webhook.
export async function reconcileOnboardingOrder(orderId: ObjectId) {
  const db = await getDb();
  const order = await db.collection("vellto_onboarding_orders").findOne({ _id: orderId });
  if (!order) return false;
  if (order.activatedAt && order.status === "approved") return true;
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
  if (Math.round(Number(payment.transaction_amount) * 100) !== Number(order.amountCents)) return false;
  if (order.method === "pix" && payment.payment_method_id !== "pix") return false;
  if (order.method === "card" && payment.payment_type_id !== "credit_card") return false;
  if (!ObjectId.isValid(String(order.businessId))) return false;
  const businessId = new ObjectId(String(order.businessId));
  const business = await db.collection("businesses").findOne({ _id: businessId, signupSource: "public" });
  if (!business) return false;
  const now = new Date();
  const months = { monthly: 1, semiannual: 6, annual: 12 }[order.period];
  const endsAt = addMonths(now, months);

  const alreadyClaimed =
    String(business.activatedOrderId || "") === String(order._id);

  const expiration = business.subscriptionEndsAt
    ? new Date(business.subscriptionEndsAt).getTime()
    : NaN;

  const initial =
    business.active === false &&
    business.billingStatus === "pending" &&
    !business.activatedOrderId;

  const renewal =
    business.active === true &&
    ["active", "past_due"].includes(String(business.billingStatus)) &&
    Number.isFinite(expiration) &&
    expiration <= now.getTime();

  if (!alreadyClaimed && !initial && !renewal) return false;

  if (!alreadyClaimed) {
    const filter = initial
      ? {
          _id: businessId,
          signupSource: "public",
          active: false,
          billingStatus: "pending",
          activatedOrderId: { $exists: false },
        }
      : {
          _id: businessId,
          signupSource: "public",
          active: true,
          activatedOrderId: business.activatedOrderId,
          subscriptionEndsAt: business.subscriptionEndsAt,
        };

    const claimed = await db.collection("businesses").updateOne(
      filter,
      {
        $set: {
          active: true,
          billingStatus: "active",
          subscriptionEndsAt: endsAt,
          billingUpdatedAt: now,
          updatedAt: now,
          activatedOrderId: order._id,
          selectedPeriod: order.period,
        },
      }
    );

    if (claimed.modifiedCount !== 1) return false;
  }

  // Registrar pagamento antes de finalizar o pedido.
  // Se houver falha, outra tentativa pode concluir o registro.
  await db.collection("saas_billing_payments").updateOne(
    { externalId: `onboarding:${String(payment.id)}` },
    {
      $setOnInsert: {
        businessId,
        externalId: `onboarding:${String(payment.id)}`,
        status: "approved",
        amount: Number(payment.transaction_amount),
        paidAt: now,
        createdAt: now,
        method: order.method,
      },
    },
    { upsert: true }
  );

  await db.collection("vellto_onboarding_orders").updateOne(
    { _id: order._id },
    {
      $set: {
        status: "approved",
        paymentId: String(payment.id),
        activatedAt: now,
      },
    }
  );

  return true;
}
