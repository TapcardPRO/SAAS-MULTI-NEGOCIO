import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export async function requireBusinessSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("saas_session")?.value;

  if (!token) {
    return { ok: false as const, status: 401, message: "Usuário não autenticado" };
  }

  const session = await verifySessionToken(token);
  if (!session?.userId || !ObjectId.isValid(session.userId)) {
    return { ok: false as const, status: 401, message: "Sessão inválida" };
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(session.userId) });

  if (!user || user.active === false) {
    return { ok: false as const, status: 403, message: "Acesso bloqueado" };
  }

  if (user.role === "superadmin") {
    return { ok: false as const, status: 403, message: "Acesso exclusivo da empresa" };
  }

  if (!user.businessId || !ObjectId.isValid(String(user.businessId))) {
    return { ok: false as const, status: 403, message: "Empresa não vinculada" };
  }

  const businessId = new ObjectId(String(user.businessId));
  const business = await db.collection("businesses").findOne({ _id: businessId });

  if (!business || business.active === false) {
    return { ok: false as const, status: 403, message: "Empresa bloqueada" };
  }

  return { ok: true as const, db, user, business, businessId };
}


export async function requireOwnerSession() {
  const auth = await requireBusinessSession();

  if (!auth.ok) {
    return auth;
  }

  if (auth.user.role === "employee") {
    return {
      ok: false as const,
      status: 403,
      message: "Acesso exclusivo do proprietário",
    };
  }

  return auth;
}
