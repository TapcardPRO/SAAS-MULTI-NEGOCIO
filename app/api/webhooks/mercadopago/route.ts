import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { mapSubscriptionStatus, mercadoPagoRequest } from "@/lib/mercado-pago";

export const dynamic = "force-dynamic";

function validNewAccountSignature(request: NextRequest, id: string) {
  const secret = process.env.VELLTO_MP_NEW_WEBHOOK_SECRET || "";
  const signature = request.headers.get("x-signature") || "";
  const requestId = request.headers.get("x-request-id") || "";
  if (!secret || !signature || !requestId) return false;
  const parts = signature.split(",").map((part) => part.trim());
  const ts = parts.find((part) => part.startsWith("ts="))?.slice(3) || "";
  const v1 = parts.find((part) => part.startsWith("v1="))?.slice(3) || "";
  if (!/^\\d+$/.test(ts) || !/^[a-f0-9]{64}$/i.test(v1)) return false;
  const timestamp = Number(ts);
  const timestampMs = timestamp >= 1e12 ? timestamp : timestamp * 1000;
  if (!Number.isSafeInteger(timestamp) || Math.abs(Date.now() - timestampMs) > 10 * 60_000) return false;
  const manifest = `id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest();
  const received = Buffer.from(v1, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = new URL(request.url);
    const account = url.searchParams.get("account") === "new" ? "new" : "legacy";
    const type = String(url.searchParams.get("type") || body.type || body.topic || "");
    const dataId = String(url.searchParams.get("data.id") || body.data?.id || body.id || "");
    if (!dataId) return NextResponse.json({ ok: true, ignored: true });

    const simulator = dataId === "123456" && String(body.application_id || "") !== "";
    if (simulator) return NextResponse.json({ ok: true, simulated: true });
    if (account === "new" && !validNewAccountSignature(request, dataId)) {
      return NextResponse.json({ ok: false, message: "Assinatura do webhook inválida." }, { status: 401 });
    }

    const db = await getDb();
    if (type === "subscription_preapproval" || type === "preapproval") {
      const provider = await mercadoPagoRequest(`/preapproval/${encodeURIComponent(dataId)}`, {}, account);
      const externalReference = String(provider.external_reference || "");
      const parsed = parseExternalReference(externalReference);
      if (!parsed) return NextResponse.json({ ok: true, ignored: true });
      const businessId = new ObjectId(parsed.businessId);
      const status = String(provider.status || "");
      const now = new Date();

      if (account === "new") {
        const business = await db.collection("businesses").findOne({
          _id: businessId,
          mercadoPagoPendingSubscriptionId: dataId,
          mercadoPagoPendingAccount: "new",
        });
        if (!business) return NextResponse.json({ ok: true, ignored: true });

        if (status === "authorized" || status === "active") {
          const oldSubscriptionId = String(business.mercadoPagoMigrationFromSubscriptionId || business.mercadoPagoSubscriptionId || "");
          const newPlan = String(business.mercadoPagoPendingPlan || parsed.plan);
          await db.collection("businesses").updateOne(
            { _id: businessId, mercadoPagoPendingSubscriptionId: dataId },
            { $set: {
              plan: newPlan,
              mercadoPagoSubscriptionId: dataId,
              mercadoPagoAccount: "new",
              mercadoPagoCheckoutUrl: String(provider.init_point || ""),
              billingStatus: "active",
              billingUpdatedAt: now,
              updatedAt: now,
            }, $unset: {
              mercadoPagoPendingSubscriptionId: "",
              mercadoPagoPendingCheckoutUrl: "",
              mercadoPagoPendingAccount: "",
              mercadoPagoPendingPlan: "",
              mercadoPagoPendingCreatedAt: "",
              mercadoPagoMigrationFromSubscriptionId: "",
            } }
          );
          await db.collection("saas_subscriptions").updateOne(
            { businessId },
            { $set: {
              businessId,
              plan: newPlan,
              mercadoPagoSubscriptionId: dataId,
              mercadoPagoAccount: "new",
              externalReference,
              status,
              amount: Number(provider.auto_recurring?.transaction_amount || 0),
              billingCycle: Number(provider.auto_recurring?.frequency || 1) === 12 ? "yearly" : "monthly",
              checkoutUrl: String(provider.init_point || ""),
              updatedAt: now,
            }, $setOnInsert: { createdAt: now } },
            { upsert: true }
          );

          // Só cancelar a recorrência antiga depois de confirmar que a nova está autorizada.
          if (oldSubscriptionId && oldSubscriptionId !== dataId) {
            try {
              await mercadoPagoRequest(`/preapproval/${encodeURIComponent(oldSubscriptionId)}`, {
                method: "PUT",
                body: { status: "cancelled" },
              }, "legacy");
              await db.collection("businesses").updateOne(
                { _id: businessId },
                { $set: { mercadoPagoLegacyCancellationPending: false, mercadoPagoLegacyCancelledAt: now } }
              );
            } catch (cancelError) {
              console.error("Falha ao cancelar assinatura antiga após migração confirmada:", cancelError);
              await db.collection("businesses").updateOne(
                { _id: businessId },
                { $set: { mercadoPagoLegacyCancellationPending: true, mercadoPagoLegacySubscriptionId: oldSubscriptionId } }
              );
            }
          }
        } else {
          await db.collection("businesses").updateOne(
            { _id: businessId, mercadoPagoPendingSubscriptionId: dataId },
            { $set: { mercadoPagoPendingStatus: status, updatedAt: now } }
          );
        }
      } else {
        const current = await db.collection("businesses").findOne({
          _id: businessId,
          mercadoPagoSubscriptionId: dataId,
        });
        if (!current || current.mercadoPagoAccount === "new") return NextResponse.json({ ok: true, ignored: true });
        await db.collection("businesses").updateOne(
          { _id: businessId, mercadoPagoSubscriptionId: dataId },
          { $set: { billingStatus: mapSubscriptionStatus(status), plan: parsed.plan, billingUpdatedAt: now, updatedAt: now } }
        );
        await db.collection("saas_subscriptions").updateOne(
          { businessId, mercadoPagoSubscriptionId: dataId },
          { $set: { status, updatedAt: now } }
        );
      }
    }

    if (type === "subscription_authorized_payment") {
      const payment = await mercadoPagoRequest(`/authorized_payments/${encodeURIComponent(dataId)}`, {}, account);
      const subscriptionId = String(payment.preapproval_id || payment.subscription_id || "");
      if (!subscriptionId) return NextResponse.json({ ok: true, ignored: true });
      const stored = await db.collection("saas_subscriptions").findOne({
        mercadoPagoSubscriptionId: subscriptionId,
        mercadoPagoAccount: account,
      });
      if (!stored) return NextResponse.json({ ok: true, ignored: true });
      const businessId = stored.businessId;
      const status = String(payment.payment?.status || payment.status || "");
      const approved = status === "approved" || status === "authorized";
      const now = new Date();
      const paymentId = String(payment.payment?.id || payment.id || dataId);
      await db.collection("saas_billing_payments").updateOne(
        { externalId: paymentId },
        { $set: {
          businessId,
          subscriptionId,
          externalId: paymentId,
          status,
          amount: Number(payment.transaction_amount || payment.amount || 0),
          paidAt: approved ? now : null,
          rawUpdatedAt: now,
          mercadoPagoAccount: account,
        }, $setOnInsert: { createdAt: now } },
        { upsert: true }
      );
      if (approved) {
        await db.collection("businesses").updateOne(
          { _id: businessId, mercadoPagoSubscriptionId: subscriptionId, mercadoPagoAccount: account },
          { $set: { billingStatus: "active", billingUpdatedAt: now, updatedAt: now } }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("MERCADO PAGO WEBHOOK ERROR:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

function parseExternalReference(value: string) {
  const match = /^vellto:([a-f0-9]{24}):(.+)$/i.exec(value);
  if (!match || !ObjectId.isValid(match[1])) return null;
  return { businessId: match[1], plan: match[2] };
}
