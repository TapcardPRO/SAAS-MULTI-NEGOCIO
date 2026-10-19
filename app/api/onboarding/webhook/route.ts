import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";
import { reconcileOnboardingOrder } from "@/lib/vellto-onboarding-payments";
export const dynamic = "force-dynamic";
function validSignature(request: NextRequest, id: string) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET || "";
  const signature = request.headers.get("x-signature") || "";
  const requestId = request.headers.get("x-request-id") || "";
  if (!secret || !requestId || !signature) return false;
  const ts = signature.split(",").map(v => v.trim()).find(v => v.startsWith("ts="))?.slice(3);
  const v1 = signature.split(",").map(v => v.trim()).find(v => v.startsWith("v1="))?.slice(3);
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
  const body = await request.json().catch(() => ({}));
  const url = new URL(request.url);
  const id = String(url.searchParams.get("data.id") || body?.data?.id || "");
  const topic = String(url.searchParams.get("type") || body?.type || body?.topic || "").toLowerCase();
  const mpOrder = topic === "order" || /^ORD[A-Z0-9]+$/i.test(id);
  if (mpOrder ? !/^ORD[A-Z0-9]{6,70}$/i.test(id) : !/^\d{1,25}$/.test(id))
    return NextResponse.json({ ok: true, ignored: true });
  if (!validSignature(request, id)) return NextResponse.json({ message: "Assinatura inválida" }, { status: 401 });
  try {
    const db = await getDb();
    if (mpOrder) {
      let order = await db.collection("vellto_onboarding_orders").findOne({ mpOrderId: id, method: "pix" });
      if (!order) {
        // A notificacao pode chegar antes de o ID da order ser persistido.
        const providerOrder = await (await import("@/lib/mercado-pago"))
          .mercadoPagoRequest(`/v1/orders/${encodeURIComponent(id)}`);
        const reference = String(providerOrder.external_reference || "");
        order = await db.collection("vellto_onboarding_orders").findOne({ reference, method: "pix" });
        if (order && !order.mpOrderId) {
          await db.collection("vellto_onboarding_orders").updateOne(
            { _id: order._id, mpOrderId: { $exists: false } },
            { $set: { mpOrderId: id } }
          );
        }
      }
      if (order && (!order.mpOrderId || String(order.mpOrderId) === id))
        await reconcileOnboardingOrder(order._id);
      return NextResponse.json({ ok: true });
    }
    const order = await db.collection("vellto_onboarding_orders").findOne({ paymentId: id });
    if (order) await reconcileOnboardingOrder(order._id);
    else {
      // Para cartão, pagamento pode chegar antes da preferência ser associada ao pedido.
      const payment = await (await import("@/lib/mercado-pago")).mercadoPagoRequest(`/v1/payments/${encodeURIComponent(id)}`);
      const reference = String(payment.external_reference || "");
      const cardOrder = await db.collection("vellto_onboarding_orders").findOne({ reference, method: "card" });
      if (cardOrder) await reconcileOnboardingOrder(cardOrder._id);
    }
    return NextResponse.json({ ok: true });
  } catch (error) { console.error("VELLTO ONBOARDING WEBHOOK", error); return NextResponse.json({ ok: false }, { status: 500 }); }
}
