import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSessionToken, hashPassword } from "@/lib/auth";
import { isPeriod } from "@/lib/vellto-onboarding";

export const dynamic = "force-dynamic";
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const responseError = (message: string, status: number) => NextResponse.json({ message }, { status });

export async function POST(request: Request) {
  if (process.env.VELLTO_PUBLIC_SIGNUP_ENABLED !== "true") return responseError("Cadastro público ainda não foi habilitado.", 503);
  try {
    const body = await request.json();
    const businessName = String(body.businessName || "").trim().slice(0, 100);
    const ownerName = String(body.ownerName || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
    const password = String(body.password || "");
    const category = String(body.category || "outros").trim().slice(0, 80);
    const whatsapp = String(body.whatsapp || "").replace(/[^0-9]/g, "").slice(0, 15);
    const period = body.period;
    const slug = slugify(businessName);
    if (!businessName || businessName.length < 3 || !slug || !ownerName || ownerName.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || password.length > 128 || !isPeriod(period))
      return responseError("Confira nome, e-mail, senha (mínimo de 10 caracteres) e plano.", 400);
    const db = await getDb();
    const [userExists, slugExists, plan] = await Promise.all([
      db.collection("users").findOne({ email }, { projection: { _id: 1 } }),
      db.collection("businesses").findOne({ slug }, { projection: { _id: 1 } }),
      db.collection("saas_plans").findOne({ active: { $ne: false } }, { sort: { price: 1 } }),
    ]);
    if (userExists) return responseError("Este e-mail já está cadastrado.", 409);
    if (slugExists) return responseError("Este nome de estabelecimento já está em uso. Tente um nome diferente.", 409);
    if (!plan?.slug) return responseError("Nenhum plano de recursos está configurado. Contate o suporte.", 503);
    const passwordHash = await hashPassword(password);
    const now = new Date();
    // Bloqueado até pagamento validado pelo Mercado Pago. Dashboard existente já nega business.active=false.
    const business = {
      name: businessName, slug, category, whatsapp, description: "", instagram: "", address: "",
      primaryColor: "#22c55e", secondaryColor: "#18181b", backgroundColor: "#09090b", textColor: "#ffffff",
      logoUrl: "", coverUrl: "", gallery: [], mainButtonText: "Agendar agora", mainButtonType: "booking", mainButtonUrl: "",
      servicesTitle: "Escolha o que você precisa", showProfessionals: true, showBookingSection: true,
      bookingSectionLabel: "Agendamento", bookingSectionTitle: "Escolha seu horário",
      bookingSectionDescription: "Escolha o serviço e encontre o melhor horário para você.",
      plan: String(plan.slug), selectedPeriod: period, active: false, signupSource: "public",
      billingStatus: "pending", trialStartedAt: null, trialEndsAt: null, subscriptionEndsAt: null,
      billingUpdatedAt: now, ownerUserId: null,
      workingHours: {
        sunday: { open: false, start: "09:00", end: "14:00" }, monday: { open: true, start: "09:00", end: "19:00" },
        tuesday: { open: true, start: "09:00", end: "19:00" }, wednesday: { open: true, start: "09:00", end: "19:00" },
        thursday: { open: true, start: "09:00", end: "19:00" }, friday: { open: true, start: "09:00", end: "19:00" },
        saturday: { open: true, start: "09:00", end: "18:00" },
      }, createdAt: now, updatedAt: now,
    };
    const inserted = await db.collection("businesses").insertOne(business);
    try {
      const userResult = await db.collection("users").insertOne({ name: ownerName, email, passwordHash, businessId: inserted.insertedId, role: "owner", active: true, createdAt: now, updatedAt: now });
      await db.collection("businesses").updateOne({ _id: inserted.insertedId }, { $set: { ownerUserId: userResult.insertedId } });
      const token = await createSessionToken(String(userResult.insertedId));
      const response = NextResponse.json({ ok: true, redirect: "/ativar" }, { status: 201 });
      response.cookies.set("saas_session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 604800 });
      return response;
    } catch (error) {
      await db.collection("businesses").deleteOne({ _id: inserted.insertedId });
      throw error;
    }
  } catch (error) {
    console.error("VELLTO REGISTER", error);
    return responseError("Não foi possível criar a conta. Tente novamente.", 500);
  }
}
