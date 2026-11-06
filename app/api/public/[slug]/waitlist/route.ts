import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { verifyCustomerSessionToken } from "@/lib/auth";
import { hasSubscriptionAccess } from "@/lib/vellto-subscription-access";
import { getPublicBookingAvailability } from "@/lib/public-booking-availability";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Props) {
  try {
    const { slug } = await params;
    const token = (await cookies()).get("saas_customer_session")?.value;
    if (!token) return NextResponse.json({ ok: false, message: "Entre na sua conta para entrar na lista de espera." }, { status: 401 });

    const session = await verifyCustomerSessionToken(token);
    const customerId = String(session?.customerId || "");
    if (!ObjectId.isValid(customerId)) return NextResponse.json({ ok: false, message: "Sessão do cliente inválida." }, { status: 401 });

    const body = await request.json();
    const serviceIds: string[] = Array.isArray(body.serviceIds)
      ? Array.from(new Set<string>((body.serviceIds as unknown[])
          .map((value) => String(value).trim())
          .filter((value) => value.length > 0)))
      : [];
    const professionalId = String(body.professionalId || "");
    const preferredDate = String(body.date || "");
    if (!serviceIds.length || serviceIds.some((id: string) => !ObjectId.isValid(id))) {
      return NextResponse.json({ ok: false, message: "Selecione serviços válidos." }, { status: 400 });
    }
    if (!ObjectId.isValid(professionalId)) return NextResponse.json({ ok: false, message: "Profissional inválido." }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) return NextResponse.json({ ok: false, message: "Escolha uma data válida." }, { status: 400 });
    const dateParts = preferredDate.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2], 12));
    if (parsedDate.getUTCFullYear() !== dateParts[0] || parsedDate.getUTCMonth() !== dateParts[1] - 1 || parsedDate.getUTCDate() !== dateParts[2]) {
      return NextResponse.json({ ok: false, message: "A data escolhida não existe." }, { status: 400 });
    }
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    if (preferredDate < today) return NextResponse.json({ ok: false, message: "Não é possível entrar na lista para uma data que já passou." }, { status: 400 });

    const db = await getDb();
    const [business, customer] = await Promise.all([
      db.collection("businesses").findOne({ slug, active: { $ne: false } }),
      db.collection("customer_accounts").findOne({ _id: new ObjectId(customerId), active: { $ne: false } }),
    ]);
    if (!business || !customer) return NextResponse.json({ ok: false, message: "Empresa ou conta do cliente não encontrada." }, { status: 404 });
    if (!hasSubscriptionAccess(business as any)) return NextResponse.json({ ok: false, message: "Agendamentos temporariamente indisponíveis." }, { status: 403 });

    const tenantFilters = [{ businessId: business._id }, { businessId: business._id.toString() }, { businessSlug: slug }];
    const [services, professional] = await Promise.all([
      db.collection("services").find({ _id: { $in: serviceIds.map((id: string) => new ObjectId(id)) }, active: { $ne: false }, $or: tenantFilters } as any).toArray(),
      db.collection("professionals").findOne({ _id: new ObjectId(professionalId), active: { $ne: false }, $or: tenantFilters } as any),
    ]);
    if (services.length !== serviceIds.length || !professional) return NextResponse.json({ ok: false, message: "Serviço ou profissional não encontrado." }, { status: 404 });

    const allowedServices = Array.isArray(professional.serviceIds) ? professional.serviceIds.map(String) : [];
    if (allowedServices.length && !serviceIds.every((id: string) => allowedServices.includes(id))) {
      return NextResponse.json({ ok: false, message: "Este profissional não atende todos os serviços selecionados." }, { status: 409 });
    }

    const availability = await getPublicBookingAvailability(db, { slug, serviceIds, professionalId, date: preferredDate });
    if (availability.ok && Array.isArray(availability.slots) && availability.slots.length > 0) {
      return NextResponse.json({ ok: false, message: "Ainda existem horários disponíveis nesta data. Escolha um horário para reservar." }, { status: 409 });
    }

    const customerName = String(customer.name || "").trim();
    const customerPhone = String(customer.phone || "").trim();
    if (!customerName || customerPhone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ ok: false, message: "Complete seu nome e WhatsApp no perfil antes de entrar na lista." }, { status: 400 });
    }

    const collection = db.collection("appointmentWaitlist");
    const duplicate = await collection.findOne({
      businessId: business._id,
      clientId: new ObjectId(customerId),
      professionalId: new ObjectId(professionalId),
      preferredDate,
      status: "waiting",
    });
    if (duplicate) return NextResponse.json({ ok: true, alreadyListed: true, message: "Você já está na lista de espera para esta data." });

    await collection.insertOne({
      businessId: business._id,
      businessSlug: slug,
      clientId: new ObjectId(customerId),
      clientName: customerName,
      clientPhone: customerPhone,
      serviceIds: serviceIds.map((id: string) => new ObjectId(id)),
      serviceNames: services.map((service: any) => String(service.name || "Serviço")),
      professionalId: new ObjectId(professionalId),
      professionalName: String(professional.name || "Profissional"),
      preferredDate,
      status: "waiting",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ ok: true, message: "Você entrou na lista de espera. O estabelecimento poderá entrar em contato se surgir uma vaga." }, { status: 201 });
  } catch (error) {
    console.error("PUBLIC WAITLIST ERROR:", error);
    return NextResponse.json({ ok: false, message: "Não foi possível entrar na lista de espera." }, { status: 500 });
  }
}
