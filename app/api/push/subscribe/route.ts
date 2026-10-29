import { NextResponse } from "next/server";
import { requireBusinessSession } from "@/lib/tenant-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireBusinessSession();
    if (!auth.ok) {
      return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });
    }

    const body = await request.json();
    const subscription = body?.subscription;
    if (
      !subscription ||
      typeof subscription.endpoint !== "string" ||
      !subscription.endpoint.startsWith("https://") ||
      !subscription.keys ||
      typeof subscription.keys.p256dh !== "string" ||
      typeof subscription.keys.auth !== "string"
    ) {
      return NextResponse.json({ ok: false, message: "Assinatura push inválida." }, { status: 400 });
    }

    const now = new Date();
    await auth.db.collection("pushSubscriptions").updateOne(
      { endpoint: subscription.endpoint },
      {
        $set: {
          endpoint: subscription.endpoint,
          subscription,
          userId: auth.user._id,
          businessId: auth.businessId,
          role: auth.user.role || "owner",
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUSH SUBSCRIBE ERROR:", error);
    return NextResponse.json({ ok: false, message: "Não foi possível ativar as notificações." }, { status: 500 });
  }
}
