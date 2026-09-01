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

  return (
    <DashboardShell
      user={{
        name: user.name || "Usuário",
        email: user.email || "",
      }}
      business={{
        name: business.name || "Minha empresa",
        slug: business.slug || "",
        logoUrl: business.logoUrl || "",
      }}
    >
      {children}
    </DashboardShell>
  );
}