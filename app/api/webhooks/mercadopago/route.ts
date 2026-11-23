import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { mapSubscriptionStatus, mercadoPagoRequest, MercadoPagoAccount } from "@/lib/mercado-pago";

export const dynamic = "force-dynamic";

function validSignature(request: NextRequest, id: string, account: MercadoPagoAccount) {
  const secret = account === "new"
    ? process.env.VELLTO_MP_NEW_WEBHOOK_SECRET || ""
    : process.env.MERCADO_PAGO_WEBHOOK_SECRET || "";
  const signature = request.headers.get("x-signature") || "";
  const requestId = request.headers.get("x-request-id") || "";
  if (!secret || !requestId || !signature) return false;

  const parts = signature.split(",").map((part) => part.trim());
  const ts = parts.find((part) => part.startsWith("ts="))?.slice(3);
  const v1 = parts.find((part) => part.startsWith("v1="))?.slice(3);
  if (!ts || !v1 || !/^\d+$/.test(ts) || !/^[a-f0-9]{64}$/i.test(v1)) return false;

  const timestamp = Number(ts);
  if (!Number.isSafeInteger(timestamp)) return false;
  const timestampMs = timestamp >= 1e12 ? timestamp : timestamp * 1000;
  if (Math.abs(Date.now() - timestampMs) > 10 * 60_000) return false;

  const manifest = `id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const account: MercadoPagoAccount =
      request.nextUrl.searchParams.get("account") === "new" ? "new" : "legacy";
    const type = String(body.type || body.topic || request.nextUrl.searchParams.get("type") || "");
    const dataId = String(body.data?.id || body.id || request.nextUrl.searchParams.get("data.id") || "");

    if (!dataId) return NextResponse.json({ ok: true, ignored: true });

    // O simulador oficial usa um ID fictício e não assina a notificação.
    const simulator = dataId === "123456" && String(body.application_id || "") !== "";
    if (simulator) return NextResponse.json({ ok: true, simulated: true });

    if (!validSignature(request, dataId, account)) {
      return NextResponse.json({ ok: false, message: "Assinatura do webhook inválida." }, { status: 401 });
    }

    const db = await getDb();

    if (type === "subscription_preapproval") {
      const providerSubscription = await mercadoPagoRequest(
        `/preapproval/${encodeURIComponent(dataId)}`,
        {},
        account
      );
      const externalReference = String(providerSubscription.external_reference || "");
      const parsed = parseExternalReference(externalReference);
      if (!parsed) return NextResponse.json({ ok: true, ignored: true });

      const businessId = new ObjectId(parsed.businessId);
      const status = String(providerSubscription.status || "");
      const now = new Date();
      const business = await db.collection("businesses").findOne({ _id: businessId });
      if (!business) return NextResponse.json({ ok: true, ignored: true });

      if (account === "new") {
        if (String(business.pendingMercadoPagoSubscriptionId || "") !== dataId) {
          return NextResponse.json({ ok: true, ignored: true });
        }
        await db.collection("businesses").updateOne(
          { _id: businessId, pendingMercadoPagoSubscriptionId: dataId },
          { $set: { pendingMercadoPagoStatus: status, updatedAt: now } }
        );
        await db.collection("saas_subscriptions").updateOne(
          { businessId, pendingMercadoPagoSubscriptionId: dataId },
          { $set: { pendingMercadoPagoStatus: status, updatedAt: now } }
        );
        if (status === "authorized") await finalizeMigration(db, businessId);
      } else {
        const currentId = String(business.mercadoPagoSubscriptionId || "");
        if (business.mercadoPagoAccount === "new" && currentId !== dataId) {
          return NextResponse.json({ ok: true, ignored: true });
        }
        await db.collection("businesses").updateOne(
          { _id: businessId },
          {
            $set: {
              billingStatus: mapSubscriptionStatus(status),
              plan: parsed.plan,
              mercadoPagoSubscriptionId: dataId,
              mercadoPagoAccount: "legacy",
              billingUpdatedAt: now,
              updatedAt: now,
            },
          }
        );
        await db.collection("saas_subscriptions").updateOne(
          { businessId },
          {
            $set: {
              businessId,
              plan: parsed.plan,
              mercadoPagoSubscriptionId: dataId,
              mercadoPagoAccount: "legacy",
              externalReference,
              status,
              updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
          },
          { upsert: true }
        );
      }
    }

    if (type === "subscription_authorized_payment") {
      const payment = await mercadoPagoRequest(
        `/authorized_payments/${encodeURIComponent(dataId)}`,
        {},
        account
      );
      const subscriptionId = String(payment.preapproval_id || payment.subscription_id || "");
      if (!subscriptionId) return NextResponse.json({ ok: true, ignored: true });

      const stored = await db.collection("saas_subscriptions").findOne({
        $or: [
          { mercadoPagoSubscriptionId: subscriptionId },
          { pendingMercadoPagoSubscriptionId: subscriptionId },
        ],
      });
      if (!stored) return NextResponse.json({ ok: true, ignored: true });

      const businessId = stored.businessId;
      const paymentStatus = String(payment.payment?.status || payment.status || "");
      const approved = paymentStatus === "approved" || paymentStatus === "authorized";
      const paymentExternalId = String(payment.payment?.id || payment.id || dataId);
      const now = new Date();

      await db.collection("saas_billing_payments").updateOne(
        { externalId: paymentExternalId },
        {
          $set: {
            businessId,
            subscriptionId,
            externalId: paymentExternalId,
            status: paymentStatus,
            amount: Number(payment.transaction_amount || payment.amount || 0),
            paidAt: approved ? now : null,
            rawUpdatedAt: now,
            mercadoPagoAccount: account,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );

      if (account === "new") {
        const business = await db.collection("businesses").findOne({
          _id: businessId,
          pendingMercadoPagoSubscriptionId: subscriptionId,
        });
        if (business && approved) {
          await db.collection("businesses").updateOne(
            { _id: businessId, pendingMercadoPagoSubscriptionId: subscriptionId },
            { $set: { pendingMercadoPagoFirstPaymentApproved: true, updatedAt: now } }
          );
          await db.collection("saas_subscriptions").updateOne(
            { businessId, pendingMercadoPagoSubscriptionId: subscriptionId },
            { $set: { pendingMercadoPagoFirstPaymentApproved: true, updatedAt: now } }
          );
          await finalizeMigration(db, businessId);
        }
      } else {
        const business = await db.collection("businesses").findOne({ _id: businessId });
        if (business && !(business.mercadoPagoAccount === "new" &&
          String(business.mercadoPagoSubscriptionId || "") !== subscriptionId)) {
          await db.collection("businesses").updateOne(
            { _id: businessId },
            { $set: { billingStatus: approved ? "active" : "past_due", billingUpdatedAt: now, updatedAt: now } }
          );
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("MERCADO PAGO WEBHOOK ERROR:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

async function finalizeMigration(db: any, businessId: ObjectId) {
  const business = await db.collection("businesses").findOne({ _id: businessId });
  if (!business) return;

  const newId = String(business.pendingMercadoPagoSubscriptionId || "");
  const authorized = String(business.pendingMercadoPagoStatus || "") === "authorized";
  const firstPaymentApproved = business.pendingMercadoPagoFirstPaymentApproved === true;

  // Não troca nem cancela a cobrança antiga antes da nova autorização e do primeiro pagamento aprovado.
  if (!newId || !authorized || !firstPaymentApproved) return;

  const previousId = String(
    business.pendingMercadoPagoPreviousSubscriptionId ||
    business.mercadoPagoSubscriptionId ||
    ""
  );
  const previousAccount: MercadoPagoAccount =
    business.pendingMercadoPagoPreviousAccount === "new" ? "new" : "legacy";
  const now = new Date();

  await db.collection("businesses").updateOne(
    { _id: businessId, pendingMercadoPagoSubscriptionId: newId },
    {
      $set: {
        mercadoPagoSubscriptionId: newId,
        mercadoPagoAccount: "new",
        billingStatus: "active",
        mercadoPagoMigrationStatus: previousId ? "cancellation_pending" : "completed",
        ...(previousId ? {
          mercadoPagoPreviousSubscriptionIdPendingCancel: previousId,
          mercadoPagoPreviousSubscriptionAccountPendingCancel: previousAccount,
        } : {}),
        billingUpdatedAt: now,
        updatedAt: now,
      },
      $unset: {
        pendingMercadoPagoSubscriptionId: "",
        pendingMercadoPagoCheckoutUrl: "",
        pendingMercadoPagoAccount: "",
        pendingMercadoPagoStatus: "",
        pendingMercadoPagoFirstPaymentApproved: "",
        pendingMercadoPagoPreviousSubscriptionId: "",
        pendingMercadoPagoPreviousAccount: "",
      },
    }
  );

  await db.collection("saas_subscriptions").updateOne(
    { businessId },
    {
      $set: {
        mercadoPagoSubscriptionId: newId,
        mercadoPagoAccount: "new",
        status: "authorized",
        mercadoPagoMigrationStatus: previousId ? "cancellation_pending" : "completed",
        ...(previousId ? {
          mercadoPagoPreviousSubscriptionIdPendingCancel: previousId,
          mercadoPagoPreviousSubscriptionAccountPendingCancel: previousAccount,
        } : {}),
        updatedAt: now,
      },
      $unset: {
        pendingMercadoPagoSubscriptionId: "",
        pendingMercadoPagoCheckoutUrl: "",
        pendingMercadoPagoAccount: "",
        pendingMercadoPagoStatus: "",
        pendingMercadoPagoFirstPaymentApproved: "",
        pendingMercadoPagoPreviousSubscriptionId: "",
        pendingMercadoPagoPreviousAccount: "",
      },
    }
  );

  if (!previousId || previousId === newId) return;

  try {
    await mercadoPagoRequest(
      `/preapproval/${encodeURIComponent(previousId)}`,
      { method: "PUT", body: { status: "cancelled" } },
      previousAccount
    );
    await db.collection("businesses").updateOne(
      { _id: businessId, mercadoPagoSubscriptionId: newId },
      {
        $set: { mercadoPagoMigrationStatus: "completed", updatedAt: new Date() },
        $unset: {
          mercadoPagoPreviousSubscriptionIdPendingCancel: "",
          mercadoPagoPreviousSubscriptionAccountPendingCancel: "",
        },
      }
    );
    await db.collection("saas_subscriptions").updateOne(
      { businessId, mercadoPagoSubscriptionId: newId },
      {
        $set: { mercadoPagoMigrationStatus: "completed", updatedAt: new Date() },
        $unset: {
          mercadoPagoPreviousSubscriptionIdPendingCancel: "",
          mercadoPagoPreviousSubscriptionAccountPendingCancel: "",
        },
      }
    );
  } catch (error) {
    // A nova cobrança já está ativa; guardamos a pendência para correção sem afetar o acesso do cliente.
    console.error("MERCADO PAGO LEGACY SUBSCRIPTION CANCELLATION PENDING:", error);
  }
}

function parseExternalReference(value: string) {
  const match = /^vellto:([a-f0-9]{24}):(.+)$/i.exec(value);
  if (!match || !ObjectId.isValid(match[1])) return null;
  return { businessId: match[1], plan: match[2] };
}
