import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireBusinessSession } from "@/lib/tenant-auth";

export const dynamic = "force-dynamic";

function businessFilters(businessId: ObjectId) {
  return [{ businessId }, { businessId: businessId.toString() }];
}

export async function GET() {
  try {
    const auth = await requireBusinessSession();
    if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

    const filters: any[] = businessFilters(auth.businessId);
    const query: any = { $or: filters };
    if (auth.user.role === "employee") {
      const professionalId = String(auth.user.professionalId || "");
      if (!ObjectId.isValid(professionalId)) return NextResponse.json({ ok: false, message: "Profissional não vinculado." }, { status: 403 });
      query.professionalId = { $in: [new ObjectId(professionalId), professionalId] };
    }

    const items = await auth.db.collection("appointmentWaitlist")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(150)
      .toArray();

    return NextResponse.json({
      ok: true,
      waitlist: items.map((item: any) => ({
        id: String(item._id),
        clientName: String(item.clientName || "Cliente"),
        clientPhone: String(item.clientPhone || ""),
        serviceNames: Array.isArray(item.serviceNames) ? item.serviceNames.map(String) : [],
        professionalName: String(item.professionalName || ""),
        professionalId: String(item.professionalId || ""),
        preferredDate: String(item.preferredDate || ""),
        status: String(item.status || "waiting"),
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt || null,
      })),
    });
  } catch (error) {
    console.error("DASHBOARD WAITLIST GET ERROR:", error);
    return NextResponse.json({ ok: false, message: "Erro ao carregar lista de espera." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireBusinessSession();
    if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

    const body = await request.json();
    const id = String(body.id || "");
    const status = String(body.status || "");
    if (!ObjectId.isValid(id) || !["waiting", "contacted", "booked", "cancelled"].includes(status)) {
      return NextResponse.json({ ok: false, message: "Atualização inválida." }, { status: 400 });
    }

    const query: any = { _id: new ObjectId(id), $or: businessFilters(auth.businessId) };
    if (auth.user.role === "employee") {
      const professionalId = String(auth.user.professionalId || "");
      if (!ObjectId.isValid(professionalId)) return NextResponse.json({ ok: false, message: "Profissional não vinculado." }, { status: 403 });
      query.professionalId = { $in: [new ObjectId(professionalId), professionalId] };
    }

    const result = await auth.db.collection("appointmentWaitlist").updateOne(query, {
      $set: { status, updatedAt: new Date() },
    });
    if (!result.matchedCount) return NextResponse.json({ ok: false, message: "Registro não encontrado." }, { status: 404 });

    return NextResponse.json({ ok: true, message: "Lista de espera atualizada." });
  } catch (error) {
    console.error("DASHBOARD WAITLIST UPDATE ERROR:", error);
    return NextResponse.json({ ok: false, message: "Erro ao atualizar lista de espera." }, { status: 500 });
  }
}
