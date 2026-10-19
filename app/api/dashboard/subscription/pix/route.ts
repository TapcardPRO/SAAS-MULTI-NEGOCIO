import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { amountCents } from "@/lib/vellto-onboarding";
import { requireOwnerSession } from "@/lib/tenant-auth";
import { mercadoPagoRequest } from "@/lib/mercado-pago";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireOwnerSession();
    if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });
    // First release deliberately limited to monthly PIX and no automatic renewal.
    const data = await request.json().catch(() => ({}));
    if (data.period !== "monthly" || data.method !== "pix" || data.autoRenew === true)
      return NextResponse.json({ message: "Este teste aceita apenas Pix mensal sem renovação automática." }, { status: 400 });
    if (process.env.VELLTO_ENABLE_PIX_TEST !== "true")
      return NextResponse.json({ message: "Teste Pix desativado. Configure VELLTO_ENABLE_PIX_TEST=true em ambiente de testes." }, { status: 503 });
    const payerEmail = String(process.env.VELLTO_MP_TEST_PAYER_EMAIL || auth.user.email || "").trim();
    if (!payerEmail) return NextResponse.json({ message: "E-mail do pagador não configurado." }, { status: 400 });
    const reference = `vellto-pix:${String(auth.businessId)}:${randomUUID()}`;
    const payment = await mercadoPagoRequest("/v1/payments", {
      method: "POST",
      headers: { "X-Idempotency-Key": randomUUID() },
      body: {
        transaction_amount: amountCents("monthly", "pix") / 100,
        description: "Vellto Agenda - Mensal - Pix (teste)",
        payment_method_id: "pix",
        payer: { email: payerEmail },
        external_reference: reference,
      },
    });
    const paymentId = String(payment.id || "");
    if (!paymentId) throw new Error("Mercado Pago não retornou ID da cobrança.");
    await auth.db.collection("vellto_pix_orders").insertOne({
      businessId: auth.businessId, paymentId, reference, amount: amountCents("monthly", "pix") / 100,
      status: String(payment.status || "pending"), period: "monthly", autoRenew: false,
      confirmed: false, createdAt: new Date(),
    });
    return NextResponse.json({ ok: true, paymentId,
      qrCode: String(payment.point_of_interaction?.transaction_data?.qr_code || ""),
      qrCodeBase64: String(payment.point_of_interaction?.transaction_data?.qr_code_base64 || ""),
      expiresAt: payment.date_of_expiration || null,
      status: String(payment.status || "pending"),
    });
  } catch (error) {
    console.error("VELLTO PIX CREATE ERROR", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao gerar Pix." }, { status: 500 });
  }
}
