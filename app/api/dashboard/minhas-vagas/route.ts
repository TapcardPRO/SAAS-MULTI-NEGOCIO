import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireBusinessSession } from "@/lib/tenant-auth";
import { normalizeBookingCapacity, parseBookingCapacity } from "@/lib/vellto-booking-capacity";

export const dynamic = "force-dynamic";

async function ownProfessional() {
  const auth = await requireBusinessSession();
  if (!auth.ok) return { ok: false as const, status: auth.status, message: auth.message };
  if (auth.user.role !== "employee" || !ObjectId.isValid(String(auth.user.professionalId || "")))
    return { ok: false as const, status: 403, message: "Acesso exclusivo do profissional vinculado." };
  const professionalId = new ObjectId(String(auth.user.professionalId));
  const professional = await auth.db.collection("professionals").findOne({
    _id: professionalId,
    active: { $ne: false },
    $or: [
      { businessId: auth.businessId },
      { businessId: auth.businessId.toString() },
      ...(auth.business.slug ? [{ businessSlug: auth.business.slug }] : []),
    ],
  });
  if (!professional) return { ok: false as const, status: 404, message: "Profissional nao encontrado." };
  return { ok: true as const, db: auth.db, professional, professionalId };
}

export async function GET() {
  const result = await ownProfessional();
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: result.status });
  return NextResponse.json({
    ok: true, name: String(result.professional.name || "Profissional"),
    bookingCapacity: normalizeBookingCapacity(result.professional.bookingCapacity),
  });
}

export async function PUT(request: Request) {
  const result = await ownProfessional();
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: result.status });
  const body = await request.json().catch(() => ({}));
  const bookingCapacity = parseBookingCapacity(body.bookingCapacity);
  if (bookingCapacity === null) return NextResponse.json(
    { message: "Informe um numero inteiro de 1 a 30 vagas." }, { status: 400 }
  );
  await result.db.collection("professionals").updateOne(
    { _id: result.professionalId, active: { $ne: false } },
    { $set: { bookingCapacity, updatedAt: new Date() } }
  );
  return NextResponse.json({ ok: true, bookingCapacity, message: "Capacidade atualizada com sucesso." });
}
