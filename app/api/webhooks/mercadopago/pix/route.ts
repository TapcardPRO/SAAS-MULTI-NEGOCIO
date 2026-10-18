import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { mercadoPagoRequest } from "@/lib/mercado-pago";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = String(body.data?.id || new URL(request.url).searchParams.get("data.id") || "");
    if (!/^\d+$/.test(id)) return NextResponse.json({ ok: true, ignored: true });
    // Always retrieve payment status server-to-server; never trust webhook payload as proof.
    const payment = await mercadoPagoRequest(`/v1/payments/${encodeURIComponent(id)}`);
    const reference = String(payment.external_reference || "");
    if (!reference.startsWith("vellto-pix:")) return NextResponse.json({ ok: true, ignored: true });
    const db = await getDb();
    const order = await db.collection("vellto_pix_orders").findOne({ paymentId: id, reference });
    if (!order) return NextResponse.json({ ok: true, ignored: true });
    const approved = payment.status === "approved" && payment.payment_method_id === "pix" &&
      Math.abs(Number(payment.transaction_amount) - Number(order.amount)) < 0.001;
    await db.collection("vellto_pix_orders").updateOne({ _id: order._id }, {
      $set: { status: String(payment.status || "unknown"), confirmed: approved, checkedAt: new Date() }
    });
    // Safe test: do not change business billingStatus or subscriptionEndsAt until
    // entitlement policy, retries, expiration and reconciliation are validated.
    return NextResponse.json({ ok: true, confirmed: approved });
  } catch (error) {
    console.error("VELLTO PIX WEBHOOK ERROR", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
