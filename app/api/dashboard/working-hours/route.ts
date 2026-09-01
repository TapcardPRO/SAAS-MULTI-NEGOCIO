import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/lib/tenant-auth";
import { normalizeWorkingHours } from "@/lib/booking";

export async function GET() {
  const auth = await requireOwnerSession();
  if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });
  return NextResponse.json({ ok: true, workingHours: normalizeWorkingHours(auth.business.workingHours) });
}

export async function PUT(request: Request) {
  try {
    const auth = await requireOwnerSession();
    if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });
    const body = await request.json();
    const workingHours = normalizeWorkingHours(body.workingHours);
    for (const item of Object.values(workingHours)) {
      const [sh, sm] = item.start.split(":").map(Number); const [eh, em] = item.end.split(":").map(Number);
      if (item.open && sh * 60 + sm >= eh * 60 + em) return NextResponse.json({ ok: false, message: "Horário final precisa ser maior que o inicial" }, { status: 400 });
    }
    await auth.db.collection("businesses").updateOne({ _id: auth.businessId }, { $set: { workingHours, updatedAt: new Date() } });
    return NextResponse.json({ ok: true, message: "Horários salvos", workingHours });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "Erro ao salvar horários" }, { status: 500 });
  }
}
