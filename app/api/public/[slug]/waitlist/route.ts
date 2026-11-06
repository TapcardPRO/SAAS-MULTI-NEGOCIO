import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { verifyCustomerSessionToken } from "@/lib/auth";

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
    const serviceIds = Array.isArray(body.serviceIds) ? [...new Set(body.serviceIds.map((id: unknown) => String(id).trim()).filter(Boolean))] : [];
    const professionalId = String(body.professionalId || "");
    const preferredDate = String(body.date || "");
    if (!serviceIds.length || serviceIds.some((id: string) => !ObjectId.isValid(id))) {
      return NextResponse.json({ ok: false, message: "Selecione serviços válidos." }, { status: 400 });
    }
    if (!ObjectId.isValid(professionalId)) return NextResponse.json({ ok: false, message: "Profissional inválido." }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) return NextResponse.json({ ok: false, message: "Escolha uma data válida." }, { status: 400 });

    const db = await getDb();
    const [business, customer] = await Promise.all([
      db.collection("businesses").findOne({ slug, active: { $ne: false } }),
      db.collection("customer_accounts").findOne({ _id: new ObjectId(customerId), active: { $ne: false } }),
    ]);
    if (!business || !customer) return NextResponse.json({ ok: false, message: "Empresa ou conta do cliente não encontrada." }, { status: 404 });

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
