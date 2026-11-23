import { NextRequest, NextResponse } from "next/server";
import { requireOwnerSession } from "@/lib/tenant-auth";
import { mercadoPagoRequest } from "@/lib/mercado-pago";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireOwnerSession();
    if (!auth.ok) {
      return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });
    }

    if (auth.business.signupSource === "public") {
      return NextResponse.json(
        { ok: false, message: "Para renovar esta assinatura, use a página de renovação da Vellto.", redirectUrl: "/renovar" },
        { status: 409 }
      );
    }

    if (!process.env.VELLTO_MP_NEW_ACCESS_TOKEN) {
      return NextResponse.json(
        { ok: false, message: "A nova conta de recebimento ainda não está configurada." },
        { status: 503 }
      );
    }

    const existingPending = String(auth.business.pendingMercadoPagoSubscriptionId || "");
    const existingPendingUrl = String(auth.business.pendingMercadoPagoCheckoutUrl || "");
    if (existingPending && existingPendingUrl) {
      return NextResponse.json({ ok: true, checkoutUrl: existingPendingUrl, subscriptionId: existingPending, reused: true });
    }

    const body = await request.json().catch(() => ({}));
    const requestedPlan = String(body.plan || auth.business.plan || "").trim();
    const plan = await auth.db.collection("saas_plans").findOne({
      slug: requestedPlan,
      active: { $ne: false },
    });

    if (!plan) {
      return NextResponse.json({ ok: false, message: "Plano Vellto não encontrado." }, { status: 404 });
    }

    const amount = Number(plan.price || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, message: "Este plano não possui cobrança recorrente configurada." }, { status: 400 });
    }

    const testPayerEmail = String(process.env.VELLTO_MP_TEST_PAYER_EMAIL || "").trim().toLowerCase();
    const ownerEmail = process.env.VELLTO_ONBOARDING_LIVE_ENABLED === "true"
      ? String(auth.user.email || "").trim().toLowerCase()
      : (testPayerEmail || String(auth.user.email || "").trim().toLowerCase());

    if (!ownerEmail) {
      return NextResponse.json({ ok: false, message: "Nenhum e-mail de pagador foi configurado." }, { status: 400 });
    }

    const siteUrl = String(
      process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://velltoagenda.vercel.app"
    ).replace(/\/+$/, "");

    const billingCycle = String(plan.billingCycle || "monthly");
    const frequency = billingCycle === "yearly" ? 12 : 1;
    const externalReference = `vellto:${String(auth.businessId)}:${String(plan.slug)}`;

    const subscription = await mercadoPagoRequest(
      "/preapproval",
      {
        method: "POST",
        body: {
          reason: `Vellto Agenda - ${String(plan.name || "Assinatura")}`,
          external_reference: externalReference,
          payer_email: ownerEmail,
          auto_recurring: {
            frequency,
            frequency_type: "months",
            transaction_amount: amount,
            currency_id: "BRL",
          },
          back_url: `${siteUrl}/dashboard/assinatura?migration=return`,
          status: "pending",
        },
      },
      "new"
    );

    const subscriptionId = String(subscription.id || "");
    const checkoutUrl = String(subscription.init_point || "");
    if (!subscriptionId || !checkoutUrl) {
      return NextResponse.json(
        { ok: false, message: "O Mercado Pago não retornou os dados necessários para iniciar a nova assinatura." },
        { status: 502 }
      );
    }

    const now = new Date();
    const previousSubscriptionId = String(auth.business.mercadoPagoSubscriptionId || "");
    const previousAccount = auth.business.mercadoPagoAccount === "new" ? "new" : "legacy";

    // A assinatura atual continua intacta até a nova autorização e o primeiro pagamento aprovado.
    await auth.db.collection("businesses").updateOne(
      { _id: auth.businessId },
      {
        $set: {
          pendingMercadoPagoSubscriptionId: subscriptionId,
          pendingMercadoPagoCheckoutUrl: checkoutUrl,
          pendingMercadoPagoAccount: "new",
          pendingMercadoPagoPreviousSubscriptionId: previousSubscriptionId,
          pendingMercadoPagoPreviousAccount: previousAccount,
          pendingMercadoPagoStatus: String(subscription.status || "pending"),
          pendingMercadoPagoFirstPaymentApproved: false,
          mercadoPagoMigrationStatus: "awaiting_authorization",
          billingUpdatedAt: now,
          updatedAt: now,
        },
      }
    );

    await auth.db.collection("saas_subscriptions").updateOne(
      { businessId: auth.businessId },
      {
        $set: {
          pendingMercadoPagoSubscriptionId: subscriptionId,
          pendingMercadoPagoCheckoutUrl: checkoutUrl,
          pendingMercadoPagoAccount: "new",
          pendingMercadoPagoPreviousSubscriptionId: previousSubscriptionId,
          pendingMercadoPagoPreviousAccount: previousAccount,
          pendingMercadoPagoStatus: String(subscription.status || "pending"),
          pendingMercadoPagoFirstPaymentApproved: false,
          mercadoPagoMigrationStatus: "awaiting_authorization",
          updatedAt: now,
        },
        $setOnInsert: { businessId: auth.businessId, createdAt: now },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, checkoutUrl, subscriptionId });
  } catch (error) {
    console.error("SUBSCRIPTION MIGRATION CHECKOUT ERROR:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Erro ao iniciar atualização da assinatura." },
      { status: 500 }
    );
  }
}
