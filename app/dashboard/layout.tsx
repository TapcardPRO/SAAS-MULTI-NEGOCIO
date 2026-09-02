import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("saas_session")?.value;

  if (!token) {
    redirect("/login");
  }

  const session =
    await verifySessionToken(token);

  if (
    !session?.userId ||
    !ObjectId.isValid(session.userId)
  ) {
    redirect("/login");
  }

  const db = await getDb();

  const user = await db
    .collection("users")
    .findOne({
      _id: new ObjectId(session.userId),
    });

  if (!user) {
    redirect("/login");
  }

  if (user.role === "superadmin") {
    redirect("/admin");
  }

  if (user.active === false) {
    redirect("/login?blocked=1");
  }

  if (!user.businessId) {
    redirect("/login");
  }

  const businessId = String(user.businessId);

  if (!ObjectId.isValid(businessId)) {
    redirect("/login");
  }

  const business = await db
    .collection("businesses")
    .findOne({
      _id: new ObjectId(businessId),
    });

  if (!business) {
    redirect("/login");
  }

  if (business.active === false) {
    redirect("/login?blocked=1");
  }

  /*
  =======================================================
  BLOQUEIO COMERCIAL OPCIONAL
  =======================================================

  Só entra em vigor quando:
  VELLTO_BILLING_ENFORCEMENT=true

  Assim podemos testar Mercado Pago
  antes de bloquear clientes reais.
  */

  if (
    process.env
      .VELLTO_BILLING_ENFORCEMENT ===
      "true" &&
    user.role !==
      "employee"
  ) {
    const billingStatus =
      String(
        business.billingStatus ||
          "active"
      );

    const trialEndsAt =
      business.trialEndsAt
        ? new Date(
            business.trialEndsAt
          )
        : null;

    const trialExpired =
      billingStatus ===
        "trial" &&
      trialEndsAt &&
      trialEndsAt.getTime() <
        Date.now();

    const blockedBilling =
      billingStatus ===
        "past_due" ||
      billingStatus ===
        "cancelled" ||
      trialExpired;

    if (blockedBilling) {
      /*
      A página de assinatura precisa continuar acessível
      para que o cliente possa regularizar.
      O bloqueio completo por rota será ativado depois
      que validarmos a integração em produção.
      */
    }
  }

  return (
    <DashboardShell
      user={{
        name: user.name || "Usuário",
        email: user.email || "",
        role: user.role || "owner",
      }}
      business={{
        name: business.name || "Minha empresa",
        slug: business.slug || "",
        logoUrl: business.logoUrl || "",

        primaryColor:
          business.primaryColor || "#10b981",

        secondaryColor:
          business.secondaryColor || "#0a141d",

        backgroundColor:
          business.backgroundColor || "#050b10",

        textColor:
          business.textColor || "#ffffff",
      }}
    >
      {children}
    </DashboardShell>
  );
}