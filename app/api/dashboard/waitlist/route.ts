import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireBusinessSession } from "@/lib/tenant-auth";

export const dynamic = "force-dynamic";

function businessFilters(businessId: ObjectId, slug?: string) {
  return [{ businessId }, { businessId: businessId.toString() }, ...(slug ? [{ businessSlug: slug }] : [])];
}

export async function GET() {
  try {
    const auth = await requireBusinessSession();
    if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

    const filters: any[] = businessFilters(auth.businessId, auth.business.slug);
    const query: any = { $or: filters };
    const professionalId = String(auth.user.professionalId || "");
    if (auth.user.role === "employee") {
      if (!ObjectId.isValid(professionalId)) return NextResponse.json({ ok: false, message: "Profissional não vinculado." }, { status: 403 });
      query.professionalId = { $in: [new ObjectId(professionalId), professionalId] };
    }

    const [items, professionals] = await Promise.all([
      auth.db.collection("appointmentWaitlist").find(query).sort({ createdAt: -1 }).limit(150).toArray(),
      auth.db.collection("professionals").find({ $or: filters, active: { $ne: false }, ...(auth.user.role === "employee" ? { _id: new ObjectId(professionalId) } : {}) }).sort({ order: 1, name: 1 }).toArray(),
    ]);

    return NextResponse.json({
      ok: true,
      professionals: professionals.map((professional: any) => ({ id: String(professional._id), name: String(professional.name || "Profissional") })),
      waitlist: items.map((item: any) => ({
        id: String(item._id),
        clientName: String(item.clientName || "Cliente"),
        clientPhone: String(item.clientPhone || ""),
        serviceNames: Array.isArray(item.serviceNames) ? item.serviceNames.map(String) : [],
        professionalName: String(item.professionalName || ""),
        professionalId: String(item.professionalId || ""),
        preferredDate: String(item.preferredDate || ""),
        availableDate: String(item.availableDate || ""),
        availableTime: String(item.availableTime || ""),
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
    const availableDate = String(body.availableDate || "").trim();
    const availableTime = String(body.availableTime || "").trim();
    const hasAvailability = Boolean(availableDate || availableTime);
    if (!ObjectId.isValid(id) || (hasAvailability && (!/^\\d{4}-\\d{2}-\\d{2}$/.test(availableDate) || !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(availableTime))) || (!hasAvailability && !["waiting", "contacted", "booked", "cancelled"].includes(status))) {
      return NextResponse.json({ ok: false, message: "Atualização inválida." }, { status: 400 });
    }

    const query: any = { _id: new ObjectId(id), $or: businessFilters(auth.businessId) };
    if (auth.user.role === "employee") {
      const professionalId = String(auth.user.professionalId || "");
      if (!ObjectId.isValid(professionalId)) return NextResponse.json({ ok: false, message: "Profissional não vinculado." }, { status: 403 });
      query.professionalId = { $in: [new ObjectId(professionalId), professionalId] };
    }

    const update: any = { updatedAt: new Date() };
    if (hasAvailability) Object.assign(update, { availableDate, availableTime, status: "contacted", vacancyOfferedAt: new Date() });
    else update.status = status;
    const result = await auth.db.collection("appointmentWaitlist").updateOne(query, { $set: update });
    if (!result.matchedCount) return NextResponse.json({ ok: false, message: "Registro não encontrado." }, { status: 404 });

    return NextResponse.json({ ok: true, message: hasAvailability ? "Vaga registrada e cliente marcado para contato." : "Lista de espera atualizada." });
  } catch (error) {
    console.error("DASHBOARD WAITLIST UPDATE ERROR:", error);
    return NextResponse.json({ ok: false, message: "Erro ao atualizar lista de espera." }, { status: 500 });
  }
}
