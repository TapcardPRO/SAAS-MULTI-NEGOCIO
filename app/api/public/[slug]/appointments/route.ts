import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { computeAvailability, getEligibleProfessionals, normalizePhone, toMinutes } from "@/lib/booking";

type Props = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Props) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const serviceId = String(body.serviceId || "");
    const requestedProfessionalId = String(body.professionalId || "any");
    const date = String(body.date || "");
    const time = String(body.time || "");
    const clientName = String(body.clientName || "").trim();
    const clientPhone = String(body.clientPhone || "").trim();
    const clientEmail = String(body.clientEmail || "").trim().toLowerCase();
    const notes = String(body.notes || "").trim();

    if (!ObjectId.isValid(serviceId) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || !clientName || normalizePhone(clientPhone).length < 10) {
      return NextResponse.json({ ok: false, message: "Preencha serviço, data, horário, nome e WhatsApp" }, { status: 400 });
    }

    const db = await getDb();
    const business = await db.collection("businesses").findOne({ slug, active: { $ne: false } });
    if (!business) return NextResponse.json({ ok: false, message: "Empresa indisponível" }, { status: 404 });

    const service = await db.collection("services").findOne({ _id: new ObjectId(serviceId), active: { $ne: false } });
    if (!service) return NextResponse.json({ ok: false, message: "Serviço inválido" }, { status: 404 });

    let professional: any = null;
    if (requestedProfessionalId !== "any") {
      if (!ObjectId.isValid(requestedProfessionalId)) return NextResponse.json({ ok: false, message: "Profissional inválido" }, { status: 400 });
      professional = await db.collection("professionals").findOne({ _id: new ObjectId(requestedProfessionalId), active: { $ne: false } });
      if (!professional) return NextResponse.json({ ok: false, message: "Profissional inválido" }, { status: 404 });
      const availability = await computeAvailability(db, { businessId: business._id, professionalId: professional._id, serviceId: service._id, date });
      if (!availability.slots.includes(time)) return NextResponse.json({ ok: false, message: "Esse horário não está mais disponível" }, { status: 409 });
    } else {
      const professionals = await getEligibleProfessionals(db, business._id, service._id);
      for (const candidate of professionals) {
        const availability = await computeAvailability(db, { businessId: business._id, professionalId: candidate._id, serviceId: service._id, date });
        if (availability.slots.includes(time)) {
          professional = candidate;
          break;
        }
      }
      if (!professional) return NextResponse.json({ ok: false, message: "Nenhum profissional disponível nesse horário" }, { status: 409 });
    }

    const phoneNorm = normalizePhone(clientPhone);
    let client = await db.collection("clients").findOne({ businessId: business._id, phoneNorm });
    const now = new Date();

    if (!client) {
      const result = await db.collection("clients").insertOne({
        businessId: business._id,
        name: clientName,
        phone: clientPhone,
        phoneNorm,
        email: clientEmail,
        notes: "",
        active: true,
        visitsCount: 0,
        totalSpent: 0,
        createdAt: now,
        updatedAt: now,
      });
      client = await db.collection("clients").findOne({ _id: result.insertedId });
    } else {
      await db.collection("clients").updateOne({ _id: client._id }, { $set: { name: clientName, phone: clientPhone, email: clientEmail || client.email || "", updatedAt: now } });
    }

    if (!client) throw new Error("Falha ao criar cliente");

    const duration = Math.max(5, Number(service.duration || 30));
    const startMinutes = toMinutes(time);
    const endMinutes = startMinutes + duration;

    const collision = await db.collection("appointments").findOne({
      businessId: business._id,
      professionalId: professional._id,
      date,
      status: { $in: ["pendente", "confirmado", "em_atendimento", "concluido"] },
      startMinutes: { $lt: endMinutes },
      endMinutes: { $gt: startMinutes },
    });

    if (collision) return NextResponse.json({ ok: false, message: "Esse horário acabou de ser reservado. Escolha outro." }, { status: 409 });

    const appointment = {
      businessId: business._id,
      clientId: client._id,
      clientName,
      clientPhone,
      clientEmail,
      serviceId: service._id,
      serviceName: service.name || "Serviço",
      price: Number(service.price || 0),
      duration,
      professionalId: professional._id,
      professionalName: professional.name || "Profissional",
      date,
      time,
      startMinutes,
      endMinutes,
      status: "pendente",
      notes,
      source: "public",
      createdAt: now,
      updatedAt: now,
    };

    const inserted = await db.collection("appointments").insertOne(appointment);
    return NextResponse.json({ ok: true, message: "Agendamento realizado com sucesso", appointment: { id: inserted.insertedId.toString(), ...appointment, businessId: business._id.toString(), clientId: client._id.toString(), serviceId: service._id.toString(), professionalId: professional._id.toString() } }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "Erro ao realizar agendamento" }, { status: 500 });
  }
}
