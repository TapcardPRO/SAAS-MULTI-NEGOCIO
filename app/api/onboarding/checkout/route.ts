import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireOnboardingOwner } from "@/lib/vellto-onboarding-auth";
import { amountCents, isMethod, isPeriod, PERIODS } from "@/lib/vellto-onboarding";
import { mercadoPagoRequest } from "@/lib/mercado-pago";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (process.env.VELLTO_ONBOARDING_PAYMENTS_ENABLED !== "true") return NextResponse.json({ message: "Pagamentos em preparação. Nenhuma cobrança foi realizada." }, { status: 503 });
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
  if (!token) return NextResponse.json({ message: "Mercado Pago não configurado." }, { status: 503 });
  // Somente credenciais de teste enquanto o fluxo não for homologado.
  if (process.env.VELLTO_ONBOARDING_LIVE_ENABLED !== "true" && !token.startsWith("TEST-"))
    return NextResponse.json({ message: "Use credenciais TEST do Mercado Pago neste ambiente." }, { status: 503 });
  const auth = await requireOnboardingOwner();
  if (!auth) return NextResponse.json({ message: "Faça login para continuar." }, { status: 401 });
  if (auth.business.active || auth.business.billingStatus !== "pending") return NextResponse.json({ message: "Sua conta já foi ativada." }, { status: 409 });
  const body = await request.json().catch(() => ({}));
  const period = auth.business.selectedPeriod;
  const method = body.method;
  if (!isPeriod(period) || !isMethod(method) || body.autoRenew === true)
    return NextResponse.json({ message: "Seleção inválida. Renovação automática ainda indisponível." }, { status: 400 });
  const cents = amountCents(period, method);
  const baseUrl = String(process.env.VELLTO_PUBLIC_URL || "").replace(/\/$/, "");
  if (!baseUrl.startsWith("https://")) return NextResponse.json({ message: "Configure VELLTO_PUBLIC_URL com uma URL pública HTTPS." }, { status: 503 });
  const recent = await auth.db.collection("vellto_onboarding_orders").findOne({ businessId: auth.businessId, method, status: "pending", createdAt: { $gt: new Date(Date.now() - 10 * 60_000) } }, { sort: { createdAt: -1 } });
  if (recent?.checkoutUrl || recent?.qrCode) return NextResponse.json({ ok: true, method, checkoutUrl: recent.checkoutUrl || "", qrCode: recent.qrCode || "", qrCodeBase64: recent.qrCodeBase64 || "", orderId: String(recent._id) });
  const reference = `vellto-onboard:${String(auth.businessId)}:${randomUUID()}`;
  const orderResult = await auth.db.collection("vellto_onboarding_orders").insertOne({ businessId: auth.businessId, reference, method, period, amountCents: cents, status: "pending", createdAt: new Date() });
  const orderId = orderResult.insertedId;
  try {
    const email = String(process.env.VELLTO_MP_TEST_PAYER_EMAIL || auth.user.email);
    if (method === "pix") {
      const payment = await mercadoPagoRequest("/v1/payments", { method: "POST", headers: { "X-Idempotency-Key": randomUUID() }, body: {
        transaction_amount: cents / 100, description: `Vellto Agenda - ${PERIODS[period].label}`,
        payment_method_id: "pix", payer: { email }, external_reference: reference,
        notification_url: `${baseUrl}/api/onboarding/webhook`,
      } });
      const qrCode = String(payment.point_of_interaction?.transaction_data?.qr_code || "");
      const qrCodeBase64 = String(payment.point_of_interaction?.transaction_data?.qr_code_base64 || "");
      if (!payment.id || !qrCode) throw new Error("Mercado Pago não retornou os dados do Pix.");
      await auth.db.collection("vellto_onboarding_orders").updateOne({ _id: orderId }, { $set: { paymentId: String(payment.id), qrCode, qrCodeBase64 } });
      return NextResponse.json({ ok: true, method, orderId: String(orderId), qrCode, qrCodeBase64 });
    }
    const preference = await mercadoPagoRequest("/checkout/preferences", { method: "POST", body: {
      items: [{ id: `vellto-${period}`, title: `Vellto Agenda - ${PERIODS[period].label}`, quantity: 1, unit_price: cents / 100, currency_id: "BRL" }],
      payer: { email }, external_reference: reference,
      payment_methods: { excluded_payment_methods: [{ id: "pix" }], excluded_payment_types: [{ id: "ticket" }, { id: "bank_transfer" }, { id: "debit_card" }], installments: PERIODS[period].installments },
      notification_url: `${baseUrl}/api/onboarding/webhook`,
      back_urls: { success: `${baseUrl}/ativar`, failure: `${baseUrl}/ativar`, pending: `${baseUrl}/ativar` },
      auto_return: "approved",
    } });
    const checkoutUrl = token.startsWith("TEST-") ? String(preference.sandbox_init_point || preference.init_point || "") : String(preference.init_point || "");
    if (!preference.id || !checkoutUrl) throw new Error("Mercado Pago não retornou o checkout.");
    await auth.db.collection("vellto_onboarding_orders").updateOne({ _id: orderId }, { $set: { preferenceId: String(preference.id), checkoutUrl } });
    return NextResponse.json({ ok: true, method, orderId: String(orderId), checkoutUrl });
  } catch (error) {
    console.error("VELLTO ONBOARDING CHECKOUT", error);
    await auth.db.collection("vellto_onboarding_orders").updateOne({ _id: orderId }, { $set: { status: "error" } });
    return NextResponse.json({ message: "Não foi possível gerar a cobrança. Confira as credenciais e tente novamente." }, { status: 502 });
  }
}
